const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const {
    createUser,
} = require("../models/user.model");

// =========================================================
// BASIC HELPERS
// =========================================================

const pick = (chars) => {
    return chars[crypto.randomInt(0, chars.length)];
};

// =========================================================
// GENERATE PASSWORD
// =========================================================

const generatePassword = (length = 10) => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnpqrstuvwxyz";
    const digits = "23456789";
    const symbols = "@#$%";

    const all = upper + lower + digits + symbols;

    const chars = [
        pick(upper),
        pick(lower),
        pick(digits),
        pick(symbols),
    ];

    while (chars.length < length) {
        chars.push(pick(all));
    }

    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(0, i + 1);

        [chars[i], chars[j]] = [
            chars[j],
            chars[i],
        ];
    }

    return chars.join("");
};

// =========================================================
// FORMAT HOSPITAL CODE
// Example: HSP-360001
// =========================================================

const formatHospitalCode = (id) => {
    return `HSP-${String(id).padStart(5, "0")}`;
};

// =========================================================
// FORMAT HMS REGISTRATION NUMBER
// IMPORTANT:
// This is an HMS internal registration number.
// It is NOT a government registration/licence number.
// Example: HMS-REG-2026-360001
// =========================================================

const formatHospitalRegistrationNumber = (
    id,
    year = new Date().getFullYear()
) => {
    return `HMS-REG-${year}-${String(id).padStart(6, "0")}`;
};


// =========================================================
// HMS LICENSE NUMBER + LICENSE VALIDITY
// License number is generated automatically from the hospital id
// when the Super Admin does not enter one manually.
// Example: HMS-LIC-2026-000012
//
// "Valid Until" is calculated from the hospital registration date
// (created_at) + LICENSE_VALIDITY_YEARS. Change the number below
// if you want a different validity period.
// =========================================================

const LICENSE_VALIDITY_YEARS = 1;

// =========================================================
// EMAIL ATTACHMENTS
// Email gets 2 PDFs:
//   1) Hospital_Admin_Login_Credentials.pdf
//   2) Hospital_Registration_Certificate.pdf (ORIGINAL green design)
// SMS never gets a PDF - it is a plain text message with the
// login credentials only.
// =========================================================

const ATTACH_CREDENTIALS_PDF = true;

const getHospitalBaseDate = (hospital) => {
    const raw =
        hospital?.created_at ||
        hospital?.createdAt ||
        hospital?.registration_date;

    const date = raw ? new Date(raw) : new Date();

    return Number.isNaN(date.getTime())
        ? new Date()
        : date;
};

const formatHospitalLicenseNumber = (
    id,
    year = new Date().getFullYear()
) => {
    // The licence number must NOT repeat the registration number digits
    // (registration = HMS-REG-<year>-<id>). The id is scrambled with a
    // fixed formula, so the same hospital always gets the same, unique
    // 6-digit licence number (7919 and 900000 are coprime = no duplicates).
    const numericId = Number(id);
    const base = Number.isFinite(numericId) ? Math.trunc(numericId) : 0;
    const scrambled = ((base * 7919 + 482653) % 900000) + 100000;

    return `HMS-LIC-${year}-${String(scrambled).padStart(6, "0")}`;
};

const getHospitalLicenseNumber = (hospital) => {
    const existing = String(
        hospital?.license_number ||
        hospital?.licenseNumber ||
        hospital?.licence_number ||
        hospital?.licenceNumber ||
        ""
    ).trim();

    if (existing) {
        return existing;
    }

    if (
        hospital?.id === undefined ||
        hospital?.id === null ||
        hospital?.id === ""
    ) {
        return "";
    }

    return formatHospitalLicenseNumber(
        hospital.id,
        getHospitalBaseDate(hospital).getFullYear()
    );
};

const getHospitalLicenseExpiry = (hospital) => {
    const date = new Date(
        getHospitalBaseDate(hospital)
    );

    date.setFullYear(
        date.getFullYear() +
        LICENSE_VALIDITY_YEARS
    );

    return date;
};

