const express = require('express');
const router = express.Router();
const controller = require('../controllers/adsController');
const showcaseController = require('../controllers/showcaseController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/', controller.getAds);
router.get('/configuracao', showcaseController.getConfig);
router.patch('/configuracao', showcaseController.updateConfig);
router.patch('/publicacao', showcaseController.publishShowcase);
router.post('/', controller.createAd);
router.put('/:id', controller.updateAd);
router.delete('/:id', controller.deactivateAd);

module.exports = router;
