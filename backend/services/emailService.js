const nodemailer = require('nodemailer');

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️ Email credentials not configured in .env file');
}

// Create Primary Transporter (Gmail)
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('✅ Primary Email transporter (Gmail) created successfully');
} catch (error) {
  console.error('❌ Failed to create primary email transporter:', error.message);
}

// Create Backup Transporter (Brevo)
let brevoTransporter;
let brevoTransporter2525; // Fallback for Render

if (process.env.BREVO_USER && process.env.BREVO_PASS) {
  try {
    // Standard Port 587
    brevoTransporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
      port: process.env.BREVO_PORT || 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
      }
    });

    // Fallback Port 2525
    brevoTransporter2525 = nodemailer.createTransport({
      host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
      }
    });

    console.log('✅ Backup Email transporters (Brevo 587 & 2525) configured');
  } catch (error) {
    console.error('❌ Failed to configure backup transporter:', error.message);
  }
}

/**
 * Premium Email Template Generator
 * Uses table-based layout for maximum compatibility and inline styles.
 */
// ... (keeping imports and transporter setup) ...

// ...

const getPremiumTemplate = (title, content, actionBtn = null) => {
  const primaryColor = '#7C3AED'; // Violet-600
  const secondaryColor = '#8B5CF6'; // Violet-500
  const accentColor = '#DDD6FE'; // Violet-200
  const bgColor = '#F3F4F6'; // Gray-100

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${bgColor}; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin-top: 40px; margin-bottom: 40px; }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 40px; text-align: center; color: white; }
    .content { padding: 40px 30px; color: #374151; font-size: 16px; line-height: 1.6; }
    .highlight-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 25px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, ${primaryColor}, ${secondaryColor}); color: white !important; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 10px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); transition: transform 0.2s; }
    .footer { background-color: #F9FAFB; padding: 30px; text-align: center; color: #9CA3AF; font-size: 13px; border-top: 1px solid #E5E7EB; }
    .label { font-size: 12px; text-transform: uppercase; color: #6B7280; letter-spacing: 1px; margin-bottom: 4px; display: block; }
    .value { font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${bgColor};">
    <tr>
      <td align="center">
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px;">Apna Lakshay</h1>
            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Library Management System</p>
          </div>

          <!-- Content -->
          <div class="content">
            <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
            ${content}
            
            ${actionBtn ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${actionBtn.url}" class="btn">${actionBtn.text}</a>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>You received this email because you are a member of Library Management System.</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: ${primaryColor}; text-decoration: none; font-weight: bold;">Visit Dashboard</a>
              &nbsp; • &nbsp;
              <a href="#" style="color: #9CA3AF; text-decoration: none;">Support</a>
            </p>
            <p style="margin-top: 20px; font-size: 11px;">© ${new Date().getFullYear()} Library Management System. All rights reserved.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Universal Send Helper with Fallback
 */
const sendEmail = async (to, subject, title, contentHtml, actionBtn = null) => {
  const html = getPremiumTemplate(title, contentHtml, actionBtn);
  const from = `Library Management System <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`;

  // Helper to send with timeout
  const sendWithTimeout = (availableTransporter, label, timeoutMs = 15000) => {
    return new Promise((resolve, reject) => {
      if (!availableTransporter) {
        return reject(new Error(`${label} transporter not initialized`));
      }

      // Timeout Timer
      const timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Attempt Send
      availableTransporter.sendMail({ from, to, subject, html })
        .then(info => {
          clearTimeout(timer);
          resolve(info);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  try {
    // 1. Try Primary (Gmail) with 15s timeout
    console.log(`📧 Attempting to send email to ${to} via Gmail...`);
    await sendWithTimeout(transporter, 'Gmail', 15000);
    console.log(`✅ Email sent to ${to} via Gmail`);
    return true;

  } catch (primaryError) {
    console.warn(`⚠️ Primary Email (Gmail) failed: ${primaryError.message}`);

    // 2. Try Backup (Brevo 587)
    if (brevoTransporter) {
      console.log(`🔄 Switching to Backup (Brevo 587) for ${to}...`);
      try {
        await sendWithTimeout(brevoTransporter, 'Brevo 587', 15000);
        console.log(`✅ Email sent to ${to} via Backup (Brevo 587)`);
        return true;
      } catch (backupError) {
        console.warn(`⚠️ Backup Email (Brevo 587) failed: ${backupError.message}`);

        // 3. Try Backup (Brevo 2525) - Render often allows this
        if (brevoTransporter2525) {
          console.log(`🔄 Switching to Backup (Brevo 2525) for ${to}...`);
          try {
            await sendWithTimeout(brevoTransporter2525, 'Brevo 2525', 15000);
            console.log(`✅ Email sent to ${to} via Backup (Brevo 2525)`);
            return true;
          } catch (backupError2525) {
            console.error(`❌ Backup Email (Brevo 2525) also failed: ${backupError2525.message}`);
            return false;
          }
        }
        return false;
      }
    } else {
      console.error('❌ Backup Email (Brevo) not configured. Cannot failover.');
      return false;
    }
  }
};

// ==========================================
// EXPORTED EMAIL FUNCTIONS
// ==========================================

// 1. New Account Credentials
exports.sendCredentialsEmail = async (name, email, password) => {
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>Welcome! Your student account has been successfully created.</p>
    
    <div class="highlight-box">
      <span class="label">Your Email</span>
      <p class="value">${email}</p>
      
      <span class="label">Temporary Password</span>
      <p class="value" style="color: #7C3AED; font-family: monospace; font-size: 20px;">${password}</p>
    </div>

    <p style="font-size: 14px; color: #6B7280;">Please change your password immediately after logging in for the first time.</p>
  `;

  await sendEmail(
    email,
    'Welcome to Library Management System',
    'Account Details',
    content,
    { text: 'Login to Dashboard', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }
  );
};

// 2. Seat Assignment
exports.sendSeatAssignmentEmail = async (student, seat, shift) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your dedicated study space is ready! Here are your seat allocation details:</p>
    
    <div class="highlight-box">
      <table width="100%">
        <tr>
          <td width="50%">
            <span class="label">Seat Number</span>
            <p class="value" style="font-size: 28px; color: #7C3AED;">${seat.number}</p>
          </td>
          <td width="50%">
            <span class="label">Assigned Shift</span>
            <p class="value">${shift}</p>
          </td>
        </tr>
      </table>
      <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 15px 0;">
      <span class="label">Monthly Fee</span>
      <p class="value">₹${seat.currentPrice}</p>
    </div>
  `;

  await sendEmail(
    student.email,
    'Seat Assigned',
    'Your Seat Details',
    content,
    { text: 'View My Seat', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }
  );
};

// 3. Request Status Updates (Generic)
exports.sendRequestResponseEmail = async (student, request, status, reason) => {
  const isApproved = status === 'approved';
  const color = isApproved ? '#059669' : '#DC2626'; // Green vs Red

  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your request for <strong>${request.type}</strong> has been updated.</p>
    
    <div class="highlight-box" style="border-left: 4px solid ${color};">
      <span class="label">Status</span>
      <p class="value" style="color: ${color}; text-transform: uppercase;">${status}</p>
      
      ${reason ? `
        <span class="label">Admin Note</span>
        <p class="value" style="font-weight: normal; font-size: 15px;">${reason}</p>
      ` : ''}
    </div>
  `;

  await sendEmail(
    student.email,
    `Request Update: ${status.toUpperCase()}`,
    isApproved ? 'Request Approved' : 'Request Update',
    content,
    { text: 'Check Status', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }
  );
};

// 4. Fee Payment Receipt
exports.sendFeeConfirmationEmail = async (student, amount, month, year) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>We have successfully received your payment. Thank you for being prompt!</p>
    
    <div class="highlight-box">
      <div style="text-align: center;">
        <span class="label">Amount Paid</span>
        <p class="value" style="font-size: 32px; color: #059669;">₹${amount}</p>
      </div>
      <hr style="border: 0; border-top: 1px dashed #E5E7EB; margin: 15px 0;">
      <table width="100%">
        <tr>
          <td><span class="label">For Period</span></td>
          <td align="right"><p class="value" style="font-size: 16px; margin: 0;">${monthNames[month - 1]} ${year}</p></td>
        </tr>
        <tr>
          <td><span class="label">Date</span></td>
          <td align="right"><p class="value" style="font-size: 16px; margin: 0;">${new Date().toLocaleDateString()}</p></td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail(
    student.email,
    'Payment Receipt',
    'Payment Successful',
    content,
    { text: 'Download Receipt', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/history` }
  );
};

// 5. Fee Due Reminder
exports.sendFeeDueReminderEmail = async (student, amount, dueDate) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>This is a gentle reminder regarding your upcoming fee payment.</p>
    
    <div class="highlight-box" style="border-left: 4px solid #F59E0B;">
      <span class="label">Amount Due</span>
      <p class="value">₹${amount}</p>
      
      <span class="label">Due Date</span>
      <p class="value" style="color: #DC2626;">${new Date(dueDate).toLocaleDateString()}</p>
    </div>
    
    <p>Please clear your dues to continue enjoying our library services.</p>
  `;

  await sendEmail(
    student.email,
    'Fee Reminder',
    'Payment Due Soon',
    content,
    { text: 'Pay Now', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/fees` }
  );
};

// 6. Announcements
exports.sendAnnouncementEmail = async (recipients, title, message) => {
  // We'll modify the sendEmail to handle array, but standard is one by one or BCC
  // For simplicity reusing the loop logic but with new template
  const content = `
    <div class="highlight-box">
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
  `;

  // Send individually for personalization (or use BCC implementation if scale needed)
  console.log(`📢 Sending announcement to ${recipients.length} recipients...`);
  let successCount = 0;

  for (const recipient of recipients) {
    const success = await sendEmail(
      recipient.email,
      `${title}`,
      title,
      content,
      { text: 'View Dashboard', url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }
    );
    if (success) successCount++;
  }

  console.log(`✅ Announcement sent to ${successCount}/${recipients.length} recipients`);
  return successCount > 0;
};

// 7. OTP Email
exports.sendOTPEmail = async (name, email, otp) => {
  const content = `
    <p>Dear <strong>${name}</strong>,</p>
    <p>You requested a password reset. Use the code below to verify your identity.</p>
    
    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #7C3AED; background: #fff; padding: 10px 20px; border-radius: 8px; border: 1px dashed #7C3AED;">
        ${otp}
      </span>
    </div>
    
    <p style="text-align: center; color: #DC2626; font-size: 13px;">Code expires in 10 minutes.</p>
  `;

  await sendEmail(
    email,
    'Password Reset Code',
    'Reset Password',
    content
  );
};

// 8. Specific Request Emails (Seat Change, Shift Change)

exports.sendSeatChangeRequestEmail = async (student, currentSeat, requestedSeat) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>We received your request to change seats. It is currently under review.</p>
    
    <div class="highlight-box">
       <table width="100%">
        <tr>
          <td><span class="label">Current</span></td>
          <td align="right"><p class="value">${currentSeat.number}</p></td>
        </tr>
         <tr>
          <td><span class="label">Requested</span></td>
          <td align="right"><p class="value" style="color: #7C3AED;">${requestedSeat.number}</p></td>
        </tr>
      </table>
    </div>
  `;
  await sendEmail(student.email, 'Seat Change Request Recieved', 'Request Received', content);
};

exports.sendSeatChangeApprovedEmail = async (student, oldSeat, newSeat) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your seat change request has been <strong>APPROVED</strong>!</p>
    
    <div style="display: flex; gap: 10px; margin: 20px 0;">
       <div style="background: #FECACA; padding: 15px; border-radius: 8px; flex: 1;">
         <span class="label" style="color: #991B1B;">Old Seat</span>
         <p class="value" style="color: #7F1D1D;">${oldSeat.number}</p>
       </div>
       <div style="background: #A7F3D0; padding: 15px; border-radius: 8px; flex: 1;">
         <span class="label" style="color: #065F46;">New Seat</span>
         <p class="value" style="color: #064E3B;">${newSeat.number}</p>
       </div>
    </div>
    <p>You can move to your new seat immediately.</p>
  `;
  await sendEmail(student.email, 'Seat Change Approved', 'You Moved!', content);
};

exports.sendSeatChangeRejectedEmail = async (student, requestedSeat, reason) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>We differ to inform you that your request for seat <strong>${requestedSeat.number}</strong> could not be fulfilled.</p>
    ${reason ? `<div class="highlight-box"><span class="label">Reason</span><p class="value" style="font-weight: normal;">${reason}</p></div>` : ''}
  `;
  await sendEmail(student.email, 'Seat Change Request Update', 'Request Declined', content);
};

// Shift Change Emails follow similar pattern
exports.sendShiftChangeApprovedEmail = async (student, oldShiftName, newShiftName, monthlyFee) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your shift timing update has been approved.</p>
    
     <div style="display: flex; gap: 10px; margin: 20px 0;">
       <div style="background: #E5E7EB; padding: 15px; border-radius: 8px; flex: 1;">
         <span class="label">Previous</span>
         <p class="value" style="font-size: 14px;">${oldShiftName}</p>
       </div>
       <div style="background: #A7F3D0; padding: 15px; border-radius: 8px; flex: 1;">
         <span class="label" style="color: #065F46;">New Shift</span>
         <p class="value" style="color: #064E3B; font-size: 14px;">${newShiftName}</p>
       </div>
    </div>
    
    <p><strong>New Fee:</strong> ₹${monthlyFee}/month</p>
  `;
  await sendEmail(student.email, 'Shift Change Approved', 'Schedule Updated', content);
};

exports.sendShiftChangeRejectedEmail = async (student, requestedShiftName, reason) => {
  const content = `
    <p>Dear <strong>${student.name}</strong>,</p>
    <p>Your request to move to the <strong>${requestedShiftName}</strong> shift was declined.</p>
     ${reason ? `<div class="highlight-box"><span class="label">Reason</span><p class="value" style="font-weight: normal;">${reason}</p></div>` : ''}
  `;
  await sendEmail(student.email, 'Shift Change Update', 'Request Declined', content);
};
