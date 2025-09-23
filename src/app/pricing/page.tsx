'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PricingPage() {
  const saasPricing = [
    {
      eventType: 'Event',
      scale: '300 – 2,000 khách',
      price: '10,000,000 – 15,000,000 VND / sự kiện'
    },
    {
      eventType: 'Conference',
      scale: '500 – 5,000 khách',
      price: '18,000,000 – 25,000,000 VND / sự kiện'
    },
    {
      eventType: 'Exhibition',
      scale: '2,000 – 20,000+ khách',
      price: '25,000,000 – 40,000,000 VND / sự kiện'
    }
  ];

  const onsiteServices = [
    {
      service: 'Máy quét QR cầm tay',
      price: '1,000,000 – 1,500,000 VND / thiết bị / ngày',
      note: 'Gợi ý 3–20 thiết bị tuỳ quy mô'
    },
    {
      service: 'Máy in badge onsite',
      price: '2,000,000 – 3,000,000 VND / máy / ngày',
      note: 'Gợi ý 2–10 máy'
    },
    {
      service: 'Vật tư in ấn (mực + giấy badge)',
      price: '7,000 – 9,000 VND / badge',
      note: 'Tính theo số lượng khách, tùy loại giấy'
    },
    {
      service: 'Kiosk self check-in',
      price: '5,000,000 – 7,000,000 VND / kiosk / ngày',
      note: 'Gợi ý 2–10 kiosk'
    },
    {
      service: 'Nhân sự onsite support',
      price: '1,500,000 – 2,500,000 VND / người / ngày',
      note: 'Gợi ý 2–15 người'
    },
    {
      service: 'Lead scanner app (exhibitor)',
      price: '200,000 VND / booth / ngày',
      note: 'Thu theo booth đăng ký'
    },
    {
      service: 'White-label domain + branding',
      price: '15,000,000 – 30,000,000 VND / gói',
      note: 'Thiết lập một lần'
    },
    {
      service: 'Tích hợp CRM/MA nâng cao',
      price: '10,000,000 – 20,000,000 VND / gói',
      note: 'Thiết lập một lần'
    }
  ];

  const allInclusivePackages = [
    {
      package: 'Event (300–2,000 khách)',
      price: '25,000,000 – 45,000,000 VND / sự kiện'
    },
    {
      package: 'Conference (500–5,000 khách)',
      price: '60,000,000 – 100,000,000 VND / sự kiện'
    },
    {
      package: 'Exhibition (2,000–20,000+ khách)',
      price: '180,000,000 – 400,000,000 VND / sự kiện'
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              NEXPO Pricing
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pricing Catalog
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Full-features + Onsite services menu
            </p>
            <p className="text-sm text-blue-200">
              Cập nhật: 23/09/2025
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* CTA Section */}
        <div className="text-center mb-12">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold">
            <a href="/pricing/estimate" className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Nhận báo giá tự động cho sự kiện của bạn
            </a>
          </Button>
          <p className="text-gray-600 mt-4">
            Điền thông tin sự kiện và nhận báo giá chính xác trong vài phút
          </p>
        </div>
        
        {/* Platform Features Overview */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">NEXPO Platform - Tính năng chính</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Registration & Ticketing
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Đăng ký trực tuyến tự động</li>
                <li>• Hệ thống bán vé tích hợp</li>
                <li>• Quản lý danh sách khách mời</li>
                <li>• Xác thực và thanh toán</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR Check-in & Badge
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• QR code cá nhân/nhóm</li>
                <li>• Check-in tự động</li>
                <li>• In badge onsite</li>
                <li>• Kiosk self check-in</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Exhibitor Portal
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Quản lý gian hàng</li>
                <li>• Lead scanner app</li>
                <li>• Danh mục sản phẩm</li>
                <li>• Báo cáo tương tác</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Session & Speaker
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Lịch trình sự kiện</li>
                <li>• Quản lý diễn giả</li>
                <li>• Đặt chỗ session</li>
                <li>• Live streaming</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Website Builder
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Landing page tự động</li>
                <li>• White-label branding</li>
                <li>• Custom domain</li>
                <li>• Mobile responsive</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Communication
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Email automation</li>
                <li>• SMS notifications</li>
                <li>• Push notifications</li>
                <li>• Multi-language support</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics & Reports
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dashboard real-time</li>
                <li>• Báo cáo chi tiết</li>
                <li>• Export dữ liệu</li>
                <li>• ROI tracking</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Integrations
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• CRM integration</li>
                <li>• Marketing automation</li>
                <li>• Payment gateways</li>
                <li>• Social media</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security & Support
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Data encryption</li>
                <li>• GDPR compliance</li>
                <li>• 24/7 support</li>
                <li>• Backup & recovery</li>
              </ul>
            </div>
          </div>
        </Card>
        
        {/* 1) SaaS Fee theo loại sự kiện */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1) SaaS Fee theo loại sự kiện</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Loại sự kiện</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Quy mô tham khảo</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Gói SaaS (Full Features)</th>
                </tr>
              </thead>
              <tbody>
                {saasPricing.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">{item.eventType}</td>
                    <td className="border border-gray-300 px-4 py-3">{item.scale}</td>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-blue-600">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Bao gồm: registration, ticketing, landing page, QR check-in, exhibitor/sponsor portal, session & speaker, website builder, email/SMS automation, báo cáo.
          </p>
        </Card>

        {/* 2) Onsite Services */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2) Onsite Services (thuê theo nhu cầu)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Dịch vụ / Thiết bị</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Đơn giá tham khảo</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {onsiteServices.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">{item.service}</td>
                    <td className="border border-gray-300 px-4 py-3 font-semibold">{item.price}</td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-600">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3) Gói trọn gói */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3) Gói trọn gói (ước lượng trung bình)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Gói trọn gói</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Khoảng giá</th>
                </tr>
              </thead>
              <tbody>
                {allInclusivePackages.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">{item.package}</td>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-blue-600">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Ghi chú chung */}
        <Card className="mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Ghi chú:</strong> Giá có thể thay đổi theo địa điểm, thời gian, số ngày, số lượng thiết bị/nhân sự. 
              Phí ticketing có thể áp dụng theo % doanh thu (2–3%) với trần phí theo từng deal. Chưa bao gồm VAT.
            </p>
          </div>
        </Card>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/nexpo-logo.png" 
                  alt="Nexpo" 
                  className="h-8 w-auto mr-3"
                />
              </div>
              <p className="text-gray-600 mb-4">
                Nền tảng quản lý sự kiện và triển lãm hàng đầu Việt Nam, 
                cung cấp giải pháp toàn diện cho các sự kiện từ quy mô nhỏ đến lớn.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Địa chỉ:</span> Tầng 5 – Tòa nhà Ngọc Linh Nhi, 97 Trần Quang Diệu, Phường 14, Quận 3, TP.HCM
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Hotline:</span> 028.6682.7794
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Liên hệ</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:contact@nexpo.vn" className="text-gray-600 hover:text-blue-600 transition-colors">
                    contact@nexpo.vn
                  </a>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  <a href="https://nexpo.vn" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 transition-colors">
                    nexpo.vn
                  </a>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Quản lý sự kiện</li>
                <li>Check-in tự động</li>
                <li>Bán vé trực tuyến</li>
                <li>Quản lý triển lãm</li>
                <li>Báo cáo thống kê</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 NEXPO. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
