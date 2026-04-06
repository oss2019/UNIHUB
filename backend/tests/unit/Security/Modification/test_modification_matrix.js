import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import Thread from '../../../../models/threadModel.js';
import SubForum from '../../../../models/dummySubForumModel.js';
import User from '../../../../models/userModel.js';
import Forum from '../../../../models/dummyForumModel.js';
import { updateThread } from '../../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; res.data.statusCode = res.statusCode; return res; };
    return res;
};

async function runModificationMatrix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB -> Modification Matrix");

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

        let reportText = `# Security Matrix: Modification (Edit Text)
Testing textual editing modification vectors partitioned independently mapping across nested loop configurations sequentially.

---

`;

        const sfs = {};
        for(let m of modes) {
            sfs[m.name] = await SubForum.create({ name: `${m.name} SF`, tags: ['test'], forum: m._id });
        }

        let P=0, F=0;

        for (let forum of modes) {
            
            let description = `**Expectation:** Forum state is dynamically bypassed if the user possesses the absolute Thread ID.\n- **Self-Author (Admin/Alumni/Student)**: Permitted to Edit fundamentally via ownership tracking (200).\n- **Foreign (Admin/Alumni/Student)**: Strictly rejected from mutating foreign data streams (403).`;

            reportText += `## Scenario: ${forum.name} Forum\n${description}\n\n| Actor Entity | Action | Expected Code | Actual Code | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                const action = 'Edit_Text';
                let expectedCode = 403;
                if (rConfig.user._id.toString() === rConfig.threadAuthor._id.toString()) expectedCode = 200; // Native verification natively!

                const t = await Thread.create({ title: "T", content: "C", author: rConfig.threadAuthor._id, subForum: sfs[forum.name]._id, forum: forum._id, tags: ["test"] });

                const req = { user: { _id: rConfig.user._id, role: rConfig.user.role }, params: { id: t._id }, body: { content: "New text" } };
                
                const res = mockRes();
                let errCaught = null;
                await new Promise((resolve) => {
                    const next = (err) => { errCaught = err; resolve(); };
                    res.json = (data) => { res.data = data; resolve(); };
                    Promise.resolve(updateThread(req, res, next)).catch(e => { errCaught = e; resolve(); });
                });

                const gotCode = errCaught ? errCaught.statusCode || errCaught.status || 403 : res.data?.statusCode || 200;
                const passed = (gotCode === expectedCode);

                if(passed) P++; else F++;
                const icon = passed ? '✅ PASS' : '❌ FAIL';
                reportText += `| **${rConfig.desc}** | ${action} | ${expectedCode} | ${gotCode} | ${icon} |\n`;
            }
            reportText += `\n---\n\n`;
        }

        reportText += `### Execution Summary\n- Total Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
        fs.writeFileSync(path.join(__dirname, 'modification_matrix_report.md'), reportText);
        console.log(`🎉 Matrix complete! Check modification_matrix_report.md`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runModificationMatrix();
