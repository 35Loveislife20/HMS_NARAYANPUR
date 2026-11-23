const nodemailer = require("nodemailer");
const { createCredentialsPdf } = require("./hospitalPdf.service");

/* =========================================================
   TRANSPORTER
   1) Pehle config/email.js ka transporter use karega.
   2) Nahi mila to .env ke SMTP values se banayega.
========================================================= */

let cachedTransporter = null;

const getTransporter = () => {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    try {
        const emailConfig = require("../config/email");

        const existing =
            emailConfig.transporter ||
            emailConfig.default ||
            null;

        if (existing && typeof existing.sendMail === "function") {
            cachedTransporter = existing;
            return cachedTransporter;
        }
    } catch (error) {
        // config/email.js nahi mili, fallback use hoga
    }

    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: String(process.env.SMTP_SECURE) === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return cachedTransporter;
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/* =========================================================
   EMAIL BODY (credentials card style)
========================================================= */

const buildWelcomeHtml = ({
    hospitalName,
    hospitalCode,
    regNo,
    licenseNo,
    loginEmail,
    password,
    loginUrl,
    createdOn,
}) => {
    const row = (label, value, mono = false) => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px dashed #dbe4f5;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;font-weight:bold;width:40%;">${label}</td>
            <td style="padding:12px 0;border-bottom:1px dashed #dbe4f5;font-size:14px;color:${mono ? "#1d4ed8" : "#111827"};font-weight:bold;${mono ? "font-family:Consolas,'Courier New',monospace;" : ""}">${escapeHtml(value)}</td>
        </tr>`;

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="background:#1d4ed8;padding:26px 30px;color:#ffffff;">
            <div style="font-size:22px;font-weight:bold;">Hospital Management System</div>
            <div style="font-size:14px;margin-top:6px;opacity:0.9;">Hospital Admin Login Credentials</div>
            <div style="display:inline-block;margin-top:14px;border:1px solid #ffffff;border-radius:14px;padding:4px 12px;font-size:10px;letter-spacing:1.5px;font-weight:bold;">OFFICIAL CREDENTIAL RECORD</div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 30px 8px 30px;font-size:14px;color:#222222;line-height:1.6;">
            Dear <strong>${escapeHtml(hospitalName)}</strong>,<br/>
            Aapka hospital HMS par register ho gaya hai. Neeche aapke login details diye gaye hain. Registration certificate (PDF) bhi attached hai.
          </td>
        </tr>

        <tr>
          <td style="padding:8px 30px 0 30px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row("Hospital Name", hospitalName)}
              ${row("Hospital ID", hospitalCode)}
              ${row("Registration Number", regNo, true)}
              ${row("License Number", licenseNo, true)}
              ${row("Login Email / Username", loginEmail)}
              ${row("Password", password, true)}
              ${row("Login URL", loginUrl)}
              ${row("Created On", createdOn)}
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:24px 30px 8px 30px;">
            <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:8px;">Login to HMS</a>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 30px 24px 30px;">
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;font-size:12px;color:#334155;line-height:1.6;">
              Ye credentials kisi ke saath share na karein. Pehli baar login karne ke baad temporary password zaroor change karein. Registration aur license numbers HMS dwara jaari kiye gaye hain.
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:14px 30px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;">
            Ye email system dwara bheja gaya hai. Help ke liye HMS team se contact karein.<br/>
            <strong>HMS Team</strong>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
};

/* =========================================================
   SEND ONE EMAIL
   Attachments:
   1) certificatePdf  -> controller se (same design as print page)
   2) Login credentials PDF -> yahin banta hai
   Returns true / false. Controller ko error throw nahi karta.
========================================================= */

const sendHospitalWelcomeEmail = async ({
    to,
    hospitalName,
    hospitalCode,
    regNo,
    licenseNo,
    loginEmail,
    password,
    loginUrl,
    certificatePdf,
}) => {
    if (!to) {
        console.error("Welcome email: recipient (to) missing");
        return false;
    }

    try {
        const transporter = getTransporter();

        const from =
            process.env.EMAIL_USER ||
            process.env.SMTP_USER;

        const createdOn = new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const credentialsPdf = await createCredentialsPdf({
            hospitalName,
            hospitalCode,
            regNo,
            licenseNo,
            loginEmail,
            password,
            loginUrl,
            createdOn,
        });

        const attachments = [];

        if (certificatePdf) {
            attachments.push({
                filename: `Registration_Certificate_${hospitalCode}.pdf`,
                content: certificatePdf,
                contentType: "application/pdf",
            });
        }

        attachments.push({
            filename: `Login_Credentials_${hospitalCode}.pdf`,
            content: credentialsPdf,
            contentType: "application/pdf",
        });

        await transporter.sendMail({
            from: `"HMS" <${from}>`,
            to,
            subject: `HMS Registration - ${hospitalName} (Login Details & Certificate)`,
            html: buildWelcomeHtml({
                hospitalName,
                hospitalCode,
                regNo,
                licenseNo,
                loginEmail,
                password,
                loginUrl,
                createdOn,
            }),
            attachments,
        });

        return true;
    } catch (error) {
        console.error("Hospital welcome email error:", error.message);
        return false;
    }
};

module.exports = { sendHospitalWelcomeEmail };