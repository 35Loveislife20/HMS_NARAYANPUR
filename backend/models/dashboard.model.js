// db.query ko use karein (db_fixed.js mein retry wrapper hai).
// pool.query direct use karne par ECONNRESET par retry nahi hota.
const db = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

const buildScope = (hospitalId) => {
    const scoped =
        hospitalId !== null &&
        hospitalId !== undefined;

    return {
        scoped,
        where: scoped ? "WHERE hospital_id = ?" : "",
        params: scoped ? [hospitalId] : [],
    };
};

const safeCount = (rows, key) =>
    Number(rows?.[0]?.[key]) || 0;

// =====================================================
// DASHBOARD STATS
// =====================================================
// super_admin  -> ALL HOSPITALS
// other roles  -> THEIR HOSPITAL ONLY
// =====================================================

const getDashboardStats = async (hospitalId = null) => {
    const { where, params } = buildScope(hospitalId);

    const [
        [patientRows],
        [doctorRows],
        [appointmentRows],
    ] = await Promise.all([
        db.query(
            `SELECT COUNT(*) AS totalPatients FROM patients ${where}`,
            params
        ),
        db.query(
            `SELECT COUNT(*) AS totalDoctors FROM doctors ${where}`,
            params
        ),
        db.query(
            `SELECT COUNT(*) AS totalAppointments FROM appointments ${where}`,
            params
        ),
    ]);

    return {
        totalPatients: safeCount(patientRows, "totalPatients"),
        totalDoctors: safeCount(doctorRows, "totalDoctors"),
        totalAppointments: safeCount(
            appointmentRows,
            "totalAppointments"
        ),

        // Admissions table ka schema abhi confirm nahi hai.
        // Real schema milne tak 0 rahega.
        activeAdmissions: 0,
    };
};

// =====================================================
// RECENT APPOINTMENTS
// =====================================================
// super_admin  -> ALL HOSPITALS
// other roles  -> THEIR HOSPITAL ONLY
// =====================================================

const getRecentAppointments = async (
    limit = 5,
    hospitalId = null
) => {
    // LIMIT ko integer tak simit rakhein (SQL injection se bachav)
    let safeLimit = Number(limit);

    if (!Number.isInteger(safeLimit)) {
        safeLimit = 5;
    }

    safeLimit = Math.min(Math.max(safeLimit, 1), 20);

    const hospitalCondition =
        hospitalId !== null && hospitalId !== undefined
            ? "WHERE a.hospital_id = ?"
            : "";

    const params =
        hospitalId !== null && hospitalId !== undefined
            ? [hospitalId]
            : [];

    const query = `
        SELECT
            a.id,
            a.hospital_id,

            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,

            p.id AS patient_id,
            p.name AS patient_name,

            d.id AS doctor_id,
            d.name AS doctor_name,
            d.specialization AS doctor_specialization

        FROM appointments a

        INNER JOIN patients p
            ON p.id = a.patient_id

        LEFT JOIN doctors d
            ON d.id = a.doctor_id

        ${hospitalCondition}

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.id DESC

        LIMIT ${safeLimit}
    `;

    const [rows] = await db.query(query, params);

    return Array.isArray(rows) ? rows : [];
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getDashboardStats,
    getRecentAppointments,
};