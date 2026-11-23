/**
 * =========================================================
 * HOSPITAL CERTIFICATE - SEND BY EMAIL / WHATSAPP
 * =========================================================
 *
 * POST /api/hospitals/:id/send-certificate
 *
 * The frontend renders the SAME certificate that is printed,
 * converts it to PDF and uploads it here as "certificate".
 * This route:
 *   1. saves the PDF   -> uploads/certificates/<random>.pdf
 *   2. e-mails the PDF as an attachment        (channels: email)
 *   3. sends the PDF on WhatsApp               (channels: whatsapp)
 *
 * ---------------------------------------------------------
 * MOUNT (app.js) - protect it with your existing auth middleware
 * and mount it BEFORE the normal hospitals router:
 *
 *   app.use(
 *     "/api/hospitals",
 *     verifyToken,                       // your Super Admin auth middleware
 *     require("./routes/hospitalCertificate.routes")
 *   );
 *
 * ---------------------------------------------------------
 * .env
 *
 *   # public URL of this backend (WhatsApp must be able to download the PDF)
 *   PUBLIC_BASE_URL=https://api.yourdomain.com
 *
 *   # EMAIL: uses the existing config/email.js (EMAIL_USER / EMAIL_PASS)
 *   # so no extra SMTP settings are needed.
 *
 *   # WHATSAPP (Meta WhatsApp Cloud API) - optional
 *   WHATSAPP_TOKEN=EAAG...
 *   WHATSAPP_PHONE_NUMBER_ID=123456789012345
 *   WHATSAPP_API_VERSION=v20.0
 *   WHATSAPP_DEFAULT_COUNTRY_CODE=91
 *   # Approved template with a DOCUMENT header and ONE body variable {{1}}
 *   # (hospital name). Needed to message a number that has not written
 *   # to you in the last 24 hours. If empty, a normal document message
 *   # is sent (works only inside the 24-hour window).
 *   WHATSAPP_CERT_TEMPLATE=hospital_certificate
 *   WHATSAPP_TEMPLATE_LANG=en
 *
 * If the WhatsApp variables are missing the route answers with a
 * wa.me link and the frontend opens WhatsApp Web with the message
 * and the certificate link ready to send.
 *
 * Needs Node 18+ (global fetch).
 * =========================================================
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// same Gmail transporter that sends the login-credential e-mails
const { transporter } = require("../config/email");

const router = express.Router();

/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

const certificateDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "certificates"
);

fs.mkdirSync(certificateDirectory, { recursive: true });

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only a PDF certificate can be uploaded."));
        }
        cb(null, true);
    },
});

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

const clean = (value) =>
    value === undefined || value === null ? "" : String(value).trim();

const escapeHtml = (value) =>
    clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const getPublicBaseUrl = (req) =>
    (
        process.env.PUBLIC_BASE_URL ||
        `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");

const normalizePhone = (raw) => {
    const countryCode =
        process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

    let digits = clean(raw).replace(/\D/g, "");

    if (digits.length === 11 && digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    if (digits.length === 10) {
        digits = countryCode + digits;
    }

    return digits;
};

/* ---------------------------------------------------------
   EMAIL
--------------------------------------------------------- */

