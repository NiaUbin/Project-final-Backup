const prisma = require('../config/prisma');

exports.createStore = async (req, res) => {
  try {
    const { name, description, logo } = req.body;

    // Check existing store for this user
    const existing = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
    if (existing) {
      return res.status(400).json({ message: 'คุณมีร้านค้าแล้ว', store: existing });
    }

    const store = await prisma.store.create({
      data: { name, description, logo, ownerId: req.user.id }
    });

    // Upgrade role to seller if not already
    if (req.user.role !== 'seller') {
      await prisma.user.update({ where: { id: req.user.id }, data: { role: 'seller' } });
    }

    res.status(201).json({ message: 'สร้างร้านค้าสำเร็จ', store });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างร้านค้า' });
  }
};

exports.getMyStore = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { ownerId: req.user.id },
      include: { products: { include: { images: true, category: true } } }
    });
    res.json({ store });
  } catch (error) {
    console.error('Get my store error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

exports.updateMyStore = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const store = await prisma.store.findFirst({ where: { ownerId: req.user.id } });
    if (!store) return res.status(404).json({ message: 'ยังไม่มีร้านค้า' });
    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { name, description, logo }
    });
    res.json({ message: 'อัปเดตร้านค้าสำเร็จ', store: updated });
  } catch (error) {
    console.error('Update my store error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

exports.listStores = async (_req, res) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: { products: { take: 4, include: { images: true } } }
    });
    res.json({ stores });
  } catch (error) {
    console.error('List stores error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

exports.getStore = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = parseInt(id);
    
    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({ message: 'รหัสร้านค้าไม่ถูกต้อง' });
    }
    
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        products: { 
          include: { 
            images: true, 
            category: true 
          } 
        }
      }
    });
    
    if (!store) {
      return res.status(404).json({ message: 'ไม่พบร้านค้า' });
    }
    
    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านค้า',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ดึงข้อมูลการขายของร้านค้า (สินค้า จำนวนที่ขาย ใครซื้อ ยอดรวม)
exports.getStoreSales = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // หาร้านค้าของ seller
    const store = await prisma.store.findFirst({
      where: { ownerId: sellerId }
    });
    
    if (!store) {
      return res.status(404).json({ message: 'ไม่พบร้านค้า' });
    }
    
    // ดึงคำสั่งซื้อทั้งหมดที่มีสินค้าจากร้านนี้
    const orders = await prisma.order.findMany({
      include: {
        orderedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        products: {
          include: {
            product: {
              include: {
                images: true,
                category: true
              }
            }
          }
        },
        payments: {
          select: {
            method: true,
            status: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // กรองเฉพาะคำสั่งซื้อที่มีสินค้าจากร้านนี้
    const filteredOrders = orders.filter(order => 
      order.products.some(item => item.product && item.product.storeId === store.id)
    );
    
    // จัดกลุ่มข้อมูลตามสินค้า
    const productSales = {};
    
    filteredOrders.forEach(order => {
      order.products.forEach(orderItem => {
        const product = orderItem.product;
        if (!product || product.storeId !== store.id) return;
        
        const productId = product.id;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            product: {
              id: product.id,
              title: product.title,
              price: product.price,
              images: product.images,
              category: product.category
            },
            totalQuantity: 0,
            totalRevenue: 0,
            sales: [] // รายละเอียดการขายแต่ละครั้ง
          };
        }
        
        productSales[productId].totalQuantity += orderItem.count;
        productSales[productId].totalRevenue += orderItem.price * orderItem.count;
        
        // เก็บข้อมูลการขายแต่ละครั้ง
        productSales[productId].sales.push({
          orderId: order.id,
          quantity: orderItem.count,
          price: orderItem.price,
          revenue: orderItem.price * orderItem.count,
          customer: {
            name: order.orderedBy.name || order.orderedBy.email,
            email: order.orderedBy.email,
            phone: order.orderedBy.phone,
            address: order.orderedBy.address
          },
          orderDate: order.createdAt,
          orderStatus: order.oderStatus,
          paymentMethod: order.payments[0]?.method || 'N/A',
          paymentStatus: order.payments[0]?.status || 'N/A'
        });
      });
    });
    
    // แปลงเป็น array และเรียงตามยอดขาย
    const salesData = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // คำนวณยอดรวมทั้งหมด
    const totalRevenue = salesData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalQuantity = salesData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalOrders = filteredOrders.length;
    
    res.status(200).json({
      message: 'ดึงข้อมูลการขายสำเร็จ',
      sales: salesData,
      summary: {
        totalProducts: salesData.length,
        totalQuantity,
        totalRevenue,
        totalOrders
      }
    });
    
  } catch (error) {
    console.error('Get store sales error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการขาย' });
  }
};

