// =====================================================================
// Protege rutas: exige un JWT válido en la cookie httpOnly. Si falta o
// es inválido/expiró, corta con 401 antes de llegar al controller.
// Además confirma en la base que el usuario siga existiendo y activo:
// así, desactivar o eliminar a alguien le corta la sesión al instante
// (el JWT solo no alcanza, porque sigue siendo válido hasta que vence).
// =====================================================================
const { verificarToken } = require('../utils/jwt');
const usuariosRepo = require('../repositories/usuarios.repository');

const COOKIE_NAME = process.env.COOKIE_NAME || 'flox_token';

async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: { message: 'No autenticado' } });
  }

  let payload;
  try {
    payload = verificarToken(token);
  } catch (err) {
    return res.status(401).json({ error: { message: 'Sesión inválida o expirada' } });
  }

  try {
    const usuario = await usuariosRepo.getById(payload.userId);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: { message: 'Sesión inválida o expirada' } });
    }
    req.usuarioId = usuario.id;
    req.usuario = usuario; // incluye el rol vigente (lo usa requireAdmin)
    next();
  } catch (err) {
    next(err); // error de base -> errorHandler (500)
  }
}

module.exports = requireAuth;
