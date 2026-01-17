const prisma = require('../config/prisma');
const { deleteFileByUrl } = require('../middlewares/upload');

// สร้างหมวดหมู่ใหม่
exports.create = async (req, res) => {
    try {
        console.log('📥 Category create request:', {
            body: req.body,
            hasFile: !!req.file,
            fileInfo: req.file ? { fieldname: req.file.fieldname, size: req.file.size } : null
        });
        
        const { name, image, subcategories } = req.body;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name) {
            return res.status(400).json({ message: "กรุณาระบุชื่อหมวดหมู่" });
        }

        // ถ้ามีการอัพโหลดไฟล์ ให้ใช้ URL จาก Cloudinary
        let finalImageUrl = image || null;
        if (req.file && req.file.url) {
            finalImageUrl = req.file.url;
            console.log('✅ ใช้รูปภาพจาก Cloudinary:', finalImageUrl);
        }

        // Parse subcategories (อาจเป็น JSON string หรือ array)
        let parsedSubcategories = [];
        if (subcategories) {
            try {
                if (typeof subcategories === 'string') {
                    parsedSubcategories = JSON.parse(subcategories);
                } else if (Array.isArray(subcategories)) {
                    parsedSubcategories = subcategories;
                }
            } catch (e) {
                console.warn('⚠️ ไม่สามารถ parse subcategories:', e);
            }
        }

        // เก็บ subcategories ใน image field เป็น JSON (ถ้าไม่มี image)
        let imageData = finalImageUrl || null;
        if (parsedSubcategories && Array.isArray(parsedSubcategories) && parsedSubcategories.length > 0) {
            const metadata = {
                image: finalImageUrl || null,
                subcategories: parsedSubcategories.filter(s => s && s.trim() !== '')
            };
            imageData = JSON.stringify(metadata);
        }

        const category = await prisma.category.create({
            data: {
                name,
                image: imageData
            }
        });
        
        // Parse subcategories from image field for response
        let parsedImage = category.image;
        let responseSubcategories = [];
        
        if (category.image) {
            try {
                const metadata = JSON.parse(category.image);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.subcategories && Array.isArray(metadata.subcategories)) {
                        responseSubcategories = metadata.subcategories;
                    }
                    if (metadata.image) {
                        parsedImage = metadata.image;
                    }
                }
            } catch (e) {
                // ถ้าไม่ใช่ JSON ใช้ image เดิม
                parsedImage = category.image;
            }
        }
        
        const categoryWithSubcategories = {
            ...category,
            image: parsedImage,
            subcategories: responseSubcategories
        };
        
        res.json({
            message: "สร้างหมวดหมู่สำเร็จ",
            category: categoryWithSubcategories
        });
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// ดึงรายการหมวดหมู่
exports.list = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        // Parse subcategories จาก image field
        const categoriesWithSubcategories = categories.map(cat => {
            let parsedImage = cat.image;
            let subcategories = [];
            
            if (cat.image) {
                try {
                    const metadata = JSON.parse(cat.image);
                    if (metadata && typeof metadata === 'object') {
                        if (metadata.subcategories && Array.isArray(metadata.subcategories)) {
                            subcategories = metadata.subcategories;
                        }
                        if (metadata.image) {
                            parsedImage = metadata.image;
                        }
                    }
                } catch (e) {
                    // ถ้าไม่ใช่ JSON ใช้ image เดิม
                    parsedImage = cat.image;
                }
            }
            
            return {
                ...cat,
                image: parsedImage,
                subcategories: subcategories
            };
        });
        
        res.json({
            message: "ดึงรายการหมวดหมู่สำเร็จ",
            categories: categoriesWithSubcategories
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงรายการหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// ลบหมวดหมู่
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ตรวจสอบว่าหมวดหมู่มีอยู่หรือไม่
        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ต้องการลบ" });
        }

        // ลบรูปภาพจาก Cloudinary ถ้ามี
        if (existingCategory.image) {
            try {
                // ตรวจสอบว่า image เป็น JSON string หรือ URL ธรรมดา
                let imageUrl = existingCategory.image;
                try {
                    const metadata = JSON.parse(existingCategory.image);
                    if (metadata && metadata.image) {
                        imageUrl = metadata.image;
                    }
                } catch (e) {
                    // ไม่ใช่ JSON ใช้ image เดิม
                }
                
                // ลบรูปภาพจาก Cloudinary
                if (imageUrl && imageUrl.includes('cloudinary.com')) {
                    await deleteFileByUrl(imageUrl);
                }
            } catch (cloudinaryError) {
                console.error('❌ เกิดข้อผิดพลาดในการลบรูปภาพจาก Cloudinary:', cloudinaryError);
                // ไม่ throw error เพื่อให้สามารถลบหมวดหมู่ได้แม้ว่าลบรูปไม่สำเร็จ
            }
        }

        const category = await prisma.category.delete({
            where: {
                id: parseInt(id)
            }
        });
        
        res.json({
            message: "ลบหมวดหมู่สำเร็จ",
            category
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// อัพเดตหมวดหมู่
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, subcategories } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: "กรุณาระบุชื่อหมวดหมู่" });
        }

        // ตรวจสอบว่าหมวดหมู่มีอยู่หรือไม่
        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข" });
        }

        // ถ้ามีการอัพโหลดไฟล์ใหม่ ให้ใช้ URL จาก Cloudinary
        let finalImageUrl = image || null;
        if (req.file && req.file.url) {
            finalImageUrl = req.file.url;
            console.log('✅ ใช้รูปภาพใหม่จาก Cloudinary:', finalImageUrl);
        }

        // Parse subcategories (อาจเป็น JSON string หรือ array)
        let parsedSubcategories = [];
        if (subcategories) {
            try {
                if (typeof subcategories === 'string') {
                    parsedSubcategories = JSON.parse(subcategories);
                } else if (Array.isArray(subcategories)) {
                    parsedSubcategories = subcategories;
                }
            } catch (e) {
                console.warn('⚠️ ไม่สามารถ parse subcategories:', e);
            }
        }

        // เก็บ subcategories ใน image field เป็น JSON
        let imageData = finalImageUrl || null;
        if (parsedSubcategories && Array.isArray(parsedSubcategories) && parsedSubcategories.length > 0) {
            const metadata = {
                image: finalImageUrl || null,
                subcategories: parsedSubcategories.filter(s => s && s.trim() !== '')
            };
            imageData = JSON.stringify(metadata);
        } else if (finalImageUrl !== undefined) {
            // ถ้ามี image แต่ไม่มี subcategories เก็บ image ธรรมดา
            imageData = finalImageUrl || null;
        }

        // สร้าง object สำหรับ update
        const updateData = { name };
        if (imageData !== undefined) {
            updateData.image = imageData;
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        
        // Parse subcategories from image field for response
        let parsedImage = category.image;
        let responseSubcategories = [];
        
        if (category.image) {
            try {
                const metadata = JSON.parse(category.image);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.subcategories && Array.isArray(metadata.subcategories)) {
                        responseSubcategories = metadata.subcategories;
                    }
                    if (metadata.image) {
                        parsedImage = metadata.image;
                    }
                }
            } catch (e) {
                // ถ้าไม่ใช่ JSON ใช้ image เดิม
                parsedImage = category.image;
            }
        }
        
        const categoryWithSubcategories = {
            ...category,
            image: parsedImage,
            subcategories: responseSubcategories
        };
        
        res.json({
            message: "อัพเดตหมวดหมู่สำเร็จ",
            category: categoryWithSubcategories
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพเดตหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
