const { pool } = require("../config/db");

/* =========================================================
   HELPERS
========================================================= */

const normalizeId = (value, fieldName = "ID") => {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
            `${fieldName} must be a valid positive integer.`
        );
    }

    return id;
};

const normalizeDate = (value) => {
    if (!value) {
        throw new Error("Appointment date is required.");
    }

    const date = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(
            "Appointment date must be in YYYY-MM-DD format."
        );
    }

    const [year, month, day] = date
        .split("-")
        .map(Number);

    const parsed = new Date(
        Date.UTC(year, month - 1, day)
    );

    if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
    ) {
        throw new Error("Invalid appointment date.");
    }

    return date;
};

const normalizeTime = (value) => {
    if (!value) {
        throw new Error("Appointment time is required.");
    }

    const time = String(value).trim();

    if (
        !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
            time
        )
    ) {
        throw new Error(
            "Appointment time must be in HH:mm or HH:mm:ss format."
        );
    }

    return time;
};

const normalizeStatus = (
    value,
    defaultValue = "pending"
) => {
    const status = String(
        value ?? defaultValue
    )
        .trim()
        .toLowerCase();

    return status || defaultValue;
};

const normalizeReason = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const reason = String(value).trim();

    return reason || null;
};


/* =========================================================
   GET ALL APPOINTMENTS
========================================================= */

const getAllAppointments = async (hospitalId = null) => {
    const scoped = hospitalId !== null && hospitalId !== undefined;
    const scopedHospitalId = scoped
        ? normalizeId(hospitalId, "Hospital ID")
        : null;

    const [rows] = await pool.query(
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
            p.hospital_id AS patient_hospital_id,

            d.name AS doctor_name,
            d.doctor_code,
            d.specialization,
            d.hospital_id AS doctor_hospital_id

        FROM appointments a

        LEFT JOIN patients p
            ON a.patient_id = p.id

        LEFT JOIN doctors d
            ON a.doctor_id = d.id

        ${scoped ? "WHERE d.hospital_id = ?" : ""}

        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC,
            a.created_at DESC
        `,
        scoped ? [scopedHospitalId] : []
    );

    return rows;
};


/* =========================================================
   GET APPOINTMENT BY ID
========================================================= */

const getAppointmentById = async (id, hospitalId = null) => {
    const appointmentId = normalizeId(
        id,
        "Appointment ID"
    );

    const scoped = hospitalId !== null && hospitalId !== undefined;
    const scopedHospitalId = scoped
        ? normalizeId(hospitalId, "Hospital ID")
        : null;

    const [rows] = await pool.query(
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
            p.hospital_id AS patient_hospital_id,

            d.name AS doctor_name,
            d.doctor_code,
            d.specialization,
            d.hospital_id AS doctor_hospital_id

        FROM appointments a

        LEFT JOIN patients p
            ON a.patient_id = p.id

        LEFT JOIN doctors d
            ON a.doctor_id = d.id

        WHERE a.id = ?
        ${scoped ? "AND d.hospital_id = ?" : ""}

        LIMIT 1
        `,
        scoped ? [appointmentId, scopedHospitalId] : [appointmentId]
    );

    return rows[0] || null;
};


/* =========================================================
   PUBLIC APPOINTMENT AVAILABILITY
   Doctor + Date
========================================================= */

const getPublicAppointmentsByDoctorAndDate =
    async (
        doctor_id,
        appointment_date
    ) => {
        const doctorId = normalizeId(
            doctor_id,
            "Doctor ID"
        );

        const appointmentDate =
            normalizeDate(appointment_date);

        const [rows] = await pool.query(
            `
            SELECT
                a.id,
                a.doctor_id,
                DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
                a.appointment_time,
                a.status,

                d.name AS doctor_name,
                d.doctor_code,
                d.specialization

            FROM appointments a

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
                doctorId,
                appointmentDate,
            ]
        );

        return rows;
    };


/* =========================================================
   FIND EXISTING APPOINTMENT SLOT
========================================================= */

const findAppointmentBySlot =
    async (
        doctor_id,
        appointment_date,
        appointment_time
    ) => {
        const doctorId = normalizeId(
            doctor_id,
            "Doctor ID"
        );

        const appointmentDate =
            normalizeDate(appointment_date);

        const appointmentTime =
            normalizeTime(appointment_time);

        const [rows] = await pool.query(
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
                doctorId,
                appointmentDate,
                appointmentTime,
            ]
        );

        return rows[0] || null;
    };


/* =========================================================
   FIND PATIENT
========================================================= */

const findPatientById = async (
    patient_id
) => {
    const patientId = normalizeId(
        patient_id,
        "Patient ID"
    );

    const [rows] = await pool.query(
        `
        SELECT
            id,
            hospital_id,
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
        [patientId]
    );

    return rows[0] || null;
};


