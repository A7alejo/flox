// Límite general de pedidos por IP para toda la API (como hogarGestion).
// Frena scripts que saturen el servidor gratis de Render; el uso normal
// de 2 personas queda muy por debajo. El login tiene además su propio
// límite más estricto (loginRateLimiter.js).
const rateLimit = require('express-rate-limit');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados pedidos. Esperá unos minutos y volvé a probar.' } },
});

module.exports = apiRateLimiter;
