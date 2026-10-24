const { Router } = require('express');
const controller = require('../controllers/stock.controller');

const router = Router();

router.get('/meses', controller.listarMeses); // un resumen por mes (cajones)
router.get('/meses/:anio/:mes', controller.detalleDelMes); // detalle por producto

module.exports = router;
