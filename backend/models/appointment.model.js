const { pool } = require("../config/db");

const getAllAppointments = async () => {
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
            p.patient_code,
            d.name AS doctor_name,
            d.doctor_code,
            d.specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d  ON a.doctor_id  = d.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC, a.created_at DESC
    `);
    return rows;
};

const getAppointmentById = async (id) => {
    const [rows] = await pool.query(
        `SELECT
            a.id,
            a.patient_id,
            a.doctor_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,
            a.created_at,
            p.name AS patient_name,
            p.patient_code,
            d.doctor_code,
            d.specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d  ON a.doctor_id  = d.id
        WHERE a.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const createAppointment = async ({
    patient_id, doctor_id, appointment_date,
    appointment_time, status, reason,
}) => {
    const [result] = await pool.query(
        `INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, appointment_time, status, reason)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, appointment_date, appointment_time, status || "pending", reason || null]
    );
    return result.insertId;
};

const updateAppointment = async (id, {
    patient_id, doctor_id, appointment_date,
    appointment_time, status, reason,
}) => {
    const [result] = await pool.query(
        `UPDATE appointments SET
            patient_id = ?,
            doctor_id = ?,
            appointment_date = ?,
            appointment_time = ?,
            status = ?,
            reason = ?
        WHERE id = ?`,
        [patient_id, doctor_id, appointment_date, appointment_time, status || "pending", reason || null, id]
    );
    return result.affectedRows;
};

const deleteAppointment = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM appointments WHERE id = ?`, [id]
    );
    return result.affectedRows;
};

module.exports = {
    getAllAppointments, getAppointmentById,
    createAppointment, updateAppointment, deleteAppointment,
};