const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

const { pool } = require("../config/db");

/*
 * SMTP settings.
 * Pehle SMTP_* variables dekhe jate hain, na mile to EMAIL_* / MAIL_* wale
 * (jo aapke forgot-password email.service me ho sakte hain).
 */
const SMTP_HOST =
    process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";

const SMTP_PORT = Number(
    process.env.SMTP_PORT || process.env.EMAIL_PORT || 587
);

const SMTP_USER =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.MAIL_USER;

const SMTP_PASS =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.MAIL_PASS;

const MAIL_FROM =
    process.env.MAIL_FROM || process.env.EMAIL_FROM || SMTP_USER;

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[c]));

const roleLabel = (role) =>
    String(role || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

/*
 * Random temporary password (10 chars, confusing letters removed).
 */
function generatePassword(length = 10) {
    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";

    const bytes = crypto.randomBytes(length);

    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/*
 * Login credentials PDF (Buffer).
 */
function buildCredentialPdf({
    name,
    role,
    email,
    password,
    hospitalName,
    loginUrl,
}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(22).fillColor("#000000").text(hospitalName, {
            align: "center",
        });

        doc.moveDown().fontSize(16).text("Login Credentials", {
            align: "center",
        });

        doc.moveDown(2).fontSize(12);
        doc.text(`Name: ${name}`);
        doc.text(`Role: ${roleLabel(role)}`);
        doc.text(`Login ID (Email): ${email}`);
        doc.text(`Temporary Password: ${password}`);
        doc.text(`Login URL: ${loginUrl}`);

        doc.moveDown(2).fontSize(10).fillColor("red").text(
            "Please change your password at your first login. " +
                "Do not share this document with anyone."
        );

        doc.end();
    });
}

async function getHospitalName(hospitalId) {
    if (!hospitalId) {
        return "HMS Hospital";
    }

    try {
        const [rows] = await pool.query(
            "SELECT name FROM hospitals WHERE id = ? LIMIT 1",
            [hospitalId]
        );

        return rows[0]?.name || "HMS Hospital";
    } catch {
        return "HMS Hospital";
    }
}

/*
 * User create hone ke baad call karo.
 *  - users.must_change_password = 1 set karta hai
 *  - credentials PDF banakar email bhejta hai
 *
 * Kabhi throw nahi karta. Mail na ja paye to false return karta hai,
 * taaki registration fail na ho.
 */
async function issueCredentials({
    userId,
    name,
    email,
    role,
    password,
    hospitalId,
    hospitalName,
}) {
    try {
        if (userId) {
            await pool.query(
                "UPDATE users SET must_change_password = 1 WHERE id = ?",
                [userId]
            );
        }

        if (!email) {
            return false;
        }

        const finalHospitalName =
            hospitalName || (await getHospitalName(hospitalId));

        const loginUrl =
            process.env.FRONTEND_URL || "http://localhost:5173";

        const pdf = await buildCredentialPdf({
            name,
            role,
            email,
            password,
            hospitalName: finalHospitalName,
            loginUrl,
        });

        await transporter.sendMail({
            from: MAIL_FROM,
            to: email,
            subject: `${finalHospitalName} - Your Login Credentials`,
            html: `
                <p>Namaste <b>${escapeHtml(name)}</b>,</p>
                <p>Aapka <b>${escapeHtml(roleLabel(role))}</b> account
                   <b>${escapeHtml(finalHospitalName)}</b> me ban gaya hai.</p>
                <p>
                    <b>Login ID:</b> ${escapeHtml(email)}<br/>
                    <b>Temporary Password:</b> ${escapeHtml(password)}
                </p>
                <p><a href="${escapeHtml(loginUrl)}">Yahan login karein</a></p>
                <p>Credentials ki PDF attached hai.
                   Pehli baar login karte hi apna password zaroor badlein.</p>`,
            attachments: [
                {
                    filename: "login-credentials.pdf",
                    content: pdf,
                    contentType: "application/pdf",
                },
            ],
        });

        return true;
    } catch (error) {
        console.error("CREDENTIAL MAIL ERROR:", error.message);
        return false;
    }
}

module.exports = {
    generatePassword,
    issueCredentials,
};