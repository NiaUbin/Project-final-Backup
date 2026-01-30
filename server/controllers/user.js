const prisma = require('../config/prisma');
const { deleteFileByUrl } = require('../middlewares/upload');

exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                enabled: true,
                address: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        res.status(200).json({ 
            message: "ดึงข้อมูลผู้ใช้สำเร็จ", 
            users,
            count: users.length 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;
        console.log(id, enabled);
        const userId = parseInt(id);
        
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if(!user){
            return res.status(404).json({ message: "ผู้ใช้งานไม่พบ" });
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { enabled: Boolean(enabled) }
        });
        
        res.status(200).json({ message: "อัพเดตสถานะผู้ใช้สำเร็จ", updatedUser });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพเดตสถานะผู้ใช้" });
    }
};

exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        const userId = parseInt(id);
        
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if(!user){
            return res.status(404).json({ message: "ผู้ใช้งานไม่พบ" });
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: role }
        });
        
        res.status(200).json({ message: "อัพเดตสิทธิ์ผู้ใช้สำเร็จ", updatedUser });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพเดตสิทธิ์ผู้ใช้" });
    }
};

exports.userCart = async (req, res) => {
    try {
        const { productId, count, price, productData } = req.body;
        const userId = req.user.id; // จาก authCheck middleware
        
        // ดึงข้อมูลสินค้า
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) }
        });
        
        if (!product) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }
        
        // ใช้ราคาที่ส่งมา (ถ้ามี) หรือใช้ราคาจากสินค้า
        const priceToUse = price ? parseFloat(price) : product.price;

        // เตรียมข้อมูล variants (ถ้ามี)
        const selectedVariants = productData && productData.selectedVariants 
            ? JSON.stringify(productData.selectedVariants) 
            : null;
        
        // หาหรือสร้างตะกร้า
        let cart = await prisma.cart.findFirst({
            where: { orderedById: userId }
        });
        
        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    orderedById: userId,
                    cartTotal: 0
                }
            });
        }
        
        // เพิ่มสินค้าลงตะกร้า
        await prisma.productOnCart.create({
            data: {
                cartId: cart.id,
                productId: parseInt(productId),
                count: parseInt(count),
                price: priceToUse, // ใช้ราคาที่ส่งมา หรือราคาตาม variant
                selectedVariants: selectedVariants
            }
        });
        
        // อัพเดตยอดรวม
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { cartTotal: { increment: priceToUse * parseInt(count) } },
            include: { 
                products: { 
                    include: { 
                        product: { 
                            include: { 
                                images: true, 
                                category: true 
                            } 
                        } 
                    } 
                } 
            }
        });
        
        res.status(200).json({ message: "เพิ่มสินค้าลงตะกร้าสำเร็จ", cart: updatedCart });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า" });
    }
};

