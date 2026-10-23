const { pool } = require('../config/db');

async function getByEmail(email, client = pool) {
  const { rows } = await client.query(
    'SELECT * FROM usuarios WHERE lower(email) = lower($1) AND activo = true',
    [email]
  );
  return rows[0] || null;
}

async function getById(id, client = pool) {
  const { rows } = await client.query(
    'SELECT id, nombre, email, activo FROM usuarios WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombre, email, passwordHash }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, email`,
    [nombre, email, passwordHash]
  );
  return rows[0];
}

async function actualizarPassword(id, passwordHash, client = pool) {
  await client.query('UPDATE usuarios SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}

module.exports = { getByEmail, getById, crear, actualizarPassword };
