const { Router } = require('express');
const controller = require('../controllers/productos.controller');

const router = Router();

router.get('/calcular-precio', controller.calcularPrecio); // antes de /:id
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.darDeBaja); // baja lógica (se oculta, conserva historial)
router.delete('/:id/definitivo', controller.eliminar); // borrado real, solo sin historial

module.exports = router;