exports.getUserCart = async (req, res) => {
    try {
        const userId = req.user.id; // จาก authCheck middleware
        
        const cart = await prisma.cart.findFirst({
            where: { orderedById: userId },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!cart) {
            return res.status(200).json({ message: "ตะกร้าว่าง", cart: null });
        }
        
        res.status(200).json({ message: "ดึงข้อมูลตะกร้าสำเร็จ", cart });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า" });
    }
};

exports.emptyCart = async (req, res) => {
    try {
        const userId = req.user.id; // จาก authCheck middleware
        
        // หาตะกร้าของผู้ใช้
        const cart = await prisma.cart.findFirst({
            where: { orderedById: userId }
        });
        
        if (!cart) {
            return res.status(404).json({ message: "ไม่พบตะกร้า" });
        }
        
        // ลบสินค้าทั้งหมดในตะกร้า
        await prisma.productOnCart.deleteMany({
            where: { cartId: cart.id }
        });
        
        // อัพเดตยอดรวมเป็น 0
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { cartTotal: 0 }
        });
        
        res.status(200).json({ 
            message: "ล้างตะกร้าสำเร็จ", 
            cart: updatedCart 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการล้างตะกร้า" });
    }
};

// อัพเดตจำนวนสินค้าในตะกร้า
exports.updateCartItemQuantity = async (req, res) => {
    try {
        const { cartItemId, newQuantity } = req.body;
        const userId = req.user.id;
        
        if (!cartItemId || newQuantity < 0) {
            return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
        }
        
        // หาตะกร้าของผู้ใช้
        const cart = await prisma.cart.findFirst({
            where: { orderedById: userId }
        });
        
        if (!cart) {
            return res.status(404).json({ message: "ไม่พบตะกร้า" });
        }
        
        // หา cart item ที่ต้องการอัพเดต
        const cartItem = await prisma.productOnCart.findFirst({
            where: { 
                id: parseInt(cartItemId),
                cartId: cart.id
            },
            include: { product: true }
        });
        
        if (!cartItem) {
            return res.status(404).json({ message: "ไม่พบสินค้าในตะกร้า" });
        }
        
        // คำนวณความแตกต่างของราคา
        const oldTotal = cartItem.price * cartItem.count;
        const newTotal = cartItem.price * parseInt(newQuantity);
        const priceDifference = newTotal - oldTotal;
        
        if (parseInt(newQuantity) === 0) {
            // ลบสินค้าออกจากตะกร้า
            await prisma.productOnCart.delete({
                where: { id: parseInt(cartItemId) }
            });
        } else {
            // อัพเดตจำนวน
            await prisma.productOnCart.update({
                where: { id: parseInt(cartItemId) },
                data: { count: parseInt(newQuantity) }
            });
        }
        
        // อัพเดตยอดรวมในตะกร้า
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { cartTotal: { increment: priceDifference } },
            include: { 
                products: { 
                    include: { 
                        product: { 
                            include: { 
                                images: true, 
                                category: true 
                            } 
                        } 
                    } 
                } 
            }
        });
        
        res.status(200).json({ 
            message: parseInt(newQuantity) === 0 ? "ลบสินค้าสำเร็จ" : "อัพเดตจำนวนสำเร็จ", 
            cart: updatedCart 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพเดตตะกร้า" });
    }
};

// ลบสินค้าชิ้นเดียวออกจากตะกร้า
exports.removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.body;
        const userId = req.user.id;
        
        if (!cartItemId) {
            return res.status(400).json({ message: "กรุณาระบุรหัสสินค้า" });
        }
        
        // หาตะกร้าของผู้ใช้
        const cart = await prisma.cart.findFirst({
            where: { orderedById: userId }
        });
        
        if (!cart) {
            return res.status(404).json({ message: "ไม่พบตะกร้า" });
        }
        
        // หา cart item ที่ต้องการลบ
        const cartItem = await prisma.productOnCart.findFirst({
            where: { 
                id: parseInt(cartItemId),
                cartId: cart.id
            }
        });
        
        if (!cartItem) {
            return res.status(404).json({ message: "ไม่พบสินค้าในตะกร้า" });
        }
        
        // คำนวณราคาที่จะถูกลบ
        const totalPrice = cartItem.price * cartItem.count;
        
        // ลบสินค้าออกจากตะกร้า
        await prisma.productOnCart.delete({
            where: { id: parseInt(cartItemId) }
        });
        
        // อัพเดตยอดรวมในตะกร้า
        const updatedCart = await prisma.cart.update({
            where: { id: cart.id },
            data: { cartTotal: { decrement: totalPrice } },
            include: { 
                products: { 
                    include: { 
                        product: { 
                            include: { 
                                images: true, 
                                category: true 
                            } 
                        } 
                    } 
                } 
            }
        });
        
        res.status(200).json({ 
            message: "ลบสินค้าออกจากตะกร้าสำเร็จ", 
            cart: updatedCart 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" });
    }
};

exports.saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const userId = req.user.id; // จาก authCheck middleware
        
        if (!address) {
            return res.status(400).json({ message: "กรุณาระบุที่อยู่" });
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { address: address },
            select: {
                id: true,
                email: true,
                name: true,
                address: true,
                updatedAt: true
            }
        });
        
        res.status(200).json({ 
            message: "อัพเดตที่อยู่สำเร็จ", 
            user: updatedUser 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพเดตที่อยู่" });
    }
};

