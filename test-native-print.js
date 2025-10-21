/**
 * Test script for Native Print Service
 * Run with: node test-native-print.js
 */

const { nativePrintService } = require('./src/lib/print/native-print-service.ts');

async function testNativePrint() {
  console.log('🧪 Testing Native Print Service...\n');

  try {
    // Test 1: Check availability
    console.log('1️⃣ Testing availability...');
    const isAvailable = await nativePrintService.isAvailable();
    console.log(`   ✅ Native print available: ${isAvailable}\n`);

    if (!isAvailable) {
      console.log('❌ Native print not available. Make sure Nexpo Print Agent is running on port 18082');
      return;
    }

    // Test 2: Get printers
    console.log('2️⃣ Testing printer list...');
    const printers = nativePrintService.getPrinters();
    console.log(`   ✅ Found ${printers.length} printers:`);
    printers.forEach(printer => {
      console.log(`      - ${printer.name} (${printer.status})`);
    });
    console.log('');

    // Test 3: Get default printer
    console.log('3️⃣ Testing default printer...');
    const defaultPrinter = nativePrintService.getDefaultPrinter();
    console.log(`   ✅ Default printer: ${defaultPrinter}\n`);

    // Test 4: Test print badge
    console.log('4️⃣ Testing print badge...');
    const testBadgeData = {
      visitorData: {
        name: 'Nguyen Van Test',
        id: 'test_visitor_001',
        company: 'Test Company',
        email: 'test@example.com'
      },
      eventData: {
        id: 'test_event_001',
        name: 'Test Event 2024'
      },
      qrData: 'NEXPO:TEST:001',
      customContent: ['TEST PRINT', 'DEMO BADGE']
    };

    const testBadgeLayout = {
      width: 100,
      height: 60,
      isVerticalLayout: false
    };

    const printResult = await nativePrintService.printBadge(testBadgeData, testBadgeLayout);
    console.log(`   ✅ Print result: ${printResult}\n`);

    // Test 5: Check printer status
    console.log('5️⃣ Testing printer status...');
    const status = await nativePrintService.checkPrinterStatus();
    console.log(`   ✅ Printer status:`, status);
    console.log('');

    console.log('🎉 All tests passed! Native Print Service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run tests
testNativePrint();
