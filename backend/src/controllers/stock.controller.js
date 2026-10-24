const stockService = require('../services/stock.service');
const asyncHandler = require('../utils/asyncHandler');

const listarMeses = asyncHandler(async (req, res) => {
  res.json(await stockService.listarMeses());
});

const detalleDelMes = asyncHandler(async (req, res) => {
  res.json(await stockService.detalleDelMes(req.params.anio, req.params.mes));
});

module.exports = { listarMeses, detalleDelMes };
