// Refleja backend/src/routes/stock.routes.js (stock por mes / cajones).
// `mes` viaja como 'YYYY-MM'; acá se separa en anio + mes (1-12).
import { request } from './client';

const separarMes = (mes) => {
  const [anio, m] = mes.split('-').map(Number);
  return { anio, mes: m };
};

const toTotales = (r) => ({
  sobro: r.sobro,
  ingreso: r.ingreso,
  vendido: r.vendido,
  ajuste: r.ajuste,
  quedo: r.quedo,
});

// GET /stock/meses -> [{ anio, mes, enCurso, sobro, ingreso, vendido, ajuste, quedo }], del más nuevo al más viejo.
// Si la migración 003 no está aplicada responde 503 (ApiError con status 503).
export async function listarMeses() {
  const rows = await request('/stock/meses');
  return rows.map((r) => ({ ...separarMes(r.mes), enCurso: r.en_curso, ...toTotales(r) }));
}

// GET /stock/meses/:anio/:mes -> { anio, mes, totales, productos: [{ id, nombre, categoria, sobro, ... }] }
export async function detalleDelMes(anio, mes) {
  const data = await request(`/stock/meses/${anio}/${mes}`);
  return {
    ...separarMes(data.mes),
    totales: data.totales,
    productos: data.productos.map((p) => ({ id: p.id, nombre: p.nombre, categoria: p.categoria, ...toTotales(p) })),
  };
}
