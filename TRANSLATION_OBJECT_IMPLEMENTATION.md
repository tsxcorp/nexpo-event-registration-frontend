# Translation Object Implementation

## Overview

This implementation adds support for pre-defined translations in form fields using a `translation` object. The system now prioritizes existing translations over Google Translate API calls, improving performance and accuracy.

## Key Changes

### 1. Updated FormField Interface

Added `translation` property to both `FormField` interfaces in:
- `src/lib/api/events.ts`
- `src/lib/api/api.ts`

```typescript
translation?: {
  en_sectionname?: string;
  en_label?: string;
  en_value?: string;
  en_placeholder?: string;
  en_helptext?: string;
  en_agreementcontent?: string;
  en_agreementtitle?: string;
  en_checkboxlabel?: string;
  en_linktext?: string;
  // ... similar for zh_, ja_, ko_ prefixes
};
```

### 2. Enhanced Translation Service

Updated `src/lib/translation/translationService.ts` with new methods:

#### `translateFormField()` Method
- Checks if field has `translation` object
- Maps target language to translation keys (e.g., 'en' → 'en_')
- Uses pre-defined translations when available
- Falls back to Google Translate for missing translations

#### `translateFieldWithGoogle()` Method
- Original translation logic for fields without translation objects
- Used as fallback when translation object is missing or incomplete

### 3. Translation Logic Flow

```
1. Check if field has translation object
   ↓
2. If YES: Check for specific language translation (e.g., en_label)
   ↓
3. If translation exists: Use pre-defined translation
   ↓
4. If translation missing: Use Google Translate
   ↓
5. If NO translation object: Use Google Translate for all fields
```

## Supported Translation Fields

### Basic Fields
- `label` → `en_label`
- `helptext` → `en_helptext`
- `placeholder` → `en_placeholder`
- `section_name` → `en_sectionname`
- `link_text` → `en_linktext`

### Agreement Fields
- `checkbox_label` → `en_checkboxlabel`
- `content` → `en_agreementcontent`
- `title` → `en_agreementtitle`

### Select/Multi-Select Fields
- `values` → `en_value` (comma-separated string)

## Example Usage

### Form Field with Translation Object

```json
{
  "field_id": "aw2025_policy",
  "label": "CHÍNH SÁCH BẢO MẬT EN",
  "type": "Agreement",
  "section_name": "CHÍNH SÁCH & ĐIỀU KHOẢN",
  "checkbox_label": "Tôi đã đọc và đồng ý với chính sách bảo mật (bắt buộc) EN",
  "translation": {
    "en_sectionname": "PRIVACY POLICY & TERMS",
    "en_label": "PRIVACY POLICY",
    "en_checkboxlabel": "I have read and agree to the privacy policy (required)",
    "en_agreementcontent": "<div><b>1. Purpose of information collection includes:</b> Pre-registration, contract completion...</div>"
  }
}
```

### Translation Result

When translating to English, the system will:
- Use "PRIVACY POLICY" for the label (instead of Google Translate)
- Use "PRIVACY POLICY & TERMS" for the section name
- Use "I have read and agree to the privacy policy (required)" for the checkbox label
- Use the pre-defined HTML content for agreement content

## Benefits

1. **Performance**: Faster translation by avoiding API calls for pre-defined content
2. **Accuracy**: Consistent translations for important legal/technical terms
3. **Cost Savings**: Reduced Google Translate API usage
4. **Flexibility**: Can still use Google Translate for missing translations
5. **Maintainability**: Easy to update translations without code changes

## Testing

The implementation includes comprehensive logging to track:
- Which translations are using pre-defined values
- Which translations fall back to Google Translate
- Translation object availability and completeness

## Integration with Existing Code

The implementation is backward compatible:
- Fields without translation objects work exactly as before
- Existing translation logic remains unchanged
- No breaking changes to existing APIs

## Future Enhancements

1. **Translation Management UI**: Web interface to manage translation objects
2. **Bulk Translation Import**: Import translations from CSV/Excel files
3. **Translation Validation**: Validate translation completeness
4. **Caching**: Cache translation objects for better performance
5. **Version Control**: Track translation changes over time
