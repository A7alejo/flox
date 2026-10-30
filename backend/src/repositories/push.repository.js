const { pool } = require('../config/db');

// Tipo de aviso -> columna. Lista cerrada: nunca se arma SQL con texto del usuario.
const COLUMNA_AVISO = {
  ventas: 'avisa_ventas',
  gastos: 'avisa_gastos',
  productos: 'avisa_productos',
};

// Un mismo celular (endpoint) pertenece a un solo usuario: si entra otro
// usuario en ese celular, la suscripción pasa a él.
async function guardar({ usuarioId, endpoint, p256dh, auth, userAgent, avisos }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO push_suscripciones
       (usuario_id, endpoint, p256dh, auth, user_agent, avisa_ventas, avisa_gastos, avisa_productos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (endpoint) DO UPDATE SET
       usuario_id = EXCLUDED.usuario_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent,
       avisa_ventas = EXCLUDED.avisa_ventas,
       avisa_gastos = EXCLUDED.avisa_gastos,
       avisa_productos = EXCLUDED.avisa_productos
     RETURNING avisa_ventas, avisa_gastos, avisa_productos`,
    [usuarioId, endpoint, p256dh, auth, userAgent || null, avisos.ventas, avisos.gastos, avisos.productos]
  );
  return rows[0];
}

async function getAvisos(usuarioId, endpoint, client = pool) {
  const { rows } = await client.query(
    `SELECT avisa_ventas, avisa_gastos, avisa_productos
       FROM push_suscripciones WHERE usuario_id = $1 AND endpoint = $2`,
    [usuarioId, endpoint]
  );
  return rows[0] || null;
}

async function eliminar(usuarioId, endpoint, client = pool) {
  await client.query('DELETE FROM push_suscripciones WHERE usuario_id = $1 AND endpoint = $2', [usuarioId, endpoint]);
}

// Para limpiar suscripciones que el servicio de push ya dio de baja (404/410).
async function eliminarPorEndpoint(endpoint, client = pool) {
  await client.query('DELETE FROM push_suscripciones WHERE endpoint = $1', [endpoint]);
}

// Celulares de usuarios activos, menos los del que hizo la acción, que
// quieran ese tipo de aviso.
async function listarDestinos(tipo, excluirUsuarioId, client = pool) {
  const columna = COLUMNA_AVISO[tipo];
  if (!columna) return [];
  const { rows } = await client.query(
    `SELECT s.endpoint, s.p256dh, s.auth
       FROM push_suscripciones s
       JOIN usuarios u ON u.id = s.usuario_id
      WHERE u.activo = true AND s.usuario_id <> $1 AND s.${columna} = true`,
    [excluirUsuarioId]
  );
  return rows;
}

module.exports = { guardar, getAvisos, eliminar, eliminarPorEndpoint, listarDestinos };
