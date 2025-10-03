# PWA Dynamic Manifest - Complete Solution

## 🎯 Vấn đề đã giải quyết

PWA hiện tại đã được cập nhật để **hỗ trợ download tại chính trang current của user**. Khi user install PWA từ bất kỳ trang nào, app sẽ mở vào đúng trang đó thay vì luôn về home.

## ✅ Cách hoạt động

### 1. Dynamic Manifest API
**File**: `src/app/api/manifest/route.ts`

API tạo manifest động dựa trên URL hiện tại:
```
GET /api/manifest?start_url=/register/EVENT123&page_name=Register - Event EVENT123
```

### 2. Page-specific Layouts
Mỗi trang có layout riêng để inject dynamic manifest:

- **Check-in**: `src/app/checkin/[eventId]/layout.tsx`
- **Register**: `src/app/register/[eventId]/layout.tsx`  
- **Insight**: `src/app/insight/[eventId]/layout.tsx`

### 3. PWA Manager Hook
**File**: `src/hooks/usePWAManifest.ts`

Hook tự động:
- Detect trang hiện tại
- Update manifest link
- Listen for navigation changes
- Provide PWA configuration

### 4. PWA Manager Component
**File**: `src/components/common/PWAManager.tsx`

Component quản lý:
- Dynamic page titles
- Theme colors theo page type
- Meta descriptions
- PWA configuration logging

### 5. Enhanced PWA Installer
**File**: `src/components/common/PWAInstaller.tsx`

Component hiển thị:
- Page-specific install buttons
- Dynamic hints (Kiosk mode, Registration, Dashboard)
- Real-time manifest updates

## 🚀 Cách sử dụng

### Automatic (Recommended)
PWA Manager tự động hoạt động trên tất cả pages. Không cần config thêm.

### Manual (Nếu cần)
```typescript
import { usePWAManifest } from '@/hooks/usePWAManifest';

function MyComponent() {
  const { manifestConfig, isEventPage, currentPageType } = usePWAManifest();
  
  return (
    <div>
      <p>Current page: {manifestConfig?.pageName}</p>
      <p>Start URL: {manifestConfig?.startUrl}</p>
      <p>Is event page: {isEventPage ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## 📱 Supported Page Types

### 1. Check-in Pages
- **URL Pattern**: `/checkin/[eventId]`
- **PWA Name**: "Check-in - Event [eventId]"
- **Theme Color**: `#059669` (emerald-600)
- **Hint**: "📱 Kiosk mode - Opens directly to this check-in page"

### 2. Register Pages
- **URL Pattern**: `/register/[eventId]`
- **PWA Name**: "Register - Event [eventId]"
- **Theme Color**: `#2563eb` (blue-600)
- **Hint**: "📝 Registration - Opens directly to this registration page"

### 3. Insight Pages
- **URL Pattern**: `/insight/[eventId]`
- **PWA Name**: "Dashboard - Event [eventId]"
- **Theme Color**: `#7c3aed` (violet-600)
- **Hint**: "📊 Dashboard - Opens directly to this dashboard page"

### 4. Home Page
- **URL Pattern**: `/`
- **PWA Name**: "Nexpo Event Registration"
- **Theme Color**: `#3b82f6` (blue-500)
- **Hint**: None (default app)

## 🧪 Cách test

### 1. Development Testing
```bash
npm run dev

# Test different pages:
# http://localhost:3000/checkin/EVENT123
# http://localhost:3000/register/EVENT123
# http://localhost:3000/insight/EVENT123
```

### 2. Manifest Verification
1. Mở DevTools → Application → Manifest
2. Verify `start_url` matches current page
3. Verify `scope` matches current page
4. Check `name` và `short_name`

### 3. Install Testing
1. Click "Install [Page Type]" button
2. Complete installation
3. Mở installed app
4. Verify app opens vào đúng page

### 4. Navigation Testing
1. Install PWA từ page A
2. Navigate to page B trong browser
3. Verify manifest updates automatically
4. Install PWA từ page B
5. Verify both apps work independently

## 🔧 Configuration

### Environment Variables
Không cần config thêm. Tất cả hoạt động tự động.

