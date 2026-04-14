import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsToRun = [
    'test_tags_advanced.js',
    'test_tags_empty.js',
    'test_tags_sanitization.js'
];

console.log("=========================================");
console.log("🏷️ STARTING TAGS UNIT TESTS 🏷️");
console.log("=========================================\n");

let overallP = 0;
let overallF = 0;

for (const testName of testsToRun) {
    const testPath = path.join(__dirname, testName);
    console.log(`\n▶️ Running: ${testName}...`);
    
    // Run synchronously, inherit stdio
    const result = spawnSync('node', [testPath], { stdio: 'inherit' });
    
    if (result.status !== 0) {
        console.error(`\n❌ FAILED: ${testName} exited with code ${result.status}`);
        overallF++;
        console.log(`\n🚨 ABORTING TAGS RUNNER`);
        process.exit(1);
    } else {
        console.log(`\n✅ SUCCESS: ${testName} completed.`);
        overallP++;
    }
}

console.log("\n=========================================");
console.log("🎉 ALL TAGS UNIT TESTS PASSED!");
console.log(`📊 TOTAL TAGS SUITES PASSED: ${overallP}`);
console.log("=========================================\n");
process.exit(0);
