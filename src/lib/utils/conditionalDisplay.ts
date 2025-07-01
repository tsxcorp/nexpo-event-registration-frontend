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

  // Handle different field value types
  let valueToCheck: string = '';
  
  if (typeof fieldValue === 'string') {
    valueToCheck = fieldValue;
  } else if (Array.isArray(fieldValue)) {
    // For multi-select fields, join with comma
    valueToCheck = fieldValue.join(',');
  } else if (fieldValue === true) {
    valueToCheck = 'true';
  } else if (fieldValue === false) {
    valueToCheck = 'false';
  } else if (fieldValue !== undefined && fieldValue !== null) {
    valueToCheck = String(fieldValue);
  }

  // Evaluate based on operator
  switch (condition.operator) {
    case '=':
      return valueToCheck === conditionValue;
    case '!=':
      return valueToCheck !== conditionValue;
    case 'contains':
      return valueToCheck.includes(conditionValue);
    case 'not_contains':
      return !valueToCheck.includes(conditionValue);
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