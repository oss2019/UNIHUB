import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL SERVICE
// Placeholder email transport using nodemailer.
// In development mode, emails are logged to console instead of sent.
// Configure SMTP credentials in .env for production.
//
// NOTE: No try-catch here — errors propagate to the calling controller's
// catchAsync wrapper, which forwards them to the global error handler.
// ─────────────────────────────────────────────────────────────────────────────

let transporter = null;

/**
 * getTransporter — Lazy-initialise the nodemailer transporter.
 * Falls back to a console-logger in development.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (
    // process.env.NODE_ENV === 'production' &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } 
  // else {
  //   // Development: log emails to console
  //   transporter = {
  //     sendMail: async (mailOptions) => {
  //       console.log('[EmailService][DEV] Would send email:');
  //       console.log(`  To:      ${mailOptions.to}`);
  //       console.log(`  Subject: ${mailOptions.subject}`);
  //       console.log(`  Body:    ${mailOptions.text || mailOptions.html?.substring(0, 200)}`);
  //       return { messageId: 'dev-mock-id' };
  //     },
  //   };
  // }

  return transporter;
};

const fromAddress =
  process.env.DIGEST_FROM_EMAIL || 'is24bm008@iitdh.ac.in';

/**
 * sendInstantNotificationEmail — Send an email for an instant notification.
 *
 * @param {Object} recipient     - User document with at least { email, name }
 * @param {Object} notification  - Notification document
 */
export const sendInstantNotificationEmail = async (recipient, notification) => {
  const transport = getTransporter();
  await transport.sendMail({
    from: `UNIHUB Notifications <${fromAddress}>`,
    to: recipient.email,
    subject: `[UNIHUB] ${notification.message}`,
    text: `Hi ${recipient.name},\n\n${notification.message}\n\nVisit UNIHUB to see more.\n\n— UNIHUB Team`,
  });
};

/**
 * sendDigestEmail — Send a digest email (weekly for students, fortnightly for alumni).
 *
 * @param {Object} recipient  - User document with at least { email, name }
 * @param {Object} digestData - { threads, periodStart, periodEnd }
 */
export const sendDigestEmail = async (recipient, digestData) => {
  const threadList = (digestData.threads || [])
    .map((t, i) => `  ${i + 1}. ${t.title} (${t.primaryCommentCount} comments)`)
    .join('\n');

  const transport = getTransporter();
  await transport.sendMail({
    from: `UNIHUB Digest <${fromAddress}>`,
    to: recipient.email,
    subject: '[UNIHUB] Your activity digest',
    text: `Hi ${recipient.name},\n\nHere are the top threads from your communities:\n\n${threadList}\n\nVisit UNIHUB for full details.\n\n— UNIHUB Team`,
  });
};

/**
 * sendWorkOpportunityEmail — Send an email about a new work opportunity.
 *
 * @param {Object} recipient   - User document with at least { email, name }
 * @param {Object} workRequest - WorkRequest document
 */
export const sendWorkOpportunityEmail = async (recipient, workRequest) => {
  const skills = workRequest.requiredSkills?.length
    ? `\nRequired skills: ${workRequest.requiredSkills.join(', ')}`
    : '';

  const transport = getTransporter();
  await transport.sendMail({
    from: `UNIHUB Opportunities <${fromAddress}>`,
    to: recipient.email,
    subject: `[UNIHUB] Work Opportunity: ${workRequest.title}`,
    text: `Hi ${recipient.name},\n\nA new work opportunity has been posted:\n\n${workRequest.title}\n${workRequest.description || ''}${skills}\n\nVisit UNIHUB to learn more and express interest.\n\n— UNIHUB Team`,
  });
};
