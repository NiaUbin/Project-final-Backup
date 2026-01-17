const prisma = require('../config/prisma');
const { notifyUserPaymentStatus } = require('./notification');

// สร้างคำสั่งชำระเงิน (Mock Payment)
exports.createPayment = async (req, res) => {
    try {
        const { orderId, method = "cash", customerInfo = {} } = req.body;
        const userId = req.user.id;

        // ตรวจสอบว่า order มีอยู่และเป็นของ user นี้
        const order = await prisma.order.findFirst({
            where: {
                id: parseInt(orderId),
                orderedById: userId
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
        }

        // ตรวจสอบว่ามี payment อยู่แล้วหรือไม่
        const existingPayment = await prisma.payment.findFirst({
            where: {
                orderId: parseInt(orderId),
                status: { in: ["completed", "pending"] }
            }
        });

        if (existingPayment) {
            return res.status(400).json({ 
                message: "คำสั่งซื้อนี้มีการชำระเงินอยู่แล้ว",
                payment: existingPayment 
            });
        }

        // คำนวณยอดรวม (รวม shipping fee ถ้ามี)
        const shippingFee = req.body.shippingFee || 0;
        const totalAmount = order.cartTotal + shippingFee;

        // กำหนดสถานะเริ่มต้น
        // สำหรับ QR code payment จะเป็น pending จนกว่าจะอัพโหลดสลีป
        // สำหรับ COD และ credit card จะเป็น completed ทันที
        let initialStatus = "completed";
        let qrCodeData = null;
        
        if (method === "qr_code") {
            initialStatus = "pending";
            // สร้าง QR code data สำหรับ PromptPay
            const qrString = `00020101021229370016A000000677010111011300661234567890123450208PROMPTPAY5802TH530376463${totalAmount.toFixed(2).padStart(10, '0')}6304`;
            qrCodeData = qrString;
        }

        // สร้าง Payment record
        const payment = await prisma.payment.create({
            data: {
                amount: totalAmount,
                currency: "THB",
                method: method,
                status: initialStatus,
                customerEmail: customerInfo.email || req.user.email,
                customerName: customerInfo.name || req.user.name,
                customerPhone: customerInfo.phone || req.user.phone || "",
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                qrCodeData: qrCodeData,
                metadata: JSON.stringify({
                    orderItems: order.products.length,
                    paymentMethod: method,
                    customerAddress: customerInfo.address || req.user.address || "",
                    shippingFee: shippingFee,
                    timestamp: new Date().toISOString()
                }),
                orderId: parseInt(orderId)
            }
        });
        
        // อัพเดต Order ให้มีที่อยู่จัดส่ง (ถ้ามี field ใน schema)
        const updateData = {};
        if (customerInfo.address || req.user.address) {
            updateData.shippingAddress = customerInfo.address || req.user.address;
        }
        if (customerInfo.phone || req.user.phone) {
            updateData.shippingPhone = customerInfo.phone || req.user.phone;
        }
        
        if (Object.keys(updateData).length > 0) {
            await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: updateData
            });
        }

        // อัพเดตสถานะ order
        // ถ้าเป็น QR code payment จะยังไม่เปลี่ยนสถานะจนกว่าจะอัพโหลดสลีป
        if (method !== "qr_code") {
            await prisma.order.update({
                where: { id: parseInt(orderId) },
                data: { oderStatus: "Processing" }
            });
        }

        res.status(201).json({
            message: method === "qr_code" 
                ? "สร้างคำสั่งชำระเงิน QR Code สำเร็จ กรุณาสแกนและอัพโหลดสลีป" 
                : "ชำระเงินสำเร็จ! คำสั่งซื้อของคุณอยู่ในขั้นตอนการดำเนินการ",
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                status: payment.status,
                transactionId: payment.transactionId,
                qrCodeData: payment.qrCodeData,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำสั่งชำระเงิน" });
    }
};

// ดูประวัติการชำระเงิน
exports.getPayments = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await prisma.payment.findMany({
            where: {
                order: {
                    orderedById: userId
                }
            },
            include: {
                order: {
                    include: {
                        products: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            message: "ดึงประวัติการชำระเงินสำเร็จ",
            payments
        });

    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน" });
    }
};

// ดูรายละเอียดการชำระเงิน
exports.getPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(id),
                order: {
                    orderedById: userId
                }
            },
            include: {
                order: {
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
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        res.status(200).json({
            message: "ดึงข้อมูลการชำระเงินสำเร็จ",
            payment
        });

    } catch (error) {
        console.error('Error getting payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน" });
    }
};

// จำลอง Webhook สำหรับ Payment Gateway
exports.paymentWebhook = async (req, res) => {
    try {
        const { transactionId, status, gatewayId } = req.body;

        // ค้นหา payment จาก transactionId
        const payment = await prisma.payment.findFirst({
            where: { transactionId: transactionId }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบธุรกรรม" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: status,
                gatewayId: gatewayId,
                gatewayStatus: status,
                updatedAt: new Date()
            }
        });

        // อัพเดตสถานะ order หากชำระเงินสำเร็จ
        if (status === "completed") {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { oderStatus: "Processing" }
            });
        } else if (status === "failed") {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { oderStatus: "Payment Failed" }
            });
        }

        res.status(200).json({
            message: "อัพเดตสถานะการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผล webhook" });
    }
};