// ดึง orders ที่มีสินค้าจากร้านค้านี้
exports.getStoreOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status } = req.query;
    
    // หาร้านค้าของ seller
    const store = await prisma.store.findFirst({
      where: { ownerId: sellerId }
    });
    
    if (!store) {
      return res.status(404).json({ message: 'ไม่พบร้านค้า' });
    }
    
    // ดึง orders ทั้งหมด
    const allOrders = await prisma.order.findMany({
      where: status ? { oderStatus: status } : {},
      include: {
        orderedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        products: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
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
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // กรองเฉพาะ orders ที่มีสินค้าจากร้านนี้
    // และแยกสินค้าที่เป็นของร้านนี้ออกมา
    const storeOrders = allOrders
      .filter(order => 
        order.products.some(item => item.product && item.product.storeId === store.id)
      )
      .map(order => {
        // แยกสินค้าที่เป็นของร้านนี้ออกมา
        const storeProducts = order.products.filter(
          item => item.product && item.product.storeId === store.id
        );
        
        // คำนวณยอดรวมสำหรับสินค้าของร้านนี้
        const storeOrderTotal = storeProducts.reduce(
          (sum, item) => sum + (item.price * item.count), 
          0
        );
        
        return {
          ...order,
          storeProducts, // สินค้าที่เป็นของร้านนี้
          storeOrderTotal, // ยอดรวมสำหรับสินค้าของร้านนี้
          allProducts: order.products // สินค้าทั้งหมด (สำหรับดูข้อมูล)
        };
      });
    
    res.status(200).json({
      message: 'ดึงข้อมูลคำสั่งซื้อสำเร็จ',
      orders: storeOrders,
      count: storeOrders.length
    });
    
  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' });
  }
};

// อัพเดตสถานะ order (สำหรับ store owner)
exports.updateStoreOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'กรุณาระบุสถานะ' });
    }

    const validStatuses = ['Not Process', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    // หาร้านค้าของ seller
    const store = await prisma.store.findFirst({
      where: { ownerId: sellerId }
    });
    
    if (!store) {
      return res.status(404).json({ message: 'ไม่พบร้านค้า' });
    }

    // ตรวจสอบว่า order มีสินค้าจากร้านนี้หรือไม่
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        products: {
          include: {
            product: {
              select: {
                storeId: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ' });
    }

    // ตรวจสอบว่ามีสินค้าจากร้านนี้หรือไม่
    const hasStoreProduct = order.products.some(
      item => item.product && item.product.storeId === store.id
    );

    if (!hasStoreProduct) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้' });
    }

    // อัพเดตสถานะ
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { oderStatus: status },
      include: {
        orderedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emit real-time update ผ่าน Socket.IO
    const io = req.app.locals.io;
    if (io && updatedOrder.orderedById) {
      io.to(`user_${updatedOrder.orderedById}`).emit('order_status_updated', {
        orderId: updatedOrder.id,
        status: updatedOrder.oderStatus
      });
    }

    res.status(200).json({
      message: 'อัพเดตสถานะคำสั่งซื้อสำเร็จ',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update store order status error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะคำสั่งซื้อ' });
  }
};


