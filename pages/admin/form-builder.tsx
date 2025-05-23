import React from 'react';
import { useRouter } from 'next/router';
import FormBuilderUI from '../../components/FormBuilder/FormBuilderUI';

const FormBuilderPage = () => {
  const router = useRouter();
  const { Event_Info } = router.query;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Dynamic Form Builder</h1>
      {!Event_Info ? (
        <p className="text-red-500">⚠️ Bạn cần truyền event_id trên URL. VD: <code>?event_id=123456</code></p>
      ) : (
        <FormBuilderUI eventId={Event_Info as string} />
      )}
    </div>
  );
};

export default FormBuilderPage;
