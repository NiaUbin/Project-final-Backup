const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck');
const reviewCtrl = require('../controllers/review');

// Create a review (authenticated)
router.post('/', authCheck, reviewCtrl.createReview);

// Product reviews (public)
router.get('/product/:productId', reviewCtrl.getProductReviews);

// Store reviews (public)
router.get('/store/:storeId', reviewCtrl.getStoreReviews);

// Delete review (authenticated - admin or store owner)
router.delete('/:reviewId', authCheck, reviewCtrl.deleteReview);

module.exports = router;


