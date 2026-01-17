const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getPendingApprovals,
    getNewProductNotifications
} = require('../controllers/notification');
const { authCheck, adminCheck } = require('../middlewares/authCheck');

// Public routes (ไม่ต้อง login) - สำหรับดูสินค้าใหม่
// Path: /api/notifications/new-products
router.get('/new-products', getNewProductNotifications);

// User routes (ต้อง login)
// Path: /api/notifications
router.get('/', authCheck, getUserNotifications);

// Path: /api/notifications/:id/read
router.put('/:id/read', authCheck, markAsRead);

// Path: /api/notifications/read-all
router.put('/read-all', authCheck, markAllAsRead);

// Admin routes (ต้องเป็น admin)
// Path: /api/notifications/admin/pending
router.get('/admin/pending', authCheck, adminCheck, getPendingApprovals);

module.exports = router;

