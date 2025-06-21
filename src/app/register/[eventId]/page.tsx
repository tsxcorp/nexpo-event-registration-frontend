'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EventData, eventApi } from '@/lib/api/events';
import RegistrationLayout from '@/components/layouts/RegistrationLayout';
import RegistrationForm from '@/components/features/RegistrationForm';

export default function RegisterPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    eventApi.getEventInfo(eventId)
      .then(res => setEventData(res.event))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <p className="text-center mt-16 text-gray-500">Đang tải dữ liệu sự kiện...</p>;
  if (!eventData) return <p className="text-center mt-16 text-red-500">Không tìm thấy sự kiện.</p>;

  return (
    <RegistrationLayout eventData={eventData}>
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">{eventData.name}</h2>
        <div
          className="prose prose-lg md:prose-xl mx-auto text-justify"
          dangerouslySetInnerHTML={{ __html: eventData.description }}
        />
      </section>

      <section className="bg-white py-8 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 border border-gray-200">
          <h3 className="text-2xl md:text-3xl font-semibold text-center text-gray-800">Đăng ký tham dự</h3>
          <RegistrationForm fields={eventData.formFields} eventId={eventId} />
        </div>
      </section>
    </RegistrationLayout>
  );
} 