const pool = require("../config/db");

// =====================================================
// GET DASHBOARD STATS
// =====================================================

const getDashboardStats = async () => {
    const [
        [patientResult],
        [doctorResult],
        [appointmentResult],
        [admissionResult],
    ] = await Promise.all([
        pool.execute(`
            SELECT COUNT(*) AS totalPatients
            FROM patients
        `),

        pool.execute(`
            SELECT COUNT(*) AS totalDoctors
            FROM doctors
        `),

        pool.execute(`
            SELECT COUNT(*) AS totalAppointments
            FROM appointments
        `),

        pool.execute(`
            SELECT COUNT(*) AS activeAdmissions
            FROM admissions
            WHERE status = 'admitted'
        `),
    ]);

    return {
        totalPatients: Number(
            patientResult[0].totalPatients
        ),

        totalDoctors: Number(
            doctorResult[0].totalDoctors
        ),

        totalAppointments: Number(
            appointmentResult[0].totalAppointments
        ),

        activeAdmissions: Number(
            admissionResult[0].activeAdmissions
        ),
    };
};


// =====================================================
// GET RECENT APPOINTMENTS
// =====================================================

const getRecentAppointments = async (limit = 5) => {

    // Safe limit: minimum 1, maximum 20
    const safeLimit = Math.min(
        Math.max(
            parseInt(limit, 10) || 5,
            1
        ),
        20
    );

    const [rows] = await pool.execute(`
        SELECT
            a.id,
            a.patient_id,
            a.doctor_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,
            a.created_at,

            p.name AS patient_name,

            d.doctor_code,
            d.specialization AS doctor_specialization

        FROM appointments a

        LEFT JOIN patients p
            ON a.patient_id = p.id

        LEFT JOIN doctors d
            ON a.doctor_id = d.id

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.created_at DESC

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