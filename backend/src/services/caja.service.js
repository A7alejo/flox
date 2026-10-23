// =====================================================================
// Servicio de Caja. `registrarVenta` es la operación más sensible del
// sistema: debe descontar stock (y, si ya está cobrada, insertar el ingreso) como una sola
// unidad atómica. Si cualquiera de los dos pasos falla, ninguno debe
// quedar aplicado (withTransaction hace BEGIN/COMMIT/ROLLBACK).
// =====================================================================
const { withTransaction } = require('../config/db');
const productosRepo = require('../repositories/productos.repository');
const cajaRepo = require('../repositories/caja.repository');
const enviosRepo = require('../repositories/envios.repository');
const ventasRepo = require('../repositories/ventas.repository');
const HttpError = require('../utils/HttpError');

// Solo efectivo y Personal Pay (Transferencia se quitó: no la usan).
const MEDIOS_PAGO_VALIDOS = ['efectivo', 'personal_pay'];

const ESTADOS_VENTA = ['pagada', 'pendiente'];

// Si todavía no se aplicó 002_ventas.sql, Postgres responde "relation does
// not exist" (42P01): lo traducimos a un mensaje claro en vez de un 500.
async function conMigracionVentas(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === '42P01' || err.code === '42703') {
      throw new HttpError(503, 'Falta aplicar la migración de ventas (002_ventas.sql) en la base de datos');
    }
    throw err;
  }
}

function validarMedioPago(medioPago) {
  if (!MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    throw new HttpError(400, `medioPago inválido. Valores permitidos: ${MEDIOS_PAGO_VALIDOS.join(', ')}`);
  }
}

// Normaliza los productos de la venta: acepta `items` [{ productoId, cantidad }]
// o el formato viejo { productoId, cantidad } (una sola línea). Suma repetidos.
function normalizarItems({ items, productoId, cantidad }) {
  const lista = Array.isArray(items) ? items : productoId ? [{ productoId, cantidad }] : [];
  if (lista.length === 0) throw new HttpError(400, 'La venta tiene que tener al menos un producto');

  const porProducto = new Map();
  for (const item of lista) {
    const id = Number(item?.productoId);
    const cant = Number(item?.cantidad);
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new HttpError(400, 'productoId inválido');
    if (!Number.isInteger(cant) || cant <= 0) throw new HttpError(400, 'La cantidad debe ser un entero mayor a 0');
    porProducto.set(id, (porProducto.get(id) || 0) + cant);
  }
  // Orden por id: si dos ventas bloquean los mismos productos, lo hacen en el
  // mismo orden y no se traban entre sí (deadlock).
  return [...porProducto.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, cant]) => ({ productoId: id, cantidad: cant }));
}

// Texto del ingreso en caja, ej: "Venta: Jabón x2, Aromatizante x1".
// Mismo formato que las ventas viejas. El cliente y el detalle se ven al abrir
// la venta (la relación queda en venta_id). Se recorta a 255 (largo de concepto).
function conceptoVenta(lineas) {
  const texto = 'Venta: ' + lineas.map((l) => `${l.nombre} x${l.cantidad}`).join(', ');
  return texto.length > 255 ? texto.slice(0, 252) + '...' : texto;
}

async function registrarVenta({ items, productoId, cantidad, medioPago, estado = 'pagada', clienteNombre }) {
  if (!ESTADOS_VENTA.includes(estado)) {
    throw new HttpError(400, `estado inválido. Valores permitidos: ${ESTADOS_VENTA.join(', ')}`);
  }
  // El medio de cobro se elige al cobrar: obligatorio solo si ya está pagada.
  if (estado === 'pagada') validarMedioPago(medioPago);
  const cliente = typeof clienteNombre === 'string' ? clienteNombre.trim().slice(0, 150) : '';
  const lineasPedidas = normalizarItems({ items, productoId, cantidad });

  return conMigracionVentas(() => withTransaction(async (client) => {
    // 1. Bloqueamos cada producto (FOR UPDATE) para que dos ventas simultáneas
    //    del mismo producto no se pisen el descuento de stock.
    const lineas = [];
    for (const { productoId: id, cantidad: cant } of lineasPedidas) {
      const producto = await productosRepo.getByIdForUpdate(id, client);
      if (!producto || !producto.activo) throw new HttpError(404, `Producto no encontrado (id ${id})`);
      if (producto.stock_actual < cant) {
        throw new HttpError(409, `Stock insuficiente de ${producto.nombre}. Disponible: ${producto.stock_actual}`);
      }
      lineas.push({ productoId: id, cantidad: cant, nombre: producto.nombre, precioUnitario: Number(producto.precio_venta) });
    }

    // 2. Cabecera + detalle, con el precio vigente "congelado".
    const total = Math.round(lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0) * 100) / 100;
    if (total <= 0) throw new HttpError(400, 'El total de la venta tiene que ser mayor a 0');
    const venta = await ventasRepo.crear(
      { estado, clienteNombre: cliente, total, medioPago: estado === 'pagada' ? medioPago : null },
      client
    );

    // 3. Detalle y descuento de stock (en los dos estados: la mercadería ya salió).
    const stock = [];
    for (const l of lineas) {
      await ventasRepo.agregarDetalle(venta.id, l, client);
      const { stock_actual: restante } = await productosRepo.descontarStock(l.productoId, l.cantidad, client);
      stock.push({ productoId: l.productoId, nombre: l.nombre, stockRestante: restante });
    }

    // 4. La plata entra a caja solo si ya la cobraron.
    let movimiento = null;
    if (estado === 'pagada') {
      movimiento = await cajaRepo.crearMovimiento(
        { tipo: 'ingreso', concepto: conceptoVenta(lineas), monto: total, medioPago, ventaId: venta.id },
        client
      );
    }

    // Cualquier error de acá hasta el COMMIT deshace todo (stock incluido).
    return { venta: { ...venta, productos: lineas }, movimiento, stock };
  }));
}

