// Utility functions for handling conditional display logic
import { FormField } from '@/lib/api/events';
import { normalizeFieldOptions, getFieldValue, findOptionByLabel, getFieldLabel } from './fieldUtils';

export interface Condition {
  fieldId: string;
  fieldLabel?: string; // For backward compatibility
  operator: '=' | '!=' | 'contains' | 'not_contains';
  value: string;
}

// Global storage for field mappings
// This maps field_id to current field labels for fast lookup
let fieldIdToLabelMap: Map<string, string> = new Map(); // field_id -> current_label
let fieldLabelToIdMap: Map<string, string> = new Map(); // current_label -> field_id
let fieldIdToFieldMap: Map<string, FormField> = new Map(); // field_id -> FormField

/**
 * Initialize field mappings based on current form fields
 * This should be called whenever form fields are loaded or updated
 */
export function initializeFieldMappings(formFields: FormField[]): void {
  fieldIdToLabelMap.clear();
  fieldLabelToIdMap.clear();
  fieldIdToFieldMap.clear();
  
  formFields.forEach(field => {
    if (field.field_id && field.field_id.trim() !== '') {
      // Map field_id to current label
      fieldIdToLabelMap.set(field.field_id, field.label);
      fieldLabelToIdMap.set(field.label, field.field_id);
      fieldIdToFieldMap.set(field.field_id, field);
    }
  });
  
  console.log('🗃️ Initialized field ID mappings:', {
    totalFields: formFields.length,
    fieldsWithId: fieldIdToLabelMap.size,
    mappings: Array.from(fieldIdToLabelMap.entries())
  });
}

/**
 * Parse condition string into structured condition object
 * @param conditionStr - String like "show if {field_name} = \"value\""
 * @returns Parsed condition object or null if invalid
 */
