const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_NAME = process.env.COOKIE_NAME || 'flox_token';
const EN_PRODUCCION = process.env.NODE_ENV === 'production';

// Duración de la cookie alineada con la del JWT (en ms). Si cambiás
// JWT_EXPIRES_IN, actualizá esto a mano (son dos formatos distintos,
// uno de jsonwebtoken y otro de Express).
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function setCookieToken(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // inaccesible desde JS del navegador -> no se puede robar vía XSS/localStorage
    secure: EN_PRODUCCION, // solo viaja por HTTPS en producción
    sameSite: EN_PRODUCCION ? 'none' : 'lax', // 'none' porque frontend y backend viven en dominios distintos (Vercel/Render)
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, usuario } = await authService.login({ email, password });
  setCookieToken(res, token);
  // El token NUNCA va en el body de la respuesta: vive solo en la
  // cookie httpOnly. El frontend no necesita (ni debe) leerlo.
  res.json({ usuario });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  const usuario = await authService.obtenerPerfil(req.usuarioId);
  res.json({ usuario });
});

const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  await authService.cambiarPassword(req.usuarioId, { passwordActual, passwordNueva });
  res.status(204).send();
});

module.exports = { login, logout, me, cambiarPassword, COOKIE_NAME };
