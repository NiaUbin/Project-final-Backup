#!/bin/bash

# Script สำหรับ Export MySQL Database
# วิธีใช้: ./export-database.sh

# ตั้งค่าตัวแปร (แก้ไขตามข้อมูลของคุณ)
DB_NAME="your_database_name"
DB_USER="your_username"
DB_PASSWORD="your_password"
DB_HOST="localhost"
DB_PORT="3306"
OUTPUT_FILE="database_export_$(date +%Y%m%d_%H%M%S).sql"

echo "กำลัง Export Database: $DB_NAME"
echo "Output file: $OUTPUT_FILE"

# Export ทั้ง Schema และ Data
mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --databases $DB_NAME > $OUTPUT_FILE

if [ $? -eq 0 ]; then
  echo "✅ Export สำเร็จ! ไฟล์: $OUTPUT_FILE"
  echo "ขนาดไฟล์: $(du -h $OUTPUT_FILE | cut -f1)"
else
  echo "❌ Export ล้มเหลว!"
  exit 1
fi

