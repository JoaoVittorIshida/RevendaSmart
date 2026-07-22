const express = require('express');
const router = express.Router();
const { getSales, markSaleReceived } = require('../controllers/salesController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', getSales);
router.patch('/:id/recebimento', markSaleReceived);

module.exports = router;
