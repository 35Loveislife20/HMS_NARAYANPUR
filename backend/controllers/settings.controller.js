const db = require("../config/db");

// =====================================================
// DEFAULT SETTINGS
// =====================================================

const DEFAULT_SETTINGS = {
    hospitalName: "HMS Hospital Narayanpur",
    hospitalEmail: "admin@hmshospital.com",
    phone: "+91 98765 43210",
    address: "Narayanpur, Uttar Pradesh, India",

    tagline: "Hospital System",

    adminName: "HMS Admin",
    adminEmail: "admin@hmshospital.com",

    appointmentNotifications: true,
    billingNotifications: true,
    systemNotifications: true,

    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",

    logo: "/hms-logo.png",
};

// =====================================================
// HELPER
// =====================================================

const getDatabasePool = () => {
    /*
     * Supports the common HMS db.js export styles:
     *
     * module.exports = pool
     * OR
     * module.exports = { pool }
     */

    if (db && typeof db.query === "function") {
        return db;
    }

    if (
        db &&
        db.pool &&
        typeof db.pool.query === "function"
    ) {
        return db.pool;
    }

    throw new Error(
        "Database pool is not available from ../config/db.js"
    );
};

// =====================================================
// NORMALIZE SETTINGS
// =====================================================

const normalizeSettings = (row = {}) => {
    return {
        id: row.id,

        hospitalName:
            row.hospital_name ??
            DEFAULT_SETTINGS.hospitalName,

        hospitalEmail:
            row.hospital_email ??
            DEFAULT_SETTINGS.hospitalEmail,

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
            DEFAULT_SETTINGS.adminName,

        adminEmail:
            row.admin_email ??
            DEFAULT_SETTINGS.adminEmail,

        appointmentNotifications:
            Boolean(
                row.appointment_notifications
            ),

        billingNotifications:
            Boolean(
                row.billing_notifications
            ),

        systemNotifications:
            Boolean(
                row.system_notifications
            ),

        timezone:
            row.timezone ??
            DEFAULT_SETTINGS.timezone,

        currency:
            row.currency ??
            DEFAULT_SETTINGS.currency,

        dateFormat:
            row.date_format ??
            DEFAULT_SETTINGS.dateFormat,

        logo:
            row.logo ??
            DEFAULT_SETTINGS.logo,

        createdAt:
            row.created_at || null,

        updatedAt:
            row.updated_at || null,
    };
};

// =====================================================
// GET SETTINGS
// GET /api/settings
// =====================================================

