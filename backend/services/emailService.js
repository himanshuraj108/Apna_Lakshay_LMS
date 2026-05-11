const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('Email credentials not configured in .env file');
}

let transporter;
try {
  transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });
} catch (e) { console.error('Failed to create Gmail transporter:', e.message); }

let brevoTransporter, brevoTransporter2525;
if (process.env.BREVO_USER && process.env.BREVO_PASS) {
  try {
    brevoTransporter = nodemailer.createTransport({ host: process.env.BREVO_HOST || 'smtp-relay.brevo.com', port: 587, secure: false, auth: { user: process.env.BREVO_USER, pass: process.env.BREVO_PASS } });
    brevoTransporter2525 = nodemailer.createTransport({ host: process.env.BREVO_HOST || 'smtp-relay.brevo.com', port: 2525, secure: false, auth: { user: process.env.BREVO_USER, pass: process.env.BREVO_PASS } });
  } catch (e) { console.error('Failed to configure Brevo transporter:', e.message); }
}

// ─── MASTER TEMPLATE ───────────────────────────────────────────────────────────
const buildEmail = ({ preheader = '', badge = '', headline, body, table = null, cta = null, note = '' }) => {
  const BRAND = '#1a1a2e';
  const ACCENT = '#e85d26';
  const LIGHT = '#f8f7f5';
  const BORDER = '#e2e2e2';
  const TEXT = '#374151';
  const MUTED = '#6b7280';
  const year = new Date().getFullYear();
  const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  const tableHtml = table ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};">
      ${table.rows.map((row, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : LIGHT};">
          <td style="padding:13px 18px;font-size:13px;color:${MUTED};font-weight:500;text-transform:uppercase;letter-spacing:0.5px;width:45%;border-bottom:1px solid ${BORDER};">${row.label}</td>
          <td style="padding:13px 18px;font-size:14px;color:${row.highlight ? ACCENT : BRAND};font-weight:${row.bold ? '700' : '500'};border-bottom:1px solid ${BORDER};text-align:right;">${row.value}</td>
        </tr>`).join('')}
    </table>` : '';

  const ctaHtml = cta ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr><td align="center">
        <a href="${cta.url}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;padding:14px 36px;border-radius:6px;">${cta.label}</a>
      </td></tr>
    </table>` : '';

  const noteHtml = note ? `<p style="font-size:12px;color:${MUTED};margin:24px 0 0;padding:16px;background:${LIGHT};border-radius:6px;border:1px solid ${BORDER};line-height:1.6;">${note}</p>` : '';

  const badgeHtml = badge ? `<span style="display:inline-block;background:${badge.bg};color:${badge.color};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:100px;margin-bottom:16px;">${badge.text}</span>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background:#f0ede8;padding:48px 24px;">
  <tr><td align="center">

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);border:1px solid ${BORDER};">

      <!-- Header bar -->
      <tr><td style="background:${BRAND};padding:0;height:4px;"></td></tr>

      <!-- Logo row -->
      <tr>
        <td style="padding:32px 40px 24px;border-bottom:1px solid ${BORDER};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:20px;font-weight:800;color:${BRAND};letter-spacing:-0.5px;">Apna Lakshay</span>
                <span style="font-size:12px;color:${MUTED};font-weight:400;margin-left:8px;text-transform:uppercase;letter-spacing:1px;">Library</span>
              </td>
              <td align="right">
                <span style="font-size:11px;color:${MUTED};">No-reply · Automated</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px 32px;">
          ${badgeHtml}
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${BRAND};line-height:1.3;letter-spacing:-0.3px;">${headline}</h1>
          <div style="font-size:15px;color:${TEXT};line-height:1.7;">${body}</div>
          ${tableHtml}
          ${ctaHtml}
          ${noteHtml}
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="height:1px;background:${BORDER};"></td></tr>

      <!-- Footer -->
      <tr>
        <td style="padding:24px 40px;background:${LIGHT};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:${MUTED};line-height:1.6;">
                You received this because you are a registered student at Apna Lakshay Library.<br>
                <a href="${APP_URL}" style="color:${ACCENT};text-decoration:none;font-weight:500;">Visit Dashboard</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/student/fees" style="color:${MUTED};text-decoration:none;">Fee Portal</a>
              </td>
              <td align="right" style="font-size:11px;color:#9ca3af;white-space:nowrap;vertical-align:top;">
                &copy; ${year} Apna Lakshay
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    <!-- /Card -->

    <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;text-align:center;">This is an automated message. Please do not reply to this email.</p>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
};

