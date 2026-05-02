import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMasterGauntlet() {
    console.log("=========================================================");
    console.log("🌍 STARTING GLOBAL BACKEND TEST MASTER 🌍");
    console.log("=========================================================\n");

    const categories = [
        { name: "Threads & Cloudinary", path: "thread_tests/run_all.js" }
    ];

    let overallSuccess = true;

    for (const category of categories) {
        console.log(`\n🔥 PHASE: Starting ${category.name}...`);
        const runnerPath = path.join(__dirname, category.path);
        
        const result = spawnSync('node', [runnerPath], { stdio: 'inherit' });
        
        if (result.status !== 0) {
            console.error(`\n❌ FAILED: ${category.name} suite failed with exit code ${result.status}`);
            overallSuccess = false;
            // For a master gauntlet, we might want to continue or halt. Halting is safer.
            break;
        }
    }

    if (overallSuccess) {
        console.log("\n=========================================================");
        console.log("🏆 GLOBAL MASTER GAUNTLET PASSED SUCCESSFULLY! 🏆");
        console.log("=========================================================\n");
        process.exit(0);
    } else {
        console.log("\n=========================================================");
        console.log("🚨 GLOBAL MASTER GAUNTLET FAILED! 🚨");
        console.log("=========================================================\n");
        process.exit(1);
    }
}

runMasterGauntlet();
