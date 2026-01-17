# 🚀 คู่มือการตั้งค่า OAuth Login (Facebook & Google)

## ✅ ระบบพร้อมใช้งานแล้ว!

ตอนนี้ระบบ OAuth Login พร้อมใช้งานแล้ว เพียงแค่ตั้งค่า credentials จาก Google และ Facebook

---

## 📋 ขั้นตอนการตั้งค่า

### 1️⃣ ตั้งค่า Google OAuth

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. เปิดใช้งาน **Google+ API** หรือ **Google Identity API**
4. สร้าง **OAuth 2.0 Client ID**:
   - เลือก "Web application"
   - เพิ่ม **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback`
   - คัดลอก **Client ID** และ **Client Secret**

### 2️⃣ ตั้งค่า Facebook OAuth

1. ไปที่ [Facebook Developers](https://developers.facebook.com/)
2. สร้าง **App** ใหม่ (เลือกประเภท "Consumer")
3. เพิ่ม Product: **Facebook Login**
4. ใน Settings → **Valid OAuth Redirect URIs** เพิ่ม:
   - `http://localhost:3000/api/auth/facebook/callback`
5. คัดลอก **App ID** และ **App Secret**
6. **หมายเหตุ**: ในโหมด Development จะใช้งานได้เฉพาะกับ Tester ที่เพิ่มไว้ใน App Settings

### 3️⃣ สร้างไฟล์ `.env` ใน `server/` folder

```env
# Google OAuth
GOOGLE_CLIENT_ID=วาง-google-client-id-ตรงนี้
GOOGLE_CLIENT_SECRET=วาง-google-client-secret-ตรงนี้
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=วาง-facebook-app-id-ตรงนี้
FACEBOOK_APP_SECRET=วาง-facebook-app-secret-ตรงนี้
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Application Settings
CLIENT_URL=http://localhost:3001
SESSION_SECRET=random-secret-key-12345
JWT_SECRET=your-jwt-secret-key-here

# Database (ถ้ามี)
DATABASE_URL=your-database-url
```

---

## 🎯 วิธีการใช้งาน

### 1. เริ่มต้น Server
```bash
cd server
npm start
```

### 2. เริ่มต้น Client
```bash
cd client
npm start
```

### 3. ทดสอบ OAuth Login

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3001/login`
2. คลิกปุ่ม **"เข้าสู่ระบบด้วย Facebook"** หรือ **"เข้าสู่ระบบด้วย Google"**
3. ระบบจะ redirect ไปยัง OAuth provider
4. อนุญาตสิทธิ์
5. ระบบจะ redirect กลับมาและเข้าสู่ระบบอัตโนมัติ

---

## 📁 ไฟล์ที่สร้างขึ้น

✅ `server/config/passport.js` - Passport configuration สำหรับ OAuth  
✅ `client/src/components/Auth/OAuthCallback.jsx` - Component จัดการ OAuth callback  
✅ `server/routes/auth.js` - อัพเดทแล้วเพิ่ม OAuth routes  
✅ `server/controllers/auth.js` - เพิ่ม oauthCallback function  
✅ `client/src/App.js` - เพิ่ม route สำหรับ OAuth callback  
✅ `client/src/components/Auth/Login.jsx` - อัพเดทแล้วเพิ่มปุ่ม OAuth  
✅ `client/src/components/Auth/Register.jsx` - อัพเดทแล้วเพิ่มปุ่ม OAuth  

---

## ⚠️ หมายเหตุสำคัญ

1. **Development Mode**: Facebook App ในโหมด Development จะใช้งานได้เฉพาะกับผู้ใช้ที่เพิ่มเป็น Tester ใน App Settings
2. **Production**: เปลี่ยน callback URLs เป็น HTTPS เมื่อ deploy
3. **Security**: ไฟล์ `.env` ไม่ควร commit ลง Git

---

## 🔧 แก้ไขปัญหา

### ปัญหา: redirect_uri_mismatch
- **แก้ไข**: ตรวจสอบว่า Redirect URI ใน Google/Facebook settings ตรงกับที่ระบุใน `.env`

### ปัญหา: Invalid OAuth access token
- **แก้ไข**: ตรวจสอบว่า Client ID/Secret และ App ID/Secret ถูกต้อง

### ปัญหา: Facebook login ไม่ได้อีเมล
- **แก้ไข**: ตรวจสอบว่า App มี permission `email` และ `public_profile`

---

**ระบบพร้อมใช้งาน! 🎉**

