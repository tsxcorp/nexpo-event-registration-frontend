// FormBuilderUI.tsx
import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import FieldCard from './FieldCard';
import PreviewForm from './PreviewForm';
import ComponentSidebar from './ComponentSidebar';

const initialFields: any[] = [];

const FormBuilderUI = ({ eventId }: { eventId: string }) => {
  const [fields, setFields] = useState(initialFields);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    setFields(arrayMove(fields, oldIndex, newIndex));
  };

  const handleAddField = (type: string) => {
    const newField = {
      id: Date.now().toString(),
      Label: 'New Field',
      Type_field: type,
      Required: false,
      Help_Text: '',
      Placeholder: '',
      Value: '',
      Group_Member_Field: false,
      Matching_Field: false,
    };
    setFields([...fields, newField]);
  };

  const handleFieldChange = (id: string, updatedField: any) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updatedField } : f)));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT - Sidebar Field List */}
      <aside className="w-72 bg-white border-r p-4 overflow-y-auto">
        <ComponentSidebar />
      </aside>

      {/* CENTER - Canvas Builder */}
      <main
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const type = e.dataTransfer.getData('field-type');
          if (type) handleAddField(type);
        }}
        className="flex-1 p-6 bg-white overflow-y-auto border-l-4 border-blue-200 border-dashed"
      >
        <h3 className="text-lg font-semibold text-nexpoBlue mb-4">📄 Build Your Form</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onChange={handleFieldChange}
                onRemove={handleRemoveField}
              />
            ))}
          </SortableContext>
        </DndContext>
      </main>

      {/* RIGHT - Preview Panel */}
      <aside className="w-96 bg-gray-50 border-l p-4 overflow-y-auto hidden lg:block">
        <h4 className="text-base font-semibold text-gray-700 mb-2">👁️ Live Preview</h4>
        <PreviewForm coreFields={[{
          id: 'Salutation', Label: 'Salutation', Type_field: 'Select', Required: true, Value: 'Mr.\nMs.\nMrs.'},
          {id: 'Full_Name', Label: 'Full Name', Type_field: 'Text', Required: true },
          { id: 'Email', Label: 'Email', Type_field: 'Email', Required: true },
          { id: 'Mobile_Number', Label: 'Mobile Number', Type_field: 'Text', Required: true }
        ]} dynamicFields={fields} />
      </aside>
    </div>
  );
};

export default FormBuilderUI;
