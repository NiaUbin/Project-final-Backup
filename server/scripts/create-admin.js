require('dotenv').config();
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * Script สำหรับสร้าง Admin User
 * วิธีใช้: node server/scripts/create-admin.js
 * 
 * หรือระบุ email และ password:
 * node server/scripts/create-admin.js admin@gmail.com admin123
 */

async function createAdmin(email = 'admin@gmail.com', password = 'admin123', name = 'Admin') {
  try {
    console.log('👑 กำลังสร้าง/อัพเดต Admin User...\n');
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log(`👤 Name: ${name}\n`);

    // ตรวจสอบว่ามี user นี้อยู่แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  พบผู้ใช้ที่มี email นี้อยู่แล้ว');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Enabled: ${existingUser.enabled}\n`);

      // Hash password ใหม่
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // อัพเดต user เป็น admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'admin',
          password: hashedPassword,
          enabled: true,
          name: name || existingUser.name
        }
      });

      console.log('✅ อัพเดตผู้ใช้เป็น Admin สำเร็จ!');
      console.log(`👑 Role: ${updatedUser.role}`);
      console.log(`🟢 Status: ${updatedUser.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
      console.log(`🔑 Password: ถูกอัพเดตแล้ว\n`);

    } else {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // สร้าง user ใหม่
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || 'Admin',
          role: 'admin',
          enabled: true
        }
      });

      console.log('✅ สร้าง Admin User สำเร็จ!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Status: ${newUser.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}\n`);
    }

    // แสดงรายชื่อ Admin ทั้งหมด
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        enabled: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📋 รายชื่อ Admin ทั้งหมด:');
    console.log('='.repeat(60));
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. 👑 ${admin.name} (${admin.email})`);
      console.log(`   ID: ${admin.id} | Status: ${admin.enabled ? '✅ เปิด' : '❌ ปิด'}`);
      console.log(`   สร้างเมื่อ: ${admin.createdAt.toLocaleString('th-TH')}`);
      console.log('');
    });
    console.log('='.repeat(60));

    console.log('\n🌐 วิธีใช้งาน:');
    console.log(`1. เปิด http://localhost:3001`);
    console.log(`2. คลิก "เข้าสู่ระบบ"`);
    console.log(`3. ใช้ Email: ${email}`);
    console.log(`4. ใช้ Password: ${password}`);
    console.log(`5. หลังจาก login จะสามารถเข้าถึง Admin Panel ได้`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// รับ arguments จาก command line
const args = process.argv.slice(2);
const email = args[0] || 'admin@gmail.com';
const password = args[1] || 'admin123';
const name = args[2] || 'Admin';

// รัน function
createAdmin(email, password, name);
