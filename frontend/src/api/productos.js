// Refleja backend/src/routes/productos.routes.js
//
// La API devuelve columnas en snake_case y los NUMERIC de Postgres
// (costo_base, precio_venta, ...) como STRING, porque `pg` no los parsea.
// `toProducto` los normaliza a camelCase + number para que los
// componentes nunca vean ese detalle. El input va en camelCase, tal como
// lo espera el controller.
import { request } from './client';

export function toProducto(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo,
    costoBase: Number(row.costo_base),
    porcentajeMargen: Number(row.porcentaje_margen),
    precioVenta: Number(row.precio_venta), // columna GENERATED: solo lectura
    activo: row.activo,
  };
}

// GET /productos?search&categoria&incluirInactivos
export async function listar({ search, categoria, incluirInactivos } = {}) {
  const rows = await request('/productos', {
    params: { search, categoria, incluirInactivos: incluirInactivos ? 'true' : undefined },
  });
  return rows.map(toProducto);
}

// GET /productos/:id
export async function obtener(id) {
  return toProducto(await request(`/productos/${id}`));
}

// GET /productos/calcular-precio?costoBase&porcentajeMargen -> number
// Solo para el preview del formulario; el precio real lo calcula Postgres al guardar.
export async function calcularPrecio(costoBase, porcentajeMargen) {
  const data = await request('/productos/calcular-precio', { params: { costoBase, porcentajeMargen } });
  return data.precioVenta;
}

// POST /productos  { nombre, categoria?, stockActual?, stockMinimo?, costoBase, porcentajeMargen? }
export async function crear(datos) {
  return toProducto(await request('/productos', { method: 'POST', body: datos }));
}

// PUT /productos/:id  (campos parciales: lo que no se manda no se modifica)
export async function actualizar(id, datos) {
  return toProducto(await request(`/productos/${id}`, { method: 'PUT', body: datos }));
}

// DELETE /productos/:id -> 204. Baja lógica (activo = false).
export function darDeBaja(id) {
  return request(`/productos/${id}`, { method: 'DELETE' });
}
