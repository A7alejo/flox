const { Router } = require('express');
const controller = require('../controllers/envios.controller');

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id/estado', controller.actualizarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
