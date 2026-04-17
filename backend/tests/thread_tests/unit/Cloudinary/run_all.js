import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTestEnv } from '../../utils/syncTestEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsToRun = [
    'tiger_case.js',
    'test_asset_replacement_on_patch.js',
    'test_base64_to_cloudinary_post.js',
    'test_cloudinary_cascade_delete.js',
    'test_cloudinary_crud.js',
    'test_physical_asset_cloudinary_upload.js',
    'test_thread_attachments_api.js'
];

async function runAll() {
    // 🛡️ Auto-sync before ANY test starts
    await syncTestEnv();

    console.log("=========================================");
    console.log("🌥️ STARTING CLOUDINARY UNIT TESTS 🌥️");
    console.log("=========================================\n");

    let overallP = 0;

    for (const testName of testsToRun) {
        const testPath = path.join(__dirname, testName);
        console.log(`\n▶️ Running: ${testName}...`);
        
        // Run synchronously, inherit stdio
        const result = spawnSync('node', [testPath], { stdio: 'inherit' });
        
        if (result.status !== 0) {
            console.error(`\n❌ FAILED: ${testName} exited with code ${result.status}`);
            console.log(`\n🚨 ABORTING CLOUDINARY RUNNER`);
            process.exit(1);
        } else {
            console.log(`\n✅ SUCCESS: ${testName} completed.`);
            overallP++;
        }
    }

    console.log("\n=========================================");
    console.log("🎉 ALL CLOUDINARY UNIT TESTS PASSED!");
    console.log(`📊 TOTAL CLOUDINARY SUITES PASSED: ${overallP}`);
    console.log("=========================================\n");
    process.exit(0);
}

runAll();
