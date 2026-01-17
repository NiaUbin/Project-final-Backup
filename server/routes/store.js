const express = require('express');
const router = express.Router();
const { authCheck, sellerCheck } = require('../middlewares/authCheck');
const { createStore, getMyStore, listStores, getStore, updateMyStore, getStoreSales, getStoreOrders, updateStoreOrderStatus } = require('../controllers/store');

// Public
router.get('/stores', listStores);
router.get('/store/:id', getStore);

// Authenticated
router.post('/store', authCheck, createStore);
router.get('/my/store', authCheck, sellerCheck, getMyStore);
router.put('/my/store', authCheck, sellerCheck, updateMyStore);
router.get('/my/store/sales', authCheck, sellerCheck, getStoreSales); // ดึงข้อมูลการขาย
router.get('/my/store/orders', authCheck, sellerCheck, getStoreOrders); // ดึง orders ของร้าน
router.put('/my/store/orders/:orderId/status', authCheck, sellerCheck, updateStoreOrderStatus); // อัพเดตสถานะ order

module.exports = router;


