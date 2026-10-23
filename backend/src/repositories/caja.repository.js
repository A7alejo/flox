const { pool } = require('../config/db');

async function crearMovimiento(
  { tipo, concepto, monto, medioPago, productoId, cantidadVendida, envioId },
  client = pool
) {
  const { rows } = await client.query(
    `INSERT INTO movimientos_caja
        (tipo, concepto, monto, medio_pago, producto_id, cantidad_vendida, envio_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tipo, concepto, monto, medioPago || null, productoId || null, cantidadVendida || null, envioId || null]
  );
  return rows[0];
}

async function listarMovimientos({ tipo, medioPago, desde, hasta, limit = 50, offset = 0 }, client = pool) {
  const condiciones = [];
  const valores = [];

  if (tipo) {
    valores.push(tipo);
    condiciones.push(`tipo = $${valores.length}`);
  }
  if (medioPago) {
    valores.push(medioPago);
    condiciones.push(`medio_pago = $${valores.length}`);
  }
  if (desde) {
    valores.push(desde);
    condiciones.push(`fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`fecha <= $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  valores.push(limit, offset);

  const { rows } = await client.query(
    `SELECT mc.*, p.nombre AS producto_nombre
       FROM movimientos_caja mc
       LEFT JOIN productos p ON p.id = mc.producto_id
       ${where}
      ORDER BY fecha DESC
      LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores
  );
  return rows;
}

async function getBalance({ desde, hasta } = {}, client = pool) {
  const condiciones = [];
  const valores = [];
  if (desde) {
    valores.push(desde);
    condiciones.push(`fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`fecha <= $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await client.query(
    `SELECT
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0) AS total_ingresos,
        COALESCE(SUM(monto) FILTER (WHERE tipo = 'egreso'), 0) AS total_egresos
       FROM movimientos_caja
       ${where}`,
    valores
  );
  const { total_ingresos, total_egresos } = rows[0];
  return {
    totalIngresos: Number(total_ingresos),
    totalEgresos: Number(total_egresos),
    balance: Number(total_ingresos) - Number(total_egresos),
  };
}

module.exports = { crearMovimiento, listarMovimientos, getBalance };
