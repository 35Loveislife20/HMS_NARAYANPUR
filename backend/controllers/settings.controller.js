/**
 * =========================================================
 * HMS SETTINGS CONTROLLER
 * =========================================================
 *
 * Handles:
 * - Hospital settings
 * - Super Admin branding
 * - Admin Name / Email
 * - Admin Logo upload
 * - Background Image upload
 * - Digital Signature + Official Stamp (muhar) upload / URL
 * - Logo sizes
 * - Background settings
 * - Heading settings
 * - Tagline settings
 * - Font settings
 * - Image URL / Base64 values
 *
 * Database:
 * MySQL / TiDB
 *
 * Table:
 * settings
 * =========================================================
 */

const dbModule = require("../config/db");

/* =========================================================
   DATABASE CONNECTION
========================================================= */

const db = dbModule?.pool || dbModule;

/**
 * Works with:
 * - mysql2 pool
 * - mysql2 connection
 * - promise-enabled pool
 */
async function query(sql, params = []) {
    if (!db || typeof db.query !== "function") {
        throw new Error("Database connection is not available.");
    }

    if (typeof db.promise === "function") {
        return db.promise().query(sql, params);
    }

    return db.query(sql, params);
}

/* =========================================================
   AUTO MIGRATION - signature + stamp columns
   Adds admin_signature / admin_stamp to `settings` if missing.
   Runs only once per server start.
========================================================= */

let brandingColumnsPromise = null;

function ensureBrandingColumns() {
    if (!brandingColumnsPromise) {
        brandingColumnsPromise = (async () => {
            const columns = [
                "admin_signature",
                "admin_stamp",
            ];

            for (const column of columns) {
                const [found] = await query(
                    `SHOW COLUMNS FROM settings LIKE ?`,
                    [column]
                );

                if (!found || !found.length) {
                    await query(
                        `ALTER TABLE settings ADD COLUMN ${column} MEDIUMTEXT NULL`
                    );

                    console.log(
                        `✅ settings.${column} column added`
                    );
                }
            }
        })().catch((error) => {
            brandingColumnsPromise = null;
            throw error;
        });
    }

    return brandingColumnsPromise;
}

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
    id: 1,

    /* -----------------------------------------------------
       HOSPITAL SETTINGS
    ----------------------------------------------------- */

    hospital_name: "HMS Hospital Narayanpur",
    hospital_email: "",
    phone: "",
    address: "Narayanpur, Uttar Pradesh, India",
    tagline: "Smart Healthcare Management",

    admin_name: "",
    admin_email: "",

    appointment_notifications: 1,
    billing_notifications: 1,
    system_notifications: 1,

    timezone: "Asia/Kolkata",
    currency: "INR",
    date_format: "DD/MM/YYYY",

    logo: "/hms-logo.png",

    selected_hospital_id: 120001,

    /* -----------------------------------------------------
       SUPER ADMIN BRANDING
    ----------------------------------------------------- */

    super_admin_logo: "/hms-logo.png",

    login_title: "Administrative Control Panel",

    login_subtitle: "HMS Administration",

    login_background_image: "",

    /* Certificate branding */

    admin_signature: "",

    admin_stamp: "",

    /* -----------------------------------------------------
       LOGO SETTINGS
    ----------------------------------------------------- */

    logo_background_mode: "transparent",

    logo_shadow: 1,

    logo_size: 100,

    logo_x: 0,

    logo_y: 0,

    /* Independent logo sizes */

    top_logo_size: 100,

    login_logo_size: 100,

    background_logo_size: 100,

    patient_card_logo_size: 100,

    /* -----------------------------------------------------
       BACKGROUND SETTINGS
    ----------------------------------------------------- */

    background_size: 100,

    background_x: 50,

    background_y: 50,

    background_shadow: 0,

    /* -----------------------------------------------------
       FEATHER
    ----------------------------------------------------- */

    feather_enabled: 0,

    feather_amount: 0,

    feather_softness: 50,

    /* -----------------------------------------------------
       VIGNETTE
    ----------------------------------------------------- */

    vignette_enabled: 0,

    vignette_intensity: 30,

    vignette_softness: 50,

    vignette_size: 100,

    vignette_x: 50,

    vignette_y: 50,

    /* -----------------------------------------------------
       LEGACY / GENERAL NAME SETTINGS
    ----------------------------------------------------- */

    name_size: 24,

    name_x: 0,

    name_y: 0,

    name_color: "#ffffff",

    name_font_family: "system",

    name_font_weight: 700,

    name_letter_spacing: 0,

    name_shadow: 1,

    /* -----------------------------------------------------
       LEGACY / GENERAL TAGLINE SETTINGS
    ----------------------------------------------------- */

    tagline_text: "Smart Healthcare Management",

    tagline_size: 14,

    tagline_x: 0,

    tagline_y: 0,

    tagline_color: "#ffffff",

    tagline_font_family: "system",

    tagline_font_weight: 400,

    tagline_letter_spacing: 0,

    tagline_shadow: 0,

    /* -----------------------------------------------------
       INDEPENDENT HEADING SIZES
    ----------------------------------------------------- */

    control_panel_heading_size: 19,

    administration_heading_size: 24,

    /* -----------------------------------------------------
       INDEPENDENT TAGLINE SIZES
    ----------------------------------------------------- */

    login_tagline_size: 9,

    patient_tagline_size: 14,
};

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/**
 * Return first value that is not undefined/null.
 */
function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null) {
            return value;
        }
    }

    return undefined;
}

/**
 * Convert value to integer safely.
 */
function toNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
}

/**
 * Clamp number between min/max.
 */
function clamp(value, min, max, fallback) {
    const number = toNumber(value, fallback);

    return Math.min(max, Math.max(min, number));
}

/**
 * Convert DB truthy values to 0/1.
 */
function toBooleanInt(value, fallback = 0) {
    if (value === undefined || value === null || value === "") {
        return fallback ? 1 : 0;
    }

    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true" ||
        value === "TRUE" ||
        value === "yes" ||
        value === "on"
    ) {
        return 1;
    }

    return 0;
}

/**
 * Return clean string.
 */
function cleanString(value, fallback = "") {
    if (value === undefined || value === null) {
        return fallback;
    }

    return String(value).trim();
}

