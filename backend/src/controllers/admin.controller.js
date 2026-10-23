const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');

const listarUsuarios = asyncHandler(async (req, res) => {
  const usuarios = await adminService.listar();
  res.json(usuarios);
});

const crearUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const usuario = await adminService.crear({ nombre, email, password, rol });
  res.status(201).json(usuario);
});

const actualizarUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, rol } = req.body;
  const usuario = await adminService.actualizar(req.usuarioId, req.params.id, { nombre, email, rol });
  res.json(usuario);
});

const resetearPassword = asyncHandler(async (req, res) => {
  await adminService.resetearPassword(req.params.id, { password: req.body.password });
  res.status(204).send();
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const usuario = await adminService.cambiarEstado(req.usuarioId, req.params.id, {
    activo: req.body.activo,
  });
  res.json(usuario);
});

const eliminarUsuario = asyncHandler(async (req, res) => {
  await adminService.eliminar(req.usuarioId, req.params.id);
  res.status(204).send();
});

module.exports = {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarEstado,
  eliminarUsuario,
};
