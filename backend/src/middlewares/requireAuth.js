// =====================================================================
// Protege rutas: exige un JWT válido en la cookie httpOnly. Si falta o
// es inválido/expiró, corta con 401 antes de llegar al controller.
// =====================================================================
const { verificarToken } = require('../utils/jwt');

const COOKIE_NAME = process.env.COOKIE_NAME || 'flox_token';

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: { message: 'No autenticado' } });
  }

  try {
    const payload = verificarToken(token);
    req.usuarioId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Sesión inválida o expirada' } });
  }
}

module.exports = requireAuth;