// [Admin] ดูประวัติการชำระเงินทั้งหมด
exports.getAllPayments = async (req, res) => {
    try {
        const { status, method, page = 1, limit = 20 } = req.query;
        
        const where = {};
        if (status) where.status = status;
        if (method) where.method = method;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                order: {
                    include: {
                        orderedBy: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        },
                        products: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        title: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        const total = await prisma.payment.count({ where });

        res.status(200).json({
            message: "ดึงประวัติการชำระเงินทั้งหมดสำเร็จ",
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting all payments:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน" });
    }
};

// [Admin] อนุมัติการชำระเงิน
exports.approvePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const adminId = req.user.id;
        const adminName = req.user.name || req.user.email;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                order: {
                    include: {
                        orderedBy: { select: { name: true, email: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status !== "waiting_approval") {
            return res.status(400).json({ message: "การชำระเงินนี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                status: "completed",
                approvedBy: adminId,
                approvedAt: new Date()
            }
        });

        // อัพเดตสถานะ order
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Processing" }
        });

        // ส่งแจ้งเตือนให้ลูกค้า
        await notifyUserPaymentStatus(payment, 'approved', adminName);

        // ลบแจ้งเตือนรอการอนุมัติ
        await prisma.notification.deleteMany({
            where: {
                paymentId: parseInt(paymentId),
                type: 'payment_pending'
            }
        });

        res.status(200).json({
            message: "อนุมัติการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอนุมัติการชำระเงิน" });
    }
};

// [Admin] ปฏิเสธการชำระเงิน
exports.rejectPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;
        const adminName = req.user.name || req.user.email;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                order: {
                    include: {
                        orderedBy: { select: { name: true, email: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status !== "waiting_approval") {
            return res.status(400).json({ message: "การชำระเงินนี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" });
        }

        // อัพเดตสถานะการชำระเงิน
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                status: "failed",
                rejectedBy: adminId,
                rejectedAt: new Date(),
                rejectionReason: reason || "ไม่ระบุเหตุผล"
            }
        });

        // อัพเดตสถานะ order กลับเป็น "Not Process"
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Not Process" }
        });

        // ส่งแจ้งเตือนให้ลูกค้า
        await notifyUserPaymentStatus(payment, 'rejected', adminName, reason);

        // ลบแจ้งเตือนรอการอนุมัติ
        await prisma.notification.deleteMany({
            where: {
                paymentId: parseInt(paymentId),
                type: 'payment_pending'
            }
        });

        res.status(200).json({
            message: "ปฏิเสธการชำระเงินสำเร็จ",
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการปฏิเสธการชำระเงิน" });
    }
};

// จำลองการชำระเงินผ่าน PromptPay
exports.generatePromptPayQR = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(paymentId),
                order: {
                    orderedById: userId
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status === "completed") {
            return res.status(400).json({ message: "การชำระเงินนี้เสร็จสิ้นแล้ว" });
        }

        // สร้าง Mock PromptPay QR Data
        const promptPayData = {
            amount: payment.amount,
            transactionId: payment.transactionId,
            qrString: payment.qrCodeData || `00020101021229370016A000000677010111011300661234567890123450208PROMPTPAY5802TH530376463${payment.amount.toFixed(2).padStart(10, '0')}6304`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // หมดอายุใน 15 นาที
            instructions: [
                "เปิดแอพธนาคารของคุณ",
                "เลือกสแกน QR Code",
                "สแกน QR Code นี้",
                "ตรวจสอบยอดเงินและกดยืนยัน",
                "อัพโหลดรูปสลีปการโอนเงิน"
            ]
        };

        res.status(200).json({
            message: "สร้าง PromptPay QR Code สำเร็จ",
            promptPay: promptPayData,
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                transactionId: payment.transactionId
            }
        });

    } catch (error) {
        console.error('Error generating PromptPay QR:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้าง PromptPay QR" });
    }
};

// อัพโหลดสลีปการโอนเงินสำหรับ QR code payment
exports.uploadPaymentSlip = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        // ตรวจสอบ payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: parseInt(paymentId),
                order: {
                    orderedById: userId
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการชำระเงิน" });
        }

        if (payment.status === "completed") {
            return res.status(400).json({ message: "การชำระเงินนี้เสร็จสิ้นแล้ว" });
        }

        if (payment.method !== "qr_code") {
            return res.status(400).json({ message: "วิธีการชำระเงินนี้ไม่รองรับการอัพโหลดสลีป" });
        }

        // ตรวจสอบว่ามีไฟล์อัพโหลดหรือไม่
        if (!req.file) {
            return res.status(400).json({ message: "กรุณาอัพโหลดรูปสลีปการโอนเงิน" });
        }

        // สร้าง URL ของสลีป (ใช้ SERVER_URL จาก env ถ้ามี)
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const normalizedServerUrl = serverUrl.endsWith('/')
            ? serverUrl.slice(0, -1)
            : serverUrl;
        const slipUrl = `${normalizedServerUrl}/uploads/payment-slips/${req.file.filename}`;

        // อัพเดต payment ด้วย URL ของสลีปและเปลี่ยนสถานะเป็น completed
        const updatedPayment = await prisma.payment.update({
            where: { id: parseInt(paymentId) },
            data: {
                paymentSlipUrl: slipUrl,
                status: "completed",
                updatedAt: new Date()
            }
        });

        // อัพเดตสถานะ order เป็น "Processing"
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { oderStatus: "Processing" }
        });

        res.status(200).json({
            message: "อัพโหลดสลีปสำเร็จ! การชำระเงินเสร็จสิ้นแล้ว",
            payment: {
                id: updatedPayment.id,
                amount: updatedPayment.amount,
                status: updatedPayment.status,
                paymentSlipUrl: updatedPayment.paymentSlipUrl,
                transactionId: updatedPayment.transactionId
            }
        });

    } catch (error) {
        console.error('Error uploading payment slip:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัพโหลดสลีป" });
    }
};