// ดึงข้อมูล profile ปัจจุบันของผู้ใช้ที่ล็อกอิน
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                address: true,
                phone: true,
                picture: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }

        res.status(200).json({
            message: "ดึงข้อมูล profile สำเร็จ",
            user
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการดึงข้อมูล profile",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// อัพเดตข้อมูล profile (ชื่อและที่อยู่)
exports.updateProfile = async (req, res) => {
    try {
        const { name, address, phone, picture, email } = req.body;
        const userId = req.user.id; // จาก authCheck middleware
        
        // Build update data object
        const updateData = {};
        
        if (name && name.trim()) {
            updateData.name = name.trim();
        }
        
        if (address !== undefined) {
            updateData.address = address ? address.trim() : null;
        }
        
        if (phone !== undefined) {
            updateData.phone = phone ? phone.trim() : null;
        }
        
        if (picture !== undefined) {
            updateData.picture = picture ? picture.trim() : null;
        }

        // Handle email change
        if (email && email.trim() && email !== req.user.email) {
            // Check if new email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: email.trim() }
            });
            
            if (existingUser) {
                return res.status(400).json({ message: "อีเมลนี้มีอยู่ในระบบแล้ว" });
            }
            
            updateData.email = email.trim();
        }
        
        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "ไม่มีข้อมูลที่ต้องการอัพเดต" });
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                address: true,
                phone: true,
                picture: true,
                role: true,
                updatedAt: true
            }
        });
        
        res.status(200).json({ 
            message: "อัพเดตข้อมูล profile สำเร็จ", 
            user: updatedUser 
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการอัพเดตข้อมูล profile",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// เปลี่ยนรหัสผ่าน
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        // Validation
        if (!currentPassword) {
            return res.status(400).json({ message: "กรุณากรอกรหัสผ่านปัจจุบัน" });
        }
        
        if (!newPassword) {
            return res.status(400).json({ message: "กรุณากรอกรหัสผ่านใหม่" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
        }
        
        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน" });
        }
        
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }
        
        // Check if user has a password (OAuth users don't have password)
        if (!user.password) {
            return res.status(400).json({ message: "บัญชีนี้ใช้การเข้าสู่ระบบผ่านโซเชียลมีเดีย (Facebook/Google) ไม่สามารถเปลี่ยนรหัสผ่านได้" });
        }
        
        // Verify current password
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
        }
        
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        
        res.status(200).json({ 
            message: "เปลี่ยนรหัสผ่านสำเร็จ" 
        });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.saveOrder = async (req, res) => {
    try {
        const { cartTotal, orderStatus = "Not Process", couponId, discountAmount = 0 } = req.body;
        const userId = req.user.id; // จาก authCheck middleware
        
        // หาตะกร้าของผู้ใช้
        const cart = await prisma.cart.findFirst({
            where: { orderedById: userId },
            include: { products: true }
        });
        
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: "ไม่พบสินค้าในตะกร้า" });
        }
        
        // คำนวณยอดรวมหลังหักส่วนลด
        const finalTotal = Math.max(0, cart.cartTotal - (discountAmount || 0));

        // สร้าง order ใหม่
        const order = await prisma.order.create({
            data: {
                orderedById: userId,
                cartTotal: finalTotal,
                discountAmount: discountAmount || 0,
                discountCode: couponId ? (await prisma.coupon.findUnique({ where: { id: couponId } }))?.code : null,
                couponId: couponId || null,
                oderStatus: orderStatus
            }
        });

        // Mark coupon as used if applied
        if (couponId) {
            try {
                const couponCtrl = require('./coupon');
                await couponCtrl.applyCouponToOrder(order.id, couponId, discountAmount);
            } catch (couponError) {
                console.error('Error applying coupon:', couponError);
                // ไม่ให้ error นี้กระทบการสร้าง order
            }
        }
        
        // ย้ายสินค้าจากตะกร้าไปยัง order และอัปเดตยอดขาย
        for (const cartItem of cart.products) {
            await prisma.productOnOrder.create({
                data: {
                    orderId: order.id,
                    productId: cartItem.productId,
                    count: cartItem.count,
                    price: cartItem.price,
                    selectedVariants: cartItem.selectedVariants
                }
            });
            
            // อัปเดตยอดขายสินค้า (เพิ่ม sold และลดจำนวนสินค้าคงคลัง)
            await prisma.product.update({
                where: { id: cartItem.productId },
                data: {
                    sold: { increment: cartItem.count },
                    quantity: { decrement: cartItem.count }
                }
            });
        }
        
        // ล้างตะกร้าหลังสั่งซื้อ
        await prisma.productOnCart.deleteMany({
            where: { cartId: cart.id }
        });
        
        await prisma.cart.update({
            where: { id: cart.id },
            data: { cartTotal: 0 }
        });
        
        // ดึงข้อมูล order พร้อม products
        const orderWithProducts = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });
        
        res.status(200).json({ 
            message: "สร้างคำสั่งซื้อสำเร็จ", 
            order: orderWithProducts 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const userId = req.user.id; // จาก authCheck middleware
        
        // ดึงคำสั่งซื้อทั้งหมดของผู้ใช้
        const orders = await prisma.order.findMany({
            where: { orderedById: userId },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                category: true,
                                store: true
                            }
                        }
                    }
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        status: true,
                        transactionId: true,
                        qrCodeData: true,
                        paymentSlipUrl: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        res.status(200).json({ 
            message: "ดึงข้อมูลคำสั่งซื้อสำเร็จ", 
            orders,
            count: orders.length 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" });
    }
};

// Admin only - Get All Orders
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const where = {};
        if (status) where.oderStatus = status;

        const orders = await prisma.order.findMany({
            where,
            include: {
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                },
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                images: true
                            }
                        }
                    }
                },
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        status: true,
                        transactionId: true,
                        customerName: true,
                        customerPhone: true,
                        customerEmail: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        const total = await prisma.order.count({ where });

        res.status(200).json({
            message: "ดึงข้อมูลคำสั่งซื้อทั้งหมดสำเร็จ",
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" });
    }
};

