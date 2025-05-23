// components/FormBuilder/PreviewForm.tsx
import React, { useState } from 'react';

const PreviewForm = ({ coreFields, dynamicFields }: any) => {
  const [formState, setFormState] = useState({});

  const renderField = (field: any) => {
    const { id, Label, Type_field, Required, Placeholder, Value } = field;
    const isOptionField = Type_field === 'Select' || Type_field === 'Multi Select';
    const options = Value?.split('\n') || [];

    const handleChange = (e: any) => {
      const value = Type_field === 'Multi Select'
        ? formState[id]?.includes(e.target.value)
          ? formState[id].filter((v: string) => v !== e.target.value)
          : [...(formState[id] || []), e.target.value]
        : e.target.value;
      setFormState({ ...formState, [id]: value });
    };

    return (
      <div key={id} className="mb-4">
        <label className="block font-medium mb-1">
          {Label}
          {Required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {Type_field === 'Text' || Type_field === 'Email' || Type_field === 'Number' ? (
          <input
            type={Type_field === 'Email' ? 'email' : Type_field === 'Number' ? 'number' : 'text'}
            placeholder={Placeholder || Label}
            value={formState[id] || ''}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        ) : Type_field === 'Textarea' ? (
          <textarea
            placeholder={Placeholder || Label}
            value={formState[id] || ''}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />
        ) : Type_field === 'Select' ? (
          <select
            value={formState[id] || ''}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            {options.map((opt: string, idx: number) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        ) : Type_field === 'Multi Select' ? (
          <div className="space-y-1">
            {options.map((opt: string, idx: number) => (
              <label key={idx} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={opt}
                  checked={(formState[id] || []).includes(opt)}
                  onChange={handleChange}
                />
                {opt}
              </label>
            ))}
          </div>
        ) : Type_field === 'File' || Type_field === 'Image' ? (
          <input type="file" onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        ) : (
          <input type="text" className="w-full border px-3 py-2 rounded" />
        )}
      </div>
    );
  };

  return (
    <form className="bg-white border rounded p-4 shadow">
      {coreFields.map(renderField)}
      {dynamicFields.map(renderField)}
    </form>
  );
};

export default PreviewForm;
