import { useState, useMemo } from 'react';
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

  // Get all Multi Select field names upfront
  const multiSelectFieldNames = useMemo(() => {
    return fields
      .filter(field => field.type === 'Multi Select')
      .map(field => prefix ? `${prefix}.${field.label}` : field.label);
  }, [fields, prefix]);

  // Watch all Multi Select fields at once to avoid hooks violation
  const watchedMultiSelectValues = useWatch({
    control,
    name: multiSelectFieldNames,
    defaultValue: multiSelectFieldNames.map(() => [])
  });

  // Create a map for easy lookup
  const multiSelectValuesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    multiSelectFieldNames.forEach((fieldName, index) => {
      map[fieldName] = watchedMultiSelectValues[index] || [];
    });
    return map;
  }, [multiSelectFieldNames, watchedMultiSelectValues]);

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
      'w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium';

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
              placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
              {...register(fieldName, {
                required: isRequired,
                ...(fieldType === 'Email' && {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Định dạng email không hợp lệ.',
                  },
                }),
                ...(fieldType === 'Number' && {
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Chỉ được nhập số.',
                  },
                }),
              })}
              className={`${baseClass} ${fieldError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                {getErrorMessage(fieldError)}
              </p>
            )}
          </>
        );

      case 'Textarea':
        return (
          <>
            <textarea
              rows={4}
              placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
              {...register(fieldName, { required: isRequired })}
              className={`${baseClass} resize-vertical ${fieldError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                {getErrorMessage(fieldError)}
              </p>
            )}
          </>
        );

      case 'Select': {
        const selectOptions: string[] = Array.isArray(field.values)
          ? field.values
          : typeof field.values === 'string'
          ? (field.values as string).split(',').map((s: string) => s.trim())
          : [];

        return (
          <>
            <div className="relative">
              <select
                {...register(fieldName, {
                  required: isRequired,
                  validate: val => !isRequired || val !== '' || 'Vui lòng chọn một tùy chọn.',
                })}
                defaultValue=""
                className={`appearance-none w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 ${fieldError ? 'border-red-500 focus:ring-red-500' : ''}`}
              >
                <option disabled value="" className="text-gray-500">
                  -- Chọn {field.label.toLowerCase()} --
                </option>
                {selectOptions.map((opt, i) => (
                  <option key={i} value={opt} className="text-gray-900">
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            {fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                {getErrorMessage(fieldError)}
              </p>
            )}
          </>
        );
      }

      case 'Multi Select': {
        const options = field.values || field.options || [];
        const selected = multiSelectValuesMap[fieldName] || [];

        return (
          <>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {options.map((opt, index) => (
                  <label
                    key={index}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={opt}
                      {...register(fieldName, {
                        required: isRequired,
                        validate: (value) => {
                          if (isRequired && (!value || value.length === 0)) {
                            return 'Vui lòng chọn ít nhất một tùy chọn.';
                          }
                          return true;
                        }
                      })}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-400 rounded transition-all"
                    />
                    <span className="text-gray-800 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            {isRequired && (!selected || selected.length === 0) && fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                Vui lòng chọn ít nhất một tùy chọn.
              </p>
            )}
          </>
        );
      }

      case 'Agreement': {
        // Handle both camelCase and snake_case field names
        const checkboxLabel = field.checkbox_label || field.checkboxLabel || 'Tôi đồng ý';
        const linkText = field.link_text || field.linkText;
        const linkUrl = field.link_url || field.linkUrl;
        
        // Fallback content if no content is provided
        const title = field.title || field.label || 'Agreement';
        const content = field.content || 'Vui lòng đọc và đồng ý với các điều khoản.';
        
        // Extract URL from link_url if it contains HTML
        const extractUrl = (urlString: string | undefined) => {
          if (!urlString) return '';
          // If it's a simple URL, return as is
          if (urlString.startsWith('http')) return urlString;
          // If it contains HTML, extract href
          const match = urlString.match(/href\s*=\s*["']([^"']+)["']/);
          return match ? match[1] : urlString;
        };
        
        const cleanUrl = extractUrl(linkUrl);
        
        return (
          <>
            <div className={`bg-gradient-to-br from-blue-50 to-gray-50 border-2 rounded-xl p-6 shadow-sm ${fieldError ? 'border-red-500 bg-red-50' : 'border-blue-200'}`}>
              {/* Title */}
              {title && (
                <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  {title}
                </h4>
              )}
              
              {/* Content */}
              {content && (
                <div className="mb-6">
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}
              
              {/* Link */}
              {linkText && cleanUrl && (
                <div className="mb-6">
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    <span className="mr-1">🔗</span>
                    {linkText}
                  </a>
                </div>
              )}
              
              {/* Checkbox */}
              <div className={`bg-white border-2 rounded-lg p-4 ${fieldError ? 'border-red-300' : 'border-gray-300'}`}>
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register(fieldName, { 
                      required: isRequired,
                      validate: (value) => {
                        if (isRequired && !value) {
                          return 'Bạn phải đồng ý để tiếp tục';
                        }
                        return true;
                      }
                    })}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-400 rounded transition-all"
                  />
                  <span className="text-gray-800 font-medium leading-relaxed">{checkboxLabel}</span>
                </label>
              </div>
              
              {/* Error message */}
              {fieldError && (
                <p className="text-red-600 text-sm mt-3 font-medium flex items-center bg-red-100 p-3 rounded-lg">
                  <span className="mr-2">⚠️</span>
                  {getErrorMessage(fieldError)}
                </p>
              )}
            </div>
          </>
        );
      }

      case 'File':
      case 'Image':
        return (
          <>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                key={key}
                type="file"
                accept={fieldType === 'Image' ? 'image/*' : undefined}
                {...register(fieldName, {
                  required: isRequired,
                  validate: {
                    sizeLimit: (value: FileList) => {
                      if (!value || value.length === 0)
                        return !isRequired || 'Vui lòng chọn file.';
                      const file = value[0];
                      const maxSize =
                        fieldType === 'Image' ? 5 * 1024 * 1024 : 30 * 1024 * 1024;
                      return (
                        file.size <= maxSize ||
                        `❌ File quá lớn (tối đa ${fieldType === 'Image' ? '5MB' : '30MB'})`
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
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 file:cursor-pointer transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                {fieldType === 'Image' ? 'Tối đa 5MB, định dạng: JPG, PNG, GIF' : 'Tối đa 30MB'}
              </p>
            </div>
            {imagePreviews[fieldName] && (
              <div className="mt-4 border-2 border-gray-200 rounded-lg p-2">
                <img
                  src={imagePreviews[fieldName]}
                  alt="Preview"
                  className="rounded-lg max-h-[200px] w-full object-contain"
                />
              </div>
            )}
            {fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                {getErrorMessage(fieldError)}
              </p>
            )}
          </>
        );

      default:
        return (
          <>
            <input
              type="text"
              placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
              {...register(fieldName, { required: isRequired })}
              className={`${baseClass} ${fieldError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldError && (
              <p className="text-red-600 text-sm mt-2 font-medium flex items-center">
                <span className="mr-1">⚠️</span>
                {getErrorMessage(fieldError)}
              </p>
            )}
          </>
        );
    }
  };

  return (
    <>
      {fields.map((field, idx) => (
        <div key={idx} className="mb-6">
          {field.type !== 'Agreement' && (
            <label className="block font-bold mb-3 text-gray-800 text-base">
              {field.label}
              {field.required && <span className="text-red-500 ml-1 text-lg">*</span>}
            </label>
          )}
          {field.type === 'Agreement' && (
            <div className="mb-2">
              <span className="text-gray-800 font-bold text-base">
                {field.label}
                {field.required && <span className="text-red-500 ml-1 text-lg">*</span>}
              </span>
            </div>
          )}
          {renderField(field, idx)}
          {field.helptext && field.type !== 'Agreement' && (
            <p className="text-sm text-gray-600 mt-2 italic">{field.helptext}</p>
          )}
        </div>
      ))}
    </>
  );
}