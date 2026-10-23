// =====================================================================
// Cliente HTTP único de la app. Ningún componente hace fetch directo:
// todo pasa por `request` (o por las funciones de api/*.js que lo usan).
//
// - La sesión viaja en una cookie httpOnly: por eso SIEMPRE se manda
//   `credentials: 'include'`. El frontend nunca ve ni guarda el token.
// - El backend responde errores como { error: { message } }; acá se
//   convierten en un ApiError con ese mensaje, listo para mostrar.
// =====================================================================

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = no hubo respuesta (sin conexión / CORS / servidor caído)
  }
}

// El AuthProvider registra acá qué hacer ante un 401 (limpiar el usuario
// y mostrar el login). Así client.js no depende de React ni del router.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    qs.append(key, String(value));
  }
  const str = qs.toString();
  return str ? '?' + str : '';
}

/**
 * @param {string} path  Ruta relativa a VITE_API_URL, ej: '/productos'
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {object} [opts.body]      Se envía como JSON
 * @param {object} [opts.params]    Query string; ignora undefined/null/''
 * @param {boolean} [opts.redirectOn401=true]
 *        En false, un 401 NO dispara el redirect al login. Se usa donde el
 *        401 es una respuesta esperada y no "sesión vencida": login
 *        (credenciales inválidas), GET /auth/me (chequeo inicial) y
 *        PUT /auth/password (contraseña actual incorrecta).
 * @returns {Promise<any>} JSON de la respuesta, o null si fue 204.
 */
export async function request(path, { method = 'GET', body, params, redirectOn401 = true } = {}) {
  const hasBody = body !== undefined;

  let res;
  try {
    res = await fetch(BASE_URL + path + buildQuery(params), {
      method,
      credentials: 'include',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisá tu conexión.', 0);
  }

  // logout, cambio de contraseña, DELETE: el backend responde 204 sin body.
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && redirectOn401 && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.error?.message || `Error inesperado (${res.status})`, res.status);
  }

  return data;
}
