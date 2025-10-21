/**
 * Test script for Nexpo Print Agent API
 * Run with: node test-agent-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:18082';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 18082,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAgentAPI() {
  console.log('🧪 Testing Nexpo Print Agent API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest('/v1/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('');

    // Test 2: List printers
    console.log('2️⃣ Testing printers endpoint...');
    const printersResponse = await makeRequest('/v1/printers');
    console.log(`   Status: ${printersResponse.status}`);
    console.log(`   Printers:`, printersResponse.data.printers);
    console.log(`   Default: ${printersResponse.data.defaultPrinter}`);
    console.log('');

    // Test 3: Print badge
    console.log('3️⃣ Testing print endpoint...');
    const printData = {
      requestId: 'test_' + Date.now(),
      printer: 'BIXOLON SLP-TX403',
      template: 'visitor_v1',
      data: {
        fullName: 'Nguyen Van Test',
        company: 'Test Company',
        qr: 'NEXPO:TEST:' + Date.now(),
        customContent: ['TEST PRINT', 'DEMO BADGE']
      },
      options: {
        dither: true,
        speed: 5,
        density: 10,
        orientation: 'portrait'
      },
      copies: 1
    };

    const printResponse = await makeRequest('/v1/print', 'POST', printData);
    console.log(`   Status: ${printResponse.status}`);
    console.log(`   Response:`, printResponse.data);
    console.log('');

    // Test 4: Set default printer
    console.log('4️⃣ Testing set default printer...');
    const setDefaultData = { printer: 'BIXOLON SLP-TX403' };
    const setDefaultResponse = await makeRequest('/v1/printers/default', 'POST', setDefaultData);
    console.log(`   Status: ${setDefaultResponse.status}`);
    console.log(`   Response:`, setDefaultResponse.data);
    console.log('');

    console.log('🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testAgentAPI();
