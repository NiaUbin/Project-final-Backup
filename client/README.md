# Workshop E-commerce Client

React application สำหรับระบบ E-commerce Workshop ที่เชื่อมต่อกับ Backend API

## ✨ Features

### 🔐 Authentication
- Login/Register
- JWT Token Authentication
- Role-based Access Control (User/Admin)
- Quick Login สำหรับทดสอบ

### 🛍️ E-commerce Features
- **Products**: ดูสินค้า, ค้นหา, กรองตามหมวดหมู่และราคา
- **Cart**: เพิ่มสินค้าลงตะกร้า, จัดการตะกร้าสินค้า
- **Orders**: สั่งซื้อสินค้า, ติดตามคำสั่งซื้อ
- **Profile**: จัดการข้อมูลส่วนตัว, ที่อยู่

### 👨‍💼 Admin Features
- จัดการผู้ใช้ (เปลี่ยนสิทธิ์, เปิด/ปิดใช้งาน)
- ดูสถิติระบบ
- การตั้งค่าระบบ

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies
```bash
cd client
npm install
```

### 2. รัน Development Server
```bash
npm start
```

แอปจะเปิดที่ `http://localhost:3001`

### 3. Quick Login Accounts
**Admin Account:**
- Email: `admin@example.com`
- Password: `123456`

**User Account:**
- Email: `testuser@example.com`
- Password: `123456`

## 🛠️ Tech Stack

- **React 18** - Frontend Framework
- **React Router** - Routing
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons
- **React Toastify** - Notifications

## 📱 Pages & Features

### Public Pages
- `/login` - เข้าสู่ระบบ
- `/register` - สมัครสมาชิก

### Protected Pages (ต้อง Login)
- `/dashboard` - หน้าแดชบอร์ด
- `/products` - รายการสินค้า
- `/cart` - ตะกร้าสินค้า
- `/orders` - คำสั่งซื้อ
- `/profile` - โปรไฟล์

### Admin Only
- `/admin` - Admin Panel

## 🎨 UI Components

### Layout
- **Navbar** - Navigation bar พร้อม user menu
- **Responsive Design** - รองรับทุกขนาดหน้าจอ

### Features
- **Search & Filter** - ค้นหาและกรองสินค้า
- **Cart Management** - จัดการตะกร้าสินค้า
- **Order Tracking** - ติดตามสถานะคำสั่งซื้อ
- **User Management** - จัดการผู้ใช้ (Admin)

## 🔧 Configuration

### Environment Variables
สร้างไฟล์ `.env` (ถ้าต้องการ):
```env
REACT_APP_API_URL=http://localhost:3000
```

### Proxy Configuration
ใน `package.json` มีการตั้งค่า proxy:
```json
"proxy": "http://localhost:3000"
```

## 📡 API Integration

### Authentication
- POST `/api/login` - เข้าสู่ระบบ
- POST `/api/register` - สมัครสมาชิก

### Products
- GET `/api/products/:count` - ดึงรายการสินค้า
- POST `/api/search/filters` - ค้นหาสินค้า

### Cart
- GET `/api/user/cart` - ดึงตะกร้าสินค้า
- POST `/api/user/cart` - เพิ่มสินค้าลงตะกร้า
- DELETE `/api/user/cart` - ล้างตะกร้า

### Orders
- GET `/api/user/order` - ดึงคำสั่งซื้อ
- POST `/api/user/order` - สร้างคำสั่งซื้อ

### Admin
- GET `/api/users` - ดึงรายการผู้ใช้
- POST `/api/change-status` - เปลี่ยนสถานะผู้ใช้
- POST `/api/change-role` - เปลี่ยนสิทธิ์ผู้ใช้

## 🎯 การใช้งาน

### สำหรับผู้ใช้ทั่วไป
1. สมัครสมาชิกหรือ Login
2. ดูสินค้าและเพิ่มลงตะกร้า
3. สั่งซื้อสินค้า
4. ติดตามคำสั่งซื้อ

### สำหรับ Admin
1. Login ด้วยบัญชี Admin
2. จัดการผู้ใช้ในระบบ
3. ดูสถิติและข้อมูลระบบ

## 🚀 Build & Deploy

### Build for Production
```bash
npm run build
```

### Test
```bash
npm test
```

## 📝 Notes

- ระบบนี้เป็น Demo สำหรับการทดสอบ
- ใช้ JWT Token สำหรับ Authentication
- รองรับ Responsive Design
- มี Loading States และ Error Handling
- ใช้ Toast Notifications สำหรับแจ้งเตือน

## 🤝 Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
