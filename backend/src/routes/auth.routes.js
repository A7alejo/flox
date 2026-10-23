const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');
const loginRateLimiter = require('../middlewares/loginRateLimiter');

const router = Router();

// Públicas (sin requireAuth, porque son las que establecen la sesión)
router.post('/login', loginRateLimiter, controller.login);
router.post('/logout', controller.logout);

// Protegidas
router.get('/me', requireAuth, controller.me);
router.put('/password', requireAuth, controller.cambiarPassword);

module.exports = router;
