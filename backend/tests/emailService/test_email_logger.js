import 'dotenv/config';
import { 
  sendInstantNotificationEmail, 
  sendDigestEmail, 
  sendWorkOpportunityEmail 
} from '../../services/emailService.js';

const testRecipient = {
  name: 'Kira',
  email: 'kiraofthenote@gmail.com'
};

const testNotification = {
  message: 'This is a test instant notification!'
};

const testDigestData = {
  threads: [
    { title: 'Cool React Tips', primaryCommentCount: 5 },
    { title: 'MongoDB for Beginners', primaryCommentCount: 12 }
  ]
};

const testWorkRequest = {
  title: 'Senior Frontend Developer',
  description: 'Looking for a React expert.',
  requiredSkills: ['React', 'Node.js', 'Tailwind']
};

async function runTests() {
  console.log('🚀 Starting Email Service Console Logger Tests...\n');

  try {
    console.log('--- Test 1: Instant Notification ---');
    await sendInstantNotificationEmail(testRecipient, testNotification);

    console.log('\n--- Test 2: Weekly Digest (Student) ---');
    await sendDigestEmail(testRecipient, testDigestData);

    console.log('\n--- Test 3: Fortnightly Digest (Alumni) ---');
    const alumniRecipient = { name: 'Kira (Alumnus)', email: 'kiraofthenote@gmail.com' };
    await sendDigestEmail(alumniRecipient, testDigestData);

    console.log('\n--- Test 4: Work Opportunity ---');
    await sendWorkOpportunityEmail(testRecipient, testWorkRequest);

    console.log('\n✅ All tests finished. Check above for the logged emails.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