/**
 * Return original value when supplied,
 * otherwise existing value.
 *
 * Important for PATCH / partial updates.
 */
function preserveValue(bodyValue, existingValue, fallback) {
    if (bodyValue !== undefined && bodyValue !== null) {
        return bodyValue;
    }

    if (existingValue !== undefined && existingValue !== null) {
        return existingValue;
    }

    return fallback;
}

/* =========================================================
   UPLOADED FILE HELPERS
========================================================= */

/**
 * Get uploaded file from multer fields safely.
 *
 * Expected fields:
 *
 * req.files.adminLogo[0]
 * req.files.backgroundImage[0]
 */
function getUploadedFile(files, fieldName) {
    if (!files || typeof files !== "object") {
        return null;
    }

    const field = files[fieldName];

    if (!Array.isArray(field) || !field.length) {
        return null;
    }

    return field[0] || null;
}

/**
 * Convert uploaded file into public URL.
 *
 * app.js already exposes:
 *
 * /uploads -> backend/uploads
 */
function getUploadedFilePath(file) {
    if (!file) {
        return null;
    }

    if (file.filename) {
        return `/uploads/settings/${file.filename}`;
    }

    if (file.path) {
        const normalized = String(file.path)
            .replace(/\\/g, "/");

        const uploadsIndex =
            normalized.lastIndexOf("/uploads/");

        if (uploadsIndex >= 0) {
            return normalized.substring(
                uploadsIndex
            );
        }
    }

    return null;
}

/* =========================================================
   IMAGE VALIDATION
========================================================= */

/**
 * Supported image values:
 *
 * 1. Base64
 *    data:image/png;base64,...
 *
 * 2. HTTP
 *    http://...
 *
 * 3. HTTPS
 *    https://...
 *
 * 4. Local
 *    /uploads/logo.png
 *
 * 5. Relative
 *    ./uploads/logo.png
 *    ../uploads/logo.png
 */
function isImageValue(value) {
    if (value === undefined || value === null) {
        return false;
    }

    const stringValue = String(value).trim();

    if (!stringValue) {
        return false;
    }

    if (
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(
            stringValue
        )
    ) {
        return true;
    }

    if (/^https?:\/\//i.test(stringValue)) {
        return true;
    }

    if (stringValue.startsWith("/")) {
        return true;
    }

    if (stringValue.startsWith("./")) {
        return true;
    }

    if (stringValue.startsWith("../")) {
        return true;
    }

    return false;
}

/**
 * Validate image field.
 */
function validateImageField(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    const stringValue = String(value);

    if (!isImageValue(stringValue)) {
        throw new Error(
            `${fieldName} must be a valid image URL, local image path, or base64 image.`
        );
    }

    const MAX_IMAGE_LENGTH = 12 * 1024 * 1024;

    if (stringValue.length > MAX_IMAGE_LENGTH) {
        throw new Error(
            `${fieldName} is too large. Maximum allowed size is approximately 12 MB.`
        );
    }
}

/* =========================================================
   FONT FAMILY VALIDATION
========================================================= */

function normalizeFontFamily(
    value,
    fallback = "system"
) {
    const font = cleanString(value, fallback);

    if (!font) {
        return fallback;
    }

    return font;
}

/* =========================================================
   FONT WEIGHT
========================================================= */

function normalizeFontWeight(
    value,
    fallback = 400
) {
    const allowedWeights = [
        100,
        200,
        300,
        400,
        500,
        600,
        700,
        800,
        900,
    ];

    const number = toNumber(value, fallback);

    if (allowedWeights.includes(number)) {
        return number;
    }

    return fallback;
}

/* =========================================================
   NORMALIZE DATABASE ROW
========================================================= */

