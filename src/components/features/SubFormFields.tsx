import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormField } from '@/lib/api/events';
import DynamicFormFields from './DynamicFormFields';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  namePrefix: string;
  fields?: FormField[];
};

export default function SubFormFields({ register, errors, namePrefix, fields = [] }: Props) {
  const getError = (field: string) =>
    errors?.[namePrefix] && typeof errors[namePrefix] === 'object'
      ? (errors[namePrefix] as Record<string, any>)[field]
      : undefined;

  return (
    <>
      <div>
        <label className="block font-medium mb-1">
          Salutation <span className="text-red-500">*</span>
        </label>
        <select
          {...register(`${namePrefix}.Salutation`, { required: true })}
          className="w-full px-4 py-2 border rounded"
        >
          <option value="">-- Select --</option>
          <option value="Mr.">Mr.</option>
          <option value="Ms.">Ms.</option>
          <option value="Mrs.">Mrs.</option>
        </select>
        {getError('Salutation') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register(`${namePrefix}.Full_Name`, { required: true })}
          className="w-full px-4 py-2 border rounded"
        />
        {getError('Full_Name') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          {...register(`${namePrefix}.Email`, {
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format.',
            },
          })}
          className="w-full px-4 py-2 border rounded"
        />
        {getError('Email') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          {...register(`${namePrefix}.Phone_Number`, {
            required: true,
            pattern: {
              value: /^0\d{9}$/,
              message: 'Invalid phone number.',
            },
          })}
          className="w-full px-4 py-2 border rounded"
        />
        {getError('Phone_Number') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      {fields.length > 0 && (
        <div className="mt-6">
          <DynamicFormFields fields={fields} prefix={namePrefix} />
        </div>
      )}
    </>
  );
}
