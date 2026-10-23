const { pool } = require('../config/db');

// Columnas públicas: nunca incluir password_hash en lo que sale de la API.
const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, activo, fecha_creacion';

async function getByEmail(email, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM usuarios WHERE lower(email) = lower($1) AND activo = true',
    [email]
  );
  return rows[0] || null;
}

async function getById(id, client = pool) {
  const { rows } = await client.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombre, email, passwordHash, rol = 'operador' }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, email, passwordHash, rol]
  );
  return rows[0];
}

async function actualizarPassword(id, passwordHash, client = pool) {
  await client.query('UPDATE usuarios SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}

// ---------------------------------------------------------------------
// Panel de Admin
// ---------------------------------------------------------------------
async function listar(client = pool) {
  const { rows } = await client.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY activo DESC, nombre`
  );
  return rows;
}

// true si el email ya lo usa otro usuario (activo o no), ignorando `excluirId`
async function existeEmail(email, excluirId = null, client = pool) {
  const { rows } = await client.query(
    'SELECT 1 FROM usuarios WHERE lower(email) = lower($1) AND ($2::int IS NULL OR id <> $2)',
    [email, excluirId]
  );
  return rows.length > 0;
}

async function actualizar(id, { nombre, email, rol }, client = pool) {
  const { rows } = await client.query(
    `UPDATE usuarios SET nombre = $2, email = $3, rol = $4
     WHERE id = $1
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [id, nombre, email, rol]
  );
  return rows[0] || null;
}

async function setActivo(id, activo, client = pool) {
  const { rows } = await client.query(
    `UPDATE usuarios SET activo = $2 WHERE id = $1 RETURNING ${COLUMNAS_PUBLICAS}`,
    [id, activo]
  );
  return rows[0] || null;
}

async function eliminar(id, client = pool) {
  const { rowCount } = await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
  return rowCount > 0;
}

async function contarAdminsActivos(client = pool) {
  const { rows } = await client.query(
    "SELECT count(*)::int AS total FROM usuarios WHERE rol = 'admin' AND activo = true"
  );
  return rows[0].total;
}

module.exports = {
  getByEmail,
  getById,
  crear,
  actualizarPassword,
  listar,
  existeEmail,
  actualizar,
  setActivo,
  eliminar,
  contarAdminsActivos,
};
