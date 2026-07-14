const express = require('express');
const router = express.Router();
const controller = require('../controllers/adsController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', controller.getAds);
router.post('/', controller.createAd);
router.put('/:id', controller.updateAd);
router.delete('/:id', controller.deactivateAd);

module.exports = router;
