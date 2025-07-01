'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import QRCode from 'react-qr-code';

interface RegistrationData {
  Salutation: string;
  Full_Name: string;
  Email: string;
  Phone_Number: string;
  zoho_record_id: string;
  group_id?: string;
  group_members?: Array<{
    Salutation: string;
    Full_Name: string;
    Email: string;
    Phone_Number: string;
    [key: string]: string;
  }>;
  [key: string]: any;
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<p className="text-center mt-16 text-gray-500">Đang tải dữ liệu...</p>}>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const dataParam = searchParams.get('data');

  useEffect(() => {
    if (!dataParam) {
      console.error('No data parameter found in URL');
      setLoading(false);
      return;
    }

    try {
      const parsedData = JSON.parse(dataParam);
      setRegistrationData(parsedData);
    } catch (error) {
      console.error('Error parsing registration data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataParam]);

  if (loading) return <p className="text-center mt-16 text-gray-500">Đang tải dữ liệu...</p>;
  if (!registrationData) return <p className="text-center mt-16 text-red-500">Không tìm thấy thông tin đăng ký.</p>;

  const isGroup = registrationData.group_members && registrationData.group_members.length > 1;

  return (
    <RegistrationLayout>
      <section className="max-w-2xl mx-auto px-6 py-16">
        <Card className="p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cảm ơn bạn đã đăng ký!</h2>
          <p className="text-lg text-gray-600 mb-4">
            Xin chào {registrationData.Salutation} {registrationData.Full_Name},
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Chúng tôi đã nhận được thông tin đăng ký của bạn. Vui lòng kiểm tra email {registrationData.Email} để xác nhận.
          </p>

          {/* QR Code Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">🎫 Mã QR xác nhận</h3>
            <p className="text-gray-600 mb-4">Vui lòng trình mã QR này khi đến sự kiện</p>
            {isGroup ? (
              <>
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-2">Mã QR nhóm</h4>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded shadow-lg border border-blue-500">
                      <QRCode
                        value={registrationData.group_id || ''}
                        size={160}
                        style={{ height: 'auto', maxWidth: '100%', width: '160px' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded shadow-lg border border-blue-500">
                  <QRCode
                    value={registrationData.zoho_record_id}
                    size={160}
                    style={{ height: 'auto', maxWidth: '100%', width: '160px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Registration Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Thông tin đăng ký</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(registrationData)
                    .filter(([key]) => !['group_members', 'group_id', 'zoho_record_id'].includes(key))
                    .map(([key, value], index) => (
                      <tr key={index} className="border-b border-gray-200 last:border-0">
                        <td className="py-2 text-gray-600 capitalize font-medium text-left w-1/3">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2 text-left font-semibold text-blue-800">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Group Members Section */}
          {isGroup && registrationData.group_members && registrationData.group_members.length > 1 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Danh sách thành viên nhóm</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 text-gray-600 font-medium text-left">Họ tên</th>
                      <th className="py-2 text-gray-600 font-medium text-left">Email</th>
                      <th className="py-2 text-gray-600 font-medium text-left">SĐT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationData.group_members.map((member, idx) => (
                      <tr key={idx} className="border-b border-gray-200 last:border-0">
                        <td className="py-2 text-blue-800 font-semibold">{member.Full_Name}</td>
                        <td className="py-2">{member.Email}</td>
                        <td className="py-2">{member.Phone_Number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
          >
            Quay về trang chủ
          </Button> */}
        </Card>
      </section>
    </RegistrationLayout>
  );
} 