// Límite de intentos de login por IP, para frenar fuerza bruta sobre
// las contraseñas. Con solo 2 usuarios reales, 10 intentos cada 15
// minutos alcanza de sobra para uso normal y frena ataques automatizados.
const rateLimit = require('express-rate-limit');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos. Probá de nuevo en unos minutos.' } },
});

module.exports = loginRateLimiter;
