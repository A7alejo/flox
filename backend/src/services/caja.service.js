// =====================================================================
// Servicio de Caja. `registrarVenta` es la operación más sensible del
// sistema: debe descontar stock E insertar el ingreso como una sola
// unidad atómica. Si cualquiera de los dos pasos falla, ninguno debe
// quedar aplicado (withTransaction hace BEGIN/COMMIT/ROLLBACK).
// =====================================================================
const { withTransaction } = require('../config/db');
const productosRepo = require('../repositories/productos.repository');
const cajaRepo = require('../repositories/caja.repository');
const enviosRepo = require('../repositories/envios.repository');
const HttpError = require('../utils/HttpError');

const MEDIOS_PAGO_VALIDOS = ['efectivo', 'personal_pay', 'transferencia'];

async function registrarVenta({ productoId, cantidad, medioPago }) {
  if (!productoId) throw new HttpError(400, 'productoId es obligatorio');
  if (!cantidad || cantidad <= 0) throw new HttpError(400, 'La cantidad debe ser mayor a 0');
  if (!MEDIOS_PAGO_VALIDOS.includes(medioPago)) {
    throw new HttpError(400, `medioPago inválido. Valores permitidos: ${MEDIOS_PAGO_VALIDOS.join(', ')}`);
  }

  return withTransaction(async (client) => {
    // 1. Bloqueamos la fila del producto (FOR UPDATE) para que si las
    //    dos personas registran una venta del mismo producto al mismo
    //    tiempo, la segunda espera a que termine la primera transacción
    //    en vez de pisarle el descuento de stock.
    const producto = await productosRepo.getByIdForUpdate(productoId, client);
    if (!producto || !producto.activo) {
      throw new HttpError(404, 'Producto no encontrado');
    }
    if (producto.stock_actual < cantidad) {
      throw new HttpError(409, `Stock insuficiente. Disponible: ${producto.stock_actual}`);
    }

    // 2. Descontamos stock.
    const { stock_actual: stockRestante } = await productosRepo.descontarStock(
      productoId,
      cantidad,
      client
    );

    // 3. Registramos el ingreso en caja, usando el precio_venta vigente
    //    del producto en el momento de la venta (queda "congelado" en
    //    el monto del movimiento aunque después cambie el precio).
    const monto = Number(producto.precio_venta) * cantidad;
    const movimiento = await cajaRepo.crearMovimiento(
      {
        tipo: 'ingreso',
        concepto: `Venta: ${producto.nombre} x${cantidad}`,
        monto,
        medioPago,
        productoId,
        cantidadVendida: cantidad,
      },
      client
    );

    // Si algo de acá en adelante tirara una excepción, withTransaction
    // haría ROLLBACK y el descuento de stock de arriba se deshace solo.
    return { movimiento, stockRestante };
  });
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

module.exports = { registrarVenta, registrarEgreso, listarMovimientos, getBalance };
