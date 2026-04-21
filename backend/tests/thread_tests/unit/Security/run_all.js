import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsToRun = [
    'Administration/test_admin_toggles.js',
    'Creation/test_creation_matrix.js',
    'Deletion/test_deletion_matrix.js',
    'Ghost_Attacks/test_ghost_id.js',
    'Modification/test_modification_matrix.js',
    'Schema_Validation/test_schema_enforcement.js',
    'Visibility/test_visibility_matrix.js'
];

console.log("=========================================");
console.log("🛡️ STARTING SECURITY UNIT TESTS 🛡️");
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
        console.log(`\n🚨 ABORTING SECURITY RUNNER`);
        process.exit(1);
    } else {
        console.log(`\n✅ SUCCESS: ${testName} completed.`);
        overallP++;
    }
}

console.log("\n=========================================");
console.log("🎉 ALL SECURITY UNIT TESTS PASSED!");
console.log(`📊 TOTAL SECURITY SUITES PASSED: ${overallP}`);
console.log("=========================================\n");
process.exit(0);
