#!/usr/bin/env node

/**
 * Test badge_custom_content extraction with actual field name
 */

const visitorData = {
    "id": "4433256000016955057",
    "name": "LONG TRẦN MINH",
    "email": "longsteph27@gmail.com",
    "company": "",
    "job_title": "",
    "custom_fields": {
        "company_name": "TSX"
    }
};

// Simulate getCustomContent function from page.tsx
function getCustomContent(visitor, badgeCustomContentConfig) {
    const customContentField = badgeCustomContentConfig;
    if (!customContentField || typeof customContentField !== 'string') {
        console.log('🎨 No badge_custom_content configured');
        return [];
    }

    console.log('🎨 Extracting custom content for fields:', customContentField);
    console.log('🎨 Visitor data custom_fields:', visitor.custom_fields);

    const fieldNames = customContentField.split(',').map(field => field.trim());
    const results = [];

    for (const fieldName of fieldNames) {
        console.log('🎨 Processing field:', fieldName);

        // Try direct field first
        if (visitor[fieldName]) {
            const value = visitor[fieldName];
            if (value && String(value).trim()) {
                console.log('✅ Found custom content in direct field:', fieldName, value);
                results.push(String(value).trim().toUpperCase());
                continue;
            }
        }

        // Try custom_fields
        const customFields = visitor.custom_fields;

        // Check exact match first
        if (customFields[fieldName] && String(customFields[fieldName]).trim()) {
            console.log('✅ Found custom content in custom_fields (exact match):', fieldName, customFields[fieldName]);
            results.push(String(customFields[fieldName]).trim().toUpperCase());
            continue;
        }

        // Check case insensitive match
        const lowerFieldName = fieldName.toLowerCase();
        for (const key of Object.keys(customFields)) {
            if (key.toLowerCase() === lowerFieldName && String(customFields[key]).trim()) {
                console.log('✅ Found custom content in custom_fields (case insensitive):', key, customFields[key]);
                results.push(String(customFields[key]).trim().toUpperCase());
                break;
            }
        }

        console.log('❌ Field not found or empty:', fieldName);
    }

    console.log('🎨 Final custom content results:', results);
    return results;
}

console.log('🧪 TESTING BADGE_CUSTOM_CONTENT EXTRACTION');
console.log('━'.repeat(60));
console.log('📋 Visitor:', visitorData.name);
console.log('📋 Available custom fields:', Object.keys(visitorData.custom_fields));
console.log('━'.repeat(60));

// Test different configurations
const testConfigs = [
    'cng_company',
    'Company',
    'company_name',
    'Company_Name',
    'COMPANY_NAME',
    'company_name,Job Function',
    'company_name,company',
];

console.log('\n🎯 TESTING DIFFERENT CONFIGURATIONS:\n');

testConfigs.forEach(config => {
    console.log(`\n📝 Config: "${config}"`);
    console.log('─'.repeat(60));
    const result = getCustomContent(visitorData, config);
    console.log(`✨ Result: ${result.length > 0 ? result.join(' | ') : '(no content found)'}`);

    if (result.length > 0) {
        console.log('\n🎫 Badge Preview:');
        console.log('┌─────────────────────────────┐');
        console.log('│        HEADER               │');
        console.log('├─────────────────────────────┤');
        console.log(`│  [QR]    ${visitorData.name.padEnd(17)} │`);
        result.forEach(content => {
            console.log(`│          ${content.padEnd(17)} │`);
        });
        console.log('├─────────────────────────────┤');
        console.log('│        FOOTER               │');
        console.log('└─────────────────────────────┘');
    }
});

console.log('\n━'.repeat(60));
console.log('✅ Test completed');
console.log('\n💡 RECOMMENDATION:');
console.log('   Use config: "company_name" to display TSX on badge');
console.log('   This will show: LONG TRẦN MINH + TSX');