async function sendCertificateEmail({
    to,
    hospitalName,
    registrationNumber,
    pdfBuffer,
    filename,
}) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email is not configured (EMAIL_USER / EMAIL_PASS in .env).");
    }

    const name = escapeHtml(hospitalName || "Hospital");
    const regNo = escapeHtml(registrationNumber);
    const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const detailRow = (label, value) =>
        `<tr>` +
        `<td style="padding:9px 14px;border-bottom:1px solid #e6dfc6;color:#5b6b5f;font-size:13px;width:42%">${label}</td>` +
        `<td style="padding:9px 14px;border-bottom:1px solid #e6dfc6;color:#1d2b1f;font-size:14px;font-weight:700">${value}</td>` +
        `</tr>`;

    const html =
        `<div style="margin:0;padding:24px 12px;background:#eef2ec;font-family:Segoe UI,Arial,sans-serif">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d9e2d6">` +
        /* header */
        `<tr><td style="background:#1f4a2c;padding:26px 28px;text-align:center">` +
        `<div style="color:#f3e7b5;font-size:12px;letter-spacing:3px">CENTRAL ADMINISTRATION</div>` +
        `<div style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1.5px;margin-top:6px">HOSPITAL MANAGEMENT SYSTEM</div>` +
        `<div style="height:2px;width:90px;background:#c9a545;margin:14px auto 0"></div>` +
        `</td></tr>` +
        /* body */
        `<tr><td style="padding:28px 28px 8px;color:#1d2b1f;font-size:15px;line-height:1.65">` +
        `<h2 style="margin:0 0 14px;font-size:20px;color:#1f4a2c">Certificate of Registration</h2>` +
        `<p style="margin:0 0 12px">Dear <b>${name}</b>,</p>` +
        `<p style="margin:0 0 16px">Congratulations! Your hospital has been successfully registered in the ` +
        `<b>Hospital Management System (HMS)</b> network. Your official Certificate of Registration is attached to this email as a PDF.</p>` +
        `</td></tr>` +
        /* details card */
        `<tr><td style="padding:0 28px 8px">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f7f1de;border:1px solid #e0d4a4;border-radius:10px;border-collapse:separate;overflow:hidden">` +
        detailRow("Hospital Name", name) +
        (regNo ? detailRow("Registration Number", regNo) : "") +
        detailRow("Issued On", escapeHtml(today)) +
        `</table></td></tr>` +
        `<tr><td style="padding:16px 28px 26px;color:#5b6b5f;font-size:13px;line-height:1.6">` +
        `Please keep this certificate for your records. If you have any questions, simply reply to this email.` +
        `<p style="margin:16px 0 0;color:#1d2b1f;font-size:14px">Regards,<br/><b>Super Administrator</b><br/>Hospital Management System</p>` +
        `</td></tr>` +
        /* footer */
        `<tr><td style="background:#f4f6f3;padding:14px 28px;text-align:center;color:#8a978d;font-size:11px;letter-spacing:.4px">` +
        `System-generated HMS network registration certificate - not a government document.` +
        `</td></tr>` +
        `</table></div>`;

    await transporter.sendMail({
        from: process.env.MAIL_FROM || `"Hospital Management System" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Certificate of Registration - ${hospitalName || "Hospital"}`,
        text:
            `Dear ${hospitalName || "Hospital Administrator"},\n\n` +
            `Congratulations! Your hospital has been registered in the ` +
            `Hospital Management System (HMS) network.\n` +
            (registrationNumber ? `Registration Number: ${registrationNumber}\n` : "") +
            `Issued On: ${today}\n\n` +
            `Your Certificate of Registration is attached to this email.\n\n` +
            `Regards,\nSuper Administrator\nHospital Management System`,
        html,
        attachments: [
            {
                filename,
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });
}

/* ---------------------------------------------------------
   WHATSAPP
--------------------------------------------------------- */

async function sendCertificateWhatsApp({
    phone,
    hospitalName,
    pdfUrl,
    filename,
}) {
    const to = normalizePhone(phone);

    const caption =
        `Certificate of Registration - ${hospitalName || "Hospital"}\n` +
        `Hospital Management System (HMS)`;

    /* fallback link (works without any API) */
    const link =
        `https://wa.me/${to}?text=` +
        encodeURIComponent(`${caption}\n${pdfUrl}`);

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        return { sent: false, reason: "not_configured", link };
    }

    if (/localhost|127\.0\.0\.1/i.test(pdfUrl)) {
        return {
            sent: false,
            error:
                "PUBLIC_BASE_URL must be a public https URL so WhatsApp can download the PDF.",
            link,
        };
    }

    const template = clean(process.env.WHATSAPP_CERT_TEMPLATE);

    const payload = template
        ? {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: template,
                language: {
                    code: process.env.WHATSAPP_TEMPLATE_LANG || "en",
                },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "document",
                                document: { link: pdfUrl, filename },
                            },
                        ],
                    },
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: hospitalName || "Hospital" },
                        ],
                    },
                ],
            },
        }
        : {
            messaging_product: "whatsapp",
            to,
            type: "document",
            document: { link: pdfUrl, filename, caption },
        };

    const version = process.env.WHATSAPP_API_VERSION || "v20.0";

    const response = await fetch(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        return {
            sent: false,
            error: data?.error?.message || `WhatsApp API error (${response.status})`,
            link,
        };
    }

    return { sent: true, messageId: data?.messages?.[0]?.id || "" };
}

/* ---------------------------------------------------------
   ROUTE
--------------------------------------------------------- */

router.post(
    "/:id/send-certificate",
    (req, res, next) => {
        upload.single("certificate")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message || "Certificate upload failed.",
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Certificate PDF is missing.",
                });
            }

            const hospitalId = clean(req.params.id).replace(/[^\w-]/g, "");
            const hospitalName = clean(req.body.hospitalName);
            const registrationNumber = clean(req.body.registrationNumber);
            const email = clean(req.body.email);
            const phone = clean(req.body.phone);

            const channels = clean(req.body.channels || "email")
                .toLowerCase()
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            /* 1. save the PDF (random name -> link cannot be guessed) */
            const safeFilename = `HMS-Certificate-${hospitalId}.pdf`;
            const storedName = `${hospitalId}-${crypto
                .randomBytes(12)
                .toString("hex")}.pdf`;

            await fs.promises.writeFile(
                path.join(certificateDirectory, storedName),
                req.file.buffer
            );

            const pdfUrl = `${getPublicBaseUrl(req)}/uploads/certificates/${storedName}`;

            const result = {
                success: true,
                certificateUrl: pdfUrl,
                message: "Certificate processed.",
            };

            /* 2. email */
            if (channels.includes("email")) {
                try {
                    if (!email) throw new Error("Hospital email is missing.");

                    await sendCertificateEmail({
                        to: email,
                        hospitalName,
                        registrationNumber,
                        pdfBuffer: req.file.buffer,
                        filename: safeFilename,
                    });

                    result.email = { sent: true };
                } catch (error) {
                    console.error("❌ certificate email error:", error);
                    result.email = { sent: false, error: error.message };
                }
            }

            /* 3. whatsapp */
            if (channels.includes("whatsapp")) {
                try {
                    if (!phone) throw new Error("Hospital phone is missing.");

                    result.whatsapp = await sendCertificateWhatsApp({
                        phone,
                        hospitalName,
                        pdfUrl,
                        filename: safeFilename,
                    });
                } catch (error) {
                    console.error("❌ certificate whatsapp error:", error);
                    result.whatsapp = { sent: false, error: error.message };
                }
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error("❌ send-certificate error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to send the certificate.",
            });
        }
    }
);

module.exports = router;