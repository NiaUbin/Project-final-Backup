const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Helper: get JWT secret from env and fail fast if missing
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Fail fast on server misconfiguration instead of silently using a weak default
        throw new Error('JWT_SECRET is not configured in environment variables');
    }
    return secret;
};

exports.authCheck = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        
        if (!token) {
            return res.status(401).json({ message: "ไม่พบ Token" });
        }

        // Remove 'Bearer ' prefix if exists
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        
        // Verify token with strong secret from env (no fallback)
        const decoded = jwt.verify(cleanToken, getJwtSecret());
        
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                enabled: true,
                address: true,
                phone: true
            }
        });

        if (!user) {
            return res.status(401).json({ message: "ไม่พบผู้ใช้" });
        }

        if (!user.enabled) {
            return res.status(401).json({ message: "บัญชีถูกปิดใช้งาน" });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Auth error:', error);

        // If server is misconfigured, surface a clear error in development
        if (error.message === 'JWT_SECRET is not configured in environment variables') {
            return res.status(500).json({ 
                message: "Server authentication configuration error",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
    }
};

exports.adminCheck = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
        }
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
    }
};

// Check if user is seller or admin
exports.sellerCheck = async (req, res, next) => {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "ต้องเป็นผู้ขายหรืแอดมินเท่านั้น" });
        }
        next();
    } catch (error) {
        console.error('Seller check error:', error);
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึง" });
    }
};