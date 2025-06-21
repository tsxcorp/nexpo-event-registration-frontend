import { FieldErrors, UseFormRegister } from 'react-hook-form';

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  namePrefix: string;
};

export default function SubFormFields({ register, errors, namePrefix }: Props) {
  const getError = (field: string) =>
    errors?.[namePrefix] && typeof errors[namePrefix] === 'object'
      ? (errors[namePrefix] as Record<string, any>)[field]
      : undefined;

  return (
    <>
      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Salutation <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          {...register(`${namePrefix}.Salutation`, { required: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
        <label className="block font-medium mb-2 text-gray-700">
          Full Name <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          {...register(`${namePrefix}.Full_Name`, { required: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {getError('Full_Name') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Email <span className="text-red-500 ml-1">*</span>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {getError('Email') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Phone Number <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="tel"
          {...register(`${namePrefix}.Phone_Number`, { required: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {getError('Phone_Number') && (
          <p className="text-red-500 text-sm mt-1">This field is required.</p>
        )}
      </div>
    </>
  );
}
