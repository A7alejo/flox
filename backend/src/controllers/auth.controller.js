const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_MAX_AGE_MS } = require('../utils/jwt');
const { emitirCsrfToken, borrarCsrfToken } = require('../middlewares/csrf');

const COOKIE_NAME = process.env.COOKIE_NAME || 'flox_token';
const EN_PRODUCCION = process.env.NODE_ENV === 'production';


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
  // El token CSRF sí va en el body: el frontend lo manda en X-CSRF-Token.
  res.json({ usuario, csrfToken: emitirCsrfToken(res) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  borrarCsrfToken(res);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  const usuario = await authService.obtenerPerfil(req.usuarioId);
  // Al recargar la app el token CSRF en memoria se pierde: se renueva acá.
  res.json({ usuario, csrfToken: emitirCsrfToken(res) });
});

const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  await authService.cambiarPassword(req.usuarioId, { passwordActual, passwordNueva });
  res.status(204).send();
});

module.exports = { login, logout, me, cambiarPassword, COOKIE_NAME };
