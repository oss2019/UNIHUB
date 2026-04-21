import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTestEnv } from './utils/syncTestEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainRunners = [
    { name: 'UNIT TESTS', path: 'unit/run_all.js' },
    { name: 'INTEGRATION TESTS', path: 'integration/run_all.js' }
];

async function runEverything() {
    // 🛡️ Ensure the environment is fresh before the GAUNTLET begins
    await syncTestEnv();

    console.log("=========================================================");
    console.log("🏁 STARTING FULL BACKEND TEST GAUNTLET 🏁");
    console.log("=========================================================\n");

    let suitesPassed = 0;

    for (const runner of mainRunners) {
        const runnerPath = path.join(__dirname, runner.path);
        console.log(`\n🔥 PHASE: Starting ${runner.name}...`);
        
        // Run synchronously, inherit stdio for real-time progress
        const result = spawnSync('node', [runnerPath], { stdio: 'inherit' });
        
        if (result.status !== 0) {
            console.error(`\n❌ CRITICAL FAILURE in ${runner.name}.`);
            console.log("🚨 GAUNTLET ABORTED: Fix the failing suite before proceeding.");
            process.exit(1);
        } else {
            console.log(`\n✅ PHASE COMPLETE: ${runner.name} passed.`);
            suitesPassed++;
        }
    }

    console.log("\n=========================================================");
    console.log("🏆 CHAMPION! ALL UNIT AND INTEGRATION TESTS PASSED 🏆");
    console.log(`📊 PHASES COMPLETED: ${suitesPassed}/${mainRunners.length}`);
    console.log("=========================================================\n");
    process.exit(0);
}

runEverything();
