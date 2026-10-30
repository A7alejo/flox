// Refleja backend/src/routes/push.routes.js
import { request } from './client';

// GET /push/clave -> { habilitado, publicKey }
export const obtenerClave = () => request('/push/clave');

// GET /push/suscripcion?endpoint=... -> { suscripto, avisos }
export const obtenerSuscripcion = (endpoint) => request('/push/suscripcion', { params: { endpoint } });

// POST /push/suscripcion -> { avisos }. Alta de este celular o cambio de avisos.
export const guardarSuscripcion = (subscription, avisos) =>
  request('/push/suscripcion', { method: 'POST', body: { subscription, avisos } });

// DELETE /push/suscripcion -> 204
export const eliminarSuscripcion = (endpoint) =>
  request('/push/suscripcion', { method: 'DELETE', body: { endpoint } });
