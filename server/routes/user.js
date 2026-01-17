const express = require('express');
const router = express.Router();
const { 
    listUsers, 
    changeStatus, 
    changeRole, 
    deleteUser,        // DELETE - ลบผู้ใช้ (Admin only)
    userCart,          // POST - เพิ่มสินค้าลงตะกร้า
    getUserCart,       // GET - ดึงข้อมูลตะกร้า
    emptyCart,         // DELETE - ล้างตะกร้า
    updateCartItemQuantity, // PUT - อัพเดตจำนวนสินค้าในตะกร้า
    removeCartItem,    // DELETE - ลบสินค้าชิ้นเดียวออกจากตะกร้า
    saveAddress,       // POST - บันทึกที่อยู่
    updateProfile,     // POST - อัพเดตข้อมูล profile (ชื่อและที่อยู่)
    changePassword,    // POST - เปลี่ยนรหัสผ่าน
    saveOrder,         // POST - สร้างคำสั่งซื้อ
    getOrder,          // GET - ดึงคำสั่งซื้อ
    getAllOrders,      // GET - ดึงคำสั่งซื้อทั้งหมด (Admin only)
    updateOrderStatus, // PUT - อัพเดตสถานะคำสั่งซื้อ (Admin only)
    deleteOrder,       // DELETE - ลบคำสั่งซื้อ (Admin only)
    getAnalytics,      // GET - ดึงข้อมูลวิเคราะห์ (Admin only)
    getProfile         // GET - ดึงข้อมูล profile (ผู้ใช้ที่ล็อกอิน)
} = require('../controllers/user');
    
const { authCheck, adminCheck } = require('../middlewares/authCheck');

router.get('/users',authCheck,adminCheck, listUsers);
router.post('/change-status', authCheck,adminCheck, changeStatus);
router.post('/change-role', authCheck,adminCheck, changeRole);
router.delete('/delete-user', authCheck,adminCheck, deleteUser);

router.post('/user/cart', authCheck, userCart);
router.get('/user/cart', authCheck, getUserCart);
router.delete('/user/cart', authCheck, emptyCart);
router.put('/user/cart/quantity', authCheck, updateCartItemQuantity);
router.delete('/user/cart/item', authCheck, removeCartItem);

router.post('/user/address', authCheck, saveAddress);
router.post('/user/update-profile', authCheck, updateProfile);
router.post('/user/change-password', authCheck, changePassword);
router.get('/user/profile', authCheck, getProfile);  // GET profile แยกจากการอัพเดต

router.post('/user/order', authCheck, saveOrder);
router.get('/user/order', authCheck, getOrder);
router.get('/user/orders', authCheck, getOrder);  // เพิ่ม route สำหรับ /user/orders

// Admin routes for orders
router.get('/admin/orders', authCheck, adminCheck, getAllOrders);
router.put('/admin/orders/:orderId/status', authCheck, adminCheck, updateOrderStatus);
router.delete('/admin/orders/:orderId', authCheck, adminCheck, deleteOrder);

// Admin routes for analytics
router.get('/admin/analytics', authCheck, adminCheck, getAnalytics);

module.exports = router;