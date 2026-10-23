// =====================================================================
// Repositorio de Productos: única capa que conoce SQL.
// Todas las funciones aceptan un `client` opcional (pool por defecto)
// para poder participar de una transacción cuando hace falta.
// =====================================================================
const { pool } = require('../config/db');

async function listar({ search, categoria, soloActivos = true }, client = pool) {
  const condiciones = [];
  const valores = [];

  if (soloActivos) {
    condiciones.push('activo = true');
  }
  if (search) {
    valores.push(`%${search}%`);
    condiciones.push(`nombre ILIKE $${valores.length}`);
  }
  if (categoria) {
    valores.push(categoria);
    condiciones.push(`categoria = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await client.query(
    `SELECT id, nombre, categoria, stock_actual, stock_minimo, costo_base,
            porcentaje_margen, precio_venta, activo, fecha_actualizacion
       FROM productos
       ${where}
      ORDER BY nombre ASC`,
    valores
  );
  return rows;
}

async function getById(id, client = pool) {
  const { rows } = await client.query('SELECT * FROM productos WHERE id = $1', [id]);
  return rows[0] || null;
}

// SELECT ... FOR UPDATE: bloquea la fila dentro de la transacción para
// que dos ventas simultáneas del mismo producto no pisen el stock entre sí.
async function getByIdForUpdate(id, client) {
  const { rows } = await client.query(
    'SELECT * FROM productos WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO productos (nombre, categoria, stock_actual, stock_minimo, costo_base, porcentaje_margen)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nombre, categoria || null, stockActual ?? 0, stockMinimo ?? 5, costoBase, porcentajeMargen ?? 0]
  );
  return rows[0];
}

async function actualizar(id, { nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen }, client = pool) {
  const { rows } = await client.query(
    `UPDATE productos
        SET nombre = COALESCE($2, nombre),
            categoria = COALESCE($3, categoria),
            stock_actual = COALESCE($4, stock_actual),
            stock_minimo = COALESCE($5, stock_minimo),
            costo_base = COALESCE($6, costo_base),
            porcentaje_margen = COALESCE($7, porcentaje_margen)
      WHERE id = $1
      RETURNING *`,
    [id, nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen]
  );
  return rows[0] || null;
}

async function descontarStock(id, cantidad, client) {
  const { rows } = await client.query(
    `UPDATE productos
        SET stock_actual = stock_actual - $2
      WHERE id = $1
      RETURNING stock_actual`,
    [id, cantidad]
  );
  return rows[0];
}

async function darDeBaja(id, client = pool) {
  const { rows } = await client.query(
    `UPDATE productos SET activo = false WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  listar,
  getById,
  getByIdForUpdate,
  crear,
  actualizar,
  descontarStock,
  darDeBaja,
};
