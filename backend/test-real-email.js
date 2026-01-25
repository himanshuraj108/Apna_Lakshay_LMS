require('dotenv').config();
const nodemailer = require('nodemailer');
console.log('Nodemailer Type:', typeof nodemailer);
console.log('Nodemailer Keys:', Object.keys(nodemailer));
console.log('CreateTransporter Type:', typeof nodemailer.createTransporter);

async function testEmail() {
    console.log('Testing Email Service...');
    console.log('User:', process.env.EMAIL_USER);
    // Don't log password

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        console.log('Verifying transporter connection...');
        await transporter.verify();
        console.log('✅ Transporter connection verified!');

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Apna Lakshay Debugger',
            text: 'If you receive this, the email credentials and nodemailer configuration are CORRECT.'
        };

        console.log('Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);

    } catch (error) {
        console.error('❌ Email Test Failed:', error);
        console.error('Error Code:', error.code);
        console.error('Error Command:', error.command);
    }
}

testEmail();
