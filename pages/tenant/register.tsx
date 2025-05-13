import { useForm } from "react-hook-form";
import { useState } from "react";

export default function TenantRegisterPage() {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"Lite" | "Growth" | null>(null);

  const openForm = (plan: "Lite" | "Growth") => {
    setSelectedPlan(plan);
    setValue('plan', plan);
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/tenant-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Registration failed');

      alert('Registration successful!');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Registration failed.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen relative text-[15px]">
      {/* Hero Section */}
      <section className="relative bg-blue-900 text-white py-20 text-center overflow-hidden">
        <img
          src="https://creatorexport.zoho.com/file/tsxcorp/nxp/All_Events/4433256000008960019/Banner/image-download/K2rrw116m27bAZTTmVrpvJFu4SkSYKpAsAWu98DK7vdS2D7PSMpxHURyWHT8DHbbRFhffwug7U0jN0PEWEMS727TgJqyQJkxSHWj?filepath=/1743737978018_banner-nexpo.jpg"
          alt="Nexpo Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-4">NEXPO – Create & Manage Events in 5 Minutes</h1>
          <p className="text-lg text-gray-300">Build landing pages, registrations, QR check-in, scan leads – no IT needed.</p>
        </div>
      </section>

      {/* Benefit Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-8">✨ Why Choose Nexpo?</h2>
        <ul className="grid gap-4 text-lg text-gray-700 max-w-3xl mx-auto list-disc list-inside text-left">
          <li>⚡ Create events in just 5 minutes</li>
          <li>📲 QR Code check-in & real-time lead scanning</li>
          <li>📈 Export lead reports immediately after events</li>
          <li>🔄 Automate post-event marketing workflows</li>
        </ul>
      </section>

      {/* Pricing Plans */}
      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-white rounded-lg p-8 text-center shadow-md hover:shadow-lg transition">
          <h3 className="text-2xl font-bold mb-2">Lite</h3>
          <p className="text-xl text-blue-600 mb-4 font-semibold">299.000đ / month</p>
          <ul className="text-gray-600 mb-6">
            <li>• 1 active event</li>
            <li>• 1 admin user</li>
            <li>• QR check-in & lead export</li>
          </ul>
          <button onClick={() => openForm("Lite")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
            Try Now
          </button>
        </div>

        <div className="bg-white rounded-lg p-8 text-center shadow-md hover:shadow-lg transition">
          <h3 className="text-2xl font-bold mb-2">Growth</h3>
          <p className="text-xl text-blue-600 mb-4 font-semibold">990.000đ / month</p>
          <ul className="text-gray-600 mb-6">
            <li>• 3 concurrent events</li>
            <li>• Custom branded portal</li>
            <li>• Priority support & feature suggestions</li>
          </ul>
          <button onClick={() => openForm("Growth")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
            Upgrade Now
          </button>
        </div>
      </section>

      {/* Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto text-sm relative">
            <button onClick={() => setShowForm(false)} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">Register Your Company</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
              {/* Contact Name */}
              <div>
                <label className="block text-gray-700 mb-1">Contact Name</label>
                <input {...register('contact_name', { required: true })} className="input-field" />
                {errors.contact_name && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-1">Email Address</label>
                <input {...register('email', { required: true })} type="email" className="input-field" />
                {errors.email && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 mb-1">Phone</label>
                <input {...register('mobile', { required: true })} className="input-field" />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              {/* Position */}
              <div>
                <label className="block text-gray-700 mb-1">Position</label>
                <input {...register('position')} className="input-field" />
              </div>

              {/* Company */}
              <div>
                <label className="block text-gray-700 mb-1">Company</label>
                <input {...register('company')} className="input-field" />
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 mb-1">Address</label>
                <textarea {...register('address')} className="input-field h-24" />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-gray-700 mb-1">Selected Plan</label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="Lite" {...register('plan', { required: true })} checked={selectedPlan === 'Lite'} readOnly />
                    Lite
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="Growth" {...register('plan', { required: true })} checked={selectedPlan === 'Growth'} readOnly />
                    Growth
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Create My Nexpo Account'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
