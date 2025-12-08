# 🔍 Hướng Dẫn Test Visitor Data & Badge Custom Content

## 📋 Mục Đích
Kiểm tra data của visitor ID `4433256000016955057` và xem có nội dung nào cho `badge_custom_content` không.

## 🚀 Cách 1: Sử dụng Browser Test Tool (Khuyến nghị)

### Bước 1: Start Backend Server

Mở terminal mới và chạy:

```bash
cd ../nexpo-event-registration-backend
npm start
# hoặc
npm run dev
```

Đợi cho đến khi thấy message: `Server is running on port 3000`

### Bước 2: Mở Test Tool

Mở file `test-visitor-data.html` trong browser:

```bash
open test-visitor-data.html
```

Hoặc kéo thả file vào Chrome/Safari/Firefox.

### Bước 3: Test

1. Kiểm tra Backend URL: `http://localhost:3000`
2. Visitor ID đã được điền sẵn: `4433256000016955057`
3. Badge Custom Content config: `cng_company,Job Function`
4. Click nút **"🚀 Fetch Visitor Data"**

### Bước 4: Xem Kết Quả

Tool sẽ hiển thị:
- ✅ Thông tin cơ bản của visitor
- 🎨 Custom fields có sẵn
- 🎫 Badge custom content được extract
- 📋 Full raw JSON data

---

## 🖥️ Cách 2: Sử dụng Node.js Script

### Bước 1: Start Backend (nếu chưa chạy)

```bash
cd ../nexpo-event-registration-backend
npm start
```

### Bước 2: Chạy Test Script

Mở terminal mới:

```bash
cd /Users/travisvo/Projects/nexpo_event_project/nexpo-event-registration-frontend
node test-visitor-data.js
```

---

## 🌐 Cách 3: Test Trực Tiếp Với API

### Sử dụng curl:

```bash
curl "http://localhost:3000/api/visitors?visid=4433256000016955057" | jq
```

### Hoặc sử dụng browser:

Mở URL trong browser:
```
http://localhost:3000/api/visitors?visid=4433256000016955057
```

---

## 📊 Những Gì Cần Kiểm Tra

### 1. Thông Tin Cơ Bản
- `visitor.id`
- `visitor.name`
- `visitor.email`
- `visitor.company`
- `visitor.job_title`

### 2. Badge QR Code
- `visitor.badge_qr` - Có tồn tại không?
- Độ dài của QR code
- Format của QR code

### 3. Custom Fields
- `visitor.custom_fields` - Object chứa các field tùy chỉnh
- Các field có thể có:
  - `cng_company`
  - `Job Function`
  - `Company`
  - `Position`
  - Etc.

### 4. Badge Custom Content Extraction

Kiểm tra xem với config `badge_custom_content = "cng_company,Job Function"`:
- Field nào được tìm thấy?
- Giá trị là gì?
- Có được uppercase không?
- Có hiển thị trên badge không?

---

## 🎯 Kết Quả Mong Đợi

Nếu visitor có data đầy đủ, bạn sẽ thấy:

```json
{
  "visitor": {
    "id": "4433256000016955057",
    "name": "Tên Visitor",
    "email": "email@example.com",
    "badge_qr": "ABC123XYZ...",
    "custom_fields": {
      "cng_company": "Tên Công Ty",
      "Job Function": "Manager"
    }
  }
}
```

Badge sẽ hiển thị:
```
┌─────────────────────────┐
│   HEADER                │
├─────────────────────────┤
│  [QR]    Tên Visitor    │
│          TÊN CÔNG TY    │ ← từ cng_company
│          MANAGER        │ ← từ Job Function
├─────────────────────────┤
│   FOOTER                │
└─────────────────────────┘
```

---

## ⚠️ Troubleshooting

### Backend không start được:
```bash
cd ../nexpo-event-registration-backend
npm install
npm start
```

### Port 3000 đã được sử dụng:
```bash
# Tìm process đang dùng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Visitor không tìm thấy:
- Kiểm tra visitor ID có đúng không
- Kiểm tra visitor có tồn tại trong Zoho Creator không
- Kiểm tra backend có kết nối được với Zoho không

---

## 📝 Notes

- Tool HTML test có giao diện đẹp và dễ sử dụng nhất
- Node.js script tốt cho automation
- curl/browser tốt cho quick test

Chúc bạn test thành công! 🎉