### Customization
Để customize theme colors hoặc page names:

```typescript
// src/hooks/usePWAManifest.ts
const colors = {
  checkin: '#059669',    // emerald-600
  register: '#2563eb',   // blue-600
  insight: '#7c3aed',    // violet-600
  home: '#3b82f6'        // blue-500
};

// src/components/common/PWAManager.tsx
const colors = {
  checkin: '#059669',
  register: '#2563eb', 
  insight: '#7c3aed',
  home: '#3b82f6'
};
```

## 📊 Use Cases

### 1. Event Kiosk Setup
```bash
# Staff setup tablet tại event entrance
1. Mở /checkin/EVENT123
2. Install PWA → "Check-in Kiosk"
3. Tablet giờ là dedicated check-in kiosk
4. Mở app = instant check-in screen
```

### 2. Registration Booth
```bash
# Event staff setup registration booth
1. Mở /register/EVENT123
2. Install PWA → "Registration"
3. Tablet giờ là dedicated registration kiosk
4. Mở app = instant registration screen
```

### 3. Exhibitor Dashboard
```bash
# Exhibitor access personal dashboard
1. Mở /insight/EVENT123
2. Install PWA → "Dashboard"
3. Personal dashboard app
4. Mở app = instant dashboard
```

### 4. Multiple Event Support
```bash
# User có thể install multiple PWA instances:
- "Check-in Event A" với start_url=/checkin/EVENT_A
- "Check-in Event B" với start_url=/checkin/EVENT_B
- "Register Event C" với start_url=/register/EVENT_C
- Mỗi app là một instance riêng biệt
```

## ⚠️ Lưu ý quan trọng

### 1. HTTPS Required
PWA chỉ hoạt động trên HTTPS (production) hoặc localhost (development)

### 2. Service Worker Scope
Dynamic manifest tạo scope riêng cho mỗi page:
- Check-in: `scope: "/checkin/EVENT123"`
- Register: `scope: "/register/EVENT123"`
- Insight: `scope: "/insight/EVENT123"`

### 3. Manifest Caching
API response có `Cache-Control: no-cache` để đảm bảo manifest luôn fresh

### 4. Navigation Detection
Hook tự động detect navigation changes và update manifest

### 5. Multiple Installations
User có thể install multiple PWA instances cho different pages/events

## 🔍 Troubleshooting

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
3. Verify start_url và scope are correct
4. Check console for PWA Manager logs
```

### App vẫn mở về home
```bash
# Manifest đã cached, cần:
1. Uninstall existing PWA
2. Clear browser cache
3. Re-install PWA với manifest mới
4. Check console logs for manifest updates
```

### Navigation không update manifest
```bash
# Check hook functionality
1. Open console
2. Navigate between pages
3. Look for "[PWA Manager] Current configuration" logs
4. Verify manifest link updates
```

## 📚 API Reference

### usePWAManifest Hook
```typescript
interface PWAManifestConfig {
  startUrl: string;
  pageName: string;
  scope: string;
}

const {
  manifestConfig,    // Current PWA configuration
  isEventPage,       // Boolean: is current page an event page
  currentPageType    // 'checkin' | 'register' | 'insight' | 'home'
} = usePWAManifest();
```

### PWAManager Component
```typescript
interface PWAManagerProps {
  children: React.ReactNode;
}

<PWAManager>
  {children}
</PWAManager>
```

### PWAInstaller Component
```typescript
// Automatically detects current page and shows appropriate install button
<PWAInstaller />
```

## 🎉 Kết quả

**Trước đây:**
```
User ở /register/EVENT123 → Install PWA → Mở app → Về trang home (/)
```

**Bây giờ:**
```
User ở /register/EVENT123 → Install PWA → Mở app → Vào /register/EVENT123 ✅
User ở /checkin/EVENT123 → Install PWA → Mở app → Vào /checkin/EVENT123 ✅
User ở /insight/EVENT123 → Install PWA → Mở app → Vào /insight/EVENT123 ✅
```

PWA giờ đây hoàn toàn hỗ trợ **download tại chính trang current của user**! 🚀✨
