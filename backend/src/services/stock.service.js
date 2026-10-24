// =====================================================================
// Servicio de Stock por mes: valida el mes pedido y traduce el error de
// "tabla inexistente" (migración 003 sin aplicar) a un mensaje claro.
// =====================================================================
const stockRepo = require('../repositories/stock.repository');
const HttpError = require('../utils/HttpError');

async function conMigracionStock(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === '42P01') {
      throw new HttpError(503, 'Falta aplicar la migración de stock por mes (003_movimientos_stock.sql) en la base de datos');
    }
    throw err;
  }
}

const sumar = (filas) =>
  filas.reduce(
    (t, f) => ({
      sobro: t.sobro + f.sobro,
      ingreso: t.ingreso + f.ingreso,
      vendido: t.vendido + f.vendido,
      ajuste: t.ajuste + f.ajuste,
      quedo: t.quedo + f.quedo,
    }),
    { sobro: 0, ingreso: 0, vendido: 0, ajuste: 0, quedo: 0 }
  );

async function listarMeses() {
  return conMigracionStock(() => stockRepo.resumenPorMes());
}

async function detalleDelMes(anio, mes) {
  const a = Number(anio);
  const m = Number(mes);
  if (!Number.isInteger(a) || a < 2000 || a > 2100 || !Number.isInteger(m) || m < 1 || m > 12) {
    throw new HttpError(400, 'Mes inválido');
  }
  const inicioMes = `${a}-${String(m).padStart(2, '0')}-01`;
  const productos = await conMigracionStock(() => stockRepo.detalleDelMes(inicioMes));
  return { mes: inicioMes.slice(0, 7), totales: sumar(productos), productos };
}

module.exports = { listarMeses, detalleDelMes };
