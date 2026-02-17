const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', stockController.getStock);
router.post('/entrada', stockController.addStockBatch);
router.post('/:id/venda', stockController.sellItem);
router.delete('/:id', stockController.deleteStockItem);

module.exports = router;
