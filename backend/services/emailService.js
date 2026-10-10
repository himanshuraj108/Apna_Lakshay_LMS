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

// ─── MASTER TEMPLATE (MOBILE-FIRST RESPONSIVE) ────────────────────────────────
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
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};table-layout:fixed;">
      ${table.rows.map((row, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : LIGHT};">
          <td class="email-table-cell-label" style="padding:12px 16px;font-size:12px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:0.4px;width:38%;border-bottom:1px solid ${BORDER};vertical-align:top;word-break:break-word;line-height:1.5;">${row.label}</td>
          <td class="email-table-cell-val" style="padding:12px 16px;font-size:13px;color:${row.highlight ? ACCENT : BRAND};font-weight:${row.bold ? '700' : '500'};border-bottom:1px solid ${BORDER};text-align:right;vertical-align:top;word-break:break-word;line-height:1.6;">${row.value}</td>
        </tr>`).join('')}
    </table>` : '';

  const ctaHtml = cta ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;">
      <tr><td align="center">
        <a class="email-cta" href="${cta.url}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.3px;padding:13px 28px;border-radius:8px;line-height:1.4;">${cta.label}</a>
      </td></tr>
    </table>` : '';

  const noteHtml = note ? `<div style="font-size:12px;color:${MUTED};margin:20px 0 0;padding:14px 16px;background:${LIGHT};border-radius:8px;border:1px solid ${BORDER};line-height:1.75;word-break:break-word;">${note}</div>` : '';

  const badgeHtml = badge ? `<div style="margin-bottom:14px;"><span style="display:inline-block;background:${badge.bg};color:${badge.color};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:100px;line-height:1.4;word-break:break-word;">${badge.text}</span></div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${headline}</title>
<style>
  @media only screen and (max-width: 600px) {
    .email-outer { padding: 12px 8px !important; }
    .email-card { border-radius: 10px !important; }
    .email-header { padding: 16px 16px 14px !important; }
    .email-body { padding: 20px 16px 20px !important; }
    .email-footer { padding: 16px 16px !important; }
    .email-h1 { font-size: 18px !important; line-height: 1.35 !important; }
    .email-content { font-size: 14px !important; line-height: 1.75 !important; }
    .email-table-cell-label,
    .email-table-cell-val {
      display: block !important;
      width: 100% !important;
      text-align: left !important;
      box-sizing: border-box !important;
    }
    .email-table-cell-label {
      padding: 10px 14px 2px !important;
      border-bottom: none !important;
      font-size: 11px !important;
    }
    .email-table-cell-val {
      padding: 2px 14px 10px !important;
      font-size: 13px !important;
    }
    .email-cta {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      text-align: center !important;
      padding: 13px 16px !important;
    }
    .email-notice-box {
      padding: 14px 14px !important;
      margin: 14px 0 !important;
    }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" class="email-outer" style="min-height:100vh;background:#f0ede8;padding:32px 12px;">
  <tr><td align="center">

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" class="email-card" style="max-width:580px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);border:1px solid ${BORDER};">

      <!-- Header bar -->
      <tr><td style="background:${BRAND};padding:0;height:4px;"></td></tr>

      <!-- Logo row -->
      <tr>
        <td class="email-header" style="padding:20px 28px 18px;border-bottom:1px solid ${BORDER};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:10px;">
                      <img src="${APP_URL}/app-icon-192.png" alt="Apna Lakshay" width="34" height="34"
                        style="display:block;border-radius:8px;border:0;width:34px;height:34px;object-fit:cover;" />
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:17px;font-weight:800;color:${BRAND};letter-spacing:-0.4px;display:block;line-height:1.2;">Apna Lakshay</span>
                      <span style="font-size:10px;color:${MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1.2px;display:block;">Library</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="font-size:11px;color:${MUTED};">Official Notice</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td class="email-body" style="padding:28px 28px 26px;">
          ${badgeHtml}
          <h1 class="email-h1" style="margin:0 0 14px;font-size:20px;font-weight:800;color:${BRAND};line-height:1.35;letter-spacing:-0.3px;word-break:break-word;">${headline}</h1>
          <div class="email-content" style="font-size:14px;color:${TEXT};line-height:1.75;word-break:break-word;">${body}</div>
          ${tableHtml}
          ${ctaHtml}
          ${noteHtml}
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="height:1px;background:${BORDER};"></td></tr>

      <!-- Footer -->
      <tr>
        <td class="email-footer" style="padding:20px 28px;background:${LIGHT};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:${MUTED};line-height:1.65;word-break:break-word;">
                You received this because you are a registered student at Apna Lakshay Library.<br>
                <a href="${APP_URL}" style="color:${ACCENT};text-decoration:none;font-weight:600;">Visit Dashboard</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/student/fees" style="color:${MUTED};text-decoration:none;">Fee Portal</a>
              </td>
              <td align="right" style="font-size:11px;color:#9ca3af;white-space:nowrap;vertical-align:top;padding-left:8px;">
                &copy; ${year} Apna Lakshay
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
    <!-- /Card -->

    <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.5;">This is an automated message. Please do not reply to this email.</p>
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
      console.log(`Email delivered via ${label} to ${to}`);

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
      // { label: 'Temporary Password', value: `<code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:15px;">${password}</code>`, bold: true, highlight: true },
      { label: 'Temporary Password', value: `<code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:15px;">Your Mobile No.</code>`, bold: true, highlight: true },
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

// ─── 16. SEAT UPGRADE — BALANCE DUE ──────────────────────────────────────────
exports.sendSeatUpgradeDueEmail = async (student, details) => {
  // details: { oldSeat, newSeat, oldPrice, newPrice, difference, shiftName, month, year }
  const monthName = MONTHS[(details.month || 1) - 1] || 'Current Month';
  await sendEmail(
    student.email,
    `Seat upgrade — balance due for ${monthName} ${details.year}`,
    {
      badge: { text: 'Seat Upgrade — Balance Due', bg: '#fff7ed', color: '#c2410c' },
      headline: 'Your seat has been upgraded — balance due',
      body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p>
<p style="margin:0 0 14px;">Your library seat has been upgraded mid-month. Since you had already paid the fee for your previous seat, the difference amount is now due. Please clear it at your earliest convenience to avoid any disruption.</p>`,
      table: {
        rows: [
          { label: 'Billing Period',   value: `${monthName} ${details.year}`,                    bold: true },
          { label: 'Previous Seat',    value: `Desk ${details.oldSeat || 'N/A'}`,                bold: true },
          { label: 'New Seat',         value: `Desk ${details.newSeat} (${details.shiftName})`,  bold: true },
          { label: 'Already Paid',     value: `Rs. ${details.oldPrice}`,                          bold: true },
          { label: 'New Seat Fee',     value: `Rs. ${details.newPrice}`,                          bold: true },
          { label: 'Balance Due',      value: `Rs. ${details.difference}`,                        bold: true, highlight: true },
        ]
      },
      cta: { label: 'View Fee Portal', url: `${APP_URL}/student/fees` },
      note: 'This balance due has been added to your fee record and is visible in your Fee Status page. Please contact the administration if you have any questions.',
    }
  );
};

// ─── 17. DIRECT NOTIFICATION (individual or selected students) ────────────────
exports.sendDirectNotificationEmail = async (student, title, message) => {
  return await sendEmail(student.email, title, {
    badge: { text: 'Notice', bg: '#fff7ed', color: '#c2410c' },
    headline: title,
    body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p><div style="white-space:pre-wrap;line-height:1.75;">${message}</div>`,
    cta: { label: 'View Dashboard', url: `${APP_URL}/student/dashboard` },
    note: 'This notice was sent directly to you by the administration. Please contact the library staff if you have any questions.',
  });
};

// Send manual due notice email
exports.sendManualDueEmail = async (student, details) => {
  // details: { amount, reason, dueDate, month, year }
  const monthName = MONTHS[(details.month || 1) - 1] || 'Current Month';
  const dueDateStr = details.dueDate
    ? new Date(details.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'As soon as possible';
  await sendEmail(
    student.email,
    `Fee Due Notice — Rs. ${details.amount} due by ${dueDateStr}`,
    {
      badge: { text: 'Fee Due Notice', bg: '#fff7ed', color: '#c2410c' },
      headline: `A fee due of Rs. ${details.amount} has been added to your account`,
      body: `<p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p>
<p style="margin:0 0 14px;">A fee due has been added to your account by the administration. Please clear the outstanding amount before the due date to avoid any late charges or service disruption.</p>`,
      table: {
        rows: [
          { label: 'Billing Month',  value: `${monthName} ${details.year}`,  bold: true },
          { label: 'Due Amount',     value: `Rs. ${details.amount}`,          bold: true, highlight: true },
          { label: 'Due Date',       value: dueDateStr,                       bold: true },
          { label: 'Reason',         value: details.reason,                   bold: false },
        ]
      },
      cta: { label: 'View Fee Status', url: `${APP_URL}/student/fees` },
      note: 'This due has been added to your fee record and is visible in your Fee Status page. Please contact the administration if you believe this is incorrect.',
    }
  );
};

// ─── 18. SHIFT VACANCY ALERT (WAITING LIST NOTIFICATION) ──────────────────────
exports.sendShiftVacancyEmail = async (student, shiftDetails, customMessage) => {
  const timing = shiftDetails.startTime && shiftDetails.endTime 
    ? `${shiftDetails.startTime} – ${shiftDetails.endTime}`
    : (shiftDetails.shiftTime || 'Scheduled Timings');
  const shiftTitle = shiftDetails.shiftName || shiftDetails.name || 'Shift Vacancy';

  const tableRows = [
    { label: 'Shift Name', value: shiftTitle, bold: true },
    { label: 'Shift Timing', value: timing, bold: true },
    { label: 'Seat Status', value: 'Seats Available Now', bold: true, highlight: true },
  ];

  if (shiftDetails.availableCount) {
    tableRows.push({
      label: 'Vacant Desks',
      value: `${shiftDetails.availableCount} desk${Number(shiftDetails.availableCount) === 1 ? '' : 's'} free`,
      bold: true
    });
  }

  return await sendEmail(
    student.email,
    `Seat Available: ${shiftTitle} at Apna Lakshay Library`,
    {
      badge: { text: 'Shift Vacancy Alert', bg: '#ecfdf5', color: '#047857' },
      headline: `Seat vacancy open in ${shiftTitle}`,
      body: `
        <p style="margin:0 0 16px;">Dear <strong>${student.name}</strong>,</p>
        <p style="margin:0 0 14px;">Great news! Seats have opened up for <strong>${shiftTitle}</strong> (${timing}) at Apna Lakshay Library. Since you are currently registered on our waiting list or enrolled as a flexible scholar, you are receiving priority notification.</p>
        ${customMessage ? `<div style="margin:16px 0;padding:14px 16px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:4px;font-size:14px;color:#9a3412;line-height:1.6;"><strong>Administrator Note:</strong><br/>${customMessage.replace(/\n/g, '<br/>')}</div>` : ''}
        <p style="margin:0 0 8px;">Desk allocations are processed on a first-come, first-served basis. If you would like to secure your desk for this shift, please contact the administration or visit the reception promptly.</p>
      `,
      table: { rows: tableRows },
      cta: { label: 'Open Student Portal', url: `${APP_URL}/student/dashboard` },
      note: 'Please visit library administration or contact the front desk promptly to finalize your desk allocation before slots fill up.'
    }
  );
};

// Helper to highlight festival/occasion name, dates, weekdays, and times inside notice text for HTML emails (mobile-safe inline span without display:inline-block or vertical padding collision)
const highlightDateTimeHtml = (rawText, occasionName = '') => {
  if (!rawText) return '';
  const inlineHighlightStyle = 'color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;';
  const escapedName = String(occasionName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameAlt = escapedName ? `|${escapedName}` : '';
  // Match dates like "Sun, 08 Nov, 2026" or "12 Oct 2026", times like "04:00 PM to 09:00 PM" or "04:00 PM", Full Day Closure / पूर्ण दिवस अवकाश, and the festival/occasion name
  const pattern = new RegExp(
    `(\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\\s+\\d{4}\\b|\\b\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\\s+\\d{4}\\b|\\b\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)(?:\\s*(?:to|–|-|से)\\s*\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm))?\\b|\\bFull Day(?: Library)? Closure\\b|पूर्ण दिवस अवकाश${nameAlt})`,
    'gi'
  );
  return rawText.replace(pattern, (match) => `<span style="${inlineHighlightStyle}">&nbsp;${match}&nbsp;</span>`);
};

// ─── 19. OFFICIAL HOLIDAY / PARTIAL CLOSURE NOTICE (BILINGUAL EN + HI) ───────
exports.sendHolidayNoticeEmail = async (recipients, details) => {
  // details: { name, dateSummary, daysCount, isPartial, startTime12h, endTime12h, structuredNotice }
  const {
    name = 'Library Holiday',
    dateSummary = '',
    daysCount = 1,
    isPartial = false,
    startTime12h = '',
    endTime12h = '',
    structuredNotice = ''
  } = details || {};

  const subject = isPartial
    ? `Notice / सूचना: Partial Library Closure (${startTime12h} – ${endTime12h}) — ${name}`
    : `Official Holiday Notice / अवकाश सूचना: ${name}`;

  const badge = isPartial
    ? { text: 'Partial Timing Closure · आंशिक समय बंदी', bg: '#fffbeb', color: '#b45309' }
    : { text: 'Official Holiday Notice · आधिकारिक अवकाश सूचना', bg: '#fef2f2', color: '#991b1b' };

  const headline = isPartial
    ? `Partial Library Closure: ${name}`
    : `Holiday Declared: ${name}`;

  const operationalValue = isPartial
    ? `Non-Functional: ${startTime12h} – ${endTime12h} (${startTime12h} से ${endTime12h} तक बंद)`
    : 'Full Day Library Closure (पूर्ण दिवस अवकाश)';

  const tableRows = [
    { label: 'Occasion / अवसर', value: `<span style="color:#c2410c;font-weight:700;">${name}</span>`, bold: true },
    { label: `Scheduled Date${daysCount > 1 ? `s (${daysCount} Days)` : ''} / तिथि`, value: `<span style="color:#c2410c;font-weight:700;">${dateSummary}</span>`, bold: true },
    { label: 'Operational Timing / समय', value: `<span style="color:#c2410c;font-weight:700;">${operationalValue}</span>`, bold: true, highlight: true },
    { label: 'Attendance Policy / उपस्थिति नियम', value: '100% Protected / अपरिवर्तित (Neutral)', bold: true }
  ];

  // Split structuredNotice into English and Hindi blocks (separated by ---), stripping any broken UTF-8 replacement chars
  const safeNotice = (structuredNotice || '')
    .replace(/व्य\uFFFD+स्थित/g, 'व्यवस्थित')
    .replace(/सामग्र\uFFFD+/g, 'सामग्री')
    .replace(/\uFFFD+/g, '')
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, '-');
  const parts = safeNotice.split('---');
  const enRaw = (parts[0] || '').trim();
  const hiRaw = (parts[1] || '').trim();

  const renderBulletBlock = (rawBlock, borderColor = '#fed7aa') => {
    const lines = rawBlock
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return lines
      .map((line, idx) => {
        const isLast = idx === lines.length - 1;
        const bottomStyle = isLast ? 'margin-bottom:0;padding-bottom:0;' : `margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed ${borderColor};`;
        const cleaned = line.replace(/^[•\-*]\s*/, '');
        const colonIdx = cleaned.indexOf(':');
        if (colonIdx > 0 && colonIdx < 38) {
          const label = cleaned.slice(0, colonIdx);
          const rest = highlightDateTimeHtml(cleaned.slice(colonIdx + 1).trim(), name);
          return `<div style="${bottomStyle}">
            <div style="font-size:12.5px;font-weight:800;color:#9a3412;margin-bottom:3px;line-height:1.4;">&bull; ${label}</div>
            <div style="font-size:13.5px;color:#374151;line-height:1.85;word-break:break-word;">${rest}</div>
          </div>`;
        }
        return `<div style="${bottomStyle}font-size:13.5px;color:#374151;line-height:1.85;word-break:break-word;">&bull; ${highlightDateTimeHtml(cleaned, name)}</div>`;
      })
      .join('');
  };

  const enHtml = renderBulletBlock(enRaw, '#fed7aa');
  const hiHtml = renderBulletBlock(hiRaw, '#fde68a');

  const nameBadgeInline = `<span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;${name}&nbsp;</span>`;
  const dateBadgeInline = `<span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;${dateSummary}&nbsp;</span>`;
  const timeBadgeInline = isPartial
    ? `<span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;${startTime12h} to ${endTime12h}&nbsp;</span>`
    : `<span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;Full Day Closure&nbsp;</span>`;

  let successCount = 0;
  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const ok = await sendEmail(recipient.email, subject, {
      badge,
      headline,
      body: `
        <p style="margin:0 0 10px;font-size:14.5px;line-height:1.7;">Dear <strong>${recipient.name || 'Scholar'}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.85;word-break:break-word;">${
          isPartial
            ? `Please be informed that <strong>Apna Lakshay Library</strong> will remain non-functional from ${timeBadgeInline} on ${dateBadgeInline} due to ${nameBadgeInline}. Regular study sessions will operate normally outside this window.`
            : `Please be informed that <strong>Apna Lakshay Library</strong> will observe a ${timeBadgeInline} on ${dateBadgeInline} on account of ${nameBadgeInline}.`
        }</p>
        ${enHtml ? `
          <div style="margin:16px 0;padding:14px 15px;background:#fffaf5;border-left:4px solid #e85d26;border-radius:6px;border-top:1px solid #fed7aa;border-right:1px solid #fed7aa;border-bottom:1px solid #fed7aa;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#9a3412;margin-bottom:12px;line-height:1.4;">Official Notice Summary (English) — ${name}</div>
            ${enHtml}
          </div>
        ` : ''}
        <div style="margin:16px 0;padding:14px 15px;background:#fffbeb;border-left:4px solid #d97706;border-radius:6px;border-top:1px solid #fde68a;border-right:1px solid #fde68a;border-bottom:1px solid #fde68a;">
          <div style="font-size:12px;font-weight:800;color:#92400e;margin-bottom:10px;line-height:1.4;">हिंदी आधिकारिक सूचना (Hindi Version) — ${name}</div>
          <p style="margin:0 0 14px;font-size:13.5px;color:#374151;line-height:1.9;word-break:break-word;">
            प्रिय <strong>${recipient.name || 'विद्यार्थी'}</strong>, आपको सूचित किया जाता है कि ${nameBadgeInline} के अवसर पर दिनांक ${dateBadgeInline} को <strong>अपना लक्ष्य लाइब्रेरी</strong> ${
              isPartial
                ? `में सेवाएं <span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;${startTime12h} से ${endTime12h}&nbsp;</span> तक आंशिक रूप से बंद रहेंगी (शेष समय में पुस्तकालय सामान्य रूप से खुला रहेगा)।`
                : `में <span style="color:#c2410c;font-weight:700;background-color:#ffedd5;border-radius:3px;">&nbsp;पूर्ण दिवस अवकाश (Full Day Closure)&nbsp;</span> रहेगा।`
            }
          </p>
          ${hiHtml || ''}
        </div>
      `,
      table: { rows: tableRows },
      cta: { label: 'Open Student Dashboard / डैशबोर्ड खोलें', url: `${APP_URL}/student/dashboard` },
      note: 'Attendance Protection Policy / उपस्थिति नियम: Your current attendance percentage will remain completely unchanged (neither reduced nor increased) if you are absent on a declared holiday. / घोषित अवकाश के दिन अनुपस्थित रहने पर आपकी वर्तमान उपस्थिति प्रतिशत (Attendance %) बिल्कुल अपरिवर्तित रहेगी (न घटेगी, न बढ़ेगी)।'
    });
    if (ok) successCount++;
  }
  return successCount > 0;
};

