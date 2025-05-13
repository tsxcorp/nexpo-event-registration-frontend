import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchEventInfo, EventData } from '../lib/api';
import RegistrationForm from '../components/RegistrationForm';

export default function RegisterPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const eventId = router.query.Event_Info as string;

  useEffect(() => {
    if (!eventId) return;
    fetchEventInfo(eventId)
      .then(res => setEventData(res.event))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <p className="text-center mt-16 text-gray-500">Đang tải dữ liệu sự kiện...</p>;
  if (!eventData) return <p className="text-center mt-16 text-red-500">Không tìm thấy sự kiện.</p>;

  return (
    <div className="bg-gray-50 font-sans text-gray-800">

      {/* 🔷 HERO SECTION */}
      <section
        className="relative w-full h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${eventData.banner || eventData.header})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="z-10 text-white text-center px-4">
          {eventData.logo && (
            <img src={eventData.logo} alt="Logo" className="h-24 md:h-32 mx-auto mb-6 drop-shadow-xl" />
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">THE NEXT-GENERATION PLATFORM</h1>
          <p className="text-lg md:text-xl font-medium">GIẢI PHÁP TOÀN DIỆN CHO SỰ KIỆN & TRIỂN LÃM</p>
        </div>
      </section>

      {/* 🧾 EVENT INFO */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">{eventData.name}</h2>
        <div
          className="prose prose-lg md:prose-xl mx-auto text-justify"
          dangerouslySetInnerHTML={{ __html: eventData.description }}
        />
      </section>

      {/* 📝 FORM SECTION */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-10 space-y-6 border border-gray-200">
          <h3 className="text-2xl md:text-3xl font-semibold text-center text-gray-800">Đăng ký tham dự</h3>
          <RegistrationForm fields={eventData.formFields} />
        </div>
      </section>

      {/* 🔚 FOOTER */}
      {eventData.footer && (
        <footer className="pt-12 pb-6">
          <img src={eventData.footer} alt="Footer" className="w-full object-cover rounded-t-xl" />
        </footer>
      )}
    </div>
  );
}
