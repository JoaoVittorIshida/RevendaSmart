const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/showcaseController');

const router = express.Router();
const publicReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas consultas. Tente novamente em instantes.' }
});

router.get('/:slug', publicReadLimiter, controller.getPublicShowcase);

module.exports = router;
