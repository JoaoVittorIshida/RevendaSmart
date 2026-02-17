const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

// Categorias
router.get('/categorias', dataController.getCategorias);
router.post('/categorias', dataController.createCategoria);
router.delete('/categorias/:id', dataController.deleteCategoria);

// Canais Venda
router.get('/canais-venda', dataController.getCanaisVenda);
router.post('/canais-venda', dataController.createCanalVenda);
router.delete('/canais-venda/:id', dataController.deleteCanalVenda);

// Canais Compra
router.get('/canais-compra', dataController.getCanaisCompra);
router.post('/canais-compra', dataController.createCanalCompra);
router.delete('/canais-compra/:id', dataController.deleteCanalCompra);

module.exports = router;
