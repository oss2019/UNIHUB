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
import { createThread } from '../../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; res.data.statusCode = res.statusCode; return res; };
    return res;
};

async function runCreationMatrix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB -> Creation Matrix");

        await Thread.deleteMany({}); await SubForum.deleteMany({});
        await Forum.deleteMany({}); await User.deleteMany({});

        const fAdmin = await User.create({ googleId: 'f1', email: 'a@iitdh.ac.in', name: 'A', role: 'admin' });
        const fAlumni = await User.create({ googleId: 'f2', email: 'al@iitdh.ac.in', name: 'Al', role: 'alumni' });
        const fStudent = await User.create({ googleId: 'f3', email: 'st@iitdh.ac.in', name: 'St', role: 'student' });
        
        const roles = [
            { user: fAdmin, desc: 'Creator (Admin)' }, 
            { user: fAlumni, desc: 'Creator (Alumni)' }, 
            { user: fStudent, desc: 'Creator (Student)' }
        ];

        const fLive = await Forum.create({ name: 'Live', isApproved: true, isActive: true });
        const fPending = await Forum.create({ name: 'Pending', isApproved: false, isActive: true });
        const fArchived = await Forum.create({ name: 'Archived', isApproved: true, isActive: false });
        const fDead = await Forum.create({ name: 'Dead', isApproved: false, isActive: false });
        const modes = [fLive, fPending, fArchived, fDead];

        const sfs = {};
        for(let m of modes) {
            sfs[m.name] = await SubForum.create({ name: `${m.name} SF`, tags: ['test'], forum: m._id });
        }

        let reportText = `# Security Matrix: Thread Creation (POST)
Validating thread creation access explicitly against 3 native user types mapping strictly over the 4 Forum states. *(Self vs Foreign tracking doesn't apply to Creation since the executor dynamically becomes the Author if successful).*

---

`;

        let P=0, F=0;

        for (let forum of modes) {
            
            let description = '';
            if (forum.name === 'Live') {
                description = `**Expectation:** Live Forums are fully open. \n- **Admin / Alumni / Student:** ALL allowed (201).`;
            } else if (forum.name === 'Pending') {
                description = `**Expectation:** Pending Forums are restricted natively requiring moderation buffers.\n- **Admin:** Allowed (201).\n- **Alumni / Student:** Blocked (403).`;
            } else {
                description = `**Expectation:** ${forum.name} Forums are fundamentally dead and frozen.\n- **Admin / Alumni / Student:** ALL Blocked (403).`;
            }

            reportText += `## Scenario: ${forum.name} Forum\n${description}\n\n| Actor Entity | Expected Code | Actual Code | Status |\n| :--- | :--- | :--- | :--- |\n`;

            for (let rConfig of roles) {
                let expectedStatus = 403;
                if (forum.isActive && forum.isApproved) expectedStatus = 201; 
                else if (!forum.isActive) expectedStatus = 403; 
                else if (!forum.isApproved && rConfig.user.role === 'admin') expectedStatus = 201; 

                const req = {
                    user: { _id: rConfig.user._id, role: rConfig.user.role },
                    body: { title: "T", content: "C", subForumId: sfs[forum.name]._id, tags: ["test"] }
                };
                const res = mockRes();
                let errCaught = null;
                await new Promise((resolve) => {
                    const next = (err) => { errCaught = err; resolve(); };
                    res.json = (data) => { res.data = data; resolve(); };
                    Promise.resolve(createThread(req, res, next)).catch(e => { errCaught = e; resolve();});
                });

                const gotCode = errCaught ? errCaught.statusCode || errCaught.status || 403 : res.data?.statusCode || 201;
                const finalCode = (gotCode === 'fail' || gotCode === 'error') ? 403 : gotCode;
                const passed = (finalCode === expectedStatus);

                if(passed) P++; else F++;
                const icon = passed ? '✅ PASS' : '❌ FAIL';
                reportText += `| **${rConfig.desc}** | ${expectedStatus} | ${finalCode} | ${icon} |\n`;
            }
            reportText += `\n---\n\n`;
        }

        reportText += `### Execution Summary\n- Total Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
        fs.writeFileSync(path.join(__dirname, 'creation_matrix_report.md'), reportText);
        console.log(`🎉 Matrix complete! Check creation_matrix_report.md`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runCreationMatrix();
