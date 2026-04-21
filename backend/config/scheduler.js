import cron from 'node-cron';
import {
  generateWeeklyDigest,
  generateFortnightlyDigest,
} from '../services/notificationService.js';

// ─────────────────────────────────────────────────────────────────────────────
// CRON SCHEDULER
// Schedules digest notification jobs.
// Imported in app.js — starts running as soon as the module loads.
// ─────────────────────────────────────────────────────────────────────────────

// Student weekly digest — every Saturday at 9:00 AM IST (3:30 AM UTC)
// Cron expression: minute hour day-of-month month day-of-week
cron.schedule('30 3 * * 6', async () => {
  console.log('[Scheduler] Running student weekly digest...');
  await generateWeeklyDigest();
});

// Alumni fortnightly digest — 1st and 15th of every month at 9:00 AM IST (3:30 AM UTC)
// True fortnightly scheduling with cron is tricky; using 1st & 15th as a close approximation.
cron.schedule('30 3 1,15 * *', async () => {
  console.log('[Scheduler] Running alumni fortnightly digest...');
  await generateFortnightlyDigest();
});

console.log('[Scheduler] Notification cron jobs registered.');
