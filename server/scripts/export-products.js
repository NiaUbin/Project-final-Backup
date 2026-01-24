require('dotenv').config();
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

/**
 * Script สำหรับ Export ข้อมูลสินค้าทั้งหมดจากฐานข้อมูล
 * วิธีใช้: node server/scripts/export-products.js
 */

async function exportProducts() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลสินค้าในฐานข้อมูล...\n');

    // ดึงข้อมูลสินค้าทั้งหมดพร้อม relations
    const products = await prisma.product.findMany({
      include: {
        images: true,
        category: true,
        store: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ พบสินค้าทั้งหมด: ${products.length} รายการ\n`);

    if (products.length === 0) {
      console.log('⚠️  ไม่พบข้อมูลสินค้าในฐานข้อมูล');
      return;
    }

    // แสดงสรุปข้อมูล
    console.log('📊 สรุปข้อมูลสินค้า:');
    console.log('─'.repeat(50));
    
    const withImages = products.filter(p => p.images && p.images.length > 0).length;
    const withDiscount = products.filter(p => p.discountPrice && p.discountStartDate && p.discountEndDate).length;
    const withStore = products.filter(p => p.storeId).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const inStock = products.filter(p => p.quantity > 0).length;

    console.log(`- สินค้าทั้งหมด: ${products.length} รายการ`);
    console.log(`- มีรูปภาพ: ${withImages} รายการ`);
    console.log(`- มีส่วนลด: ${withDiscount} รายการ`);
    console.log(`- มีร้านค้า: ${withStore} รายการ`);
    console.log(`- มีสต็อก: ${inStock} รายการ`);
    console.log(`- หมดสต็อก: ${outOfStock} รายการ`);
    console.log('─'.repeat(50));
    console.log('');

    // สร้างโฟลเดอร์ exports ถ้ายังไม่มี
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Export เป็น JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFile = path.join(exportsDir, `products_export_${timestamp}.json`);
    
    // แปลงข้อมูลให้เป็น JSON ที่อ่านง่าย
    const exportData = {
      exportDate: new Date().toISOString(),
      totalProducts: products.length,
      products: products.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        quantity: product.quantity,
        sold: product.sold,
        categoryId: product.categoryId,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          image: product.category.image
        } : null,
        storeId: product.storeId,
        store: product.store ? {
          id: product.store.id,
          name: product.store.name,
          description: product.store.description,
          logo: product.store.logo,
          owner: product.store.owner
        } : null,
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          secure_url: img.secure_url,
          public_id: img.public_id,
          asset_id: img.asset_id
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
    };

    // บันทึกเป็น JSON
    fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`✅ Export สำเร็จ!`);
    console.log(`📁 ไฟล์: ${jsonFile}`);
    console.log(`📦 จำนวนสินค้า: ${products.length} รายการ`);
    console.log(`💾 ขนาดไฟล์: ${(fs.statSync(jsonFile).size / 1024).toFixed(2)} KB\n`);

    // Export เป็น CSV (สำหรับ Excel)
    const csvFile = path.join(exportsDir, `products_export_${timestamp}.csv`);
    const csvHeader = [
      'ID',
      'Title',
      'Price',
      'Discount Price',
      'Quantity',
      'Sold',
      'Category',
      'Store',
      'Images Count',
      'Created At'
    ].join(',');

    const csvRows = products.map(product => {
      const row = [
        product.id,
        `"${(product.title || '').replace(/"/g, '""')}"`,
        product.price,
        product.discountPrice || '',
        product.quantity,
        product.sold,
        `"${(product.category?.name || '').replace(/"/g, '""')}"`,
        `"${(product.store?.name || '').replace(/"/g, '""')}"`,
        product.images?.length || 0,
        product.createdAt
      ];
      return row.join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync(csvFile, csvContent, 'utf8');
    console.log(`✅ Export CSV สำเร็จ!`);
    console.log(`📁 ไฟล์: ${csvFile}\n`);

    // แสดงตัวอย่างสินค้า 5 รายการแรก
    console.log('📦 ตัวอย่างสินค้า (5 รายการแรก):');
    console.log('─'.repeat(80));
    products.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id} | ${product.title}`);
      console.log(`   ราคา: ฿${product.price.toLocaleString()} | จำนวน: ${product.quantity} | หมวดหมู่: ${product.category?.name || 'ไม่มี'}`);
      console.log(`   รูปภาพ: ${product.images?.length || 0} รูป`);
      console.log('');
    });

    console.log('✅ เสร็จสิ้น!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// รัน script
exportProducts();