// Admin only - Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
        }

        const validStatuses = ['Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
        }

        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) }
        });

        if (!order) {
            return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { oderStatus: status },
            include: {
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                },
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                images: true
                            }
                        }
                    }
                },
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        status: true,
                        transactionId: true,
                        customerName: true,
                        customerPhone: true,
                        customerEmail: true,
                        createdAt: true
                    }
                }
            }
        });

        // Realtime notify the customer (if socket.io is available)
        try {
            const io = req.app?.locals?.io;
            const customerId = updatedOrder?.orderedBy?.id;
            if (io && customerId) {
                io.to(`user_${customerId}`).emit('order_status_updated', {
                    orderId: updatedOrder.id,
                    status: updatedOrder.oderStatus,
                    order: updatedOrder
                });
            }
        } catch (socketError) {
            console.warn('Socket emit failed:', socketError?.message || socketError);
        }

        res.status(200).json({
            message: 'อัพเดตสถานะคำสั่งซื้อสำเร็จ',
            order: updatedOrder
        });

    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะ' });
    }
};

// Admin only - Delete Order
exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Check if order exists
        const existingOrder = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: {
                payments: true,
                products: true
            }
        });

        if (!existingOrder) {
            return res.status(404).json({ message: "ไม่พบคำสั่งซื้อที่ต้องการลบ" });
        }

        // Delete related records first (due to foreign key constraints)
        // Delete payments
        if (existingOrder.payments.length > 0) {
            await prisma.payment.deleteMany({
                where: { orderId: parseInt(orderId) }
            });
        }

        // Delete order products
        if (existingOrder.products.length > 0) {
            await prisma.productOnOrder.deleteMany({
                where: { orderId: parseInt(orderId) }
            });
        }

        // Finally delete the order
        await prisma.order.delete({
            where: { id: parseInt(orderId) }
        });

        res.status(200).json({ 
            message: "ลบคำสั่งซื้อสำเร็จ",
            deletedOrderId: parseInt(orderId)
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบคำสั่งซื้อ" });
    }
};

