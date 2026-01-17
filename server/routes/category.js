const express = require('express');
const router = express.Router();
const { create, list, remove, update } = require('../controllers/category');
const { authCheck, adminCheck, sellerCheck } = require('../middlewares/authCheck');
const { uploadCategoryImage } = require('../middlewares/upload');

// Public routes
router.get('/category', list);

// Admin and Seller routes
router.post('/category', authCheck, sellerCheck, uploadCategoryImage, create); // post - allow admin and seller
router.put('/category/:id', authCheck, sellerCheck, uploadCategoryImage, update); // put - allow admin and seller
router.delete('/category/:id', authCheck, adminCheck, remove); // delete - admin only


module.exports = router;