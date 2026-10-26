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
    valores.push(`%${search}%`, String(search).trim());
    condiciones.push(`(nombre ILIKE $${valores.length - 1} OR codigo_barras = $${valores.length})`);
  }
  if (categoria) {
    valores.push(categoria);
    condiciones.push(`categoria = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await client.query(
    `SELECT id, nombre, categoria, codigo_barras, stock_actual, stock_minimo, costo_base,
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

async function crear({ nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen, codigoBarras }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO productos (nombre, categoria, stock_actual, stock_minimo, costo_base, porcentaje_margen, codigo_barras)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [nombre, categoria || null, stockActual ?? 0, stockMinimo ?? 5, costoBase, porcentajeMargen ?? 0, codigoBarras ?? null]
  );
  return rows[0];
}

// codigoBarras: undefined = no se toca; null = se borra (por eso no va con COALESCE).
async function actualizar(id, { nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen, codigoBarras }, client = pool) {
  const { rows } = await client.query(
    `UPDATE productos
        SET nombre = COALESCE($2, nombre),
            categoria = COALESCE($3, categoria),
            stock_actual = COALESCE($4, stock_actual),
            stock_minimo = COALESCE($5, stock_minimo),
            costo_base = COALESCE($6, costo_base),
            porcentaje_margen = COALESCE($7, porcentaje_margen),
            codigo_barras = CASE WHEN $8 THEN $9 ELSE codigo_barras END
      WHERE id = $1
      RETURNING *`,
    [id, nombre, categoria, stockActual, stockMinimo, costoBase, porcentajeMargen, codigoBarras !== undefined, codigoBarras ?? null]
  );
  return rows[0] || null;
}

// Se usa dentro de la transacción de la venta: el motivo hace que el trigger de
// movimientos_stock lo registre como 'venta' (y no como un ajuste manual).
async function descontarStock(id, cantidad, client) {
  await client.query("SELECT set_config('flox.motivo_stock', 'venta', true)");
  const { rows } = await client.query(
    `UPDATE productos
        SET stock_actual = stock_actual - $2
      WHERE id = $1
      RETURNING stock_actual`,
    [id, cantidad]
  );
  return rows[0];
}

// Al borrar una venta vuelve la mercadería. `motivo` decide cómo lo ve el
// stock por mes: 'venta' (resta de lo vendido) o 'ajuste' (corrección).
async function devolverStock(id, cantidad, motivo, client) {
  await client.query("SELECT set_config('flox.motivo_stock', $1, true)", [motivo]);
  await client.query('UPDATE productos SET stock_actual = stock_actual + $2 WHERE id = $1', [id, cantidad]);
}

async function darDeBaja(id, client = pool) {
  const { rows } = await client.query(
    `UPDATE productos SET activo = false WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

// true si el producto aparece en ventas, envíos o movimientos de caja.
// (venta_detalle solo se consulta si ya se aplicó 002_ventas.sql)
async function tieneHistorial(id, client = pool) {
  // Postgres valida las tablas al parsear: si venta_detalle no existe, no se la nombra.
  const { rows: [t] } = await client.query("SELECT to_regclass('public.venta_detalle') IS NOT NULL AS hay");
  const ventas = t.hay ? 'OR EXISTS (SELECT 1 FROM venta_detalle WHERE producto_id = $1)' : '';
  const { rows } = await client.query(
    `SELECT
        EXISTS (SELECT 1 FROM envio_detalle WHERE producto_id = $1)
     OR EXISTS (SELECT 1 FROM movimientos_caja WHERE producto_id = $1)
     ${ventas} AS tiene`,
    [id]
  );
  return rows[0].tiene;
}

async function eliminar(id, client = pool) {
  const { rowCount } = await client.query('DELETE FROM productos WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  listar,
  getById,
  getByIdForUpdate,
  crear,
  actualizar,
  descontarStock,
  devolverStock,
  darDeBaja,
  tieneHistorial,
  eliminar,
};
