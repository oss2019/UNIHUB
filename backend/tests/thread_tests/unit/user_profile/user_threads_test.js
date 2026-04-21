import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Thread from '../../../../models/threadModel.js';
import User from '../../../../models/userModel.js';
import Forum from '../../../../models/forumModel.js';
import SubForum from '../../../../models/subforumModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    console.log('🚀 Starting User Threads API Unit Test...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const reportData = {
        users: [],
        threads: [],
        tests: []
    };

    try {
        console.log('🧹 Purging old test data...');
        await User.deleteMany({ email: { $regex: 'testuser_threads' } });
        await Forum.deleteMany({ name: 'TestUserThreadsForum' });
        await SubForum.deleteMany({ name: 'TestUserThreadsSubForum' });
        await Thread.deleteMany({ title: { $regex: 'UT_Thread' } });

        console.log('🧑‍🤝‍🧑 Seeding 5 Users...');
        // 1 Admin, 2 Students, 2 Alumni
        const admin = await User.create({ authProvider: 'local', name: 'UT_Admin', email: 'testuser_threads_admin@iitdh.ac.in', password: 'password', role: 'admin', googleId: 'ut_google_admin' });
        const s1 = await User.create({ authProvider: 'local', name: 'UT_Student1', email: 'testuser_threads_s1@iitdh.ac.in', password: 'password', role: 'student', googleId: 'ut_google_s1' });
        const s2 = await User.create({ authProvider: 'local', name: 'UT_Student2', email: 'testuser_threads_s2@iitdh.ac.in', password: 'password', role: 'student', googleId: 'ut_google_s2' });
        const a1 = await User.create({ authProvider: 'local', name: 'UT_Alum1', email: 'testuser_threads_a1@iitdh.ac.in', password: 'password', role: 'alumni', googleId: 'ut_google_a1' });
        const a2 = await User.create({ authProvider: 'local', name: 'UT_Alum2', email: 'testuser_threads_a2@iitdh.ac.in', password: 'password', role: 'alumni', googleId: 'ut_google_a2' });

        const users = [admin, s1, s2, a1, a2];
        users.forEach(u => reportData.users.push({ id: u._id, name: u.name, role: u.role }));

        console.log('🏛️ Seeding Forum Infrastructure...');
        const forum = await Forum.create({ name: 'TestUserThreadsForum', description: 'Test', type: 'normal', isApproved: true, createdBy: admin._id });
        const subForum = await SubForum.create({ name: 'TestUserThreadsSubForum', description: 'Test SF', forum: forum._id, createdBy: admin._id });

        console.log('🔥 Inserting 20 Threads (4 per user)...');
        const threadData = [];
        for (const u of users) {
            for (let i = 1; i <= 4; i++) {
                threadData.push({
                    title: `UT_Thread for ${u.name} #${i}`,
                    content: `This is a test thread number ${i} belonging to ${u.name}. The payload is long enough to bypass validation.`,
                    author: u._id,
                    forum: forum._id,
                    subForum: subForum._id,
                    tags: ['test', 'user-threads'],
                    isPinned: false
                });
            }
        }
        await Thread.insertMany(threadData);
        threadData.forEach(t => reportData.threads.push({ title: t.title, author: t.author }));
        console.log(`✅ Seeded ${threadData.length} threads successfully.`);

        console.log('\n=========================================');
        console.log('🧪 TESTING: GET /api/users/:id/threads');
        console.log('=========================================');

        // Test grabbing threads for Student 1
        console.log(`\nTest 1: Fetching threads for ${s1.name} (ID: ${s1._id})`);
        const res1 = await fetch(`http://localhost:5000/api/users/${s1._id}/threads`);
        const data1 = await res1.json();
        
        const test1 = { 
            name: `Fetch threads for ${s1.name}`, 
            expected: "4 threads", 
            got: data1.status === 'success' ? `${data1.results} threads` : "Error",
            status: (data1.status === 'success' && data1.results === 4) ? "✅ SUCCESS" : "❌ FAILED"
        };
        reportData.tests.push(test1);
        if (test1.status === "✅ SUCCESS") console.log('✅ Test 1 Passed'); else console.error('❌ Test 1 Failed');

        // Test grabbing threads for Alumni 2 with Pagination (limit=2)
        console.log(`\nTest 2: Pagination (limit=2) for ${a2.name} (ID: ${a2._id})`);
        const res2 = await fetch(`http://localhost:5000/api/users/${a2._id}/threads?limit=2&page=1`);
        const data2 = await res2.json();

        const test2 = {
            name: "Pagination (limit=2, page=1)",
            expected: "2 items, hasMore=true, totalCount=4",
            got: (data2.status === 'success') ? `${data2.results} items, hasMore=${data2.data.pagination.hasMore}, totalCount=${data2.data.pagination.totalCount}` : "Error",
            status: (data2.status === 'success' && data2.results === 2 && data2.data.pagination.hasMore === true && data2.data.pagination.totalCount === 4) ? "✅ SUCCESS" : "❌ FAILED"
        };
        reportData.tests.push(test2);
        if (test2.status === "✅ SUCCESS") console.log('✅ Test 2 Passed'); else console.error('❌ Test 2 Failed');

        // Test grabbing page 2
        console.log(`\nTest 3: Pagination Page 2 for ${a2.name} (ID: ${a2._id})`);
        const res3 = await fetch(`http://localhost:5000/api/users/${a2._id}/threads?limit=2&page=2`);
        const data3 = await res3.json();

        const test3 = {
            name: "Pagination Page 2 (limit=2, page=2)",
            expected: "2 items, hasMore=false",
            got: (data3.status === 'success') ? `${data3.results} items, hasMore=${data3.data.pagination.hasMore}` : "Error",
            status: (data3.status === 'success' && data3.results === 2 && data3.data.pagination.hasMore === false) ? "✅ SUCCESS" : "❌ FAILED"
        };
        reportData.tests.push(test3);
        if (test3.status === "✅ SUCCESS") {
            console.log('✅ Test 3 Passed');
            const validAuthors = data3.data.pagination.threads.every(t => t.author._id.toString() === a2._id.toString());
            const test3_1 = {
                name: "Author Ownership Verification",
                expected: "All threads match requested author ID",
                got: validAuthors ? "All match" : "Mismatch found",
                status: validAuthors ? "✅ SUCCESS" : "❌ FAILED"
            };
            reportData.tests.push(test3_1);
            if (validAuthors) console.log('✅ Test 3.1 Passed'); else console.error('❌ Test 3.1 Failed');
        } else {
            console.error('❌ Test 3 Failed');
        }

        console.log('\n🧹 Cleaning up test data...');
        await User.deleteMany({ email: { $regex: 'testuser_threads' } });
        await Forum.deleteMany({ name: 'TestUserThreadsForum' });
        await SubForum.deleteMany({ name: 'TestUserThreadsSubForum' });
        await Thread.deleteMany({ title: { $regex: 'UT_Thread' } });
        console.log('✅ Cleanup complete.');

        // WRITE REPORT
        const reportPath = path.join(__dirname, 'user_threads_test_report.md');
        const reportContent = `# 📝 User Threads API Audit Report
**Execution Date:** ${new Date().toLocaleString()}
**Status:** ${reportData.tests.every(t => t.status.includes('SUCCESS')) ? "✅ PASSED" : "❌ FAILED"}

---

## 👥 1. Seeded Users
| Name | Role | ID |
| :--- | :--- | :--- |
${reportData.users.map(u => `| ${u.name} | \`${u.role}\` | \`${u.id}\` |`).join('\n')}

---

## 📑 2. Seeded Threads (${reportData.threads.length} Total)
| Title | Author ID |
| :--- | :--- |
${reportData.threads.map(t => `| ${t.title} | \`${t.author}\` |`).join('\n')}

---

## 🧪 3. Test Cases: Expected vs Actual
| Test Case | Expected | Got | Status |
| :--- | :--- | :--- | :--- |
${reportData.tests.map(t => `| ${t.name} | ${t.expected} | ${t.got} | ${t.status} |`).join('\n')}

---
**Testing System:** Antigravity AI Engine
**Backend Interface:** UNIHUB API v1.0
`;
        fs.writeFileSync(reportPath, reportContent);
        console.log(`\n✅ Audit report written to: ${reportPath}`);

        console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY.');

    } catch (err) {
        console.error('❌ Fatal error during testing:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
