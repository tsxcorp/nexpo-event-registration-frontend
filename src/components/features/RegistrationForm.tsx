'use client';

// ✅ RegistrationForm.tsx updated to make each section a separate step with conditional display

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { FormField } from '@/lib/api/events';
import { parseCondition, evaluateCondition, getReferencedFields } from '@/lib/utils/conditionalDisplay';
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

interface Section {
  name: string;
  sort: number;
  fields: FormField[];
  type: 'core' | 'agreement' | 'custom' | 'group';
  condition?: string;
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

  // Group fields by sections and sort them
  const groupFieldsBySection = (fields: FormField[]): Section[] => {
    const sectionMap = new Map<string, Section>();
    
    fields.forEach(field => {
      const sectionName = field.section_name || 'Khác';
      const sectionSort = field.section_sort || 999;
      const sectionCondition = field.section_condition || '';
      
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, {
          name: sectionName,
          sort: sectionSort,
          fields: [],
          type: field.type === 'Agreement' ? 'agreement' : 'custom',
          condition: sectionCondition
        });
      }
      
      sectionMap.get(sectionName)!.fields.push(field);
    });
    
    // Sort sections by section_sort
    const sections = Array.from(sectionMap.values()).sort((a, b) => a.sort - b.sort);
    
    // Sort fields within each section by sort field
    sections.forEach(section => {
      section.fields.sort((a, b) => a.sort - b.sort);
    });
    
    return sections;
  };

  // Create all steps: Agreement sections (if any) + Core info + Custom sections
  const agreementFields = fields.filter(f => f.type === 'Agreement');
  const otherFields = fields.filter(f => f.type !== 'Agreement');
  const groupCustomFields = otherFields.filter(f => f.groupmember);
  
  const agreementSections = groupFieldsBySection(agreementFields);
  const otherSections = groupFieldsBySection(otherFields);
  
  // Get all fields that are referenced in conditions for watching
  const allConditions = [
    ...fields.map(f => f.field_condition).filter(Boolean),
    ...Array.from(new Set(fields.map(f => f.section_condition))).filter(Boolean)
  ];
  const referencedFields = getReferencedFields(allConditions);

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

  // Watch all form values for conditional display
  const watchedValues = useWatch({
    control,
    defaultValue: methods.getValues()
  });

  // Filter sections based on conditions
  const getVisibleSections = (sections: Section[]) => {
    return sections.filter(section => {
      if (!section.condition) return true;
      
      const condition = parseCondition(section.condition);
      return evaluateCondition(condition, watchedValues);
    });
  };

  // Filter fields within a section based on field conditions
  const getVisibleFields = (fields: FormField[]) => {
    return fields.filter(field => {
      if (!field.field_condition) return true;
      
      const condition = parseCondition(field.field_condition);
      return evaluateCondition(condition, watchedValues);
    });
  };

  // Get visible sections for current step calculation
  const visibleAgreementSections = getVisibleSections(agreementSections);
  const visibleOtherSections = getVisibleSections(otherSections);

  // Build step sequence with correct order (only visible sections)
  const allSteps: Section[] = [
    // 1. Agreement sections first (if any and visible)
    ...visibleAgreementSections,
    // 2. Core fields step
    {
      name: 'THÔNG TIN CÁ NHÂN',
      sort: -1,
      fields: [],
      type: 'core',
      condition: ''
    },
    // 3. Custom sections (already sorted by section_sort and visible)
    ...visibleOtherSections
  ];

  // Add group members step if there are group members
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = allSteps.length;

  const { fields: groupMembers, append, remove, update } = useFieldArray({
    control,
    name: 'group_members'
  });

  const coreKeys = ['Salutation', 'Full_Name', 'Email', 'Phone_Number'];

  const onSubmit = async (data: FormData) => {
    const coreData: Record<string, any> = {};
    const customData: Record<string, any> = {};

    // Get all visible fields for filtering
    const allVisibleFields: FormField[] = [];
    
    // Add visible fields from all sections
    [...visibleAgreementSections, ...visibleOtherSections].forEach(section => {
      const visibleFields = getVisibleFields(section.fields);
      allVisibleFields.push(...visibleFields);
    });

    // 1. Separate core fields and custom fields (only process visible fields)
    for (const key in data) {
      const value = data[key];
      if (key === 'group_members' || key === 'event_info' || value instanceof FileList) continue;
      
      if (coreKeys.includes(key)) {
        coreData[key] = value;
      } else {
        // Only include custom data if the field is visible
        const isFieldVisible = allVisibleFields.some(field => field.label === key);
        if (isFieldVisible) {
          customData[key] = value;
        }
      }
    }

    // 2. Process customData to match backend expectations (only visible fields)
    allVisibleFields.forEach(field => {
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
    console.log('Final Payload to be sent (with conditional fields):', JSON.stringify(payload, null, 2));

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
    const currentSection = allSteps[currentStep];
    
    // Validate current step
    let fieldsToValidate: string[] = [];
    
    if (currentSection.type === 'core') {
      fieldsToValidate = coreKeys;
    } else if (currentSection.type === 'agreement' || currentSection.type === 'custom') {
      // Only validate visible fields in the current section
      const visibleFields = getVisibleFields(currentSection.fields);
      fieldsToValidate = visibleFields.map(f => f.label);
    }
    
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const currentSection = allSteps[currentStep];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Multi-Step Indicator */}
        <div className="flex items-center justify-center mb-8 px-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto max-w-full">
            {allSteps.map((step, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 text-xs sm:text-sm font-bold ${
                  index <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  {index + 1}
                </div>
                {index < allSteps.length - 1 && (
                  <div className={`w-6 sm:w-8 h-1 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center mb-8 px-4">
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            Bước <span className="text-blue-600">{currentStep + 1}</span> / {totalSteps}
          </p>
          <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">{currentSection.name}</p>
        </div>

        {/* Current Step Content */}
        <div className="w-full max-w-4xl mx-auto px-4">
          <Card className="border-2 border-blue-100 shadow-xl bg-white">
            <div className="p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
                {currentSection.name}
              </h2>

              {/* Core Fields */}
              {currentSection.type === 'core' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <CoreFormFields register={register} errors={errors} />
                </div>
              )}

              {/* Agreement or Custom Fields */}
              {(currentSection.type === 'agreement' || currentSection.type === 'custom') && (
                <div className="space-y-6">
                  {(() => {
                    const visibleFields = getVisibleFields(currentSection.fields);
                    return (
                      <>
                        <div className="text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
                            {visibleFields.length} trường thông tin
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {visibleFields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className={field.type === 'Multi Select' || field.type === 'Agreement' ? 'md:col-span-2' : ''}>
                              <DynamicFormFields fields={[field]} />
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Group Members Management (shown when there are group members) */}
        {groupMembers.length > 0 && (
          <div className="w-full max-w-4xl mx-auto mt-6 px-4">
            <Card className="border-2 border-orange-100 shadow-lg bg-gradient-to-br from-orange-50 to-white">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="bg-orange-100 text-orange-800 text-sm font-bold px-4 py-2 rounded-full">
                    Thành viên nhóm ({groupMembers.length})
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">
                  Danh sách thành viên
                </h3>
                <div className="space-y-3">
                  {groupMembers.map((member, index) => (
                    <div key={member.id} className="p-3 sm:p-4 border-2 border-orange-200 rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">Thành viên {index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 font-bold text-sm px-3 py-1 rounded-md transition-colors"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons - Fixed at bottom for mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg sm:relative sm:bottom-auto sm:border-t-0 sm:shadow-none sm:bg-transparent sm:mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-4xl mx-auto space-y-3 sm:space-y-0">
            {/* Back Button */}
            <Button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              ← Quay lại
            </Button>

            {/* Center content for mobile - Add member button */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                type="button"
                onClick={handleAddMember}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                + Thêm thành viên
              </Button>
              
              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-base font-bold disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang gửi...
                    </span>
                  ) : (
                    '✓ Hoàn tất đăng ký'
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-base font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Tiếp tục →
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add padding at bottom for mobile to account for fixed navigation */}
        <div className="h-32 sm:h-0"></div>

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