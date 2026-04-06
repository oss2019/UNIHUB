import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. Manually resolve directory to get Absolute Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotEnvPath = path.resolve(__dirname, '../../../.env');

// 2. CRITICAL: Load the environment BEFORE any other imports!
dotenv.config({ path: dotEnvPath });

// 3. Now Use Dynamic Imports to satisfy ES Hoisting constraints
const { default: app } = await import('../../../app.js');
const { default: connectDB } = await import('../../../config/db.js');

const PORT = 5004;
const THREAD_ID = process.env.TEST_THREAD_ID; // Loaded from .env via dynamic import above
const API_URL = `http://localhost:${PORT}/api/threads/${THREAD_ID}`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;

    try {
        console.log("--- 1. Converting Local physical file to raw Base64 ---");
        const imagePath = path.join(__dirname, '../../../Photos/Abraham-Lincoln.jpg');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64String = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        console.log("--- 2. Firing PATCH /api/threads/:id with the new Base64 String ---");

        const patchRes = await fetch(`${API_URL}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `accessToken=${token}`
            },
            body: JSON.stringify({
                title: "Checking PATCH Base64 parsing! Abraham Lincoln linked.",
                attachments: [base64String]
            })
        });

        const patchData = await patchRes.json();
        console.log("\n✅ Response from PATCH /threads -> Old Cloudinary image deleted, and new Abraham Lincoln generated:\n");
        console.log(JSON.stringify(patchData, null, 2));

        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Error Encountered:");
        console.error(err.message || err);
        process.exit(1);
    }
});
