const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken); // Protege todas as rotas abaixo

router.get('/', productsController.getProducts);
router.post('/', productsController.createProduct);
router.put('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

module.exports = router;
