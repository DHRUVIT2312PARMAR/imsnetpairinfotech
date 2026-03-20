const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const send = async (to, subject, html) => {
  const transporter = createTransporter();
  if (!transporter) return; // Email not configured — skip silently
  try {
    await transporter.sendMail({
      from: `"NetPair Infotech" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to, subject, html,
    });
  } catch {
    // Non-critical — don't crash the request
  }
};

exports.sendOTPEmail = (to, name, otp) =>
  send(to, "Your NetPair verification code", `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1a3fb5">NetPair Infotech</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your one-time verification code is:</p>
      <h1 style="letter-spacing:10px;font-size:36px;color:#0c447c;text-align:center;background:#f1f5f9;padding:16px;border-radius:8px">${otp}</h1>
      <p>Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      <p style="color:#6b7280;font-size:13px">This is an automated message from NetPair IMS.</p>
    </div>
  `);

exports.sendLeaveApprovalEmail = (email, name, leaveType, fromDate, toDate) =>
  send(email, "Leave Request Approved ✅", `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1a3fb5">NetPair Infotech</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${leaveType}</strong> leave request from <strong>${fromDate}</strong> to <strong>${toDate}</strong> has been <span style="color:#059669;font-weight:bold">approved</span>.</p>
      <p style="color:#6b7280;font-size:13px">This is an automated message from NetPair IMS.</p>
    </div>
  `);

exports.sendLeaveRejectionEmail = (email, name, leaveType, reason) =>
  send(email, "Leave Request Rejected ❌", `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1a3fb5">NetPair Infotech</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${leaveType}</strong> leave request has been <span style="color:#dc2626;font-weight:bold">rejected</span>.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
      <p style="color:#6b7280;font-size:13px">This is an automated message from NetPair IMS.</p>
    </div>
  `);

exports.sendAttendanceAlertEmail = (email, name, date) =>
  send(email, "Attendance Marked ✅", `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1a3fb5">NetPair Infotech</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your attendance for <strong>${date}</strong> has been recorded.</p>
      <p style="color:#6b7280;font-size:13px">This is an automated message from NetPair IMS.</p>
    </div>
  `);
