const pushService = require('../services/push.service');
const asyncHandler = require('../utils/asyncHandler');

const obtenerClave = asyncHandler(async (req, res) => {
  res.json(pushService.claveVapid());
});

const obtenerSuscripcion = asyncHandler(async (req, res) => {
  res.json(await pushService.obtenerSuscripcion(req.usuarioId, req.query.endpoint));
});

const guardarSuscripcion = asyncHandler(async (req, res) => {
  const { subscription, avisos } = req.body;
  const resultado = await pushService.guardarSuscripcion(req.usuarioId, { subscription, avisos }, req.get('user-agent'));
  res.status(201).json(resultado);
});

const eliminarSuscripcion = asyncHandler(async (req, res) => {
  await pushService.eliminarSuscripcion(req.usuarioId, req.body?.endpoint);
  res.status(204).send();
});

module.exports = { obtenerClave, obtenerSuscripcion, guardarSuscripcion, eliminarSuscripcion };
