const { pool } = require("../config/db");

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
// DATABASE ROW → FRONTEND OBJECT
// =====================================================

const mapSettings = (row) => {
    if (!row) {
        return null;
    }

    return {
        id: row.id,

        hospitalName: row.hospital_name,
        hospitalEmail: row.hospital_email,
        phone: row.phone,
        address: row.address,

        tagline: row.tagline,

        adminName: row.admin_name,
        adminEmail: row.admin_email,

        appointmentNotifications:
            Boolean(row.appointment_notifications),

        billingNotifications:
            Boolean(row.billing_notifications),

        systemNotifications:
            Boolean(row.system_notifications),

        timezone: row.timezone,
        currency: row.currency,
        dateFormat: row.date_format,

        logo: row.logo,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

// =====================================================
// GET SETTINGS
// =====================================================

const getSettings = async () => {
    const [rows] = await pool.execute(
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
        FROM hospital_settings
        ORDER BY id ASC
        LIMIT 1
    `
    );

    if (!rows.length) {
        return DEFAULT_SETTINGS;
    }

    return mapSettings(rows[0]);
};

// =====================================================
// CREATE DEFAULT SETTINGS
// =====================================================

const createDefaultSettings = async () => {
    const [result] = await pool.execute(
        `
        INSERT INTO hospital_settings(
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
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            DEFAULT_SETTINGS.hospitalName,
            DEFAULT_SETTINGS.hospitalEmail,
            DEFAULT_SETTINGS.phone,
            DEFAULT_SETTINGS.address,
            DEFAULT_SETTINGS.tagline,
            DEFAULT_SETTINGS.adminName,
            DEFAULT_SETTINGS.adminEmail,

            DEFAULT_SETTINGS.appointmentNotifications,
            DEFAULT_SETTINGS.billingNotifications,
            DEFAULT_SETTINGS.systemNotifications,

            DEFAULT_SETTINGS.timezone,
            DEFAULT_SETTINGS.currency,
            DEFAULT_SETTINGS.dateFormat,
            DEFAULT_SETTINGS.logo,
        ]
    );

    return result.insertId;
};

// =====================================================
// ENSURE SETTINGS EXIST
// =====================================================

const ensureSettings = async () => {
    const [rows] = await pool.execute(
        `
        SELECT id
        FROM hospital_settings
        ORDER BY id ASC
        LIMIT 1
    `
    );

    if (rows.length) {
        return rows[0].id;
    }

    return await createDefaultSettings();
};

// =====================================================
// UPDATE SETTINGS
// =====================================================

const updateSettings = async (settings) => {
    const settingsId = await ensureSettings();

    const values = {
        hospitalName:
            settings.hospitalName ??
            DEFAULT_SETTINGS.hospitalName,

        hospitalEmail:
            settings.hospitalEmail ??
            DEFAULT_SETTINGS.hospitalEmail,

        phone:
            settings.phone ??
            DEFAULT_SETTINGS.phone,

        address:
            settings.address ??
            DEFAULT_SETTINGS.address,

        tagline:
            settings.tagline ??
            DEFAULT_SETTINGS.tagline,

        adminName:
            settings.adminName ??
            DEFAULT_SETTINGS.adminName,

        adminEmail:
            settings.adminEmail ??
            DEFAULT_SETTINGS.adminEmail,

        appointmentNotifications:
            settings.appointmentNotifications ??
            DEFAULT_SETTINGS.appointmentNotifications,

        billingNotifications:
            settings.billingNotifications ??
            DEFAULT_SETTINGS.billingNotifications,

        systemNotifications:
            settings.systemNotifications ??
            DEFAULT_SETTINGS.systemNotifications,

        timezone:
            settings.timezone ??
            DEFAULT_SETTINGS.timezone,

        currency:
            settings.currency ??
            DEFAULT_SETTINGS.currency,

        dateFormat:
            settings.dateFormat ??
            DEFAULT_SETTINGS.dateFormat,

        logo:
            settings.logo ??
            DEFAULT_SETTINGS.logo,
    };

    await pool.execute(
        `
        UPDATE hospital_settings
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
    logo = ?
        WHERE id = ?
            `,
        [
            values.hospitalName,
            values.hospitalEmail,
            values.phone,
            values.address,
            values.tagline,
            values.adminName,
            values.adminEmail,

            values.appointmentNotifications ? 1 : 0,
            values.billingNotifications ? 1 : 0,
            values.systemNotifications ? 1 : 0,

            values.timezone,
            values.currency,
            values.dateFormat,
            values.logo,

            settingsId,
        ]
    );

    return await getSettings();
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getSettings,
    updateSettings,
    createDefaultSettings,
    ensureSettings,
};