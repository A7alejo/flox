// =====================================================================
// Firma y verificación de JWT. Un solo lugar para no repetir la lógica
// entre el login y el middleware que protege las rutas.
// =====================================================================
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!SECRET) {
  // Fail fast: preferimos que el servidor no arranque a que arranque
  // firmando tokens con un secreto vacío/adivinable.
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

// Duración de la cookie (ms) sacada del propio JWT_EXPIRES_IN, para que la
// cookie y el token venzan siempre juntos sin tener que sincronizarlos a mano.
const { iat, exp } = jwt.decode(jwt.sign({}, SECRET, { expiresIn: EXPIRES_IN }));
const COOKIE_MAX_AGE_MS = (exp - iat) * 1000;

function firmarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verificarToken(token) {
  return jwt.verify(token, SECRET); // tira si expiró o es inválido
}

module.exports = { firmarToken, verificarToken, COOKIE_MAX_AGE_MS };
