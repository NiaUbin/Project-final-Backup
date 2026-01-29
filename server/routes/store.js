const express = require('express');
const router = express.Router();
const { authCheck, sellerCheck, adminCheck } = require('../middlewares/authCheck');
const {
    createStore,
    getMyStore,
    listStores,
    getStore,
    updateMyStore,
    getStoreSales,
    getStoreOrders,
    updateStoreOrderStatus,
    listPendingStores,
    listAllStoresAdmin,
    approveStore,
    rejectStore,
    updateStoreStatusByAdmin,
    deleteStoreByAdmin,
    updateStoreByAdmin
} = require('../controllers/store');

// Public
router.get('/stores', listStores);
router.get('/store/:id', getStore);

// Authenticated
router.post('/store', authCheck, createStore);
router.get('/my/store', authCheck, getMyStore); // Removed sellerCheck to allow checking pending status
router.put('/my/store', authCheck, sellerCheck, updateMyStore);
router.get('/my/store/sales', authCheck, sellerCheck, getStoreSales);
router.get('/my/store/orders', authCheck, sellerCheck, getStoreOrders);
router.put('/my/store/orders/:orderId/status', authCheck, sellerCheck, updateStoreOrderStatus);

// Admin Routes
router.get('/admin/stores/pending', authCheck, adminCheck, listPendingStores);
router.get('/admin/stores', authCheck, adminCheck, listAllStoresAdmin);
router.put('/admin/store/approve/:id', authCheck, adminCheck, approveStore);
router.put('/admin/store/reject/:id', authCheck, adminCheck, rejectStore);
router.put('/admin/store/:id/status', authCheck, adminCheck, updateStoreStatusByAdmin);
router.put('/admin/store/:id', authCheck, adminCheck, updateStoreByAdmin);
router.delete('/admin/store/:id', authCheck, adminCheck, deleteStoreByAdmin);

module.exports = router;
