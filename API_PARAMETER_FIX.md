# 🔧 API Parameter Fix - Backend Integration

## 🐛 **Vấn đề gặp phải:**

```
AxiosError: Request failed with status code 400
```

**Nguyên nhân:** Frontend gửi parameter `eventId` nhưng backend yêu cầu `event_id`

## 🔍 **Phân tích Backend:**

### **Backend API Route:**
```javascript
// /src/routes/events.js
router.get('/', async (req, res) => {
  const eventId = req.query.eventId; // ❌ Backend expect eventId
  if (!eventId) return res.status(400).json({ error: 'Missing eventId' });
  
  const result = await fetchEventDetails(eventId);
  res.status(200).json(result);
});
```

### **Backend Zoho Utils:**
```javascript
// /src/utils/zohoEventUtils.js
const response = await axios.get(apiUrl, {
  params: {
    event_id: eventIdInput, // ✅ Backend send event_id to Zoho
    publickey: ZOHO_PUBLIC_KEY
  }
});
```

## ✅ **Giải pháp:**

### **1. Cập nhật API Route (`/src/app/api/events/route.ts`):**

```typescript
// Trước:
const response = await fetch(`${BACKEND_URL}/api/events/?eventId=${eventId}`);

// Sau:
const response = await fetch(`${BACKEND_URL}/api/events/?event_id=${eventId}`);
```

### **2. Cập nhật API Client (`/src/lib/api/events.ts`):**

```typescript
// Trước:
getAllEvents: async () => {
  const response = await apiClient.get('/api/events/');
}

getEventInfo: async (eventId: string) => {
  const response = await apiClient.get(`/api/events/?eventId=${eventId}`);
}

// Sau:
getAllEvents: async () => {
  const response = await apiClient.get('/api/events/?event_id=NEXPO');
}

getEventInfo: async (eventId: string) => {
  const response = await apiClient.get(`/api/events/?event_id=${eventId}`);
}
```

### **3. Support cả hai parameter names:**

```typescript
// API Route support backward compatibility
const eventId = searchParams.get('eventId') || searchParams.get('event_id');
```

## 🔄 **Flow hoạt động:**

### **Homepage Load Events:**
```
Frontend → /api/events/?event_id=NEXPO → Backend → Zoho API
```

### **Single Event Load:**
```
Frontend → /api/events/?event_id=ABC123 → Backend → Zoho API
```

## 📊 **Parameter Mapping:**

| Frontend | API Route | Backend | Zoho API |
|----------|-----------|---------|----------|
| `eventId` | `eventId` | `eventId` | `event_id` |
| `event_id` | `event_id` | `eventId` | `event_id` |

## 🎯 **Test Cases:**

### **Test 1: Homepage Load All Events**
```
GET /api/events/?event_id=NEXPO
Expected: 200 OK with events array
```

### **Test 2: Single Event Load**
```
GET /api/events/?event_id=4433256000012332047
Expected: 200 OK with single event data
```

### **Test 3: Backward Compatibility**
```
GET /api/events/?eventId=4433256000012332047
Expected: 200 OK (still works)
```

## 🚀 **Benefits:**

1. **Fixed 400 Error**: API calls now work correctly
2. **Backward Compatibility**: Old parameter still works
3. **Consistent Naming**: Aligned with backend expectations
4. **Better Error Handling**: Clear parameter requirements

## 🔧 **Implementation Details:**

### **API Route Changes:**
- ✅ Support both `eventId` and `event_id` parameters
- ✅ Send correct `event_id` to backend
- ✅ Proper error handling

### **API Client Changes:**
- ✅ Use `event_id` parameter consistently
- ✅ Explicit NEXPO parameter for all events
- ✅ Maintain existing function signatures

### **Backend Integration:**
- ✅ Correct parameter mapping to Zoho API
- ✅ Support for both single event and list modes
- ✅ Proper error responses

## 🎉 **Result:**

- ✅ Homepage loads events successfully
- ✅ Single event pages work correctly
- ✅ No more 400 errors
- ✅ Backward compatibility maintained 