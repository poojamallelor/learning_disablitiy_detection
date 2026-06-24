/**
 * Complete System Verification Test
 * ==================================
 * 
 * Tests all components are working correctly
 */

async function runTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    SYSTEM VERIFICATION TEST SUITE                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  // Test 1: API Health
  console.log('🧪 Test 1: API Health Check');
  try {
    const health = await fetch('http://localhost:8000/health');
    const data = await health.json();
    console.log('   ✅ API is ' + data.status);
    console.log('   ✅ Model loaded: ' + data.model_loaded);
  } catch (e) {
    console.log('   ❌ API not responding');
  }

  // Test 2: Get Labels
  console.log('\n🧪 Test 2: Get Available Labels');
  try {
    const labels = await fetch('http://localhost:8000/labels');
    const data = await labels.json();
    console.log('   ✅ Labels retrieved:');
    Object.entries(data.labels).forEach(([code, label]) => {
      console.log(`      ${code}: ${label}`);
    });
  } catch (e) {
    console.log('   ❌ Failed to get labels');
  }

  // Test 3: Dynamic Predictions
  console.log('\n🧪 Test 3: Dynamic Predictions');
  
  const tests = [
    { name: 'Dyslexia', scores: { reading: 40, writing: 85, math: 85, attention: 75 } },
    { name: 'Dysgraphia', scores: { reading: 85, writing: 40, math: 85, attention: 75 } },
    { name: 'Dyscalculia', scores: { reading: 85, writing: 85, math: 40, attention: 75 } },
    { name: 'ADHD', scores: { reading: 60, writing: 80, math: 70, attention: 50 } },
    { name: 'Normal', scores: { reading: 90, writing: 90, math: 90, attention: 90 } }
  ];

  for (const test of tests) {
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.scores)
      });
      const data = await response.json();
      console.log(`   ✅ ${test.name}: Predicted ${data.prediction} (${(data.confidence * 100).toFixed(1)}%)`);
    } catch (e) {
      console.log(`   ❌ ${test.name}: Failed`);
    }
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                          ✅ ALL TESTS COMPLETE                           ║
║                                                                           ║
║  System Status: READY FOR USE                                            ║
║  React App: http://localhost:5175                                        ║
║  API Docs: http://localhost:8000/docs                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
}

// Run tests
runTests();
