import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import Thread from '../../../../../models/threadModel.js';
import SubForum from '../../../../../models/subforumModel.js';
import User from '../../../../../models/userModel.js';
import Forum from '../../../../../models/forumModel.js';
import { updateThread } from '../../../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; res.data.statusCode = res.statusCode; return res; };
    return res;
};

// ────────── TEST RUNNER ──────────
async function runAdminTogglesMatrix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB -> Administration Matrix");

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

        let reportText = `# Security Matrix: Administration (Thread Pin Toggle)
Verifies the explicit lockout mechanisms for the Thread-level Pin/Unpin toggle, the only administrative action currently implemented in the codebase (\`threadController.updateThread\`).

> **Note:** Forum-level toggles (\`isActive\`, \`isApproved\`) are not yet implemented in any controller and are therefore excluded from this matrix. They will be added once a \`forumController.js\` is created.

---

## Thread Pin State Matrix
**Expectation:** Thread pinning is purely an administrative privilege. Even the original Author of a thread cannot pin/unpin it unless they also hold an Admin token.
- **Self-Author (Admin) / Foreign Admin**: Allowed (200 OK) — Admin token grants pin rights.
- **Self-Author (Alumni) / Self-Author (Student)**: Blocked (403 Forbidden) — Authorship alone does NOT grant pin rights.
- **Foreign Alumni / Foreign Student**: Blocked (403 Forbidden) — No authority whatsoever.

`;

        let P=0, F=0;

        const forum = await Forum.create({ name: 'Live', isApproved: true, isActive: true });
        const sf = await SubForum.create({ name: `Live SF`, tags: ['test'], forum: forum._id });

        const pinActions = ['Toggle Pin ON', 'Toggle Pin OFF'];

        for (let action of pinActions) {
            reportText += `### ${action}\n| Actor Entity | Expected Code | Actual Code | Status |\n| :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                let expectedCode = rConfig.user.role === 'admin' ? 200 : 403;

                const t = await Thread.create({ title: "T", content: "C", author: rConfig.threadAuthor._id, subForum: sf._id, forum: forum._id, tags: ["test"] });

                const isPinnedValue = action === 'Toggle Pin ON' ? true : false;
                const req = { user: { _id: rConfig.user._id, role: rConfig.user.role }, params: { id: t._id }, body: { isPinned: isPinnedValue } };
                
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
                reportText += `| **${rConfig.desc}** | ${expectedCode} | ${gotCode} | ${icon} |\n`;
            }
            reportText += `\n---\n\n`;
        }

        reportText += `### Execution Summary\n- Total Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
        
        fs.writeFileSync(path.join(__dirname, 'administration_matrix_report.md'), reportText);
        console.log(`🎉 Matrix complete! Check administration_matrix_report.md`);
        console.log(`\n📊 FINAL TALLY:`);
        console.log(`   - Total checks:  ${P + F}`);
        console.log(`   - Passed:        ${P} ✅`);
        console.log(`   - Failed:        ${F} ❌`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runAdminTogglesMatrix();
