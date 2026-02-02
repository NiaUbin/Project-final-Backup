const prisma = require('../config/prisma');

async function main() {
  console.log('Start seeding banners...');

  const banners = [
    {
      title: 'ช้อปปิ้งออนไลน์',
      image: '/000000.jpg',
      link: '/products',
      position: 'main',
      order: 1,
      status: true
    },
    {
      title: 'IT Computer Equipment',
      image: '/unnamed.jpg',
      link: '/it-products',
      position: 'side-top',
      order: 2,
      status: true
    },
    {
      title: 'Discount Products',
      image: '/unnamed555.jpg',
      link: '/discount-products',
      position: 'side-bottom',
      order: 3,
      status: true
    }
  ];

  for (const b of banners) {
    // Check if exists (by position for simplicity)
    const exists = await prisma.banner.findFirst({
        where: { position: b.position }
    });

    if (!exists) {
        await prisma.banner.create({
            data: b
        });
        console.log(`Created banner: ${b.title} (${b.position})`);
    } else {
        console.log(`Banner already exists: ${b.title} (${b.position})`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
