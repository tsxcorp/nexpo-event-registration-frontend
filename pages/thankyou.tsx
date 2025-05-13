import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function ThankYouPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.data) {
      try {
        const parsed = JSON.parse(router.query.data as string);
  
        // Chuyển đổi key thành lowercase để đảm bảo đúng với JSON truyền vào
        const { zoho_record_id, ...rest } = parsed;
        setFormData(rest);
        if (zoho_record_id) {
          setRecordId(zoho_record_id);
        }
      } catch (err) {
        console.error("Invalid data in thank you page.");
      }
    }
  }, [router.query.data]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-blue-50 px-4">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-xl w-full animate-fadeIn">
        <h1 className="text-3xl font-bold text-blue-700 mb-4 text-center">
          🎫 Your Confirmation QR
        </h1>
        <p className="text-gray-700 mb-6 text-center">
          Thank you for registering! Please present this QR at the event.
        </p>

        {recordId && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded shadow-lg border border-blue-500">
              <QRCode
                value={recordId}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ height: 'auto', maxWidth: '100%', width: '160px' }}
              />
            </div>
          </div>
        )}

        <table className="w-full text-sm border-t border-b border-gray-200 divide-y divide-gray-100">
          <tbody>
            {Object.entries(formData).map(([key, value], i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-gray-600 capitalize font-medium text-left w-1/3">
                  {key.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-2 text-left font-semibold text-blue-800">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          🔙 Back to Homepage
        </button>
      </div>
    </div>
  );
}
