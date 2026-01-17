const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// ใช้ memory storage เพื่อเก็บไฟล์ใน memory ชั่วคราวก่อนอัพโหลดไป Cloudinary
const storage = multer.memoryStorage();

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
        files: 5 // จำกัด 5 ไฟล์ต่อครั้ง
    }
});

// ฟังก์ชันอัพโหลดไฟล์ไปยัง Cloudinary
const uploadToCloudinary = (buffer, folder = 'products') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        
        // สร้าง stream จาก buffer
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

// Middleware สำหรับอัพโหลดหลายไฟล์ไปยัง Cloudinary
const uploadProductImages = async (req, res, next) => {
    try {
        // ใช้ multer เพื่อ parse files
        const multerMiddleware = upload.array('images', 5);
        
        multerMiddleware(req, res, async (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            
            // ถ้ามีไฟล์ที่อัพโหลด ให้อัพโหลดไปยัง Cloudinary
            if (req.files && req.files.length > 0) {
                try {
                    const cloudinaryResults = await Promise.all(
                        req.files.map(file => uploadToCloudinary(file.buffer, 'products'))
                    );
                    
                    // แปลงผลลัพธ์จาก Cloudinary ให้เป็นรูปแบบเดียวกับ multer
                    req.files = cloudinaryResults.map((result, index) => ({
                        fieldname: req.files[index].fieldname,
                        originalname: req.files[index].originalname,
                        encoding: req.files[index].encoding,
                        mimetype: req.files[index].mimetype,
                        size: req.files[index].size,
                        filename: result.public_id,
                        url: result.secure_url,
                        asset_id: result.asset_id,
                        public_id: result.public_id,
                        cloudinary: result
                    }));
                    
                    console.log(`✅ อัพโหลด ${req.files.length} ไฟล์ไปยัง Cloudinary สำเร็จ`);
                    next();
                } catch (cloudinaryError) {
                    console.error('❌ เกิดข้อผิดพลาดในการอัพโหลดไปยัง Cloudinary:', cloudinaryError);
                    return res.status(500).json({
                        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
                        error: 'CLOUDINARY_UPLOAD_ERROR'
                    });
                }
            } else {
                next();
            }
        });
    } catch (error) {
        next(error);
    }
};

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
                message: 'อัพโหลดได้สูงสุด 5 รูปต่อครั้ง',
                error: 'TOO_MANY_FILES'
            });
        }
    }
    
    if (err.message.includes('รองรับเฉพาะไฟล์รูปภาพ')) {
        return res.status(400).json({
            message: err.message,
            error: 'INVALID_FILE_TYPE'
        });
    }
    
    next(err);
};

// Middleware สำหรับอัพโหลดรูปภาพหมวดหมู่เดียวไปยัง Cloudinary
const uploadCategoryImage = async (req, res, next) => {
    try {
        // ใช้ multer เพื่อ parse file
        const multerMiddleware = upload.single('image');
        
        multerMiddleware(req, res, async (err) => {
            if (err) {
                return handleUploadError(err, req, res, next);
            }
            
            // ถ้ามีไฟล์ที่อัพโหลด ให้อัพโหลดไปยัง Cloudinary
            if (req.file) {
                try {
                    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'categories');
                    
                    // เพิ่มข้อมูล Cloudinary ลงใน req.file
                    req.file.cloudinary = cloudinaryResult;
                    req.file.url = cloudinaryResult.secure_url;
                    req.file.public_id = cloudinaryResult.public_id;
                    req.file.asset_id = cloudinaryResult.asset_id;
                    
                    console.log(`✅ อัพโหลดรูปภาพหมวดหมู่ไปยัง Cloudinary สำเร็จ: ${cloudinaryResult.secure_url}`);
                    next();
                } catch (cloudinaryError) {
                    console.error('❌ เกิดข้อผิดพลาดในการอัพโหลดรูปภาพหมวดหมู่ไปยัง Cloudinary:', cloudinaryError);
                    return res.status(500).json({
                        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ',
                        error: 'CLOUDINARY_UPLOAD_ERROR'
                    });
                }
            } else {
                // ถ้าไม่มีไฟล์ ให้ผ่านไป (อาจจะใช้ URL แทน)
                next();
            }
        });
    } catch (error) {
        next(error);
    }
};

// ฟังก์ชันดึง public_id จาก Cloudinary URL
const extractPublicIdFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // ตรวจสอบว่าเป็น Cloudinary URL หรือไม่
    if (!url.includes('cloudinary.com')) return null;
    
    try {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{ext}
        // หรือ: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        
        if (uploadIndex === -1) return null;
        
        // หา public_id หลังจาก 'upload'
        // อาจมี version number (v1234567890) หรือไม่มี
        let publicIdParts = [];
        for (let i = uploadIndex + 1; i < urlParts.length; i++) {
            const part = urlParts[i];
            // ข้าม version number ถ้ามี
            if (part.startsWith('v') && /^v\d+$/.test(part)) {
                continue;
            }
            publicIdParts.push(part);
        }
        
        if (publicIdParts.length === 0) return null;
        
        // รวม public_id และลบ extension
        let publicId = publicIdParts.join('/');
        // ลบ extension (.jpg, .png, etc.)
        publicId = publicId.replace(/\.[^/.]+$/, '');
        
        return publicId;
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการดึง public_id จาก URL:', error);
        return null;
    }
};

// ฟังก์ชันลบไฟล์จาก Cloudinary
const deleteFile = async (publicId) => {
    try {
        if (publicId) {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result === 'ok') {
                console.log(`✅ ลบไฟล์จาก Cloudinary สำเร็จ: ${publicId}`);
                return true;
            } else {
                console.warn(`⚠️ ไม่สามารถลบไฟล์จาก Cloudinary: ${publicId}`, result);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการลบไฟล์จาก Cloudinary:', error);
    }
    return false;
};

// ฟังก์ชันลบไฟล์จาก Cloudinary โดยใช้ URL
const deleteFileByUrl = async (url) => {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
        console.warn(`⚠️ ไม่สามารถดึง public_id จาก URL: ${url}`);
        return false;
    }
    return await deleteFile(publicId);
};

module.exports = {
    uploadProductImages,
    uploadCategoryImage,
    handleUploadError,
    deleteFile,
    deleteFileByUrl,
    extractPublicIdFromUrl
};
