'use client';

// ✅ RegistrationForm.tsx updated to make each section a separate step with conditional display

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { FormField, EventData } from '@/lib/api/events';
import { parseCondition, evaluateCondition, getReferencedFields } from '@/lib/utils/conditionalDisplay';
import { normalizeFormValue, convertFormDataToFieldIds } from '@/lib/utils/fieldUtils';
import CoreFormFields from './CoreFormFields';
import DynamicFormFields from './DynamicFormFields';
import SubFormFields from './SubFormFields';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { i18n } from '@/lib/translation/i18n';

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
  eventData?: EventData;
  currentLanguage?: string;
  onRegisterFormMigration?: (callback: (oldFields: FormField[], newFields: FormField[]) => void) => void;
  isEmbedded?: boolean;
  embedConfig?: {
    theme: string;
    language: string;
    showHeader: boolean;
    showFooter: boolean;
    showProgress: boolean;
    autoResize: boolean;
  };
}

export default function RegistrationForm({ fields, eventId, eventData, currentLanguage = 'vi', onRegisterFormMigration, isEmbedded = false, embedConfig }: Props) {
  // Function to detect if we're actually in an iframe
  const isActuallyEmbedded = () => {
    try {
      return isEmbedded && 
             window.parent && 
             window.parent !== window && 
             window.parent.location.origin !== window.location.origin;
    } catch (error) {
      // If we can't access parent.location due to CORS, assume we're embedded
      console.log('🔒 CORS blocked access to parent.location, assuming embedded mode');
      return isEmbedded && window.parent && window.parent !== window;
    }
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  
  // Use useRef for userIntentToSubmit to persist across re-mounts
  const userIntentToSubmitRef = useRef(false);
  
  // Clear any potential browser storage interference
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Clear form-related storage to prevent cache issues
        const storageKeys = Object.keys(localStorage);
        const formKeys = storageKeys.filter(key => 
          key.includes('form') || 
          key.includes('submit') || 
          key.includes('step') ||
          key.includes('registration')
        );
        formKeys.forEach(key => localStorage.removeItem(key));
        
        const sessionKeys = Object.keys(sessionStorage);
        const sessionFormKeys = sessionKeys.filter(key => 
          key.includes('form') || 
          key.includes('submit') || 
          key.includes('step') ||
          key.includes('registration')
        );
        sessionFormKeys.forEach(key => sessionStorage.removeItem(key));
        
        // Reset userIntent
        userIntentToSubmitRef.current = false;
      }
    } catch (error) {
      // Silent error handling for production
    }
  }, []); // Run once on mount


  // Group fields by sections and sort them
  const groupFieldsBySection = (fields: FormField[]): Section[] => {
    const sectionMap = new Map<string, Section>();
    
    fields.forEach(field => {
      const sectionName = field.section_name || '';
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

  // Form values migration function
  const migrateFormValues = useCallback((oldFields: FormField[], newFields: FormField[]) => {
    const currentValues = getValues();
    const newValues = { ...currentValues };
    
    // Create mapping from old labels to new labels using field properties
    const fieldMappings: { oldLabel: string; newLabel: string }[] = [];
    
    oldFields.forEach(oldField => {
      // Find corresponding new field by field_id (most reliable) or by properties
      const newField = newFields.find((newF: FormField) => {
        if (oldField.field_id && newF.field_id) {
          return oldField.field_id === newF.field_id;
        }
        // Fallback: match by type, sort, and section
         return oldField.type === newF.type &&
                oldField.sort === newF.sort &&
                (oldField.section_name || '') === (newF.section_name || '');
      });
      
      if (newField && oldField.label !== newField.label) {
        fieldMappings.push({
          oldLabel: oldField.label,
          newLabel: newField.label
        });
      }
    });
    
    // Migrate form values
    fieldMappings.forEach(({ oldLabel, newLabel }) => {
      if (currentValues[oldLabel] !== undefined) {
        newValues[newLabel] = currentValues[oldLabel];
        delete newValues[oldLabel];
      }
    });
    
    // Update form with new values
    Object.keys(newValues).forEach(key => {
      setValue(key, newValues[key]);
    });
  }, [getValues, setValue]);

  // Register form migration callback on mount
  useEffect(() => {
    if (onRegisterFormMigration) {
      onRegisterFormMigration(migrateFormValues);
    }
  }, [onRegisterFormMigration, migrateFormValues]);

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
      return evaluateCondition(condition, watchedValues, fields);
    });
  };

  // Filter fields within a section based on field conditions
  const getVisibleFields = (fields: FormField[]) => {
    return fields.filter(field => {
      if (!field.field_condition) return true;
      
      const condition = parseCondition(field.field_condition);
      return evaluateCondition(condition, watchedValues, fields);
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
      name: i18n[currentLanguage]?.personal_info || 'THÔNG TIN CÁ NHÂN',
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
    // CRITICAL: Only allow submit on last step AND when user explicitly intends to submit
    if (!isLastStep) {
      return;
    }

    if (!userIntentToSubmitRef.current) {
      return;
    }
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
      } else if (field.type === 'Select' || field.type === 'Multi Select') {
        // Normalize select/multiselect values to backend format
        const normalizedValue = normalizeFormValue(field, currentValue);
        if (normalizedValue !== undefined && normalizedValue !== null) {
          if (field.type === 'Multi Select' && Array.isArray(normalizedValue)) {
            customData[fieldLabel] = normalizedValue.join(',');
          } else {
            customData[fieldLabel] = normalizedValue;
          }
        } else {
          // If empty, remove it from payload
          delete customData[fieldLabel];
        }
      }
    });

    // 3. Convert customData from field labels to field_id format for backend
    const customDataWithFieldIds = convertFormDataToFieldIds(customData, allVisibleFields);
    const payload = {
      ...coreData,
      group_members: data.group_members,
      Custom_Fields_Value: customDataWithFieldIds, // Use field_id format for backend
      Event_Info: eventId
    };

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
        // Combine backend response with frontend group members data
        const frontendGroupMembers = data.group_members || [];
        const backendGroupMembers = result.group_members || [];
        
        // Merge frontend data (full info) with backend data (IDs)
        const enrichedGroupMembers = frontendGroupMembers.map((frontendMember, index) => ({
          ...frontendMember, // Full member info from frontend
          id: backendGroupMembers[index]?.id || null, // Zoho ID from backend
          index: backendGroupMembers[index]?.index || index + 2,
          status: backendGroupMembers[index]?.status || "submitted"
        }));

        const registrationData = {
          Salutation: coreData.Salutation,
          Full_Name: coreData.Full_Name,
          Email: coreData.Email,
          Phone_Number: coreData.Phone_Number,
          ...customData, // Keep original labels for Thank You page display
          zoho_record_id: zohoRecordId,
          group_id: result.group_id,
          group_members: enrichedGroupMembers, // Use enriched data instead
          Event_Info: eventId
        };
        
        console.log('📋 Registration data being sent to payment page:', registrationData);
        
        // Handle redirect based on embed mode and ticket_mode
        if (isActuallyEmbedded()) {
          // For embedded forms, send message to parent window
          const redirectData = {
            type: 'registration_complete',
            source: 'nexpo-embed',
            eventId: eventId,
            ticket_mode: eventData?.ticket_mode || false,
            registrationData: registrationData,
            currentLanguage: currentLanguage
          };
          
          window.parent.postMessage(redirectData, '*');
          console.log('📤 Sent registration complete message to parent window:', redirectData);
        } else {
          // For non-embedded forms, use normal redirect
          if (eventData?.ticket_mode) {
            // Redirect to payment page for ticket mode events
            const paymentQueryParams = new URLSearchParams({
              eventId: eventId,
              registrationData: encodeURIComponent(JSON.stringify(registrationData)),
              lang: currentLanguage
            });
            
            const paymentUrl = `/payment?${paymentQueryParams.toString()}`;
            router.push(paymentUrl);
          } else {
            // Redirect to thank you page for non-ticket mode events
            const queryParams = new URLSearchParams({
              data: JSON.stringify(registrationData),
              lang: currentLanguage // Pass current language to Thank You page
            });
            
            const thankyouUrl = `/thankyou?${queryParams.toString()}`;
            router.push(thankyouUrl);
          }
        }
      } else {
        alert('Submission failed.');
      }
    } catch (err) {
      console.error('❌ Registration submission error:', err);
      
      // Type cast error for better handling
      const error = err as any;
      
      // Enhanced error handling for embedded forms
      if (isActuallyEmbedded()) {
        // Send error message to parent window
        const errorData = {
          type: 'registration_error',
          source: 'nexpo-embed',
          eventId: eventId,
          error: {
            message: error.message || 'Network error',
            code: error.code || 'UNKNOWN',
            status: error.response?.status || 0,
            url: error.config?.url || 'unknown'
          }
        };
        
        window.parent.postMessage(errorData, '*');
        console.log('📤 Sent error message to parent window:', errorData);
      }
      
      // Show user-friendly error message
      const errorMessage = isActuallyEmbedded() 
        ? 'Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
        : 'Network error. Please try again.';
      
      alert(errorMessage);
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
      // Reset user intent when changing steps
      userIntentToSubmitRef.current = false;
      setCurrentStep(currentStep + 1);
      
      // Auto-scroll to top of form after step change
      setTimeout(() => {
        const formElement = document.getElementById('registration-form');
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      // Reset user intent when going back
      userIntentToSubmitRef.current = false;
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const currentSection = allSteps[currentStep];

  // Handle form submission - either go to next step or actually submit
  const handleFormSubmit = async (data: FormData) => {
    if (isLastStep && userIntentToSubmitRef.current) {
      // On last step with user intent, proceed with actual form submission
      await onSubmit(data);
      // Reset intent after submission
      userIntentToSubmitRef.current = false;
    } else {
      // On other steps, just go to next step (prevent accidental submit)
      await handleNextStep();
    }
  };

  // When rendering core fields:
  const getLabel = (key: string, defaultLabel: string) => i18n[currentLanguage]?.[key] || defaultLabel;

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={handleSubmit(handleFormSubmit)} 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isLastStep) {
            e.preventDefault();
            handleNextStep();
          }
        }}
        className="space-y-3 sm:space-y-6 pb-20 sm:pb-6"
      >
        {/* Multi-Step Indicator */}
        <div className="flex items-center justify-center mb-4 sm:mb-8 px-2 sm:px-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto max-w-full">
            {allSteps.map((step, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 text-xs sm:text-sm font-bold ${
                  index <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  {index + 1}
                </div>
                {index < allSteps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-1 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Info */}
        {/* <div className="text-center mb-4 sm:mb-8 px-2 sm:px-4">
          <p className="text-base sm:text-xl font-bold text-gray-800">
            Bước <span className="text-blue-600">{currentStep + 1}</span> / {totalSteps}
          </p>
          <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">{currentSection.name}</p>
        </div> */}

        {/* Current Step Content */}
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 mb-6 sm:mb-8">
          <Card className="border border-blue-100 sm:border-2 shadow-lg sm:shadow-xl bg-white">
            <div className="p-3 sm:p-6 lg:p-8 pb-6 sm:pb-8">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-8 text-center">
                {currentSection.name}
              </h2>

              {/* Core Fields */}
              {currentSection.type === 'core' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <CoreFormFields register={register} errors={errors} currentLanguage={currentLanguage} />
                </div>
              )}

              {/* Agreement or Custom Fields */}
              {(currentSection.type === 'agreement' || currentSection.type === 'custom') && (
                <div className="space-y-4 sm:space-y-6">
                  {(() => {
                    const visibleFields = getVisibleFields(currentSection.fields);
                    return (
                      <>
                        <div className="text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                            {visibleFields.length} {i18n[currentLanguage]?.information_fields || "trường thông tin"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                          {visibleFields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className={field.type === 'Multi Select' || field.type === 'Agreement' ? 'md:col-span-2' : ''}>
                              <DynamicFormFields fields={[field]} currentLanguage={currentLanguage} />
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
          <div className="w-full max-w-4xl mx-auto mt-3 sm:mt-6 px-2 sm:px-4">
            <Card className="border border-orange-100 sm:border-2 shadow-md sm:shadow-lg bg-gradient-to-br from-orange-50 to-white">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <span className="bg-orange-100 text-orange-800 text-xs sm:text-sm font-bold px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                    {i18n[currentLanguage]?.["Thành viên nhóm"] || "Thành viên nhóm"} ({groupMembers.length})
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                  {i18n[currentLanguage]?.["Danh sách thành viên"] || "Danh sách thành viên"}
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {groupMembers.map((member, index) => {
                    const memberData = getValues(`group_members.${index}`);
                    const hasData = memberData && (memberData.Full_Name || memberData.Email);
                    
                    return (
                      <div key={member.id} className="p-3 sm:p-5 border border-orange-200 sm:border-2 rounded-lg sm:rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          {/* Member Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-xs sm:text-sm">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                {hasData ? (
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                                      {memberData.Salutation && `${memberData.Salutation} `}
                                      {memberData.Full_Name || i18n[currentLanguage]?.no_name_yet || 'Chưa có tên'}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      {memberData.Email || i18n[currentLanguage]?.no_email_yet || 'Chưa có email'}
                                    </p>
                                    {memberData.Phone_Number && (
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        📞 {memberData.Phone_Number}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="font-bold text-gray-500 text-sm sm:text-base">
                                      {i18n[currentLanguage]?.member || "Thành viên"} {index + 1}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-400 italic">
                                      {i18n[currentLanguage]?.no_information_yet || "Chưa có thông tin"}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Custom fields if any */}
                            {hasData && groupCustomFields.length > 0 && (
                              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs">
                                  {groupCustomFields.map((field, fieldIndex) => {
                                    const fieldValue = memberData[field.label];
                                    if (!fieldValue) return null;
                                    
                                    return (
                                      <div key={fieldIndex} className="text-gray-600">
                                        <span className="font-medium">{field.label}:</span>
                                        <span className="ml-1">
                                          {Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => {
                                setEditIndex(index);
                                setIsNew(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              ✏️ {i18n[currentLanguage]?.edit || 'Sửa'}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                if (confirm(i18n[currentLanguage]?.confirm_delete || 'Bạn có chắc muốn xóa thành viên này?')) {
                                  remove(index);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              🗑️ {i18n[currentLanguage]?.delete || 'Xóa'}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="mt-2 sm:mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-xs font-medium ${hasData ? 'text-green-600' : 'text-gray-500'}`}>
                              {hasData ? 'Đã điền thông tin' : 'Chưa điền thông tin'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {i18n[currentLanguage]?.member_number || "Thành viên #"}{index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Add new member button */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-orange-200">
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      {i18n[currentLanguage]?.["Thêm thành viên mới"] || "Thêm thành viên mới"}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons - Better mobile spacing */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:p-4 shadow-lg z-40 sm:relative sm:bottom-auto sm:border-t-0 sm:shadow-none sm:bg-transparent sm:mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-4xl mx-auto space-y-3 sm:space-y-0">
            {/* Back Button */}
            <Button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md order-1 sm:order-none"
            >
              ← {i18n[currentLanguage]?.back || 'Quay lại'}
            </Button>

            {/* Center content for mobile - Add member button */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-4 order-3 sm:order-none">
              {groupMembers.length === 0 && (
                <Button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  + {i18n[currentLanguage]?.add_member || 'Thêm thành viên'}
                </Button>
              )}
              
              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg text-sm sm:text-base font-bold disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    userIntentToSubmitRef.current = true;
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {i18n[currentLanguage]?.submitting || 'Đang gửi...'}
                    </span>
                  ) : (
                    `✓ ${i18n[currentLanguage]?.complete_registration || 'Hoàn tất đăng ký'}`
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {i18n[currentLanguage]?.continue || 'Tiếp tục'} →
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add sufficient padding at bottom for mobile to account for fixed navigation */}
        <div className="h-40 sm:h-0"></div>

        {/* Group Member Dialog - Mobile optimized */}
        {editIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header - Mobile optimized */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold">
                      {isNew ? i18n[currentLanguage]?.["Thêm thành viên mới"] || 'Thêm thành viên mới' : `${i18n[currentLanguage]?.["Chỉnh sửa thành viên"] || "Chỉnh sửa thành viên"} ${editIndex + 1}`}
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1">
                      {isNew ? i18n[currentLanguage]?.["Điền thông tin cho thành viên mới"] || 'Điền thông tin cho thành viên mới' : i18n[currentLanguage]?.["Cập nhật thông tin thành viên"] || 'Cập nhật thông tin thành viên'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCloseDialog}
                    className="text-white hover:bg-white hover:text-blue-600 p-2 rounded-full transition-all ml-3 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Content - Mobile optimized */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Core Fields */}
                  <div className="md:col-span-2">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">👤</span>
                      </div>
                      {i18n[currentLanguage]?.["Thông tin cơ bản"] || "Thông tin cơ bản"}
                    </h4>
                  </div>
                  
                  <SubFormFields
                    register={register}
                    errors={errors}
                    namePrefix={`group_members.${editIndex}`}
                  />
                  
                  {/* Custom Fields */}
                  {groupCustomFields.length > 0 && (
                    <>
                      <div className="md:col-span-2 mt-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">⚙️</span>
                          </div>
                          {i18n[currentLanguage]?.["Thông tin bổ sung"] || "Thông tin bổ sung"}
                        </h4>
                      </div>
                      <div className="md:col-span-2">
                        <DynamicFormFields
                          fields={groupCustomFields}
                          prefix={`group_members.${editIndex}`}
                          currentLanguage={currentLanguage}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer - Mobile optimized */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-b-2xl border-t border-gray-200 sticky bottom-0">
                <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    type="button"
                    onClick={handleCloseDialog}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200"
                  >
                    {i18n[currentLanguage]?.cancel || 'Hủy bỏ'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmDialog}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg mb-3 sm:mb-0"
                  >
                    {isNew ? `✅ ${i18n[currentLanguage]?.["Thêm thành viên"] || "Thêm thành viên"}` : `💾 ${i18n[currentLanguage]?.["Lưu thay đổi"] || "Lưu thay đổi"}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}