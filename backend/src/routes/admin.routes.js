const { Router } = require('express');
const controller = require('../controllers/admin.controller');
const requireAdmin = require('../middlewares/requireAdmin');

const router = Router();

// Todo el Panel de Admin exige rol admin (requireAuth ya corrió antes)
router.use(requireAdmin);

router.get('/usuarios', controller.listarUsuarios);
router.post('/usuarios', controller.crearUsuario);
router.put('/usuarios/:id', controller.actualizarUsuario);
router.put('/usuarios/:id/password', controller.resetearPassword);
router.patch('/usuarios/:id/estado', controller.cambiarEstado);
router.delete('/usuarios/:id', controller.eliminarUsuario);

module.exports = router;
