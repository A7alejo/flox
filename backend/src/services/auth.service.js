// =====================================================================
// Servicio de autenticación.
// - Las contraseñas nunca se comparan ni se guardan en texto plano:
//   bcrypt.compare contra el hash guardado en la base.
// - El mensaje de error es el mismo si el email no existe o si la
//   contraseña es incorrecta, para no revelar qué emails son válidos.
// =====================================================================
const bcrypt = require('bcryptjs');
const usuariosRepo = require('../repositories/usuarios.repository');
const { firmarToken } = require('../utils/jwt');
const HttpError = require('../utils/HttpError');

const SALT_ROUNDS = 12;

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'Email y contraseña son obligatorios');
  }

  const usuario = await usuariosRepo.getByEmail(email);
  // Mismo mensaje tanto si el usuario no existe como si la contraseña
  // está mal: evita que alguien pueda "probar" qué emails existen.
  const credencialesInvalidas = () => new HttpError(401, 'Credenciales inválidas');

  if (!usuario) throw credencialesInvalidas();

  const passwordOk = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordOk) throw credencialesInvalidas();

  const token = firmarToken({ userId: usuario.id });

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  };
}

async function cambiarPassword(userId, { passwordActual, passwordNueva }) {
  if (!passwordNueva || passwordNueva.length < 8) {
    throw new HttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
  }

  const usuario = await usuariosRepo.getById(userId);
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');

  // Releemos con password_hash (getById no lo trae por diseño, lo buscamos
  // por email para obtener la fila completa).
  const usuarioCompleto = await usuariosRepo.getByEmail(usuario.email);
  const passwordOk = await bcrypt.compare(passwordActual, usuarioCompleto.password_hash);
  if (!passwordOk) throw new HttpError(401, 'La contraseña actual es incorrecta');

  const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
  await usuariosRepo.actualizarPassword(userId, nuevoHash);
}

async function obtenerPerfil(userId) {
  const usuario = await usuariosRepo.getById(userId);
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return usuario;
}

module.exports = { login, cambiarPassword, obtenerPerfil, SALT_ROUNDS };