function normalizeSettingsRow(row = {}) {
    return {
        /* ---------------------------------------------------
           BASIC
        --------------------------------------------------- */

        id: row.id,

        hospitalName:
            row.hospital_name ??
            DEFAULT_SETTINGS.hospital_name,

        hospitalEmail:
            row.hospital_email ??
            DEFAULT_SETTINGS.hospital_email,

        phone:
            row.phone ??
            DEFAULT_SETTINGS.phone,

        address:
            row.address ??
            DEFAULT_SETTINGS.address,

        tagline:
            row.tagline ??
            DEFAULT_SETTINGS.tagline,

        adminName:
            row.admin_name ??
            DEFAULT_SETTINGS.admin_name,

        adminEmail:
            row.admin_email ??
            DEFAULT_SETTINGS.admin_email,

        appointmentNotifications:
            toBooleanInt(
                row.appointment_notifications,
                DEFAULT_SETTINGS.appointment_notifications
            ),

        billingNotifications:
            toBooleanInt(
                row.billing_notifications,
                DEFAULT_SETTINGS.billing_notifications
            ),

        systemNotifications:
            toBooleanInt(
                row.system_notifications,
                DEFAULT_SETTINGS.system_notifications
            ),

        timezone:
            row.timezone ??
            DEFAULT_SETTINGS.timezone,

        currency:
            row.currency ??
            DEFAULT_SETTINGS.currency,

        dateFormat:
            row.date_format ??
            DEFAULT_SETTINGS.date_format,

        logo:
            row.logo ??
            DEFAULT_SETTINGS.logo,

        selectedHospitalId:
            row.selected_hospital_id ??
            DEFAULT_SETTINGS.selected_hospital_id,

        /* ---------------------------------------------------
           SUPER ADMIN
        --------------------------------------------------- */

        superAdminLogo:
            row.super_admin_logo ??
            DEFAULT_SETTINGS.super_admin_logo,

        loginTitle:
            row.login_title ??
            DEFAULT_SETTINGS.login_title,

        loginSubtitle:
            row.login_subtitle ??
            DEFAULT_SETTINGS.login_subtitle,

        loginBackgroundImage:
            row.login_background_image ??
            DEFAULT_SETTINGS.login_background_image,

        adminSignature:
            row.admin_signature ??
            DEFAULT_SETTINGS.admin_signature,

        adminStamp:
            row.admin_stamp ??
            DEFAULT_SETTINGS.admin_stamp,

        /* ---------------------------------------------------
           LOGO
        --------------------------------------------------- */

        logoBackgroundMode:
            row.logo_background_mode ??
            DEFAULT_SETTINGS.logo_background_mode,

        logoShadow:
            toBooleanInt(
                row.logo_shadow,
                DEFAULT_SETTINGS.logo_shadow
            ),

        logoSize:
            row.logo_size ??
            DEFAULT_SETTINGS.logo_size,

        logoX:
            row.logo_x ??
            DEFAULT_SETTINGS.logo_x,

        logoY:
            row.logo_y ??
            DEFAULT_SETTINGS.logo_y,

        /* ---------------------------------------------------
           INDEPENDENT LOGO SIZES
        --------------------------------------------------- */

        topLogoSize:
            row.top_logo_size ??
            DEFAULT_SETTINGS.top_logo_size,

        loginLogoSize:
            row.login_logo_size ??
            DEFAULT_SETTINGS.login_logo_size,

        backgroundLogoSize:
            row.background_logo_size ??
            DEFAULT_SETTINGS.background_logo_size,

        patientCardLogoSize:
            row.patient_card_logo_size ??
            DEFAULT_SETTINGS.patient_card_logo_size,

        /* ---------------------------------------------------
           BACKGROUND
        --------------------------------------------------- */

        backgroundSize:
            row.background_size ??
            DEFAULT_SETTINGS.background_size,

        backgroundX:
            row.background_x ??
            DEFAULT_SETTINGS.background_x,

        backgroundY:
            row.background_y ??
            DEFAULT_SETTINGS.background_y,

        backgroundShadow:
            toBooleanInt(
                row.background_shadow,
                DEFAULT_SETTINGS.background_shadow
            ),

        /* ---------------------------------------------------
           FEATHER
        --------------------------------------------------- */

        featherEnabled:
            toBooleanInt(
                row.feather_enabled,
                DEFAULT_SETTINGS.feather_enabled
            ),

        featherAmount:
            row.feather_amount ??
            DEFAULT_SETTINGS.feather_amount,

        featherSoftness:
            row.feather_softness ??
            DEFAULT_SETTINGS.feather_softness,

        /* ---------------------------------------------------
           VIGNETTE
        --------------------------------------------------- */

        vignetteEnabled:
            toBooleanInt(
                row.vignette_enabled,
                DEFAULT_SETTINGS.vignette_enabled
            ),

        vignetteIntensity:
            row.vignette_intensity ??
            DEFAULT_SETTINGS.vignette_intensity,

        vignetteSoftness:
            row.vignette_softness ??
            DEFAULT_SETTINGS.vignette_softness,

        vignetteSize:
            row.vignette_size ??
            DEFAULT_SETTINGS.vignette_size,

        vignetteX:
            row.vignette_x ??
            DEFAULT_SETTINGS.vignette_x,

        vignetteY:
            row.vignette_y ??
            DEFAULT_SETTINGS.vignette_y,

        /* ---------------------------------------------------
           NAME / HEADING
        --------------------------------------------------- */

        nameSize:
            row.name_size ??
            DEFAULT_SETTINGS.name_size,

        nameX:
            row.name_x ??
            DEFAULT_SETTINGS.name_x,

        nameY:
            row.name_y ??
            DEFAULT_SETTINGS.name_y,

        nameColor:
            row.name_color ??
            DEFAULT_SETTINGS.name_color,

        nameFontFamily:
            row.name_font_family ??
            DEFAULT_SETTINGS.name_font_family,

        nameFontWeight:
            row.name_font_weight ??
            DEFAULT_SETTINGS.name_font_weight,

        nameLetterSpacing:
            row.name_letter_spacing ??
            DEFAULT_SETTINGS.name_letter_spacing,

        nameShadow:
            toBooleanInt(
                row.name_shadow,
                DEFAULT_SETTINGS.name_shadow
            ),

        /* ---------------------------------------------------
           TAGLINE
        --------------------------------------------------- */

        taglineText:
            row.tagline_text ??
            DEFAULT_SETTINGS.tagline_text,

        taglineSize:
            row.tagline_size ??
            DEFAULT_SETTINGS.tagline_size,

        taglineX:
            row.tagline_x ??
            DEFAULT_SETTINGS.tagline_x,

        taglineY:
            row.tagline_y ??
            DEFAULT_SETTINGS.tagline_y,

        taglineColor:
            row.tagline_color ??
            DEFAULT_SETTINGS.tagline_color,

        taglineFontFamily:
            row.tagline_font_family ??
            DEFAULT_SETTINGS.tagline_font_family,

        taglineFontWeight:
            row.tagline_font_weight ??
            DEFAULT_SETTINGS.tagline_font_weight,

        taglineLetterSpacing:
            row.tagline_letter_spacing ??
            DEFAULT_SETTINGS.tagline_letter_spacing,

        taglineShadow:
            toBooleanInt(
                row.tagline_shadow,
                DEFAULT_SETTINGS.tagline_shadow
            ),

        /* ---------------------------------------------------
           INDEPENDENT HEADING SIZES
        --------------------------------------------------- */

        controlPanelHeadingSize:
            row.control_panel_heading_size ??
            DEFAULT_SETTINGS.control_panel_heading_size,

        administrationHeadingSize:
            row.administration_heading_size ??
            DEFAULT_SETTINGS.administration_heading_size,

        /* ---------------------------------------------------
           INDEPENDENT TAGLINE SIZES
        --------------------------------------------------- */

        loginTaglineSize:
            row.login_tagline_size ??
            DEFAULT_SETTINGS.login_tagline_size,

        patientTaglineSize:
            row.patient_tagline_size ??
            DEFAULT_SETTINGS.patient_tagline_size,

        /* ---------------------------------------------------
           DATES
        --------------------------------------------------- */

        createdAt: row.created_at,

        updatedAt: row.updated_at,
    };
}

/* =========================================================
   GET SETTINGS
========================================================= */

