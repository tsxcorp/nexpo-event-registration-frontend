#!/usr/bin/env node

/**
 * Test script to fetch visitor data and analyze badge_custom_content
 * Usage: node test-visitor-data.js
 */

const VISITOR_ID = '4433256000016955057';

// Read backend URL from environment or use default
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

console.log('🔍 Testing Visitor Data Fetch');
console.log('━'.repeat(60));
console.log('📋 Visitor ID:', VISITOR_ID);
console.log('🌐 Backend URL:', BACKEND_URL);
console.log('━'.repeat(60));

async function fetchVisitorData() {
    try {
        const url = `${BACKEND_URL}/api/visitors?visid=${VISITOR_ID}`;
        console.log('\n📡 Making request to:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return null;
        }

        const data = await response.json();
        console.log('\n✅ Data fetched successfully!');
        console.log('━'.repeat(60));

        return data;
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        return null;
    }
}

function analyzeVisitorData(data) {
    if (!data || !data.visitor) {
        console.log('❌ No visitor data found');
        return;
    }

    const visitor = data.visitor;

    console.log('\n📊 VISITOR BASIC INFO');
    console.log('━'.repeat(60));
    console.log('ID:', visitor.id);
    console.log('Name:', visitor.name);
    console.log('Email:', visitor.email);
    console.log('Phone:', visitor.phone);
    console.log('Company:', visitor.company);
    console.log('Job Title:', visitor.job_title);
    console.log('Event ID:', visitor.event_id);
    console.log('Event Name:', visitor.event_name);

    console.log('\n🎫 BADGE-RELATED FIELDS');
    console.log('━'.repeat(60));
    console.log('Badge QR:', visitor.badge_qr ? `${visitor.badge_qr.substring(0, 50)}...` : '(empty)');
    console.log('Badge QR Length:', visitor.badge_qr ? visitor.badge_qr.length : 0);
    console.log('Redeem QR:', visitor.redeem_qr ? `${visitor.redeem_qr.substring(0, 50)}...` : '(empty)');

    console.log('\n🎨 CUSTOM FIELDS');
    console.log('━'.repeat(60));

    let customFields = visitor.custom_fields;

    // Parse if it's a string
    if (typeof customFields === 'string') {
        try {
            customFields = JSON.parse(customFields);
            console.log('✅ Custom fields parsed from JSON string');
        } catch (e) {
            console.log('⚠️ Failed to parse custom_fields as JSON');
            console.log('Raw custom_fields:', customFields);
            return;
        }
    }

    if (customFields && typeof customFields === 'object') {
        console.log('Available custom fields:');
        Object.keys(customFields).forEach(key => {
            const value = customFields[key];
            console.log(`  • "${key}": "${value}"`);
        });

        // Test badge_custom_content extraction
        console.log('\n🧪 TESTING BADGE_CUSTOM_CONTENT EXTRACTION');
        console.log('━'.repeat(60));

        // Common field names to test
        const testFields = [
            'cng_company',
            'Company',
            'company',
            'Job Function',
            'job_function',
            'Position',
            'Title',
            'Tên Công Ty',
            'Công Ty'
        ];

        console.log('Testing common field names:');
        testFields.forEach(fieldName => {
            // Exact match
            if (customFields[fieldName]) {
                console.log(`  ✅ Found "${fieldName}": "${customFields[fieldName]}"`);
            }

            // Case insensitive match
            const lowerFieldName = fieldName.toLowerCase();
            for (const key of Object.keys(customFields)) {
                if (key.toLowerCase() === lowerFieldName && key !== fieldName) {
                    console.log(`  ✅ Found "${key}" (case insensitive match for "${fieldName}"): "${customFields[key]}"`);
                }
            }
        });

        // Simulate getCustomContent function
        console.log('\n🎯 SIMULATING getCustomContent() FUNCTION');
        console.log('━'.repeat(60));

        const simulateGetCustomContent = (fieldNames) => {
            const results = [];

            for (const fieldName of fieldNames) {
                // Try exact match
                if (customFields[fieldName] && String(customFields[fieldName]).trim()) {
                    results.push(String(customFields[fieldName]).trim().toUpperCase());
                    continue;
                }

                // Try case insensitive
                const lowerFieldName = fieldName.toLowerCase();
                for (const key of Object.keys(customFields)) {
                    if (key.toLowerCase() === lowerFieldName && String(customFields[key]).trim()) {
                        results.push(String(customFields[key]).trim().toUpperCase());
                        break;
                    }
                }
            }

            return results;
        };

        // Test with common configurations
        const testConfigs = [
            ['cng_company'],
            ['Company'],
            ['cng_company', 'Job Function'],
            ['Company', 'Position']
        ];

        testConfigs.forEach(config => {
            const result = simulateGetCustomContent(config);
            console.log(`Config: "${config.join(', ')}"`);
            console.log(`  Result: ${result.length > 0 ? result.join(' | ') : '(no content found)'}`);
        });

    } else {
        console.log('⚠️ No custom fields found or invalid format');
    }

    console.log('\n📋 CHECK-IN HISTORY');
    console.log('━'.repeat(60));
    if (visitor.check_in_history && Array.isArray(visitor.check_in_history)) {
        console.log(`Total check-ins: ${visitor.check_in_history.length}`);
        visitor.check_in_history.forEach((checkin, index) => {
            console.log(`  ${index + 1}. Time: ${checkin.checkintime}, Event ID: ${checkin.event_id || 'N/A'}`);
        });
    } else {
        console.log('No check-in history found');
    }

    console.log('\n📝 FULL RAW DATA (for debugging)');
    console.log('━'.repeat(60));
    console.log(JSON.stringify(data, null, 2));
}

// Main execution
(async () => {
    const data = await fetchVisitorData();

    if (data) {
        analyzeVisitorData(data);
    } else {
        console.log('\n❌ Failed to fetch visitor data');
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure backend server is running');
        console.log('2. Check NEXT_PUBLIC_BACKEND_API_URL in .env.local');
        console.log('3. Verify visitor ID is correct');
        console.log('4. Check network connectivity');
    }

    console.log('\n━'.repeat(60));
    console.log('✅ Test completed');
})();
