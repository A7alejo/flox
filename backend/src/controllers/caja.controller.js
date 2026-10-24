const cajaService = require('../services/caja.service');
const asyncHandler = require('../utils/asyncHandler');

const registrarVenta = asyncHandler(async (req, res) => {
  // items: [{ productoId, cantidad }]. Se sigue aceptando el formato viejo
  // { productoId, cantidad } (una sola línea).
  const { items, productoId, cantidad, medioPago, estado, clienteNombre } = req.body;
  const resultado = await cajaService.registrarVenta({ items, productoId, cantidad, medioPago, estado, clienteNombre });
  res.status(201).json(resultado);
});

const listarVentas = asyncHandler(async (req, res) => {
  const ventas = await cajaService.listarVentas({ estado: req.query.estado });
  res.json(ventas);
});

const cobrarVenta = asyncHandler(async (req, res) => {
  const resultado = await cajaService.cobrarVenta(req.params.id, { medioPago: req.body.medioPago });
  res.json(resultado);
});

// Admin y operador (ver caja.routes.js). Devuelven el stock que volvió.
const eliminarVenta = asyncHandler(async (req, res) => {
  res.json(await cajaService.eliminarVenta(req.params.id));
});

const eliminarDelHistorial = asyncHandler(async (req, res) => {
  res.json(await cajaService.eliminarDelHistorial(req.params.id));
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

module.exports = { registrarVenta, listarVentas, cobrarVenta, eliminarVenta, eliminarDelHistorial, registrarEgreso, listarMovimientos, getBalance };