async function getSettings(req, res) {
    try {
        await ensureBrandingColumns();

        const [rows] = await query(
            `
            SELECT *
            FROM settings
            WHERE id = 1
            LIMIT 1
            `
        );

        let settingsRow = rows?.[0];

        /* ---------------------------------------------------
           CREATE DEFAULT ROW IF NOT EXISTS
        --------------------------------------------------- */

        if (!settingsRow) {
            await query(
                `
                INSERT INTO settings (
                    id,
                    hospital_name,
                    hospital_email,
                    phone,
                    address,
                    tagline,
                    admin_name,
                    admin_email,
                    appointment_notifications,
                    billing_notifications,
                    system_notifications,
                    timezone,
                    currency,
                    date_format,
                    logo,
                    selected_hospital_id,
                    super_admin_logo,
                    login_title,
                    login_subtitle,
                    login_background_image,
                    logo_background_mode,
                    logo_shadow,
                    logo_size,
                    logo_x,
                    logo_y,
                    top_logo_size,
                    login_logo_size,
                    background_logo_size,
                    patient_card_logo_size,
                    background_size,
                    background_x,
                    background_y,
                    background_shadow,
                    feather_enabled,
                    feather_amount,
                    feather_softness,
                    vignette_enabled,
                    vignette_intensity,
                    vignette_softness,
                    vignette_size,
                    vignette_x,
                    vignette_y,
                    name_size,
                    name_x,
                    name_y,
                    name_color,
                    name_font_family,
                    name_font_weight,
                    name_letter_spacing,
                    name_shadow,
                    tagline_text,
                    tagline_size,
                    tagline_x,
                    tagline_y,
                    tagline_color,
                    tagline_font_family,
                    tagline_font_weight,
                    tagline_letter_spacing,
                    tagline_shadow,
                    control_panel_heading_size,
                    administration_heading_size,
                    login_tagline_size,
                    patient_tagline_size,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    NOW(),
                    NOW()
                )
                `,
                [
                    DEFAULT_SETTINGS.id,

                    DEFAULT_SETTINGS.hospital_name,
                    DEFAULT_SETTINGS.hospital_email,
                    DEFAULT_SETTINGS.phone,
                    DEFAULT_SETTINGS.address,
                    DEFAULT_SETTINGS.tagline,

                    DEFAULT_SETTINGS.admin_name,
                    DEFAULT_SETTINGS.admin_email,

                    DEFAULT_SETTINGS.appointment_notifications,
                    DEFAULT_SETTINGS.billing_notifications,
                    DEFAULT_SETTINGS.system_notifications,

                    DEFAULT_SETTINGS.timezone,
                    DEFAULT_SETTINGS.currency,
                    DEFAULT_SETTINGS.date_format,

                    DEFAULT_SETTINGS.logo,

                    DEFAULT_SETTINGS.selected_hospital_id,

                    DEFAULT_SETTINGS.super_admin_logo,
                    DEFAULT_SETTINGS.login_title,
                    DEFAULT_SETTINGS.login_subtitle,
                    DEFAULT_SETTINGS.login_background_image,

                    DEFAULT_SETTINGS.logo_background_mode,
                    DEFAULT_SETTINGS.logo_shadow,
                    DEFAULT_SETTINGS.logo_size,
                    DEFAULT_SETTINGS.logo_x,
                    DEFAULT_SETTINGS.logo_y,

                    DEFAULT_SETTINGS.top_logo_size,
                    DEFAULT_SETTINGS.login_logo_size,
                    DEFAULT_SETTINGS.background_logo_size,
                    DEFAULT_SETTINGS.patient_card_logo_size,

                    DEFAULT_SETTINGS.background_size,
                    DEFAULT_SETTINGS.background_x,
                    DEFAULT_SETTINGS.background_y,
                    DEFAULT_SETTINGS.background_shadow,

                    DEFAULT_SETTINGS.feather_enabled,
                    DEFAULT_SETTINGS.feather_amount,
                    DEFAULT_SETTINGS.feather_softness,

                    DEFAULT_SETTINGS.vignette_enabled,
                    DEFAULT_SETTINGS.vignette_intensity,
                    DEFAULT_SETTINGS.vignette_softness,
                    DEFAULT_SETTINGS.vignette_size,
                    DEFAULT_SETTINGS.vignette_x,
                    DEFAULT_SETTINGS.vignette_y,

                    DEFAULT_SETTINGS.name_size,
                    DEFAULT_SETTINGS.name_x,
                    DEFAULT_SETTINGS.name_y,
                    DEFAULT_SETTINGS.name_color,
                    DEFAULT_SETTINGS.name_font_family,
                    DEFAULT_SETTINGS.name_font_weight,
                    DEFAULT_SETTINGS.name_letter_spacing,
                    DEFAULT_SETTINGS.name_shadow,

                    DEFAULT_SETTINGS.tagline_text,
                    DEFAULT_SETTINGS.tagline_size,
                    DEFAULT_SETTINGS.tagline_x,
                    DEFAULT_SETTINGS.tagline_y,
                    DEFAULT_SETTINGS.tagline_color,
                    DEFAULT_SETTINGS.tagline_font_family,
                    DEFAULT_SETTINGS.tagline_font_weight,
                    DEFAULT_SETTINGS.tagline_letter_spacing,
                    DEFAULT_SETTINGS.tagline_shadow,

                    DEFAULT_SETTINGS.control_panel_heading_size,
                    DEFAULT_SETTINGS.administration_heading_size,

                    DEFAULT_SETTINGS.login_tagline_size,
                    DEFAULT_SETTINGS.patient_tagline_size,
                ]
            );

            const [newRows] = await query(
                `
                SELECT *
                FROM settings
                WHERE id = 1
                LIMIT 1
                `
            );

            settingsRow = newRows?.[0];
        }

        return res.status(200).json({
            success: true,
            settings:
                normalizeSettingsRow(settingsRow),
        });
    } catch (error) {
        console.error(
            "❌ getSettings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load HMS settings.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
}

/* =========================================================
   UPDATE SETTINGS
========================================================= */

async function updateSettings(req, res) {
    try {
        await ensureBrandingColumns();

        const body = req.body || {};

        /* ===================================================
           UPLOADED FILES
        =================================================== */

        const uploadedAdminLogo =
            getUploadedFile(
                req.files,
                "adminLogo"
            );

        const uploadedBackgroundImage =
            getUploadedFile(
                req.files,
                "backgroundImage"
            );

        /**
         * When multer receives a file:
         *
         * /uploads/settings/filename.ext
         */
        const uploadedAdminLogoPath =
            getUploadedFilePath(
                uploadedAdminLogo
            );

        const uploadedBackgroundImagePath =
            getUploadedFilePath(
                uploadedBackgroundImage
            );

        const uploadedSignaturePath =
            getUploadedFilePath(
                getUploadedFile(
                    req.files,
                    "adminSignature"
                )
            );

        const uploadedStampPath =
            getUploadedFilePath(
                getUploadedFile(
                    req.files,
                    "adminStamp"
                )
            );

        /* ---------------------------------------------------
           LOAD EXISTING SETTINGS FIRST
        --------------------------------------------------- */

        const [existingRows] = await query(
            `
            SELECT *
            FROM settings
            WHERE id = 1
            LIMIT 1
            `
        );

        const existing =
            existingRows?.[0] || {};

        /* ===================================================
           BASIC HOSPITAL SETTINGS
        =================================================== */

        const hospitalName = cleanString(
            preserveValue(
                body.hospitalName ??
                    body.hospital_name,
                existing.hospital_name,
                DEFAULT_SETTINGS.hospital_name
            ),
            DEFAULT_SETTINGS.hospital_name
        );

        const hospitalEmail = cleanString(
            preserveValue(
                body.hospitalEmail ??
                    body.hospital_email,
                existing.hospital_email,
                DEFAULT_SETTINGS.hospital_email
            ),
            DEFAULT_SETTINGS.hospital_email
        );

        const phone = cleanString(
            preserveValue(
                body.phone,
                existing.phone,
                DEFAULT_SETTINGS.phone
            ),
            DEFAULT_SETTINGS.phone
        );

        const address = cleanString(
            preserveValue(
                body.address,
                existing.address,
                DEFAULT_SETTINGS.address
            ),
            DEFAULT_SETTINGS.address
        );

        const hospitalTagline =
            cleanString(
                preserveValue(
                    body.tagline,
                    existing.tagline,
                    DEFAULT_SETTINGS.tagline
                ),
                DEFAULT_SETTINGS.tagline
            );

        /* ===================================================
           ADMIN NAME
        =================================================== */

        const adminName = cleanString(
            preserveValue(
                body.adminName ??
                    body.admin_name,
                existing.admin_name,
                DEFAULT_SETTINGS.admin_name
            ),
            DEFAULT_SETTINGS.admin_name
        );

        /* ===================================================
           ADMIN EMAIL
        =================================================== */

        const adminEmail = cleanString(
            preserveValue(
                body.adminEmail ??
                    body.admin_email,
                existing.admin_email,
                DEFAULT_SETTINGS.admin_email
            ),
            DEFAULT_SETTINGS.admin_email
        );

        const appointmentNotifications =
            toBooleanInt(
                preserveValue(
                    body.appointmentNotifications ??
                        body.appointment_notifications,
                    existing.appointment_notifications,
                    DEFAULT_SETTINGS.appointment_notifications
                ),
                DEFAULT_SETTINGS.appointment_notifications
            );

        const billingNotifications =
            toBooleanInt(
                preserveValue(
                    body.billingNotifications ??
                        body.billing_notifications,
                    existing.billing_notifications,
                    DEFAULT_SETTINGS.billing_notifications
                ),
                DEFAULT_SETTINGS.billing_notifications
            );

        const systemNotifications =
            toBooleanInt(
                preserveValue(
                    body.systemNotifications ??
                        body.system_notifications,
                    existing.system_notifications,
                    DEFAULT_SETTINGS.system_notifications
                ),
                DEFAULT_SETTINGS.system_notifications
            );

        const timezone = cleanString(
            preserveValue(
                body.timezone,
                existing.timezone,
                DEFAULT_SETTINGS.timezone
            ),
            DEFAULT_SETTINGS.timezone
        );

        const currency = cleanString(
            preserveValue(
                body.currency,
                existing.currency,
                DEFAULT_SETTINGS.currency
            ),
            DEFAULT_SETTINGS.currency
        );

        const dateFormat = cleanString(
            preserveValue(
                body.dateFormat ??
                    body.date_format,
                existing.date_format,
                DEFAULT_SETTINGS.date_format
            ),
            DEFAULT_SETTINGS.date_format
        );

        /* ===================================================
           GENERAL LOGO
        =================================================== */

        const logo = cleanString(
            preserveValue(
                body.logo,
                existing.logo,
                DEFAULT_SETTINGS.logo
            ),
            DEFAULT_SETTINGS.logo
        );

        /* ===================================================
           SELECTED HOSPITAL
        =================================================== */

        const selectedHospitalId = toNumber(
            preserveValue(
                body.selectedHospitalId ??
                    body.selected_hospital_id,
                existing.selected_hospital_id,
                DEFAULT_SETTINGS.selected_hospital_id
            ),
            DEFAULT_SETTINGS.selected_hospital_id
        );

        /* ===================================================
           SUPER ADMIN BRANDING
        =================================================== */

        /**
         * IMPORTANT:
         *
         * If new adminLogo file is uploaded:
         *     use uploaded file path
         *
         * Otherwise:
         *     preserve body/database value
         */
        const superAdminLogo =
            cleanString(
                uploadedAdminLogoPath ||
                    cleanString(body.adminLogoUrl) ||
                    preserveValue(
                        body.superAdminLogo ??
                            body.super_admin_logo,
                        existing.super_admin_logo,
                        DEFAULT_SETTINGS.super_admin_logo
                    ),
                DEFAULT_SETTINGS.super_admin_logo
            );

        const loginTitle = cleanString(
            preserveValue(
                body.loginTitle ??
                    body.login_title,
                existing.login_title,
                DEFAULT_SETTINGS.login_title
            ),
            DEFAULT_SETTINGS.login_title
        );

        const loginSubtitle =
            cleanString(
                preserveValue(
                    body.loginSubtitle ??
                        body.login_subtitle,
                    existing.login_subtitle,
                    DEFAULT_SETTINGS.login_subtitle
                ),
                DEFAULT_SETTINGS.login_subtitle
            );

        /**
         * If new background image file is uploaded:
         *     use uploaded file path
         *
         * Otherwise:
         *     preserve existing background image
         */
        const loginBackgroundImage =
            cleanString(
                uploadedBackgroundImagePath ||
                    cleanString(body.backgroundImageUrl) ||
                    preserveValue(
                        body.loginBackgroundImage ??
                            body.login_background_image,
                        existing.login_background_image,
                        DEFAULT_SETTINGS.login_background_image
                    ),
                DEFAULT_SETTINGS.login_background_image
            );

        /**
         * Signature / Stamp:
         *   new file  >  pasted URL  >  remove flag  >  existing value
         */
        const resolveCertificateImage = (
            uploadedPath,
            urlValue,
            removeFlag,
            existingValue
        ) => {
            if (uploadedPath) return uploadedPath;

            const url = cleanString(urlValue);

            if (url) return url;

            if (
                removeFlag === true ||
                removeFlag === "true"
            ) {
                return "";
            }

            return cleanString(existingValue);
        };

        const adminSignature =
            resolveCertificateImage(
                uploadedSignaturePath,
                body.adminSignatureUrl,
                body.removeAdminSignature,
                existing.admin_signature
            );

        const adminStamp =
            resolveCertificateImage(
                uploadedStampPath,
                body.adminStampUrl,
                body.removeAdminStamp,
                existing.admin_stamp
            );

        /* ===================================================
           VALIDATE IMAGES
        =================================================== */

        validateImageField(
            adminSignature,
            "adminSignature"
        );

        validateImageField(
            adminStamp,
            "adminStamp"
        );

        validateImageField(
            superAdminLogo,
            "superAdminLogo"
        );

        validateImageField(
            loginBackgroundImage,
            "loginBackgroundImage"
        );

        validateImageField(
            logo,
            "logo"
        );

        /* ===================================================
           LOGO SETTINGS
        =================================================== */

        const logoBackgroundMode =
            cleanString(
                preserveValue(
                    body.logoBackgroundMode ??
                        body.logo_background_mode,
                    existing.logo_background_mode,
                    DEFAULT_SETTINGS.logo_background_mode
                ),
                DEFAULT_SETTINGS.logo_background_mode
            );

        const logoShadow = toBooleanInt(
            preserveValue(
                body.logoShadow ??
                    body.logo_shadow,
                existing.logo_shadow,
                DEFAULT_SETTINGS.logo_shadow
            ),
            DEFAULT_SETTINGS.logo_shadow
        );

        const logoSize = clamp(
            preserveValue(
                body.logoSize ??
                    body.logo_size,
                existing.logo_size,
                DEFAULT_SETTINGS.logo_size
            ),
            20,
            400,
            DEFAULT_SETTINGS.logo_size
        );

        const logoX = clamp(
            preserveValue(
                body.logoX ??
                    body.logo_x,
                existing.logo_x,
                DEFAULT_SETTINGS.logo_x
            ),
            -100,
            100,
            DEFAULT_SETTINGS.logo_x
        );

        const logoY = clamp(
            preserveValue(
                body.logoY ??
                    body.logo_y,
                existing.logo_y,
                DEFAULT_SETTINGS.logo_y
            ),
            -100,
            100,
            DEFAULT_SETTINGS.logo_y
        );

        /* ===================================================
           INDEPENDENT LOGO SIZES
        =================================================== */

        const topLogoSize = clamp(
            preserveValue(
                body.topLogoSize ??
                    body.top_logo_size ??
                    body.headerLogoSize ??
                    body.header_logo_size,
                existing.top_logo_size,
                DEFAULT_SETTINGS.top_logo_size
            ),
            20,
            400,
            DEFAULT_SETTINGS.top_logo_size
        );

        const loginLogoSize = clamp(
            preserveValue(
                body.loginLogoSize ??
                    body.login_logo_size,
                existing.login_logo_size,
                DEFAULT_SETTINGS.login_logo_size
            ),
            20,
            400,
            DEFAULT_SETTINGS.login_logo_size
        );

        const backgroundLogoSize =
            clamp(
                preserveValue(
                    body.backgroundLogoSize ??
                        body.background_logo_size,
                    existing.background_logo_size,
                    DEFAULT_SETTINGS.background_logo_size
                ),
                20,
                400,
                DEFAULT_SETTINGS.background_logo_size
            );

        const patientCardLogoSize =
            clamp(
                preserveValue(
                    body.patientCardLogoSize ??
                        body.patient_card_logo_size,
                    existing.patient_card_logo_size,
                    DEFAULT_SETTINGS.patient_card_logo_size
                ),
                20,
                400,
                DEFAULT_SETTINGS.patient_card_logo_size
            );

        /* ===================================================
           BACKGROUND
        =================================================== */

        const backgroundSize = clamp(
            preserveValue(
                body.backgroundSize ??
                    body.background_size,
                existing.background_size,
                DEFAULT_SETTINGS.background_size
            ),
            20,
            300,
            DEFAULT_SETTINGS.background_size
        );

        const backgroundX = clamp(
            preserveValue(
                body.backgroundX ??
                    body.background_x,
                existing.background_x,
                DEFAULT_SETTINGS.background_x
            ),
            0,
            100,
            DEFAULT_SETTINGS.background_x
        );

        const backgroundY = clamp(
            preserveValue(
                body.backgroundY ??
                    body.background_y,
                existing.background_y,
                DEFAULT_SETTINGS.background_y
            ),
            0,
            100,
            DEFAULT_SETTINGS.background_y
        );

        const backgroundShadow =
            toBooleanInt(
                preserveValue(
                    body.backgroundShadow ??
                        body.background_shadow,
                    existing.background_shadow,
                    DEFAULT_SETTINGS.background_shadow
                ),
                DEFAULT_SETTINGS.background_shadow
            );

        /* ===================================================
           FEATHER
        =================================================== */

        const featherEnabled =
            toBooleanInt(
                preserveValue(
                    body.featherEnabled ??
                        body.feather_enabled,
                    existing.feather_enabled,
                    DEFAULT_SETTINGS.feather_enabled
                ),
                DEFAULT_SETTINGS.feather_enabled
            );

        const featherAmount = clamp(
            preserveValue(
                body.featherAmount ??
                    body.feather_amount,
                existing.feather_amount,
                DEFAULT_SETTINGS.feather_amount
            ),
            0,
            100,
            DEFAULT_SETTINGS.feather_amount
        );

        const featherSoftness = clamp(
            preserveValue(
                body.featherSoftness ??
                    body.feather_softness,
                existing.feather_softness,
                DEFAULT_SETTINGS.feather_softness
            ),
            0,
            100,
            DEFAULT_SETTINGS.feather_softness
        );

        /* ===================================================
           VIGNETTE
        =================================================== */

        const vignetteEnabled =
            toBooleanInt(
                preserveValue(
                    body.vignetteEnabled ??
                        body.vignette_enabled,
                    existing.vignette_enabled,
                    DEFAULT_SETTINGS.vignette_enabled
                ),
                DEFAULT_SETTINGS.vignette_enabled
            );

        const vignetteIntensity = clamp(
            preserveValue(
                body.vignetteIntensity ??
                    body.vignette_intensity,
                existing.vignette_intensity,
                DEFAULT_SETTINGS.vignette_intensity
            ),
            0,
            100,
            DEFAULT_SETTINGS.vignette_intensity
        );

        const vignetteSoftness = clamp(
            preserveValue(
                body.vignetteSoftness ??
                    body.vignette_softness,
                existing.vignette_softness,
                DEFAULT_SETTINGS.vignette_softness
            ),
            0,
            100,
            DEFAULT_SETTINGS.vignette_softness
        );

        const vignetteSize = clamp(
            preserveValue(
                body.vignetteSize ??
                    body.vignette_size,
                existing.vignette_size,
                DEFAULT_SETTINGS.vignette_size
            ),
            20,
            200,
            DEFAULT_SETTINGS.vignette_size
        );

        const vignetteX = clamp(
            preserveValue(
                body.vignetteX ??
                    body.vignette_x,
                existing.vignette_x,
                DEFAULT_SETTINGS.vignette_x
            ),
            0,
            100,
            DEFAULT_SETTINGS.vignette_x
        );

        const vignetteY = clamp(
            preserveValue(
                body.vignetteY ??
                    body.vignette_y,
                existing.vignette_y,
                DEFAULT_SETTINGS.vignette_y
            ),
            0,
            100,
            DEFAULT_SETTINGS.vignette_y
        );

        /* ===================================================
           NAME / HEADING SETTINGS
        =================================================== */

        const nameSize = clamp(
            preserveValue(
                body.nameSize ??
                    body.name_size,
                existing.name_size,
                DEFAULT_SETTINGS.name_size
            ),
            8,
            100,
            DEFAULT_SETTINGS.name_size
        );

        const nameX = clamp(
            preserveValue(
                body.nameX ??
                    body.name_x,
                existing.name_x,
                DEFAULT_SETTINGS.name_x
            ),
            -100,
            100,
            DEFAULT_SETTINGS.name_x
        );

        const nameY = clamp(
            preserveValue(
                body.nameY ??
                    body.name_y,
                existing.name_y,
                DEFAULT_SETTINGS.name_y
            ),
            -100,
            100,
            DEFAULT_SETTINGS.name_y
        );

        const nameColor = cleanString(
            preserveValue(
                body.nameColor ??
                    body.name_color,
                existing.name_color,
                DEFAULT_SETTINGS.name_color
            ),
            DEFAULT_SETTINGS.name_color
        );

        const nameFontFamily =
            normalizeFontFamily(
                preserveValue(
                    body.nameFontFamily ??
                        body.name_font_family,
                    existing.name_font_family,
                    DEFAULT_SETTINGS.name_font_family
                ),
                DEFAULT_SETTINGS.name_font_family
            );

        const nameFontWeight =
            normalizeFontWeight(
                preserveValue(
                    body.nameFontWeight ??
                        body.name_font_weight,
                    existing.name_font_weight,
                    DEFAULT_SETTINGS.name_font_weight
                ),
                DEFAULT_SETTINGS.name_font_weight
            );

        const nameLetterSpacing = clamp(
            preserveValue(
                body.nameLetterSpacing ??
                    body.name_letter_spacing,
                existing.name_letter_spacing,
                DEFAULT_SETTINGS.name_letter_spacing
            ),
            -20,
            50,
            DEFAULT_SETTINGS.name_letter_spacing
        );

        const nameShadow = toBooleanInt(
            preserveValue(
                body.nameShadow ??
                    body.name_shadow,
                existing.name_shadow,
                DEFAULT_SETTINGS.name_shadow
            ),
            DEFAULT_SETTINGS.name_shadow
        );

        /* ===================================================
           TAGLINE SETTINGS
        =================================================== */

        const taglineText = cleanString(
            preserveValue(
                body.taglineText ??
                    body.tagline_text,
                existing.tagline_text,
                DEFAULT_SETTINGS.tagline_text
            ),
            DEFAULT_SETTINGS.tagline_text
        );

        const taglineSize = clamp(
            preserveValue(
                body.taglineSize ??
                    body.tagline_size,
                existing.tagline_size,
                DEFAULT_SETTINGS.tagline_size
            ),
            6,
            80,
            DEFAULT_SETTINGS.tagline_size
        );

        const taglineX = clamp(
            preserveValue(
                body.taglineX ??
                    body.tagline_x,
                existing.tagline_x,
                DEFAULT_SETTINGS.tagline_x
            ),
            -100,
            100,
            DEFAULT_SETTINGS.tagline_x
        );

        const taglineY = clamp(
            preserveValue(
                body.taglineY ??
                    body.tagline_y,
                existing.tagline_y,
                DEFAULT_SETTINGS.tagline_y
            ),
            -100,
            100,
            DEFAULT_SETTINGS.tagline_y
        );

        const taglineColor = cleanString(
            preserveValue(
                body.taglineColor ??
                    body.tagline_color,
                existing.tagline_color,
                DEFAULT_SETTINGS.tagline_color
            ),
            DEFAULT_SETTINGS.tagline_color
        );

        const taglineFontFamily =
            normalizeFontFamily(
                preserveValue(
                    body.taglineFontFamily ??
                        body.tagline_font_family,
                    existing.tagline_font_family,
                    DEFAULT_SETTINGS.tagline_font_family
                ),
                DEFAULT_SETTINGS.tagline_font_family
            );

        const taglineFontWeight =
            normalizeFontWeight(
                preserveValue(
                    body.taglineFontWeight ??
                        body.tagline_font_weight,
                    existing.tagline_font_weight,
                    DEFAULT_SETTINGS.tagline_font_weight
                ),
                DEFAULT_SETTINGS.tagline_font_weight
            );

        const taglineLetterSpacing =
            clamp(
                preserveValue(
                    body.taglineLetterSpacing ??
                        body.tagline_letter_spacing,
                    existing.tagline_letter_spacing,
                    DEFAULT_SETTINGS.tagline_letter_spacing
                ),
                -20,
                50,
                DEFAULT_SETTINGS.tagline_letter_spacing
            );

        const taglineShadow = toBooleanInt(
            preserveValue(
                body.taglineShadow ??
                    body.tagline_shadow,
                existing.tagline_shadow,
                DEFAULT_SETTINGS.tagline_shadow
            ),
            DEFAULT_SETTINGS.tagline_shadow
        );

        /* ===================================================
           INDEPENDENT HEADING SIZES
        =================================================== */

        const controlPanelHeadingSize =
            clamp(
                preserveValue(
                    body.controlPanelHeadingSize ??
                        body.control_panel_heading_size,
                    existing.control_panel_heading_size,
                    DEFAULT_SETTINGS.control_panel_heading_size
                ),
                8,
                100,
                DEFAULT_SETTINGS.control_panel_heading_size
            );

        const administrationHeadingSize =
            clamp(
                preserveValue(
                    body.administrationHeadingSize ??
                        body.administration_heading_size,
                    existing.administration_heading_size,
                    DEFAULT_SETTINGS.administration_heading_size
                ),
                8,
                100,
                DEFAULT_SETTINGS.administration_heading_size
            );

        /* ===================================================
           INDEPENDENT TAGLINE SIZES
        =================================================== */

        const loginTaglineSize = clamp(
            preserveValue(
                body.loginTaglineSize ??
                    body.login_tagline_size,
                existing.login_tagline_size,
                DEFAULT_SETTINGS.login_tagline_size
            ),
            6,
            80,
            DEFAULT_SETTINGS.login_tagline_size
        );

        const patientTaglineSize =
            clamp(
                preserveValue(
                    body.patientTaglineSize ??
                        body.patient_tagline_size,
                    existing.patient_tagline_size,
                    DEFAULT_SETTINGS.patient_tagline_size
                ),
                6,
                80,
                DEFAULT_SETTINGS.patient_tagline_size
            );

        /* ===================================================
           UPDATE DATABASE
        =================================================== */

        await query(
            `
            UPDATE settings
            SET
                hospital_name = ?,
                hospital_email = ?,
                phone = ?,
                address = ?,
                tagline = ?,
                admin_name = ?,
                admin_email = ?,
                appointment_notifications = ?,
                billing_notifications = ?,
                system_notifications = ?,
                timezone = ?,
                currency = ?,
                date_format = ?,
                logo = ?,
                selected_hospital_id = ?,
                super_admin_logo = ?,
                login_title = ?,
                login_subtitle = ?,
                login_background_image = ?,
                admin_signature = ?,
                admin_stamp = ?,
                logo_background_mode = ?,
                logo_shadow = ?,
                logo_size = ?,
                logo_x = ?,
                logo_y = ?,
                top_logo_size = ?,
                login_logo_size = ?,
                background_logo_size = ?,
                patient_card_logo_size = ?,
                background_size = ?,
                background_x = ?,
                background_y = ?,
                background_shadow = ?,
                feather_enabled = ?,
                feather_amount = ?,
                feather_softness = ?,
                vignette_enabled = ?,
                vignette_intensity = ?,
                vignette_softness = ?,
                vignette_size = ?,
                vignette_x = ?,
                vignette_y = ?,
                name_size = ?,
                name_x = ?,
                name_y = ?,
                name_color = ?,
                name_font_family = ?,
                name_font_weight = ?,
                name_letter_spacing = ?,
                name_shadow = ?,
                tagline_text = ?,
                tagline_size = ?,
                tagline_x = ?,
                tagline_y = ?,
                tagline_color = ?,
                tagline_font_family = ?,
                tagline_font_weight = ?,
                tagline_letter_spacing = ?,
                tagline_shadow = ?,
                control_panel_heading_size = ?,
                administration_heading_size = ?,
                login_tagline_size = ?,
                patient_tagline_size = ?,
                updated_at = NOW()
            WHERE id = 1
            `,
            [
                hospitalName,
                hospitalEmail,
                phone,
                address,
                hospitalTagline,

                adminName,
                adminEmail,

                appointmentNotifications,
                billingNotifications,
                systemNotifications,

                timezone,
                currency,
                dateFormat,

                logo,

                selectedHospitalId,

                superAdminLogo,

                loginTitle,
                loginSubtitle,

                loginBackgroundImage,

                adminSignature,
                adminStamp,

                logoBackgroundMode,
                logoShadow,
                logoSize,
                logoX,
                logoY,

                topLogoSize,
                loginLogoSize,
                backgroundLogoSize,
                patientCardLogoSize,

                backgroundSize,
                backgroundX,
                backgroundY,
                backgroundShadow,

                featherEnabled,
                featherAmount,
                featherSoftness,

                vignetteEnabled,
                vignetteIntensity,
                vignetteSoftness,
                vignetteSize,
                vignetteX,
                vignetteY,

                nameSize,
                nameX,
                nameY,
                nameColor,
                nameFontFamily,
                nameFontWeight,
                nameLetterSpacing,
                nameShadow,

                taglineText,
                taglineSize,
                taglineX,
                taglineY,
                taglineColor,
                taglineFontFamily,
                taglineFontWeight,
                taglineLetterSpacing,
                taglineShadow,

                controlPanelHeadingSize,
                administrationHeadingSize,

                loginTaglineSize,
                patientTaglineSize,
            ]
        );

        /* ===================================================
           ALWAYS READ UPDATED DB ROW
        =================================================== */

        const [updatedRows] = await query(
            `
            SELECT *
            FROM settings
            WHERE id = 1
            LIMIT 1
            `
        );

        const updatedSettings =
            updatedRows?.[0];

        if (!updatedSettings) {
            throw new Error(
                "Settings were updated but the updated database row could not be loaded."
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "HMS settings saved successfully.",

            settings:
                normalizeSettingsRow(
                    updatedSettings
                ),
        });
    } catch (error) {
        console.error(
            "❌ updateSettings error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to save HMS settings.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getSettings,
    updateSettings,
};