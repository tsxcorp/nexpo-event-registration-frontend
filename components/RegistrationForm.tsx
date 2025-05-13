
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FormField } from '../lib/api';
import CoreFormFields from './CoreFormFields';
import DynamicFormFields from './DynamicFormFields';

type Props = {
  fields: FormField[];
};

export default function RegistrationForm({ fields }: Props) {
  const router = useRouter();
  const eventId = router.query.Event_Info as string;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      full_name: '',
      email: '',
      mobile_number: '',
      ...Object.fromEntries(fields.map(field => [field.label, field.default || ""]))
    }
  });

  const coreKeys = ['title', 'full_name', 'email', 'mobile_number'];

  const onSubmit = async (data: any) => {
    const coreData: Record<string, any> = {};
    const customData: Record<string, any> = {};

    for (const key in data) {
      const value = data[key];
      if (value instanceof FileList) continue;
      if (coreKeys.includes(key)) {
        coreData[key] = value;
      } else {
        customData[key] = value;
      }
    }

    const payload = {
      ...coreData,
      custom_fields_value: customData,
      Event_Info: eventId,
    };

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData?.zoho_record_id) {
        router.push({
          pathname: '/thankyou',
          query: {
            data: JSON.stringify({
              ...coreData,
              ...customData,
              zoho_record_id: responseData.zoho_record_id
            })
          }
        });
      } else {
        console.error("❌ Backend error:", responseData.error);
        alert("Submission failed.");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CoreFormFields register={register} errors={errors} />
      <DynamicFormFields fields={fields} register={register} errors={errors} />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
