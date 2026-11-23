const crypto = require("crypto");

const { transporter } = require("./email.service");
const { sendSMS } = require("./sms.service");

// =====================================================
// SETTINGS
// =====================================================

const OTP_TTL_MS = 5 * 60 * 1000;            // OTP valid for 5 minutes
const LOGIN_WINDOW_MS = 10 * 60 * 1000;      // OTP must be asked within 10 min of the password check
const RESEND_COOLDOWN_MS = 30 * 1000;        // 30 seconds between two OTPs
const MAX_ATTEMPTS = 5;                      // wrong tries per OTP

// Roles that must pass OTP after password. Change in .env:
//   OTP_REQUIRED_ROLES=hospital_admin,doctor
const OTP_REQUIRED_ROLES = String(
    process.env.OTP_REQUIRED_ROLES || "hospital_admin"
)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const otpRequiredFor = (user) =>
    OTP_REQUIRED_ROLES.includes(String(user?.role || "").trim());

// =====================================================
// HELPERS
// =====================================================

const getSecret = () =>
    process.env.OTP_SECRET || process.env.JWT_SECRET || "hms-otp-secret";

const hashOtp = (userId, otp) =>
    crypto
        .createHmac("sha256", getSecret())
        .update(`${userId}:${otp}`)
        .digest("hex");

const generateOtp = () =>
    String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const safeEqual = (a, b) => {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));

    return (
        left.length === right.length &&
        crypto.timingSafeEqual(left, right)
    );
};

const maskEmail = (email = "") => {
    const [name, domain] = String(email).split("@");

    if (!name || !domain) return "";

    return `${name.slice(0, 2)}${"*".repeat(
        Math.max(1, name.length - 2)
    )}@${domain}`;
};

const maskPhone = (phone = "") => {
    const digits = String(phone).replace(/\D/g, "");

    if (digits.length < 4) return "";

    return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
};

// =====================================================
// SEND OTP BY EMAIL / SMS
// =====================================================

const sendOtpEmail = async (to, name, otp) => {
    const from = process.env.EMAIL_USER || process.env.SMTP_USER;

    await transporter.sendMail({
        from: `"HMS Hospital" <${from}>`,
        to,
        subject: "HMS Login OTP",
        text:
            `Hello ${name || "User"},\n\n` +
            `Your HMS login OTP is ${otp}.\n` +
            `It is valid for ${OTP_TTL_MS / 60000} minutes. Do not share it with anyone.\n\n` +
            `HMS Hospital`,
        html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#0f766e;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">HMS Hospital - Login OTP</div>
  <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
    Hello ${String(name || "User").replace(/[<>&"]/g, "")},<br/>
    Use this OTP to complete your login:
    <div style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;margin:22px 0;color:#0f766e">${otp}</div>
    Valid for <strong>${OTP_TTL_MS / 60000} minutes</strong>. Do not share it with anyone.
  </div>
</div>`,
    });
};

const sendOtpSms = async (phone, otp) => {
    const result = await sendSMS(
        phone,
        `Your HMS login OTP is ${otp}. Valid for ${OTP_TTL_MS / 60000} minutes. Do not share it.`
    );

    if (!result.success) {
        throw new Error(result.error || "SMS could not be sent");
    }
};

module.exports = {
    OTP_TTL_MS,
    LOGIN_WINDOW_MS,
    RESEND_COOLDOWN_MS,
    MAX_ATTEMPTS,
    otpRequiredFor,
    hashOtp,
    generateOtp,
    safeEqual,
    maskEmail,
    maskPhone,
    sendOtpEmail,
    sendOtpSms,
};