# Exhibitor Registration - Zoho Form Redirect Setup

## 📋 Overview
Hướng dẫn cấu hình redirect từ Zoho Form sang trang Thank You sau khi exhibitor đăng ký thành công.

## 🎯 Thank You Page URL
```
https://your-domain.com/exhibitor-registration/thank-you
```

## 🔧 Cách setup trong Zoho Creator

### Bước 1: Truy cập Form Settings
1. Đăng nhập vào Zoho Creator
2. Mở form **Exhibitor_Approval**
3. Click vào **Settings** (biểu tượng bánh răng)

### Bước 2: Cấu hình Success Action
1. Trong phần **Actions on Success**, chọn **Redirect to URL**
2. Nhập URL redirect:
   ```
   https://your-domain.com/exhibitor-registration/thank-you
   ```

### Bước 3: Truyền thông tin sang Thank You page (Optional)
Để hiển thị thông tin người đăng ký trên trang Thank You, thêm params vào URL:

```
https://your-domain.com/exhibitor-registration/thank-you?name=${Contact_Person}&email=${Email}&company=${Company_Name}
```

**Lưu ý:** Thay `${Contact_Person}`, `${Email}`, `${Company_Name}` bằng tên field thực tế trong form Zoho của bạn.

### Bước 4: Embed Code với Redirect
Nếu dùng Zoho Embed URL (như hiện tại), redirect sẽ tự động hoạt động nhờ:
- Iframe đã có `sandbox="allow-top-navigation"`
- Cho phép redirect ra khỏi iframe

## ✅ Test Redirect

### Test trực tiếp trang Thank You:
```bash
# Không có params
https://your-domain.com/exhibitor-registration/thank-you

# Với params
https://your-domain.com/exhibitor-registration/thank-you?name=John%20Doe&email=john@example.com&company=ABC%20Corp
```

### Test redirect từ form:
1. Truy cập: `https://your-domain.com/exhibitor-registration`
2. Điền thông tin và submit form
3. Kiểm tra có redirect sang `/exhibitor-registration/thank-you` không

## 🎨 Thank You Page Features

### ✨ Hiển thị
- ✅ Success message với animation
- ✅ Next steps cho exhibitor
- ✅ Thông tin đăng ký (nếu có params)
- ✅ Contact information
- ✅ Actions: Back to Home / Register Another

### 📊 Query Parameters Support
- `name` - Tên người liên hệ
- `email` - Email
- `company` - Tên công ty
- Có thể thêm bất kỳ params nào từ Zoho form

## 🔍 Troubleshooting

### Redirect không hoạt động?

1. **Kiểm tra Zoho Settings**
   - Đảm bảo đã chọn "Redirect to URL" trong Success Action
   - URL phải bắt đầu bằng `http://` hoặc `https://`

2. **Kiểm tra Iframe Sandbox**
   - File: `src/app/exhibitor-registration/page.tsx`
   - Đảm bảo có: `sandbox="allow-top-navigation"`

3. **Test redirect trực tiếp**
   - Thử access form Zoho trực tiếp (không qua iframe)
   - Nếu redirect OK → vấn đề ở iframe settings
   - Nếu không redirect → vấn đề ở Zoho settings

4. **Browser Console**
   - Mở Developer Tools (F12)
   - Check Console có error không
   - Check Network tab xem request redirect

## 📝 Notes

- Redirect từ iframe sẽ thay thế **toàn bộ trang** (không chỉ iframe)
- Trang Thank You **khác** với visitor registration thank you
- Có thể customize trang Thank You trong file:
  ```
  src/app/exhibitor-registration/thank-you/page.tsx
  ```

## 🚀 Production Deployment

Trước khi deploy:
1. ✅ Cập nhật URL trong Zoho form settings với domain production
2. ✅ Test redirect trên production environment
3. ✅ Kiểm tra email confirmation từ Zoho
4. ✅ Test với params để đảm bảo hiển thị đúng thông tin

## 📞 Support

Nếu cần hỗ trợ:
- Email: contact@nexpo.com
- Phone: +84 123 456 7890