// Pasa una venta pendiente a pagada y recién ahí registra el ingreso en caja.
async function cobrarVenta(id, { medioPago }) {
  if (!/^\d+$/.test(String(id)) || Number(id) < 1 || Number(id) > 2147483647) {
    throw new HttpError(400, 'Id de venta inválido');
  }
  validarMedioPago(medioPago);

  return conMigracionVentas(() => withTransaction(async (client) => {
    // FOR UPDATE: si se toca "cobrar" dos veces seguidas, la segunda ve 'pagada'.
    const venta = await ventasRepo.getByIdForUpdate(Number(id), client);
    if (!venta) throw new HttpError(404, 'Venta no encontrada');
    if (venta.estado === 'pagada') throw new HttpError(409, 'Esta venta ya está cobrada');

    const pagada = await ventasRepo.marcarPagada(venta.id, medioPago, client);
    const [completa] = await ventasRepo.listar({ ids: [venta.id] }, client);
    const lineas = completa.productos.map((p) => ({ nombre: p.producto_nombre, cantidad: p.cantidad }));
    const movimiento = await cajaRepo.crearMovimiento(
      {
        tipo: 'ingreso',
        concepto: conceptoVenta(lineas),
        monto: Number(venta.total),
        medioPago,
        ventaId: venta.id,
      },
      client
    );
    return { venta: { ...pagada, productos: completa.productos }, movimiento };
  }));
}

async function listarVentas({ estado } = {}) {
  if (estado && !ESTADOS_VENTA.includes(estado)) {
    throw new HttpError(400, `estado inválido. Valores permitidos: ${ESTADOS_VENTA.join(', ')}`);
  }
  return conMigracionVentas(() => ventasRepo.listar({ estado }));
}

async function registrarEgreso({ monto, concepto, medioPago, envioId }) {
  if (!monto || monto <= 0) throw new HttpError(400, 'El monto debe ser mayor a 0');
  if (!concepto || !concepto.trim()) throw new HttpError(400, 'El concepto es obligatorio');
  if (medioPago && !MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    throw new HttpError(400, `medioPago inválido. Valores permitidos: ${MEDIOS_PAGO_VALIDOS.join(', ')}`);
  }
  // Si el egreso se asocia a un envío, verificamos que exista para no
  // terminar en un 500 por la foreign key de movimientos_caja.
  if (envioId) {
    // Un id no entero haría fallar el cast de Postgres (500): lo cortamos antes.
    // (se acepta número o string de dígitos, dentro del rango de INTEGER)
    if (!/^\d+$/.test(String(envioId)) || Number(envioId) > 2147483647) {
      throw new HttpError(400, 'envioId inválido');
    }
    const envio = await enviosRepo.getById(envioId);
    if (!envio) throw new HttpError(404, 'Envío no encontrado');
  }

  return cajaRepo.crearMovimiento({
    tipo: 'egreso',
    concepto,
    monto,
    medioPago,
    envioId,
  });
}

async function listarMovimientos(filtros) {
  return cajaRepo.listarMovimientos(filtros);
}

async function getBalance(rango) {
  return cajaRepo.getBalance(rango);
}

module.exports = { registrarVenta, cobrarVenta, listarVentas, registrarEgreso, listarMovimientos, getBalance };
