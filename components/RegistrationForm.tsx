// ✅ RegistrationForm.tsx đã cập nhật để truyền fields group_members vào SubFormFields

import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useState, Fragment } from 'react';
import { FormField } from '../lib/api';
import CoreFormFields from './CoreFormFields';
import DynamicFormFields from './DynamicFormFields';
import SubFormFields from './SubFormFields';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const emptyMember = { title: '', full_name: '', email: '', mobile_number: '' };

type Props = {
  fields: FormField[];
};

export default function RegistrationForm({ fields }: Props) {
  const router = useRouter();
  const eventId = router.query.Event_Info as string;
  const [loading, setLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  const methods = useForm({
    defaultValues: {
      title: '',
      full_name: '',
      email: '',
      mobile_number: '',
      group_members: [],
      ...Object.fromEntries(fields.map(field => [field.label, field.default || '']))
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    setValue,
    trigger
  } = methods;

  const { fields: groupMembers, append, remove, update } = useFieldArray({
    control,
    name: 'group_members'
  });

  const coreKeys = ['title', 'full_name', 'email', 'mobile_number'];
  const groupCustomFields = fields.filter(f => f.groupmember);

  const onSubmit = async (data: any) => {
    const coreData: Record<string, any> = {};
    const customData: Record<string, any> = {};

    for (const key in data) {
      if (key === 'group_members') continue;
      const value = data[key];
      if (value instanceof FileList) continue;
      if (coreKeys.includes(key)) {
        coreData[key] = value;
      } else {
        customData[key] = value;
      }
    }

    const payload = {
      ...coreData,
      group_members: data.group_members,
      custom_fields_value: customData,
      Event_Info: eventId
    };

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok && responseData?.zoho_record_id) {
        router.push({
          pathname: '/thankyou',
          query: {
            data: JSON.stringify({
              ...coreData,
              ...customData,
              zoho_record_id: responseData.zoho_record_id
            })
          }
        });
      } else {
        console.error('❌ Backend error:', responseData.error);
        alert('Submission failed.');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    const currentIndex = groupMembers.length;
    append(emptyMember);
    setEditIndex(currentIndex);
    setIsNew(true);
  };

  const handleCloseDialog = () => {
    if (isNew && editIndex !== null) {
      remove(editIndex);
    }
    setIsNew(false);
    setEditIndex(null);
  };

  const handleConfirmDialog = async () => {
    if (editIndex !== null) {
      const isValid = await trigger(
  [
    `group_members.${editIndex}.title`,
    `group_members.${editIndex}.full_name`,
    `group_members.${editIndex}.email`,
    `group_members.${editIndex}.mobile_number`,
    ...groupCustomFields.map(f => `group_members.${editIndex}.${f.label}`)
  ] as any
);
      if (!isValid) return;

      const latest = getValues(`group_members.${editIndex}`);
      update(editIndex, latest);
    }
    setIsNew(false);
    setEditIndex(null);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <CoreFormFields register={register} errors={errors} />
        <DynamicFormFields fields={fields} />

        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold mb-2">Thành viên trong nhóm</h3>

          <div className="space-y-2">
            {groupMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex justify-between items-center bg-gray-50 border border-gray-300 rounded px-4 py-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => setEditIndex(index)}
              >
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{member.full_name || 'Chưa đặt tên'}</div>
                  <div className="text-xs text-gray-500">
                    {member.email || member.mobile_number || 'Chưa có liên hệ'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    remove(index);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddMember}
            className="mt-3 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded"
          >
            + Thêm thành viên
          </button>
        </div>

        <Transition appear show={editIndex !== null} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={handleCloseDialog}>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
<DialogPanel className="w-full max-w-md max-h-[90vh] overflow-y-auto transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {editIndex !== null && (
                  <SubFormFields
                    namePrefix={`group_members.${editIndex}`}
                    register={register}
                    errors={errors}
                    fields={groupCustomFields}
                  />
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDialog}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Nhập
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        </Transition>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </FormProvider>
  );
}