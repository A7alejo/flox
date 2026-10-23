// Refleja backend/src/routes/caja.routes.js
// `monto` llega como string (NUMERIC de Postgres): se normaliza a number.
import { request } from './client';

function toMovimiento(row) {
  return {
    id: row.id,
    tipo: row.tipo, // 'ingreso' | 'egreso'
    concepto: row.concepto,
    monto: Number(row.monto),
    medioPago: row.medio_pago, // 'efectivo' | 'personal_pay' | null (solo egresos)
    productoId: row.producto_id,
    productoNombre: row.producto_nombre ?? null, // viene del JOIN en el listado
    cantidadVendida: row.cantidad_vendida,
    envioId: row.envio_id,
    ventaId: row.venta_id ?? null, // ventas nuevas (varios productos / pendientes)
    clienteNombre: row.cliente_nombre ?? null, // de la venta, si se cargó
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

function toVenta(row) {
  return {
    id: row.id,
    estado: row.estado, // 'pendiente' | 'pagada'
    clienteNombre: row.cliente_nombre,
    total: Number(row.total),
    medioPago: row.medio_pago, // null mientras está pendiente
    fechaCreacion: row.fecha_creacion,
    fechaPago: row.fecha_pago,
    productos: (row.productos || []).map((p) => ({
      productoId: p.producto_id ?? p.productoId,
      nombre: p.producto_nombre ?? p.nombre,
      cantidad: p.cantidad,
      precioUnitario: Number(p.precio_unitario ?? p.precioUnitario),
    })),
  };
}

// POST /caja/ventas  { items: [{ productoId, cantidad }], estado, medioPago?, clienteNombre? }
// -> { venta, movimiento (null si quedó pendiente), stock: [{ productoId, nombre, stockRestante }] }.
// El total lo calcula el backend con el precio_venta vigente. medioPago solo si estado = 'pagada'.
// Errores esperables: 409 stock insuficiente, 404 producto inexistente/inactivo.
export async function registrarVenta({ items, estado, medioPago, clienteNombre }) {
  const data = await request('/caja/ventas', {
    method: 'POST',
    body: { items, estado, medioPago, clienteNombre },
  });
  return {
    venta: toVenta(data.venta),
    movimiento: data.movimiento ? toMovimiento(data.movimiento) : null,
    stock: data.stock,
  };
}

// GET /caja/ventas?estado=pendiente|pagada
export async function listarVentas({ estado } = {}) {
  const rows = await request('/caja/ventas', { params: { estado } });
  return rows.map(toVenta);
}

// POST /caja/ventas/:id/cobrar  { medioPago } -> { venta, movimiento }. 409 si ya estaba cobrada.
export async function cobrarVenta(id, medioPago) {
  const data = await request(`/caja/ventas/${id}/cobrar`, { method: 'POST', body: { medioPago } });
  return { venta: toVenta(data.venta), movimiento: toMovimiento(data.movimiento) };
}

// POST /caja/egresos  { monto, concepto, medioPago?, envioId? } -> movimiento
export async function registrarEgreso({ monto, concepto, medioPago, envioId }) {
  const row = await request('/caja/egresos', {
    method: 'POST',
    body: { monto, concepto, medioPago, envioId },
  });
  return toMovimiento(row);
}
