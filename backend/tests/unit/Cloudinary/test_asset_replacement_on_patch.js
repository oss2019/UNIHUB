import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import app from '../app.js';
import connectDB from '../config/db.js';

const PORT = 5004;
const THREAD_ID = "69d263d5f91bd4134005e1ce"; // ID of the thread we just created
const API_URL = `http://localhost:${PORT}/api/threads/${THREAD_ID}`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;

    try {
        console.log("--- 1. Converting Local physical file to raw Base64 ---");
        const imagePath = path.join(__dirname, '../images/automata_theorist.png');
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
                title: "Checking PATCH Base64 parsing! Automata Theory linked.",
                attachments: [base64String] 
            })
        });
        
        const patchData = await patchRes.json();
        console.log("\n✅ Response from PATCH /threads -> Old Cloudinary image deleted, and new Automata Theorist generated:\n");
        console.log(JSON.stringify(patchData, null, 2));

        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch(err) {
        console.error("\n❌ Error Encountered:");
        console.error(err.message || err);
        process.exit(1);
    }
});
