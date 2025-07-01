// Test file to demonstrate conditional display logic

import { parseCondition, evaluateCondition } from './conditionalDisplay';

// Test the parsing and evaluation logic
console.log('=== Conditional Display Logic Tests ===');

// Test case 1: Basic equality condition
const condition1 = 'show if {Mục đích tham quan} = "Kết nối giao thương"';
const parsed1 = parseCondition(condition1);
console.log('Parsed condition 1:', parsed1);

// Test evaluation with matching value
const formValues1 = {
  'Mục đích tham quan': 'Kết nối giao thương',
  'Other Field': 'Some value'
};
const result1 = evaluateCondition(parsed1, formValues1);
console.log('Should show section (matching):', result1); // Should be true

// Test evaluation with non-matching value
const formValues2 = {
  'Mục đích tham quan': 'Different value',
  'Other Field': 'Some value'
};
const result2 = evaluateCondition(parsed1, formValues2);
console.log('Should hide section (not matching):', result2); // Should be false

// Test case 2: Multiple select contains condition
const condition2 = 'show if {Lĩnh vực quan tâm} contains "Technology"';
const parsed2 = parseCondition(condition2);
console.log('Parsed condition 2:', parsed2);

// Test with array value (multi-select)
const formValues3 = {
  'Lĩnh vực quan tâm': ['Technology', 'Marketing', 'Sales']
};
const result3 = evaluateCondition(parsed2, formValues3);
console.log('Should show (contains Technology):', result3); // Should be true

// Test case 3: Not equal condition
const condition3 = 'show if {Status} != "Draft"';
const parsed3 = parseCondition(condition3);
const formValues4 = { 'Status': 'Published' };
const result4 = evaluateCondition(parsed3, formValues4);
console.log('Should show (not Draft):', result4); // Should be true

export {}; // Make this a module 