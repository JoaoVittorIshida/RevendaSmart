const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', getAnalytics);

module.exports = router;
