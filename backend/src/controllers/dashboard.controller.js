const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const resumen = asyncHandler(async (req, res) => {
  res.json(await dashboardService.resumen());
});

const evolucion = asyncHandler(async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 7;
  res.json(await dashboardService.evolucion(dias));
});

const medioPago = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  res.json(await dashboardService.medioPago({ desde, hasta }));
});

const stockCritico = asyncHandler(async (req, res) => {
  res.json(await dashboardService.stockCritico());
});

const topProductos = asyncHandler(async (req, res) => {
  const { limite, desde, hasta } = req.query;
  res.json(await dashboardService.topProductos({
    limite: limite ? Math.min(Math.max(Number(limite) || 5, 1), 20) : 5,
    desde,
    hasta,
  }));
});

module.exports = { resumen, evolucion, medioPago, stockCritico, topProductos };
