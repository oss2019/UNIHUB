import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { default: app } = await import('../../../../app.js');
const { default: connectDB } = await import('../../../../config/db.js');
const { cloudinary } = await import('../../../../utils/cloudinary.js');

const PORT = 5005;
const THREAD_ID = "69d263d5f91bd4134005e1ce"; 
const API_URL = `http://localhost:${PORT}/api/threads/${THREAD_ID}`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;

    try {
        console.log("--- Firing DELETE /api/threads/:id to cascade Cloudinary File Destruction ---");
        
        const deleteRes = await fetch(`${API_URL}`, {
            method: 'DELETE',
            headers: {
                'Cookie': `accessToken=${token}`
            }
        });
        
        const deleteData = await deleteRes.json();
        console.log("\n✅ Response from DELETE /threads -> Thread should be dropped and the automata file should vanish from your Cloudinary dashboard:\n");
        console.log(JSON.stringify(deleteData, null, 2));

        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch(err) {
        console.error("\n❌ Error Encountered:");
        console.error(err.message || err);
        process.exit(1);
    }
});
