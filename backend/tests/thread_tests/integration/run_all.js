import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTestEnv } from '../utils/syncTestEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsToRun = [
    'test_bulk_threads.js',
    'cloudinary_integration_test.js'
];

async function runAll() {
    // 🛡️ Auto-sync before ANY test starts
    await syncTestEnv();

    console.log("=========================================");
    console.log("🚀 STARTING INTEGRATION TEST RUNNER 🚀");
    console.log("=========================================\n");

    let overallP = 0;

    for (const testName of testsToRun) {
        const testPath = path.join(__dirname, testName);
        console.log(`\n▶️ Running: ${testName}...`);
        
        // Run synchronously, inherit stdio so that colors and output show inline
        const result = spawnSync('node', [testPath], { stdio: 'inherit' });
        
        if (result.status !== 0) {
            console.error(`\n❌ FAILED: ${testName} exited with code ${result.status}`);
            console.log(`\n🚨 ABORTING RUNNER: Due to failure in ${testName}, subsequent tests will not run.`);
            process.exit(1);
        } else {
            console.log(`\n✅ SUCCESS: ${testName} completed.`);
            overallP++;
        }
    }

    console.log("\n=========================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log(`📊 TOTAL SUITES PASSED: ${overallP}`);
    console.log("=========================================\n");
    process.exit(0);
}

runAll();
