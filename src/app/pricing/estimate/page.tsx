'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PricingEstimatePage() {
  const [formData, setFormData] = useState({
    eventType: '',
    expectedGuests: '',
    eventDays: 1,
    // Ticket sales
    hasTicketSales: false,
    ticketPrice: 0,
    // Onsite services
    qrScanners: 0,
    badgePrinters: 0,
    kiosks: 0,
    supportStaff: 0,
    leadScannerBooths: 0,
    whiteLabel: false,
    crmIntegration: false,
    // Additional services
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false
  });

  const [estimate, setEstimate] = useState<{
    saasFee: number;
    onsiteServices: number;
    ticketFeeMin: number;
    ticketFeeMax: number;
    totalMin: number;
    totalMax: number;
    breakdown: any[];
  } | null>(null);

  const eventTypes = [
    { value: 'event', label: 'Event', saasMin: 10, saasMax: 15, guestMin: 300, guestMax: 2000 },
    { value: 'conference', label: 'Conference', saasMin: 18, saasMax: 25, guestMin: 500, guestMax: 5000 },
    { value: 'exhibition', label: 'Exhibition', saasMin: 25, saasMax: 40, guestMin: 2000, guestMax: 20000 }
  ];

  const onsiteServices = [
    { key: 'qrScanners', label: 'Máy quét QR cầm tay', pricePerDay: 1.25, unit: 'thiết bị' },
    { key: 'badgePrinters', label: 'Máy in badge onsite', pricePerDay: 2.5, unit: 'máy' },
    { key: 'kiosks', label: 'Kiosk self check-in', pricePerDay: 6, unit: 'kiosk' },
    { key: 'supportStaff', label: 'Nhân sự onsite support', pricePerDay: 2, unit: 'người' },
    { key: 'leadScannerBooths', label: 'Lead scanner app (exhibitor)', pricePerDay: 0.2, unit: 'booth' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateEstimate = () => {
    if (!formData.eventType || !formData.expectedGuests) {
      alert('Vui lòng chọn loại sự kiện và số lượng khách dự kiến');
      return;
    }

    const selectedEventType = eventTypes.find(et => et.value === formData.eventType);
    if (!selectedEventType) return;

    const guests = parseInt(formData.expectedGuests);
    const days = formData.eventDays;

    // Calculate SaaS fee based on event type and guest count
    let saasFee = 0;
    if (guests <= selectedEventType.guestMin) {
      saasFee = selectedEventType.saasMin;
    } else if (guests >= selectedEventType.guestMax) {
      saasFee = selectedEventType.saasMax;
    } else {
      // Linear interpolation - round to nearest million
      const ratio = (guests - selectedEventType.guestMin) / (selectedEventType.guestMax - selectedEventType.guestMin);
      saasFee = Math.round(selectedEventType.saasMin + (selectedEventType.saasMax - selectedEventType.saasMin) * ratio);
    }

    // Calculate onsite services
    let onsiteServicesTotal = 0;
    const breakdown = [];

    // Badge printing materials (7,000-9,000 VND per badge)
    const badgeMaterials = Math.round(guests * 0.008); // 8,000 VND average, round to nearest million
    onsiteServicesTotal += badgeMaterials;
    breakdown.push({
      service: 'Vật tư in ấn (mực + giấy badge)',
      quantity: guests,
      unit: 'badge',
      pricePerUnit: 0.008,
      total: badgeMaterials
    });

    // Other onsite services
    onsiteServices.forEach(service => {
      const quantity = formData[service.key as keyof typeof formData] as number;
      if (quantity > 0) {
        const total = Math.round(quantity * service.pricePerDay * days);
        onsiteServicesTotal += total;
        breakdown.push({
          service: service.label,
          quantity: quantity,
          unit: service.unit,
          pricePerUnit: service.pricePerDay,
          days: days,
          total: total
        });
      }
    });

    // One-time services
    if (formData.whiteLabel) {
      const whiteLabelCost = 23; // Average of 15-30 million, rounded
      onsiteServicesTotal += whiteLabelCost;
      breakdown.push({
        service: 'White-label domain + branding',
        quantity: 1,
        unit: 'gói',
        pricePerUnit: 23,
        total: whiteLabelCost
      });
    }

    if (formData.crmIntegration) {
      const crmCost = 15; // Average of 10-20 million
      onsiteServicesTotal += crmCost;
      breakdown.push({
        service: 'Tích hợp CRM/MA nâng cao',
        quantity: 1,
        unit: 'gói',
        pricePerUnit: 15,
        total: crmCost
      });
    }

    // Calculate ticket fee range if ticket sales enabled (3-5%)
    let ticketFeeMin = 0;
    let ticketFeeMax = 0;
    if (formData.hasTicketSales && formData.ticketPrice > 0) {
      const totalTicketRevenue = guests * formData.ticketPrice;
      ticketFeeMin = Math.round(totalTicketRevenue * 0.03 / 1000000); // 3% fee
      ticketFeeMax = Math.round(totalTicketRevenue * 0.05 / 1000000); // 5% fee
      
      breakdown.push({
        service: 'Phí thanh toán vé (3-5%)',
        quantity: guests,
        unit: 'vé',
        pricePerUnit: `${Math.round(formData.ticketPrice * 0.03 / 1000000)} - ${Math.round(formData.ticketPrice * 0.05 / 1000000)}`,
        total: `${ticketFeeMin} - ${ticketFeeMax}`
      });
    }

    const totalMin = saasFee + onsiteServicesTotal + ticketFeeMin;
    const totalMax = saasFee + onsiteServicesTotal + ticketFeeMax;

    setEstimate({
      saasFee,
      onsiteServices: onsiteServicesTotal,
      ticketFeeMin,
      ticketFeeMax,
      totalMin,
      totalMax,
      breakdown
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              NEXPO Pricing Calculator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Báo Giá Tự Động
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Nhận báo giá chính xác dựa trên nhu cầu sự kiện của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin sự kiện</h2>
            
            <div className="space-y-6">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại sự kiện *
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => handleInputChange('eventType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn loại sự kiện</option>
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({type.guestMin.toLocaleString()} - {type.guestMax.toLocaleString()} khách)
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng khách dự kiến *
                </label>
                <input
                  type="number"
                  value={formData.expectedGuests || ''}
                  onChange={(e) => handleInputChange('expectedGuests', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số lượng khách"
                />
              </div>

              {/* Event Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ngày sự kiện
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.eventDays || ''}
                  onChange={(e) => handleInputChange('eventDays', e.target.value === '' ? 1 : parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Ticket Sales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Bán vé trực tuyến</h3>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasTicketSales}
                    onChange={(e) => handleInputChange('hasTicketSales', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">Có bán vé trực tuyến</span>
                </div>

                {formData.hasTicketSales && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá vé (VND)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ticketPrice || ''}
                        onChange={(e) => handleInputChange('ticketPrice', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập giá vé"
                      />
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Lưu ý:</strong> Phí thanh toán vé: 3-5% tùy đối tác thanh toán
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Onsite Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ onsite (tùy chọn)</h3>
                <div className="space-y-4">
                  {onsiteServices.map(service => (
                    <div key={service.key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {service.label}
                        </label>
                        <p className="text-xs text-gray-500">
                          {service.key === 'leadScannerBooths' 
                            ? '200,000 VND / booth / ngày'
                            : `${(service.pricePerDay * 1000000).toLocaleString('vi-VN')} VND / ${service.unit} / ngày`
                          }
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData[service.key as keyof typeof formData] as number || ''}
                        onChange={(e) => handleInputChange(service.key, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ bổ sung</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.whiteLabel}
                      onChange={(e) => handleInputChange('whiteLabel', e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">
                      White-label domain + branding (15,000,000 - 30,000,000 VND)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.crmIntegration}
                      onChange={(e) => handleInputChange('crmIntegration', e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">
                      Tích hợp CRM/MA nâng cao (10,000,000 - 20,000,000 VND)
                    </span>
                  </label>
                </div>
              </div>

              <Button
                onClick={calculateEstimate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Tính toán báo giá
              </Button>
            </div>
          </Card>

          {/* Estimate Results */}
          <div>
            {estimate ? (
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Báo giá ước tính</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">Gói SaaS (Full Features)</span>
                    <span className="font-bold text-blue-600">
                      {(estimate.saasFee * 1000000).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">Dịch vụ onsite</span>
                    <span className="font-bold text-green-600">
                      {(estimate.onsiteServices * 1000000).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                  
                  {estimate.ticketFeeMin > 0 && (
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <span className="font-medium text-gray-700">Phí thanh toán vé (3-5%)</span>
                      <span className="font-bold text-orange-600">
                        {(estimate.ticketFeeMin * 1000000).toLocaleString('vi-VN')} - {(estimate.ticketFeeMax * 1000000).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                    <span className="font-bold text-lg">Tổng cộng</span>
                    <span className="font-bold text-xl">
                      {(estimate.totalMin * 1000000).toLocaleString('vi-VN')} - {(estimate.totalMax * 1000000).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Chi tiết dịch vụ</h3>
                  <div className="space-y-2">
                    {estimate.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.service}
                          {item.quantity > 1 && ` (${item.quantity} ${item.unit}${item.days ? ` × ${item.days} ngày` : ''})`}
                        </span>
                        <span className="font-medium">
                          {typeof item.total === 'string' ? 
                            `${item.total} triệu VND` : 
                            `${(item.total * 1000000).toLocaleString('vi-VN')} VND`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Lưu ý:</strong> Đây là báo giá ước tính. Giá thực tế có thể thay đổi theo địa điểm, 
                    thời gian cụ thể và các yêu cầu đặc biệt. Chưa bao gồm VAT.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Liên hệ tư vấn
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Tải báo giá PDF
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có báo giá
                  </h3>
                  <p className="text-gray-600">
                    Vui lòng điền thông tin sự kiện và nhấn "Tính toán báo giá" để xem ước tính chi phí.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
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
