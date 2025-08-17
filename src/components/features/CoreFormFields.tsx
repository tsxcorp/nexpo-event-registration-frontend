import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { i18n } from '@/lib/translation/i18n';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  currentLanguage?: string;
};

export default function CoreFormFields({ register, errors, currentLanguage = 'vi' }: Props) {
  const baseInputClass = "w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 sm:border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium text-sm sm:text-base";
  
  // Get translations for current language
  const t = i18n[currentLanguage] || i18n['vi'] || {};
  
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
            {...register("Salutation", { required: t.salutation_required || i18n[currentLanguage]?.please_select_salutation || "Vui lòng chọn xưng hô." })}
            className={`appearance-none ${baseInputClass} pr-10 sm:pr-12 ${errors.Salutation ? 'border-red-500 focus:ring-red-500' : ''}`}
          >
            <option value="" className="text-gray-500">{t.salutation_placeholder || "-- Chọn xưng hô --"}</option>
            <option value="Mr." className="text-gray-900">{t.mr || "Ông"}</option>
            <option value="Ms." className="text-gray-900">{t.ms || "Cô"}</option>
            <option value="Mrs." className="text-gray-900">{t.mrs || "Bà"}</option>
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
              : (t.salutation_required || i18n[currentLanguage]?.please_select_salutation || "Vui lòng chọn xưng hô.")}
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
          placeholder={t.full_name_placeholder || "Nhập họ và tên đầy đủ"}
          {...register("Full_Name", { required: t.full_name_required || i18n[currentLanguage]?.please_enter_full_name || "Vui lòng nhập họ và tên." })}
          className={`${baseInputClass} ${errors.Full_Name ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Full_Name && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Full_Name?.message === "string"
              ? errors.Full_Name.message
              : (t.full_name_required || i18n[currentLanguage]?.please_enter_full_name || "Vui lòng nhập họ và tên.")}
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
          placeholder={t.email_placeholder || "example@email.com"}
          {...register("Email", { 
            required: t.email_required || i18n[currentLanguage]?.please_enter_email || "Vui lòng nhập email.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t.email_invalid || "Định dạng email không hợp lệ."
            }
          })}
          className={`${baseInputClass} ${errors.Email ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Email && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Email?.message === "string"
              ? errors.Email.message
              : (t.email_required || i18n[currentLanguage]?.please_enter_valid_email || "Vui lòng nhập email hợp lệ.")}
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
          placeholder={t.phone_placeholder || "0912345678"}
          {...register("Phone_Number", { 
            required: t.phone_required || i18n[currentLanguage]?.please_enter_phone_number || "Vui lòng nhập số điện thoại.",
            pattern: {
              value: /^[0-9+\-\s\(\)]{10,15}$/,
              message: t.phone_invalid || "Số điện thoại không hợp lệ."
            }
          })}
          className={`${baseInputClass} ${errors.Phone_Number ? 'border-red-500 focus:ring-red-500' : ''}`}
        />
        {errors.Phone_Number && (
          <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center">
            <span className="mr-1">⚠️</span>
            {typeof errors.Phone_Number?.message === "string"
              ? errors.Phone_Number.message
              : (t.phone_required || i18n[currentLanguage]?.please_enter_valid_phone_number || "Vui lòng nhập số điện thoại hợp lệ.")}
          </p>
        )}
      </div>
    </>
  );
}