export function parseCondition(conditionStr: string): Condition | null {
  if (!conditionStr || conditionStr.trim() === '') {
    return null;
  }

  // Enhanced regex to handle both {field_id} and {field_label} formats
  const match = conditionStr.match(/show\s+if\s+\{([^}]+)\}\s*(=|!=|contains|not_contains)\s*["""]([^"""]+)["""]/i);
  
  if (!match) {
    console.warn('⚠️ Invalid condition format:', conditionStr);
    return null;
  }

  const [, fieldReference, operator, value] = match;
  
  // Determine if it's field_id or field_label
  const fieldId = fieldReference.trim();
  const fieldLabel = fieldReference.trim();

  console.log('🔍 Parsed condition:', {
    originalCondition: conditionStr,
    fieldReference: fieldReference.trim(),
    operator: operator as Condition['operator'],
    value: value.trim() // TRIM THE VALUE HERE!
  });

  return {
    fieldId: fieldId,
    fieldLabel: fieldLabel,
    operator: operator as Condition['operator'],
    value: value.trim() // TRIM THE VALUE HERE!
  };
}

/**
 * Evaluate if a condition is met based on current form values
 * @param condition - Parsed condition object
 * @param formValues - Current form values (keyed by field labels)
 * @param formFields - Array of form fields to help with value/label mapping
 * @returns true if condition is met, false otherwise
 */
export function evaluateCondition(condition: Condition | null, formValues: Record<string, any>, formFields?: FormField[]): boolean {
  if (!condition) {
    return true; // No condition means always show
  }

  console.log('🔍 Evaluating condition:', {
    condition,
    formValuesKeys: Object.keys(formValues),
    fieldIdMappings: Array.from(fieldIdToLabelMap.entries()),
    availableFieldIds: Array.from(fieldIdToLabelMap.keys())
  });

  // Strategy 1: Use field_id if available (most robust)
  if (condition.fieldId && condition.fieldId.trim() !== '') {
    const currentFieldLabel = fieldIdToLabelMap.get(condition.fieldId);
    console.log('🎯 Strategy 1 - Using field_id:', {
      fieldId: condition.fieldId,
      mappedLabel: currentFieldLabel,
      hasValueInForm: currentFieldLabel ? (formValues[currentFieldLabel] !== undefined) : false,
      actualValue: currentFieldLabel ? formValues[currentFieldLabel] : 'N/A'
    });
    
    if (currentFieldLabel && formValues[currentFieldLabel] !== undefined) {
      return evaluateFieldCondition(condition, formValues[currentFieldLabel], condition.fieldId, formFields);
    }
  }

  // Strategy 2: Fall back to field_label for backward compatibility
  if (condition.fieldLabel && formValues[condition.fieldLabel] !== undefined) {
    console.log('🎯 Strategy 2 - Using field_label:', {
      fieldLabel: condition.fieldLabel,
      hasValueInForm: true,
      actualValue: formValues[condition.fieldLabel]
    });
    return evaluateFieldCondition(condition, formValues[condition.fieldLabel], condition.fieldLabel, formFields);
  }

  // Strategy 3: Try to find field by label in current form fields
  if (formFields && condition.fieldLabel) {
    const targetField = formFields.find(f => f.label === condition.fieldLabel);
    if (targetField && formValues[targetField.label] !== undefined) {
      console.log('🎯 Strategy 3 - Found field by label in formFields:', {
        fieldLabel: condition.fieldLabel,
        targetFieldLabel: targetField.label,
        hasValueInForm: true,
        actualValue: formValues[targetField.label]
      });
      return evaluateFieldCondition(condition, formValues[targetField.label], targetField.field_id || targetField.label, formFields);
    }
  }

  console.warn('🚫 Could not evaluate condition - field not found:', {
    fieldId: condition.fieldId,
    fieldLabel: condition.fieldLabel,
    availableFields: Object.keys(formValues),
    availableFieldIds: Array.from(fieldIdToLabelMap.keys()),
    fieldIdMappings: Array.from(fieldIdToLabelMap.entries())
  });
  
  return false;
}

/**
 * Helper function to evaluate the actual condition logic
 */
function evaluateFieldCondition(condition: Condition, fieldValue: any, fieldIdentifier: string, formFields?: FormField[]): boolean {
  let conditionValue = condition.value.trim(); // Trim condition value
  
  // Find the field definition for value processing
  const targetField = fieldIdToFieldMap.get(fieldIdentifier) || 
                     formFields?.find(f => f.field_id === fieldIdentifier || f.label === fieldIdentifier);
  
  // For select/multiselect fields, ensure we're comparing with the correct value format
  if (targetField && (targetField.type === 'Select' || targetField.type === 'Multi Select')) {
    // Try to find the option by the condition value
    let option = findOptionByLabel(targetField, conditionValue);
    if (option) {
      // Use the actual value from the option
      conditionValue = getFieldValue(option);
    }
  }

  // Normalize field value for comparison
  let normalizedFieldValue: any;
  if (Array.isArray(fieldValue)) {
    // For multi-select, normalize each value
    normalizedFieldValue = fieldValue.map(val => typeof val === 'string' ? val.trim() : val);
  } else {
    // For single values, just trim if it's a string
    normalizedFieldValue = typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
  }
  
  const normalizedConditionValue = conditionValue.trim();

  console.log('🔍 Condition evaluation:', {
    fieldIdentifier,
    originalFieldValue: fieldValue,
    normalizedFieldValue,
    originalConditionValue: condition.value,
    normalizedConditionValue,
    operator: condition.operator,
    isArray: Array.isArray(fieldValue)
  });

  // Perform the comparison based on operator
  switch (condition.operator) {
    case '=':
      let isEqual: boolean;
      if (Array.isArray(normalizedFieldValue)) {
        isEqual = normalizedFieldValue.includes(normalizedConditionValue);
      } else {
        isEqual = normalizedFieldValue === normalizedConditionValue;
      }
      console.log('✅ Condition result:', isEqual);
      return isEqual;
    
    case '!=':
      let isNotEqual: boolean;
      if (Array.isArray(normalizedFieldValue)) {
        isNotEqual = !normalizedFieldValue.includes(normalizedConditionValue);
      } else {
        isNotEqual = normalizedFieldValue !== normalizedConditionValue;
      }
      console.log('✅ Condition result:', isNotEqual);
      return isNotEqual;
    
    case 'contains':
      let contains: boolean;
      if (Array.isArray(normalizedFieldValue)) {
        contains = normalizedFieldValue.some(val => String(val).includes(normalizedConditionValue));
      } else {
        contains = String(normalizedFieldValue).includes(normalizedConditionValue);
      }
      console.log('✅ Condition result:', contains);
      return contains;
    
    case 'not_contains':
      let notContains: boolean;
      if (Array.isArray(normalizedFieldValue)) {
        notContains = !normalizedFieldValue.some(val => String(val).includes(normalizedConditionValue));
      } else {
        notContains = !String(normalizedFieldValue).includes(normalizedConditionValue);
      }
      console.log('✅ Condition result:', notContains);
      return notContains;
    
    default:
      console.warn('Unknown operator:', condition.operator);
      return false;
  }
}

/**
 * Check if multiple conditions are met (AND logic)
 * @param conditions - Array of condition strings
 * @param formValues - Current form values
 * @param formFields - Array of form fields to help with value/label mapping
 * @returns true if all conditions are met
 */
export function evaluateMultipleConditions(conditions: string[], formValues: Record<string, any>, formFields?: FormField[]): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every(conditionString => {
    const condition = parseCondition(conditionString);
    return evaluateCondition(condition, formValues, formFields);
  });
}

/**
 * Get all field identifiers that are referenced in conditions
 * This is useful to know which fields to watch for changes
 * @param conditionStrings - Array of condition strings
 * @returns Array of field identifiers (field_id or field_label) that are referenced
 */
export function getReferencedFields(conditionStrings: string[]): string[] {
  const referencedFields: string[] = [];
  
  conditionStrings.forEach(conditionString => {
    const condition = parseCondition(conditionString);
    if (condition) {
      const fieldIdentifier = condition.fieldId || condition.fieldLabel;
      if (fieldIdentifier && !referencedFields.includes(fieldIdentifier)) {
        referencedFields.push(fieldIdentifier);
      }
    }
  });
  
  return referencedFields;
}

// Legacy functions for backward compatibility
export function initializeOriginalFieldMapping(formFields: FormField[]): void {
  console.log('⚠️ Using legacy initializeOriginalFieldMapping - consider using initializeFieldMappings instead');
  initializeFieldMappings(formFields);
}

export function updateFieldMapping(originalFields: FormField[], translatedFields: FormField[]): void {
  console.log('⚠️ Using legacy updateFieldMapping - consider using initializeFieldMappings instead');
  initializeFieldMappings(translatedFields);
} 