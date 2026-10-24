const { Router } = require('express');
const controller = require('../controllers/caja.controller');

const router = Router();

router.get('/movimientos', controller.listarMovimientos);
router.get('/balance', controller.getBalance);
router.get('/ventas', controller.listarVentas); // ?estado=pendiente|pagada
router.post('/ventas', controller.registrarVenta);
router.post('/ventas/:id/cobrar', controller.cobrarVenta); // pendiente -> pagada
router.post('/egresos', controller.registrarEgreso);

// Borrar desde el historial (admin y operador): una venta revierte caja + stock;
// un gasto solo sale de caja.
router.delete('/ventas/:id', controller.eliminarVenta);
router.delete('/movimientos/:id', controller.eliminarDelHistorial);

module.exports = router;
