const cajaService = require('../services/caja.service');
const asyncHandler = require('../utils/asyncHandler');

const registrarVenta = asyncHandler(async (req, res) => {
  const { productoId, cantidad, medioPago } = req.body;
  const resultado = await cajaService.registrarVenta({ productoId, cantidad, medioPago });
  res.status(201).json(resultado);
});

const registrarEgreso = asyncHandler(async (req, res) => {
  const { monto, concepto, medioPago, envioId } = req.body;
  const movimiento = await cajaService.registrarEgreso({ monto, concepto, medioPago, envioId });
  res.status(201).json(movimiento);
});

const listarMovimientos = asyncHandler(async (req, res) => {
  const { tipo, medioPago, desde, hasta, limit, offset } = req.query;
  const movimientos = await cajaService.listarMovimientos({
    tipo, medioPago, desde, hasta,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json(movimientos);
});

const getBalance = asyncHandler(async (req, res) => {
  const { desde, hasta } = req.query;
  const balance = await cajaService.getBalance({ desde, hasta });
  res.json(balance);
});

module.exports = { registrarVenta, registrarEgreso, listarMovimientos, getBalance };
