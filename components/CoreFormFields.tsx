import { UseFormRegister, FieldErrors } from 'react-hook-form';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  t?: Record<string, string>; // For future i18n (optional)
};

export default function CoreFormFields({ register, errors, t = {} }: Props) {
  return (
    <>
      {/* Title */}
      <div>
        <label className="block font-medium mb-1">
          {t.title || "Title"}
        </label>
        <div className="relative">
          <select
            {...register("title", { required: true })}
            className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">-- Select --</option>
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
            <option value="Mrs.">Mrs.</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
            ▼
          </div>
        </div>
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.title?.message === "string"
              ? errors.title.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-medium mb-1">
          {t.full_name || "Full Name"}
        </label>
        <input
          type="text"
          {...register("full_name", { required: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.full_name && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.full_name?.message === "string"
              ? errors.full_name.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block font-medium mb-1">
          {t.email || "Email"}
        </label>
        <input
          type="email"
          {...register("email", {
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email format.",
            },
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.email?.message === "string"
              ? errors.email.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block font-medium mb-1">
          {t.mobile_number || "Mobile Number"}
        </label>
        <input
          type="tel"
          {...register("mobile_number", {
            required: true,
            pattern: {
              value: /^0\d{9}$/,
              message: "Invalid phone number.",
            },
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.mobile_number && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.mobile_number?.message === "string"
              ? errors.mobile_number.message
              : "This field is required."}
          </p>
        )}
      </div>
    </>
  );
}
