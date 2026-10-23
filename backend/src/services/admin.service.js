// =====================================================================
// Servicio del Panel de Admin: gestión de usuarios.
// Reglas de protección (para que el admin nunca se quede afuera):
// - Nadie puede eliminarse, desactivarse ni quitarse el rol admin a sí mismo.
// - Siempre tiene que quedar al menos un admin activo.
// =====================================================================
const bcrypt = require('bcryptjs');
const usuariosRepo = require('../repositories/usuarios.repository');
const { SALT_ROUNDS } = require('./auth.service');
const HttpError = require('../utils/HttpError');

const ROLES_VALIDOS = ['admin', 'operador'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsearId(id) {
  // Ids de la tabla son SERIAL: entero positivo dentro del rango de INTEGER
  if (!/^\d+$/.test(String(id)) || Number(id) < 1 || Number(id) > 2147483647) {
    throw new HttpError(400, 'Id de usuario inválido');
  }
  return Number(id);
}

function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
}

// Valida y normaliza nombre/email/rol (comparte lógica entre crear y editar)
async function validarDatos({ nombre, email, rol }, excluirId = null) {
  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!nombreLimpio) throw new HttpError(400, 'El nombre es obligatorio');
  if (nombreLimpio.length > 100) throw new HttpError(400, 'El nombre es demasiado largo');
  if (!EMAIL_REGEX.test(emailLimpio) || emailLimpio.length > 150) {
    throw new HttpError(400, 'Email inválido');
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new HttpError(400, `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`);
  }
  if (await usuariosRepo.existeEmail(emailLimpio, excluirId)) {
    throw new HttpError(409, 'Ya existe un usuario con ese email');
  }
  return { nombre: nombreLimpio, email: emailLimpio, rol };
}

async function obtenerExistente(id) {
  const usuario = await usuariosRepo.getById(id);
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return usuario;
}

// Si `usuario` es un admin activo que está por dejar de serlo (por cambio
// de rol, desactivación o eliminación), verifica que quede otro.
async function asegurarOtroAdmin(usuario) {
  if (usuario.rol === 'admin' && usuario.activo) {
    const admins = await usuariosRepo.contarAdminsActivos();
    if (admins <= 1) throw new HttpError(409, 'Tiene que quedar al menos un administrador activo');
  }
}

async function listar() {
  return usuariosRepo.listar();
}

async function crear({ nombre, email, password, rol = 'operador' }) {
  const datos = await validarDatos({ nombre, email, rol });
  validarPassword(password);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return usuariosRepo.crear({ ...datos, passwordHash });
}

async function actualizar(adminId, id, { nombre, email, rol }) {
  const usuarioId = parsearId(id);
  const actual = await obtenerExistente(usuarioId);
  const datos = await validarDatos({ nombre, email, rol }, usuarioId);

  if (actual.rol === 'admin' && datos.rol !== 'admin') {
    if (usuarioId === adminId) throw new HttpError(409, 'No podés quitarte el rol de administrador');
    await asegurarOtroAdmin(actual);
  }
  return usuariosRepo.actualizar(usuarioId, datos);
}

async function resetearPassword(id, { password }) {
  const usuarioId = parsearId(id);
  await obtenerExistente(usuarioId);
  validarPassword(password);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await usuariosRepo.actualizarPassword(usuarioId, passwordHash);
}

async function cambiarEstado(adminId, id, { activo }) {
  const usuarioId = parsearId(id);
  if (typeof activo !== 'boolean') throw new HttpError(400, 'activo debe ser true o false');
  const actual = await obtenerExistente(usuarioId);

  if (!activo) {
    if (usuarioId === adminId) throw new HttpError(409, 'No podés desactivarte a vos mismo');
    await asegurarOtroAdmin(actual);
  }
  return usuariosRepo.setActivo(usuarioId, activo);
}

async function eliminar(adminId, id) {
  const usuarioId = parsearId(id);
  if (usuarioId === adminId) throw new HttpError(409, 'No podés eliminarte a vos mismo');
  const actual = await obtenerExistente(usuarioId);
  await asegurarOtroAdmin(actual);
  await usuariosRepo.eliminar(usuarioId);
}

module.exports = { listar, crear, actualizar, resetearPassword, cambiarEstado, eliminar };
