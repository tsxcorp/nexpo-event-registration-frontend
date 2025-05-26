import { FormField } from '../api/events';

export const validateField = (field: FormField, value: any): string | null => {
  if (field.required && !value) {
    return 'This field is required';
  }

  switch (field.type) {
    case 'email':
      if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return 'Invalid email address';
      }
      break;

    case 'phone':
      if (value && !/^\+?[\d\s-]{10,}$/.test(value)) {
        return 'Invalid phone number';
      }
      break;

    case 'select':
      if (value && field.options && !field.options.includes(value)) {
        return 'Invalid option selected';
      }
      break;
  }

  return null;
};

export const validateForm = (fields: FormField[], values: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const error = validateField(field, values[field.id]);
    if (error) {
      errors[field.id] = error;
    }
  });

  return errors;
}; 