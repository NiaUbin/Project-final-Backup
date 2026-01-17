const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper: get JWT secret from env and fail fast if missing
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
};

// OAuth callback handler - generates JWT and redirects to frontend
exports.oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=oauth_failed`);
    }

    // สร้าง welcome coupon สำหรับผู้ใช้ใหม่ (ถ้ายังไม่มี)
    try {
      const couponCtrl = require('./coupon');
      await couponCtrl.createWelcomeCoupon(user.id);
    } catch (couponError) {
      console.error('Error creating welcome coupon in OAuth:', couponError);
      // ไม่ให้ error นี้กระทบการ login
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3001'}/login?error=oauth_failed`);
  }
};

exports.register = async (req, res) => {
    try {
        const { email, password, name, role = 'user', address, phone } = req.body;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!email) {
            return res.status(400).json({ message: "กรุณาระบุอีเมล" });
        }
        if (!password) {
            return res.status(400).json({ message: "กรุณาระบุรหัสผ่าน" });
        }
        if (!name) {
            return res.status(400).json({ message: "กรุณาระบุชื่อ" });
        }

        // ตรวจสอบ role ที่อนุญาต
        const allowedRoles = ['user', 'admin', 'manager', 'seller'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "สิทธิ์การใช้งานไม่ถูกต้อง" });
        }

        // สำหรับ user role ต้องมีที่อยู่และเบอร์โทร
        if (role === 'user') {
            if (!address || !address.trim()) {
                return res.status(400).json({ message: "กรุณาระบุที่อยู่ในการจัดส่ง" });
            }
            if (!phone || !phone.trim()) {
                return res.status(400).json({ message: "กรุณาระบุเบอร์โทรศัพท์" });
            }
        }

        // ตรวจสอบว่าอีเมลซ้ำหรือไม่
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        // ถ้ามีข้อมูล ระบบจะแสดงข้อความว่า Email already exists
        if (existingUser) {
            return res.status(400).json({ message: "อีเมลนี้มีอยู่ในระบบแล้ว" });
        }

        // เข้ารหัสรหัสผ่าน
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(hashedPassword);

        // สร้างผู้ใช้ใหม่
        const userData = {
            email,
            password: hashedPassword,
            name,
            role: role,
            enabled: true
        };

        // เพิ่ม address และ phone สำหรับ user role
        if (role === 'user') {
            userData.address = address.trim();
            userData.phone = phone.trim();
        }

        const user = await prisma.user.create({
            data: userData
        });

        // ลบรหัสผ่านออกจากข้อมูลที่ส่งกลับ
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: "ลงทะเบียนผู้ใช้สำเร็จ",
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลงทะเบียน:', error);
        // ส่ง error message ที่ชัดเจนขึ้น
        const errorMessage = error.message || "เกิดข้อผิดพลาดในระบบ";
        res.status(500).json({ 
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!email || !password) {
            return res.status(400).json({ message: "กรุณาระบุอีเมลและรหัสผ่าน" });
        }

        // ค้นหาผู้ใช้จากอีเมล
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        if (!user.enabled) {
            return res.status(400).json({ message: "บัญชีนี้ถูกระงับการใช้งาน" });
        }

        // ตรวจสอบว่าผู้ใช้มีรหัสผ่านหรือไม่ (OAuth users ไม่มี password)
        if (!user.password) {
            return res.status(400).json({ message: "บัญชีนี้ใช้การเข้าสู่ระบบผ่านโซเชียลมีเดีย กรุณาเข้าสู่ระบบด้วย Facebook หรือ Google" });
        }

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        // สร้าง JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            getJwtSecret(),
            { expiresIn: '24h' }
        );

        // สร้าง welcome coupon สำหรับผู้ใช้ใหม่ (ถ้ายังไม่มี)
        try {
            const couponCtrl = require('./coupon');
            await couponCtrl.createWelcomeCoupon(user.id);
        } catch (couponError) {
            console.error('Error creating welcome coupon:', couponError);
            // ไม่ให้ error นี้กระทบการ login
        }

        // ลบรหัสผ่านออกจากข้อมูลที่ส่งกลับ
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};

exports.currentUser = async (req, res) => {
    try {
        // รับ token จาก header
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "ไม่พบ token สำหรับการยืนยันตัวตน" });
        }

        // ตรวจสอบ token
        const decoded = jwt.verify(token, getJwtSecret());
        
        // ดึงข้อมูลผู้ใช้
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        if (!user.enabled) {
            return res.status(400).json({ message: "บัญชีนี้ถูกระงับการใช้งาน" });
        }

        // ลบรหัสผ่านออกจากข้อมูลที่ส่งกลับ
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token หมดอายุแล้ว" });
        }
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};
