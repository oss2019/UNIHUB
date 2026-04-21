import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../../.env');

export async function syncTestEnv() {
    console.log("🔄 Synchronizing test environment with database...");
    
    // Load current .env
    dotenv.config({ path: envPath });

    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI not found in .env. Skipping sync.");
        return;
    }

    try {
        // Connect if not already connected (mongoose.connection.readyState)
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}), 'users');
        const Thread = mongoose.models.Thread || mongoose.model('Thread', new mongoose.Schema({}), 'threads');
        const SubForum = mongoose.models.SubForum || mongoose.model('SubForum', new mongoose.Schema({}), 'subforums');
        const Forum = mongoose.models.Forum || mongoose.model('Forum', new mongoose.Schema({}), 'forums');

        const [user, thread, subforum, forum] = await Promise.all([
            User.findOne(),
            Thread.findOne(),
            SubForum.findOne(),
            Forum.findOne()
        ]);

        let envContent = fs.readFileSync(envPath, 'utf8');
        let needsUpdate = false;

        if (user) {
            const userId = user._id.toString();
            
            // Update TEST_USER_ID
            if (process.env.TEST_USER_ID !== userId) {
                if (process.env.TEST_USER_ID) {
                    envContent = envContent.replace(/TEST_USER_ID=.*/, `TEST_USER_ID=${userId}`);
                } else {
                    envContent += `\nTEST_USER_ID=${userId}`;
                }
                needsUpdate = true;
            }

            const secret = process.env.JWT_SECRET;
            const newToken = jwt.sign({ id: userId }, secret, { expiresIn: '365d' });
            
            // Update TEST_JWT if it changed or is missing
            if (!process.env.TEST_JWT || process.env.TEST_JWT !== newToken) {
                if (process.env.TEST_JWT) {
                    envContent = envContent.replace(/TEST_JWT=.*/, `TEST_JWT=${newToken}`);
                } else {
                    envContent += `\nTEST_JWT=${newToken}`;
                }
                needsUpdate = true;
            }
        }

        const mappings = [
            { key: 'TEST_THREAD_ID', doc: thread },
            { key: 'TEST_SUBFORUM_ID', doc: subforum },
            { key: 'TEST_FORUM_ID', doc: forum }
        ];

        for (const { key, doc } of mappings) {
            if (doc) {
                const idStr = doc._id.toString();
                if (process.env[key] !== idStr) {
                    if (process.env[key]) {
                        const regex = new RegExp(`${key}=.*`);
                        envContent = envContent.replace(regex, `${key}=${idStr}`);
                    } else {
                        envContent += `\n${key}=${idStr}`;
                    }
                    needsUpdate = true;
                }
            }
        }

        if (needsUpdate) {
            fs.writeFileSync(envPath, envContent);
            console.log("✅ .env file automatically synchronized with latest DB state.");
            // Re-load to update process.env
            dotenv.config({ path: envPath });
        } else {
            console.log("✨ .env file is already up to date.");
        }

        return process.env;

    } catch (err) {
        console.error("⚠️ Failed to auto-sync test environment:", err.message);
        return process.env;
    } finally {
        await mongoose.disconnect();
    }
}
