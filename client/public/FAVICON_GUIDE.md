# วิธีเปลี่ยน Favicon เป็นรูปที่คุณต้องการ

## วิธีที่ 1: ใช้รูป PNG/JPG
1. เตรียมรูปที่คุณต้องการ (แนะนำขนาด 32x32 หรือ 64x64 pixels)
2. เปลี่ยนชื่อไฟล์เป็น `favicon.png` หรือ `favicon.jpg`
3. วางไฟล์ในโฟลเดอร์ `/Users/nm/Desktop/workshop/client/public/`
4. แก้ไขไฟล์ `index.html`:

```html
<link rel="icon" href="%PUBLIC_URL%/favicon.png" type="image/png" />
```

## วิธีที่ 2: ใช้รูป ICO
1. แปลงรูปเป็นไฟล์ `.ico` (ขนาด 16x16, 32x32, 48x48)
2. วางไฟล์ในโฟลเดอร์ `/Users/nm/Desktop/workshop/client/public/`
3. แก้ไขไฟล์ `index.html`:

```html
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
```

## วิธีที่ 3: ใช้ Base64 (สำหรับรูปเล็ก)
1. แปลงรูปเป็น Base64
2. แก้ไขไฟล์ `index.html`:

```html
<link rel="icon" href="data:image/png;base64,YOUR_BASE64_STRING" />
```

## วิธีที่ 4: ใช้รูปจาก URL
```html
<link rel="icon" href="https://example.com/your-image.png" />
```

## ขั้นตอนการเปลี่ยน:
1. เตรียมรูปที่ต้องการ
2. วางในโฟลเดอร์ `public/`
3. แก้ไข `index.html`
4. รีสตาร์ทเซิร์ฟเวอร์
5. Hard refresh เบราว์เซอร์ (Ctrl+F5)

## หมายเหตุ:
- รูปควรเป็นสี่เหลี่ยมจัตุรัส
- ขนาดแนะนำ: 32x32, 64x64, หรือ 128x128 pixels
- รูปแบบที่รองรับ: PNG, JPG, ICO, SVG
- อาจต้องรอสักครู่เพื่อให้เบราว์เซอร์อัพเดท favicon
