# 🏠 Homepage Events List - NEXPO Event Registration

## 🎯 **Thay đổi chính:**

### **1. Homepage mới (`/`)**
- Hiển thị danh sách **tất cả events** dạng card
- Mỗi card có thông tin: tên, mô tả, ngày, địa điểm, trạng thái
- Button "Đăng ký ngay" để đi đến trang đăng ký
- Responsive design: 1 cột (mobile) → 2 cột (tablet) → 3 cột (desktop)

### **2. Not-found page mới (`/not-found`)**
- Thay vì chỉ hiển thị lỗi 404, giờ cũng hiển thị danh sách events
- Giúp user không bị "lost" khi vào URL sai
- Có thể chọn event khác để đăng ký

## 🔧 **API Implementation:**

### **Backend API Endpoint:**
```typescript
// GET /api/events/?eventId=NEXPO
// Trả về danh sách tất cả events
```

### **Frontend API Client:**
```typescript
// src/lib/api/events.ts
getAllEvents: async (): Promise<{ events: EventData[] }> => {
  const response = await apiClient.get('/api/events/');
  let events = response.data.events || response.data || [];
  // Process events...
  return { events };
}
```

### **API Route:**
```typescript
// src/app/api/events/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    // Get specific event
    return fetch(`${BACKEND_URL}/api/events/?eventId=${eventId}`);
  } else {
    // Get all events using NEXPO
    return fetch(`${BACKEND_URL}/api/events/?eventId=NEXPO`);
  }
}
```

## 🎨 **UI/UX Features:**

### **Event Card Design:**
- **Logo/Banner**: Hiển thị logo event hoặc fallback gradient
- **Event Name**: Tên sự kiện với hover effect
- **Description**: Mô tả ngắn (line-clamp-2)
- **Date Range**: Ngày bắt đầu - kết thúc
- **Location**: Địa điểm tổ chức
- **Status Badge**: "Đang mở đăng ký" / "Đã đóng"
- **Register Button**: CTA chính để đăng ký

### **Responsive Layout:**
```css
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### **Loading States:**
- Loading spinner với logo
- Error handling với retry button
- Empty state khi không có events

## 📱 **Mobile Optimization:**

### **Touch-friendly Design:**
- Button size: `min-h-[48px]` (44px minimum)
- Card hover effects
- Smooth transitions

### **Performance:**
- Lazy loading images
- Error fallback cho broken images
- Optimized bundle size

## 🔄 **Navigation Flow:**

```
Homepage (/) → Event Card → Click "Đăng ký" → /register/[eventId]
404 Page → Event Card → Click "Đăng ký" → /register/[eventId]
```

## 🎯 **Event Card Components:**

### **Logo/Banner Section:**
```tsx
{event.logo ? (
  <img src={event.logo} alt={event.name} />
) : (
  <div className="gradient-fallback">
    {event.name.charAt(0)}
  </div>
)}
```

### **Event Info Section:**
```tsx
<h3>{event.name}</h3>
<p className="line-clamp-2">{event.description}</p>
<div className="date-range">{formatDate(event.start_date)}</div>
<div className="location">{event.location}</div>
<div className="status-badge">{event.status}</div>
```

### **Action Section:**
```tsx
<Button 
  onClick={() => router.push(`/register/${event.id}`)}
  disabled={event.status !== 'active'}
>
  {event.status === 'active' ? 'Đăng ký ngay' : 'Đã đóng đăng ký'}
</Button>
```

## 🎨 **Visual Design:**

### **Color Scheme:**
- **Primary**: Blue gradient (`from-blue-500 to-purple-600`)
- **Background**: Light gray gradient (`from-slate-50 via-white to-gray-50`)
- **Cards**: White with subtle borders
- **Status**: Green (active) / Gray (inactive)

### **Typography:**
- **Headers**: Bold, large text
- **Body**: Regular, readable text
- **Captions**: Small, muted text

### **Spacing:**
- **Card padding**: 24px (p-6)
- **Grid gap**: 24px (gap-6)
- **Section margins**: 32px (py-8)

## 🚀 **Benefits:**

1. **User-friendly**: Dễ dàng tìm và chọn event
2. **SEO-friendly**: Có homepage với nội dung hữu ích
3. **Error recovery**: 404 page giúp user không bị lost
4. **Mobile-first**: Responsive design cho mọi device
5. **Performance**: Optimized loading và rendering

## 🧪 **Test Scenarios:**

### **Homepage Tests:**
- ✅ Load danh sách events thành công
- ✅ Hiển thị empty state khi không có events
- ✅ Error handling khi API fail
- ✅ Responsive design trên mobile/tablet/desktop
- ✅ Click button đăng ký → navigate đúng

### **404 Page Tests:**
- ✅ Hiển thị 404 message
- ✅ Load danh sách events
- ✅ Click button đăng ký → navigate đúng
- ✅ Error handling

### **API Tests:**
- ✅ GET /api/events/ → trả về tất cả events
- ✅ GET /api/events/?eventId=ABC → trả về event cụ thể
- ✅ Error handling cho network issues 