const { Router } = require('express');

const authRoutes = require('./auth.routes');
const productosRoutes = require('./productos.routes');
const stockRoutes = require('./stock.routes');
const cajaRoutes = require('./caja.routes');
const enviosRoutes = require('./envios.routes');
const dashboardRoutes = require('./dashboard.routes');
const adminRoutes = require('./admin.routes');
const pushRoutes = require('./push.routes');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

// /auth maneja sus propias rutas públicas (login) y protegidas (me, password)
router.use('/auth', authRoutes);

// A partir de acá, todo exige sesión válida
router.use(requireAuth);

router.use('/productos', productosRoutes);
router.use('/stock', stockRoutes);
router.use('/caja', cajaRoutes);
router.use('/envios', enviosRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/push', pushRoutes);
router.use('/admin', adminRoutes); // solo rol admin (ver admin.routes.js)

module.exports = router;
