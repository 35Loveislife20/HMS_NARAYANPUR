const { pool } = require("../config/db");

/*
=====================================================
GET ALL APPOINTMENTS
=====================================================
*/

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

        LEFT JOIN patients p
            ON a.patient_id = p.id

        LEFT JOIN doctors d
            ON a.doctor_id = d.id

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.created_at DESC
    `);

    return rows;
};

/*
=====================================================
GET APPOINTMENT BY ID
=====================================================
*/

const getAppointmentById = async (
    id
) => {
    const [rows] =
        await pool.query(
            `
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
                p.phone AS patient_phone,
                p.gender AS patient_gender,

                d.name AS doctor_name,
                d.doctor_code,
                d.specialization

            FROM appointments a

            LEFT JOIN patients p
                ON a.patient_id = p.id

            LEFT JOIN doctors d
                ON a.doctor_id = d.id

            WHERE a.id = ?
            `,
            [id]
        );

    return rows[0] || null;
};

/*
=====================================================
PUBLIC APPOINTMENT AVAILABILITY
=====================================================

Returns appointments for one doctor + one date.

Cancelled appointments are excluded because
their slots should become available again.
=====================================================
*/

const getPublicAppointmentsByDoctorAndDate =
    async (
        doctor_id,
        appointment_date
    ) => {
        const [rows] =
            await pool.query(
                `
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

                LEFT JOIN patients p
                    ON a.patient_id = p.id

                LEFT JOIN doctors d
                    ON a.doctor_id = d.id

                WHERE
                    a.doctor_id = ?
                    AND DATE(a.appointment_date) = ?
                    AND LOWER(
                        COALESCE(a.status, '')
                    ) NOT IN (
                        'cancelled',
                        'canceled'
                    )

                ORDER BY
                    a.appointment_time ASC
                `,
                [
                    doctor_id,
                    appointment_date,
                ]
            );

        return rows;
    };

/*
=====================================================
CHECK EXISTING PUBLIC SLOT
=====================================================
*/

const findAppointmentBySlot =
    async (
        doctor_id,
        appointment_date,
        appointment_time
    ) => {
        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    patient_id,
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status,
                    reason,
                    created_at

                FROM appointments

                WHERE
                    doctor_id = ?
                    AND DATE(appointment_date) = ?
                    AND TIME(appointment_time) = ?
                    AND LOWER(
                        COALESCE(status, '')
                    ) NOT IN (
                        'cancelled',
                        'canceled'
                    )

                LIMIT 1
                `,
                [
                    doctor_id,
                    appointment_date,
                    appointment_time,
                ]
            );

        return rows[0] || null;
    };

/*
=====================================================
CHECK PATIENT
=====================================================
*/

const findPatientById =
    async (
        patient_id
    ) => {
        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    patient_code,
                    name,
                    phone,
                    email,
                    gender,
                    date_of_birth,
                    address,
                    blood_group

                FROM patients

                WHERE id = ?

                LIMIT 1
                `,
                [patient_id]
            );

        return rows[0] || null;
    };

/*
=====================================================
CHECK DOCTOR
=====================================================
*/

const findDoctorById =
    async (
        doctor_id
    ) => {
        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    doctor_code,
                    name,
                    specialization

                FROM doctors

                WHERE id = ?

                LIMIT 1
                `,
                [doctor_id]
            );

        return rows[0] || null;
    };

/*
=====================================================
CREATE APPOINTMENT
=====================================================
*/

const createAppointment =
    async ({
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        status,
        reason,
    }) => {
        const [result] =
            await pool.query(
                `
                INSERT INTO appointments
                (
                    patient_id,
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status,
                    reason
                )

                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    patient_id,
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status ||
                        "pending",
                    reason ||
                        null,
                ]
            );

        return result.insertId;
    };

/*
=====================================================
UPDATE APPOINTMENT
=====================================================
*/

const updateAppointment =
    async (
        id,
        {
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
        }
    ) => {
        const [result] =
            await pool.query(
                `
                UPDATE appointments

                SET
                    patient_id = ?,
                    doctor_id = ?,
                    appointment_date = ?,
                    appointment_time = ?,
                    status = ?,
                    reason = ?

                WHERE id = ?
                `,
                [
                    patient_id,
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status ||
                        "pending",
                    reason ||
                        null,
                    id,
                ]
            );

        return result.affectedRows;
    };

/*
=====================================================
DELETE APPOINTMENT
=====================================================
*/

const deleteAppointment =
    async (
        id
    ) => {
        const [result] =
            await pool.query(
                `
                DELETE FROM appointments
                WHERE id = ?
                `,
                [id]
            );

        return result.affectedRows;
    };

/*
=====================================================
EXPORTS
=====================================================
*/

module.exports = {
    getAllAppointments,

    getAppointmentById,

    getPublicAppointmentsByDoctorAndDate,

    findAppointmentBySlot,

    findPatientById,

    findDoctorById,

    createAppointment,

    updateAppointment,

    deleteAppointment,
};