// YYYY-MM-DD (local date, no timezone shift)
const toDateOnly = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${mm}-${dd}`;
};

// =========================================================
// LOGIN URL
// =========================================================

const getLoginUrl = () => {
    const baseUrl =
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        "http://localhost:5173";

    return `${String(baseUrl).replace(/\/+$/, "")}/login`;
};

// =========================================================
// SAFE VALUE
// =========================================================

const safeValue = (
    value,
    fallback = "-"
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return fallback;
    }

    const result = String(value).trim();

    return result || fallback;
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (value) => {
    let date;

    if (!value) {
        date = new Date();
    } else {
        date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            date = new Date();
        }
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );
};

// =========================================================
// FIND HMS LOGO
// =========================================================

const findHmsLogo = () => {
    const possiblePaths = [
        // backend/public
        path.join(
            __dirname,
            "..",
            "public",
            "hms-logo.png"
        ),

        // backend/assets
        path.join(
            __dirname,
            "..",
            "assets",
            "hms-logo.png"
        ),

        // project public
        path.join(
            process.cwd(),
            "public",
            "hms-logo.png"
        ),

        // project assets
        path.join(
            process.cwd(),
            "assets",
            "hms-logo.png"
        ),

        // project root
        path.join(
            process.cwd(),
            "hms-logo.png"
        ),
    ];

    for (const logoPath of possiblePaths) {
        try {
            if (fs.existsSync(logoPath)) {
                return logoPath;
            }
        } catch (error) {
            // Ignore invalid path
        }
    }

    return null;
};

// =========================================================
// DRAW LOGO
// =========================================================

const drawLogo = (
    doc,
    options = {}
) => {
    const {
        x = 60,
        y = 45,
        width = 70,
        height = 70,
    } = options;

    const logoPath = findHmsLogo();

    if (!logoPath) {
        return false;
    }

    try {
        doc.image(
            logoPath,
            x,
            y,
            {
                fit: [
                    width,
                    height,
                ],
                align: "center",
                valign: "center",
            }
        );

        return true;
    } catch (error) {
        console.error(
            "Unable to draw HMS logo:",
            error.message
        );

        return false;
    }
};

// =========================================================
// PDF BUFFER
// =========================================================

const pdfToBuffer = (
    documentBuilder
) => {
    return new Promise(
        (resolve, reject) => {
            try {
                const doc =
                    new PDFDocument({
                        size: "A4",
                        margin: 50,
                        info: {
                            Title:
                                "Hospital Management System",
                            Author:
                                "Hospital Management System",
                        },
                    });

                const chunks = [];

                doc.on(
                    "data",
                    (chunk) => {
                        chunks.push(chunk);
                    }
                );

                doc.on(
                    "end",
                    () => {
                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );
                    }
                );

                doc.on(
                    "error",
                    (error) => {
                        reject(error);
                    }
                );

                documentBuilder(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        }
    );
};

// =========================================================
// PDF HEADER
// =========================================================

const drawPdfHeader = (
    doc,
    title,
    subtitle = ""
) => {
    const hasLogo = drawLogo(
        doc,
        {
            x: 50,
            y: 38,
            width: 70,
            height: 70,
        }
    );

    const titleX =
        hasLogo
            ? 135
            : 50;

    doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#163a63")
        .text(
            "HOSPITAL MANAGEMENT SYSTEM",
            titleX,
            48,
            {
                width:
                    hasLogo
                        ? 410
                        : 495,
                align: "left",
            }
        );

    doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor("#111827")
        .text(
            title,
            titleX,
            74,
            {
                width:
                    hasLogo
                        ? 410
                        : 495,
            }
        );

    if (subtitle) {
        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#6b7280")
            .text(
                subtitle,
                titleX,
                96,
                {
                    width:
                        hasLogo
                            ? 410
                            : 495,
                }
            );
    }

    doc
        .moveTo(50, 125)
        .lineTo(545, 125)
        .lineWidth(1)
        .strokeColor("#d1d5db")
        .stroke();

    doc.fillColor("#111827");
};

// =========================================================
// CREDENTIALS PDF
// =========================================================

const createCredentialsPdf = async ({
    hospitalId,
    hospitalName,
    hospitalCode,
    registrationNumber,
    licenseNumber,
    loginEmail,
    password,
    loginUrl,
    isPasswordReset = false,
}) => {
    return pdfToBuffer(
        (doc) => {
            drawPdfHeader(
                doc,
                "HOSPITAL ADMIN LOGIN CREDENTIALS",
                isPasswordReset
                    ? "Updated Hospital Administrator login credentials"
                    : "Hospital Administrator account credentials"
            );

            let y = 155;

            doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#374151")
                .text(
                    isPasswordReset
                        ? "Your Hospital Administrator password has been reset successfully. Please use the credentials below to access the HMS portal."
                        : "Your Hospital Administrator account has been created successfully in the Hospital Management System. Please use the credentials below to access the HMS portal.",
                    55,
                    y,
                    {
                        width: 485,
                        lineGap: 4,
                    }
                );

            y += 75;

            doc
                .roundedRect(
                    50,
                    y,
                    495,
                    290,
                    8
                )
                .lineWidth(1)
                .strokeColor("#d1d5db")
                .fillColor("#f8fafc")
                .fillAndStroke();

            y += 25;

            const drawRow = (
                label,
                value
            ) => {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .fillColor("#374151")
                    .text(
                        label,
                        75,
                        y,
                        {
                            width: 135,
                        }
                    );

                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .fillColor("#111827")
                    .text(
                        safeValue(value),
                        215,
                        y,
                        {
                            width: 295,
                        }
                    );

                y += 34;
            };

            drawRow(
                "Hospital",
                hospitalName
            );

            drawRow(
                "Hospital ID",
                hospitalCode
            );

            drawRow(
                "HMS Registration No.",
                registrationNumber
            );

            drawRow(
                "License Number",
                licenseNumber
            );

            drawRow(
                "Hospital Database ID",
                hospitalId
            );

            drawRow(
                "Login Email",
                loginEmail
            );

            drawRow(
                "Password",
                password
            );

            drawRow(
                "Login URL",
                loginUrl
            );

            y += 30;

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#991b1b")
                .text(
                    "Security Notice",
                    55,
                    y
                );

            y += 20;

            doc
                .font("Helvetica")
                .fontSize(9.5)
                .fillColor("#4b5563")
                .text(
                    "Keep these credentials confidential. For security, change your password after your first login. Never share your password with unauthorized persons.",
                    55,
                    y,
                    {
                        width: 485,
                        lineGap: 3,
                    }
                );

            doc
                .font("Helvetica")
                .fontSize(8)
                .fillColor("#6b7280")
                .text(
                    `Generated by Hospital Management System • ${formatDate(
                        new Date()
                    )}`,
                    50,
                    760,
                    {
                        width: 495,
                        align: "center",
                    }
                );
        }
    );
};

// =========================================================
// REGISTRATION CERTIFICATE PDF
// =========================================================

const createRegistrationCertificatePdf = async ({
    hospital,
    hospitalCode,
}) => {
    return pdfToBuffer(
        (doc) => {
            // =================================================
            // PAGE BORDER
            // =================================================

            doc
                .rect(
                    25,
                    25,
                    545,
                    792
                )
                .lineWidth(2)
                .strokeColor("#163a63")
                .stroke();

            doc
                .rect(
                    34,
                    34,
                    527,
                    774
                )
                .lineWidth(0.8)
                .strokeColor("#c9a227")
                .stroke();

            // =================================================
            // LOGO
            // =================================================

            drawLogo(
                doc,
                {
                    x: 262,
                    y: 52,
                    width: 70,
                    height: 70,
                }
            );

            // =================================================
            // HMS TITLE
            // =================================================

            doc
                .font("Helvetica-Bold")
                .fontSize(19)
                .fillColor("#163a63")
                .text(
                    "HOSPITAL MANAGEMENT SYSTEM",
                    60,
                    132,
                    {
                        width: 485,
                        align: "center",
                    }
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(22)
                .fillColor("#111827")
                .text(
                    "HOSPITAL REGISTRATION",
                    60,
                    166,
                    {
                        width: 485,
                        align: "center",
                    }
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(22)
                .fillColor("#111827")
                .text(
                    "CERTIFICATE",
                    60,
                    193,
                    {
                        width: 485,
                        align: "center",
                    }
                );

            // =================================================
            // CERTIFICATE NUMBER
            // =================================================

            const numericId =
                hospital?.id ||
                hospital?.hospital_id ||
                hospital?.hospitalId ||
                "";

            const year =
                new Date().getFullYear();

            const certificateNumber =
                `HRC-${year}-${String(
                    numericId || "00000"
                ).padStart(
                    5,
                    "0"
                )}`;

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#6b7280")
                .text(
                    `Certificate No.: ${certificateNumber}`,
                    60,
                    230,
                    {
                        width: 485,
                        align: "center",
                    }
                );

            // =================================================
            // INTRO
            // =================================================

            doc
                .font("Helvetica")
                .fontSize(11)
                .fillColor("#374151")
                .text(
                    "This is to certify that the following hospital has been successfully registered in the Hospital Management System (HMS) and has been assigned the registration details stated below.",
                    75,
                    270,
                    {
                        width: 455,
                        align: "center",
                        lineGap: 5,
                    }
                );

            // =================================================
            // HOSPITAL NAME
            // =================================================

            doc
                .font("Helvetica-Bold")
                .fontSize(18)
                .fillColor("#163a63")
                .text(
                    safeValue(
                        hospital?.name,
                        "Hospital"
                    ),
                    60,
                    340,
                    {
                        width: 485,
                        align: "center",
                    }
                );

            // =================================================
            // SEPARATE REGISTRATION + LICENSE NUMBERS
            // =================================================

            const hmsRegistrationNumber =
                safeValue(
                    hospital?.registration_number ||
                    hospital?.registrationNumber ||
                    hospital?.registration_no ||
                    hospital?.registrationNo ||
                    hospital?.hospital_registration_number ||
                    hospital?.hospitalRegistrationNumber ||
                    formatHospitalRegistrationNumber(
                        numericId || "00000"
                    )
                );

            const licenseNumber =
                safeValue(
                    getHospitalLicenseNumber(hospital)
                );

            const licenseValidUntil =
                formatDate(
                    getHospitalLicenseExpiry(hospital)
                );

            // =================================================
            // DETAILS BOX
            // =================================================

            const boxX = 70;
            const boxY = 385;
            const boxW = 455;

            // 9 rows
            const boxH = 272;

            doc
                .roundedRect(
                    boxX,
                    boxY,
                    boxW,
                    boxH,
                    8
                )
                .lineWidth(1)
                .fillColor("#f8fafc")
                .strokeColor("#d1d5db")
                .fillAndStroke();

            let y = 401;

            const registrationId =
                safeValue(
                    hospital?.hospital_id ||
                    hospital?.registration_id ||
                    hospital?.hospitalId ||
                    hospitalCode
                );

            const hospitalEmail =
                safeValue(
                    hospital?.email
                );

            const phone =
                safeValue(
                    hospital?.phone ||
                    hospital?.mobile ||
                    hospital?.contact
                );

            const completeAddress =
                safeValue(
                    hospital?.address
                );

            const city =
                safeValue(
                    hospital?.city ||
                    hospital?.location
                );

            const registrationDate =
                formatDate(
                    hospital?.created_at ||
                    hospital?.registration_date ||
                    hospital?.createdAt ||
                    new Date()
                );

            const rows = [
                [
                    "HMS Hospital ID",
                    registrationId,
                ],
                [
                    "HMS Registration No.",
                    hmsRegistrationNumber,
                ],
                [
                    "License Number",
                    licenseNumber,
                ],
                [
                    "License Valid Until",
                    licenseValidUntil,
                ],
                [
                    "Hospital Email",
                    hospitalEmail,
                ],
                [
                    "Phone",
                    phone,
                ],
                [
                    "Complete Address",
                    completeAddress,
                ],
                [
                    "City / Location",
                    city,
                ],
                [
                    "Registration Date",
                    registrationDate,
                ],
            ];

            rows.forEach(
                ([label, value]) => {
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(8.5)
                        .fillColor("#374151")
                        .text(
                            label,
                            boxX + 18,
                            y,
                            {
                                width: 175,
                            }
                        );

                    doc
                        .font("Helvetica")
                        .fontSize(8.5)
                        .fillColor("#111827")
                        .text(
                            value,
                            boxX + 190,
                            y,
                            {
                                width: 235,
                            }
                        );

                    y += 27;
                }
            );

            // =================================================
            // AUTHORIZATION
            // =================================================

            doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor("#374151")
                .text(
                    "Authorized by:",
                    70,
                    670
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#163a63")
                .text(
                    "HMS Super Administrator",
                    70,
                    688
                );

            // =================================================
            // SIGNATURE
            // =================================================

            doc
                .moveTo(
                    350,
                    700
                )
                .lineTo(
                    510,
                    700
                )
                .lineWidth(1)
                .strokeColor("#374151")
                .stroke();

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#374151")
                .text(
                    "Official Signature",
                    350,
                    707,
                    {
                        width: 160,
                        align: "center",
                    }
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(9)
                .fillColor("#163a63")
                .text(
                    "HMS Super Administrator",
                    350,
                    724,
                    {
                        width: 160,
                        align: "center",
                    }
                );

            // =================================================
            // FOOTER / DISCLAIMER
            // =================================================

            doc
                .font("Helvetica")
                .fontSize(7.5)
                .fillColor("#6b7280")
                .text(
                    "This certificate confirms registration of the hospital within the Hospital Management System (HMS). The HMS Registration Number is an internal system identifier. This document does not represent a government license, statutory registration, accreditation, or legal operating permit.",
                    65,
                    755,
                    {
                        width: 465,
                        align: "center",
                        lineGap: 2,
                    }
                );
        }
    );
};

// =========================================================
// PROVISION HOSPITAL ADMIN
// =========================================================

const provisionHospitalAdmin = async ({
    hospitalId,
    hospitalName,
    email,
    phone = null,
}) => {
    try {
        if (!hospitalId) {
            throw new Error(
                "Hospital ID is required."
            );
        }

        if (!hospitalName) {
            throw new Error(
                "Hospital name is required."
            );
        }

        if (!email) {
            throw new Error(
                "Hospital email is required."
            );
        }

        const password =
            generatePassword();

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const result =
            await createUser(
                `${hospitalName} Admin`,
                email,
                hashedPassword,
                phone,
                "hospital_admin",
                null,
                hospitalId
            );

        if (
            !result ||
            !result.insertId
        ) {
            throw new Error(
                "Hospital Admin could not be created."
            );
        }

        return {
            userId:
                result.insertId,

            hospitalId,

            hospitalName,

            hospitalCode:
                formatHospitalCode(
                    hospitalId
                ),

            registrationNumber:
                formatHospitalRegistrationNumber(
                    hospitalId
                ),

            loginEmail:
                email,

            password,

            loginUrl:
                getLoginUrl(),
        };
    } catch (error) {
        console.error(
            "====================================================="
        );

        console.error(
            "HOSPITAL ADMIN PROVISIONING FAILED"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "SQL State:",
            error.sqlState
        );

        console.error(
            "SQL Message:",
            error.sqlMessage
        );

        console.error(
            "====================================================="
        );

        throw error;
    }
};

// =========================================================
// BUILD MAIL TRANSPORTER
// =========================================================

const buildTransporter = () => {
    const env = process.env;

    const user =
        env.EMAIL_USER ||
        env.SMTP_USER ||
        env.MAIL_USER;

    const pass =
        env.EMAIL_PASS ||
        env.EMAIL_PASSWORD ||
        env.SMTP_PASS ||
        env.MAIL_PASS;

    const service =
        env.EMAIL_SERVICE ||
        env.MAIL_SERVICE;

    if (!user) {
        throw new Error(
            "EMAIL_USER / SMTP_USER / MAIL_USER is missing in .env"
        );
    }

    if (!pass) {
        throw new Error(
            "EMAIL_PASS / SMTP_PASS / MAIL_PASS is missing in .env"
        );
    }

    // =====================================================
    // SERVICE BASED
    // =====================================================

    if (service) {
        return nodemailer.createTransport({
            service,
            auth: {
                user,
                pass,
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
        });
    }

    // =====================================================
    // HOST BASED SMTP
    // =====================================================

    const host =
        env.EMAIL_HOST ||
        env.SMTP_HOST ||
        "smtp.gmail.com";

    const port =
        Number(
            env.EMAIL_PORT ||
            env.SMTP_PORT ||
            465
        );

    const secure =
        String(
            env.EMAIL_SECURE ||
            env.SMTP_SECURE ||
            (port === 465)
        ).toLowerCase() ===
        "true";

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized:
                false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
    });
};

// =========================================================
// ESCAPE HTML
// =========================================================

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// =========================================================
// VERIFY EMAIL CONFIGURATION
// =========================================================

const verifyEmailTransporter = async () => {
    try {
        const transporter =
            buildTransporter();

        await transporter.verify();

        console.log(
            "====================================================="
        );

        console.log(
            "HMS EMAIL SMTP: CONNECTED"
        );

        console.log(
            "EMAIL USER:",
            process.env.EMAIL_USER ||
            process.env.SMTP_USER ||
            process.env.MAIL_USER
        );

        console.log(
            "EMAIL HOST:",
            process.env.EMAIL_HOST ||
            process.env.SMTP_HOST ||
            "smtp.gmail.com"
        );

        console.log(
            "EMAIL PORT:",
            process.env.EMAIL_PORT ||
            process.env.SMTP_PORT ||
            465
        );

        console.log(
            "====================================================="
        );

        return true;
    } catch (error) {
        console.error(
            "====================================================="
        );

        console.error(
            "HMS EMAIL SMTP: CONNECTION FAILED"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "Response:",
            error.response
        );

        console.error(
            "Response Code:",
            error.responseCode
        );

        console.error(
            "====================================================="
        );

        return false;
    }
};

// =========================================================
// SEND HOSPITAL CREDENTIAL EMAIL
// =========================================================

const sendHospitalCredentialsEmail = async ({
    to,
    hospital,
    hospitalId,
    hospitalName,
    hospitalCode,
    registrationNumber,
    licenseNumber,
    loginEmail,
    password,
    loginUrl,
    isPasswordReset = false,
}) => {
    try {
        // =================================================
        // RECIPIENT
        // =================================================

        const recipient =
            to ||
            loginEmail ||
            hospital?.email;

        if (!recipient) {
            throw new Error(
                "Recipient email is missing."
            );
        }

        // =================================================
        // FROM
        // =================================================

        const from =
            process.env.EMAIL_FROM ||
            process.env.SMTP_FROM ||
            process.env.EMAIL_USER ||
            process.env.SMTP_USER ||
            process.env.MAIL_USER;

        if (!from) {
            throw new Error(
                "EMAIL_FROM / SMTP_FROM / EMAIL_USER is missing."
            );
        }

        // =================================================
        // NORMALIZE DATA
        // =================================================

        const finalHospitalName =
            safeValue(
                hospitalName ||
                hospital?.name,
                "Hospital"
            );

        const finalHospitalId =
            hospitalId ||
            hospital?.id ||
            hospital?.hospital_id ||
            hospital?.hospitalId;

        const finalHospitalCode =
            hospitalCode ||
            formatHospitalCode(
                finalHospitalId ||
                "00000"
            );

        const finalRegistrationNumber =
            registrationNumber ||
            hospital?.registration_number ||
            hospital?.registrationNumber ||
            hospital?.registration_no ||
            hospital?.registrationNo ||
            formatHospitalRegistrationNumber(
                finalHospitalId ||
                "00000"
            );

        const finalLicenseNumber =
            licenseNumber ||
            hospital?.license_number ||
            hospital?.licenseNumber ||
            hospital?.licence_number ||
            hospital?.licenceNumber ||
            hospital?.license_no ||
            hospital?.licenseNo ||
            hospital?.licence_no ||
            hospital?.licenceNo ||
            hospital?.license ||
            hospital?.licence ||
            getHospitalLicenseNumber(hospital) ||
            "-";

        const finalLoginEmail =
            loginEmail ||
            hospital?.email ||
            recipient;

        const finalLoginUrl =
            loginUrl ||
            getLoginUrl();

        // =================================================
        // ATTACHMENTS
        // =================================================

        const attachments = [];

        if (ATTACH_CREDENTIALS_PDF) {
            const credentialsPdf =
                await createCredentialsPdf({
                    hospitalId:
                        finalHospitalId,

                    hospitalName:
                        finalHospitalName,

                    hospitalCode:
                        finalHospitalCode,

                    registrationNumber:
                        finalRegistrationNumber,

                    licenseNumber:
                        finalLicenseNumber,

                    loginEmail:
                        finalLoginEmail,

                    password,

                    loginUrl:
                        finalLoginUrl,

                    isPasswordReset,
                });

            attachments.push({
                filename:
                    "Hospital_Admin_Login_Credentials.pdf",

                content:
                    credentialsPdf,

                contentType:
                    "application/pdf",
            });
        }

        // =================================================
        // REGISTRATION CERTIFICATE (ORIGINAL DESIGN)
        // =================================================

        if (
            hospital &&
            typeof hospital === "object"
        ) {
            const certificateHospital = {
                ...hospital,

                registration_number:
                    hospital.registration_number ||
                    hospital.registrationNumber ||
                    finalRegistrationNumber,

                license_number:
                    hospital.license_number ||
                    hospital.licenseNumber ||
                    finalLicenseNumber,
            };

            let certificatePdf = null;

            try {
                // eslint-disable-next-line global-require
                const {
                    createOriginalCertificatePdf,
                } = require("./certificatePdf.service");

                certificatePdf =
                    await createOriginalCertificatePdf({
                        hospital:
                            certificateHospital,

                        hospitalCode:
                            finalHospitalCode,

                        registrationNumber:
                            certificateHospital.registration_number,

                        licenseNumber:
                            getHospitalLicenseNumber(
                                certificateHospital
                            ),

                        licenseExpiryDate:
                            getHospitalLicenseExpiry(
                                certificateHospital
                            ),
                    });

                console.log(
                    "✅ Original certificate PDF created (Puppeteer)"
                );
            } catch (originalCertificateError) {
                console.error(
                    "❌ Original certificate PDF FAILED, so the simple certificate is being sent instead."
                );

                console.error(
                    "Reason:",
                    originalCertificateError.message
                );

                console.error(
                    "Fix: in the backend folder run  npm install puppeteer  and restart the server."
                );

                try {
                    certificatePdf =
                        await createRegistrationCertificatePdf({
                            hospital:
                                certificateHospital,

                            hospitalCode:
                                finalHospitalCode,
                        });
                } catch (certificateError) {
                    console.error(
                        "Registration certificate generation failed:",
                        certificateError.message
                    );
                }
            }

            if (certificatePdf) {
                attachments.push({
                    filename:
                        "Hospital_Registration_Certificate.pdf",

                    content:
                        certificatePdf,

                    contentType:
                        "application/pdf",
                });
            }
        }

        // =================================================
        // SUBJECT
        // =================================================

        const subject =
            isPasswordReset
                ? `Updated HMS login credentials - ${finalHospitalName}`
                : `HMS Hospital Registration & Login Details - ${finalHospitalName}`;

        // =================================================
        // PLAIN TEXT
        // =================================================

        const text = [
            "Welcome to Hospital Management System!",
            "",

            `Hospital: ${finalHospitalName}`,

            `Hospital ID: ${finalHospitalCode}`,

            `HMS Registration Number: ${finalRegistrationNumber}`,

            `License Number: ${finalLicenseNumber}`,

            "",

            "Hospital Admin Login Details",

            `Login Email: ${finalLoginEmail}`,

            `Password: ${password}`,

            `Login URL: ${finalLoginUrl}`,

            "",

            isPasswordReset
                ? "Your Hospital Admin password has been reset successfully."
                : "Your Hospital Admin account has been created successfully.",

            "",

            'Select your hospital and the role "Hospital Admin" on the login page.',

            "For security, please change your password after the first login.",

            "",

            hospital
                ? "Your email also contains the Hospital Registration Certificate PDF."
                : "",

            "",

            "This is an automated email from the Hospital Management System.",
        ].join("\n");

        // =================================================
        // HTML CERTIFICATE SECTION
        // =================================================

        const certificateText =
            hospital
                ? `
