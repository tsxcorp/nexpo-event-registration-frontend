// ✅ Updated thankyou.tsx to support both individual and group registration
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

type Member = {
  ID: string;
  full_name: string;
  email?: string;
};

export default function ThankYouPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (router.query.data) {
      try {
        const parsed = JSON.parse(router.query.data as string);
        const { zoho_record_id, group_id, group_members, ...rest } = parsed;

        setFormData(rest);
        setRecordId(zoho_record_id || null);
        setGroupId(group_id || null);
        setGroupMembers(Array.isArray(group_members) ? group_members : []);
      } catch (err) {
        console.error("Invalid data in thank you page.");
      }
    }
  }, [router.query.data]);

  const isGroup = !!groupId;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-blue-50 px-4">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-xl w-full animate-fadeIn">
        <h1 className="text-3xl font-bold text-blue-700 mb-4 text-center">
          🎫 Your Confirmation QR
        </h1>
        <p className="text-gray-700 mb-6 text-center">
          Thank you for registering! Please present this QR at the event.
        </p>

        {(groupId || recordId) && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded shadow-lg border border-blue-500">
              <QRCode
                value={groupId || recordId!}
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

        {isGroup && groupMembers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-blue-700 mb-4">👥 Group Members</h2>
            <div className="space-y-4">
              {groupMembers.map((m, idx) => (
                <div key={m.ID || idx} className="border rounded p-4 shadow-sm bg-gray-50">
                  <div className="font-semibold text-gray-800">{m.full_name}</div>
                  {m.email && <div className="text-sm text-gray-500">{m.email}</div>}
                  <div className="mt-2">
                    <QRCode value={m.ID} size={100} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
