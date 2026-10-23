const enviosService = require('../services/envios.service');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  res.json(await enviosService.listar({ estado }));
});

const obtener = asyncHandler(async (req, res) => {
  res.json(await enviosService.obtener(req.params.id));
});

const crear = asyncHandler(async (req, res) => {
  const { clienteNombre, direccion, notas, productos } = req.body;
  const envio = await enviosService.crear({ clienteNombre, direccion, notas, productos });
  res.status(201).json(envio);
});

const actualizarEstado = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  res.json(await enviosService.actualizarEstado(req.params.id, estado));
});

const eliminar = asyncHandler(async (req, res) => {
  await enviosService.eliminar(req.params.id);
  res.status(204).send();
});

module.exports = { listar, obtener, crear, actualizarEstado, eliminar };
