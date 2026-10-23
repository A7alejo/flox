const { Router } = require('express');
const controller = require('../controllers/caja.controller');

const router = Router();

router.get('/movimientos', controller.listarMovimientos);
router.get('/balance', controller.getBalance);
router.post('/ventas', controller.registrarVenta);
router.post('/egresos', controller.registrarEgreso);

module.exports = router;
