const express = require('express');
const router = express.Router();
const { create, list, remove, listby, searchFilters, update, read, deleteProduct, deleteProductImage, createBySeller, updateBySeller, deleteBySeller } = require('../controllers/product');
const { authCheck, adminCheck, sellerCheck } = require('../middlewares/authCheck');
const { uploadProductImages, handleUploadError } = require('../middlewares/upload'); 

// Public routes  
router.get('/product', list);           // รายการสินค้าทั้งหมด
router.get('/products/:count', list);   // รายการสินค้าตามจำนวน  
router.get('/product/:id', read);       // ข้อมูลสินค้า 1 รายการ
router.post('/productby', listby);      // รายการสินค้าตามเงื่อนไข
router.post('/search/filters', searchFilters); // ค้นหาสินค้า

// Admin only routes
router.post('/product', authCheck, adminCheck, uploadProductImages, handleUploadError, create);
router.put('/product/:id', authCheck, adminCheck, uploadProductImages, handleUploadError, update);
router.delete('/product/:id', authCheck, adminCheck, remove);
router.delete('/admin/product/:id', authCheck, adminCheck, deleteProduct);
router.delete('/admin/product/:productId/image/:imageId', authCheck, adminCheck, deleteProductImage);

// Seller endpoints
router.post('/seller/product', authCheck, sellerCheck, uploadProductImages, handleUploadError, createBySeller);
router.put('/seller/product/:id', authCheck, sellerCheck, uploadProductImages, handleUploadError, updateBySeller);
router.delete('/seller/product/:id', authCheck, sellerCheck, deleteBySeller);

module.exports = router;