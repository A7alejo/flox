// =====================================================================
// Repositorio de Stock por mes (cajones). Lee movimientos_stock, que llena
// el trigger de productos (ver database/003_movimientos_stock.sql).
// Los meses se cortan en hora de Argentina, igual que el dashboard.
//
// Por cada mes y producto:
//   sobro   = todo lo anterior al mes + el stock 'inicial' cargado ese mes
//   ingreso = lo que entró en el mes
//   vendido = lo que salió por ventas en el mes (en positivo)
//   ajuste  = correcciones manuales que restaron (negativo)
//   quedo   = sobro + ingreso − vendido + ajuste
// =====================================================================
const { pool } = require('../config/db');

const MOVIMIENTOS = `
  SELECT producto_id, cantidad, tipo,
         date_trunc('month', fecha AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS mes
    FROM movimientos_stock`;

// Columnas calculadas para el mes `ref` (una expresión SQL de tipo date).
const columnasDelMes = (ref) => `
  COALESCE(SUM(m.cantidad) FILTER (WHERE m.mes < ${ref} OR (m.mes = ${ref} AND m.tipo = 'inicial')), 0)::int AS sobro,
  COALESCE(SUM(m.cantidad) FILTER (WHERE m.mes = ${ref} AND m.tipo = 'ingreso'), 0)::int AS ingreso,
  COALESCE(-SUM(m.cantidad) FILTER (WHERE m.mes = ${ref} AND m.tipo = 'venta'), 0)::int AS vendido,
  COALESCE(SUM(m.cantidad) FILTER (WHERE m.mes = ${ref} AND m.tipo = 'ajuste'), 0)::int AS ajuste,
  COALESCE(SUM(m.cantidad) FILTER (WHERE m.mes <= ${ref}), 0)::int AS quedo`;

// Un resumen por mes, del más nuevo al más viejo: desde el primer movimiento
// hasta el mes en curso (siempre incluido, aunque todavía no haya movimientos).
async function resumenPorMes(client = pool) {
  const { rows } = await client.query(
    `WITH m AS (${MOVIMIENTOS}),
          actual AS (SELECT date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS mes),
          meses AS (
            SELECT generate_series(
                     COALESCE((SELECT min(mes) FROM m), (SELECT mes FROM actual)),
                     (SELECT mes FROM actual),
                     interval '1 month'
                   )::date AS mes
          )
     SELECT to_char(s.mes, 'YYYY-MM') AS mes,
            s.mes = (SELECT mes FROM actual) AS en_curso,
            ${columnasDelMes('s.mes')}
       FROM meses s
       LEFT JOIN m ON m.mes <= s.mes
      GROUP BY s.mes
      ORDER BY s.mes DESC`
  );
  return rows;
}

// Detalle por producto de un mes ('YYYY-MM-01'). Entran los productos que
// tenían stock en ese mes o que tuvieron algún movimiento en él.
async function detalleDelMes(inicioMes, client = pool) {
  const { rows } = await client.query(
    `WITH m AS (${MOVIMIENTOS})
     SELECT p.id, p.nombre, p.categoria, p.activo,
            ${columnasDelMes('$1::date')}
       FROM m
       JOIN productos p ON p.id = m.producto_id
      WHERE m.mes <= $1::date
      GROUP BY p.id
     HAVING SUM(m.cantidad) <> 0 OR COUNT(*) FILTER (WHERE m.mes = $1::date) > 0
      ORDER BY p.nombre ASC`,
    [inicioMes]
  );
  return rows;
}

module.exports = { resumenPorMes, detalleDelMes };
