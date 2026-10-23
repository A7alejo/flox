const productosService = require('../services/productos.service');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');

const listar = asyncHandler(async (req, res) => {
  const { search, categoria, incluirInactivos } = req.query;
  const productos = await productosService.listar({
    search,
    categoria,
    soloActivos: incluirInactivos !== 'true',
  });
  res.json(productos);
});

const obtener = asyncHandler(async (req, res) => {
  const producto = await productosService.obtener(req.params.id);
  res.json(producto);
});

const crear = asyncHandler(async (req, res) => {
  const { nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen } = req.body;
  const producto = await productosService.crear({
    nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen,
  });
  res.status(201).json(producto);
});

const actualizar = asyncHandler(async (req, res) => {
  const { nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen } = req.body;
  const producto = await productosService.actualizar(req.params.id, {
    nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen,
  });
  res.json(producto);
});

const darDeBaja = asyncHandler(async (req, res) => {
  await productosService.darDeBaja(req.params.id);
  res.status(204).send();
});

// Borrado definitivo (solo productos sin historial; si no, 409).
const eliminar = asyncHandler(async (req, res) => {
  await productosService.eliminar(req.params.id);
  res.status(204).send();
});

// Preview en vivo para el formulario: no toca la base, solo calcula.
const calcularPrecio = asyncHandler(async (req, res) => {
  // Number('') y Number('  ') dan 0: tratamos vacíos como inválidos.
  const aNumero = (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
  const costoBase = aNumero(req.query.costoBase);
  const porcentajeMargen = aNumero(req.query.porcentajeMargen);
  // Evita responder { precioVenta: null } con NaN o Infinity.
  if (!Number.isFinite(costoBase) || !Number.isFinite(porcentajeMargen)) {
    throw new HttpError(400, 'costoBase y porcentajeMargen deben ser números válidos');
  }
  const precioVenta = productosService.calcularPrecioVenta(costoBase, porcentajeMargen);
  res.json({ precioVenta });
});

module.exports = { listar, obtener, crear, actualizar, darDeBaja, eliminar, calcularPrecio };
