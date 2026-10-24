// =====================================================================
// Protección CSRF con "doble envío" (mismo esquema que hogarGestion).
// La cookie de sesión viaja sola en cada pedido (en producción va con
// SameSite=None porque frontend y backend están en dominios distintos),
// así que otra página podría armar un pedido con la sesión de alguien.
// Para evitarlo, al iniciar sesión (y en GET /auth/me) el backend entrega
// un token aleatorio: va en la cookie flox_csrf y en el body. El frontend
// lo guarda en memoria y lo manda en el encabezado X-CSRF-Token en cada
// POST/PUT/PATCH/DELETE. Una página ajena no puede leer ese valor, así
// que sus pedidos no traen el encabezado correcto y reciben 403.
// =====================================================================
const crypto = require('crypto');
const { COOKIE_MAX_AGE_MS } = require('../utils/jwt');

const CSRF_COOKIE = 'flox_csrf';
const SESSION_COOKIE = process.env.COOKIE_NAME || 'flox_token';
const EN_PRODUCCION = process.env.NODE_ENV === 'production';
const METODOS_QUE_MODIFICAN = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Sin sesión todavía (login) o cerrándola (logout): no hay nada que proteger.
const RUTAS_EXCLUIDAS = ['/api/auth/login', '/api/auth/logout'];

function emitirCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // el valor que usa el frontend viene en el body; esto es solo el "doble"
    secure: EN_PRODUCCION,
    sameSite: EN_PRODUCCION ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
  return token;
}

function borrarCsrfToken(res) {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

function tokensIguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function validarCsrf(req, res, next) {
  if (!METODOS_QUE_MODIFICAN.includes(req.method)) return next();
  if (RUTAS_EXCLUIDAS.includes(req.path)) return next();
  // Sin cookie de sesión el pedido no está autenticado: requireAuth lo corta con 401.
  if (!req.cookies?.[SESSION_COOKIE]) return next();

  if (!tokensIguales(req.cookies[CSRF_COOKIE], req.get('x-csrf-token'))) {
    return res.status(403).json({ error: { message: 'No se pudo validar el pedido. Recargá la página.' } });
  }
  next();
}

module.exports = { validarCsrf, emitirCsrfToken, borrarCsrfToken };
