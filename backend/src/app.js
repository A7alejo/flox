const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const apiRateLimiter = require('./middlewares/apiRateLimiter');
const { validarCsrf } = require('./middlewares/csrf');

const app = express();

// Render (y la mayoría de los PaaS) ponen la app detrás de un reverse
// proxy. Sin esto, Express no detecta bien HTTPS ni la IP real del
// cliente, lo que rompe las cookies "secure" y el rate limiter.
app.set('trust proxy', 1);

app.use(helmet());

const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
if (corsOrigins.length === 0) {
  console.warn(
    '[CORS] CORS_ORIGINS no está definido: en producción esto bloquea al frontend ' +
    '(no se puede usar "*" junto con cookies/credentials).'
  );
}
app.use(cors({
  origin: corsOrigins, // nunca '*': con credentials:true el navegador lo rechaza
  credentials: true, // permite que el navegador mande/reciba la cookie httpOnly
}));

app.use(express.json({ limit: '100kb' })); // los pedidos de la app son chicos; corta bodies gigantes
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiRateLimiter);
app.use(validarCsrf); // antes de las rutas: POST/PUT/PATCH/DELETE con sesión exigen X-CSRF-Token
app.use('/api', routes);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Recurso no encontrado' } });
});

// Siempre al final: captura errores de asyncHandler y de Express
app.use(errorHandler);

module.exports = app;