<div style="
    margin-top:24px;
    padding:16px 18px;
    background:#f0fdf4;
    border:1px solid #bbf7d0;
    border-radius:10px;
">
    <div style="
        font-size:15px;
        font-weight:700;
        color:#166534;
        margin-bottom:10px;
    ">
        Hospital Registration Details
    </div>

    <div style="
        font-size:13px;
        line-height:1.8;
        color:#374151;
    ">
        <strong>HMS Registration Number:</strong>
        ${escapeHtml(finalRegistrationNumber)}
        <br />

        <strong>License Number:</strong>
        ${escapeHtml(finalLicenseNumber)}
    </div>

    <div style="
        margin-top:10px;
        font-size:13px;
        line-height:1.6;
        color:#374151;
    ">
        Your HMS Hospital Registration Certificate
        is attached to this email as a printable PDF.
    </div>
</div>
`
                : "";

        // =================================================
        // HTML EMAIL
        // =================================================

        const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>
        ${escapeHtml(subject)}
    </title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f3f4f6;
        font-family:Arial,Helvetica,sans-serif;
        color:#111827;
    "
>

<div
    style="
        max-width:680px;
        margin:30px auto;
        padding:0 15px;
    "
>

<div
    style="
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        border:1px solid #e5e7eb;
        box-shadow:0 10px 30px rgba(0,0,0,.06);
    "
>

<!-- HEADER -->

<div
    style="
        padding:28px 30px;
        background:#163a63;
        color:#ffffff;
    "
>

    <div
        style="
            font-size:13px;
            letter-spacing:1px;
            opacity:.85;
            margin-bottom:8px;
        "
    >
        HOSPITAL MANAGEMENT SYSTEM
    </div>

    <div
        style="
            font-size:24px;
            font-weight:700;
            line-height:1.3;
        "
    >
        ${
            isPasswordReset
                ? "Updated Hospital Admin Credentials"
                : "Hospital Registration Successful"
        }
    </div>

</div>

<!-- CONTENT -->

<div
    style="
        padding:30px;
    "
>

<p
    style="
        margin:0 0 18px;
        font-size:15px;
        line-height:1.7;
        color:#374151;
    "
>
    Hello,
</p>

<p
    style="
        margin:0 0 22px;
        font-size:15px;
        line-height:1.7;
        color:#374151;
    "
>
    ${
        isPasswordReset
            ? "Your Hospital Administrator password has been reset successfully."
            : "Your hospital has been successfully registered in the Hospital Management System."
    }
</p>

<!-- HOSPITAL -->

<div
    style="
        padding:18px;
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:12px;
        margin-bottom:20px;
    "
>

    <div
        style="
            font-size:12px;
            color:#6b7280;
            margin-bottom:5px;
        "
    >
        HOSPITAL
    </div>

    <div
        style="
            font-size:18px;
            font-weight:700;
            color:#163a63;
        "
    >
        ${escapeHtml(finalHospitalName)}
    </div>

    <div
        style="
            margin-top:6px;
            font-size:13px;
            color:#6b7280;
        "
    >
        Hospital ID:
        <strong>
            ${escapeHtml(finalHospitalCode)}
        </strong>
    </div>

</div>

<!-- REGISTRATION DETAILS -->

<div
    style="
        font-size:17px;
        font-weight:700;
        color:#111827;
        margin-bottom:14px;
    "
>
    Hospital Registration Details
</div>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        border-collapse:collapse;
        border:1px solid #e5e7eb;
        margin-bottom:20px;
    "
>

<tr>

<td
    style="
        padding:12px;
        background:#f9fafb;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
        font-weight:700;
        width:40%;
    "
>
    HMS Registration Number
</td>

<td
    style="
        padding:12px;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
        font-weight:700;
    "
>
    ${escapeHtml(finalRegistrationNumber)}
</td>

</tr>

<tr>

<td
    style="
        padding:12px;
        background:#f9fafb;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
        font-weight:700;
    "
>
    License Number
</td>

<td
    style="
        padding:12px;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
    "
>
    ${escapeHtml(finalLicenseNumber)}
</td>

</tr>

</table>

<!-- LOGIN DETAILS -->

<div
    style="
        font-size:17px;
        font-weight:700;
        color:#111827;
        margin-bottom:14px;
    "
>
    Hospital Admin Login Details
</div>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        border-collapse:collapse;
        border:1px solid #e5e7eb;
    "
>

<tr>

<td
    style="
        padding:12px;
        background:#f9fafb;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
        font-weight:700;
        width:35%;
    "
>
    Login Email
</td>

<td
    style="
        padding:12px;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
    "
>
    ${escapeHtml(finalLoginEmail)}
</td>

</tr>

<tr>

<td
    style="
        padding:12px;
        background:#f9fafb;
        border-bottom:1px solid #e5e7eb;
        font-size:13px;
        font-weight:700;
    "
>
    Password
</td>

<td
    style="
        padding:12px;
        border-bottom:1px solid #e5e7eb;
        font-size:14px;
        font-weight:700;
        letter-spacing:.5px;
    "
>
    ${escapeHtml(password)}
</td>

</tr>

<tr>

<td
    style="
        padding:12px;
        background:#f9fafb;
        font-size:13px;
        font-weight:700;
    "
>
    Login URL
</td>

<td
    style="
        padding:12px;
        font-size:13px;
        word-break:break-all;
    "
>
    ${escapeHtml(finalLoginUrl)}
</td>

</tr>

</table>

<!-- CERTIFICATE -->

${certificateText}

<!-- SECURITY -->

<div
    style="
        margin-top:24px;
        padding:16px 18px;
        background:#fff7ed;
        border:1px solid #fed7aa;
        border-radius:10px;
    "
>

    <div
        style="
            font-size:14px;
            font-weight:700;
            color:#9a3412;
            margin-bottom:6px;
        "
    >
        Security Notice
    </div>

    <div
        style="
            font-size:13px;
            line-height:1.6;
            color:#7c2d12;
        "
    >
        Please keep these credentials confidential.
        Change your password after your first login
        and never share your password with unauthorized persons.
    </div>

</div>

<!-- ATTACHMENTS -->

<div
    style="
        margin-top:24px;
        font-size:13px;
        line-height:1.7;
        color:#4b5563;
    "
>

    <strong>
        Attachments:
    </strong>

    <ul
        style="
            margin:8px 0 0;
            padding-left:20px;
        "
    >

        ${
            ATTACH_CREDENTIALS_PDF
                ? `
