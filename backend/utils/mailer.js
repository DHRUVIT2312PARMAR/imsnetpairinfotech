const { Brevo, BrevoClient, BrevoEnvironment } = require("@getbrevo/brevo");

// Initialize client with API key
const client = new BrevoClient({
  environment: BrevoEnvironment.Production,
  apiKey:      process.env.BREVO_API_KEY,
});

/**
 * Send OTP email via Brevo API
 * @param {string} toEmail  - recipient personal email
 * @param {string} toName   - recipient first name
 * @param {string} otp      - 6-digit code
 * @param {string} purpose  - 'verification' | 'login' | 'reset'
 */
async function sendOTP(toEmail, toName, otp, purpose = "verification") {
  const subjects = {
    verification: "Verify your NetPair account",
    login:        "Your NetPair login code",
    reset:        "Reset your NetPair password",
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f9fafb">
      <div style="max-width:460px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <div style="background:#1a3fb5;padding:24px 32px">
          <h1 style="color:#ffffff;margin:0;font-size:20px;font-family:Arial,sans-serif;font-weight:600">NetPair Infotech</h1>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;font-family:Arial,sans-serif">Integrated Management System</p>
        </div>
        <div style="padding:32px">
          <p style="color:#374151;font-family:Arial,sans-serif;font-size:15px;margin:0 0 8px">Hello ${toName},</p>
          <p style="color:#6b7280;font-family:Arial,sans-serif;font-size:14px;margin:0 0 24px;line-height:1.6">
            ${purpose === "login" ? "Use the code below to complete your login." : "Use the code below to verify your NetPair account."}
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:48px;font-weight:700;letter-spacing:14px;color:#1a3fb5;font-family:'Courier New',monospace">${otp}</div>
          </div>
          <p style="color:#9ca3af;font-family:Arial,sans-serif;font-size:13px;margin:0 0 8px;text-align:center">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#9ca3af;font-family:Arial,sans-serif;font-size:13px;margin:0;text-align:center">Never share this code with anyone.</p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0">
          <p style="color:#d1d5db;font-family:Arial,sans-serif;font-size:12px;margin:0;text-align:center">If you didn't request this code, ignore this email.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="color:#d1d5db;font-family:Arial,sans-serif;font-size:12px;margin:0">Netpair Infotech · netpairinfotech.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await client.transactionalEmails.sendTransacEmail({
      sender:      { name: process.env.EMAIL_FROM_NAME || "NetPair IMS", email: process.env.EMAIL_FROM },
      to:          [{ email: toEmail, name: toName }],
      subject:     subjects[purpose] || subjects.verification,
      htmlContent,
    });
    console.log(`[Brevo] OTP sent to ${toEmail} (${purpose})`);
    return { success: true };
  } catch (err) {
    console.error("[Brevo] Email error:", err?.message || err);
    throw new Error("Failed to send verification email");
  }
}

module.exports = { sendOTP };
