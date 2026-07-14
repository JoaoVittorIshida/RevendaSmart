const express = require('express');
const router = express.Router();
const { getSales } = require('../controllers/salesController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', getSales);

module.exports = router;
