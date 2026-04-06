import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Forum from '../../models/dummyForumModel.js';
import SubForum from '../../models/dummySubForumModel.js';
import Thread from '../../models/threadModel.js';
import User from '../../models/userModel.js';

// ─────────────────────────────────────────────
//  DUMMY USERS (10 users to simulate real traffic)
// ─────────────────────────────────────────────
const usersData = Array.from({ length: 10 }).map((_, i) => ({
    googleId: `seed_g${i}`,
    email: `user${i}@iitdh.ac.in`,
    name: `Test User ${i}`,
    role: i === 0 ? 'admin' : (i < 5 ? 'alumni' : 'student')
}));

// ─────────────────────────────────────────────
//  7 FORUMS with requested states
//  1. General (Active, Approved)
//  2. Computer Science (Active, Approved)
//  3. Mechanical (Active, Approved)
//  4. Chemical (Active, Approved)
//  5. Electronics (Active, Not Approved)
//  6. Sciences (Inactive, Approved)
//  7. Mathematics (Inactive, Not Approved)
// ─────────────────────────────────────────────
const forumsData = [
    { name: 'General',          description: 'Open discussions', isActive: true, isApproved: true },
    { name: 'Computer Science', description: 'CS-specific threads', isActive: true, isApproved: true },
    { name: 'Mechanical',       description: 'Mech discussions', isActive: true, isApproved: true },
    { name: 'Chemical',         description: 'Chem discussions', isActive: true, isApproved: true },
    { name: 'Electronics',      description: 'ECE discussions', isActive: true, isApproved: false },
    { name: 'Sciences',         description: 'Core science', isActive: false, isApproved: true },
    { name: 'Mathematics',      description: 'Math theory', isActive: false, isApproved: false },
];

// Helper to generate a random number of threads
const generateThreads = (count, topic) => Array.from({ length: count }).map((_, i) => ({
    title: `Discussion about ${topic} #${i + 1}`,
    content: `This is an auto-generated high volume testing thread for ${topic}. The goal is to stress test the pagination and caching layers. Content block ${Math.random().toString(36).substring(7)}`,
    tags: [topic.toLowerCase().replace(/\s+/g, ''), 'general', 'test']
}));

// ─────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function seedBulk() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.\n');

        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});
        console.log('🧹 Cleaned all existing data.\n');

        // USERS
        const users = await User.insertMany(usersData);
        console.log(`👥 Created ${users.length} users.`);

        // FORUMS
        const forums = await Forum.insertMany(forumsData);
        console.log(`📁 Created ${forums.length} forums.`);

        // SUBFORUMS AND THREADS
        const allSubForums = [];
        let threadCount = 0;

        for (const forum of forums) {
            // Generate 4-5 subforums per forum
            for (let i = 1; i <= 5; i++) {
                const sfName = `${forum.name} SubTopic ${i}`;
                const createdSubForum = await SubForum.create({
                    name: sfName,
                    description: `Testing SubForum for ${forum.name}`,
                    forum: forum._id,
                    tags: [sfName.toLowerCase().replace(/\s+/g, '')],
                    createdBy: users[0]._id // admin
                });
                allSubForums.push(createdSubForum);

                // Generate 15-20 threads per subforum to easily test limit=20 pagination
                const threadDefs = generateThreads(Math.floor(Math.random() * 6) + 15, sfName);
                for (let j = 0; j < threadDefs.length; j++) {
                    const t = threadDefs[j];
                    const randomUser = users[j % users.length]; 
                    await Thread.create({
                        title: t.title,
                        content: t.content,
                        author: randomUser._id,
                        subForum: createdSubForum._id,
                        forum: forum._id, // Set forum accurately
                        tags: t.tags,
                        attachments: [],
                        isPinned: j === 0 
                    });
                    threadCount++;
                }
            }
        }

        console.log(`📂 Created ${allSubForums.length} subforums.`);
        console.log(`📝 Created ${threadCount} threads.\n`);

        console.log('════════════════════════════════════════');
        console.log('  SEED SUMMARY');
        console.log('════════════════════════════════════════');
        console.log(`  Users:     ${users.length}`);
        console.log(`  Forums:    ${forums.length}`);
        console.log(`  SubForums: ${allSubForums.length}`);
        console.log(`  Threads:   ${threadCount}`);
        console.log('════════════════════════════════════════');
        console.log('\n🎉 Bulk seed completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedBulk();
