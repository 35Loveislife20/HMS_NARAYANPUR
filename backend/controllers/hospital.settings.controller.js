/* =========================================================
   HOSPITAL SETTINGS CONTROLLER
   PUT /api/hospitals/:id/settings

   - Image fields: khali value se purani image NAHI hatti.
     Hatane ke liye frontend explicitly null bheje.
   - Naya file (multer ke through) req.files se aata hai.
   - Jo column hospitals table mein nahi hai, wo error deta hai
     (pehle silently success bolta tha).
========================================================= */

const db = require("../config/db");
const { saveImageFile } = require("../utils/imageStore");

const HOSPITAL_ID_COLUMN = "id";

const TEXT_FIELDS = [
    "address", "city", "state", "pincode", "tagline",
];

/*
  Frontend ka field name -> hospitals table ka column.
  Dono naam (frontend + DB) accept hote hain.
  Column names apni table ke hisaab se confirm kijiye
  (SHOW COLUMNS FROM hospitals).
*/
const IMAGE_FIELD_MAP = {
    logo: "logo_url",
    logo_url: "logo_url",

    loginBackground: "login_background_image",
    login_background_image: "login_background_image",

    digitalSignature: "signature",
    signature: "signature",

    officialStamp: "stamp",
    stamp: "stamp",

    certificateSeal: "seal",
    seal: "seal",

    verifiedSticker: "verified_sticker",
    verified_sticker: "verified_sticker",
};

const UPLOAD_URL_PREFIX = "/uploads/hospitals";

const toNullIfEmpty = (value) => {
    if (value === undefined) return undefined;
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
};

const updateHospitalSettings = async (req, res) => {
    try {
        const hospitalId = req.params.id;
        const user = req.user || {};

        /* ---------- permission ---------- */
        const isSuperAdmin = user.role === "super_admin";
        const userHospitalId =
            user.hospital_id ?? user.hospitalId ?? user.hospital?.id ?? null;
        const isOwnHospitalAdmin =
            user.role === "hospital_admin" &&
            userHospitalId !== null &&
            String(userHospitalId) === String(hospitalId);

        if (!isSuperAdmin && !isOwnHospitalAdmin) {
            return res.status(403).json({
                success: false,
                message: "Sirf Super Admin ya is hospital ka admin settings badal sakta hai.",
            });
        }

        const body = req.body || {};
        const files = req.files || {};
        const updates = {};

        /* ---------- name ---------- */
        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (!name) {
                return res.status(400).json({ success: false, message: "Hospital name zaroori hai." });
            }
            updates.name = name;
        }

        /* ---------- text fields ---------- */
        TEXT_FIELDS.forEach((field) => {
            if (body[field] !== undefined) {
                updates[field] = toNullIfEmpty(body[field]);
            }
        });

        /* ---------- email ---------- */
        if (body.email !== undefined) {
            const email = toNullIfEmpty(body.email);
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ success: false, message: "Hospital email sahi nahi hai." });
            }
            updates.email = email;
        }

        /* ---------- phone ---------- */
        if (body.phone !== undefined) {
            updates.phone = toNullIfEmpty(body.phone);
        }

        /* ---------- beds ---------- */
        if (body.total_beds !== undefined || body.available_beds !== undefined) {
            const total = Number(body.total_beds);
            const available = Number(body.available_beds);

            if (
                !Number.isInteger(total) || !Number.isInteger(available) ||
                total < 0 || available < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Beds ki ginti poora number (0 ya zyada) honi chahiye.",
                });
            }
            if (available > total) {
                return res.status(400).json({
                    success: false,
                    message: "Available beds total beds se zyada nahi ho sakte.",
                });
            }
            updates.total_beds = total;
            updates.available_beds = available;
        }

        /* ---------- image fields ----------
           Priority:
             1. naya file (req.files)  -> path save
             2. body mein non-empty URL -> wahi save
             3. body mein null          -> explicitly clear (trash button)
             4. khali string ya field absent -> kuch nahi badlega
        ----------------------------------- */
        const imageUpdates = {};
        const requestedImageFields = new Set();

        const uploadedColumns = new Set();

        for (const [fieldName, column] of Object.entries(IMAGE_FIELD_MAP)) {
            const uploaded = files[fieldName]?.[0];

            if (uploaded) {
                requestedImageFields.add(column);
                imageUpdates[column] = await saveImageFile(uploaded, {
                    entityType: "hospital",
                    entityId: hospitalId,
                });
                uploadedColumns.add(column);
                continue;
            }

            if (uploadedColumns.has(column)) continue;

            if (!Object.prototype.hasOwnProperty.call(body, fieldName)) continue;

            const value = body[fieldName];
            requestedImageFields.add(column);

            if (value === null) {
                imageUpdates[column] = null;
            } else {
                const text = String(value).trim();
                if (text !== "") {
                    imageUpdates[column] = text;
                }
                // khali string -> column ko touch nahi karte
            }
        }

        Object.assign(updates, imageUpdates);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Update karne ke liye koi field nahi mili.",
            });
        }

        /* ---------- check columns exist ---------- */
        const [columnRows] = await db.query("SHOW COLUMNS FROM hospitals");
        const existing = new Set(columnRows.map((c) => c.Field));

        if (!existing.has(HOSPITAL_ID_COLUMN)) {
            return res.status(500).json({
                success: false,
                message: `hospitals table me "${HOSPITAL_ID_COLUMN}" column nahi mila.`,
            });
        }

        const missingColumns = Object.keys(updates).filter((key) => !existing.has(key));

        if (missingColumns.length > 0) {
            console.error("HOSPITAL SETTINGS: missing columns:", missingColumns);
            return res.status(500).json({
                success: false,
                message: `Ye columns hospitals table mein nahi hain: ${missingColumns.join(", ")}. SQL migration chalayein.`,
                missingColumns,
            });
        }

        const setClause = Object.keys(updates)
            .map((key) => `\`${key}\` = ?`)
            .join(", ");

        const [result] = await db.query(
            `UPDATE hospitals SET ${setClause} WHERE \`${HOSPITAL_ID_COLUMN}\` = ?`,
            [...Object.values(updates), hospitalId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Hospital nahi mila." });
        }

        /* saved values wapas bhejo taaki frontend turant dikha sake */
        const [rows] = await db.query(
            "SELECT * FROM hospitals WHERE `id` = ? LIMIT 1",
            [hospitalId]
        );

        return res.json({
            success: true,
            message: "Settings save ho gayi.",
            hospital: rows[0] || null,
        });
    } catch (error) {
        console.error("UPDATE HOSPITAL SETTINGS ERROR:", error);
        return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Settings save nahi ho payi." });
    }
};

module.exports = { updateHospitalSettings };