const express = require('express');
const router = express.Router();
const controller = require('../controllers/portabilityController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/estoque.csv', controller.exportStock);
router.get('/vendas.csv', controller.exportSales);
router.get('/backup.zip', controller.backup);
router.post('/importar/estoque', controller.importStock);

module.exports = router;
