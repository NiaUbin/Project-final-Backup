require('dotenv').config();
const prisma = require('../config/prisma');

/**
 * Script สำหรับตรวจสอบข้อมูลสินค้าในฐานข้อมูล
 * วิธีใช้: node server/scripts/check-products.js
 */

async function checkProducts() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลสินค้าในฐานข้อมูล...\n');

    // นับจำนวนสินค้าทั้งหมด
    const totalCount = await prisma.product.count();
    console.log(`📦 สินค้าทั้งหมด: ${totalCount} รายการ\n`);

    if (totalCount === 0) {
      console.log('⚠️  ไม่พบข้อมูลสินค้าในฐานข้อมูล');
      console.log('💡 ใช้คำสั่ง: node server/scripts/export-products.js เพื่อ export ข้อมูล');
      await prisma.$disconnect();
      return;
    }

    // สถิติต่างๆ
    const withImages = await prisma.product.count({
      where: {
        images: {
          some: {}
        }
      }
    });

    const withDiscount = await prisma.product.count({
      where: {
        discountPrice: { not: null },
        discountStartDate: { not: null },
        discountEndDate: { not: null }
      }
    });

    const withStore = await prisma.product.count({
      where: {
        storeId: { not: null }
      }
    });

    const outOfStock = await prisma.product.count({
      where: {
        quantity: 0
      }
    });

    const inStock = await prisma.product.count({
      where: {
        quantity: { gt: 0 }
      }
    });

    // สถิติตามหมวดหมู่
    const productsByCategory = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      }
    });

    // แสดงสรุป
    console.log('📊 สรุปข้อมูลสินค้า:');
    console.log('─'.repeat(50));
    console.log(`- สินค้าทั้งหมด: ${totalCount} รายการ`);
    console.log(`- มีรูปภาพ: ${withImages} รายการ`);
    console.log(`- มีส่วนลด: ${withDiscount} รายการ`);
    console.log(`- มีร้านค้า: ${withStore} รายการ`);
    console.log(`- มีสต็อก: ${inStock} รายการ`);
    console.log(`- หมดสต็อก: ${outOfStock} รายการ`);
    console.log('─'.repeat(50));
    console.log('');

    // แสดงสินค้าตามหมวดหมู่
    if (productsByCategory.length > 0) {
      console.log('📂 สินค้าตามหมวดหมู่:');
      console.log('─'.repeat(50));
      
      for (const item of productsByCategory) {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
          select: { name: true }
        });
        console.log(`- ${category?.name || `Category ID ${item.categoryId}`}: ${item._count.id} รายการ`);
      }
      console.log('─'.repeat(50));
      console.log('');
    }

    // แสดงสินค้า 10 รายการล่าสุด
    const recentProducts = await prisma.product.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        category: {
          select: { name: true }
        },
        images: {
          take: 1
        }
      }
    });

    if (recentProducts.length > 0) {
      console.log('📦 สินค้าล่าสุด (10 รายการ):');
      console.log('─'.repeat(80));
      recentProducts.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id} | ${product.title}`);
        console.log(`   ราคา: ฿${product.price.toLocaleString()} | จำนวน: ${product.quantity} | หมวดหมู่: ${product.category?.name || 'ไม่มี'}`);
        console.log(`   รูปภาพ: ${product.images?.length || 0} รูป | สร้างเมื่อ: ${product.createdAt.toLocaleString('th-TH')}`);
        console.log('');
      });
    }

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
checkProducts();
