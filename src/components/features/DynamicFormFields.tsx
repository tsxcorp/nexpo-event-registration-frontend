import { useState } from 'react';
import { FormField } from '@/lib/api/events';
import { useFormContext, useWatch } from 'react-hook-form';

type Props = {
  fields: FormField[];
  prefix?: string;
};

export default function DynamicFormFields({ fields, prefix }: Props) {
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext();

  const getFieldName = (label: string) => (prefix ? `${prefix}.${label}` : label);
  const getFieldError = (label: string) => {
    if (prefix && errors?.[prefix] && typeof errors[prefix] === 'object') {
      return (errors[prefix] as Record<string, any>)[label];
    }
    return (errors as Record<string, any>)[label];
  };

  const getErrorMessage = (error: any) =>
    typeof error?.message === 'string' ? error.message : 'This field is required.';

  const renderField = (field: FormField, index: number) => {
    const key = `${field.label}-${index}`;
    const fieldType = field.type;
    const isRequired = field.required;
    const fieldName = getFieldName(field.label);
    const fieldError = getFieldError(field.label);

    const baseClass =
      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

    switch (fieldType) {
      case 'Text':
      case 'Email':
      case 'Number':
        return (
          <>
            <input
              type={
                fieldType === 'Email' ? 'email' :
                fieldType === 'Number' ? 'tel' : 'text'
              }
              {...register(fieldName, {
                required: isRequired,
                ...(fieldType === 'Email' && {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format.',
                  },
                }),
                ...(fieldType === 'Number' && {
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Only numeric values are allowed.',
                  },
                }),
              })}
              className={baseClass}
            />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(fieldError)}</p>
            )}
          </>
        );

      case 'Textarea':
        return (
          <>
            <textarea
              rows={4}
              {...register(fieldName, { required: isRequired })}
              className={baseClass}
            />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(fieldError)}</p>
            )}
          </>
        );

      case 'Select': {
        const selectOptions: string[] = Array.isArray(field.options)
          ? field.options
          : typeof field.options === 'string'
          ? (field.options as string).split(',').map((s: string) => s.trim())
          : [];

        return (
          <>
            <div className="relative">
              <select
                {...register(fieldName, {
                  required: isRequired,
                  validate: val => !isRequired || val !== '' || 'This field is required.',
                })}
                defaultValue=""
                className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option disabled value="">
                  -- Select --
                </option>
                {selectOptions.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(fieldError)}</p>
            )}
          </>
        );
      }

      case 'Multi Select': {
        const multiOptions: string[] = Array.isArray(field.options)
          ? field.options
          : typeof field.options === 'string'
          ? (field.options as string).split(',').map((s: string) => s.trim())
          : [];

        const selected = useWatch({ name: fieldName, control });

        return (
          <>
            <div className="space-y-2">
              {multiOptions.map((opt, i) => (
                <label key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={opt}
                    {...register(fieldName)}
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
            {isRequired && (!selected || selected.length === 0) && (
              <p className="text-red-500 text-sm mt-1">
                At least one option is required.
              </p>
            )}
          </>
        );
      }

      case 'File':
      case 'Image':
        return (
          <>
            <input
              key={key}
              type="file"
              accept={fieldType === 'Image' ? 'image/*' : undefined}
              {...register(fieldName, {
                required: isRequired,
                validate: {
                  sizeLimit: (value: FileList) => {
                    if (!value || value.length === 0)
                      return !isRequired || 'This field is required.';
                    const file = value[0];
                    const maxSize =
                      fieldType === 'Image' ? 5 * 1024 * 1024 : 30 * 1024 * 1024;
                    return (
                      file.size <= maxSize ||
                      `❌ File size exceeds limit (${fieldType === 'Image' ? '5MB' : '30MB'})`
                    );
                  },
                },
                onChange: e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImagePreviews(prev => ({
                        ...prev,
                        [fieldName]: reader.result as string,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                },
              })}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {imagePreviews[fieldName] && (
              <img
                src={imagePreviews[fieldName]}
                alt="Preview"
                className="mt-2 rounded-lg max-h-[200px] object-contain border"
              />
            )}
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(fieldError)}</p>
            )}
          </>
        );

      default:
        return (
          <>
            <input
              type="text"
              {...register(fieldName, { required: isRequired })}
              className={baseClass}
            />
            {fieldError && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(fieldError)}</p>
            )}
          </>
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
          {field.helptext && (
            <p className="text-sm text-gray-500 mb-1 mt-1">{field.helptext}</p>
          )}
        </div>
      ))}
    </>
  );
}