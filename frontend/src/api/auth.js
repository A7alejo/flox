// Refleja backend/src/routes/auth.routes.js
import { request, setCsrfToken } from './client';

// POST /auth/login -> { usuario }. Setea la cookie httpOnly; el token no llega al frontend.
// Un 401 acá significa "credenciales inválidas", no "sesión vencida".
export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    redirectOn401: false,
  });
  setCsrfToken(data.csrfToken);
  return data.usuario;
}

// POST /auth/logout -> 204
export async function logout() {
  try {
    return await request('/auth/logout', { method: 'POST', redirectOn401: false });
  } finally {
    setCsrfToken(null);
  }
}

// GET /auth/me -> usuario | null. Se llama al arrancar la app: un 401 es
// el caso normal "todavía no hay sesión", así que devuelve null en vez de lanzar.
export async function me() {
  try {
    const data = await request('/auth/me', { redirectOn401: false });
    setCsrfToken(data.csrfToken);
    return data.usuario;
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

// PUT /auth/password -> 204. El 401 acá es "contraseña actual incorrecta".
export function cambiarPassword(passwordActual, passwordNueva) {
  return request('/auth/password', {
    method: 'PUT',
    body: { passwordActual, passwordNueva },
    redirectOn401: false,
  });
}
