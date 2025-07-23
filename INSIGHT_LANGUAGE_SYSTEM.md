# Smart Language Handling System - Insight Pages

## 🎯 **Overview**

Một hệ thống thông minh để xử lý dữ liệu đa ngôn ngữ từ Zoho Creator với:
- **Default English**: Fetch và display tiếng Anh đầu tiên
- **Smart Fallback**: Tự động fallback giữa các field multi-language
- **Google Translation**: Dịch nội dung còn thiếu qua Google APIs
- **Caching**: Cache kết quả để optimize performance

## 🏗️ **Architecture**

```
Zoho Data (Mixed Eng & Vie) 
    ↓
Language Utils (Smart Field Mapping)
    ↓ 
Translation Service (Google APIs)
    ↓
Cached Results
    ↓
Display to User
```

## 📊 **Data Field Mapping**

### **Exhibitor Data**
```javascript
const EXHIBITOR_FIELDS = {
  company_name: {
    en: ['en_company_name', 'display_name'],     // Ưu tiên eng field
    vi: ['display_name', 'en_company_name']     // Ưu tiên display_name
  },
  company_description: {
    en: ['eng_company_description'],
    vi: ['vie_company_description']
  },
  company_address: {
    en: ['eng_address'],
    vi: ['vie_address']
  },
  display_products: {
    en: ['eng_display_products'], 
    vi: ['vie_display_products']
  }
}
```

### **Event Data** 
```javascript
const EVENT_FIELDS = {
  event_name: { en: ['name'], vi: ['name'] },
  event_description: { en: ['description'], vi: ['description'] },
  event_location: { en: ['location'], vi: ['location'] }
}
```

## 🔄 **Processing Flow**

### **1. Default English (Auto-load)**
```javascript
// 1. Prioritize English fields
const englishContent = getLanguageField(data, 'company_name', 'en');
// → Tries: en_company_name → display_name

// 2. If not found, get Vietnamese and translate
const vietnameseContent = getLanguageField(data, 'company_name', 'vi');
const translated = await translateAndCache(vietnameseContent, 'en');

// 3. Cache result for future use
cache.set('en:company_name', translated);
```

### **2. Switch to Vietnamese**
```javascript
// 1. Prioritize Vietnamese fields  
const vietnameseContent = getLanguageField(data, 'company_name', 'vi');
// → Tries: display_name → en_company_name

// 2. If not found, get English and translate
const englishContent = getLanguageField(data, 'company_name', 'en');
const translated = await translateAndCache(englishContent, 'vi');

// 3. Cache result
cache.set('vi:company_name', translated);
```

## 🛠️ **Key Components**

### **1. Language Utils** (`src/lib/utils/languageUtils.ts`)
- **Smart field mapping** cho mixed data từ Zoho
- **Translation caching** để avoid repeated API calls  
- **Fallback logic** giữa English/Vietnamese fields
- **Batch processing** cho performance

### **2. Insight Translation Hook** (`src/hooks/useInsightTranslation.ts`)
- **Default English initialization**
- **Smart data processing** với translation
- **Language switching** với caching
- **Loading states** và error handling

### **3. Updated Insight Pages**
- `src/app/insight/[eventId]/page.tsx` - Access page
- `src/app/insight/[eventId]/[visitorId]/page.tsx` - Dashboard page

## 🎮 **Usage Examples**

### **Basic Processing**
```javascript
// Process entire event with English default
const processedEvent = await processEventLanguage(
  originalEventData, 
  'en',     // Target language
  true      // Enable translation for missing content
);

// Access processed fields
console.log(processedEvent.name);           // English name
console.log(processedEvent.exhibitors[0].display_name); // English company name
```

### **Custom Hook Usage**
```javascript
const {
  eventData,              // Processed data
  currentLanguage,        // 'en' | 'vi'  
  isTranslating,          // Loading state
  translateEventData,     // Switch language
  clearCache,            // Memory management
  getCacheInfo          // Debug info
} = useInsightTranslation(originalEventData);

// Switch to Vietnamese
await translateEventData('vi');
```

## 🚀 **Performance Features**

### **1. Smart Caching**
```javascript
// Cache structure
const cache = new Map<string, string>();
// Key format: "language:content_preview"
// Example: "en:ABC Company Limited is..."

// Memory management
clearTranslationCache(); // Clear all
getCacheStats();         // Get size & keys
```

### **2. Batch Processing**
- Process all exhibitors simultaneously
- Process all sessions simultaneously  
- Parallel async operations

### **3. Fallback Strategy**
1. **Target language field** (priority)
2. **Fallback language field** (if missing)
3. **Google Translation** (if still missing)
4. **Empty string** (ultimate fallback)

## 📱 **User Experience**

### **Default State (English)**
✅ Load page → Auto display English content  
✅ Smart field prioritization (en_company_name → display_name)
✅ Translation for missing English content
✅ Smooth loading states

### **Language Switch (Vietnamese)**  
✅ Click language switcher
✅ Smart field prioritization (display_name → en_company_name)
✅ Translation for missing Vietnamese content
✅ Results cached for future

## 🔧 **Configuration**

### **Field Priority Customization**
```javascript
// Add new field mappings
LANGUAGE_FIELD_MAP.custom_field = {
  en: ['eng_custom_field', 'custom_field'],
  vi: ['vie_custom_field', 'custom_field']  
};
```

### **Translation Control**
```javascript
// Disable translation (fallback only)
const processed = await processEventLanguage(data, 'en', false);

// Enable selective translation
const shouldTranslate = fieldName !== 'phone_number';
```

## 🎯 **Benefits**

### **For Users**
- ✅ **Consistent English default** experience
- ✅ **Seamless language switching** 
- ✅ **Complete content** (no missing translations)
- ✅ **Fast loading** with caching

### **For Developers**  
- ✅ **Easy to extend** with new fields
- ✅ **Type-safe** implementation
- ✅ **Memory efficient** caching
- ✅ **Debug-friendly** with logs

### **For System**
- ✅ **Optimized API usage** (cached translations)
- ✅ **Robust fallback** handling
- ✅ **Scalable architecture**
- ✅ **Performance monitoring** tools

## 🧪 **Testing Flow**

1. **Test Default English**:
   - Load insight page → Should display English by default
   - Check mixed data fields (exhibitors, sessions)

2. **Test Language Switch**:  
   - Click Vietnamese → Should translate missing content
   - Click English → Should use cached or re-process

3. **Test Edge Cases**:
   - Missing English fields → Should translate Vietnamese
   - Missing Vietnamese fields → Should translate English
   - Both missing → Should gracefully handle empty 