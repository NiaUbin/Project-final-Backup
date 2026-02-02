
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { authCheck, adminCheck } = require('../middlewares/authCheck');

// Site Settings
router.get('/config/settings', adminController.getSiteSettings); // Public read for frontend
router.post('/config/settings', authCheck, adminCheck, adminController.updateSiteSettings);

// Banners
router.get('/config/banners', adminController.getBanners); // Public read
router.post('/config/banner', authCheck, adminCheck, adminController.createBanner);
router.put('/config/banner/:id', authCheck, adminCheck, adminController.updateBanner);
router.delete('/config/banner/:id', authCheck, adminCheck, adminController.deleteBanner);
router.patch('/config/banner/:id/status', authCheck, adminCheck, adminController.toggleBannerStatus);

module.exports = router;
