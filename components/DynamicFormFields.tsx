import { useState } from 'react';
import { FormField } from '../lib/api';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

type Props = {
  fields: FormField[];
  register: UseFormRegister<any>;
  errors: FieldErrors;
};

export default function DynamicFormFields({ fields, register, errors }: Props) {
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

  const renderField = (field: FormField, index: number) => {
    const key = `${field.label}-${index}`;
    const fieldType = field.type.toLowerCase();
    const isRequired = field.required || false; // ✅ lấy đúng biến từ Zoho

    const baseClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'tel' : 'text'}
            {...register(field.label, {
              required: isRequired,
              ...(fieldType === "email" && {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format.",
                }
              }),
              ...(fieldType === "number" && {
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Only numeric values are allowed.",
                }
              }),
            })}
            className={baseClass}
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={4}
            {...register(field.label, { required: isRequired })}
            className={baseClass}
          />
        );

      case 'select':
        const options = field.default?.split(',') || [];
        return (
          <div className="relative">
            <select
              {...register(field.label, { 
                required: field.required || false,
                validate: (val) => val !== "" || "This field is required",
            })}
              className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option disabled value="">-- Select --</option>
              {options.map((opt, i) => (
                <option key={i} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        );

        case 'file':
            case 'image':
              return (
                <>
                  <input
                    key={key}
                    type="file"
                    accept={fieldType === 'image' ? "image/*" : undefined}
                    {...register(field.label, {
                      required: isRequired,
                      validate: {
                        sizeLimit: (value: FileList) => {
                          if (!value || value.length === 0) return true;
                          const file = value[0];
                          const maxSize = fieldType === 'image' ? 5 * 1024 * 1024 : 30 * 1024 * 1024;
                          return file.size <= maxSize || `❌ File size exceeds limit (${fieldType === 'image' ? '5MB' : '30MB'})`;
                        }
                      },
                      onChange: (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImagePreviews((prev) => ({
                              ...prev,
                              [field.label]: reader.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      },
                    })}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
            
                  {imagePreviews[field.label] && (
                    <img
                      src={imagePreviews[field.label]}
                      alt="Preview"
                      className="mt-2 rounded-lg max-h-[200px] object-contain border"
                    />
                  )}
            
                  {errors[field.label] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[field.label]?.message || "This field is required."}
                    </p>
                  )}
                </>
              );
            

      default:
        return (
          <input
            type="text"
            {...register(field.label, { required: isRequired })}
            className={baseClass}
          />
        );
    }
  };

  return (
    <>
      {fields.map((field, idx) => (
        <div key={idx}>
          <label className="block font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field, idx)}
          {errors[field.label] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[field.label]?.message || "This field is required."}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
