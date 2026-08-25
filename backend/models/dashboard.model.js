const { pool } = require("../config/db");

const getDashboardStats = async () => {
    const [
        [patientResult],
        [doctorResult],
        [appointmentResult],
    ] = await Promise.all([
        pool.query(`SELECT COUNT(*) AS totalPatients FROM patients`),
        pool.query(`SELECT COUNT(*) AS totalDoctors FROM doctors`),
        pool.query(`SELECT COUNT(*) AS totalAppointments FROM appointments`),
    ]);

    return {
        totalPatients: Number(patientResult[0].totalPatients) || 0,
        totalDoctors: Number(doctorResult[0].totalDoctors) || 0,
        totalAppointments: Number(appointmentResult[0].totalAppointments) || 0,
        activeAdmissions: 0,
    };
};

const getRecentAppointments = async (limit = 5) => {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);

    const [rows] = await pool.query(`
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
            d.specialization AS doctor_specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d  ON a.doctor_id  = d.id
        ORDER BY a.created_at DESC
        LIMIT ${safeLimit}
    `);

    return rows;
};

module.exports = { getDashboardStats, getRecentAppointments };