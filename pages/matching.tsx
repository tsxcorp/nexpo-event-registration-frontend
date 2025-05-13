import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MatchingRequestPage() {
  const router = useRouter();
  const { company_name, visid, exhid } = router.query;

  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (company_name && visid && exhid) {
      const baseUrl = 'https://creatorapp.zohopublic.com/tsxcorp/nxp/page-embed/Business_Matching_Request/PzADH5Jf0ZPuzTGyeWXp8XjbuH3S0uCY9DdzXFCTTm74qXfXuJJBDaGEjGNEbSHPxZNj86rAmDWCaCmj26ODjrGSeFPySxzjdM1q';
      
      const getParam = (p: string | string[] | undefined) =>
        encodeURIComponent(Array.isArray(p) ? p[0] : p || '');

      const fullUrl = `${baseUrl}?company_name=${getParam(company_name)}&visid=${getParam(visid)}&exhid=${getParam(exhid)}`;

      setIframeUrl(fullUrl);
    }
  }, [company_name, visid, exhid]);

  if (!iframeUrl) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-4">Business Matching Request</h1>
      <iframe
        height="600px"
        width="100%"
        frameBorder="0"
        allowTransparency={true}
        scrolling="auto"
        src={iframeUrl}
      />
    </div>
  );
}
