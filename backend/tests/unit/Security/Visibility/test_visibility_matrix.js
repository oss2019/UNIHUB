import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import Thread from '../../../../models/threadModel.js';
import { SubForum } from '../../../../models/subforumModel.js';
import User from '../../../../models/userModel.js';
import { Forum } from '../../../../models/forumModel.js';
import { getForumThreads, getSubForumThreads, getThread } from '../../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; res.data.statusCode = res.statusCode; return res; };
    return res;
};

async function runVisibilityMatrix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB -> Visibility Matrix");

        await Thread.deleteMany({}); await SubForum.deleteMany({});
        await Forum.deleteMany({}); await User.deleteMany({});

        const saStudent = await User.create({ googleId: 'f0', email: 'stu@iitdh.ac.in', name: 'SA', role: 'student' });
        const saAlumni  = await User.create({ googleId: 'f00', email: 'al@iitdh.ac.in', name: 'SA', role: 'alumni' });
        const saAdmin   = await User.create({ googleId: 'f000', email: 'ad@iitdh.ac.in', name: 'SA', role: 'admin' });

        const fAdmin = await User.create({ googleId: 'f1', email: 'a@iitdh.ac.in', name: 'A', role: 'admin' });
        const fAlumni = await User.create({ googleId: 'f2', email: 'l@iitdh.ac.in', name: 'A2', role: 'alumni' });
        const fStudent = await User.create({ googleId: 'f3', email: 's@iitdh.ac.in', name: 'S', role: 'student' });

        const roles = [
            { user: saAdmin, threadAuthor: saAdmin, desc: 'Self-Author (Admin)' },
            { user: saAlumni, threadAuthor: saAlumni, desc: 'Self-Author (Alumni)' },
            { user: saStudent, threadAuthor: saStudent, desc: 'Self-Author (Student)' },
            { user: fAdmin, threadAuthor: saStudent, desc: 'Foreign Admin' }, 
            { user: fAlumni, threadAuthor: saStudent, desc: 'Foreign Alumni' }, 
            { user: fStudent, threadAuthor: saAlumni, desc: 'Foreign Student' }
        ];

        const fLive = await Forum.create({ name: 'Live', isApproved: true, isActive: true });
        const fPending = await Forum.create({ name: 'Pending', isApproved: false, isActive: true });
        const fArchived = await Forum.create({ name: 'Archived', isApproved: true, isActive: false });
        const fDead = await Forum.create({ name: 'Dead', isApproved: false, isActive: false });
        const modes = [fLive, fPending, fArchived, fDead];

        let reportText = `# Security Matrix: Thread Visibility (3-Level GET)
Testing GET thread discovery partitioned into 3 distinct request levels across all 4 Forum Modes.

---

`;

        let P=0, F=0;

        for (let forum of modes) {
            // Build scenario description
            let desc = '';
            if (forum.name === 'Live') {
                desc = `**Expectation:** Fully public domain.\n- **Forum Level (GET /forum/:id):** All 6 roles see threads.\n- **SubForum Level (GET /subforum/:id):** All 6 roles see threads.\n- **Individual Level (GET /thread/:id):** All 6 roles see the thread.`;
            } else if (forum.name === 'Archived') {
                desc = `**Expectation:** Frozen but still fully visible to all roles at every level.\n- **Forum Level:** All 6 roles see threads.\n- **SubForum Level:** All 6 roles see threads.\n- **Individual Level:** All 6 roles see the thread.`;
            } else if (forum.name === 'Dead') {
                desc = `**Expectation:** Completely locked down. Only Admin tokens can access at any level.\n- **Forum Level:** Admin sees threads. Alumni/Student get 0 items.\n- **SubForum Level:** Admin sees threads. Alumni/Student get 0 items.\n- **Individual Level:** Admin sees thread. Alumni/Student get 403 Forbidden.`;
            } else if (forum.name === 'Pending') {
                desc = `**Expectation:** Awaiting approval. Admins have full access. Standard users can only view individual threads directly by ID.\n- **Forum Level:** Admin sees threads. Alumni/Student get 0 items.\n- **SubForum Level:** Admin sees threads. Alumni/Student get 0 items.\n- **Individual Level:** All 6 roles can see the thread (direct link access).`;
            }

            reportText += `## Scenario: ${forum.name} Forum\n${desc}\n\n`;

            // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FORUM LEVEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            reportText += `### Forum-Level Feed (getForumThreads)\n| Actor Entity | Expected | Actual | Status |\n| :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                await Thread.deleteMany({});
                await SubForum.deleteMany({});
                const sf = await SubForum.create({ name: `SF`, tags: ['test'], forum: forum._id });
                await Thread.create({ title: "T1", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });
                await Thread.create({ title: "T2", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });

                let expectedSize = 0;
                if (forum.name === 'Live' || forum.name === 'Archived') expectedSize = 2;
                else if (rConfig.user.role === 'admin') expectedSize = 2;

                const req = { user: { _id: rConfig.user._id, role: rConfig.user.role }, params: { id: forum._id }, query: {} };
                const res = mockRes();
                let errCaught = null;
                await new Promise((resolve) => {
                    const next = (err) => { errCaught = err; resolve(); };
                    res.json = (data) => { res.data = data; resolve(); };
                    Promise.resolve(getForumThreads(req, res, next)).catch(e => { errCaught = e; resolve(); });
                });

                const gotSize = res.data?.data?.pagination?.threads?.length || 0;
                const passed = (gotSize === expectedSize);
                if(passed) P++; else F++;
                const icon = passed ? 'âœ… PASS' : 'âŒ FAIL';
                reportText += `| **${rConfig.desc}** | ${expectedSize} items | ${gotSize} items | ${icon} |\n`;
            }

            // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SUBFORUM LEVEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            reportText += `\n### SubForum-Level Feed (getSubForumThreads)\n| Actor Entity | Expected | Actual | Status |\n| :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                await Thread.deleteMany({});
                await SubForum.deleteMany({});
                const sf = await SubForum.create({ name: `SF`, tags: ['test'], forum: forum._id });
                await Thread.create({ title: "T1", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });
                await Thread.create({ title: "T2", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });

                let expectedSize = 0;
                if (forum.name === 'Live' || forum.name === 'Archived') expectedSize = 2;
                else if (rConfig.user.role === 'admin') expectedSize = 2;

                const req = { user: { _id: rConfig.user._id, role: rConfig.user.role }, params: { id: sf._id }, query: {} };
                const res = mockRes();
                let errCaught = null;
                await new Promise((resolve) => {
                    const next = (err) => { errCaught = err; resolve(); };
                    res.json = (data) => { res.data = data; resolve(); };
                    Promise.resolve(getSubForumThreads(req, res, next)).catch(e => { errCaught = e; resolve(); });
                });

                const gotSize = res.data?.data?.pagination?.threads?.length || 0;
                const passed = (gotSize === expectedSize);
                if(passed) P++; else F++;
                const icon = passed ? 'âœ… PASS' : 'âŒ FAIL';
                reportText += `| **${rConfig.desc}** | ${expectedSize} items | ${gotSize} items | ${icon} |\n`;
            }

            // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ INDIVIDUAL LEVEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            reportText += `\n### Individual-Level View (getThread)\n| Actor Entity | Expected | Actual | Status |\n| :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                await Thread.deleteMany({});
                await SubForum.deleteMany({});
                const sf = await SubForum.create({ name: `SF`, tags: ['test'], forum: forum._id });
                const t = await Thread.create({ title: "T", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });

                // Individual level: Dead=admin only (403 for others), rest=all see (200)
                let expectedCode = 200;
                if (forum.name === 'Dead' && rConfig.user.role !== 'admin') expectedCode = 403;

                const req = { user: { _id: rConfig.user._id, role: rConfig.user.role }, params: { id: t._id } };
                const res = mockRes();
                let errCaught = null;
                await new Promise((resolve) => {
                    const next = (err) => { errCaught = err; resolve(); };
                    res.json = (data) => { res.data = data; resolve(); };
                    Promise.resolve(getThread(req, res, next)).catch(e => { errCaught = e; resolve(); });
                });

                const gotCode = errCaught ? errCaught.statusCode || errCaught.status || 403 : 200;
                const passed = (gotCode === expectedCode);
                if(passed) P++; else F++;
                const icon = passed ? 'âœ… PASS' : 'âŒ FAIL';
                reportText += `| **${rConfig.desc}** | ${expectedCode} | ${gotCode} | ${icon} |\n`;
            }

            reportText += `\n---\n\n`;
        }

        reportText += `### Execution Summary\n- Total Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
        fs.writeFileSync(path.join(__dirname, 'visibility_matrix_report.md'), reportText);
        console.log(`ðŸŽ‰ Matrix complete! Check visibility_matrix_report.md`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runVisibilityMatrix();
