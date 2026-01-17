# คู่มือการตั้งค่า Cloudinary ฟรี

## ขั้นตอนที่ 1: สมัคร Cloudinary ฟรี

1. ไปที่ [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. สมัครสมาชิกด้วย Email หรือ Google Account
3. หลังจากสมัครสำเร็จ จะได้:
   - **Cloud Name** (เช่น: `dxxxxx`)
   - **API Key** (เช่น: `123456789012345`)
   - **API Secret** (เช่น: `abcdefghijklmnopqrstuvwxyz123456`)

## ขั้นตอนที่ 2: ติดตั้ง Package

```bash
cd server
npm install cloudinary multer-storage-cloudinary
```

## ขั้นตอนที่ 3: ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/` (ถ้ายังไม่มี) และเพิ่ม:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ ข้อควรระวัง:** อย่า commit ไฟล์ `.env` ลง Git! ตรวจสอบว่า `.env` อยู่ใน `.gitignore`

## ขั้นตอนที่ 4: สร้างไฟล์ Cloudinary Config

สร้างไฟล์ `server/config/cloudinary.js`:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

## ขั้นตอนที่ 5: แก้ไข Upload Middleware

แก้ไขไฟล์ `server/middlewares/upload.js` เพื่อใช้ Cloudinary แทน local storage

## ขั้นตอนที่ 6: แก้ไข Product Controller

แก้ไขไฟล์ `server/controllers/product.js` เพื่อใช้ URL จาก Cloudinary

## ข้อดีของ Cloudinary

✅ **ฟรี 25GB storage**  
✅ **25GB bandwidth/เดือน**  
✅ **Image optimization อัตโนมัติ**  
✅ **CDN สำหรับโหลดรูปเร็ว**  
✅ **Transform images (resize, crop, etc.)**  
✅ **ไม่ต้องเก็บไฟล์ใน server**

## ข้อจำกัดของ Free Plan

- Storage: 25GB
- Bandwidth: 25GB/เดือน
- Transformations: 25,000/เดือน
- ถ้าเกินต้องอัพเกรดเป็น Paid Plan

## ตัวอย่างการใช้งาน

```javascript
// อัพโหลดรูปภาพ
const result = await cloudinary.uploader.upload(filePath, {
  folder: 'products',
  resource_type: 'image'
});

// ได้ URL กลับมา
console.log(result.secure_url); // https://res.cloudinary.com/...
```

## ข้อมูลเพิ่มเติม

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Free Plan Details](https://cloudinary.com/pricing)

