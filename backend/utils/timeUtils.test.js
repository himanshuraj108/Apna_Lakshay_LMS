/**
 * Test file for time overlap detection
 * Run with: node backend/utils/timeUtils.test.js
 */

const { doTimeRangesOverlap, timeToMinutes, formatTimeRange } = require('./timeUtils');

console.log('🧪 Testing Time Overlap Detection\n');

// Test 1: Non-overlapping shifts (boundary touching)
console.log('Test 1: Boundary touching (6-11 vs 11-16)');
const test1 = doTimeRangesOverlap('06:00', '11:00', '11:00', '16:00');
console.log(`  Result: ${test1} (Expected: false)`);
console.log(`  ✅ ${test1 === false ? 'PASS' : 'FAIL'}\n`);

// Test 2: Overlapping shifts
console.log('Test 2: Overlapping (6-11 vs 9-14)');
const test2 = doTimeRangesOverlap('06:00', '11:00', '09:00', '14:00');
console.log(`  Result: ${test2} (Expected: true)`);
console.log(`  ✅ ${test2 === true ? 'PASS' : 'FAIL'}\n`);

// Test 3: Complete enclosure
console.log('Test 3: Complete enclosure (6-21 vs 11-16)');
const test3 = doTimeRangesOverlap('06:00', '21:00', '11:00', '16:00');
console.log(`  Result: ${test3} (Expected: true)`);
console.log(`  ✅ ${test3 === true ? 'PASS' : 'FAIL'}\n`);

// Test 4: Reverse enclosure
console.log('Test 4: Reverse enclosure (11-16 vs 6-21)');
const test4 = doTimeRangesOverlap('11:00', '16:00', '06:00', '21:00');
console.log(`  Result: ${test4} (Expected: true)`);
console.log(`  ✅ ${test4 === true ? 'PASS' : 'FAIL'}\n`);

// Test 5: Identical ranges
console.log('Test 5: Identical ranges (6-11 vs 6-11)');
const test5 = doTimeRangesOverlap('06:00', '11:00', '06:00', '11:00');
console.log(`  Result: ${test5} (Expected: true)`);
console.log(`  ✅ ${test5 === true ? 'PASS' : 'FAIL'}\n`);

// Test 6: Non-overlapping with gap
console.log('Test 6: Non-overlapping with gap (6-11 vs 16-21)');
const test6 = doTimeRangesOverlap('06:00', '11:00', '16:00', '21:00');
console.log(`  Result: ${test6} (Expected: false)`);
console.log(`  ✅ ${test6 === false ? 'PASS' : 'FAIL'}\n`);

// Test 7: Your specific example (6-16 vs 11-21)
console.log('Test 7: Partial overlap (6-16 vs 11-21)');
const test7 = doTimeRangesOverlap('06:00', '16:00', '11:00', '21:00');
console.log(`  Result: ${test7} (Expected: true)`);
console.log(`  ✅ ${test7 === true ? 'PASS' : 'FAIL'}\n`);

// Test 8: Your specific example (6-16 vs 6-11)
console.log('Test 8: Enclosing (6-16 vs 6-11)');
const test8 = doTimeRangesOverlap('06:00', '16:00', '06:00', '11:00');
console.log(`  Result: ${test8} (Expected: true)`);
console.log(`  ✅ ${test8 === true ? 'PASS' : 'FAIL'}\n`);

// Test formatting
console.log('Test 9: Time range formatting');
const formatted = formatTimeRange('06:00', '21:00');
console.log(`  Result: "${formatted}"`);
console.log(`  ✅ ${formatted.includes('AM') && formatted.includes('PM') ? 'PASS' : 'FAIL'}\n`);

// Summary
const allTests = [test1 === false, test2 === true, test3 === true, test4 === true,
test5 === true, test6 === false, test7 === true, test8 === true];
const passCount = allTests.filter(t => t).length;
console.log(`\n📊 Results: ${passCount}/${allTests.length} tests passed`);

if (passCount === allTests.length) {
    console.log('✅ All tests passed!');
} else {
    console.log('❌ Some tests failed');
    process.exit(1);
}