// Admin only - Get Analytics Data
exports.getAnalytics = async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        // Get orders within date range
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                },
                payments: true
            }
        });

        // Get all users for conversion rate calculation
        const totalUsers = await prisma.user.count();
        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Calculate metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.cartTotal || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers * 100) : 0;

        // Calculate daily sales for trend
        const dailySales = {};
        const dailyOrders = {};
        
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            dailySales[date] = (dailySales[date] || 0) + (order.cartTotal || 0);
            dailyOrders[date] = (dailyOrders[date] || 0) + 1;
        });

        // Order status distribution
        const ordersByStatus = await prisma.order.groupBy({
            by: ['oderStatus'],
            _count: {
                id: true
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Top products by revenue
        const productSales = {};
        orders.forEach(order => {
            order.products.forEach(item => {
                const productId = item.product.id;
                const productName = item.product.title;
                const revenue = item.price * item.count;
                
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: productName,
                        revenue: 0,
                        quantity: 0
                    };
                }
                
                productSales[productId].revenue += revenue;
                productSales[productId].quantity += item.count;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Category distribution
        const categoryData = {};
        orders.forEach(order => {
            order.products.forEach(item => {
                const categoryName = item.product.category?.name || 'ไม่ระบุหมวดหมู่';
                const revenue = item.price * item.count;
                
                categoryData[categoryName] = (categoryData[categoryName] || 0) + revenue;
            });
        });

        // Monthly sales data for current and previous year
        const currentYear = new Date().getFullYear();
        const monthlySales = {};
        
        // Get orders for current and previous year
        const yearlyOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: new Date(`${currentYear - 1}-01-01`),
                    lte: new Date(`${currentYear + 1}-01-01`)
                }
            }
        });

        yearlyOrders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            monthlySales[monthKey] = (monthlySales[monthKey] || 0) + (order.cartTotal || 0);
        });

        res.status(200).json({
            message: "ดึงข้อมูลวิเคราะห์สำเร็จ",
            analytics: {
                summary: {
                    totalUsers,
                    newUsers,
                    totalOrders,
                    totalRevenue,
                    averageOrderValue,
                    conversionRate
                },
                trends: {
                    dailySales,
                    dailyOrders
                },
                orderStatus: ordersByStatus,
                topProducts,
                categoryDistribution: categoryData,
                monthlySales,
                timeRange
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลวิเคราะห์" });
    }
};

// Admin only - Delete User (ลบได้ทุกคน ไม่ติดข้อแม้)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        const userId = parseInt(id);
        
        // ตรวจสอบว่า user มีอยู่จริง
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                orders: {
                    include: {
                        payments: true,
                        products: true
                    }
                },
                carts: {
                    include: {
                        products: true
                    }
                },
                stores: {
                    include: {
                        products: {
                            include: {
                                images: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ต้องการลบ" });
        }
        
        // ลบข้อมูลที่เกี่ยวข้องทั้งหมดแบบ manual (เพื่อหลีกเลี่ยง Foreign Key Constraint)
        
        // 1. ลบ Payments (ผ่าน Orders)
        for (const order of user.orders) {
            if (order.payments && order.payments.length > 0) {
                await prisma.payment.deleteMany({
                    where: { orderId: order.id }
                });
            }
            
            // 2. ลบ ProductOnOrder
            if (order.products && order.products.length > 0) {
                await prisma.productOnOrder.deleteMany({
                    where: { orderId: order.id }
                });
            }
        }
        
        // 3. ลบ Orders
        if (user.orders && user.orders.length > 0) {
            await prisma.order.deleteMany({
                where: { orderedById: userId }
            });
        }
        
        // 4. ลบ ProductOnCart
        for (const cart of user.carts) {
            if (cart.products && cart.products.length > 0) {
                await prisma.productOnCart.deleteMany({
                    where: { cartId: cart.id }
                });
            }
        }
        
        // 5. ลบ Carts
        if (user.carts && user.carts.length > 0) {
            await prisma.cart.deleteMany({
                where: { orderedById: userId }
            });
        }
        
        // 6. ลบ Store และ Products (ถ้าเป็น seller)
        if (user.stores && user.stores.length > 0) {
            for (const store of user.stores) {
                // ลบ Products และ Images
                if (store.products && store.products.length > 0) {
                    for (const product of store.products) {
                        // ลบ Images
                        if (product.images && product.images.length > 0) {
                            await prisma.image.deleteMany({
                                where: { productId: product.id }
                            });
                        }
                        
                        // ลบ ProductOnCart ที่มี product นี้
                        await prisma.productOnCart.deleteMany({
                            where: { productId: product.id }
                        });
                        
                        // ลบ ProductOnOrder ที่มี product นี้
                        await prisma.productOnOrder.deleteMany({
                            where: { productId: product.id }
                        });
                        
                        // ลบ Product
                        await prisma.product.delete({
                            where: { id: product.id }
                        });
                    }
                }
                
                // ลบ Store
                await prisma.store.delete({
                    where: { id: store.id }
                });
            }
        }

        // 7. ลบข้อมูลที่อ้างถึง userId โดยตรง (เช่น คูปอง, รีวิว) กันปัญหา Foreign Key
        // ลบคูปองทั้งหมดที่ผูกกับผู้ใช้นี้
        await prisma.coupon.deleteMany({
            where: { userId }
        });

        // ลบรีวิวทั้งหมดที่ผู้ใช้นี้เป็นคนเขียน (กัน FK ที่ userId ในตาราง Review)
        await prisma.review.deleteMany({
            where: { userId }
        });
        
        // 8. สุดท้าย ลบ User
        await prisma.user.delete({
            where: { id: userId }
        });
        
        res.status(200).json({ 
            message: `ลบผู้ใช้ ${user.name || user.email} สำเร็จ - ลบข้อมูลทั้งหมดที่เกี่ยวข้องแล้ว`,
            deletedUser: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการลบผู้ใช้",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// อัพโหลดรูปภาพโปรไฟล์
exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file || !req.file.url) {
            return res.status(400).json({ message: "ไม่พบไฟล์ที่อัพโหลด" });
        }
        
        const newPictureUrl = req.file.url;
        
        // 1. ดึงข้อมูลผู้ใช้เดิมเพื่อดูว่ามีรูปเก่าหรือไม่
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { picture: true }
        });
        
        // 2. ถ้ามีรูปเก่าและเป็นรูปจาก Cloudinary (ไม่ใช่ Google) ให้ลบออก
        if (user.picture) {
            // เช็คว่าเป็นรูป Cloudinary หรือไม่
            if (user.picture.includes('cloudinary')) {
                await deleteFileByUrl(user.picture);
            }
        }
        
        // 3. อัพเดต URL รูปใหม่ลงฐานข้อมูล
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { picture: newPictureUrl },
            select: {
                id: true,
                email: true,
                name: true,
                picture: true
            }
        });
        
        res.status(200).json({
            message: "อัพโหลดรูปโปรไฟล์สำเร็จ",
            profilePicture: updatedUser.picture,
            user: updatedUser
        });
        
    } catch (err) {
        console.error('Upload profile picture error:', err);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการอัพโหลดรูปโปรไฟล์",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};