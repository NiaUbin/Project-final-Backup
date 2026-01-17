# คู่มือ Export/Import MySQL Database

## วิธี Export SQL จาก MySQL Workbench

### วิธีที่ 1: Export ผ่าน MySQL Workbench GUI

#### Export ทั้ง Schema และ Data (แนะนำ)

1. เปิด **MySQL Workbench**
2. เชื่อมต่อกับ Database Server ของคุณ
3. ไปที่เมนู **Server** → **Data Export**
4. ในหน้าต่าง Data Export:
   - เลือก **Database** ที่ต้องการ export (คลิก checkbox)
   - เลือก **Tables** ที่ต้องการ (หรือเลือกทั้งหมด)
   - ในส่วน **Export Options**:
     - ✅ เลือก **"Export to Self-Contained File"**
     - ตั้งชื่อไฟล์ เช่น `database_export.sql`
     - ✅ เลือก **"Include Create Schema"**
     - ✅ เลือก **"Include Create Table"**
     - ✅ เลือก **"Include Insert Statements"** (ถ้าต้องการข้อมูลด้วย)
     - ✅ เลือก **"Include Views"** (ถ้ามี)
     - ✅ เลือก **"Include Routines"** (ถ้ามี Stored Procedures/Functions)
     - ✅ เลือก **"Include Triggers"** (ถ้ามี)
5. คลิก **"Start Export"**
6. รอให้ Export เสร็จ

#### Export เฉพาะ Schema (โครงสร้างเท่านั้น)

- ทำตามขั้นตอนข้างต้น แต่ **ไม่ต้องเลือก** "Include Insert Statements"

### วิธีที่ 2: ใช้ mysqldump (Command Line)

#### Export ทั้ง Schema และ Data

```bash
mysqldump -h localhost -u your_username -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases your_database_name > database_export.sql
```

#### Export เฉพาะ Schema

```bash
mysqldump -h localhost -u your_username -p \
  --no-data \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases your_database_name > schema_only.sql
```

#### Export เฉพาะ Data

```bash
mysqldump -h localhost -u your_username -p \
  --no-create-info \
  --databases your_database_name > data_only.sql
```

### วิธีที่ 3: ใช้ Prisma Migrate (สำหรับโปรเจกต์นี้)

เนื่องจากคุณใช้ Prisma อยู่แล้ว คุณสามารถใช้ Prisma Migrate เพื่อสร้าง Schema:

```bash
# ในโฟลเดอร์ server
cd server

# Generate migration จาก schema.prisma
npx prisma migrate dev --name export_schema

# หรือใช้ Prisma Studio เพื่อดูข้อมูล
npx prisma studio
```

## วิธี Import SQL ไปยังเครื่องอื่น

### วิธีที่ 1: Import ผ่าน MySQL Workbench

1. เปิด **MySQL Workbench** บนเครื่องใหม่
2. เชื่อมต่อกับ Database Server
3. ไปที่เมนู **Server** → **Data Import**
4. เลือก **"Import from Self-Contained File"**
5. เลือกไฟล์ SQL ที่ Export มา
6. เลือก **"Default Target Schema"** หรือสร้าง Schema ใหม่
7. คลิก **"Start Import"**

### วิธีที่ 2: ใช้ Command Line

```bash
mysql -h localhost -u your_username -p your_database_name < database_export.sql
```

หรือสร้าง Database ใหม่ก่อน:

```bash
mysql -h localhost -u your_username -p -e "CREATE DATABASE new_database_name;"
mysql -h localhost -u your_username -p new_database_name < database_export.sql
```

### วิธีที่ 3: ใช้ Prisma Migrate

```bash
# ในโฟลเดอร์ server
cd server

# ตั้งค่า DATABASE_URL ใน .env
# DATABASE_URL="mysql://user:password@localhost:3306/database_name"

# Run migrations
npx prisma migrate deploy

# หรือ generate Prisma Client
npx prisma generate
```

## ข้อควรระวัง

1. **ขนาดไฟล์**: ถ้า Database ใหญ่มาก อาจใช้เวลานานในการ Export/Import
2. **Character Set**: ตรวจสอบว่าใช้ UTF-8 เพื่อรองรับภาษาไทย
3. **Privileges**: ตรวจสอบว่า User มีสิทธิ์ในการ Export/Import
4. **Version Compatibility**: ตรวจสอบว่า MySQL Version ตรงกันหรือไม่

## คำสั่งที่มีประโยชน์

### ตรวจสอบขนาด Database

```sql
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'your_database_name'
GROUP BY table_schema;
```

### ตรวจสอบ Tables ทั้งหมด

```sql
SHOW TABLES;
```

### ตรวจสอบข้อมูลใน Table

```sql
SELECT COUNT(*) FROM table_name;
```

