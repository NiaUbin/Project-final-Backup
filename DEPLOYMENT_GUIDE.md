# คู่มือการ Deploy โปรเจกต์ E-commerce

## 📋 สิ่งที่ต้องเตรียมก่อน Deploy

### 1. Environment Variables

#### Server (.env ในโฟลเดอร์ `server/`)
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="mysql://user:password@host:port/database_name"

# JWT Secret (ต้องเปลี่ยนเป็นค่าที่ปลอดภัย)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret (ต้องเปลี่ยนเป็นค่าที่ปลอดภัย)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Client URL (ใส่ URL ของ frontend ที่ deploy แล้ว)
CLIENT_URL=https://your-frontend-domain.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback

# OAuth - Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://your-backend-domain.com/api/auth/facebook/callback
```

#### Client (.env ในโฟลเดอร์ `client/`)
```env
# API Configuration
# สำหรับ production ให้ตั้งค่าเป็น URL ของ backend server
REACT_APP_API_URL=https://your-backend-domain.com
```

### 2. Database Setup

1. สร้าง MySQL database บน hosting provider
2. Export database จาก local:
   ```bash
   cd server
   mysqldump -u username -p database_name > database_backup.sql
   ```
3. Import database ไปยัง production:
   ```bash
   mysql -h host -u username -p database_name < database_backup.sql
   ```
4. หรือใช้ Prisma Migrate:
   ```bash
   cd server
   npx prisma migrate deploy
   ```

### 3. Build Client

```bash
cd client
npm install
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `client/build/`

## 🚀 วิธี Deploy

### Option 1: Deploy แยกกัน (แนะนำ)

#### Backend (Node.js Server)
1. อัพโหลดไฟล์ในโฟลเดอร์ `server/` ไปยัง server
2. ติดตั้ง dependencies:
   ```bash
   npm install --production
   ```
3. สร้างไฟล์ `.env` ตามตัวอย่างด้านบน
4. Run Prisma generate:
   ```bash
   npx prisma generate
   ```
5. Start server:
   ```bash
   npm start
   ```
   หรือใช้ PM2:
   ```bash
   pm2 start server.js --name ecommerce-api
   ```

#### Frontend (React App)
1. Build React app:
   ```bash
   cd client
   npm install
   npm run build
   ```
2. อัพโหลดไฟล์ในโฟลเดอร์ `client/build/` ไปยัง static hosting (เช่น Netlify, Vercel, หรือ web server)
3. สร้างไฟล์ `.env` ใน client folder (ถ้าจำเป็น)
4. ตั้งค่า REACT_APP_API_URL ให้ชี้ไปที่ backend URL

### Option 2: Deploy ด้วย Server แบบ Serve Static Files

1. อัพโหลดทั้ง `server/` และ `client/build/` ไปยัง server เดียวกัน
2. แก้ไข `server/server.js` ให้ serve static files:
   ```javascript
   // เพิ่มบรรทัดนี้หลังจาก middleware
   app.use(express.static(path.join(__dirname, '../client/build')));
   
   // เพิ่ม route สำหรับ React Router
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/build/index.html'));
   });
   ```

## ⚠️ สิ่งที่ต้องตรวจสอบ

### ✅ Security Checklist
- [ ] เปลี่ยน JWT_SECRET และ SESSION_SECRET เป็นค่าที่ปลอดภัย
- [ ] ตรวจสอบว่าไฟล์ `.env` ไม่ได้ถูก commit ไปยัง Git
- [ ] ตั้งค่า CORS ให้ถูกต้อง (CLIENT_URL)
- [ ] ใช้ HTTPS สำหรับ production
- [ ] ตรวจสอบว่าไม่มี hardcoded secrets ในโค้ด

### ✅ Configuration Checklist
- [ ] DATABASE_URL ถูกต้องและเชื่อมต่อได้
- [ ] Cloudinary credentials ถูกต้อง
- [ ] OAuth callback URLs ถูกต้อง
- [ ] REACT_APP_API_URL ชี้ไปที่ backend ที่ถูกต้อง
- [ ] PORT ถูกตั้งค่าถูกต้อง (หรือใช้ default 3000)

### ✅ Functionality Checklist
- [ ] Database migrations รันสำเร็จ
- [ ] Prisma client generate แล้ว
- [ ] Upload folder มี permissions ที่ถูกต้อง
- [ ] Static files serve ได้ถูกต้อง
- [ ] Socket.IO connection ทำงานได้

## 🔧 Troubleshooting

### ปัญหา: CORS Error
**แก้ไข**: ตรวจสอบ CLIENT_URL ใน server/.env ให้ตรงกับ frontend URL

### ปัญหา: Database Connection Error
**แก้ไข**: 
- ตรวจสอบ DATABASE_URL format: `mysql://user:password@host:port/database`
- ตรวจสอบว่า database server อนุญาต connection จาก IP ของ hosting

### ปัญหา: Socket.IO ไม่ทำงาน
**แก้ไข**: 
- ตรวจสอบ CLIENT_URL ใน server/.env
- ตรวจสอบ REACT_APP_API_URL ใน client/.env
- ตรวจสอบว่า WebSocket ถูกเปิดใช้งานบน hosting

### ปัญหา: Images ไม่แสดง
**แก้ไข**: 
- ตรวจสอบ Cloudinary configuration
- ตรวจสอบ uploads folder permissions
- ตรวจสอบ static file serving configuration

## 📝 Notes

- Proxy ใน `client/package.json` ใช้ได้เฉพาะ development เท่านั้น
- สำหรับ production ต้องใช้ REACT_APP_API_URL
- ตรวจสอบว่า uploads folder มี permissions ที่ถูกต้อง (755 หรือ 775)
- ใช้ process manager เช่น PM2 สำหรับ production server

