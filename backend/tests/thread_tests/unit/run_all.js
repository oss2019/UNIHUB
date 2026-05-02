import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTestEnv } from '../utils/syncTestEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runnersToRun = [
    'Cloudinary/run_all.js',
    'Security/run_all.js',
    'Tags/run_all.js'
];

async function runAll() {
    // 🛡️ Auto-sync before ANY test starts
    await syncTestEnv();

    console.log("=========================================");
    console.log("🏛️ STARTING MASTER UNIT TEST RUNNER 🏛️");
    console.log("=========================================\n");

    let overallP = 0;

    for (const runnerName of runnersToRun) {
        const runnerPath = path.join(__dirname, runnerName);
        console.log(`\n▶️ Triggering Runner: ${runnerName}...`);
        
        // Run synchronously, inherit stdio
        const result = spawnSync('node', [runnerPath], { stdio: 'inherit' });
        
        if (result.status !== 0) {
            console.error(`\n❌ FAILED: Sub-runner ${runnerName} exited with code ${result.status}`);
            console.log(`\n🚨 ABORTING MASTER RUNNER: Stopping execution.`);
            process.exit(1);
        } else {
            console.log(`\n✅ SUCCESS: Sub-runner ${runnerName} verified completely.`);
            overallP++;
        }
    }

    console.log("\n=========================================");
    console.log("🏆 ALL UNIT TEST SUITES ACROSS ALL SCOPES PASSED 🏆");
    console.log(`📊 TOTAL SUB-RUNNERS VERIFIED: ${overallP}`);
    console.log("=========================================\n");
    process.exit(0);
}

runAll();
