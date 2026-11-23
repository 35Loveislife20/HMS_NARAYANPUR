const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const GREEN = "#0b5d3b";
const GOLD = "#b8912f";
const CREAM = "#f7f1dc";
const INK = "#1f2a24";
const MUTED = "#5f6b65";
const BLUE = "#1d4ed8";

const toBuffer = (doc) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
    });

const fmtDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/*
 * d = {
 *   hospitalName, hospitalCode, address, regNo, licenseNo,
 *   licenseValidUntil, phone, email, date
 * }
 * images = {
 *   emblem:    Buffer | null   (Ashok Stambh, top center)
 *   logo:      Buffer | null   (Admin Logo, top left)
 *   seal:      Buffer | null   (Official Stamp, bottom center)
 *   signature: Buffer | null   (Digital Signature)
 * }
 */
const createCertificatePdf = async (d, images = {}) => {
    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
    });

    const W = doc.page.width;
    const H = doc.page.height;
    const k = W / 1122;

    const S = (v) => v * k;
    const X = (v) => v * k;
    const Y = (v) => v * k;

    const text = (
        str,
        x,
        yBase,
        { size = 17, font = "Times-Roman", color = INK, align = "left", width } = {}
    ) => {
        doc.font(font).fontSize(S(size)).fillColor(color);
        const top = Y(yBase) - S(size) * 0.85;
        doc.text(String(str ?? "-"), X(x), top, {
            width: width !== undefined ? X(width) : undefined,
            align,
            lineBreak: false,
            ellipsis: true,
        });
    };

    const field = (label, value, x, yBase, w) => {
        doc.font("Times-Roman").fontSize(S(17));
        const lw = doc.widthOfString(label) + S(6);
        const labelPx = lw / k;

        text(label, x, yBase, { size: 17, color: MUTED });
        text(value || "-", x + labelPx, yBase, {
            size: 17,
            font: "Times-Bold",
            width: w - labelPx,
        });

        doc.moveTo(X(x) + lw, Y(yBase + 6))
            .lineTo(X(x + w), Y(yBase + 6))
            .lineWidth(0.6)
            .strokeColor(GOLD)
            .stroke();
    };

    /* ---------- Background and borders ---------- */
    doc.rect(0, 0, W, H).fill(CREAM);
    doc.lineWidth(S(14)).strokeColor(GREEN)
        .rect(S(8), S(8), W - S(16), H - S(16)).stroke();
    doc.lineWidth(S(2)).strokeColor(GOLD)
        .rect(S(60), S(60), W - S(120), H - S(120)).stroke();
    doc.lineWidth(S(1)).strokeColor(GREEN)
        .rect(S(68), S(68), W - S(136), H - S(136)).stroke();

    /* ---------- Ashok Stambh (top center) ---------- */
    if (images.emblem) {
        doc.image(images.emblem, X(521), Y(0), { width: S(80) });
    }

    /* ---------- Titles ---------- */
    text("HOSPITAL MANAGEMENT SYSTEM", 0, 128, {
        size: 34, font: "Times-Bold", align: "center", width: 1122,
    });
    text("CENTRAL ADMINISTRATION  •  HOSPITAL NETWORK REGISTRY", 0, 165, {
        size: 16, color: MUTED, align: "center", width: 1122,
    });

    doc.lineWidth(0.8).strokeColor(GOLD)
        .moveTo(X(370), Y(186)).lineTo(X(752), Y(186)).stroke();
    doc.circle(X(561), Y(186), S(4)).fill(GOLD);

    text("THE SUPER ADMINISTRATOR, HMS", 0, 215, {
        size: 15, font: "Times-Bold", align: "center", width: 1122,
    });
    text("Certificate of Registration", 0, 282, {
        size: 56, font: "Times-BoldItalic", align: "center", width: 1122,
    });
    text(`(No: ${d.regNo} )`, 0, 325, {
        size: 19, align: "center", width: 1122,
    });

    /* ---------- Admin Logo (top left) ---------- */
    if (images.logo) {
        doc.image(images.logo, X(85), Y(145), { fit: [S(160), S(160)] });
    } else {
        doc.circle(X(165), Y(232), S(80)).fill(BLUE);
        doc.font("Times-Bold").fontSize(S(40)).fillColor("#ffffff")
            .text("HMS", X(85), Y(218), { width: X(160), align: "center" });
    }

    /* ---------- Hospital code and QR (top right) ---------- */
    text(d.hospitalCode, 900, 200, {
        size: 17, font: "Times-Bold", align: "center", width: 115,
    });

    const qrBuffer = await QRCode.toBuffer(
        `HMS|${d.hospitalCode || ""}|${d.regNo || ""}`,
        { width: 300, margin: 1 }
    );
    doc.image(qrBuffer, X(912), Y(212), { width: S(91) });

    /* ---------- Body paragraph ---------- */
    doc.font("Times-Roman").fontSize(S(17)).fillColor(INK);
    doc.text("We hereby certify that ", X(119), Y(340), {
        width: X(886),
        align: "justify",
        continued: true,
        lineGap: S(6),
    })
        .font("Times-Bold")
        .text(d.hospitalName || "-", { continued: true })
        .font("Times-Roman")
        .text(
            `, located at ${d.address || "-"}, has on this day been duly registered within the Hospital Management System (HMS) network.`,
            { align: "justify", lineGap: S(6) }
        );

    /* ---------- Fields ---------- */
    field("Hospital Name:", d.hospitalName, 119, 486, 430);
    field("Registration Number:", d.regNo, 576, 486, 430);
    field("License Number:", d.licenseNo, 119, 524, 430);
    field("License Valid Until:", fmtDate(d.licenseValidUntil), 576, 524, 430);
    field("Contact:", `${d.phone || "-"} | ${d.email || "-"}`, 119, 562, 886);

    /* ---------- Official Stamp / Muhar (bottom center) ---------- */
    if (images.seal) {
        doc.image(images.seal, X(461), Y(578), { fit: [S(124), S(124)] });
    } else {
        doc.circle(X(523), Y(640), S(62)).fill(BLUE);
        doc.font("Times-Bold").fontSize(S(26)).fillColor("#ffffff")
            .text("HMS", X(461), Y(628), { width: X(124), align: "center" });
    }

    /* ---------- Date ---------- */
    text(`Date: ${d.date || fmtDate(new Date())}`, 168, 648, { size: 17 });

    /* ---------- Digital Signature ---------- */
    if (images.signature) {
        doc.image(images.signature, X(752), Y(585), { fit: [S(140), S(60)] });
    }
    doc.moveTo(X(653), Y(646)).lineTo(X(1022), Y(646))
        .lineWidth(0.8).strokeColor(INK).stroke();

    text("SUPER ADMINISTRATOR", 653, 667, {
        size: 15, font: "Times-Bold", align: "center", width: 369,
    });
    text("HOSPITAL MANAGEMENT SYSTEM", 653, 689, {
        size: 15, align: "center", width: 369,
    });

    /* ---------- Footer ---------- */
    text(
        "SYSTEM-GENERATED HMS NETWORK REGISTRATION CERTIFICATE - NOT A GOVERNMENT DOCUMENT",
        0, 714,
        { size: 11, font: "Times-Italic", color: MUTED, align: "center", width: 1122 }
    );

    return toBuffer(doc);
};

module.exports = { createCertificatePdf };