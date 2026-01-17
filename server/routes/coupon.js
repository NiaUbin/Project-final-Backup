const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck');
const couponCtrl = require('../controllers/coupon');

// Get user coupons
router.get('/my-coupons', authCheck, couponCtrl.getUserCoupons);

// Validate coupon
router.post('/validate', authCheck, couponCtrl.validateCoupon);

// Create test coupon for current user
router.post('/create-test', authCheck, couponCtrl.createCouponForMe);

module.exports = router;

