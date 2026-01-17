#!/bin/bash

# Script สำหรับ Import MySQL Database
# วิธีใช้: ./import-database.sh database_export.sql

if [ -z "$1" ]; then
  echo "❌ กรุณาระบุไฟล์ SQL ที่ต้องการ Import"
  echo "วิธีใช้: ./import-database.sh database_export.sql"
  exit 1
fi

SQL_FILE=$1

# ตั้งค่าตัวแปร (แก้ไขตามข้อมูลของคุณ)
DB_USER="your_username"
DB_PASSWORD="your_password"
DB_HOST="localhost"
DB_PORT="3306"

echo "กำลัง Import Database จากไฟล์: $SQL_FILE"

# Import Database
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD < $SQL_FILE

if [ $? -eq 0 ]; then
  echo "✅ Import สำเร็จ!"
else
  echo "❌ Import ล้มเหลว!"
  exit 1
fi

