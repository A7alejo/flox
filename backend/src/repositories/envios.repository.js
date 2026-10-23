const { pool } = require('../config/db');

async function listar({ estado }, client = pool) {
  const condiciones = [];
  const valores = [];
  if (estado) {
    valores.push(estado);
    condiciones.push(`e.estado = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  // Incluye el detalle de productos de cada envío (misma forma que getById)
  // para que el listado no necesite un request extra por envío.
  const { rows } = await client.query(
    `SELECT e.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ed.id,
                  'producto_id', ed.producto_id,
                  'producto_nombre', p.nombre,
                  'cantidad', ed.cantidad
                ) ORDER BY ed.id
              ) FILTER (WHERE ed.id IS NOT NULL),
              '[]'::json
            ) AS productos
       FROM envios e
       LEFT JOIN envio_detalle ed ON ed.envio_id = e.id
       LEFT JOIN productos p ON p.id = ed.producto_id
       ${where}
      GROUP BY e.id
      ORDER BY e.fecha_creacion DESC`,
    valores
  );
  return rows;
}

async function getById(id, client = pool) {
  const envio = await client.query('SELECT * FROM envios WHERE id = $1', [id]);
  if (!envio.rows[0]) return null;

  const detalle = await client.query(
    `SELECT ed.id, ed.producto_id, p.nombre AS producto_nombre, ed.cantidad
       FROM envio_detalle ed
       JOIN productos p ON p.id = ed.producto_id
      WHERE ed.envio_id = $1`,
    [id]
  );

  return { ...envio.rows[0], productos: detalle.rows };
}

async function crear({ clienteNombre, direccion, notas, productos }, client) {
  const { rows } = await client.query(
    `INSERT INTO envios (cliente_nombre, direccion, notas)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [clienteNombre, direccion || null, notas || null]
  );
  const envio = rows[0];

  for (const item of productos) {
    await client.query(
      `INSERT INTO envio_detalle (envio_id, producto_id, cantidad)
       VALUES ($1, $2, $3)`,
      [envio.id, item.productoId, item.cantidad]
    );
  }

  return envio;
}

async function actualizarEstado(id, estado, client = pool) {
  const { rows } = await client.query(
    `UPDATE envios SET estado = $2 WHERE id = $1 RETURNING *`,
    [id, estado]
  );
  return rows[0] || null;
}

async function eliminar(id, client = pool) {
  const { rows } = await client.query('DELETE FROM envios WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

module.exports = { listar, getById, crear, actualizarEstado, eliminar };
