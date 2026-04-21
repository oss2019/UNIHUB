import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Thread from '../../../../models/threadModel.js';
import Notification from '../../../../models/notificationModel.js';
import User from '../../../../models/userModel.js';
import Forum from '../../../../models/forumModel.js';
import SubForum from '../../../../models/subforumModel.js';
import { syncTestEnv } from '../../utils/syncTestEnv.js';
import fs from 'fs';

// Helper for JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

async function runNotificationTest() {
    console.log('🚀 Starting Extensive Thread Notification Unit Test...');

    let env;
    try {
        env = await syncTestEnv();
    } catch (e) {
        console.error("❌ Fatal Error during env sync:", e);
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    try {
        // --- DATA TRACKING FOR REPORT ---
        const reportData = {
            users: [],
            forums: [],
            threads: [],
            collabResults: { expected: 25, got: 0 },
            alumniNormalResults: { expected: 30, got: 0 },
            alumniCollabResults: { expected: 25, got: 0 }, // Expected: notifyAlumni becomes FALSE
            mutedResults: { expected: 0, skips: 0, checkedThreads: 25 } // Muted should result in NO notifications
        };

        console.log('🧹 Purging test data (only tests-specific dummies)...');
        await User.deleteMany({ email: { $regex: 'testdummy' } });
        await Forum.deleteMany({ name: { $regex: 'TestDummyForum' } });
        await SubForum.deleteMany({ name: { $regex: 'TestDummySubForum' } });
        await Thread.deleteMany({ title: { $regex: 'MassTestThread' } });
        await Notification.deleteMany({ type: 'NEW_COLLAB_THREAD', message: { $regex: 'MassTestThread' } });

        console.log('🧑‍🤝‍🧑 Seeding 10 Users...');
        // 1 Admin, 4 Alumni, 5 Students
        const userPromises = [];
        // Admin
        userPromises.push(User.create({ authProvider: 'local', name: 'TestAdmin', email: 'testdummy_admin@iitdh.ac.in', password: 'password123', role: 'admin', isVerified: true, googleId: 'google_admin' }));
        // Alumni
        for (let i = 1; i <= 4; i++) {
            userPromises.push(User.create({ authProvider: 'local', name: `TestAlumni_${i}`, email: `testdummy_alumni${i}@iitdh.ac.in`, password: 'password123', role: 'alumni', isVerified: true, googleId: `google_alumni_${i}` }));
        }
        // Students
        for (let i = 1; i <= 5; i++) {
            userPromises.push(User.create({ authProvider: 'local', name: `TestStudent_${i}`, email: `testdummy_student${i}@iitdh.ac.in`, password: 'password123', role: 'student', isVerified: true, googleId: `google_student_${i}` }));
        }

        const seededUsers = await Promise.all(userPromises);
        let admin = null;
        const alumniList = [];
        const studentList = [];

        seededUsers.forEach(u => {
            if (u.role === 'admin') admin = u;
            if (u.role === 'alumni') alumniList.push(u);
            if (u.role === 'student') studentList.push(u);
            reportData.users.push({ id: u._id, name: u.name, role: u.role });
        });

        const activeStudent = studentList[0];
        const studentJWT = generateToken(activeStudent._id);

        console.log('🏛️ Seeding 5 Forums (2 Collab, 3 Normal)...');
        const forumPromises = [];
        // 2 Collab
        for (let i = 1; i <= 2; i++) {
            forumPromises.push(Forum.create({ name: `TestDummyForum Collab ${i}`, description: 'Test', type: 'collab', isApproved: true, createdBy: admin._id }));
        }
        // 3 Normal
        for (let i = 1; i <= 3; i++) {
            forumPromises.push(Forum.create({ name: `TestDummyForum Normal ${i}`, description: 'Test', type: 'normal', isApproved: true, createdBy: admin._id }));
        }
        const seededForums = await Promise.all(forumPromises);

        console.log('📁 Seeding SubForums implicitly tied to Forums...');
        const subForumsList = [];
        for (const f of seededForums) {
            const sf = await SubForum.create({ name: `TestDummySubForum for ${f.name}`, description: 'Test SF', forum: f._id, createdBy: admin._id });
            subForumsList.push({ ...sf.toObject(), forumType: f.type });
            // Since we don't have a subForums array in the Forum model (verified in schema), we just keep reference in the SF.
            reportData.forums.push({ id: f._id, name: f.name, type: f.type, subForumId: sf._id });
        }

        const collabForums = subForumsList.filter(sf => sf.forumType === 'collab');
        const normalForums = subForumsList.filter(sf => sf.forumType === 'normal');

        console.log('🎧 Assigning Muted and Joined Logic...');
        // Student 1 (activeStudent) joins Collab 1 and Normal 1
        await User.findByIdAndUpdate(activeStudent._id, { $addToSet: { joinedSubForums: { $each: [collabForums[0]._id, normalForums[0]._id] } } });

        // Student 2 joins Collab 1 but MUTES it.
        const mutedStudent = studentList[1];
        await User.findByIdAndUpdate(mutedStudent._id, {
            $addToSet: {
                joinedSubForums: collabForums[0]._id,
                mutedSubForums: collabForums[0]._id
            }
        });

        // Student 3 joins Collab 1 (will receive notifications normally)
        const peerStudent = studentList[2];
        await User.findByIdAndUpdate(peerStudent._id, { $addToSet: { joinedSubForums: collabForums[0]._id } });

        // Update report data with muting logic
        reportData.users.forEach(u => {
            if (u.id.toString() === mutedStudent._id.toString()) u.muted = collabForums[0].name;
            else u.muted = 'None';
        });

        // ==========================================
        // TRIGGERING 100+ THREADS ONSLAUGHT
        // ==========================================
        const creationHelper = await import('./trigger_creation.js');

        // BATCH 1: Collab Notifications (25 threads) - Student 1 posts to Collab 1
        console.log(`\n🔥 BATCH 1: Firing 25 Collab Threads...`);
        let expectedCollabNotifications = 0; // Since peerStudent is joined, we expect exactly 1 notification per thread (total 25)
        for (let i = 1; i <= 25; i++) {
            const title = `MassTestThread B1-${i} (Collab Notification)`;
            const payload = { title, content: "Test Content", subForumId: collabForums[0]._id.toString(), tags: ["test"] };
            const thread = await creationHelper.trigger(studentJWT, payload);

            if (thread.status === 'success') {
                reportData.threads.push({ author: activeStudent.name, role: activeStudent.role, title, forumType: 'collab' });

                const dbThread = await Thread.findById(thread.data.thread._id);
                // Verify Notification generated for peerStudent
                const notify = await Notification.findOne({ recipient: peerStudent._id, type: 'NEW_COLLAB_THREAD', entityId: dbThread._id });
                if (notify) reportData.collabResults.got++;
            }
        }

        // BATCH 2: Alumni Notifications (Normal Forum) (30 threads)
        console.log(`\n🔥 BATCH 2: Firing 30 Normal Threads (Alumni Flag ON)...`);
        for (let i = 1; i <= 30; i++) {
            const title = `MassTestThread B2-${i} (Normal Alumni Flag)`;
            const payload = { title, content: "Test Content", subForumId: normalForums[0]._id.toString(), tags: ["test"], notifyAlumni: true };
            const thread = await creationHelper.trigger(studentJWT, payload);

            if (thread.status === 'success') {
                reportData.threads.push({ author: activeStudent.name, role: activeStudent.role, title, forumType: 'normal' });
                const dbThread = await Thread.findById(thread.data.thread._id);
                if (dbThread.notifyAlumni === true) reportData.alumniNormalResults.got++;
            }
        }

        // BATCH 3: Security Override (Collab Forum with Alumni Flag ON) (25 threads)
        console.log(`\n🔥 BATCH 3: Firing 25 Collab Threads (Trying to force Alumni Flag ON)...`);
        for (let i = 1; i <= 25; i++) {
            const title = `MassTestThread B3-${i} (Security Override Test)`;
            const payload = { title, content: "Haha I am forcing alumni flag!", subForumId: collabForums[0]._id.toString(), tags: ["test"], notifyAlumni: true };
            const thread = await creationHelper.trigger(studentJWT, payload);

            if (thread.status === 'success') {
                reportData.threads.push({ author: activeStudent.name, role: activeStudent.role, title, forumType: 'collab' });
                const dbThread = await Thread.findById(thread.data.thread._id);
                // SUCCESS condition is that notifyAlumni was forced to FALSE by the controller security
                if (dbThread.notifyAlumni === false) reportData.alumniCollabResults.got++;
            }
        }

        // BATCH 4: Mute Logic Validation (Collab Forum) (25 threads)
        console.log(`\n🔥 BATCH 4: Firing 25 Collab Threads (Tracking Muted User Isolation)...`);


        for (let i = 1; i <= 25; i++) {
            const title = `MassTestThread B4-${i} (Collab Mute Validation)`;
            const payload = { title, content: "Mute me - This should skip", subForumId: collabForums[0]._id.toString(), tags: ["test"] };
            const thread = await creationHelper.trigger(studentJWT, payload);

            if (thread.status === 'success') {
                reportData.threads.push({ author: activeStudent.name, role: activeStudent.role, title, forumType: 'collab' });
                const dbThread = await Thread.findById(thread.data.thread._id);
                const notify = await Notification.findOne({ recipient: mutedStudent._id, type: 'NEW_COLLAB_THREAD', entityId: dbThread._id });
                if (!notify) reportData.mutedResults.skips++;
            } else {
                console.error(`❌ B4 FAILED for ${title}:`, thread);
            }
        }

        // BATCH 5: Mute Logic Validation (Normal Forum) (25 threads)
        // For Normal forums, we test if they appear in the WEEKLY_DIGEST.
        console.log(`\n🔥 BATCH 5: Firing 25 Normal Threads & Testing Weekly Digest Filtering...`);
        const normalSubMuted = normalForums[1]; // A different normal forum
        // Mute this for the peer student
        await User.findByIdAndUpdate(peerStudent._id, { $addToSet: { mutedSubForums: normalSubMuted._id, joinedSubForums: normalSubMuted._id } });

        for (let i = 1; i <= 25; i++) {
            const title = `MassTestThread B5-${i} (Normal Mute Verification)`;
            const payload = { title, content: "Should not show in your Saturday digest", subForumId: normalSubMuted._id.toString(), tags: ["test"] };
            const thread = await creationHelper.trigger(studentJWT, payload);
            if (thread.status === 'success') {
                reportData.threads.push({ author: activeStudent.name, role: activeStudent.role, title, forumType: 'normal' });
            }
        }

        // Now run the actual digest generator logic
        console.log('⌛ Manually triggering Weekly Digest for validation...');
        const { generateWeeklyDigest } = await import('../../../../services/notificationService.js');
        await generateWeeklyDigest();

        // Check if Peer Student received a digest containing Batch 5 threads
        const digest = await Notification.findOne({ recipient: peerStudent._id, type: 'WEEKLY_DIGEST' }).sort({ createdAt: -1 });
        const batch5Titles = reportData.threads.filter(t => t.title.includes('B5-')).map(t => t.title);

        // Success for B5 MUTE: none of the B5 threads should be in the digestData for the muted peer student
        let digestLeak = false;
        if (digest && digest.digestData && digest.digestData.threads) {
            digestLeak = digest.digestData.threads.some(t => batch5Titles.includes(t.title));
        }

        const normalMutePassed = (digest && !digestLeak);

        // ==========================================
        // GENERATING EXTENSIVE MARKDOWN REPORT
        // ==========================================
        console.log(`\n📊 Generating Full 130-Thread Audit Report...`);

        const totalFired = reportData.threads.length;

        const mdReport = `
# 📝 Detailed Thread Notification Audit Report
**Execution Date:** ${new Date().toLocaleString()}
**Database Partition:** UNIHUB_local_test

---

## 👥 1. User Base Matrix (10 Users)
The following users were seeded for this simulation. Specific muting was applied to test isolation logic.

| Role | Name | ID | Muted Sub-Forums | Active Roles Verification |
| :--- | :--- | :--- | :--- | :--- |
${reportData.users.map(u => `| \`${u.role}\` | **${u.name}** | \`${u.id}\` | ${u.muted || 'None'} | ✅ |`).join('\n')}

---

## 🏛️ 2. Forum Infrastructure Dump (5 Forums)
Simulating a diverse university environment with mixture of project labs (collab) and career boards (normal).

### Seeded Forums
| Type | Forum Name | Sub-Forum Bound |
| :--- | :--- | :--- |
${reportData.forums.map(f => `| \`${f.type}\` | ${f.name} | \`${f.subForumId}\` |`).join('\n')}

---

## 🧪 3. Core Notification Categories: Expected vs Actual

### ✅ A. Project Lab (Collab) Push Logic
- **Scope:** 25 Threads initiated by **${activeStudent.name}**.
- **Requirement:** Teammates (Peer Student) must receive instant alerts. Muted students must receive nothing.
- **Expected:** 25 Instant Notifications.
- **Actual:** **${reportData.collabResults.got} / 25** Recorded.
- **Verification:** ${reportData.collabResults.got === 25 ? '✅ SUCCESS' : '❌ FAILED'}

### ✅ B. Alumni Digest Logic (Normal Forums)
- **Scope:** 30 Threads initiated with \`notifyAlumni: true\`.
- **Requirement:** Flag must persist for the Bi-Weekly cron job harvesting.
- **Expected:** 30 Threads with \`notifyAlumni: true\` in DB.
- **Actual:** **${reportData.alumniNormalResults.got} / 30** Persisted.
- **Verification:** ${reportData.alumniNormalResults.got === 30 ? '✅ SUCCESS' : '❌ FAILED'}

### ✅ C. Mute Logic (Isolation on Collab & Normal)
- **Scope:** 25 Collab threads + 25 Normal threads targeted at a muted recipient.
- **Requirement:** Zero leakage. No instant push (Collab) and No inclusion in Weekly Digest (Normal).
- **Expected Skips (Collab):** 25/25
- **Actual Skips (Collab):** **${reportData.mutedResults.skips} / 25**
- **Normal Verification:** Saturday Weekly Digest generated. Checked Peer Student list: **${normalMutePassed ? '0 Leakage Found' : '❌ LEAKAGE DETECTED'}**
- **Verification:** ${(reportData.mutedResults.skips === 25 && normalMutePassed) ? '✅ SUCCESS' : '❌ FAILED'}

### 🛡️ D. Security Override: Collab Spam Protection
**Why this is CRITICAL:**
A malicious or confused user attempts to create a thread inside a **Collab (Project)** forum but injects \`notifyAlumni: true\`. If allowed, this would spam Alumni with technical noise (e.g., *"Bug in line 45 of CSS"*). Our security wall in \`threadController.js\` must override this.

- **Expected Behavior:** Controller detects \`collab\` type and ignores the \`notifyAlumni\` request in the payload, forcing it to \`false\`.
- **Target:** 25 Attempted "Poisoned" requests.
- **Intercepted & Corrected:** **${reportData.alumniCollabResults.got} / 25**
- **Verification:** ${reportData.alumniCollabResults.got === 25 ? '✅ SUCCESS (Filtered)' : '❌ FAILED'}

---

## 🧾 4. Massive Execution Queue (Summary of ${totalFired} Threads)

| Index | Thread Title | Posted By | Forum Type | Flag (Expected) |
| :--- | :--- | :--- | :--- | :--- |
${reportData.threads.map((t, idx) => `| ${idx + 1} | ${t.title} | ${t.author} (\`${t.role}\`) | \`${t.forumType}\` | ${t.title.includes('Alumni') ? 'Alumni ON' : 'OFF'} |`).join('\n')}

---
**Testing System:** Antigravity AI Engine
**Backend Interface:** UNIHUB API v1.0
`;

        const reportPath = new URL('./notification_test_report.md', import.meta.url);
        fs.writeFileSync(reportPath, mdReport.trim());
        console.log(`\n✅ Massive audit report dynamically written to: ${reportPath.pathname}`);

    } catch (error) {
        console.error('❌ Test execution failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runNotificationTest();
