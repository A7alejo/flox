// Refleja backend/src/routes/caja.routes.js
// `monto` llega como string (NUMERIC de Postgres): se normaliza a number.
import { request } from './client';

function toMovimiento(row) {
  return {
    id: row.id,
    tipo: row.tipo, // 'ingreso' | 'egreso'
    concepto: row.concepto,
    monto: Number(row.monto),
    medioPago: row.medio_pago, // 'efectivo' | 'personal_pay' | 'transferencia' | null (solo egresos)
    productoId: row.producto_id,
    productoNombre: row.producto_nombre ?? null, // viene del JOIN en el listado
    cantidadVendida: row.cantidad_vendida,
    envioId: row.envio_id,
    fecha: row.fecha, // ISO 8601
  };
}

// GET /caja/movimientos?tipo&medioPago&desde&hasta&limit&offset  (default limit 50, más recientes primero)
export async function listarMovimientos(filtros = {}) {
  const rows = await request('/caja/movimientos', { params: filtros });
  return rows.map(toMovimiento);
}

// GET /caja/balance?desde&hasta -> { totalIngresos, totalEgresos, balance }
export function getBalance(rango = {}) {
  return request('/caja/balance', { params: rango });
}

// POST /caja/ventas  { productoId, cantidad, medioPago }
// -> { movimiento, stockRestante }. El monto lo calcula el backend con el precio_venta vigente.
// Errores esperables: 409 stock insuficiente, 404 producto inexistente/inactivo.
export async function registrarVenta({ productoId, cantidad, medioPago }) {
  const data = await request('/caja/ventas', {
    method: 'POST',
    body: { productoId, cantidad, medioPago },
  });
  return { movimiento: toMovimiento(data.movimiento), stockRestante: data.stockRestante };
}

// POST /caja/egresos  { monto, concepto, medioPago?, envioId? } -> movimiento
export async function registrarEgreso({ monto, concepto, medioPago, envioId }) {
  const row = await request('/caja/egresos', {
    method: 'POST',
    body: { monto, concepto, medioPago, envioId },
  });
  return toMovimiento(row);
}
