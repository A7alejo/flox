// =====================================================================
// Servicio de Productos: validaciones + reglas de negocio.
// El cálculo de precio_venta lo hace Postgres (columna GENERATED en el
// schema), así que nunca puede desincronizarse de costo_base / margen
// aunque el registro se edite directo en la base. `calcularPrecioVenta`
// se usa solo para previsualizar el precio en el formulario ANTES de
// guardar (ej. mientras el usuario escribe costo y margen).
// =====================================================================
const { withTransaction } = require('../config/db');
const productosRepo = require('../repositories/productos.repository');
const HttpError = require('../utils/HttpError');

function calcularPrecioVenta(costoBase, porcentajeMargen) {
  return Math.round(costoBase * (1 + porcentajeMargen / 100) * 100) / 100;
}

function validarDatosProducto({ nombre, costoBase, porcentajeMargen }, esCreacion) {
  if (esCreacion && (!nombre || !nombre.trim())) {
    throw new HttpError(400, 'El nombre del producto es obligatorio');
  }
  if (esCreacion && (costoBase === undefined || costoBase === null)) {
    throw new HttpError(400, 'El costo base es obligatorio');
  }
  if (costoBase !== undefined && costoBase !== null && costoBase < 0) {
    throw new HttpError(400, 'El costo base no puede ser negativo');
  }
  if (porcentajeMargen !== undefined && porcentajeMargen !== null && porcentajeMargen < 0) {
    throw new HttpError(400, 'El porcentaje de margen no puede ser negativo');
  }
}

// Código de barras: opcional. '' o null lo borra; undefined no lo cambia.
// Mismo formato que el CHECK de la base (migración 005).
function normalizarCodigoBarras(valor) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  const codigo = String(valor).trim();
  if (!codigo) return null;
  if (!/^[0-9A-Za-z-]{4,32}$/.test(codigo)) {
    throw new HttpError(400, 'El código de barras solo puede tener números y letras (entre 4 y 32)');
  }
  return codigo;
}

async function listar(filtros) {
  return productosRepo.listar(filtros);
}

async function obtener(id) {
  const producto = await productosRepo.getById(id);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  return producto;
}

async function crear(datos) {
  validarDatosProducto(datos, true);
  return productosRepo.crear({ ...datos, codigoBarras: normalizarCodigoBarras(datos.codigoBarras) });
}

async function actualizar(id, datos) {
  validarDatosProducto(datos, false);
  const actualizado = await productosRepo.actualizar(id, { ...datos, codigoBarras: normalizarCodigoBarras(datos.codigoBarras) });
  if (!actualizado) throw new HttpError(404, 'Producto no encontrado');
  return actualizado;
}

async function darDeBaja(id) {
  const resultado = await productosRepo.darDeBaja(id);
  if (!resultado) throw new HttpError(404, 'Producto no encontrado');
  return resultado;
}

// Borrado definitivo: solo si el producto nunca se usó. Si tiene ventas,
// envíos o movimientos, se rechaza (409) para no romper el historial:
// en ese caso corresponde "Dar de baja".
const MSG_CON_HISTORIAL = 'Este producto tiene ventas o envíos registrados. Usá "Dar de baja" para ocultarlo.';

async function eliminar(id) {
  if (!/^\d+$/.test(String(id)) || Number(id) < 1 || Number(id) > 2147483647) {
    throw new HttpError(400, 'Id de producto inválido');
  }
  try {
    return await withTransaction(async (client) => {
      // FOR UPDATE: una venta en curso del mismo producto espera a que esto termine.
      const producto = await productosRepo.getByIdForUpdate(Number(id), client);
      if (!producto) throw new HttpError(404, 'Producto no encontrado');
      if (await productosRepo.tieneHistorial(producto.id, client)) {
        throw new HttpError(409, MSG_CON_HISTORIAL);
      }
      await productosRepo.eliminar(producto.id, client);
    });
  } catch (err) {
    // Por si igual quedó referenciado (FK RESTRICT de envio_detalle / venta_detalle)
    if (err.code === '23503') throw new HttpError(409, MSG_CON_HISTORIAL);
    throw err;
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  darDeBaja,
  eliminar,
  calcularPrecioVenta,
};
