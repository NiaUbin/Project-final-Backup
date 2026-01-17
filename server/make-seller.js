const prisma = require('./config/prisma');
const bcrypt = require('bcryptjs');

async function makeSeller() {
  const email = 'seller@gmail.com';
  const password = 'seller123';
  const name = 'Demo Seller';

  try {
    console.log('🛠  Creating seller account...');

    const hashed = await bcrypt.hash(password, 10);

    // Upsert user as seller
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, password: hashed, role: 'seller', enabled: true },
      create: { email, name, password: hashed, role: 'seller', enabled: true }
    });

    console.log('👤 User:', user.email, '| role:', user.role);

    // Ensure store exists
    let store = await prisma.store.findFirst({ where: { ownerId: user.id } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: 'ร้านค้า Demo',
          description: 'ตัวอย่างร้านสำหรับทดสอบ',
          logo: 'https://via.placeholder.com/96x96.png?text=Store',
          ownerId: user.id
        }
      });
      console.log('🏪 Created store:', store.name);
    } else {
      console.log('🏪 Store already exists:', store.name);
    }

    console.log('\n✅ Done. You can login with:');
    console.log('   email   : seller@gmail.com');
    console.log('   password: seller123');
    console.log('\nThen visit /seller to set up and add products.');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

makeSeller();