const getSettings = async (req, res) => {
    try {
        const pool = getDatabasePool();

        // -------------------------------------------------
        // FIND SETTINGS ROW
        // -------------------------------------------------

        const [rows] = await pool.query(
            `
            SELECT
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
                created_at,
                updated_at
            FROM settings
            WHERE id = 1
            LIMIT 1
            `
        );

        // -------------------------------------------------
        // CREATE DEFAULT SETTINGS IF NOT EXISTS
        // -------------------------------------------------

        if (!rows || rows.length === 0) {
            await pool.query(
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
                    logo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    1,
                    DEFAULT_SETTINGS.hospitalName,
                    DEFAULT_SETTINGS.hospitalEmail,
                    DEFAULT_SETTINGS.phone,
                    DEFAULT_SETTINGS.address,
                    DEFAULT_SETTINGS.tagline,
                    DEFAULT_SETTINGS.adminName,
                    DEFAULT_SETTINGS.adminEmail,
                    DEFAULT_SETTINGS.appointmentNotifications ? 1 : 0,
                    DEFAULT_SETTINGS.billingNotifications ? 1 : 0,
                    DEFAULT_SETTINGS.systemNotifications ? 1 : 0,
                    DEFAULT_SETTINGS.timezone,
                    DEFAULT_SETTINGS.currency,
                    DEFAULT_SETTINGS.dateFormat,
                    DEFAULT_SETTINGS.logo,
                ]
            );

            const [newRows] = await pool.query(
                `
                SELECT
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
                    created_at,
                    updated_at
                FROM settings
                WHERE id = 1
                LIMIT 1
                `
            );

            return res.status(200).json({
                success: true,
                message:
                    "Hospital settings initialized successfully.",
                data: normalizeSettings(
                    newRows[0]
                ),
            });
        }

        // -------------------------------------------------
        // RETURN EXISTING SETTINGS
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Hospital settings fetched successfully.",
            data: normalizeSettings(rows[0]),
        });

    } catch (error) {
        console.error(
            "❌ Get settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load hospital settings.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// UPDATE SETTINGS
// PUT /api/settings
// =====================================================

const updateSettings = async (req, res) => {
    try {
        const pool = getDatabasePool();

        const body = req.body || {};

        // -------------------------------------------------
        // READ VALUES
        // -------------------------------------------------

        const hospitalName =
            typeof body.hospitalName === "string" &&
                body.hospitalName.trim()
                ? body.hospitalName.trim()
                : DEFAULT_SETTINGS.hospitalName;

        const hospitalEmail =
            typeof body.hospitalEmail === "string"
                ? body.hospitalEmail.trim()
                : DEFAULT_SETTINGS.hospitalEmail;

        const phone =
            typeof body.phone === "string"
                ? body.phone.trim()
                : DEFAULT_SETTINGS.phone;

        const address =
            typeof body.address === "string"
                ? body.address.trim()
                : DEFAULT_SETTINGS.address;

        const tagline =
            typeof body.tagline === "string"
                ? body.tagline.trim()
                : DEFAULT_SETTINGS.tagline;

        const adminName =
            typeof body.adminName === "string"
                ? body.adminName.trim()
                : DEFAULT_SETTINGS.adminName;

        const adminEmail =
            typeof body.adminEmail === "string"
                ? body.adminEmail.trim()
                : DEFAULT_SETTINGS.adminEmail;

        const appointmentNotifications =
            Boolean(
                body.appointmentNotifications
            );

        const billingNotifications =
            Boolean(
                body.billingNotifications
            );

        const systemNotifications =
            Boolean(
                body.systemNotifications
            );

        const timezone =
            typeof body.timezone === "string" &&
                body.timezone.trim()
                ? body.timezone.trim()
                : DEFAULT_SETTINGS.timezone;

        const currency =
            typeof body.currency === "string" &&
                body.currency.trim()
                ? body.currency.trim().toUpperCase()
                : DEFAULT_SETTINGS.currency;

        const dateFormat =
            typeof body.dateFormat === "string" &&
                body.dateFormat.trim()
                ? body.dateFormat.trim()
                : DEFAULT_SETTINGS.dateFormat;

        const logo =
            typeof body.logo === "string" &&
                body.logo.trim()
                ? body.logo.trim()
                : DEFAULT_SETTINGS.logo;

        // -------------------------------------------------
        // UPSERT SETTINGS
        // -------------------------------------------------

        await pool.query(
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
                logo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
                hospital_name = VALUES(hospital_name),
                hospital_email = VALUES(hospital_email),
                phone = VALUES(phone),
                address = VALUES(address),
                tagline = VALUES(tagline),
                admin_name = VALUES(admin_name),
                admin_email = VALUES(admin_email),
                appointment_notifications =
                    VALUES(appointment_notifications),
                billing_notifications =
                    VALUES(billing_notifications),
                system_notifications =
                    VALUES(system_notifications),
                timezone = VALUES(timezone),
                currency = VALUES(currency),
                date_format = VALUES(date_format),
                logo = VALUES(logo)
            `,
            [
                1,
                hospitalName,
                hospitalEmail,
                phone,
                address,
                tagline,
                adminName,
                adminEmail,
                appointmentNotifications ? 1 : 0,
                billingNotifications ? 1 : 0,
                systemNotifications ? 1 : 0,
                timezone,
                currency,
                dateFormat,
                logo,
            ]
        );

        // -------------------------------------------------
        // FETCH UPDATED SETTINGS
        // -------------------------------------------------

        const [rows] = await pool.query(
            `
            SELECT
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
                created_at,
                updated_at
            FROM settings
            WHERE id = 1
            LIMIT 1
            `
        );

        return res.status(200).json({
            success: true,
            message:
                "Hospital settings updated successfully.",
            data: normalizeSettings(rows[0]),
        });

    } catch (error) {
        console.error(
            "❌ Update settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update hospital settings.",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getSettings,
    updateSettings,
};