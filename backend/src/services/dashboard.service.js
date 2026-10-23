const dashboardRepo = require('../repositories/dashboard.repository');

async function resumen() {
  const [general, alertasStock, mensual] = await Promise.all([
    dashboardRepo.resumenGeneral(),
    dashboardRepo.productosConStockCritico(),
    dashboardRepo.totalesMensuales(),
  ]);
  return { ...general, alertasStock, mensual };
}

async function topProductos({ limite, desde, hasta }) {
  return dashboardRepo.topProductos({ limite, desde, hasta });
}

async function evolucion(dias) {
  return dashboardRepo.evolucionIngresosEgresos(dias);
}

async function medioPago(rango) {
  return dashboardRepo.desglosePorMedioPago(rango);
}

async function stockCritico() {
  return dashboardRepo.productosConStockCritico();
}

module.exports = { resumen, evolucion, medioPago, stockCritico, topProductos };
