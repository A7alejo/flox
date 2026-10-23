// Refleja backend/src/routes/envios.routes.js
import { request } from './client';

function toEnvio(row) {
  return {
    id: row.id,
    clienteNombre: row.cliente_nombre,
    direccion: row.direccion,
    estado: row.estado, // 'en_preparacion' | 'listo_despacho' | 'entregado'
    notas: row.notas,
    fechaCreacion: row.fecha_creacion, // ISO 8601
    // Solo presente en el detalle (GET /envios/:id); el listado NO lo incluye.
    productos: row.productos?.map((d) => ({
      id: d.id,
      productoId: d.producto_id,
      productoNombre: d.producto_nombre,
      cantidad: d.cantidad,
    })),
  };
}

// GET /envios?estado
export async function listar({ estado } = {}) {
  const rows = await request('/envios', { params: { estado } });
  return rows.map(toEnvio);
}

// GET /envios/:id  (incluye `productos`)
export async function obtener(id) {
  return toEnvio(await request(`/envios/${id}`));
}

// POST /envios  { clienteNombre, direccion?, notas?, productos: [{ productoId, cantidad }] }
// Devuelve el envío creado SIN `productos` (el backend no los devuelve en el INSERT).
export async function crear({ clienteNombre, direccion, notas, productos }) {
  return toEnvio(
    await request('/envios', { method: 'POST', body: { clienteNombre, direccion, notas, productos } })
  );
}

// PUT /envios/:id/estado  { estado }
export async function actualizarEstado(id, estado) {
  return toEnvio(await request(`/envios/${id}/estado`, { method: 'PUT', body: { estado } }));
}

// DELETE /envios/:id -> 204
export function eliminar(id) {
  return request(`/envios/${id}`, { method: 'DELETE' });
}