// ─── SEND HELPER ───────────────────────────────────────────────────────────────
const sendEmail = async (to, subject, templateOptions) => {
  if (!to || to.trim() === '') return false;
  const html = buildEmail(templateOptions);
  const from = `Apna Lakshay Library <${process.env.EMAIL_USER}>`;

  const tryTransport = (t, label, ms = 15000) => new Promise((resolve, reject) => {
    if (!t) return reject(new Error(`${label} not initialized`));
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    t.sendMail({ from, to, subject, html }).then(i => { clearTimeout(timer); resolve(i); }).catch(e => { clearTimeout(timer); reject(e); });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // In production (Render/cloud), Gmail is blocked by IP — use Brevo first
  // In development (local), Gmail works fine — use it first
  const orderedTransports = isProduction
    ? [
        { t: brevoTransporter,     label: 'Brevo-587',  ms: 10000 },
        { t: brevoTransporter2525, label: 'Brevo-2525', ms: 10000 },
        { t: transporter,          label: 'Gmail',      ms: 8000  },
      ]
    : [
        { t: transporter,          label: 'Gmail',      ms: 4000  },
        { t: brevoTransporter,     label: 'Brevo-587',  ms: 10000 },
        { t: brevoTransporter2525, label: 'Brevo-2525', ms: 10000 },
      ];

  for (const { t, label, ms } of orderedTransports) {
    if (!t) continue;
    try {
      await tryTransport(t, label, ms);
      console.log(`✅ Email sent via ${label} to ${to}`);
      return true;
    } catch (e) {
      console.warn(`${label} failed: ${e.message}`);
    }
  }
  console.error(`All email transports failed for ${to}`);
  return false;
};

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── 1. NEW ACCOUNT ─────────────────────────────────────────────────────────
exports.sendCredentialsEmail = async (name, email, password) => {
  await sendEmail(email, 'Your account has been created', {
    badge: { text: 'Welcome', bg: '#eff6ff', color: '#1d4ed8' },
    headline: 'Your account is ready',
    body: `<p style="margin:0 0 16px;">Dear <strong>${name}</strong>,</p><p style="margin:0 0 16px;">Your student account at Apna Lakshay Library has been created. Below are your login credentials.</p>`,
    table: { rows: [
      { label: 'Email Address', value: email, bold: true },
      { label: 'Temporary Password', value: `<code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:15px;">${password}</code>`, bold: true, highlight: true },
    ]},
    cta: { label: 'Sign In to Dashboard', url: `${APP_URL}/login` },
    note: 'For your security, please change your password immediately after your first login. If you did not expect this email, contact the administration.',
  });
};

// ─── 2. SEAT ASSIGNMENT ──────────────────────────────────────────────────────
exports.sendSeatAssignmentEmail = async (student, seat, shift) => {
  await sendEmail(student.email, 'Your seat has been assigned', {
    badge: { text: 'Seat Assigned', bg: '#f0fdf4', color: '#166534' },
    headline: 'Your study space is confirmed',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0 0 16px;">Your dedicated seat at Apna Lakshay Library has been allocated. Please find your assignment details below.</p>`,
    table: { rows: [
      { label: 'Seat Number', value: seat.number, bold: true, highlight: true },
      { label: 'Assigned Shift', value: shift, bold: true },
      { label: 'Monthly Fee', value: `Rs. ${seat.currentPrice}`, bold: true },
    ]},
    cta: { label: 'View My Seat', url: `${APP_URL}/student/dashboard` },
    note: 'Please arrive on time during your assigned shift. Contact administration if you have any queries about your seat.',
  });
};

// ─── 3. GENERIC REQUEST RESPONSE ────────────────────────────────────────────
exports.sendRequestResponseEmail = async (student, request, status, reason) => {
  const approved = status === 'approved';
  await sendEmail(student.email, `Your request has been ${status}`, {
    badge: approved
      ? { text: 'Approved', bg: '#f0fdf4', color: '#166534' }
      : { text: 'Not Approved', bg: '#fef2f2', color: '#991b1b' },
    headline: approved ? 'Request approved' : 'Request update',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">Your request has been reviewed by the administration.</p>`,
    table: { rows: [
      { label: 'Request Type', value: request.type?.replace(/_/g,' '), bold: true },
      { label: 'Decision', value: approved ? 'Approved' : 'Not Approved', bold: true, highlight: approved },
      ...(reason ? [{ label: 'Admin Note', value: reason }] : []),
    ]},
    cta: { label: 'View Dashboard', url: `${APP_URL}/student/dashboard` },
  });
};

// ─── 4. FEE PAYMENT RECEIPT ──────────────────────────────────────────────────
exports.sendFeeConfirmationEmail = async (student, amount, month, year, feeId, paidDate) => {
  const receipt = feeId ? `REC-${feeId.toString().slice(-8).toUpperCase()}` : `REC-${Date.now().toString().slice(-8)}`;
  const dateStr = paidDate ? new Date(paidDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  await sendEmail(student.email, `Fee receipt for ${MONTHS[month-1]} ${year}`, {
    badge: { text: 'Payment Confirmed', bg: '#f0fdf4', color: '#166534' },
    headline: 'Payment received',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">Your fee payment has been recorded. This is your official receipt.</p>`,
    table: { rows: [
      { label: 'Receipt Number', value: receipt, bold: true },
      { label: 'Amount Paid', value: `Rs. ${amount}`, bold: true, highlight: true },
      { label: 'Billing Period', value: `${MONTHS[month-1]} ${year}`, bold: true },
      { label: 'Payment Date', value: dateStr },
      { label: 'Status', value: 'Paid', bold: true },
    ]},
    cta: { label: 'View Fee History', url: `${APP_URL}/student/fees` },
    note: 'Please retain this receipt for your records. You can access all receipts anytime from your student dashboard.',
  });
};

// ─── 5. FEE DUE REMINDER ────────────────────────────────────────────────────
exports.sendFeeDueReminderEmail = async (student, amount, dueDate) => {
  const dueDateStr = new Date(dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  await sendEmail(student.email, 'Fee payment due — action required', {
    badge: { text: 'Payment Due', bg: '#fffbeb', color: '#92400e' },
    headline: 'Your fee payment is due',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">This is a reminder that your library fee payment is due. Please clear your dues to continue uninterrupted access to library services.</p>`,
    table: { rows: [
      { label: 'Amount Due', value: `Rs. ${amount}`, bold: true, highlight: true },
      { label: 'Due Date', value: dueDateStr, bold: true },
    ]},
    cta: { label: 'Pay Now', url: `${APP_URL}/student/fees` },
    note: 'Failure to pay by the due date may result in temporary suspension of library access. Contact administration if you need assistance.',
  });
};

// ─── 6. ANNOUNCEMENT ────────────────────────────────────────────────────────
exports.sendAnnouncementEmail = async (recipients, title, message) => {
  let successCount = 0;
  for (const recipient of recipients) {
    const ok = await sendEmail(recipient.email, title, {
      badge: { text: 'Announcement', bg: '#eff6ff', color: '#1e40af' },
      headline: title,
      body: `<p style="margin:0 0 16px;">Dear <strong>${recipient.name}</strong>,</p><div style="white-space:pre-wrap;">${message}</div>`,
      cta: { label: 'View Dashboard', url: `${APP_URL}/student/dashboard` },
    });
    if (ok) successCount++;
  }
  return successCount > 0;
};

// ─── 7. PASSWORD RESET OTP ───────────────────────────────────────────────────
exports.sendOTPEmail = async (name, email, otp) => {
  await sendEmail(email, 'Your password reset code', {
    badge: { text: 'Security', bg: '#fef2f2', color: '#991b1b' },
    headline: 'Password reset requested',
    body: `<p style="margin:0 0 16px;">Dear <strong>${name}</strong>,</p><p style="margin:0 0 24px;">Use the verification code below to reset your password. Do not share this code with anyone.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <div style="display:inline-block;background:#1a1a2e;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:14px;padding:20px 36px;border-radius:8px;font-family:monospace;">${otp}</div>
      </td></tr>
    </table>`,
    note: 'This code expires in 10 minutes. If you did not request a password reset, please ignore this email and your account will remain secure.',
  });
};

// ─── 8. SEAT CHANGE REQUEST RECEIVED ────────────────────────────────────────
exports.sendSeatChangeRequestEmail = async (student, currentSeat, requestedSeat) => {
  await sendEmail(student.email, 'Seat change request received', {
    badge: { text: 'Request Received', bg: '#eff6ff', color: '#1d4ed8' },
    headline: 'Your seat change request is under review',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">We have received your request to change your seat assignment. Our team will review it shortly and notify you of the outcome.</p>`,
    table: { rows: [
      { label: 'Current Seat', value: currentSeat.number, bold: true },
      { label: 'Requested Seat', value: requestedSeat.number, bold: true, highlight: true },
      { label: 'Status', value: 'Pending Review', bold: true },
    ]},
    cta: { label: 'View Request Status', url: `${APP_URL}/student/dashboard` },
    note: 'Seat changes are subject to availability and admin approval. You will receive an email once a decision has been made.',
  });
};

// ─── 9. SEAT CHANGE APPROVED ─────────────────────────────────────────────────
exports.sendSeatChangeApprovedEmail = async (student, oldSeat, newSeat) => {
  await sendEmail(student.email, 'Seat change request approved', {
    badge: { text: 'Approved', bg: '#f0fdf4', color: '#166534' },
    headline: 'Your seat has been changed',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">Your seat change request has been approved. You may now occupy your new seat effective immediately.</p>`,
    table: { rows: [
      { label: 'Previous Seat', value: oldSeat.number, bold: true },
      { label: 'New Seat', value: newSeat.number, bold: true, highlight: true },
      { label: 'Effective', value: 'Immediately', bold: true },
    ]},
    cta: { label: 'View My Seat', url: `${APP_URL}/student/dashboard` },
  });
};

// ─── 10. SEAT CHANGE REJECTED ────────────────────────────────────────────────
exports.sendSeatChangeRejectedEmail = async (student, requestedSeat, reason) => {
  await sendEmail(student.email, 'Seat change request update', {
    badge: { text: 'Not Approved', bg: '#fef2f2', color: '#991b1b' },
    headline: 'Seat change request declined',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">After review, we are unable to accommodate your request to move to seat <strong>${requestedSeat.number}</strong> at this time.</p>`,
    table: { rows: [
      { label: 'Requested Seat', value: requestedSeat.number, bold: true },
      { label: 'Decision', value: 'Not Approved', bold: true },
      ...(reason ? [{ label: 'Reason', value: reason }] : []),
    ]},
    cta: { label: 'Contact Administration', url: `${APP_URL}/student/dashboard` },
    note: 'You may submit another request after 30 days or contact the administration directly for further assistance.',
  });
};

// ─── 11. SHIFT CHANGE APPROVED ───────────────────────────────────────────────
exports.sendShiftChangeApprovedEmail = async (student, oldShiftName, newShiftName, monthlyFee) => {
  await sendEmail(student.email, 'Shift change request approved', {
    badge: { text: 'Approved', bg: '#f0fdf4', color: '#166534' },
    headline: 'Your shift has been updated',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">Your shift change request has been approved. Your new schedule takes effect immediately.</p>`,
    table: { rows: [
      { label: 'Previous Shift', value: oldShiftName, bold: true },
      { label: 'New Shift', value: newShiftName, bold: true, highlight: true },
      { label: 'Monthly Fee', value: `Rs. ${monthlyFee}`, bold: true },
      { label: 'Effective', value: 'Immediately', bold: true },
    ]},
    cta: { label: 'View Schedule', url: `${APP_URL}/student/dashboard` },
  });
};

// ─── 12. SHIFT CHANGE REJECTED ───────────────────────────────────────────────
exports.sendShiftChangeRejectedEmail = async (student, requestedShiftName, reason) => {
  await sendEmail(student.email, 'Shift change request update', {
    badge: { text: 'Not Approved', bg: '#fef2f2', color: '#991b1b' },
    headline: 'Shift change request declined',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">We are unable to process your request to move to the <strong>${requestedShiftName}</strong> shift at this time.</p>`,
    table: { rows: [
      { label: 'Requested Shift', value: requestedShiftName, bold: true },
      { label: 'Decision', value: 'Not Approved', bold: true },
      ...(reason ? [{ label: 'Reason', value: reason }] : []),
    ]},
    cta: { label: 'View Dashboard', url: `${APP_URL}/student/dashboard` },
  });
};

// ─── 13. FEE STRUCTURE UPDATED ───────────────────────────────────────────────
exports.sendFeeUpdateEmail = async (student, oldPrice, newPrice) => {
  const increased = newPrice > oldPrice;
  await sendEmail(student.email, 'Your monthly fee has been updated', {
    badge: { text: 'Fee Update', bg: '#fffbeb', color: '#92400e' },
    headline: 'Monthly fee adjustment',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">This is to inform you that your monthly library fee has been revised by the administration, effective immediately.</p>`,
    table: { rows: [
      { label: 'Previous Fee', value: `Rs. ${oldPrice}`, bold: true },
      { label: 'Revised Fee', value: `Rs. ${newPrice}`, bold: true, highlight: true },
      { label: 'Change', value: increased ? `+Rs. ${newPrice - oldPrice}` : `-Rs. ${oldPrice - newPrice}`, bold: true },
      { label: 'Effective From', value: 'Current Billing Cycle', bold: true },
    ]},
    cta: { label: 'View Fee Portal', url: `${APP_URL}/student/fees` },
    note: 'All existing pending invoices have been updated to reflect the new fee. Contact the administration if you have any concerns.',
  });
};

// ─── 14. PARTIAL FEE PAYMENT ─────────────────────────────────────────────────
exports.sendPartialFeeEmail = async (student, partialPaid, outstanding, total, month, year) => {
  await sendEmail(student.email, `Partial payment received — ${MONTHS[month-1]} ${year}`, {
    badge: { text: 'Partial Payment', bg: '#fffbeb', color: '#92400e' },
    headline: 'Partial payment recorded',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">A partial payment has been recorded for your <strong>${MONTHS[month-1]} ${year}</strong> fee. Please clear the remaining balance at your earliest convenience.</p>`,
    table: { rows: [
      { label: 'Billing Period', value: `${MONTHS[month-1]} ${year}`, bold: true },
      { label: 'Total Fee', value: `Rs. ${total}`, bold: true },
      { label: 'Amount Paid', value: `Rs. ${partialPaid}`, bold: true },
      { label: 'Balance Due', value: `Rs. ${outstanding}`, bold: true, highlight: true },
    ]},
    cta: { label: 'Clear Balance', url: `${APP_URL}/student/fees` },
    note: 'Late payments may incur additional charges. Please contact the administration if you need a payment arrangement.',
  });
};

// ─── 15. PROFILE UPDATED ─────────────────────────────────────────────────────
exports.sendProfileUpdateEmail = async (student) => {
  await sendEmail(student.email, 'Your profile has been updated', {
    badge: { text: 'Profile Update', bg: '#eff6ff', color: '#1d4ed8' },
    headline: 'Profile information updated',
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><p style="margin:0;">Your profile details have been successfully updated by the administration. Please review your information to ensure everything is accurate.</p>`,
    cta: { label: 'Review My Profile', url: `${APP_URL}/student/dashboard` },
    note: 'If you notice any discrepancy in your profile information, please contact the administration immediately.',
  });
};
