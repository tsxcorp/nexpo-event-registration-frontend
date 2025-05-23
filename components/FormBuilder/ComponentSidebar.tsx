// components/FormBuilder/ComponentSidebar.tsx
import React from 'react';

const fieldTypes = [
  { type: 'Text', label: 'Text Field', icon: '🅰️', group: 'Basic' },
  { type: 'Email', label: 'Email', icon: '✉️', group: 'Basic' },
  { type: 'Number', label: 'Number', icon: '🔢', group: 'Basic' },
  { type: 'Textarea', label: 'Text Area', icon: '📝', group: 'Basic' },
  { type: 'Select', label: 'Dropdown', icon: '⬇️', group: 'Basic' },
  { type: 'Multi Select', label: 'Multi Select', icon: '✅', group: 'Basic' },
  { type: 'File', label: 'File Upload', icon: '📎', group: 'Advanced' },
  { type: 'Image', label: 'Image Upload', icon: '🖼️', group: 'Advanced' },
];

const ComponentSidebar = () => {
  const grouped = fieldTypes.reduce((acc: any, item) => {
    acc[item.group] = acc[item.group] || [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">{group} Components</h3>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('field-type', item.type)}
                className="cursor-move bg-gray-100 hover:bg-blue-100 text-sm px-2 py-2 rounded flex items-center gap-2 shadow-sm border border-gray-200"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComponentSidebar;
