import { UseFormRegister, FieldErrors } from 'react-hook-form';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  t?: Record<string, string>; // For future i18n (optional)
};

export default function CoreFormFields({ register, errors, t = {} }: Props) {
  const baseInputClass = "w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 sm:border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium text-sm sm:text-base";
  
  return (
    <>
      {/* Salutation */}
      <div>
        <label className="block font-bold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">
          {t.Salutation || "Xưng hô"}
          <span className="text-red-500 ml-1 text-base sm:text-lg">*</span>
        </label>
        <div className="relative">
          <select
            {...register("Salutation", { required: "Vui lòng chọn xưng hô." })}
            className={`appearance-none ${baseInputClass} pr-10 sm:pr-12 ${errors.Salutation ? 'border-red-500 focus:ring-red-500' : ''}`}
          >
            <option value="" className="text-gray-500">-- Chọn xưng hô --</option>
            <option value="Mr." className="text-gray-900">Ông</option>
            <option value="Ms." className="text-gray-900">Cô</option>
            <option value="Mrs." className="text-gray-900">Bà</option>
          </select>
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        {errors.Salutation && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Salutation?.message === "string"
              ? errors.Salutation.message
              : "Vui lòng chọn xưng hô."}
          </p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block font-bold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">
          {t.Full_Name || "Họ và tên"}
          <span className="text-red-500 ml-1 text-base sm:text-lg">*</span>
        </label>
        <input
          type="text"
          placeholder="Nhập họ và tên đầy đủ"
          {...register("Full_Name", { required: "Vui lòng nhập họ và tên." })}
          className={`${baseInputClass} ${errors.Full_Name ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Full_Name && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Full_Name?.message === "string"
              ? errors.Full_Name.message
              : "Vui lòng nhập họ và tên."}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block font-bold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">
          {t.Email || "Email"}
          <span className="text-red-500 ml-1 text-base sm:text-lg">*</span>
        </label>
        <input
          type="email"
          placeholder="example@email.com"
          {...register("Email", { 
            required: "Vui lòng nhập email.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Định dạng email không hợp lệ."
            }
          })}
          className={`${baseInputClass} ${errors.Email ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Email && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Email?.message === "string"
              ? errors.Email.message
              : "Vui lòng nhập email hợp lệ."}
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block font-bold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">
          {t.Phone_Number || "Số điện thoại"}
          <span className="text-red-500 ml-1 text-base sm:text-lg">*</span>
        </label>
        <input
          type="tel"
          placeholder="0912345678"
          {...register("Phone_Number", { 
            required: "Vui lòng nhập số điện thoại.",
            pattern: {
              value: /^[0-9+\-\s\(\)]{10,15}$/,
              message: "Số điện thoại không hợp lệ."
            }
          })}
          className={`${baseInputClass} ${errors.Phone_Number ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Phone_Number && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Phone_Number?.message === "string"
              ? errors.Phone_Number.message
              : "Vui lòng nhập số điện thoại hợp lệ."}
          </p>
        )}
      </div>
    </>
  );
}
