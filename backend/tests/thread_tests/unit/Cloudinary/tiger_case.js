import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import { uploadBase64Attachments } from '../../../../services/cloudinaryService.js';

// Read tiger.txt
const tigerFile = path.join(__dirname, '../../../../Photos_links/tiger.txt');
const tigerContent = fs.readFileSync(tigerFile, 'utf-8').trim();

console.log("-----------------------------------------");
console.log("🐯 TIGER EDGE CASE ISOLATION TEST 🐯");
console.log("-----------------------------------------");
console.log(`Original Content inside tiger.txt:\n=> ${tigerContent}`);
console.log(`Starts with HTTP? ${tigerContent.startsWith('http')}`);
console.log("-----------------------------------------");

async function run() {
    try {
        console.log("Sending payload to cloudinaryService...");
        const result = await uploadBase64Attachments([tigerContent]);
        
        console.log("\n---- RESULTS ----");
        console.log("Returned Payload:");
        console.log(result);
        
        console.log("\n---- ANALYSIS ----");
        if (result[0].includes('res.cloudinary.com')) {
            console.log("✅ SUCCESS: The file was an external HTTP link, and the backend successfully CAPTURED it and uploaded it to your Cloudinary!");
            console.log(`New permanent link: ${result[0]}`);
        } else {
            console.log("❌ FAILED: The URL was either skipped or not correctly captured into Cloudinary.");
        }
    } catch (err) {
        console.log("ERROR:", err);
    }
    process.exit(0);
}

run();
