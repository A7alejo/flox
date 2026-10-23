// Refleja backend/src/routes/admin.routes.js (solo rol admin; el backend responde 403 si no)
import { request } from './client';

function toUsuario(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol, // 'admin' | 'operador'
    activo: row.activo,
    fechaCreacion: row.fecha_creacion, // ISO 8601
  };
}

// GET /admin/usuarios
export async function listarUsuarios() {
  const rows = await request('/admin/usuarios');
  return rows.map(toUsuario);
}

// POST /admin/usuarios  { nombre, email, password, rol }
export async function crearUsuario({ nombre, email, password, rol }) {
  return toUsuario(await request('/admin/usuarios', { method: 'POST', body: { nombre, email, password, rol } }));
}

// PUT /admin/usuarios/:id  { nombre, email, rol }
export async function actualizarUsuario(id, { nombre, email, rol }) {
  return toUsuario(await request(`/admin/usuarios/${id}`, { method: 'PUT', body: { nombre, email, rol } }));
}

// PUT /admin/usuarios/:id/password  { password } -> 204
export function resetearPassword(id, password) {
  return request(`/admin/usuarios/${id}/password`, { method: 'PUT', body: { password } });
}

// PATCH /admin/usuarios/:id/estado  { activo }
export async function cambiarEstado(id, activo) {
  return toUsuario(await request(`/admin/usuarios/${id}/estado`, { method: 'PATCH', body: { activo } }));
}

// DELETE /admin/usuarios/:id -> 204
export function eliminarUsuario(id) {
  return request(`/admin/usuarios/${id}`, { method: 'DELETE' });
}
