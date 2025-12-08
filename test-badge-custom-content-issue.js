#!/usr/bin/env node

/**
 * Test badge_custom_content parsing issue
 */

console.log('🔍 TESTING badge_custom_content PARSING ISSUE');
console.log('═'.repeat(70));

// Current event data from API
const eventData = {
    "badge_custom_content": {},  // ← VẤN ĐỀ: Object rỗng thay vì string
    "badge_printing": true
};

// Current code logic
function getCurrentLogic(eventData) {
    const customContentField = eventData?.badge_custom_content;

    console.log('\n📋 Current Logic Test:');
    console.log('─'.repeat(70));
    console.log('badge_custom_content value:', customContentField);
    console.log('Type:', typeof customContentField);
    console.log('Is string?', typeof customContentField === 'string');
    console.log('Is empty object?', typeof customContentField === 'object' && Object.keys(customContentField).length === 0);

    if (!customContentField || typeof customContentField !== 'string') {
        console.log('❌ Result: No badge_custom_content configured (returns [])');
        return [];
    }

    console.log('✅ Result: Would process the config');
    return ['PROCESSED'];
}

// Proposed fix
function getProposedLogic(eventData) {
    let customContentField = eventData?.badge_custom_content;

    console.log('\n📋 Proposed Logic Test:');
    console.log('─'.repeat(70));
    console.log('badge_custom_content value:', customContentField);
    console.log('Type:', typeof customContentField);

    // Handle empty object case
    if (typeof customContentField === 'object' && Object.keys(customContentField).length === 0) {
        console.log('⚠️  Detected empty object, treating as no config');
        customContentField = null;
    }

    if (!customContentField || typeof customContentField !== 'string') {
        console.log('❌ Result: No badge_custom_content configured (returns [])');
        return [];
    }

    console.log('✅ Result: Would process the config');
    return ['PROCESSED'];
}

console.log('\n🧪 TEST 1: Empty Object (Current API Response)');
console.log('═'.repeat(70));
getCurrentLogic(eventData);
getProposedLogic(eventData);

console.log('\n🧪 TEST 2: Valid String Config');
console.log('═'.repeat(70));
const eventData2 = {
    "badge_custom_content": "Tên Công Ty,company_name"
};
getCurrentLogic(eventData2);
getProposedLogic(eventData2);

console.log('\n🧪 TEST 3: Null/Undefined');
console.log('═'.repeat(70));
const eventData3 = {
    "badge_custom_content": null
};
getCurrentLogic(eventData3);
getProposedLogic(eventData3);

console.log('\n═'.repeat(70));
console.log('💡 CONCLUSION');
console.log('═'.repeat(70));
console.log('\n⚠️  PROBLEM IDENTIFIED:');
console.log('Backend returns badge_custom_content as empty object {}');
console.log('Frontend expects it to be a string');
console.log('');
console.log('✅ SOLUTION OPTIONS:');
console.log('');
console.log('Option 1: Fix Backend');
console.log('  - Return string instead of object');
console.log('  - Example: "Tên Công Ty,company_name"');
console.log('');
console.log('Option 2: Fix Frontend (More Robust)');
console.log('  - Handle both string and object cases');
console.log('  - Treat empty object as no config');
console.log('');
console.log('🎯 RECOMMENDED: Option 2 (Frontend fix)');
console.log('  - More defensive coding');
console.log('  - Handles edge cases better');
console.log('  - Backward compatible');
