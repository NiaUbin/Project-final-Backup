const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์ถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../uploads/payment-slips');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// กำหนดการเก็บไฟล์
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // สร้างชื่อไฟล์ที่ไม่ซ้ำ
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'slip-' + uniqueSuffix + ext);
    }
});

// กรองไฟล์ที่อนุญาต
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)'), false);
    }
};

// สร้าง multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // จำกัดไฟล์ 5MB
        files: 1 // จำกัด 1 ไฟล์ต่อครั้ง
    }
});

// Middleware สำหรับอัพโหลดไฟล์เดียว
const uploadPaymentSlip = upload.single('slip');

// Middleware แก้ไข error
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'ไฟล์รูปภาพใหญ่เกินไป (จำกัด 5MB)',
                error: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'อัพโหลดได้เพียง 1 ไฟล์ต่อครั้ง',
                error: 'TOO_MANY_FILES'
            });
        }
    }
    
    if (err.message && err.message.includes('รองรับเฉพาะไฟล์รูปภาพ')) {
        return res.status(400).json({
            message: err.message,
            error: 'INVALID_FILE_TYPE'
        });
    }
    
    next(err);
};

module.exports = {
    uploadPaymentSlip,
    handleUploadError
};

