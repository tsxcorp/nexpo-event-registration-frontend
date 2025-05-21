import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchEventInfo } from '../lib/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ImportExcelPage() {
  const router = useRouter();
  const eventId = router.query.Event_Info as string;

  const [eventName, setEventName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState<any[]>([]);

  useEffect(() => {
    if (eventId) {
      fetchEventInfo(eventId)
        .then((res) => {
          setEventName(res?.event?.name || 'Unknown Event');
        })
        .catch(() => setEventName('Error fetching event'));
    }
  }, [eventId]);

  const handleUpload = async () => {
    if (!file || !eventId) {
      alert('⚠️ Missing required file or Event_Info');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', eventId);

    setLoading(true);
    setResult(null);
    setReportDetails([]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/imports`, {
        method: 'POST',
        body: formData,
      });

      const resJson = await response.json();
      if (response.ok) {
        setResult(`✅ Successfully submitted ${resJson.records} records`);
        setReportDetails(resJson.report || []);
      } else {
        setResult(`❌ Failed: ${resJson.error}`);
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setResult('❌ Network error');
    }

    setLoading(false);
  };

  const downloadExcelReport = () => {
    if (!reportDetails.length) return;

    const ws = XLSX.utils.json_to_sheet(reportDetails);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Import_Report");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `import_report_${eventId || 'event'}.xlsx`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-4">🧾 Import Excel for Event</h1>

      <p className="mb-4 text-sm text-gray-500">
        📅 Sự kiện: <strong>{eventName}</strong> <span className="ml-2 text-xs">(ID: {eventId})</span>
      </p>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        disabled={!file || loading}
        onClick={handleUpload}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload & Submit'}
      </button>

      {result && <p className="mt-4 text-sm text-gray-700">{result}</p>}

      {reportDetails.length > 0 && (
        <div className="mt-6 text-sm bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">📊 Import Report</h2>
          <table className="table-auto w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 border">Row</th>
                <th className="px-3 py-2 border">Email</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Error</th>
              </tr>
            </thead>
            <tbody>
              {reportDetails.map((r, i) => (
                <tr key={i} className={r.status === '❌ Failed' ? 'bg-red-50' : ''}>
                  <td className="border px-3 py-1">{r.row}</td>
                  <td className="border px-3 py-1">{r.email}</td>
                  <td className="border px-3 py-1">{r.status}</td>
                  <td className="border px-3 py-1 text-gray-600">{r.error || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={downloadExcelReport}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            ⬇️ Download Excel
          </button>
        </div>
      )}
    </div>
  );
}
