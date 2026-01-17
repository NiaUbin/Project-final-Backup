const prisma = require('../config/prisma');

// Create a review for an order item the user purchased
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderItemId, rating, comment, images } = req.body;

    if (!orderItemId || !rating) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    // Ensure this order item belongs to the user
    const orderItem = await prisma.productOnOrder.findFirst({
      where: {
        id: parseInt(orderItemId),
        order: { orderedById: userId }
      },
      include: { product: { include: { store: true } } }
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'ไม่พบรายการสั่งซื้อ' });
    }

    // Prevent duplicate review per order item
    const existing = await prisma.review.findFirst({ where: { orderItemId: orderItem.id } });
    if (existing) {
      return res.status(400).json({ message: 'ได้รีวิวสินค้าไปแล้วสำหรับรายการนี้' });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        images: images ? JSON.stringify(images) : null,
        userId,
        productId: orderItem.productId,
        storeId: orderItem.product.storeId || null,
        orderItemId: orderItem.id
      }
    });

    return res.status(201).json({ message: 'บันทึกรีวิวสำเร็จ', review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกรีวิว' });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, picture: true } }
      }
    });

    // Compute summary
    const summary = reviews.length
      ? {
          count: reviews.length,
          average: Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2))
        }
      : { count: 0, average: 0 };

    return res.status(200).json({ reviews, summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรีวิวสินค้า' });
  }
};

// Get reviews for a store
exports.getStoreReviews = async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const reviews = await prisma.review.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, picture: true } },
        product: { select: { id: true, title: true, images: true } }
      }
    });
    return res.status(200).json({ reviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรีวิวร้านค้า' });
  }
};

// Delete a review (admin or store owner only)
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: parseInt(reviewId) },
      include: { 
        store: {
          select: { ownerId: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ message: 'ไม่พบรีวิว' });
    }

    // Check permissions: only store owner can delete (not admin)
    const isStoreOwner = review.storeId && review.store?.ownerId === userId;

    if (!isStoreOwner) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ลบรีวิวนี้ (เฉพาะเจ้าของร้านเท่านั้น)' });
    }

    await prisma.review.delete({
      where: { id: parseInt(reviewId) }
    });

    return res.status(200).json({ message: 'ลบรีวิวสำเร็จ' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรีวิว' });
  }
};


