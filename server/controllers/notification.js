const prisma = require('../config/prisma');

// สร้างการแจ้งเตือน
exports.createNotification = async (type, title, message, options = {}) => {
    try {
        const {
            userId,
            targetRole,
            orderId,
            paymentId,
            productId,
            storeId,
            data
        } = options;

        const notification = await prisma.notification.create({
            data: {
                type,
                title,
                message,
                userId,
                targetRole,
                orderId,
                paymentId,
                productId,
                storeId,
                data: data ? JSON.stringify(data) : null
            }
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// สร้างการแจ้งเตือนเมื่อมีสินค้าใหม่
exports.notifyNewProduct = async (product, store) => {
    try {
        // ดึงรูปภาพสินค้าแรก
        const productImage = product.images && product.images.length > 0 
            ? product.images[0].url || product.images[0].secure_url 
            : null;

        // สร้าง notification สำหรับสินค้าใหม่
        await exports.createNotification(
            'new_product',
            '🆕 สินค้าใหม่เข้าแล้ว!',
            `ร้าน ${store.name} ได้เพิ่มสินค้าใหม่ "${product.title}" ราคา ฿${product.price.toLocaleString()}`,
            {
                targetRole: 'user', // แจ้งให้ user ทุกคนเห็น
                productId: product.id,
                storeId: store.id,
                data: {
                    productId: product.id,
                    productTitle: product.title,
                    productPrice: product.price,
                    productImage: productImage,
                    storeName: store.name,
                    storeLogo: store.logo,
                    storeId: store.id
                }
            }
        );

        console.log(`✅ สร้างแจ้งเตือนสินค้าใหม่สำเร็จ: ${product.title} จากร้าน ${store.name}`);
    } catch (error) {
        console.error('Error creating new product notification:', error);
    }
};

// ดึงการแจ้งเตือนสินค้าใหม่ (Public - ทุกคนดูได้)
exports.getNewProductNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                type: 'new_product'
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        const total = await prisma.notification.count({
            where: {
                type: 'new_product'
            }
        });

        // Parse data JSON สำหรับแต่ละ notification
        const notificationsWithData = notifications.map(n => ({
            ...n,
            data: n.data ? JSON.parse(n.data) : null
        }));

        res.status(200).json({
            message: "ดึงการแจ้งเตือนสินค้าใหม่สำเร็จ",
            notifications: notificationsWithData,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting new product notifications:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงการแจ้งเตือน" });
    }
};

// ส่งแจ้งเตือนให้ Admin เมื่อมีการชำระเงิน
exports.notifyAdminsPaymentPending = async (payment) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: payment.orderId },
            include: {
                orderedBy: { select: { id: true, name: true, email: true } },
                products: {
                    include: {
                        product: { select: { title: true } }
                    }
                }
            }
        });

        if (!order) return;

        const productNames = order.products.map(p => p.product.title).join(', ');
        
        await exports.createNotification(
            'payment_pending',
            '🔔 มีการชำระเงินรอการอนุมัติ',
            `ลูกค้า ${order.orderedBy.name || order.orderedBy.email} ได้ทำการชำระเงิน ${payment.method.toUpperCase()} จำนวน ฿${payment.amount.toLocaleString()} สำหรับสินค้า: ${productNames}`,
            {
                targetRole: 'admin',
                orderId: order.id,
                paymentId: payment.id,
                data: {
                    customerName: order.orderedBy.name,
                    customerEmail: order.orderedBy.email,
                    amount: payment.amount,
                    method: payment.method,
                    productCount: order.products.length
                }
            }
        );

        console.log(`✅ ส่งแจ้งเตือนให้ Admin สำหรับ Payment ID: ${payment.id}`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};

// ส่งแจ้งเตือนให้ User เมื่อ Admin อนุมัติ/ปฏิเสธ
exports.notifyUserPaymentStatus = async (payment, status, adminName, reason = null) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: payment.orderId },
            include: { orderedBy: true }
        });

        if (!order) return;

        let title, message, type;
        
        if (status === 'approved') {
            type = 'payment_approved';
            title = '✅ การชำระเงินได้รับการอนุมัติ';
            message = `การชำระเงินจำนวน ฿${payment.amount.toLocaleString()} ได้รับการอนุมัติโดย ${adminName} เรียบร้อยแล้ว คำสั่งซื้อของคุณกำลังได้รับการดำเนินการ`;
        } else {
            type = 'payment_rejected';
            title = '❌ การชำระเงินถูกปฏิเสธ';
            message = `การชำระเงินจำนวน ฿${payment.amount.toLocaleString()} ถูกปฏิเสธโดย ${adminName}${reason ? ` เหตุผล: ${reason}` : ''}`;
        }

        await exports.createNotification(
            type,
            title,
            message,
            {
                userId: order.orderedById,
                orderId: order.id,
                paymentId: payment.id,
                data: {
                    amount: payment.amount,
                    method: payment.method,
                    adminName,
                    reason
                }
            }
        );

        console.log(`✅ ส่งแจ้งเตือนให้ User ID: ${order.orderedById} สำหรับ Payment ${status}`);
    } catch (error) {
        console.error('Error notifying user:', error);
    }
};

// ดูการแจ้งเตือนของ User
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { targetRole: req.user.role }
                ]
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            include: {
                order: {
                    include: {
                        orderedBy: { select: { name: true, email: true } }
                    }
                },
                payment: true
            }
        });

        const total = await prisma.notification.count({
            where: {
                OR: [
                    { userId: userId },
                    { targetRole: req.user.role }
                ]
            }
        });

        const unreadCount = await prisma.notification.count({
            where: {
                OR: [
                    { userId: userId },
                    { targetRole: req.user.role }
                ],
                isRead: false
            }
        });

        res.status(200).json({
            message: "ดึงการแจ้งเตือนสำเร็จ",
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            unreadCount
        });

    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงการแจ้งเตือน" });
    }
};

// ทำเครื่องหมายว่าอ่านแล้ว
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { userId: userId },
                    { targetRole: req.user.role }
                ]
            }
        });

        if (!notification) {
            return res.status(404).json({ message: "ไม่พบการแจ้งเตือน" });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });

        res.status(200).json({
            message: "ทำเครื่องหมายว่าอ่านแล้ว",
            notification: updatedNotification
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
};

// ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: {
                OR: [
                    { userId: userId },
                    { targetRole: req.user.role }
                ],
                isRead: false
            },
            data: { isRead: true }
        });

        res.status(200).json({
            message: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว"
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
};

// [Admin] ดูการแจ้งเตือนรอการอนุมัติ
exports.getPendingApprovals = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                type: 'payment_pending',
                targetRole: 'admin'
            },
            orderBy: { createdAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            include: {
                order: {
                    include: {
                        orderedBy: { select: { id: true, name: true, email: true } },
                        products: {
                            include: {
                                product: { select: { title: true, price: true } }
                            }
                        }
                    }
                },
                payment: true
            }
        });

        const total = await prisma.notification.count({
            where: {
                type: 'payment_pending',
                targetRole: 'admin'
            }
        });

        res.status(200).json({
            message: "ดึงรายการรอการอนุมัติสำเร็จ",
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting pending approvals:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงรายการรอการอนุมัติ" });
    }
};
