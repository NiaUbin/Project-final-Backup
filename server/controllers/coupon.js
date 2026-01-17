const prisma = require('../config/prisma');

// Create coupon for user (auto when login)
exports.createWelcomeCoupon = async (userId) => {
  try {
    // Check if user already has unused welcome coupon with code "10"
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        userId,
        isUsed: false,
        code: '10'
      }
    });

    if (existingCoupon) {
      return existingCoupon;
    }

    // Check if code "10" is already taken by another user
    const codeExists = await prisma.coupon.findUnique({
      where: { code: '10' }
    });

    // If code "10" exists but belongs to different user or is used, create unique code
    let code = '10';
    if (codeExists && (codeExists.userId !== userId || codeExists.isUsed)) {
      // Generate unique code if "10" is taken
      code = `WELCOME${userId}${Date.now().toString().slice(-6)}`;
    }
    
    // Create coupon: 100 THB discount, expires in 1 day (for testing)
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountAmount: 100,
        minPurchase: 0,
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        userId
      }
    });

    return coupon;
  } catch (err) {
    console.error('Create welcome coupon error:', err);
    // If code "10" already exists, try to create with unique code
    if (err.code === 'P2002') { // Unique constraint violation
      try {
        const code = `WELCOME${userId}${Date.now().toString().slice(-6)}`;
        const coupon = await prisma.coupon.create({
          data: {
            code,
            discountAmount: 100,
            minPurchase: 0,
            expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
            userId
          }
        });
        return coupon;
      } catch (retryErr) {
        console.error('Retry create welcome coupon error:', retryErr);
        return null;
      }
    }
    return null;
  }
};

// Create test coupon with code "10" for user (for testing)
exports.createTestCoupon = async (userId) => {
  try {
    // Check if user already has coupon with code "10"
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        userId,
        code: '10',
        isUsed: false
      }
    });

    if (existingCoupon) {
      return existingCoupon;
    }

    // Check if code "10" exists for other users
    const codeExists = await prisma.coupon.findUnique({
      where: { code: '10' }
    });

    if (codeExists && codeExists.userId !== userId) {
      // Delete old coupon and create new one for this user
      await prisma.coupon.delete({
        where: { code: '10' }
      });
    } else if (codeExists && codeExists.isUsed) {
      // If used, update it to unused
      return await prisma.coupon.update({
        where: { code: '10' },
        data: {
          userId,
          isUsed: false,
          usedAt: null,
          expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
        }
      });
    }

    // Create or update coupon with code "10" - expires in 1 day (for testing)
    const coupon = await prisma.coupon.upsert({
      where: { code: '10' },
      update: {
        userId,
        isUsed: false,
        usedAt: null,
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
      },
      create: {
        code: '10',
        discountAmount: 100,
        minPurchase: 0,
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        userId,
        isUsed: false
      }
    });

    return coupon;
  } catch (err) {
    console.error('Create test coupon error:', err);
    return null;
  }
};

// Get user coupons
exports.getUserCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has any coupon, if not, create welcome coupon with code "10"
    const existingCoupons = await prisma.coupon.findMany({
      where: { userId }
    });

    // If user has no coupons at all, create welcome coupon with code "10"
    if (existingCoupons.length === 0) {
      try {
        await exports.createWelcomeCoupon(userId);
      } catch (createError) {
        console.error('Error auto-creating welcome coupon:', createError);
        // Try creating test coupon instead
        try {
          await exports.createTestCoupon(userId);
        } catch (testError) {
          console.error('Error creating test coupon:', testError);
        }
      }
    }
    
    const coupons = await prisma.coupon.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ coupons });
  } catch (err) {
    console.error('Get user coupons error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง' });
  }
};

// Create test coupon for current user (admin/testing endpoint)
exports.createCouponForMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const coupon = await exports.createTestCoupon(userId);
    
    if (coupon) {
      res.json({
        message: 'สร้างโค้ดส่วนลดสำเร็จ',
        coupon
      });
    } else {
      res.status(500).json({ message: 'ไม่สามารถสร้างโค้ดส่วนลดได้' });
    }
  } catch (err) {
    console.error('Create coupon for me error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างโค้ดส่วนลด' });
  }
};

// Validate and apply coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'กรุณาระบุโค้ดส่วนลด' });
    }

    // Normalize code - remove spaces and convert to uppercase
    const normalizedCode = code.trim().toUpperCase();
    
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode }
    });

    if (!coupon) {
      return res.status(404).json({ message: 'ไม่พบโค้ดส่วนลด' });
    }

    // Check if coupon belongs to user
    if (coupon.userId !== userId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ใช้โค้ดส่วนลดนี้' });
    }

    // Check if already used
    if (coupon.isUsed) {
      return res.status(400).json({ message: 'โค้ดส่วนลดนี้ถูกใช้ไปแล้ว' });
    }

    // Check if expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'โค้ดส่วนลดหมดอายุแล้ว' });
    }

    // Check minimum purchase
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return res.status(400).json({ 
        message: `ต้องซื้อสินค้าครบ ฿${coupon.minPurchase.toLocaleString()} ขึ้นไป` 
      });
    }

    // Calculate discount
    let discountAmount = coupon.discountAmount || 0;
    
    if (coupon.discountPercent) {
      const percentDiscount = (cartTotal * coupon.discountPercent) / 100;
      discountAmount = coupon.maxDiscount 
        ? Math.min(percentDiscount, coupon.maxDiscount)
        : percentDiscount;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountAmount,
        discountPercent: coupon.discountPercent
      }
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด' });
  }
};

// Apply coupon to order
exports.applyCouponToOrder = async (orderId, couponId, discountAmount) => {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        couponId,
        discountAmount,
        discountCode: (await prisma.coupon.findUnique({ where: { id: couponId } }))?.code
      }
    });

    // Mark coupon as used
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        isUsed: true,
        usedAt: new Date()
      }
    });

    return order;
  } catch (err) {
    console.error('Apply coupon to order error:', err);
    throw err;
  }
};

