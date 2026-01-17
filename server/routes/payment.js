const express = require('express');
const router = express.Router();
const { 
    createPayment, 
    getPayments, 
    getPayment, 
    paymentWebhook,
    getAllPayments,
    generatePromptPayQR,
    approvePayment,
    rejectPayment,
    uploadPaymentSlip
} = require('../controllers/payment');
const { authCheck, adminCheck } = require('../middlewares/authCheck');
const { uploadPaymentSlip: uploadSlip, handleUploadError } = require('../middlewares/uploadPaymentSlip');

// Public routes (webhook ไม่ต้องใช้ auth)
router.post('/webhook/payment', paymentWebhook);

// User routes (ต้อง login)
router.post('/payment', authCheck, createPayment);
router.get('/payments', authCheck, getPayments);
router.get('/payment/:id', authCheck, getPayment);
router.get('/payment/:paymentId/promptpay', authCheck, generatePromptPayQR);
router.post('/payment/:paymentId/upload-slip', authCheck, uploadSlip, handleUploadError, uploadPaymentSlip);

// Admin routes (ต้องเป็น admin)
router.get('/admin/payments', authCheck, adminCheck, getAllPayments);
router.put('/admin/payment/:paymentId/approve', authCheck, adminCheck, approvePayment);
router.put('/admin/payment/:paymentId/reject', authCheck, adminCheck, rejectPayment);

module.exports = router;
