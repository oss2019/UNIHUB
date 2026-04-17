import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { default: app } = await import('../../../../app.js');
const { default: connectDB } = await import('../../../../config/db.js');

const PORT = 5003;
const API_URL = `http://localhost:${PORT}/api/threads`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;
    const subForumId = process.env.TEST_SUBFORUM_ID;

    // Grabbing your exact literal text file chunk!
    const base64ImagePath = path.join(__dirname, '../../../../Photos_links/boy.txt');
    let base64Image = fs.readFileSync(base64ImagePath, 'utf8').trim();

    // Auto-fix if it has newlines or spaces copied randomly
    base64Image = base64Image.replace(/\s+/g, '');

    try {
        console.log("--- 1. Firing POST /api/threads with your custom Base64 String ---");

        const postRes = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `accessToken=${token}`
            },
            body: JSON.stringify({
                title: "Checking YOUR specific Base64 parsing!",
                content: "This thread was built entirely from the raw data:image string inside your text file.",
                subForumId: subForumId,
                tags: ["base64", "cloudinary", "intercepted", "custom"],
                attachments: [base64Image] // Your exact code running natively!
            })
        });

        const postData = await postRes.json();
        console.log("\n✅ Response from POST /threads -> It should convert the ugly base64 string to a secure URL automatically:\n");
        console.log(JSON.stringify(postData, null, 2));

        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Error Encountered:");
        console.error(err.message || err);
        process.exit(1);
    }
});
