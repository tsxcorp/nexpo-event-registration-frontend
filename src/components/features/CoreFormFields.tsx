import { UseFormRegister, FieldErrors } from 'react-hook-form';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  t?: Record<string, string>; // For future i18n (optional)
};

export default function CoreFormFields({ register, errors, t = {} }: Props) {
  return (
    <>
      {/* Salutation */}
      <div>
        <label className="block font-medium mb-1">
          {t.Salutation || "Salutation"}
        </label>
        <div className="relative">
          <select
            {...register("Salutation", { required: true })}
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
        {errors.Salutation && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.Salutation?.message === "string"
              ? errors.Salutation.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-medium mb-1">
          {t.Full_Name || "Full Name"}
        </label>
        <input
          type="text"
          {...register("Full_Name", { required: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.Full_Name && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.Full_Name?.message === "string"
              ? errors.Full_Name.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block font-medium mb-1">
          {t.Email || "Email"}
        </label>
        <input
          type="email"
          {...register("Email", {
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email format.",
            },
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.Email && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.Email?.message === "string"
              ? errors.Email.message
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block font-medium mb-1">
          {t.Phone_Number || "Phone Number"}
        </label>
        <input
          type="tel"
          {...register("Phone_Number", {
            required: true,
            pattern: {
              value: /^0\d{9}$/,
              message: "Invalid phone number.",
            },
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
        {errors.Phone_Number && (
          <p className="text-red-500 text-sm mt-1">
            {typeof errors.Phone_Number?.message === "string"
              ? errors.Phone_Number.message
              : "This field is required."}
          </p>
        )}
      </div>
    </>
  );
}
