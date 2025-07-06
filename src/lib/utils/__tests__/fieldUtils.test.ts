import { normalizeFieldOptions, getFieldValue, getFieldLabel, findOptionByValue, findOptionByLabel, normalizeFormValue, denormalizeFormValue } from '../fieldUtils';
import { FormField } from '@/lib/api/events';

describe('Field Utils', () => {
  describe('normalizeFieldOptions', () => {
    it('should convert string array to FieldOption array', () => {
      const field: FormField = {
        sort: 1,
        label: 'Test Field',
        type: 'Select',
        required: true,
        groupmember: false,
        helptext: '',
        placeholder: '',
        field_condition: '',
        section_name: '',
        section_sort: 1,
        section_condition: '',
        matching_field: false,
        values: ['Option 1', 'Option 2', 'Option 3']
      };

      const result = normalizeFieldOptions(field);
      expect(result).toEqual([
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
        { value: 'Option 3', label: 'Option 3' }
      ]);
    });

    it('should handle already normalized options', () => {
      const field: FormField = {
        sort: 1,
        label: 'Test Field',
        type: 'Select',
        required: true,
        groupmember: false,
        helptext: '',
        placeholder: '',
        field_condition: '',
        section_name: '',
        section_sort: 1,
        section_condition: '',
        matching_field: false,
        values: [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' }
        ]
      };

      const result = normalizeFieldOptions(field);
      expect(result).toEqual([
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ]);
    });

    it('should handle empty values', () => {
      const field: FormField = {
        sort: 1,
        label: 'Test Field',
        type: 'Select',
        required: true,
        groupmember: false,
        helptext: '',
        placeholder: '',
        field_condition: '',
        section_name: '',
        section_sort: 1,
        section_condition: '',
        matching_field: false
      };

      const result = normalizeFieldOptions(field);
      expect(result).toEqual([]);
    });
  });

  describe('getFieldValue', () => {
    it('should return value from FieldOption', () => {
      const option = { value: 'test_value', label: 'Test Label' };
      expect(getFieldValue(option)).toBe('test_value');
    });

    it('should return trimmed string for string input', () => {
      expect(getFieldValue('  test string  ')).toBe('test string');
    });
  });

  describe('getFieldLabel', () => {
    it('should return label from FieldOption', () => {
      const option = { value: 'test_value', label: 'Test Label' };
      expect(getFieldLabel(option)).toBe('Test Label');
    });

    it('should return trimmed string for string input', () => {
      expect(getFieldLabel('  test string  ')).toBe('test string');
    });
  });

  describe('findOptionByValue', () => {
    const field: FormField = {
      sort: 1,
      label: 'Test Field',
      type: 'Select',
      required: true,
      groupmember: false,
      helptext: '',
      placeholder: '',
      field_condition: '',
      section_name: '',
      section_sort: 1,
      section_condition: '',
      matching_field: false,
      values: [
        { value: 'opt1', label: 'Option 1' },
        { value: 'OPT2', label: 'Option 2' }
      ]
    };

    it('should find option by value (case-insensitive)', () => {
      const result = findOptionByValue(field, 'OPT1');
      expect(result).toEqual({ value: 'opt1', label: 'Option 1' });
    });

    it('should return null for non-existent value', () => {
      const result = findOptionByValue(field, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findOptionByLabel', () => {
    const field: FormField = {
      sort: 1,
      label: 'Test Field',
      type: 'Select',
      required: true,
      groupmember: false,
      helptext: '',
      placeholder: '',
      field_condition: '',
      section_name: '',
      section_sort: 1,
      section_condition: '',
      matching_field: false,
      values: [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'OPTION 2' }
      ]
    };

    it('should find option by label (case-insensitive)', () => {
      const result = findOptionByLabel(field, 'option 1');
      expect(result).toEqual({ value: 'opt1', label: 'Option 1' });
    });

    it('should return null for non-existent label', () => {
      const result = findOptionByLabel(field, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('normalizeFormValue', () => {
    const selectField: FormField = {
      sort: 1,
      label: 'Select Field',
      type: 'Select',
      required: true,
      groupmember: false,
      helptext: '',
      placeholder: '',
      field_condition: '',
      section_name: '',
      section_sort: 1,
      section_condition: '',
      matching_field: false,
      values: [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ]
    };

    const multiSelectField: FormField = {
      ...selectField,
      label: 'Multi Select Field',
      type: 'Multi Select'
    };

    it('should normalize select field value', () => {
      const option = { value: 'opt1', label: 'Option 1' };
      expect(normalizeFormValue(selectField, option)).toBe('opt1');
    });

    it('should normalize multi-select field array', () => {
      const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ];
      expect(normalizeFormValue(multiSelectField, options)).toEqual(['opt1', 'opt2']);
    });

    it('should normalize multi-select field string', () => {
      expect(normalizeFormValue(multiSelectField, 'opt1, opt2')).toEqual(['opt1', 'opt2']);
    });

    it('should return other field types as-is', () => {
      const textField: FormField = { ...selectField, type: 'Text' };
      expect(normalizeFormValue(textField, 'test value')).toBe('test value');
    });
  });

  describe('denormalizeFormValue', () => {
    const selectField: FormField = {
      sort: 1,
      label: 'Select Field',
      type: 'Select',
      required: true,
      groupmember: false,
      helptext: '',
      placeholder: '',
      field_condition: '',
      section_name: '',
      section_sort: 1,
      section_condition: '',
      matching_field: false,
      values: [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ]
    };

    const multiSelectField: FormField = {
      ...selectField,
      label: 'Multi Select Field',
      type: 'Multi Select'
    };

    it('should denormalize select field value', () => {
      const result = denormalizeFormValue(selectField, 'opt1');
      expect(result).toEqual({ value: 'opt1', label: 'Option 1' });
    });

    it('should denormalize multi-select field array', () => {
      const result = denormalizeFormValue(multiSelectField, ['opt1', 'opt2']);
      expect(result).toEqual([
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ]);
    });

    it('should denormalize multi-select field string', () => {
      const result = denormalizeFormValue(multiSelectField, 'opt1, opt2');
      expect(result).toEqual([
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
      ]);
    });

    it('should return other field types as-is', () => {
      const textField: FormField = { ...selectField, type: 'Text' };
      expect(denormalizeFormValue(textField, 'test value')).toBe('test value');
    });
  });
}); 