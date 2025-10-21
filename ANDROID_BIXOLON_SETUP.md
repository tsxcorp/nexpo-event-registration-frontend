# Android Bixolon Setup Guide

## Tổng quan

Hệ thống Nexpo Event Registration đã được tích hợp với Android để hỗ trợ in badge tự động trên thiết bị Android Imin Swan 2 với máy in Bixolon.

## Flow hoạt động

1. **Thiết bị Android Imin Swan 2** kết nối với **máy in Bixolon**
2. Vào **Chrome trên Imin** → Vào trang **checkin**
3. Hệ thống **tự động detect** thiết bị Android và máy in
4. **Auto setup** để có thể in native
5. User **scan QR** → **Tự động in badge**

## Các phương thức kết nối hỗ trợ

### 1. USB (Khuyến nghị)
- Kết nối trực tiếp qua cáp USB
- Ổn định và dễ thiết lập
- Không cần cấu hình mạng

### 2. Bluetooth
- Kết nối không dây qua Bluetooth
- Linh hoạt nhưng cần pairing
- Phù hợp khi không có USB

### 3. WiFi
- Kết nối qua mạng WiFi
- Cần cả hai thiết bị cùng mạng
- Phù hợp cho setup từ xa

## Cấu trúc hệ thống

### 1. Android Print Service
```typescript
// src/lib/print/android-print-service.ts
- Detect thiết bị Android Imin Swan 2
- Load Bixolon Android SDK
- Auto-detect printers (USB/Bluetooth/WiFi)
- Kết nối và in badge
```

### 2. Unified Print Service
```typescript
// src/lib/print/unified-print-service.ts
- Tự động detect platform (Android/Desktop)
- Sử dụng service phù hợp
- Unified interface cho tất cả platforms
```

### 3. Android Bixolon Guide
```typescript
// src/components/features/AndroidBixolonGuide.tsx
- Hướng dẫn setup cho Android
- Chọn phương thức kết nối
- Test kết nối và in ấn
```

### 4. Print Wizard (Updated)
```typescript
// src/components/features/PrintWizard.tsx
- Detect Android devices
- Auto-setup cho Android
- Unified wizard cho tất cả platforms
```

## Bixolon Android SDK

### File SDK
```
public/bixolon-sdk/bixolon-android-sdk.js
```

### Tính năng
- Giao tiếp với Bixolon Android SDK
- Hỗ trợ USB, Bluetooth, WiFi
- ESC/POS commands cho Bixolon
- QR code generation
- Fallback cho development

## Cách sử dụng

### 1. Kết nối máy in
- Cắm cáp USB từ máy in Bixolon vào thiết bị Android
- Hoặc kết nối Bluetooth/WiFi

### 2. Mở trang checkin
- Vào Chrome trên Android Imin Swan 2
- Truy cập trang checkin của event

### 3. Auto setup
- Hệ thống tự động detect thiết bị Android
- Hiển thị Android Bixolon Guide
- Chọn phương thức kết nối
- Test kết nối

### 4. In badge
- Scan QR code của visitor
- Hệ thống tự động in badge
- Không cần popup print

## API Endpoints

### Android Print Service
```typescript
// Detect printers
await androidPrintService.getDetectedPrinters()

// Connect printer
await androidPrintService.connectUSB(address)
await androidPrintService.connectBluetooth(address)
await androidPrintService.connectWiFi(address)

// Print badge
await androidPrintService.printBadge(printJob)
```

### Unified Print Service
```typescript
// Check availability
await unifiedPrintService.isAvailable()

// Get printers
await unifiedPrintService.getPrinters()

// Print badge (unified)
await unifiedPrintService.printBadge(badgeData, layout)
```

## Troubleshooting

### 1. Không detect được máy in
- Kiểm tra kết nối USB/Bluetooth/WiFi
- Restart thiết bị Android
- Kiểm tra Bixolon SDK

### 2. In thất bại
- Kiểm tra trạng thái máy in
- Kiểm tra giấy in
- Test kết nối lại

### 3. SDK không load
- Kiểm tra file bixolon-android-sdk.js
- Kiểm tra Android WebView
- Sử dụng fallback mode

## Development

### Test trên desktop
- Sử dụng fallback mode
- Simulate Android environment
- Test với mock data

### Test trên Android
- Deploy lên thiết bị thật
- Test với máy in Bixolon thật
- Debug qua Chrome DevTools

## Tương lai

### Tính năng có thể thêm
- Hỗ trợ nhiều loại máy in khác
- Cloud printing
- Batch printing
- Print queue management
- Advanced label templates

### Tối ưu hóa
- Caching printer connections
- Background printing
- Error recovery
- Performance monitoring
