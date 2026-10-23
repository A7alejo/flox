const { pool } = require('../config/db');

async function crear({ estado, clienteNombre, total, medioPago }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO ventas (estado, cliente_nombre, total, medio_pago, fecha_pago)
     VALUES ($1, $2, $3, $4, CASE WHEN $5::boolean THEN now() END)
     RETURNING *`,
    [estado, clienteNombre || null, total, medioPago || null, estado === 'pagada']
  );
  return rows[0];
}

async function agregarDetalle(ventaId, { productoId, cantidad, precioUnitario }, client = pool) {
  await client.query(
    `INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario)
     VALUES ($1, $2, $3, $4)`,
    [ventaId, productoId, cantidad, precioUnitario]
  );
}

async function getByIdForUpdate(id, client) {
  const { rows } = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] || null;
}

async function marcarPagada(id, medioPago, client = pool) {
  const { rows } = await client.query(
    `UPDATE ventas SET estado = 'pagada', medio_pago = $2, fecha_pago = now()
      WHERE id = $1
      RETURNING *`,
    [id, medioPago]
  );
  return rows[0];
}

// Ventas con sus productos (misma forma que el listado de envíos), más recientes primero.
// Filtros opcionales: estado y/o ids.
async function listar({ estado, ids } = {}, client = pool) {
  const condiciones = [];
  const valores = [];
  if (estado) {
    valores.push(estado);
    condiciones.push(`v.estado = $${valores.length}`);
  }
  if (ids) {
    valores.push(ids);
    condiciones.push(`v.id = ANY($${valores.length}::int[])`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT v.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'producto_id', vd.producto_id,
                  'producto_nombre', p.nombre,
                  'cantidad', vd.cantidad,
                  'precio_unitario', vd.precio_unitario
                ) ORDER BY vd.id
              ) FILTER (WHERE vd.id IS NOT NULL),
              '[]'
            ) AS productos
       FROM ventas v
       LEFT JOIN venta_detalle vd ON vd.venta_id = v.id
       LEFT JOIN productos p ON p.id = vd.producto_id
       ${where}
      GROUP BY v.id
      ORDER BY v.fecha_creacion DESC`,
    valores
  );
  return rows;
}

module.exports = { crear, agregarDetalle, getByIdForUpdate, marcarPagada, listar };
