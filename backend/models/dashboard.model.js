const { pool } = require("../config/db");

// =====================================================
// DASHBOARD STATS
// =====================================================

const getDashboardStats = async () => {

    // -------------------------------------------------
    // TOTAL PATIENTS
    // -------------------------------------------------

    const [patientRows] = await pool.query(`
        SELECT COUNT(*) AS totalPatients
        FROM hms_db.patients
    `);

    // -------------------------------------------------
    // TOTAL DOCTORS
    // -------------------------------------------------

    const [doctorRows] = await pool.query(`
        SELECT COUNT(*) AS totalDoctors
        FROM hms_db.doctors
    `);

    // -------------------------------------------------
    // TOTAL APPOINTMENTS
    // -------------------------------------------------

    const [appointmentRows] = await pool.query(`
        SELECT COUNT(*) AS totalAppointments
        FROM hms_db.appointments
    `);

    // -------------------------------------------------
    // ACTIVE ADMISSIONS
    // -------------------------------------------------
    // Admissions table currently not confirmed.
    // Keep it 0 until the actual admission table/schema
    // is available.

    const activeAdmissions = 0;

    return {
        totalPatients:
            Number(
                patientRows[0]?.totalPatients
            ) || 0,

        totalDoctors:
            Number(
                doctorRows[0]?.totalDoctors
            ) || 0,

        totalAppointments:
            Number(
                appointmentRows[0]?.totalAppointments
            ) || 0,

        activeAdmissions,
    };
};

// =====================================================
// RECENT APPOINTMENTS
// =====================================================

const getRecentAppointments = async (
    limit = 5
) => {

    const safeLimit = Math.min(
        Math.max(Number(limit) || 5, 1),
        20
    );

    /*
       NOTE:
       MySQL/TiDB prepared statements can have issues
       with LIMIT placeholders in some configurations.

       So we safely convert the value to an integer
       before inserting it into the query.
    */

    const [rows] = await pool.query(`
        SELECT
            a.id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,

            p.id AS patient_id,
            p.name AS patient_name,

            d.id AS doctor_id,
            d.name AS doctor_name,
            d.specialization AS doctor_specialization

        FROM hms_db.appointments a

        INNER JOIN hms_db.patients p
            ON p.id = a.patient_id

        LEFT JOIN hms_db.doctors d
            ON d.id = a.doctor_id

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.id DESC

        LIMIT ${safeLimit}
    `);

    return rows;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getDashboardStats,
    getRecentAppointments,
};