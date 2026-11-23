const fs = require("fs");
const path = require("path");

/* PDF (pdfkit) sirf PNG aur JPEG support karta hai. */
const isPng = (buf) =>
    buf &&
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;

const isJpeg = (buf) =>
    buf &&
    buf.length > 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff;

const validOrNull = (buf) =>
    buf && (isPng(buf) || isJpeg(buf)) ? buf : null;

/*
 * src ho sakta hai:
 *  - https://... (Cloudinary / server URL)
 *  - data:image/png;base64,...
 *  - local path (backend ke relative), jaise assets/certificate/logo.png
 * Kuch bhi fail ho to null return karta hai, PDF phir bhi banegi.
 */
async function loadImage(src) {
    if (!src || typeof src !== "string") {
        return null;
    }

    try {
        if (src.startsWith("data:")) {
            const base64 = src.split(",")[1] || "";
            return validOrNull(Buffer.from(base64, "base64"));
        }

        if (/^https?:\/\//i.test(src)) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(src, {
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!res.ok) {
                return null;
            }

            return validOrNull(
                Buffer.from(await res.arrayBuffer())
            );
        }

        const localPath = path.isAbsolute(src)
            ? src
            : path.join(__dirname, "..", src);

        if (fs.existsSync(localPath)) {
            return validOrNull(fs.readFileSync(localPath));
        }

        return null;
    } catch (error) {
        console.error("Image load failed:", src, error.message);
        return null;
    }
}

module.exports = { loadImage };