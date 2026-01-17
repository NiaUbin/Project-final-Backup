const prisma = require('./config/prisma');

async function makeUserAdmin() {
    try {
        console.log('👑 แก้ไขสิทธิ์ผู้ใช้เป็น Admin...\n');

        // 1. ค้นหา testuser
        const user = await prisma.user.findUnique({
            where: { email: 'testuser@example.com' }
        });

        if (!user) {
            console.log('❌ ไม่พบผู้ใช้ testuser@example.com');
            return;
        }

        console.log('👤 พบผู้ใช้:', user.name, '(', user.email, ')');
        console.log('🔒 สิทธิ์ปัจจุบัน:', user.role);

        // 2. เปลี่ยนเป็น admin
        const updatedUser = await prisma.user.update({
            where: { email: 'testuser@example.com' },
            data: { 
                role: 'admin',
                enabled: true // ให้แน่ใจว่าบัญชีเปิดใช้งาน
            }
        });

        console.log('✅ อัพเดตสิทธิ์สำเร็จ!');
        console.log('👑 สิทธิ์ใหม่:', updatedUser.role);
        console.log('🟢 สถานะ:', updatedUser.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน');

        // 3. แสดงผู้ใช้ admin ทั้งหมด
        const adminUsers = await prisma.user.findMany({
            where: { role: 'admin' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                enabled: true,
                createdAt: true
            }
        });

        console.log('\n📋 รายชื่อ Admin ทั้งหมด:');
        console.log('='.repeat(50));
        adminUsers.forEach(admin => {
            console.log(`👑 ${admin.name} (${admin.email})`);
            console.log(`   ID: ${admin.id} | สถานะ: ${admin.enabled ? '✅ เปิด' : '❌ ปิด'}`);
            console.log(`   สร้างเมื่อ: ${admin.createdAt.toLocaleDateString('th-TH')}`);
            console.log('');
        });

        console.log('🌐 ตอนนี้สามารถใช้งานได้:');
        console.log('1. เปิด http://localhost:3001');
        console.log('2. เข้าสู่ระบบด้วย testuser@example.com / 123456');
        console.log('3. ไปที่แท็บ "จัดการสินค้า"');
        console.log('4. คลิก "เพิ่มสินค้าใหม่" เพื่อทดสอบอัพโหลดรูปภาพ');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    }
}

makeUserAdmin();
