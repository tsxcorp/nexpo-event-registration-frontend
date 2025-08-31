import { FormField } from '@/lib/api/events';

export interface FieldOption {
  value: string;
  label: string;
}

/**
 * Convert field values from string array to {value, label} objects
 * This ensures we always have a consistent structure for select/multiselect fields
 */
export function normalizeFieldOptions(field: FormField): FieldOption[] {
  const rawValues = field.values || field.options || [];
  
  if (rawValues.length === 0) {
    return [];
  }

  // If already in {value, label} format, return as is
  if (rawValues.length > 0 && typeof rawValues[0] === 'object' && 'value' in rawValues[0] && 'label' in rawValues[0]) {
    return rawValues as unknown as FieldOption[];
  }

  // Convert string array to {value, label} objects
  return (rawValues as string[]).map((value: string) => ({
    value: value.trim(),
    label: value.trim()
  }));
}

/**
 * Get the original value from a field option (for comparison and submission)
 */
export function getFieldValue(option: FieldOption | string): string {
  if (typeof option === 'string') {
    return option.trim();
  }
  return option.value;
}

/**
 * Get the display label from a field option (for UI display)
 */
export function getFieldLabel(option: FieldOption | string): string {
  if (typeof option === 'string') {
    return option.trim();
  }
  return option.label;
}

/**
 * Find option by value in a field's options
 */
export function findOptionByValue(field: FormField, value: string): FieldOption | null {
  const options = normalizeFieldOptions(field);
  const normalizedValue = value.trim().toLowerCase();
  
  return options.find(option => 
    option.value.toLowerCase() === normalizedValue
  ) || null;
}

/**
 * Find option by label in a field's options
 */
export function findOptionByLabel(field: FormField, label: string): FieldOption | null {
  const options = normalizeFieldOptions(field);
  const normalizedLabel = label.trim().toLowerCase();
  
  return options.find(option => 
    option.label.toLowerCase() === normalizedLabel
  ) || null;
}

/**
 * Convert form values back to the format expected by the backend
 * For select fields: return the value
 * For multiselect fields: return array of values
 */
export function normalizeFormValue(field: FormField, value: any): any {
  if (field.type === 'Multi Select') {
    if (Array.isArray(value)) {
      // If it's already an array, extract values
      return value.map(v => getFieldValue(v));
    } else if (typeof value === 'string') {
      // If it's a comma-separated string, split and extract values
      return value.split(',').map(v => v.trim()).filter(v => v);
    }
    return [];
  } else if (field.type === 'Select') {
    // For single select, return the value
    return getFieldValue(value);
  }
  
  // For other field types, return as is
  return value;
}

/**
 * Convert backend values to display format for UI
 * For select fields: return the option object
 * For multiselect fields: return array of option objects
 */
export function denormalizeFormValue(field: FormField, value: any): any {
  if (field.type === 'Multi Select') {
    if (Array.isArray(value)) {
      // Convert array of values to array of option objects
      return value.map(v => {
        const option = findOptionByValue(field, v);
        return option || { value: v, label: v };
      });
    } else if (typeof value === 'string') {
      // Convert comma-separated string to array of option objects
      return value.split(',').map(v => v.trim()).filter(v => v).map(v => {
        const option = findOptionByValue(field, v);
        return option || { value: v, label: v };
      });
    }
    return [];
  } else if (field.type === 'Select') {
    // For single select, return the option object
    if (typeof value === 'string') {
      const option = findOptionByValue(field, value);
      return option || { value, label: value };
    }
    return value;
  }
  
  // For other field types, return as is
  return value;
}

/**
 * Convert form data from field labels to field_id format for backend submission
 * This ensures consistent field identification regardless of language/translation
 */
export function convertFormDataToFieldIds(formData: Record<string, any>, fields: FormField[]): Record<string, any> {
  const convertedData: Record<string, any> = {};
  
  // Create mapping from field label to field_id
  const labelToFieldIdMap = new Map<string, string>();
  fields.forEach(field => {
    if (field.field_id && field.label) {
      labelToFieldIdMap.set(field.label, field.field_id);
    }
  });
  
  console.log('🔄 Converting form data to field_id format...');
  console.log('📋 Label to field_id mapping:', Array.from(labelToFieldIdMap.entries()));
  
  // Convert each form field
  Object.entries(formData).forEach(([key, value]) => {
    const fieldId = labelToFieldIdMap.get(key);
    
    if (fieldId) {
      // Use field_id as key
      convertedData[fieldId] = value;
      console.log(`✅ Converted: "${key}" → "${fieldId}"`, value);
    } else {
      // Keep original key if no field_id mapping found (for core fields, etc.)
      convertedData[key] = value;
      console.log(`⚠️ No field_id mapping found for: "${key}", keeping original key`);
    }
  });
  
  console.log('📋 Final converted data:', convertedData);
  return convertedData;
}

/**
 * Convert form data from field_id format back to field labels for display
 * This is useful for displaying data that was stored with field_id keys
 */
export function convertFieldIdsToLabels(formData: Record<string, any>, fields: FormField[]): Record<string, any> {
  const convertedData: Record<string, any> = {};
  
  // Create mapping from field_id to field label
  const fieldIdToLabelMap = new Map<string, string>();
  fields.forEach(field => {
    if (field.field_id && field.label) {
      fieldIdToLabelMap.set(field.field_id, field.label);
    }
  });
  
  console.log('🔄 Converting field_id data to labels...');
  console.log('📋 Field_id to label mapping:', Array.from(fieldIdToLabelMap.entries()));
  
  // Convert each field
  Object.entries(formData).forEach(([key, value]) => {
    const fieldLabel = fieldIdToLabelMap.get(key);
    
    if (fieldLabel) {
      // Use field label as key
      convertedData[fieldLabel] = value;
      console.log(`✅ Converted: "${key}" → "${fieldLabel}"`, value);
    } else {
      // Keep original key if no label mapping found
      convertedData[key] = value;
      console.log(`⚠️ No label mapping found for: "${key}", keeping original key`);
    }
  });
  
  console.log('📋 Final converted data:', convertedData);
  return convertedData;
} 

/**
 * Format field label with proper capitalization for Vietnamese characters
 * @param label - The field label to format
 * @returns Properly capitalized label
 */
export function formatFieldLabel(label: string): string {
  // Replace underscores with spaces first
  let formatted = label.replace(/_/g, ' ');
  
  // Split by spaces and capitalize each word
  const words = formatted.split(' ');
  const capitalizedWords = words.map(word => {
    if (!word) return word;
    
    // Handle Vietnamese characters properly
    const firstChar = word.charAt(0);
    const rest = word.slice(1);
    
    // Check if first character is Vietnamese
    const vietnameseFirstChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    
    if (vietnameseFirstChars.test(firstChar)) {
      // For Vietnamese characters, we need to handle the tone marks
      const upperFirst = firstChar.toUpperCase();
      return upperFirst + rest;
    } else {
      // For regular characters
      return firstChar.toUpperCase() + rest.toLowerCase();
    }
  });
  
  return capitalizedWords.join(' ');
} 