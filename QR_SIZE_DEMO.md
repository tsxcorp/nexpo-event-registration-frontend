# 🎫 QR Code Size Enhancement for Vertical Badges

## 📏 **Thay đổi kích thước QR Code**

### **Trước đây:**
- QR Code: **18mm x 18mm** (cố định cho mọi layout)
- Container: **20mm x 20mm**

### **Bây giờ:**
- **Badge ngang (Horizontal)**: QR Code **18mm x 18mm** (giữ nguyên)
- **Badge dọc (Vertical)**: QR Code **26mm x 26mm** (tăng 44% kích thước)

## 🎯 **Logic quyết định kích thước**

```typescript
// Xác định layout dựa trên tỷ lệ khung hình
const aspectRatio = badgeSize.height / badgeSize.width;
const isVerticalLayout = aspectRatio > 1.2;

// Kích thước QR tương ứng
const qrContainerSize = badgeLayout.isVerticalLayout ? '28mm' : '20mm';
const qrImageSize = badgeLayout.isVerticalLayout ? '26mm' : '18mm';
```

## 📊 **So sánh kích thước**

| Layout | Container | QR Image | Tăng trưởng |
|--------|-----------|----------|-------------|
| Horizontal | 20mm x 20mm | 18mm x 18mm | - |
| Vertical | 28mm x 28mm | 26mm x 26mm | +44% |

## 🔍 **Lý do tăng kích thước**

1. **Badge dọc có nhiều không gian trống** - như badge NEPCON Vietnam 2024
2. **QR code nhỏ khó scan** - đặc biệt trên mobile
3. **Tăng khả năng đọc** - QR lớn hơn = scan dễ hơn
4. **Tận dụng không gian** - không ảnh hưởng đến text

## 🎨 **Cập nhật font size fallback**

```typescript
// Font size cho text fallback cũng tăng theo
font-size: ${imageSize === '26mm' ? '8px' : '6px'};
```

## 🖨️ **Áp dụng cho tất cả chức năng in**

- ✅ `generateQRCode()` - Hiển thị preview
- ✅ `printBadge()` - In chính
- ✅ `printBadgeWithQR()` - In với QR image
- ✅ `printBadgeWithTextQR()` - In với text fallback
- ✅ `printBadgeWithProgressiveLoading()` - In mobile

## 🧪 **Test cases**

### Badge dọc (Vertical):
- Kích thước: W85mm x H120mm → QR 26mm x 26mm
- Kích thước: W90mm x H130mm → QR 26mm x 26mm

### Badge ngang (Horizontal):
- Kích thước: W120mm x H85mm → QR 18mm x 18mm
- Kích thước: W100mm x H70mm → QR 18mm x 18mm

## 🎉 **Kết quả mong đợi**

- QR code trên badge dọc sẽ **lớn hơn 44%**
- **Dễ scan hơn** trên mobile và máy scan
- **Tận dụng không gian** tốt hơn
- **Không ảnh hưởng** đến badge ngang 