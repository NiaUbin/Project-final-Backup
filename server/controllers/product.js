const prisma = require('../config/prisma');
const path = require('path');
const { deleteFile } = require('../middlewares/upload');
const { notifyNewProduct } = require('./notification');

exports.create = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, discountPrice, discountStartDate, discountEndDate, variants, imageUrls } = req.body;
        const uploadedFiles = req.files || []; // ไฟล์ที่อัพโหลด

        // เก็บ variants ใน description field แบบ JSON string (ชั่วคราว)
        // Format: { "description": "รายละเอียด", "variants": [...] }
        let finalDescription = description || '';
        if (variants) {
            try {
                const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
                // ตรวจสอบว่า variants มีโครงสร้างถูกต้อง
                if (Array.isArray(variantsData) && variantsData.length > 0) {
                    // กรอง variants ที่มี name และ options ที่ถูกต้อง
                    const validVariants = variantsData.filter(v =>
                        v &&
                        v.name &&
                        typeof v.name === 'string' &&
                        v.name.trim() !== '' &&
                        v.options &&
                        Array.isArray(v.options) &&
                        v.options.length > 0
                    );

                    if (validVariants.length > 0) {
                        // Parse existing metadata to preserve productSubcategories and freeShipping
                        let metadata = {};
                        try {
                            const existingMeta = JSON.parse(finalDescription);
                            if (existingMeta && typeof existingMeta === 'object') {
                                metadata = { ...existingMeta };
                                if (metadata.description) {
                                    finalDescription = metadata.description;
                                }
                            }
                        } catch (e) {
                            // Not JSON, use description as is
                        }

                        metadata = {
                            description: finalDescription,
                            variants: validVariants,
                            ...(metadata.productSubcategories ? { productSubcategories: metadata.productSubcategories } : {}),
                            ...(metadata.freeShipping !== undefined ? { freeShipping: metadata.freeShipping } : {})
                        };
                        finalDescription = JSON.stringify(metadata);
                        console.log('Variants saved in create:', validVariants);
                    }
                }
            } catch (e) {
                console.error('Error parsing variants in create:', e);
            }
        }

        // สร้างสินค้าก่อน
        const product = await prisma.product.create({
            data: {
                title,
                description: finalDescription,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
                discountEndDate: discountEndDate ? new Date(discountEndDate) : null
            }
        });

        // เพิ่มรูปภาพถ้ามีการอัพโหลด (จาก Cloudinary)
        if (uploadedFiles.length > 0) {
            const imageData = uploadedFiles.map(file => ({
                asset_id: file.asset_id || `product_${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                public_id: file.public_id || file.filename.split('.')[0],
                url: file.url || file.secure_url,
                secure_url: file.secure_url || file.url,
                productId: product.id
            }));

            await prisma.image.createMany({
                data: imageData
            });
        }

        // เพิ่มรูปภาพจาก URL ถ้ามี
        if (imageUrls) {
            try {
                const urlArray = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
                if (Array.isArray(urlArray) && urlArray.length > 0) {
                    const urlImageData = urlArray.map((url, index) => ({
                        asset_id: `product_${product.id}_url_${Date.now()}_${index}`,
                        public_id: `product_${product.id}_url_${index}`,
                        url: url,
                        secure_url: url,
                        productId: product.id
                    }));

                    await prisma.image.createMany({
                        data: urlImageData
                    });
                    console.log('✅ Added', urlArray.length, 'images from URLs');
                }
            } catch (e) {
                console.error('Error parsing imageUrls:', e);
            }
        }

        // ดึงข้อมูลสินค้าที่สร้างแล้วพร้อมรูปภาพและ relations
        const createdProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        // Parse variants จาก description
        let parsedDescription = createdProduct.description || '';
        let parsedVariants = null;

        if (createdProduct.description) {
            try {
                const metadata = JSON.parse(createdProduct.description);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.description && metadata.variants) {
                        parsedDescription = metadata.description;
                        parsedVariants = metadata.variants;
                    } else if (metadata.variants && Array.isArray(metadata.variants)) {
                        parsedVariants = metadata.variants;
                    }
                }
            } catch (e) {
                // Not JSON format, use description as is
            }
        }

        // Add variants to product object
        const productWithVariants = {
            ...createdProduct,
            description: parsedDescription,
            variants: parsedVariants || []
        };

        console.log('✅ Product created with variants:', {
            productId: productWithVariants.id,
            variantsCount: parsedVariants ? parsedVariants.length : 0,
            variants: parsedVariants
        });

        res.status(200).json({ message: "สินค้าได้ถูกสร้างสำเร็จ", product: productWithVariants });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// Seller create product (assign to seller's store)
exports.createBySeller = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, discountPrice, discountStartDate, discountEndDate, variants, imageUrls } = req.body;
        const uploadedFiles = req.files || [];

        // find seller store
        const store = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
        if (!store) return res.status(400).json({ message: 'กรุณาสร้างร้านค้าก่อนเพิ่มสินค้า' });

        // เก็บ variants, productSubcategories, และ freeShipping ใน description field แบบ JSON string
        let finalDescription = description || '';
        let metadata = {};

        // Parse description ที่ส่งมา (อาจจะเป็น JSON string ที่มี productSubcategories และ freeShipping)
        try {
            const incomingMeta = JSON.parse(description || '{}');
            if (incomingMeta && typeof incomingMeta === 'object') {
                metadata = { ...incomingMeta };
                if (metadata.description) {
                    finalDescription = metadata.description;
                }
            }
        } catch (e) {
            // Not JSON, use description as is
            finalDescription = description || '';
        }

        if (variants) {
            try {
                const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
                // ตรวจสอบว่า variants มีโครงสร้างถูกต้อง
                if (Array.isArray(variantsData) && variantsData.length > 0) {
                    // กรอง variants ที่มี name และ options ที่ถูกต้อง
                    const validVariants = variantsData.filter(v =>
                        v &&
                        v.name &&
                        typeof v.name === 'string' &&
                        v.name.trim() !== '' &&
                        v.options &&
                        Array.isArray(v.options) &&
                        v.options.length > 0
                    );

                    if (validVariants.length > 0) {
                        metadata = {
                            description: finalDescription,
                            variants: validVariants,
                            ...(metadata.productSubcategories ? { productSubcategories: metadata.productSubcategories } : {}),
                            ...(metadata.freeShipping !== undefined ? { freeShipping: metadata.freeShipping } : {})
                        };
                        finalDescription = JSON.stringify(metadata);
                        console.log('Variants saved in createBySeller:', validVariants);
                    } else {
                        // ถ้าไม่มี valid variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                        if (Object.keys(metadata).length > 0) {
                            metadata.description = finalDescription;
                            finalDescription = JSON.stringify(metadata);
                        }
                    }
                } else {
                    // ถ้าไม่มี variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                    if (Object.keys(metadata).length > 0) {
                        metadata.description = finalDescription;
                        finalDescription = JSON.stringify(metadata);
                    }
                }
            } catch (e) {
                console.error('Error parsing variants in createBySeller:', e);
                // ถ้า parse variants ผิดพลาด แต่มี metadata อื่น ให้เก็บ metadata ไว้
                if (Object.keys(metadata).length > 0) {
                    metadata.description = finalDescription;
                    finalDescription = JSON.stringify(metadata);
                }
            }
        } else {
            // ถ้าไม่มี variants แต่มี metadata อื่น (เช่น productSubcategories, freeShipping) ให้เก็บ metadata ไว้
            if (Object.keys(metadata).length > 0) {
                metadata.description = finalDescription;
                finalDescription = JSON.stringify(metadata);
                console.log('✅ Metadata saved in createBySeller (no variants):', Object.keys(metadata));
            }
        }

        const product = await prisma.product.create({
            data: {
                title,
                description: finalDescription,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                storeId: store.id,
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
                discountEndDate: discountEndDate ? new Date(discountEndDate) : null
            }
        });

        if (uploadedFiles.length > 0) {
            const imageData = uploadedFiles.map(file => ({
                asset_id: file.asset_id || `product_${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                public_id: file.public_id || file.filename.split('.')[0],
                url: file.url || file.secure_url,
                secure_url: file.secure_url || file.url,
                productId: product.id
            }));

            await prisma.image.createMany({ data: imageData });
        }

        // เพิ่มรูปภาพจาก URL ถ้ามี
        if (imageUrls) {
            try {
                const urlArray = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
                if (Array.isArray(urlArray) && urlArray.length > 0) {
                    const urlImageData = urlArray.map((url, index) => ({
                        asset_id: `product_${product.id}_url_${Date.now()}_${index}`,
                        public_id: `product_${product.id}_url_${index}`,
                        url: url,
                        secure_url: url,
                        productId: product.id
                    }));

                    await prisma.image.createMany({
                        data: urlImageData
                    });
                    console.log('✅ Added', urlArray.length, 'images from URLs (createBySeller)');
                }
            } catch (e) {
                console.error('Error parsing imageUrls in createBySeller:', e);
            }
        }

        // ดึงข้อมูลสินค้าที่สร้างแล้วพร้อมรูปภาพและ relations
        const createdProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        // Parse variants จาก description
        let parsedDescription = createdProduct.description || '';
        let parsedVariants = null;

        if (createdProduct.description) {
            try {
                const metadata = JSON.parse(createdProduct.description);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.description && metadata.variants) {
                        parsedDescription = metadata.description;
                        parsedVariants = metadata.variants;
                    } else if (metadata.variants && Array.isArray(metadata.variants)) {
                        parsedVariants = metadata.variants;
                    }
                }
            } catch (e) {
                // Not JSON format, use description as is
            }
        }

        // Add variants to product object
        const productWithVariants = {
            ...createdProduct,
            description: parsedDescription,
            variants: parsedVariants || []
        };

        console.log('✅ Product created by seller with variants:', {
            productId: productWithVariants.id,
            variantsCount: parsedVariants ? parsedVariants.length : 0,
            variants: parsedVariants
        });

        // ส่งแจ้งเตือนสินค้าใหม่ให้ผู้ใช้ทุกคน
        try {
            await notifyNewProduct(createdProduct, store);
        } catch (notifyError) {
            console.error('Error sending new product notification:', notifyError);
            // ไม่ throw error เพื่อให้การสร้างสินค้ายังสำเร็จ
        }

        res.status(201).json({ message: 'เพิ่มสินค้าในร้านค้าสำเร็จ', product: productWithVariants });
    } catch (error) {
        console.error('createBySeller error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

exports.list = async (req, res) => {
    try {
        const { count } = req.params;
        const products = await prisma.product.findMany({
            take: count ? parseInt(count) : undefined, // ถ้าไม่มี count ให้เอาทั้งหมด
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        // Parse variants and productSubcategories from description for each product
        const productsWithVariants = products.map(product => {
            let parsedDescription = product.description || '';
            let parsedVariants = null;
            let parsedProductSubcategories = [];
            let parsedFreeShipping = false;

            if (product.description) {
                try {
                    const metadata = JSON.parse(product.description);
                    if (metadata && typeof metadata === 'object') {
                        // Parse description
                        if (metadata.description) {
                            parsedDescription = metadata.description;
                        }
                        // Parse variants
                        if (metadata.variants && Array.isArray(metadata.variants)) {
                            parsedVariants = metadata.variants;
                        }
                        // Parse productSubcategories
                        if (metadata.productSubcategories && Array.isArray(metadata.productSubcategories)) {
                            parsedProductSubcategories = metadata.productSubcategories;
                        }
                        // Parse freeShipping
                        if (metadata.freeShipping === true) {
                            parsedFreeShipping = true;
                        }
                    }
                } catch (e) {
                    // Not JSON format, use description as is
                }
            }

            return {
                ...product,
                description: parsedDescription,
                variants: parsedVariants || [], // ใช้ array ว่างแทน null
                productSubcategories: parsedProductSubcategories,
                freeShipping: parsedFreeShipping
            };
        });

        res.status(200).json({ message: "สินค้าได้ถูกดึงสำเร็จ", products: productsWithVariants });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างหมวดหมู่:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

exports.read = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        // Parse variants, productSubcategories, and freeShipping from description if exists
        let parsedDescription = product.description || '';
        let parsedVariants = null;
        let parsedProductSubcategories = [];
        let parsedFreeShipping = false;

        if (product.description) {
            try {
                const metadata = JSON.parse(product.description);
                if (metadata && typeof metadata === 'object') {
                    // Parse description
                    if (metadata.description) {
                        parsedDescription = metadata.description;
                    }
                    // Parse variants
                    if (metadata.variants && Array.isArray(metadata.variants)) {
                        parsedVariants = metadata.variants;
                    }
                    // Parse productSubcategories
                    if (metadata.productSubcategories && Array.isArray(metadata.productSubcategories)) {
                        parsedProductSubcategories = metadata.productSubcategories;
                    }
                    // Parse freeShipping
                    if (metadata.freeShipping === true) {
                        parsedFreeShipping = true;
                    }
                }
            } catch (e) {
                // Not JSON format, use description as is
                console.log('Description is not JSON format, using as is:', e.message);
            }
        }

        // Validate variants structure
        if (parsedVariants && Array.isArray(parsedVariants)) {
            parsedVariants = parsedVariants.filter(v =>
                v &&
                v.name &&
                typeof v.name === 'string' &&
                v.name.trim() !== '' &&
                v.options &&
                Array.isArray(v.options) &&
                v.options.length > 0
            );
        }

        // Add variants, productSubcategories, and freeShipping to product object
        const productWithVariants = {
            ...product,
            description: parsedDescription,
            variants: parsedVariants || [], // ใช้ array ว่างแทน null เพื่อให้ frontend ตรวจสอบได้ง่าย
            productSubcategories: parsedProductSubcategories,
            freeShipping: parsedFreeShipping
        };

        console.log('=== Product Read Debug ===');
        console.log('Product ID:', product.id);
        console.log('Product Title:', product.title);
        console.log('Raw Description Length:', product.description ? product.description.length : 0);
        console.log('Raw Description Preview:', product.description ? product.description.substring(0, 200) : 'empty');
        console.log('Is Description JSON?', product.description ? (product.description.trim().startsWith('{') || product.description.trim().startsWith('[')) : false);
        console.log('Parsed Description:', parsedDescription ? parsedDescription.substring(0, 100) : 'empty');
        console.log('Has Variants:', !!parsedVariants);
        console.log('Variants Count:', parsedVariants ? parsedVariants.length : 0);
        console.log('Variants Data (stringified):', JSON.stringify(parsedVariants, null, 2));
        console.log('Final Product Variants:', JSON.stringify(productWithVariants.variants, null, 2));
        console.log('Final Product Variants Type:', typeof productWithVariants.variants);
        console.log('Final Product Variants IsArray:', Array.isArray(productWithVariants.variants));

        // ตรวจสอบว่า variants ถูกส่งไปใน response หรือไม่
        const responseData = {
            message: "สินค้าได้ถูกดึงสำเร็จ",
            product: productWithVariants
        };
        console.log('Response product.variants:', responseData.product.variants);
        console.log('Response product.variants type:', typeof responseData.product.variants);
        console.log('Response product.variants isArray:', Array.isArray(responseData.product.variants));

        res.status(200).json(responseData);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงสินค้า:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, quantity, categoryId, imagesToDelete, remainingImages, discountPrice, discountStartDate, discountEndDate, variants, imageUrls } = req.body;
        const uploadedFiles = req.files || [];

        console.log('Product update request:', {
            id, title, description, price, quantity, categoryId,
            imagesToDelete, remainingImages, uploadedFilesCount: uploadedFiles.length,
            discountPrice, discountStartDate, discountEndDate
        });

        // ลบรูปภาพที่เลือก
        if (imagesToDelete) {
            try {
                const deleteIds = JSON.parse(imagesToDelete);
                if (deleteIds.length > 0) {
                    console.log('Deleting images with IDs:', deleteIds);

                    // ดึงข้อมูลรูปภาพก่อนลบเพื่อใช้ public_id ลบจาก Cloudinary
                    const imagesToDeleteFromDB = await prisma.image.findMany({
                        where: {
                            id: { in: deleteIds },
                            productId: parseInt(id)
                        }
                    });

                    // ลบรูปภาพจาก Cloudinary
                    for (const image of imagesToDeleteFromDB) {
                        if (image.public_id) {
                            try {
                                await deleteFile(image.public_id);
                            } catch (cloudinaryError) {
                                console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                                // ไม่ throw error เพื่อให้สามารถลบข้อมูลจากฐานข้อมูลได้
                            }
                        }
                    }

                    // ลบข้อมูลจากฐานข้อมูล
                    const deleteResult = await prisma.image.deleteMany({
                        where: {
                            id: { in: deleteIds },
                            productId: parseInt(id)
                        }
                    });
                    console.log('Delete result:', deleteResult);
                    console.log('Successfully deleted', deleteIds.length, 'images from database and Cloudinary');
                } else {
                    console.log('No images to delete');
                }
            } catch (parseError) {
                console.log('Error parsing imagesToDelete:', parseError);
                console.log('imagesToDelete value:', imagesToDelete);
            }
        } else {
            console.log('No imagesToDelete provided');
        }

        // เก็บ variants, productSubcategories, และ freeShipping ใน description field แบบ JSON string
        let finalDescription = description || '';
        let metadata = {};

        // Parse description ที่ส่งมา (อาจจะเป็น JSON string ที่มี productSubcategories และ freeShipping)
        try {
            const incomingMeta = JSON.parse(description || '{}');
            if (incomingMeta && typeof incomingMeta === 'object') {
                metadata = { ...incomingMeta };
                if (metadata.description) {
                    finalDescription = metadata.description;
                }
                console.log('📥 Parsed incoming metadata in update:', {
                    hasProductSubcategories: !!metadata.productSubcategories,
                    productSubcategories: metadata.productSubcategories,
                    productSubcategoriesCount: metadata.productSubcategories?.length || 0,
                    hasFreeShipping: metadata.freeShipping !== undefined,
                    freeShipping: metadata.freeShipping,
                    hasVariants: !!metadata.variants,
                    variantsCount: metadata.variants?.length || 0
                });
            }
        } catch (e) {
            // Not JSON, use description as is
            finalDescription = description || '';
            console.log('ℹ️ Description is not JSON in update, using as plain text');
        }

        // ตรวจสอบว่ามี description เดิมที่เป็น JSON หรือไม่ (เพื่อเก็บข้อมูลเดิม)
        const existingProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (existingProduct && existingProduct.description) {
            try {
                const existingMetadata = JSON.parse(existingProduct.description);
                if (existingMetadata && typeof existingMetadata === 'object') {
                    // เก็บ productSubcategories และ freeShipping จาก description เดิมถ้ายังไม่มีใน metadata ใหม่
                    // แต่ถ้า metadata ใหม่มีค่าแล้ว ให้ใช้ค่าใหม่ (เพื่อให้สามารถแก้ไขได้)
                    // ตรวจสอบว่า metadata ใหม่มี productSubcategories หรือไม่ (รวมถึง array ว่าง)
                    if (!metadata.productSubcategories && existingMetadata.productSubcategories) {
                        metadata.productSubcategories = existingMetadata.productSubcategories;
                        console.log('📦 Preserved existing productSubcategories:', existingMetadata.productSubcategories);
                    } else if (metadata.productSubcategories) {
                        console.log('✅ Using new productSubcategories:', metadata.productSubcategories);
                    }
                    // ถ้า metadata ใหม่มี freeShipping แล้ว ให้ใช้ค่าใหม่ (ไม่ต้องเก็บค่าเดิม)
                    if (metadata.freeShipping === undefined && existingMetadata.freeShipping !== undefined) {
                        metadata.freeShipping = existingMetadata.freeShipping;
                    }
                    // ถ้า metadata ใหม่มี description แล้ว ให้ใช้ค่าใหม่
                    if (!metadata.description && existingMetadata.description) {
                        finalDescription = existingMetadata.description;
                    }
                    // เก็บ variants จากเดิมถ้ายังไม่มีใน metadata ใหม่
                    if (!metadata.variants && existingMetadata.variants) {
                        metadata.variants = existingMetadata.variants;
                    }
                }
            } catch (e) {
                // ถ้า description เดิมไม่ใช่ JSON ใช้ description ใหม่
                console.log('Existing description is not JSON, using new description');
            }
        }

        if (variants) {
            try {
                const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
                console.log('Update - Received variants:', variantsData);

                // ตรวจสอบว่า variants มีโครงสร้างถูกต้อง
                if (Array.isArray(variantsData) && variantsData.length > 0) {
                    // กรอง variants ที่มี name และ options ที่ถูกต้อง
                    const validVariants = variantsData.filter(v =>
                        v &&
                        v.name &&
                        typeof v.name === 'string' &&
                        v.name.trim() !== '' &&
                        v.options &&
                        Array.isArray(v.options) &&
                        v.options.length > 0
                    );

                    console.log('Update - Valid variants:', validVariants);

                    if (validVariants.length > 0) {
                        metadata.variants = validVariants;
                        metadata.description = finalDescription;
                        finalDescription = JSON.stringify(metadata);
                        console.log('✅ Variants saved in update:', validVariants);
                        console.log('✅ Final description (JSON):', finalDescription.substring(0, 200));
                    } else {
                        // ถ้าไม่มี valid variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                        if (Object.keys(metadata).length > 0) {
                            metadata.description = finalDescription;
                            finalDescription = JSON.stringify(metadata);
                        }
                        console.warn('⚠️ No valid variants to save');
                    }
                } else {
                    // ถ้าไม่มี variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                    if (Object.keys(metadata).length > 0) {
                        metadata.description = finalDescription;
                        finalDescription = JSON.stringify(metadata);
                    }
                    console.warn('⚠️ Variants data is not a valid array or is empty');
                }
            } catch (e) {
                console.error('❌ Error parsing variants in update:', e);
                // ถ้า parse variants ผิดพลาด แต่มี metadata อื่น ให้เก็บ metadata ไว้
                if (Object.keys(metadata).length > 0) {
                    metadata.description = finalDescription;
                    finalDescription = JSON.stringify(metadata);
                }
            }
        } else {
            // ถ้าไม่มี variants แต่มี metadata อื่น (เช่น productSubcategories, freeShipping) ให้เก็บ metadata ไว้
            // ตรวจสอบว่ามี metadata ที่ต้องเก็บหรือไม่
            const hasProductSubcategories = metadata.productSubcategories && Array.isArray(metadata.productSubcategories) && metadata.productSubcategories.length > 0;
            const hasFreeShipping = metadata.freeShipping !== undefined;
            const hasVariants = metadata.variants && Array.isArray(metadata.variants) && metadata.variants.length > 0;
            const hasDescription = metadata.description && metadata.description !== finalDescription;

            const hasMetadataToSave = hasProductSubcategories ||
                hasFreeShipping ||
                hasVariants ||
                hasDescription;

            // ถ้ามี metadata ใดๆ ให้เก็บไว้เสมอ (แม้ว่าจะไม่มี variants)
            if (hasMetadataToSave || Object.keys(metadata).length > 0) {
                // ตรวจสอบว่า metadata มี description หรือไม่ ถ้าไม่มีให้เพิ่ม
                if (!metadata.description) {
                    metadata.description = finalDescription;
                }
                finalDescription = JSON.stringify(metadata);
                console.log('✅ Metadata saved in update (no variants):', Object.keys(metadata));
                console.log('✅ Metadata content:', {
                    hasProductSubcategories: hasProductSubcategories,
                    productSubcategories: metadata.productSubcategories,
                    productSubcategoriesCount: metadata.productSubcategories?.length || 0,
                    hasFreeShipping: hasFreeShipping,
                    freeShipping: metadata.freeShipping,
                    hasVariants: hasVariants,
                    variantsCount: metadata.variants?.length || 0
                });
            } else {
                console.log('ℹ️ No variants provided in update request and no metadata to save');
            }
        }

        // อัพเดตข้อมูลสินค้า
        const updateData = {
            title,
            description: finalDescription,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            categoryId: parseInt(categoryId)
        };

        // เพิ่ม discount fields ถ้ามี
        if (discountPrice !== undefined) {
            updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
        }
        if (discountStartDate !== undefined) {
            updateData.discountStartDate = discountStartDate ? new Date(discountStartDate) : null;
        }
        if (discountEndDate !== undefined) {
            updateData.discountEndDate = discountEndDate ? new Date(discountEndDate) : null;
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // เพิ่มรูปภาพใหม่ถ้ามีการอัพโหลด (จาก Cloudinary)
        if (uploadedFiles.length > 0) {
            console.log('Uploading', uploadedFiles.length, 'new images to Cloudinary');
            console.log('Uploaded files:', uploadedFiles.map(f => ({ filename: f.filename || f.public_id, size: f.size, url: f.url })));
            const imageData = uploadedFiles.map(file => ({
                asset_id: file.asset_id || `product_${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                public_id: file.public_id || file.filename.split('.')[0],
                url: file.url || file.secure_url,
                secure_url: file.secure_url || file.url,
                productId: product.id
            }));

            console.log('Image data to create:', imageData);
            const createResult = await prisma.image.createMany({
                data: imageData
            });
            console.log('Create result:', createResult);
            console.log('Successfully uploaded', uploadedFiles.length, 'new images to Cloudinary');
        } else {
            console.log('No new images to upload');
        }

        // เพิ่มรูปภาพจาก URL ถ้ามี
        if (imageUrls) {
            try {
                const urlArray = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
                if (Array.isArray(urlArray) && urlArray.length > 0) {
                    const urlImageData = urlArray.map((url, index) => ({
                        asset_id: `product_${product.id}_url_${Date.now()}_${index}`,
                        public_id: `product_${product.id}_url_${index}`,
                        url: url,
                        secure_url: url,
                        productId: product.id
                    }));

                    await prisma.image.createMany({
                        data: urlImageData
                    });
                    console.log('✅ Added', urlArray.length, 'images from URLs (update)');
                }
            } catch (e) {
                console.error('Error parsing imageUrls in update:', e);
            }
        }

        // ดึงข้อมูลสินค้าที่อัพเดตแล้วพร้อมรูปภาพ
        const updatedProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        if (!updatedProduct) {
            return res.status(404).json({ message: "สินค้าไม่พบ" });
        }

        // Parse variants จาก description
        let parsedDescription = updatedProduct.description || '';
        let parsedVariants = null;

        if (updatedProduct.description) {
            try {
                const metadata = JSON.parse(updatedProduct.description);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.description && metadata.variants) {
                        parsedDescription = metadata.description;
                        parsedVariants = metadata.variants;
                    } else if (metadata.variants && Array.isArray(metadata.variants)) {
                        parsedVariants = metadata.variants;
                    }
                }
            } catch (e) {
                // Not JSON format, use description as is
            }
        }

        // Add variants to updated product
        const updatedProductWithVariants = {
            ...updatedProduct,
            description: parsedDescription,
            variants: parsedVariants || []
        };

        console.log('Final updated product:', {
            id: updatedProductWithVariants.id,
            title: updatedProductWithVariants.title,
            imageCount: updatedProductWithVariants.images.length,
            variantsCount: parsedVariants ? parsedVariants.length : 0,
            variants: parsedVariants
        });

        res.status(200).json({
            message: "สินค้าได้ถูกอัพเดตสำเร็จ",
            product: updatedProductWithVariants
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัพเดตสินค้า:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // ดึงข้อมูลสินค้าพร้อมรูปภาพก่อนลบ
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!product) {
            return res.status(404).json({ message: "สินค้าไม่พบ" });
        }

        // ลบรูปภาพจาก Cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.public_id) {
                    try {
                        await deleteFile(image.public_id);
                    } catch (cloudinaryError) {
                        console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                        // ไม่ throw error เพื่อให้สามารถลบสินค้าได้
                    }
                }
            }
        }

        // ลบสินค้า (cascade delete จะลบ images และ relations อื่นๆ ด้วย)
        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "สินค้าได้ถูกลบสำเร็จ", product });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

// Seller update/delete with ownership check
exports.updateBySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const uploadedFiles = req.files || [];
        const store = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
        if (!store) return res.status(400).json({ message: 'ยังไม่มีร้านค้า' });
        const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (!product || product.storeId !== store.id) return res.status(403).json({ message: 'ไม่มีสิทธิ์แก้ไขสินค้า' });

        const { title, description, price, quantity, categoryId, imagesToDelete, discountPrice, discountStartDate, discountEndDate, variants } = req.body;

        // เก็บ variants, productSubcategories, และ freeShipping ใน description field แบบ JSON string
        let finalDescription = description || '';
        let metadata = {};

        // Parse description ที่ส่งมา (อาจจะเป็น JSON string ที่มี productSubcategories และ freeShipping)
        try {
            const incomingMeta = JSON.parse(description || '{}');
            if (incomingMeta && typeof incomingMeta === 'object') {
                metadata = { ...incomingMeta };
                if (metadata.description) {
                    finalDescription = metadata.description;
                }
            }
        } catch (e) {
            // Not JSON, use description as is
            finalDescription = description || '';
        }

        // ตรวจสอบว่ามี description เดิมที่เป็น JSON หรือไม่ (เพื่อเก็บข้อมูลเดิม)
        if (product.description) {
            try {
                const existingMetadata = JSON.parse(product.description);
                if (existingMetadata && typeof existingMetadata === 'object') {
                    // เก็บ productSubcategories และ freeShipping จาก description เดิมถ้ายังไม่มีใน metadata ใหม่
                    if (!metadata.productSubcategories && existingMetadata.productSubcategories) {
                        metadata.productSubcategories = existingMetadata.productSubcategories;
                    }
                    if (metadata.freeShipping === undefined && existingMetadata.freeShipping !== undefined) {
                        metadata.freeShipping = existingMetadata.freeShipping;
                    }
                    if (!metadata.description && existingMetadata.description) {
                        finalDescription = existingMetadata.description;
                    }
                }
            } catch (e) {
                // ถ้า description เดิมไม่ใช่ JSON ใช้ description ใหม่
            }
        }

        if (variants) {
            try {
                const variantsData = typeof variants === 'string' ? JSON.parse(variants) : variants;
                console.log('UpdateBySeller - Received variants:', variantsData);

                // ตรวจสอบว่า variants มีโครงสร้างถูกต้อง
                if (Array.isArray(variantsData) && variantsData.length > 0) {
                    // กรอง variants ที่มี name และ options ที่ถูกต้อง
                    const validVariants = variantsData.filter(v =>
                        v &&
                        v.name &&
                        typeof v.name === 'string' &&
                        v.name.trim() !== '' &&
                        v.options &&
                        Array.isArray(v.options) &&
                        v.options.length > 0
                    );

                    console.log('UpdateBySeller - Valid variants:', validVariants);

                    if (validVariants.length > 0) {
                        metadata.variants = validVariants;
                        metadata.description = finalDescription;
                        finalDescription = JSON.stringify(metadata);
                        console.log('✅ Variants saved in updateBySeller:', validVariants);
                    } else {
                        // ถ้าไม่มี valid variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                        if (Object.keys(metadata).length > 0) {
                            metadata.description = finalDescription;
                            finalDescription = JSON.stringify(metadata);
                        }
                        console.warn('⚠️ No valid variants to save in updateBySeller');
                    }
                } else {
                    // ถ้าไม่มี variants แต่มี metadata อื่น ให้เก็บ metadata ไว้
                    if (Object.keys(metadata).length > 0) {
                        metadata.description = finalDescription;
                        finalDescription = JSON.stringify(metadata);
                    }
                    console.warn('⚠️ Variants data is not a valid array or is empty in updateBySeller');
                }
            } catch (e) {
                console.error('❌ Error parsing variants in updateBySeller:', e);
                // ถ้า parse variants ผิดพลาด แต่มี metadata อื่น ให้เก็บ metadata ไว้
                if (Object.keys(metadata).length > 0) {
                    metadata.description = finalDescription;
                    finalDescription = JSON.stringify(metadata);
                }
            }
        } else {
            // ถ้าไม่มี variants แต่มี metadata อื่น (เช่น productSubcategories, freeShipping) ให้เก็บ metadata ไว้
            if (Object.keys(metadata).length > 0) {
                metadata.description = finalDescription;
                finalDescription = JSON.stringify(metadata);
                console.log('✅ Metadata saved in updateBySeller (no variants):', Object.keys(metadata));
            } else {
                console.log('ℹ️ No variants provided in updateBySeller request');
            }
        }

        const updateData = {
            title,
            description: finalDescription,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            categoryId: parseInt(categoryId)
        };

        // เพิ่ม discount fields ถ้ามี
        if (discountPrice !== undefined) {
            updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
        }
        if (discountStartDate !== undefined) {
            updateData.discountStartDate = discountStartDate ? new Date(discountStartDate) : null;
        }
        if (discountEndDate !== undefined) {
            updateData.discountEndDate = discountEndDate ? new Date(discountEndDate) : null;
        }

        const updated = await prisma.product.update({
            where: { id: product.id },
            data: updateData
        });

        if (imagesToDelete) {
            const ids = JSON.parse(imagesToDelete);
            if (ids.length) {
                // ดึงข้อมูลรูปภาพก่อนลบเพื่อใช้ public_id ลบจาก Cloudinary
                const imagesToDeleteFromDB = await prisma.image.findMany({
                    where: { id: { in: ids }, productId: updated.id }
                });

                // ลบรูปภาพจาก Cloudinary
                for (const image of imagesToDeleteFromDB) {
                    if (image.public_id) {
                        try {
                            await deleteFile(image.public_id);
                        } catch (cloudinaryError) {
                            console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                        }
                    }
                }

                // ลบข้อมูลจากฐานข้อมูล
                await prisma.image.deleteMany({ where: { id: { in: ids }, productId: updated.id } });
            }
        }
        if (uploadedFiles.length) {
            await prisma.image.createMany({
                data: uploadedFiles.map(file => ({
                    asset_id: file.asset_id || `product_${updated.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    public_id: file.public_id || file.filename.split('.')[0],
                    url: file.url || file.secure_url,
                    secure_url: file.secure_url || file.url,
                    productId: updated.id
                }))
            });
        }

        const finalProduct = await prisma.product.findUnique({
            where: { id: updated.id },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        // Parse variants จาก description
        let parsedDescription = finalProduct.description || '';
        let parsedVariants = null;

        if (finalProduct.description) {
            try {
                const metadata = JSON.parse(finalProduct.description);
                if (metadata && typeof metadata === 'object') {
                    if (metadata.description && metadata.variants) {
                        parsedDescription = metadata.description;
                        parsedVariants = metadata.variants;
                    } else if (metadata.variants && Array.isArray(metadata.variants)) {
                        parsedVariants = metadata.variants;
                    }
                }
            } catch (e) {
                // Not JSON format, use description as is
            }
        }

        // Add variants to product object
        const productWithVariants = {
            ...finalProduct,
            description: parsedDescription,
            variants: parsedVariants || []
        };

        console.log('✅ Product updated by seller with variants:', {
            productId: productWithVariants.id,
            variantsCount: parsedVariants ? parsedVariants.length : 0,
            variants: parsedVariants
        });

        res.json({ message: 'อัปเดตสินค้าสำเร็จ', product: productWithVariants });
    } catch (error) {
        console.error('updateBySeller error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

exports.deleteBySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
        if (!store) return res.status(400).json({ message: 'ยังไม่มีร้านค้า' });

        // ดึงข้อมูลสินค้าพร้อมรูปภาพก่อนลบ
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!product || product.storeId !== store.id) return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบสินค้า' });

        // ลบรูปภาพจาก Cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.public_id) {
                    try {
                        await deleteFile(image.public_id);
                    } catch (cloudinaryError) {
                        console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                        // ไม่ throw error เพื่อให้สามารถลบสินค้าได้
                    }
                }
            }
        }

        await prisma.product.delete({ where: { id: product.id } });
        res.json({ message: 'ลบสินค้าสำเร็จ' });
    } catch (error) {
        console.error('deleteBySeller error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

exports.listby = async (req, res) => {
    try {
        const { sort, order, limit } = req.body;
        console.log(sort, order, limit);

        const products = await prisma.product.findMany({
            take: limit || 10,
            orderBy: { [sort]: order },
            include: {
                images: true,
                category: true,
                store: true
            }
        });

        res.status(200).json({ message: "สินค้าได้ถูกดึงสำเร็จ", products });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงสินค้า:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

const handleQuery = async (req, res, query) => {
    try {
        //code
        const products = await prisma.product.findMany({
            where: {
                title: {
                    contains: query,
                }
            },
            include: {
                category: true,
                images: true,
                store: true
            }

        })
        res.send(products)
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Search Error" })
    }
}

const handlePrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {
                    gte: parseInt(priceRange[0]),
                    lte: parseInt(priceRange[1])
                }
            },
            include: {
                category: true,
                images: true,
                store: true
            }
        })
        res.send(products)
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Price Error" })
    }
}

const handleCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: {
                    in: categoryId.map((id) => Number(id))
                }
            },
            include: {
                category: true,
                images: true,
                store: true
            }
        })
        res.send(products)
    } catch (err) {
        //err
        console.log(err)
        res.status(500).json({ message: "Category Error" })
    }
}

exports.searchFilters = async (req, res) => {
    try {
        const { query, category, price } = req.body;

        console.log('🔍 Search request received:', { query, category, price });

        // สร้าง where clause สำหรับการค้นหา
        const whereClause = {};

        // ค้นหาตาม query (title หรือ description)
        if (query && query.trim()) {
            const searchQuery = query.trim();
            console.log('🔍 Searching for:', searchQuery);

            // สร้าง OR conditions สำหรับการค้นหา
            // ใช้ contains สำหรับ MySQL (จะทำงานแบบ case-insensitive ตาม collation)
            whereClause.title = { contains: searchQuery };

            // ตรวจสอบว่ามีสินค้าในฐานข้อมูลหรือไม่
            const totalProducts = await prisma.product.count();
            console.log('📊 Total products in database:', totalProducts);
        }

        // ค้นหาตาม category
        if (category && Array.isArray(category) && category.length > 0) {
            whereClause.categoryId = { in: category.map(c => parseInt(c)) };
        }

        // ค้นหาตามช่วงราคา
        if (price && Array.isArray(price) && price.length === 2) {
            whereClause.price = {
                gte: parseFloat(price[0]),
                lte: parseFloat(price[1])
            };
        }

        console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

        // ดึงข้อมูลสินค้าจากฐานข้อมูล
        let products = [];

        try {
            // ถ้าไม่มี whereClause ให้ใช้ undefined (จะดึงทั้งหมด)
            const whereCondition = Object.keys(whereClause).length > 0 ? whereClause : undefined;

            products = await prisma.product.findMany({
                where: whereCondition,
                include: {
                    images: true,
                    category: true,
                    store: true
                },
                orderBy: query && query.trim() ? {
                    title: 'asc'
                } : {
                    createdAt: 'desc'
                },
                take: 200 // จำกัดผลลัพธ์ 200 รายการ
            });

            console.log('✅ Found products:', products.length);
            if (products.length > 0) {
                console.log('📦 Sample product:', {
                    id: products[0].id,
                    title: products[0].title?.substring(0, 50),
                    hasImages: products[0].images?.length > 0
                });
            }
        } catch (dbError) {
            console.error('❌ Database query error:', dbError);
            console.error('Error message:', dbError.message);
            throw dbError;
        }

        // Parse variants and productSubcategories from description for each product
        const productsWithVariants = products.map(product => {
            let parsedDescription = product.description || '';
            let parsedVariants = null;
            let parsedProductSubcategories = [];
            let parsedFreeShipping = false;

            if (product.description) {
                try {
                    const metadata = JSON.parse(product.description);
                    if (metadata && typeof metadata === 'object') {
                        // Parse description
                        if (metadata.description) {
                            parsedDescription = metadata.description;
                        }
                        // Parse variants
                        if (metadata.variants && Array.isArray(metadata.variants)) {
                            parsedVariants = metadata.variants;
                        }
                        // Parse productSubcategories
                        if (metadata.productSubcategories && Array.isArray(metadata.productSubcategories)) {
                            parsedProductSubcategories = metadata.productSubcategories;
                        }
                        // Parse freeShipping
                        if (metadata.freeShipping === true) {
                            parsedFreeShipping = true;
                        }
                    }
                } catch (e) {
                    // Not JSON format, use description as is
                }
            }

            return {
                ...product,
                description: parsedDescription,
                variants: parsedVariants || [],
                productSubcategories: parsedProductSubcategories,
                freeShipping: parsedFreeShipping
            };
        });

        console.log('✅ Returning', productsWithVariants.length, 'products');
        res.status(200).json({
            message: "สินค้าได้ถูกค้นหาสำเร็จ",
            products: productsWithVariants
        });
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการค้นหา:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: "เกิดข้อผิดพลาดในระบบ",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Admin only - Delete Product Image
exports.deleteProductImage = async (req, res) => {
    try {
        const { productId, imageId } = req.params;

        // ตรวจสอบว่าสินค้าและรูปภาพมีอยู่จริง
        const image = await prisma.image.findUnique({
            where: { id: parseInt(imageId) },
            include: { product: true }
        });

        if (!image) {
            return res.status(404).json({ message: "ไม่พบรูปภาพที่ต้องการลบ" });
        }

        if (image.productId !== parseInt(productId)) {
            return res.status(400).json({ message: "รูปภาพไม่ตรงกับสินค้า" });
        }

        // ลบรูปภาพจาก Cloudinary
        if (image.public_id) {
            try {
                await deleteFile(image.public_id);
                console.log(`✅ ลบรูปภาพจาก Cloudinary สำเร็จ: ${image.public_id}`);
            } catch (cloudinaryError) {
                console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                // ไม่ throw error เพื่อให้สามารถลบข้อมูลจากฐานข้อมูลได้
            }
        }

        // ลบข้อมูลจากฐานข้อมูล
        await prisma.image.delete({
            where: { id: parseInt(imageId) }
        });

        res.status(200).json({
            message: "ลบรูปภาพสำเร็จ",
            deletedImage: {
                id: image.id,
                productId: image.productId
            }
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบรูปภาพ:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบรูปภาพ" });
    }
};

// Admin only - Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        // ตรวจสอบว่าสินค้ามีอยู่จริง
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { images: true }
        });

        if (!product) {
            return res.status(404).json({ message: "ไม่พบสินค้าที่ต้องการลบ" });
        }

        // ลบรูปภาพจาก Cloudinary
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.public_id) {
                    try {
                        await deleteFile(image.public_id);
                    } catch (cloudinaryError) {
                        console.error(`❌ ไม่สามารถลบรูปภาพจาก Cloudinary (public_id: ${image.public_id}):`, cloudinaryError);
                        // ไม่ throw error เพื่อให้สามารถลบสินค้าได้
                    }
                }
            }
        }

        // ลบสินค้า (cascade delete จะลบ images และ relations อื่นๆ ด้วย)
        await prisma.product.delete({
            where: { id: productId }
        });

        res.status(200).json({
            message: `ลบสินค้า "${product.title}" สำเร็จ`,
            deletedProduct: {
                id: product.id,
                title: product.title
            }
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" });
    }
};
