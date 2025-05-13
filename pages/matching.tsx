import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MatchingRequestPage() {
  const router = useRouter();
  const { company_name, visid } = router.query;

  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (company_name && visid) {
      const baseUrl = 'https://creatorapp.zohopublic.com/tsxcorp/nxp/page-embed/Business_Matching_Request/PzADH5Jf0ZPuzTGyeWXp8XjbuH3S0uCY9DdzXFCTTm74qXfXuJJBDaGEjGNEbSHPxZNj86rAmDWCaCmj26ODjrGSeFPySxzjdM1q';
      const fullUrl = `${baseUrl}?company_name=${encodeURIComponent(Array.isArray(company_name) ? company_name[0] : company_name)}&visid=${encodeURIComponent(Array.isArray(visid) ? visid[0] : visid)}`;

      setIframeUrl(fullUrl);
    }
  }, [company_name, visid]);

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
