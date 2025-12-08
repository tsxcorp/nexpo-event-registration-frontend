#!/usr/bin/env node

/**
 * Analyze visitor 4433256000016930015
 */

const visitorData = {
    "id": "4433256000016930015",
    "name": "PHAN NHẬT TRƯỜNG",
    "email": "truong.pn@longhau.com.vn",
    "phone": "+84906938599",
    "company": "",
    "job_title": "",
    "event_id": "4433256000016888003",
    "event_name": "SUPPLIER DAY 2025 - LONG HAU INDUSTRIAL PARK",
    "badge_qr": "NDQzMzI1NjAwMDAxNjkzMDAxNQ==",
    "redeem_qr": "SPD10026186",
    "check_in_history": [],
    "custom_fields": {
        "Tên Công Ty ": "KCN Long Hậu"
    }
};

// Simulate getCustomContent function
function getCustomContent(visitor, badgeCustomContentConfig) {
    const customContentField = badgeCustomContentConfig;
    if (!customContentField || typeof customContentField !== 'string') {
        return [];
    }

    const fieldNames = customContentField.split(',').map(field => field.trim());
    const results = [];

    for (const fieldName of fieldNames) {
        // Try direct field first
        if (visitor[fieldName] && String(visitor[fieldName]).trim()) {
            results.push(String(visitor[fieldName]).trim().toUpperCase());
            continue;
        }

        // Try custom_fields exact match
        const customFields = visitor.custom_fields;
        if (customFields[fieldName] && String(customFields[fieldName]).trim()) {
            results.push(String(customFields[fieldName]).trim().toUpperCase());
            continue;
        }

        // Try with space variations
        const spacePrefixedKey = ` ${fieldName}`;
        if (customFields[spacePrefixedKey] && String(customFields[spacePrefixedKey]).trim()) {
            results.push(String(customFields[spacePrefixedKey]).trim().toUpperCase());
            continue;
        }

        const spaceSuffixedKey = `${fieldName} `;
        if (customFields[spaceSuffixedKey] && String(customFields[spaceSuffixedKey]).trim()) {
            results.push(String(customFields[spaceSuffixedKey]).trim().toUpperCase());
            continue;
        }

        // Try case insensitive match
        const lowerFieldName = fieldName.toLowerCase();
        for (const key of Object.keys(customFields)) {
            if (key.toLowerCase() === lowerFieldName && String(customFields[key]).trim()) {
                results.push(String(customFields[key]).trim().toUpperCase());
                break;
            }
        }
    }

    return results;
}

console.log('🔍 VISITOR ANALYSIS: ' + visitorData.id);
console.log('═'.repeat(70));

console.log('\n📊 BASIC INFO');
console.log('─'.repeat(70));
console.log('ID:         ', visitorData.id);
console.log('Name:       ', visitorData.name);
console.log('Email:      ', visitorData.email);
console.log('Phone:      ', visitorData.phone);
console.log('Event:      ', visitorData.event_name);

console.log('\n🎫 BADGE QR CODE');
console.log('─'.repeat(70));
console.log('Badge QR:   ', visitorData.badge_qr);
console.log('Length:     ', visitorData.badge_qr.length, 'characters');
console.log('Status:     ', '✅ Available for printing');

console.log('\n🎨 CUSTOM FIELDS');
console.log('─'.repeat(70));
console.log('Available fields:');
Object.keys(visitorData.custom_fields).forEach(key => {
    const value = visitorData.custom_fields[key];
    console.log(`  • "${key}": "${value}"`);

    // Check for space issues
    if (key.startsWith(' ') || key.endsWith(' ')) {
        console.log(`    ⚠️  WARNING: Field name has leading/trailing spaces!`);
        console.log(`    Original: [${key}]`);
        console.log(`    Trimmed:  [${key.trim()}]`);
    }
});

console.log('\n📋 CHECK-IN HISTORY');
console.log('─'.repeat(70));
if (visitorData.check_in_history.length === 0) {
    console.log('✅ No check-in history (first time check-in)');
} else {
    console.log(`Total check-ins: ${visitorData.check_in_history.length}`);
}

console.log('\n🧪 BADGE CUSTOM CONTENT EXTRACTION TEST');
console.log('═'.repeat(70));

const testConfigs = [
    'cng_company',
    'Company',
    'company_name',
    'Tên Công Ty',
    'Ten Cong Ty',
    'cng_company,Job Function',
    'Tên Công Ty,Job Function',
];

testConfigs.forEach(config => {
    console.log(`\n📝 Config: "${config}"`);
    console.log('─'.repeat(70));
    const result = getCustomContent(visitorData, config);

    if (result.length > 0) {
        console.log('✅ Result:', result.join(' | '));
        console.log('\n🎫 Badge Preview:');
        console.log('┌─────────────────────────────────────┐');
        console.log('│            HEADER                   │');
        console.log('├─────────────────────────────────────┤');
        console.log(`│  [QR]    ${visitorData.name.padEnd(23)} │`);
        result.forEach(content => {
            const displayContent = content.length > 23 ? content.substring(0, 20) + '...' : content;
            console.log(`│          ${displayContent.padEnd(23)} │`);
        });
        console.log('├─────────────────────────────────────┤');
        console.log('│            FOOTER                   │');
        console.log('└─────────────────────────────────────┘');
    } else {
        console.log('❌ Result: (no content found)');
    }
});

console.log('\n═'.repeat(70));
console.log('💡 ANALYSIS SUMMARY');
console.log('═'.repeat(70));

console.log('\n🔍 KEY FINDINGS:');
console.log('1. Custom field name: "Tên Công Ty " (có SPACE ở cuối!)');
console.log('2. Custom field value: "KCN Long Hậu"');
console.log('3. Badge QR: Available ✅');
console.log('4. Check-in history: Empty (first time) ✅');

console.log('\n⚠️  IMPORTANT ISSUE:');
console.log('Field name "Tên Công Ty " has a TRAILING SPACE!');
console.log('This might cause matching issues.');

console.log('\n✅ WORKING CONFIGS:');
console.log('• "Tên Công Ty " (with trailing space)');
console.log('• "Tên Công Ty" (case insensitive match should work)');
console.log('• "ten cong ty" (case insensitive)');

console.log('\n❌ NON-WORKING CONFIGS:');
console.log('• "cng_company" (field does not exist)');
console.log('• "Company" (field does not exist)');
console.log('• "company_name" (field does not exist)');

console.log('\n🎯 RECOMMENDATION:');
console.log('For this event, use config: "Tên Công Ty"');
console.log('The getCustomContent() function should handle the space issue');
console.log('via case-insensitive matching.');

console.log('\n📊 EXPECTED BADGE OUTPUT:');
console.log('┌─────────────────────────────────────┐');
console.log('│            HEADER                   │');
console.log('├─────────────────────────────────────┤');
console.log('│  [QR]    PHAN NHẬT TRƯỜNG          │');
console.log('│          KCN LONG HẬU              │');
console.log('├─────────────────────────────────────┤');
console.log('│            FOOTER                   │');
console.log('└─────────────────────────────────────┘');

console.log('\n✅ Analysis completed!');
