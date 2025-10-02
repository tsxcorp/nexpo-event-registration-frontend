# PWA Kiosk Mode - Dynamic Manifest Setup

## 🎯 Vấn đề đã giải quyết

Trước đây, khi install PWA từ bất kỳ trang nào (ví dụ: `/checkin/EVENT123`), app vẫn luôn mở về trang home (`/`) vì manifest.json có `start_url: "/"` cố định.

**Giờ đây**, PWA sẽ install vào **đúng trang hiện tại** mà user đang truy cập.

## ✅ Cách hoạt động

### 1. Dynamic Manifest API
**File**: `src/app/api/manifest/route.ts`

API này tạo manifest động dựa trên URL hiện tại:
```
GET /api/manifest?start_url=/checkin/EVENT123&page_name=Check-in - Event EVENT123
```

Response:
```json
{
  "name": "Check-in - Event EVENT123",
  "short_name": "Check-in",
  "start_url": "/checkin/EVENT123",
  "scope": "/checkin/EVENT123",
  "display": "standalone",
  ...
}
```

### 2. Page-specific Layout
**File**: `src/app/checkin/[eventId]/layout.tsx`

Layout này:
- Inject dynamic manifest link vào `<head>`
- Set metadata phù hợp cho PWA
- Cấu hình Apple Web App metadata

### 3. PWA Installer Component
**File**: `src/components/common/PWAInstaller.tsx`

Component này:
- Detect trang hiện tại (Check-in, Registration, Dashboard)
- Show install button với thông tin phù hợp
- Hiển thị "Install Check-in Kiosk" thay vì "Install App" generic

## 🚀 Cách sử dụng cho các trang khác

### Register Page
```typescript
// src/app/register/[eventId]/layout.tsx
export async function generateMetadata({ params }: RegisterLayoutProps): Promise<Metadata> {
  const { eventId } = await params;
  
  return {
    manifest: `/api/manifest?start_url=/register/${eventId}&page_name=Registration - Event ${eventId}`,
    ...
  };
}
```

### Insight Page
```typescript
// src/app/insight/[eventId]/layout.tsx
export async function generateMetadata({ params }: InsightLayoutProps): Promise<Metadata> {
  const { eventId } = await params;
  
  return {
    manifest: `/api/manifest?start_url=/insight/${eventId}&page_name=Dashboard - Event ${eventId}`,
    ...
  };
}
```

## 🧪 Cách test

### Desktop (Chrome/Edge)
1. Truy cập: `http://localhost:3000/checkin/EVENT123`
2. Mở DevTools → Application → Manifest
3. Verify `start_url` = `/checkin/EVENT123`
4. Click "Install" button (hoặc browser prompt)
5. Mở installed app → Nó sẽ mở vào `/checkin/EVENT123` chứ không phải `/`

### Mobile (iOS Safari)
1. Truy cập: `https://your-domain.com/checkin/EVENT123`
2. Tap Share button → "Add to Home Screen"
3. Đặt tên app (ví dụ: "Event 123 Check-in")
4. Mở app từ home screen → Nó sẽ mở vào `/checkin/EVENT123`

### Mobile (Android Chrome)
1. Truy cập: `https://your-domain.com/checkin/EVENT123`
2. Tap menu (3 dots) → "Install app" hoặc tap "Install Check-in Kiosk" button
3. Mở app từ app drawer → Nó sẽ mở vào `/checkin/EVENT123`

## 📱 Use cases

### 1. Kiosk Check-in
- Staff setup tablet tại event entrance
- Mở `/checkin/EVENT123`
- Install PWA → Tablet giờ là dedicated check-in kiosk
- Khi mở app = instant check-in screen, không cần navigate

### 2. Exhibitor Dashboard
- Exhibitor access `/insight/EVENT123`
- Install PWA → Personal dashboard app
- App luôn mở vào dashboard của họ

### 3. Registration Portal
- Event staff setup registration booth
- Mở `/register/EVENT123`
- Install PWA → Dedicated registration kiosk

## ⚠️ Lưu ý

### 1. HTTPS required
PWA chỉ hoạt động trên HTTPS (production) hoặc localhost (development)

### 2. Multiple installations
User có thể install multiple PWA instances:
- "Check-in Event A" với `start_url=/checkin/EVENT_A`
- "Check-in Event B" với `start_url=/checkin/EVENT_B`
- Mỗi app là một instance riêng biệt

### 3. Service Worker scope
Dynamic manifest tạo scope riêng cho mỗi page:
- Check-in page: `scope: "/checkin/EVENT123"`
- Register page: `scope: "/register/EVENT123"`

### 4. Manifest caching
API response có `Cache-Control: no-cache` để đảm bảo manifest luôn fresh

## 🔧 Troubleshooting

### Manifest không update
```bash
# Clear service worker cache
1. DevTools → Application → Service Workers → Unregister
2. DevTools → Application → Storage → Clear site data
3. Hard refresh (Ctrl+Shift+R)
```

### Install prompt không hiện
```bash
# Check manifest validity
1. DevTools → Application → Manifest
2. Look for errors/warnings
3. Verify start_url and scope are correct
```

### App vẫn mở về home
```bash
# Manifest đã cached, cần:
1. Uninstall existing PWA
2. Clear browser cache
3. Re-install PWA với manifest mới
```

## 📚 Tài liệu tham khảo

- [Web App Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Progressive Web Apps (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Add to Home Screen (Google)](https://web.dev/customize-install/)

