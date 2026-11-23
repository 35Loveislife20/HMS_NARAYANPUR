const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST;
  transporter = host
    ? nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user, pass },
      })
    : nodemailer.createTransport({ service: "gmail", auth: { user, pass } });

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function issueCredentials({ userId, name, email, role, password, hospitalId }) {
  try {
    const tx = getTransporter();
    if (!tx) {
      console.warn("issueCredentials: mail credentials missing in .env, email not sent");
      return false;
    }

    const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const from =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      process.env.EMAIL_USER ||
      process.env.MAIL_USER;

    await tx.sendMail({
      from,
      to: email,
      subject: "Your HMS login credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
          <h2 style="color: #0b5d3b;">Welcome to HMS</h2>
          <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
          <p>Your <strong>${escapeHtml(role)}</strong> account has been created.</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>Login Email</strong></td><td style="padding: 6px 12px; border: 1px solid #ddd;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>Password</strong></td><td style="padding: 6px 12px; border: 1px solid #ddd;">${escapeHtml(password)}</td></tr>
          </table>
          <p>Login: <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
          <p style="color: #b00020;"><strong>Please change your password after your first login.</strong></p>
          <p>Regards,<br/>HMS Team</p>
        </div>`,
    });

    return true;
  } catch (err) {
    console.error("issueCredentials failed:", err.message);
    return false;
  }
}

module.exports = { issueCredentials };