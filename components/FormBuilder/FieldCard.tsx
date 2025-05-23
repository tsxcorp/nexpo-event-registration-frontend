// components/FormBuilder/FieldCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FieldCard = ({ field, onChange, onRemove }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field?.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!field) return null;

  const isOptionField = field.Type_field === 'Select' || field.Type_field === 'Multi Select';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 w-full">
          <div {...attributes} {...listeners} className="cursor-move text-gray-400">☰</div>
          <input
            className="font-semibold text-base w-full border-b border-gray-300 focus:outline-none"
            value={field.Label || ''}
            onChange={(e) => onChange?.(field.id, { Label: e.target.value })}
            placeholder="Field Label"
          />
        </div>
        <button onClick={() => onRemove?.(field.id)} className="text-red-500 text-sm ml-2">🗑</button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block mb-1">Type</label>
          <select
            value={field.Type_field || ''}
            onChange={(e) => onChange?.(field.id, { Type_field: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          >
            {['Text', 'Email', 'Number', 'Textarea', 'Select', 'Multi Select', 'File', 'Image'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            checked={!!field.Required}
            onChange={(e) => onChange?.(field.id, { Required: e.target.checked })}
            className="mr-2"
          />
          <label>Required</label>
        </div>
        <div className="col-span-2">
          <label className="block mb-1">Placeholder</label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={field.Placeholder || ''}
            onChange={(e) => onChange?.(field.id, { Placeholder: e.target.value })}
            placeholder="Placeholder (optional)"
          />
        </div>
        <div className="col-span-2">
          <label className="block mb-1">Help Text</label>
          <input
            className="w-full border px-2 py-1 rounded"
            value={field.Help_Text || ''}
            onChange={(e) => onChange?.(field.id, { Help_Text: e.target.value })}
            placeholder="Help text (optional)"
          />
        </div>
        {isOptionField && (
          <div className="col-span-2">
            <label className="block mb-1">Options (mỗi dòng 1 giá trị)</label>
            <textarea
              className="w-full border px-2 py-1 rounded"
              rows={3}
              value={field.Value || ''}
              onChange={(e) => onChange?.(field.id, { Value: e.target.value })}
              placeholder="Option 1\nOption 2\nOption 3"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldCard;
