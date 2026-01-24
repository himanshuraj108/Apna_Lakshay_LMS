const nodemailer = require('nodemailer');

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️ Email credentials not configured in .env file');
}

// Create transporter with error handling
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('✅ Email transporter created successfully');
} catch (error) {
  console.error('❌ Failed to create email transporter:', error.message);
  // Create a dummy transporter to prevent crashes
  transporter = {
    sendMail: async () => {
      console.log('Email service not available - transporter not created');
      return { messageId: 'dummy' };
    }
  };
}

// Base email template
const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header .lakshay {
      background: linear-gradient(to right, #facc15, #d97706);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header .subtitle {
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.9;
    }
    .header .page-title {
      margin: 15px 0 0 0;
      font-size: 18px;
      font-weight: normal;
    }
    .content {
      padding: 40px 30px;
      color: #333;
      line-height: 1.8;
      font-size: 15px;
    }
    .login-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      margin: 25px 0;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .login-button:hover {
      transform: translateY(-2px);
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .highlight {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hamara <span class="lakshay">Lakshay</span></h1>
      <p class="subtitle">Library Management System</p>
      <p class="page-title">${title}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated email from Hamara Lakshay Library Management System.</p>
      <p>For any queries, please contact the admin.</p>
      <p style="margin-top: 15px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #667eea;">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Send credentials email
exports.sendCredentialsEmail = async (name, email, password) => {
  const content = `
    <h2>Welcome to Hamara Lakshay!</h2>
    <p>Dear ${name},</p>
    <p>Your student account has been created successfully. Below are your login credentials:</p>
    <div class="highlight">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p><strong>Important:</strong> We recommend changing your password after first login.</p>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Hamara Lakshay - Your Account Credentials',
    html: emailTemplate('Account Created', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending credentials email to ${email}:`, error.message);
    throw error;
  }
};

// Send seat assignment email
exports.sendSeatAssignmentEmail = async (student, seat, shift) => {
  const content = `
    <h2>Seat Assigned Successfully!</h2>
    <p>Dear ${student.name},</p>
    <p>Congratulations! Your seat has been assigned. Here are the details:</p>
    <div class="highlight">
      <p><strong>Seat Number:</strong> ${seat.number}</p>
      <p><strong>Shift:</strong> ${shift}</p>
      <p><strong>Monthly Fee:</strong> ₹${seat.currentPrice}</p>
    </div>
    <p>Please make sure to follow the library rules and maintain discipline.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Seat Assignment Confirmation - Hamara Lakshay',
    html: emailTemplate('Seat Assignment', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Seat assignment email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending seat assignment email:`, error.message);
    throw error;
  }
};

// Send request response email
exports.sendRequestResponseEmail = async (student, request, status, reason) => {
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';
  const statusColor = status === 'approved' ? '#22c55e' : '#ef4444';

  const content = `
    <h2>Request Update</h2>
    <p>Dear ${student.name},</p>
    <p>Your request for <strong>${request.type}</strong> change has been <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.</p>
    ${reason ? `<div class="highlight"><p><strong>Admin Response:</strong> ${reason}</p></div>` : ''}
    <p>You can view more details in your student dashboard.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: `Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Hamara Lakshay`,
    html: emailTemplate('Request Update', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Request response email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending request response email:`, error.message);
  }
};

// Send fee confirmation email
exports.sendFeeConfirmationEmail = async (student, amount, month, year) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const content = `
    <h2>Fee Payment Confirmed!</h2>
    <p>Dear ${student.name},</p>
    <p>We have received your fee payment. Thank you!</p>
    <div class="highlight">
      <p><strong>Amount Paid:</strong> ₹${amount}</p>
      <p><strong>For Month:</strong> ${monthNames[month - 1]} ${year}</p>
      <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    <p>Your payment has been recorded in our system.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Fee Payment Confirmation - Hamara Lakshay',
    html: emailTemplate('Payment Received', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Fee confirmation email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending fee confirmation email:`, error.message);
  }
};

// Send fee due reminder email
exports.sendFeeDueReminderEmail = async (student, amount, dueDate) => {
  const content = `
    <h2>Fee Payment Reminder</h2>
    <p>Dear ${student.name},</p>
    <p>This is a friendly reminder that your monthly fee is due soon.</p>
    <div class="highlight">
      <p><strong>Amount Due:</strong> ₹${amount}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-IN')}</p>
    </div>
    <p>Please make the payment at the library office to avoid any inconvenience.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Fee Payment Reminder - Hamara Lakshay',
    html: emailTemplate('Payment Reminder', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Fee reminder email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending fee reminder email:`, error.message);
  }
};

// Send announcement email
exports.sendAnnouncementEmail = async (recipients, title, message) => {
  const content = `
    <h2>Announcement</h2>
    <div class="highlight">
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
    <p>Please check your dashboard for more updates.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const promises = recipients.map(async (recipient) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipient.email,
      subject: `Announcement: ${title} - Hamara Lakshay`,
      html: emailTemplate('New Announcement', content)
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Announcement email sent to ${recipient.email}`);
    } catch (error) {
      console.error(`❌ Error sending announcement to ${recipient.email}:`, error.message);
    }
  });

  await Promise.all(promises);
};

