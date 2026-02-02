
const prisma = require('../config/prisma');

// --- Site Settings ---

exports.getSiteSettings = async (req, res) => {
  try {
    let settings = await prisma.siteSetting.findFirst();
    if (!settings) {
      // Create default settings if not exists
      settings = await prisma.siteSetting.create({
        data: {
          siteName: 'Boxify',
          description: 'Your one-stop shop for everything',
          contactEmail: 'support@boxify.com',
          shippingFee: 50,
          freeShippingThreshold: 1000
        }
      });
    }
    res.json(settings);
  } catch (err) {
    console.error('Get site settings error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateSiteSettings = async (req, res) => {
  try {
    const { 
      siteName, description, contactEmail, contactPhone, 
      address, shippingFee, freeShippingThreshold, 
      facebook, line, maintenanceMode 
    } = req.body;

    // Convert string inputs to proper types
    let settings = await prisma.siteSetting.findFirst();
    
    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          siteName: 'Boxify',
          description: 'Your one-stop shop for everything',
          contactEmail: 'support@boxify.com',
          shippingFee: 50,
          freeShippingThreshold: 1000
        }
      });
    }

    const updatedSettings = await prisma.siteSetting.update({
      where: { id: settings.id },
      data: {
        siteName,
        description,
        contactEmail,
        contactPhone,
        address,
        shippingFee: parseFloat(shippingFee),
        freeShippingThreshold: parseFloat(freeShippingThreshold),
        facebook,
        line,
        maintenanceMode: Boolean(maintenanceMode)
      }
    });

    res.json({ message: 'บันทึกการตั้งค่าแล้ว', settings: updatedSettings });
  } catch (err) {
    console.error('Update site settings error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Banner Management ---

exports.getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [
        { position: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.json(banners);
  } catch (err) {
    console.error('Get banners error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, image, link, position, status } = req.body;
    
    // Simple mock image upload handling - in production use cloudinary
    // Here we assume 'image' is a URL string provided by client (or cloudinary result)
    
    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link,
        position,
        status,
        order: 0
      }
    });

    res.json({ message: 'เพิ่มแบนเนอร์แล้ว', banner });
  } catch (err) {
    console.error('Create banner error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, position, status } = req.body;

    const banner = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: {
        title,
        image,
        link,
        position,
        status
      }
    });

    res.json({ message: 'อัพเดทแบนเนอร์แล้ว', banner });
  } catch (err) {
    console.error('Update banner error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบแบนเนอร์แล้ว' });
  } catch (err) {
    console.error('Delete banner error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await prisma.banner.findUnique({ where: { id: parseInt(id) } });
    
    const updated = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: { status: !banner.status }
    });

    res.json({ message: 'เปลี่ยนสถานะแล้ว', banner: updated });
  } catch (err) {
    console.error('Toggle banner status error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
