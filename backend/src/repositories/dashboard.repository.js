const { pool } = require('../config/db');

// Evolución diaria de ingresos vs egresos en los últimos N días.
// date_trunc + generate_series rellena los días sin movimientos con 0,
// para que el gráfico no tenga "huecos".
async function evolucionIngresosEgresos(dias = 7, client = pool) {
  const { rows } = await client.query(
    `WITH rango AS (
        SELECT generate_series(
                 date_trunc('day', now()) - ($1 || ' days')::interval,
                 date_trunc('day', now()),
                 '1 day'::interval
               ) AS dia
     )
     SELECT
        to_char(r.dia, 'YYYY-MM-DD') AS dia,
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'ingreso'), 0) AS ingresos,
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'egreso'), 0) AS egresos
     FROM rango r
     LEFT JOIN movimientos_caja mc ON date_trunc('day', mc.fecha) = r.dia
     GROUP BY r.dia
     ORDER BY r.dia`,
    [dias - 1]
  );
  return rows.map((r) => ({
    dia: r.dia,
    ingresos: Number(r.ingresos),
    egresos: Number(r.egresos),
  }));
}

// Desglose de ingresos por medio de cobro.
async function desglosePorMedioPago({ desde, hasta } = {}, client = pool) {
  const condiciones = [`tipo = 'ingreso'`];
  const valores = [];
  if (desde) {
    valores.push(desde);
    condiciones.push(`fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`fecha <= $${valores.length}`);
  }

  const { rows } = await client.query(
    `SELECT medio_pago, SUM(monto) AS total, COUNT(*) AS cantidad
       FROM movimientos_caja
      WHERE ${condiciones.join(' AND ')}
      GROUP BY medio_pago
      ORDER BY total DESC`,
    valores
  );
  return rows.map((r) => ({
    medioPago: r.medio_pago,
    total: Number(r.total),
    cantidad: Number(r.cantidad),
  }));
}

// Productos en o por debajo de su stock mínimo (para las alertas).
async function productosConStockCritico(client = pool) {
  const { rows } = await client.query(
    `SELECT id, nombre, stock_actual, stock_minimo
       FROM productos
      WHERE activo = true AND stock_actual <= stock_minimo
      ORDER BY stock_actual ASC`
  );
  return rows;
}

// Totales del mes en curso y del mes anterior, para los deltas "vs. mes anterior".
// Los límites de mes se calculan en hora de Argentina (la base corre en UTC): si no,
// una venta hecha el último día del mes después de las 21:00 caería en el mes siguiente.
async function totalesMensuales(client = pool) {
  const { rows } = await client.query(
    `WITH limites AS (
        SELECT
          date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
            AT TIME ZONE 'America/Argentina/Buenos_Aires' AS inicio_actual,
          (date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires') - interval '1 month')
            AT TIME ZONE 'America/Argentina/Buenos_Aires' AS inicio_anterior
     )
     SELECT
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'ingreso' AND mc.fecha >= l.inicio_actual), 0) AS ingresos_actual,
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'egreso'  AND mc.fecha >= l.inicio_actual), 0) AS egresos_actual,
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'ingreso' AND mc.fecha < l.inicio_actual), 0) AS ingresos_anterior,
        COALESCE(SUM(mc.monto) FILTER (WHERE mc.tipo = 'egreso'  AND mc.fecha < l.inicio_actual), 0) AS egresos_anterior
       FROM movimientos_caja mc
       CROSS JOIN limites l
      WHERE mc.fecha >= l.inicio_anterior`
  );
  const r = rows[0];
  return {
    actual: { ingresos: Number(r.ingresos_actual), egresos: Number(r.egresos_actual) },
    anterior: { ingresos: Number(r.ingresos_anterior), egresos: Number(r.egresos_anterior) },
  };
}

// true si ya se aplicó 002_ventas.sql (tabla venta_detalle). Se cachea el "sí".
let hayTablaVentas = false;
async function tablaVentasExiste(client) {
  if (hayTablaVentas) return true;
  const { rows } = await client.query("SELECT to_regclass('public.venta_detalle') IS NOT NULL AS existe");
  hayTablaVentas = rows[0].existe;
  return hayTablaVentas;
}

// Productos más vendidos por unidades. Suma las ventas viejas (un ingreso con
// producto_id) y las nuevas (venta_detalle, pendientes incluidas: la mercadería ya salió).
async function topProductos({ limite = 5, desde, hasta } = {}, client = pool) {
  const condiciones = [];
  const valores = [];
  if (desde) {
    valores.push(desde);
    condiciones.push(`u.fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`u.fecha <= $${valores.length}`);
  }
  valores.push(limite);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const ventasNuevas = (await tablaVentasExiste(client))
    ? `UNION ALL
       SELECT vd.producto_id, vd.cantidad, v.fecha_creacion
         FROM venta_detalle vd JOIN ventas v ON v.id = vd.venta_id`
    : '';

  const { rows } = await client.query(
    `SELECT p.id, p.nombre, SUM(u.cantidad) AS unidades
       FROM (
         SELECT producto_id, cantidad_vendida AS cantidad, fecha
           FROM movimientos_caja
          WHERE tipo = 'ingreso' AND cantidad_vendida IS NOT NULL
         ${ventasNuevas}
       ) u
       JOIN productos p ON p.id = u.producto_id
      ${where}
      GROUP BY p.id, p.nombre
      ORDER BY unidades DESC, p.nombre ASC
      LIMIT $${valores.length}`,
    valores
  );
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, unidades: Number(r.unidades) }));
}

// Resumen general para las tarjetas del Dashboard.
async function resumenGeneral(client = pool) {
  const { rows: balanceRows } = await client.query(
    `SELECT
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0) AS total_ingresos,
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'egreso'), 0) AS total_egresos
     FROM movimientos_caja`
  );
  const { rows: stockRows } = await client.query(
    `SELECT COALESCE(SUM(stock_actual), 0) AS unidades_totales, COUNT(*) AS productos_activos
       FROM productos WHERE activo = true`
  );

  const { total_ingresos, total_egresos } = balanceRows[0];
  const { unidades_totales, productos_activos } = stockRows[0];

  return {
    totalIngresos: Number(total_ingresos),
    totalEgresos: Number(total_egresos),
    balance: Number(total_ingresos) - Number(total_egresos),
    unidadesEnStock: Number(unidades_totales),
    productosActivos: Number(productos_activos),
  };
}

module.exports = {
  evolucionIngresosEgresos,
  desglosePorMedioPago,
  productosConStockCritico,
  resumenGeneral,
  totalesMensuales,
  topProductos,
};
