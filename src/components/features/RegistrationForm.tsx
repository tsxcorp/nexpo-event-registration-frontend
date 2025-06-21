'use client';

// ✅ RegistrationForm.tsx đã cập nhật để truyền fields group_members vào SubFormFields và xử lý phản hồi đúng từ backend

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { FormField } from '@/lib/api/events';
import CoreFormFields from './CoreFormFields';
import DynamicFormFields from './DynamicFormFields';
import SubFormFields from './SubFormFields';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface FormData {
  Salutation: string;
  Full_Name: string;
  Email: string;
  Phone_Number: string;
  group_members: Array<{
    Salutation: string;
    Full_Name: string;
    Email: string;
    Phone_Number: string;
    [key: string]: string;
  }>;
  [key: string]: any;
}

const emptyMember = { Salutation: '', Full_Name: '', Email: '', Phone_Number: '' };

interface Props {
  fields: FormField[];
  eventId: string;
}

export default function RegistrationForm({ fields, eventId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  // --- Logic for skipping step 1 ---
  const agreementFields = fields.filter(f => f.type === 'Agreement');
  const otherFields = fields.filter(f => f.type !== 'Agreement');
  const groupCustomFields = otherFields.filter(f => f.groupmember);
  const hasAgreementFields = agreementFields.length > 0;
  
  const [currentStep, setCurrentStep] = useState(hasAgreementFields ? 1 : 2);
  // ------------------------------------

  const methods = useForm<FormData>({
    defaultValues: {
      Salutation: '',
      Full_Name: '',
      Email: '',
      Phone_Number: '',
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

  const coreKeys = ['Salutation', 'Full_Name', 'Email', 'Phone_Number'];

  const onSubmit = async (data: FormData) => {
    const coreData: Record<string, any> = {};
    const customData: Record<string, any> = {};

    // 1. Separate core fields and custom fields
    for (const key in data) {
      const value = data[key];
      if (key === 'group_members' || key === 'event_info' || value instanceof FileList) continue;
      
      if (coreKeys.includes(key)) {
        coreData[key] = value;
      } else {
        customData[key] = value;
      }
    }

    // 2. Process customData to match backend expectations
    fields.forEach(field => {
      const fieldLabel = field.label;
      const currentValue = customData[fieldLabel];

      if (currentValue === undefined || currentValue === null) {
        return;
      }

      if (field.type === 'Agreement') {
        // For Agreement fields, convert boolean `true` to string "true"
        if (currentValue === true) {
          customData[fieldLabel] = "true";
        } else {
          // If not checked, remove it from payload
          delete customData[fieldLabel];
        }
      } else if (field.type === 'Multi Select') {
        // For Multi Select, join array into a comma-separated string
        if (Array.isArray(currentValue) && currentValue.length > 0) {
          customData[fieldLabel] = currentValue.join(',');
        } else {
          // If empty or not an array, remove it
          delete customData[fieldLabel];
        }
      }
    });

    const payload = {
      ...coreData,
      group_members: data.group_members,
      Custom_Fields_Value: customData,
      Event_Info: eventId
    };
    
    // 3. Log the final payload for debugging
    console.log('Final Payload to be sent:', JSON.stringify(payload, null, 2));

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      const result = responseData.success === false ? responseData.zohoResponse : responseData;
      const zohoRecordId = result.zoho_record_id;

      if (response.ok && zohoRecordId) {
        const registrationData = {
          Salutation: coreData.Salutation,
          Full_Name: coreData.Full_Name,
          Email: coreData.Email,
          Phone_Number: coreData.Phone_Number,
          ...customData,
          zoho_record_id: zohoRecordId,
          group_id: result.group_id,
          group_members: result.group_members || [],
          Event_Info: eventId
        };
        
        console.log('Registration data being passed:', registrationData);
        
        const queryParams = new URLSearchParams({
          data: JSON.stringify(registrationData)
        });
        
        const thankyouUrl = `/thankyou?${queryParams.toString()}`;
        console.log('Thankyou URL:', thankyouUrl);
        
        router.push(thankyouUrl);
      } else {
        console.error('❌ Backend error:', responseData);
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
      const isValid = await trigger([
        `group_members.${editIndex}.Salutation`,
        `group_members.${editIndex}.Full_Name`,
        `group_members.${editIndex}.Email`,
        `group_members.${editIndex}.Phone_Number`,
        ...groupCustomFields.map(f => `group_members.${editIndex}.${f.label}`)
      ] as any);

      if (!isValid) return;

      const latest = getValues(`group_members.${editIndex}`);
      update(editIndex, latest);
    }
    setIsNew(false);
    setEditIndex(null);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate Agreement fields
      const agreementFieldNames = agreementFields.map(f => f.label);
      const isValid = await trigger(agreementFieldNames as any);
      if (isValid) {
        setCurrentStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step Indicator: Only show if there are agreement fields */}
        {hasAgreementFields && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Agreement Fields (only renders if it exists and is the current step) */}
        {currentStep === 1 && hasAgreementFields && (
          <Card className="w-full max-w-4xl mx-auto">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
                Điều khoản và Chính sách
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 text-center">
                Vui lòng đọc và đồng ý với các điều khoản trước khi tiếp tục
              </p>
              
              <div className="space-y-8">
                <DynamicFormFields fields={agreementFields} />
              </div>

              <div className="flex justify-end mt-8 sm:mt-10">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 rounded-lg text-lg font-semibold"
                >
                  Tiếp tục
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Core and Custom Fields */}
        {currentStep === 2 && (
          <div className="space-y-6 sm:space-y-8 w-full max-w-4xl mx-auto">
            {/* Core Fields Card */}
            <Card>
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
                  Thông tin cá nhân
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CoreFormFields register={register} errors={errors} />
                </div>
              </div>
            </Card>

            {/* Custom Fields Card */}
            {otherFields.length > 0 && (
              <Card>
                <div className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
                    Thông tin bổ sung
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {otherFields.map((field, index) => (
                      <div key={index} className={field.type === 'Multi Select' ? 'md:col-span-2' : ''}>
                        <DynamicFormFields fields={[field]} />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Group Members Card */}
            {groupMembers.length > 0 && (
              <Card>
                <div className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
                    Thành viên nhóm
                  </h2>
                  <div className="space-y-6">
                    {groupMembers.map((member, index) => (
                      <div key={member.id} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg sm:text-xl font-semibold">Thành viên {index + 1}</h3>
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Xóa
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SubFormFields
                            register={register}
                            errors={errors}
                            namePrefix={`group_members.${index}`}
                          />
                          {groupCustomFields.length > 0 && (
                            <DynamicFormFields
                              fields={groupCustomFields}
                              prefix={`group_members.${index}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row items-center w-full space-y-4 sm:space-y-0 ${
              hasAgreementFields ? 'justify-between' : 'justify-end'
            }`}>
              {/* Back Button (conditionally rendered) */}
              {hasAgreementFields && (
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
                >
                  Quay lại
                </Button>
              )}

              {/* Right-aligned button group */}
              <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Thêm thành viên
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Hoàn tất đăng ký'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Group Member Dialog */}
        {editIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">
                {isNew ? 'Thêm thành viên mới' : 'Chỉnh sửa thành viên'}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <SubFormFields
                  register={register}
                  errors={errors}
                  namePrefix={`group_members.${editIndex}`}
                />
                {groupCustomFields.length > 0 && (
                  <DynamicFormFields
                    fields={groupCustomFields}
                    prefix={`group_members.${editIndex}`}
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  type="button"
                  onClick={handleCloseDialog}
                  className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDialog}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}