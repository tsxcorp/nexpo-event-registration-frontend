// Utility functions for handling conditional display logic

export interface Condition {
  fieldLabel: string;
  operator: '=' | '!=' | 'contains' | 'not_contains';
  value: string;
}

/**
 * Parse condition string like "show if {field_label} = "value""
 * @param conditionString - The condition string from database
 * @returns Parsed condition object or null if invalid
 */
export function parseCondition(conditionString: string): Condition | null {
  if (!conditionString || conditionString.trim() === '') {
    return null;
  }

  // Remove "show if" prefix (case insensitive)
  const cleanCondition = conditionString.replace(/^show\s+if\s+/i, '').trim();
  
  // Match pattern: {field_label} operator "value"
  const patterns = [
    // Pattern for = operator
    /\{([^}]+)\}\s*=\s*"([^"]*)"/,
    // Pattern for != operator
    /\{([^}]+)\}\s*!=\s*"([^"]*)"/,
    // Pattern for contains operator
    /\{([^}]+)\}\s*contains\s*"([^"]*)"/,
    // Pattern for not_contains operator
    /\{([^}]+)\}\s*not_contains\s*"([^"]*)"/ 
  ];

  const operators: Condition['operator'][] = ['=', '!=', 'contains', 'not_contains'];

  for (let i = 0; i < patterns.length; i++) {
    const match = cleanCondition.match(patterns[i]);
    if (match) {
      return {
        fieldLabel: match[1].trim(),
        operator: operators[i],
        value: match[2]
      };
    }
  }

  console.warn('Could not parse condition:', conditionString);
  return null;
}

/**
 * Evaluate if a condition is met based on current form values
 * @param condition - Parsed condition object
 * @param formValues - Current form values
 * @returns true if condition is met, false otherwise
 */
export function evaluateCondition(condition: Condition | null, formValues: Record<string, any>): boolean {
  if (!condition) {
    return true; // No condition means always show
  }

  const fieldValue = formValues[condition.fieldLabel];
  const conditionValue = condition.value;

  // Normalize function
  const normalize = (v: any) =>
    typeof v === 'string'
      ? v.trim().toLowerCase()
      : Array.isArray(v)
      ? v.map(x => (typeof x === 'string' ? x.trim().toLowerCase() : x))
      : v;

  let valueToCheck: string | string[] = '';
  if (typeof fieldValue === 'string') {
    valueToCheck = normalize(fieldValue);
  } else if (Array.isArray(fieldValue)) {
    valueToCheck = normalize(fieldValue);
  } else if (fieldValue === true) {
    valueToCheck = 'true';
  } else if (fieldValue === false) {
    valueToCheck = 'false';
  } else if (fieldValue !== undefined && fieldValue !== null) {
    valueToCheck = normalize(String(fieldValue));
  }

  const normalizedConditionValue = normalize(conditionValue);

  switch (condition.operator) {
    case '=':
      return valueToCheck === normalizedConditionValue;
    case '!=':
      return valueToCheck !== normalizedConditionValue;
    case 'contains':
      if (Array.isArray(valueToCheck)) {
        return valueToCheck.includes(normalizedConditionValue);
      }
      return typeof valueToCheck === 'string' && valueToCheck.includes(normalizedConditionValue);
    case 'not_contains':
      if (Array.isArray(valueToCheck)) {
        return !valueToCheck.includes(normalizedConditionValue);
      }
      return typeof valueToCheck === 'string' && !valueToCheck.includes(normalizedConditionValue);
    default:
      return true;
  }
}

/**
 * Check if multiple conditions are met (AND logic)
 * @param conditions - Array of condition strings
 * @param formValues - Current form values
 * @returns true if all conditions are met
 */
export function evaluateMultipleConditions(conditions: string[], formValues: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every(conditionString => {
    const condition = parseCondition(conditionString);
    return evaluateCondition(condition, formValues);
  });
}

/**
 * Get all field labels that are referenced in conditions
 * This is useful to know which fields to watch for changes
 * @param conditionStrings - Array of condition strings
 * @returns Array of field labels that are referenced
 */
export function getReferencedFields(conditionStrings: string[]): string[] {
  const referencedFields: string[] = [];
  
  conditionStrings.forEach(conditionString => {
    const condition = parseCondition(conditionString);
    if (condition && !referencedFields.includes(condition.fieldLabel)) {
      referencedFields.push(condition.fieldLabel);
    }
  });
  
  return referencedFields;
} 