const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // Aumentado para 15 (conta requisições OPTIONS do CORS também)
    message: { message: 'Muitas tentativas de login. Tente novamente após 15 minutos.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: { message: 'Muitos cadastros realizados. Tente novamente após 1 hora.' }
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/verify', authController.verifySession);
router.post('/logout', authController.logout);
module.exports = router;