<li>
    Hospital_Admin_Login_Credentials.pdf
</li>
`
                : ""
        }

        ${
            hospital
                ? `
<li>
    Hospital_Registration_Certificate.pdf
</li>
`
                : ""
        }

    </ul>

</div>

</div>

<!-- FOOTER -->

<div
    style="
        padding:20px 30px;
        background:#f9fafb;
        border-top:1px solid #e5e7eb;
        text-align:center;
    "
>

<div
    style="
        font-size:12px;
        color:#6b7280;
        line-height:1.6;
    "
>
    This is an automated email from
    <strong>
        Hospital Management System
    </strong>.
</div>

<div
    style="
        margin-top:5px;
        font-size:11px;
        color:#9ca3af;
    "
>
    ${formatDate(new Date())}
</div>

</div>

</div>

</div>

</body>

</html>
`;

        // =================================================
        // SMTP TRANSPORTER
        // =================================================

        const transporter =
            buildTransporter();

        // =================================================
        // VERIFY SMTP BEFORE SEND
        // =================================================

        try {
            await transporter.verify();

            console.log(
                "HMS SMTP verification successful."
            );
        } catch (verifyError) {
            console.error(
                "====================================================="
            );

            console.error(
                "HMS SMTP VERIFICATION FAILED"
            );

            console.error(
                "Message:",
                verifyError.message
            );

            console.error(
                "Code:",
                verifyError.code
            );

            console.error(
                "Command:",
                verifyError.command
            );

            console.error(
                "Response:",
                verifyError.response
            );

            console.error(
                "Response Code:",
                verifyError.responseCode
            );

            console.error(
                "====================================================="
            );

            return false;
        }

        // =================================================
        // SEND
        // =================================================

        const info =
            await transporter.sendMail({
                from,
                to: recipient,
                subject,
                text,
                html,
                attachments,
            });

        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "====================================================="
        );

        console.log(
            "HOSPITAL CREDENTIAL EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            "To:",
            recipient
        );

        console.log(
            "Message ID:",
            info.messageId
        );

        console.log(
            "Response:",
            info.response
        );

        console.log(
            "Attachments:",
            attachments
                .map(
                    (item) =>
                        item.filename
                )
                .join(", ")
        );

        console.log(
            "====================================================="
        );

        return true;
    } catch (error) {
        // =================================================
        // COMPLETE EMAIL ERROR
        // =================================================

        console.error(
            "====================================================="
        );

        console.error(
            "HOSPITAL CREDENTIAL EMAIL FAILED"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Name:",
            error.name
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "Response:",
            error.response
        );

        console.error(
            "Response Code:",
            error.responseCode
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "====================================================="
        );

        return false;
    }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    generatePassword,

    formatHospitalCode,

    formatHospitalRegistrationNumber,

    formatHospitalLicenseNumber,

    getHospitalLicenseNumber,

    getHospitalLicenseExpiry,

    toDateOnly,

    provisionHospitalAdmin,

    sendHospitalCredentialsEmail,

    verifyEmailTransporter,

    createRegistrationCertificatePdf,
};