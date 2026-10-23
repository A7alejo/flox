// Refleja backend/src/routes/dashboard.routes.js
// Los totales ya vienen como number desde el backend (hace Number() en el repository).
import { request } from './client';

function toStockCritico(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo,
  };
}

// GET /dashboard/resumen
// -> { totalIngresos, totalEgresos, balance, unidadesEnStock, productosActivos,
//      alertasStock[], mensual: { actual: {ingresos, egresos}, anterior: {ingresos, egresos} } }
// Los totales sueltos son históricos (toda la tabla); `mensual` es lo que alimenta
// "Ingresos/Egresos del mes" y los deltas "vs. mes anterior".
export async function getResumen() {
  const data = await request('/dashboard/resumen');
  return { ...data, alertasStock: data.alertasStock.map(toStockCritico) };
}

// GET /dashboard/ingresos-egresos?dias=7 -> [{ dia: 'YYYY-MM-DD', ingresos, egresos }]
// Serie DIARIA con los días sin movimientos rellenos en 0.
export function getEvolucion(dias = 7) {
  return request('/dashboard/ingresos-egresos', { params: { dias } });
}

// GET /dashboard/medios-pago?desde&hasta -> [{ medioPago, total, cantidad }]  (solo ingresos)
export function getMediosPago(rango = {}) {
  return request('/dashboard/medios-pago', { params: rango });
}

// GET /dashboard/top-productos?limite=5&desde&hasta -> [{ id, nombre, unidades }]
export function getTopProductos({ limite = 5, desde, hasta } = {}) {
  return request('/dashboard/top-productos', { params: { limite, desde, hasta } });
}

// GET /dashboard/stock-critico -> productos con stock_actual <= stock_minimo (más críticos primero)
export async function getStockCritico() {
  const rows = await request('/dashboard/stock-critico');
  return rows.map(toStockCritico);
}
