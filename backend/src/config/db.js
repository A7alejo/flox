// =====================================================================
// Conexión a PostgreSQL (pool) + helper de transacciones
// =====================================================================
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10, // Supabase free tier tiene límite de conexiones; 10 es prudente
});

pool.on('error', (err) => {
  // Error en un cliente ocioso del pool (ej: se cayó la conexión)
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

/**
 * Ejecuta `callback` dentro de una transacción (BEGIN/COMMIT/ROLLBACK).
 * Usar para cualquier operación que deba ser atómica, como registrar
 * una venta (descontar stock + insertar movimiento de caja).
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await callback(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
