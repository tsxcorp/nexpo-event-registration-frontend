# Dynamic Metadata & Social Sharing Features

## 🎯 Overview

Đã cải thiện hệ thống với các tính năng dynamic metadata và social sharing để tăng trải nghiệm người dùng và SEO cho mỗi event.

## ✨ Features Implemented

### 1. 🔖 Dynamic Favicon
- **Auto-detect favicon**: Sử dụng `event.favicon` nếu có
- **Fallback to logo**: Nếu không có favicon, sử dụng `event.logo`
- **Default fallback**: Cuối cùng sử dụng `/nexpo-favicon.ico`
- **Apple Touch Icon**: Tự động thêm apple-touch-icon cho mobile
- **Real-time update**: Favicon thay đổi ngay khi switch event

### 2. 📄 Dynamic Page Title
- **Event-specific titles**: 
  - Vietnamese: `"[Event Name] - Đăng ký tham dự"`
  - English: `"[Event Name] - Registration"`
- **Auto cleanup**: Reset về default khi unmount component

### 3. 🌐 Social Sharing System
- **Multiple platforms**: Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Email
- **Smart URL generation**: Tự động encode URLs và content
- **Responsive design**: Icons only trên mobile, full text trên desktop
- **Modern UI**: Beautiful buttons với hover effects
- **Popup windows**: Mở share windows với kích thước tối ưu

### 4. 🎨 Social Media Meta Tags
- **Open Graph tags**: `og:title`, `og:description`, `og:image`, `og:url`
- **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **SEO meta tags**: `description`, `keywords`, `author`
- **Dynamic content**: Sử dụng event banner/logo cho images
- **Multi-language support**: Meta tags thay đổi theo ngôn ngữ

### 5. 📊 JSON-LD Structured Data
- **Schema.org Event**: Structured data cho search engines
- **Rich snippets**: Giúp Google hiển thị thông tin event tốt hơn
- **Event details**: Tên, mô tả, hình ảnh, organizer
- **Pricing info**: Free event với availability status
- **Language tags**: Đánh dấu ngôn ngữ content

## 🏗️ Architecture

### Hook: `useEventMetadata`
```typescript
const { generateShareUrls } = useEventMetadata({ 
  event: eventData, 
  currentLanguage 
});
```

**Features:**
- Dynamic favicon management
- Page title updates
- Meta tags injection
- Social share URL generation
- Cleanup on unmount

### Component: `SocialShareButtons`
```typescript
<SocialShareButtons 
  shareUrls={generateShareUrls()}
  title="Share this event"
  className="max-w-md"
/>
```

**Props:**
- `shareUrls`: Object với URLs cho các platform
- `title`: Tiêu đề section (optional)
- `className`: Custom CSS classes (optional)

### Component: `StructuredData`
```typescript
<StructuredData 
  event={eventData} 
  currentLanguage={currentLanguage} 
/>
```

**Features:**
- JSON-LD structured data
- Schema.org Event markup
- SEO optimization
- Rich snippets support

## 📱 User Experience

### Registration Page
1. **Dynamic favicon** thay đổi theo event
2. **Page title** hiển thị tên event
3. **Social share buttons** dưới event description
4. **Meta tags** cho social sharing
5. **Structured data** cho SEO

### Thank You Page
1. **Inherit metadata** từ event
2. **Social share buttons** để chia sẻ event
3. **Dynamic title** và favicon
4. **Translation support** cho share buttons

## 🔧 Technical Implementation

### EventData Interface Updates
```typescript
export interface EventData {
  id: string;
  name: string;
  description: string;
  banner?: string;
  logo?: string;
  favicon?: string; // ✨ New field
  header?: string;
  footer?: string;
  formFields: FormField[];
}
```

### Share URL Generation
```typescript
const generateShareUrls = () => ({
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`,
  twitter: `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`,
  whatsapp: `https://wa.me/?text=${title}%20${currentUrl}`,
  telegram: `https://t.me/share/url?url=${currentUrl}&text=${title}`,
  email: `mailto:?subject=${title}&body=${description}%0A%0A${currentUrl}`
});
```

### Favicon Management
```typescript
const updateFavicon = (iconUrl: string) => {
  // Remove existing favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());

  // Add new favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = iconUrl;
  document.head.appendChild(link);
};
```

## 🎨 UI/UX Features

### Social Share Buttons
- **Platform icons**: SVG icons cho mỗi platform
- **Color coding**: Mỗi platform có màu riêng
- **Responsive**: Icons only trên mobile
- **Hover effects**: Smooth transitions
- **Popup windows**: Centered sharing windows

### Dynamic Content
- **Real-time updates**: Metadata thay đổi khi switch language
- **Fallback system**: Graceful degradation nếu thiếu data
- **Loading states**: Smooth transitions khi loading
- **Error handling**: Robust error handling

## 🚀 Benefits

### SEO Improvements
1. **Dynamic titles**: Better search rankings
2. **Structured data**: Rich snippets in search results
3. **Meta tags**: Better social sharing previews
4. **Favicon branding**: Professional appearance

### Social Sharing
1. **Easy sharing**: One-click sharing to multiple platforms
2. **Rich previews**: Beautiful previews với images
3. **Branded content**: Event-specific imagery
4. **Mobile optimized**: Great UX on all devices

### User Experience
1. **Professional appearance**: Dynamic favicons
2. **Brand consistency**: Event-specific branding
3. **Easy sharing**: Encourage viral sharing
4. **Multi-language**: Works in Vietnamese & English

## 🔮 Future Enhancements

1. **Analytics tracking**: Track share button clicks
2. **Custom share messages**: Platform-specific messages
3. **QR code sharing**: Generate QR codes for easy mobile sharing
4. **Email templates**: Rich HTML email sharing
5. **Calendar integration**: Add to calendar functionality

## 📝 Usage Examples

### Basic Usage
```typescript
// In any page component
const { generateShareUrls } = useEventMetadata({ 
  event: eventData, 
  currentLanguage: 'en' 
});

return (
  <div>
    <SocialShareButtons shareUrls={generateShareUrls()} />
    <StructuredData event={eventData} currentLanguage="en" />
  </div>
);
```

### Custom Styling
```typescript
<SocialShareButtons 
  shareUrls={generateShareUrls()}
  title="Chia sẻ sự kiện này"
  className="custom-share-buttons"
/>
```

Hệ thống bây giờ đã có đầy đủ tính năng dynamic metadata và social sharing professional! 🎉 