require('dotenv').config({ path: '../.env' });
const emailService = require('../services/emailService');

async function testEmail() {
    console.log('Testing Email Service Fallback System...');
    console.log('Primary User:', process.env.EMAIL_USER);
    console.log('Backup User:', process.env.BREVO_USER);
    console.log('Backup Host:', process.env.BREVO_HOST);

    // Test 1: Send a normal email
    try {
        console.log('\n--- Sending Test Email ---');
        const result = await emailService.sendAnnouncementEmail(
            [{ email: process.env.EMAIL_USER }], // Send to self
            'Test Email - Port 2525 Check',
            'This test verifies if the system can send email via Gmail, Brevo 587, or Brevo 2525.'
        );
        console.log('Result:', result ? 'Success' : 'Failed');
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testEmail();
