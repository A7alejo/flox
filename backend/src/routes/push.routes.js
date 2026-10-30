const { Router } = require('express');
const controller = require('../controllers/push.controller');

const router = Router();

router.get('/clave', controller.obtenerClave); // clave pública para suscribirse
router.get('/suscripcion', controller.obtenerSuscripcion); // ?endpoint=...
router.post('/suscripcion', controller.guardarSuscripcion); // alta o cambio de avisos
router.delete('/suscripcion', controller.eliminarSuscripcion); // body: { endpoint }

module.exports = router;
