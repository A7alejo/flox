const { Router } = require('express');
const controller = require('../controllers/caja.controller');

const router = Router();

router.get('/movimientos', controller.listarMovimientos);
router.get('/balance', controller.getBalance);
router.get('/ventas', controller.listarVentas); // ?estado=pendiente|pagada
router.post('/ventas', controller.registrarVenta);
router.post('/ventas/:id/cobrar', controller.cobrarVenta); // pendiente -> pagada
router.post('/egresos', controller.registrarEgreso);

module.exports = router;
