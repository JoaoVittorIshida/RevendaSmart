const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/adminController');
const { adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas consultas administrativas. Tente novamente em instantes.' }
});

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' }
});

router.use(adminOnly);
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
router.get('/resumo', readLimiter, controller.getSummary);
router.get('/usuarios', readLimiter, controller.getUsers);
router.patch('/usuarios/:id/senha', passwordResetLimiter, controller.resetUserPassword);

module.exports = router;
