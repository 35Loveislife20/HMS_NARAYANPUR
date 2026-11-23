const PDFDocument = require("pdfkit");

const GREEN = "#0b5d3b";
const GOLD = "#b8912f";
const CREAM = "#f8f3e3";
const INK = "#1f2a24";
const MUTED = "#6b7a73";

const toBuffer = (doc) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
    });

const drawSeal = (doc, cx, cy, r, color) => {
    doc.save();
    doc.circle(cx, cy, r).fill(color);
    doc.circle(cx, cy, r - 6).lineWidth(1.5).strokeColor("#ffffff").stroke();
    doc.fillColor("#ffffff")
        .font("Times-Bold")
        .fontSize(r * 0.45)
        .text("HMS", cx - r, cy - r * 0.28, {
            width: r * 2,
            align: "center",
        });
    doc.restore();
};

/* =========================================================
   REGISTRATION CERTIFICATE (landscape A4)
========================================================= */

const createCertificatePdf = async (d) => {
    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
    });

    const W = doc.page.width;
    const H = doc.page.height;

    doc.rect(0, 0, W, H).fill(CREAM);
    doc.lineWidth(10).strokeColor(GREEN).rect(14, 14, W - 28, H - 28).stroke();
    doc.lineWidth(1).strokeColor(GOLD).rect(28, 28, W - 56, H - 56).stroke();

    doc.fillColor(INK)
        .font("Times-Bold")
        .fontSize(26)
        .text("HOSPITAL MANAGEMENT SYSTEM", 0, 70, {
            align: "center",
            characterSpacing: 2,
        });

    doc.fillColor(MUTED)
        .font("Times-Roman")
        .fontSize(11)
        .text("CENTRAL ADMINISTRATION | HOSPITAL NETWORK REGISTRY", 0, 102, {
            align: "center",
            characterSpacing: 1,
        });

    doc.fillColor(INK)
        .font("Times-BoldItalic")
        .fontSize(38)
        .text("Certificate of Registration", 0, 135, { align: "center" });

    doc.font("Times-Roman")
        .fontSize(14)
        .text(`(No: ${d.regNo})`, 0, 190, { align: "center" });

    doc.fillColor(INK)
        .font("Times-Roman")
        .fontSize(14)
        .text("We hereby certify that ", 80, 228, {
            width: W - 160,
            align: "center",
            continued: true,
        })
        .font("Times-Bold")
        .text(d.hospitalName, { continued: true })
        .font("Times-Roman")
        .text(
            `, located at ${d.address}, has on this day been duly registered within the Hospital Management System (HMS) network.`,
            { align: "center" }
        );

    const field = (label, value, x, y, w) => {
        doc.font("Times-Roman")
            .fontSize(12)
            .fillColor(MUTED)
            .text(label, x, y, { lineBreak: false });

        const labelWidth = doc.widthOfString(label) + 8;
        const vx = x + labelWidth;

        doc.font("Times-Bold")
            .fontSize(12)
            .fillColor(INK)
            .text(value || "-", vx, y, {
                width: w - labelWidth,
                lineBreak: false,
                ellipsis: true,
            });

        doc.moveTo(vx, y + 17)
            .lineTo(x + w, y + 17)
            .lineWidth(0.5)
            .strokeColor(GOLD)
            .stroke();
    };

    const colL = 90;
    const colR = 420;
    const colW = 300;

    field("Hospital Name:", d.hospitalName, colL, 300, colW);
    field("Registration Number:", d.regNo, colR, 300, 290);
    field("License Number:", d.licenseNo, colL, 332, colW);
    field("License Valid Until:", d.licenseValidUntil, colR, 332, 290);
    field(
        "Contact:",
        `${d.phone || "-"} | ${d.email || "-"}`,
        colL,
        364,
        W - 180
    );

    drawSeal(doc, 130, 455, 40, GREEN);

    doc.fillColor(INK)
        .font("Times-Roman")
        .fontSize(13)
        .text(`Date: ${d.date}`, 210, 470, { lineBreak: false });

    doc.moveTo(W - 330, 462)
        .lineTo(W - 90, 462)
        .lineWidth(0.8)
        .strokeColor(INK)
        .stroke();

    doc.font("Times-Bold")
        .fontSize(11)
        .text("SUPER ADMINISTRATOR", W - 330, 470, {
            width: 240,
            align: "center",
            characterSpacing: 1,
        });

    doc.font("Times-Roman")
        .fontSize(11)
        .text("HOSPITAL MANAGEMENT SYSTEM", W - 330, 486, {
            width: 240,
            align: "center",
            characterSpacing: 1,
        });

    doc.fillColor(MUTED)
        .font("Times-Italic")
        .fontSize(8.5)
        .text(
            "SYSTEM-GENERATED HMS NETWORK REGISTRATION CERTIFICATE - NOT A GOVERNMENT DOCUMENT",
            0,
            H - 50,
            { align: "center", characterSpacing: 0.5 }
        );

    return toBuffer(doc);
};

/* =========================================================
   CREDENTIALS PDF (portrait A4)
========================================================= */

const createCredentialsPdf = async (d) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const W = doc.page.width;

    doc.rect(0, 0, W, 150).fill("#1d4ed8");

    doc.fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("Hospital Management System", 50, 40);

    doc.font("Helvetica")
        .fontSize(13)
        .text("Hospital Admin Login Credentials", 50, 70);

    doc.roundedRect(50, 100, 200, 24, 12)
        .lineWidth(1)
        .strokeColor("#ffffff")
        .stroke();

    doc.font("Helvetica-Bold")
        .fontSize(9)
        .text("OFFICIAL CREDENTIAL RECORD", 50, 108, {
            width: 200,
            align: "center",
            characterSpacing: 1,
        });

    const rows = [
        ["HOSPITAL NAME", d.hospitalName, false],
        ["HOSPITAL ID", d.hospitalCode, true],
        ["REGISTRATION NUMBER", d.regNo, true],
        ["LICENSE NUMBER", d.licenseNo, true],
        ["LOGIN EMAIL / USERNAME", d.loginEmail, false],
        ["PASSWORD", d.password, true],
        ["LOGIN URL", d.loginUrl, false],
        ["CREATED ON", d.createdOn, false],
    ];

    let y = 185;

    rows.forEach(([label, value, mono]) => {
        doc.fillColor("#6b7280")
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(label, 50, y + 4, { characterSpacing: 0.5, lineBreak: false });

        doc.fillColor(mono ? "#1d4ed8" : "#111827")
            .font(mono ? "Courier-Bold" : "Helvetica-Bold")
            .fontSize(12)
            .text(value || "-", 240, y, { width: 305 });

        y += 38;

        doc.moveTo(50, y - 8)
            .lineTo(W - 50, y - 8)
            .lineWidth(0.6)
            .dash(3, { space: 3 })
            .strokeColor("#cbd5e1")
            .stroke()
            .undash();
    });

    const noteY = y + 20;
    doc.roundedRect(50, noteY, W - 100, 60, 6)
        .fillAndStroke("#eff6ff", "#bfdbfe");

    doc.fillColor("#334155")
        .font("Helvetica")
        .fontSize(9.5)
        .text(
            "Keep these credentials confidential. Change the temporary password after the first login. Registration and license numbers above are the official numbers issued by HMS.",
            70,
            noteY + 14,
            { width: W - 140, lineGap: 3 }
        );

    return toBuffer(doc);
};

module.exports = {
    createCertificatePdf,
    createCredentialsPdf,
};