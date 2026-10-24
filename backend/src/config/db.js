// =====================================================================
// Conexión a PostgreSQL (pool) + helper de transacciones
// =====================================================================
const { Pool } = require('pg');

const EN_PRODUCCION = process.env.NODE_ENV === 'production';
const USAR_SSL = process.env.DB_SSL === 'true';

if (EN_PRODUCCION && !USAR_SSL) {
  // Igual que hogarGestion: en producción nunca se habla con la base sin cifrar.
  throw new Error('DB_SSL tiene que estar en true en producción');
}

// DB_SSL_CA: certificado de Supabase (Project Settings > Database > SSL
// Configuration > Download certificate), pegado completo en la variable.
// Con él se verifica que del otro lado esté de verdad Supabase. Sin él la
// conexión va cifrada pero sin verificar quién responde.
const CA = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : null;
if (USAR_SSL && !CA && EN_PRODUCCION) {
  console.warn('[DB] DB_SSL_CA no está definido: la conexión va cifrada pero sin verificar el certificado.');
}

function opcionesSsl() {
  if (!USAR_SSL) return false;
  return CA ? { ca: CA, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: opcionesSsl(),
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
