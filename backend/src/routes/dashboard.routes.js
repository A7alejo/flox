const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');

const router = Router();

router.get('/resumen', controller.resumen);
router.get('/ingresos-egresos', controller.evolucion);
router.get('/medios-pago', controller.medioPago);
router.get('/stock-critico', controller.stockCritico);
router.get('/top-productos', controller.topProductos);

module.exports = router;