/* =========================================================
   FIND DOCTOR
========================================================= */

const findDoctorById = async (
    doctor_id
) => {
    const doctorId = normalizeId(
        doctor_id,
        "Doctor ID"
    );

    const [rows] = await pool.query(
        `
        SELECT
            id,
            hospital_id,
            doctor_code,
            name,
            specialization,
            status

        FROM doctors

        WHERE id = ?

        LIMIT 1
        `,
        [doctorId]
    );

    return rows[0] || null;
};


/* =========================================================
   CREATE APPOINTMENT
========================================================= */

const createAppointment = async ({
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    status,
    reason,
}) => {
    const patientId = normalizeId(
        patient_id,
        "Patient ID"
    );

    const doctorId = normalizeId(
        doctor_id,
        "Doctor ID"
    );

    const appointmentDate =
        normalizeDate(appointment_date);

    const appointmentTime =
        normalizeTime(appointment_time);

    const appointmentStatus =
        normalizeStatus(
            status,
            "pending"
        );

    const appointmentReason =
        normalizeReason(reason);

    const [result] = await pool.query(
        `
        INSERT INTO appointments
        (
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
            hospital_id
        )
        VALUES (
            ?, ?, ?, ?, ?, ?,
            (SELECT hospital_id FROM doctors WHERE id = ?)
        )
        `,
        [
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            appointmentStatus,
            appointmentReason,
            doctorId,
        ]
    );

    return result.insertId;
};


/* =========================================================
   UPDATE APPOINTMENT
========================================================= */

const updateAppointment = async (
    id,
    {
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        status,
        reason,
    },
    hospitalId = null
) => {
    const appointmentId = normalizeId(
        id,
        "Appointment ID"
    );

    const scoped = hospitalId !== null && hospitalId !== undefined;
    const scopedHospitalId = scoped
        ? normalizeId(hospitalId, "Hospital ID")
        : null;

    const patientId = normalizeId(
        patient_id,
        "Patient ID"
    );

    const doctorId = normalizeId(
        doctor_id,
        "Doctor ID"
    );

    const appointmentDate =
        normalizeDate(appointment_date);

    const appointmentTime =
        normalizeTime(appointment_time);

    const appointmentStatus =
        normalizeStatus(
            status,
            "pending"
        );

    const appointmentReason =
        normalizeReason(reason);

    const [result] = await pool.query(
        `
        UPDATE appointments
        SET
            patient_id = ?,
            doctor_id = ?,
            appointment_date = ?,
            appointment_time = ?,
            status = ?,
            reason = ?,
            hospital_id = (SELECT hospital_id FROM doctors WHERE id = ?)
        WHERE id = ?
        ${
            scoped
                ? `AND EXISTS (
            SELECT 1 FROM doctors d
            WHERE d.id = appointments.doctor_id
            AND d.hospital_id = ?
        )`
                : ""
        }
        `,
        scoped
            ? [
                  patientId,
                  doctorId,
                  appointmentDate,
                  appointmentTime,
                  appointmentStatus,
                  appointmentReason,
                  doctorId,
                  appointmentId,
                  scopedHospitalId,
              ]
            : [
                  patientId,
                  doctorId,
                  appointmentDate,
                  appointmentTime,
                  appointmentStatus,
                  appointmentReason,
                  doctorId,
                  appointmentId,
              ]
    );

    return result.affectedRows;
};


/* =========================================================
   DELETE APPOINTMENT
========================================================= */

const deleteAppointment = async (id, hospitalId = null) => {
    const appointmentId = normalizeId(
        id,
        "Appointment ID"
    );

    const scoped = hospitalId !== null && hospitalId !== undefined;

    const [result] = await pool.query(
        `
        DELETE FROM appointments
        WHERE id = ?
        ${
            scoped
                ? `AND EXISTS (
            SELECT 1 FROM doctors d
            WHERE d.id = appointments.doctor_id
            AND d.hospital_id = ?
        )`
                : ""
        }
        `,
        scoped
            ? [appointmentId, normalizeId(hospitalId, "Hospital ID")]
            : [appointmentId]
    );

    return result.affectedRows;
};


/* =========================================================
   EXPORTS
========================================================= */

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