// Send OTP email for password reset
exports.sendOTPEmail = async (name, email, otp) => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Dear ${name},</p>
    <p>You have requested to reset your password. Please use the OTP below to verify your identity:</p>
    <div class="highlight" style="text-align: center;">
      <h1 style="font-size: 48px; letter-spacing: 8px; color: #667eea; margin: 20px 0;">${otp}</h1>
    </div>
    <p><strong>This OTP is valid for 10 minutes only.</strong></p>
    <p>If you did not request a password reset, please ignore this email or contact the admin if you have concerns.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password" class="login-button">Reset Password</a>
    </div>
    <p>Best regards,<br>Hamara Lakshay Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset OTP - Hamara Lakshay',
    html: emailTemplate('Password Reset', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${email}:`, error.message);
    throw error;
  }
};

// Send seat change request submitted email
exports.sendSeatChangeRequestEmail = async (student, currentSeat, requestedSeat) => {
  const content = `
    <h2>Seat Change Request Submitted</h2>
    <p>Dear ${student.name},</p>
    <p>Your seat change request has been submitted successfully and is awaiting admin approval.</p>
    <div class="highlight">
      <p><strong>Current Seat:</strong> ${currentSeat.number}</p>
      <p><strong>Requested Seat:</strong> ${requestedSeat.number}</p>
    </div>
    <p>You will receive a notification once the admin reviews your request.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshya Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Seat Change Request Submitted - Hamara Lakshya',
    html: emailTemplate('Request Submitted', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Seat change request email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending seat change request email:`, error.message);
  }
};

// Send seat change approved email
exports.sendSeatChangeApprovedEmail = async (student, oldSeat, newSeat) => {
  const content = `
    <h2>Seat Change Approved!</h2>
    <p>Dear ${student.name},</p>
    <p>Great news! Your seat change request has been approved by the admin.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: bold;">PREVIOUS SEAT</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #dc2626; font-weight: bold;">${oldSeat.number}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #991b1b;">₹${oldSeat.currentPrice || 0}/month</p>
      </div>
      <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">NEW SEAT</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #16a34a; font-weight: bold;">${newSeat.number}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">₹${newSeat.currentPrice || 0}/month</p>
      </div>
    </div>
    <p>Your new seat is now active. Please visit the library to settle in your new location.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshya Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Seat Change Approved - Hamara Lakshya',
    html: emailTemplate('Request Approved', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Seat change approved email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending seat change approved email:`, error.message);
  }
};

// Send seat change rejected email
exports.sendSeatChangeRejectedEmail = async (student, requestedSeat, reason) => {
  const content = `
    <h2>Seat Change Request Update</h2>
    <p>Dear ${student.name},</p>
    <p>We regret to inform you that your request to change to seat <strong>${requestedSeat.number}</strong> has been rejected.</p>
    ${reason ? `<div class="highlight"><p><strong>Admin's Response:</strong> ${reason}</p></div>` : ''}
    <p>If you have any questions or would like to submit a new request, please contact the admin or visit the library office.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshya Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Seat Change Request Update - Hamara Lakshya',
    html: emailTemplate('Request Rejected', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Seat change rejected email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending seat change rejected email:`, error.message);
  }
};

// Send shift change approved email
exports.sendShiftChangeApprovedEmail = async (student, oldShiftName, newShiftName, monthlyFee) => {
  const content = `
    <h2>Shift Change Approved!</h2>
    <p>Dear ${student.name},</p>
    <p>Great news! Your shift change request has been approved by the admin.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: bold;">PREVIOUS SHIFT</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #dc2626; font-weight: bold;">${oldShiftName}</p>
      </div>
      <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">NEW SHIFT</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; color: #16a34a; font-weight: bold;">${newShiftName}</p>
      </div>
    </div>
    <div class="highlight">
      <p><strong>Monthly Fee:</strong> ₹${monthlyFee}</p>
    </div>
    <p>Your new shift is now active. Please adhere to the new timings from your next visit.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshya Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Shift Change Approved - Hamara Lakshya',
    html: emailTemplate('Request Approved', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Shift change approved email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending shift change approved email:`, error.message);
  }
};

// Send shift change rejected email
exports.sendShiftChangeRejectedEmail = async (student, requestedShiftName, reason) => {
  const content = `
    <h2>Shift Change Request Update</h2>
    <p>Dear ${student.name},</p>
    <p>We regret to inform you that your request to change to shift <strong>${requestedShiftName}</strong> has been rejected.</p>
    ${reason ? `<div class="highlight"><p><strong>Admin's Response:</strong> ${reason}</p></div>` : ''}
    <p>If you have any questions or would like to submit a new request, please contact the admin or visit the library office.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="login-button">Click Here To Login</a>
    </div>
    <p>Best regards,<br>Hamara Lakshya Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Shift Change Request Update - Hamara Lakshya',
    html: emailTemplate('Request Rejected', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Shift change rejected email sent to ${student.email}`);
  } catch (error) {
    console.error(`❌ Error sending shift change rejected email:`, error.message);
  }
};
