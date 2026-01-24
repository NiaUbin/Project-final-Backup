require('dotenv').config();
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

/**
 * Script สำหรับ Restore ข้อมูลสินค้าจากไฟล์ JSON
 * วิธีใช้: node server/scripts/restore-products.js <path-to-json-file>
 */

async function restoreProducts(jsonFilePath) {
  try {
    if (!jsonFilePath) {
      console.error('❌ กรุณาระบุ path ของไฟล์ JSON');
      console.log('วิธีใช้: node server/scripts/restore-products.js <path-to-json-file>');
      process.exit(1);
    }

    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ ไม่พบไฟล์: ${jsonFilePath}`);
      process.exit(1);
    }

    console.log('📖 กำลังอ่านไฟล์ JSON...');
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    const exportData = JSON.parse(fileContent);

    if (!exportData.products || !Array.isArray(exportData.products)) {
      console.error('❌ ไฟล์ JSON ไม่ถูกต้อง: ไม่พบข้อมูล products');
      process.exit(1);
    }

    console.log(`✅ อ่านข้อมูลสำเร็จ: ${exportData.products.length} รายการ\n`);

    // ตรวจสอบว่ามีสินค้าอยู่แล้วหรือไม่
    const existingProducts = await prisma.product.findMany({
      select: { id: true, title: true }
    });

    console.log(`📊 สินค้าที่มีอยู่ในฐานข้อมูล: ${existingProducts.length} รายการ`);
    console.log(`📦 สินค้าที่จะ restore: ${exportData.products.length} รายการ\n`);

    if (existingProducts.length > 0) {
      console.log('⚠️  คำเตือน: มีสินค้าอยู่ในฐานข้อมูลแล้ว');
      console.log('   - ถ้า ID ซ้ำ จะข้ามสินค้านั้น');
      console.log('   - ถ้าต้องการแทนที่ข้อมูลเดิม ให้ลบข้อมูลเก่าก่อน\n');
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Restore แต่ละสินค้า
    for (let i = 0; i < exportData.products.length; i++) {
      const productData = exportData.products[i];
      
      try {
        // ตรวจสอบว่ามีสินค้านี้อยู่แล้วหรือไม่
        const existing = await prisma.product.findUnique({
          where: { id: productData.id }
        });

        if (existing) {
          console.log(`⏭️  ข้าม ID ${productData.id}: ${productData.title} (มีอยู่แล้ว)`);
          skipCount++;
          continue;
        }

        // ตรวจสอบว่ามี category หรือไม่
        if (!productData.categoryId) {
          console.log(`⚠️  ข้าม ID ${productData.id}: ${productData.title} (ไม่มี categoryId)`);
          skipCount++;
          continue;
        }

        // ตรวจสอบว่ามี category ในฐานข้อมูลหรือไม่
        const category = await prisma.category.findUnique({
          where: { id: productData.categoryId }
        });

        if (!category) {
          console.log(`⚠️  ข้าม ID ${productData.id}: ${productData.title} (ไม่พบ category ID ${productData.categoryId})`);
          skipCount++;
          continue;
        }

        // สร้างสินค้าใหม่
        const product = await prisma.product.create({
          data: {
            title: productData.title,
            description: productData.description || null,
            price: productData.price,
            discountPrice: productData.discountPrice || null,
            discountStartDate: productData.discountStartDate ? new Date(productData.discountStartDate) : null,
            discountEndDate: productData.discountEndDate ? new Date(productData.discountEndDate) : null,
            quantity: productData.quantity || 0,
            sold: productData.sold || 0,
            categoryId: productData.categoryId,
            storeId: productData.storeId || null
          }
        });

        // สร้างรูปภาพถ้ามี
        if (productData.images && productData.images.length > 0) {
          const imageData = productData.images.map(img => ({
            asset_id: img.asset_id || `product_${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            public_id: img.public_id || `product_${product.id}_${Date.now()}`,
            url: img.url || img.secure_url || '',
            secure_url: img.secure_url || img.url || '',
            productId: product.id
          }));

          await prisma.image.createMany({
            data: imageData
          });
        }

        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Restore แล้ว: ${i + 1}/${exportData.products.length} รายการ`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ ข้อผิดพลาดที่ ID ${productData.id}: ${error.message}`);
      }
    }

    console.log('\n' + '─'.repeat(50));
    console.log('📊 สรุปผลการ Restore:');
    console.log(`✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`⏭️  ข้าม: ${skipCount} รายการ`);
    console.log(`❌ ผิดพลาด: ${errorCount} รายการ`);
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// รับ argument จาก command line
const jsonFilePath = process.argv[2];
restoreProducts(jsonFilePath);
