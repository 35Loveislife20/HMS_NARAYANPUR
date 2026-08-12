const pool = require("../config/db");

// =====================================================
// CREATE PATIENT
// =====================================================

const createPatient = async (patient) => {
    const {
        patient_code,
        name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        blood_group,
    } = patient;

    const [result] = await pool.execute(
        `
        INSERT INTO patients
        (
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            patient_code,
            name,
            gender,
            date_of_birth || null,
            phone || null,
            email || null,
            address || null,
            blood_group || null,
        ]
    );

    return result.insertId;
};

// =====================================================
// GET ALL PATIENTS
// =====================================================

const getAllPatients = async () => {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            created_at
        FROM patients
        ORDER BY created_at DESC
        `
    );

    return rows;
};

// =====================================================
// GET PATIENT BY ID
// =====================================================

const getPatientById = async (id) => {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            created_at
        FROM patients
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0];
};

// =====================================================
// UPDATE PATIENT
// =====================================================

const updatePatient = async (id, patient) => {
    const {
        name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        blood_group,
    } = patient;

    const [result] = await pool.execute(
        `
        UPDATE patients
        SET
            name = ?,
            gender = ?,
            date_of_birth = ?,
            phone = ?,
            email = ?,
            address = ?,
            blood_group = ?
        WHERE id = ?
        `,
        [
            name,
            gender,
            date_of_birth || null,
            phone || null,
            email || null,
            address || null,
            blood_group || null,
            id,
        ]
    );

    return result.affectedRows;
};

// =====================================================
// DELETE PATIENT
// =====================================================

const deletePatient = async (id) => {
    const [result] = await pool.execute(
        `
        DELETE FROM patients
        WHERE id = ?
        `,
        [id]
    );

    return result.affectedRows;
};

// =====================================================
// PATIENT STATISTICS
// =====================================================

const getPatientStats = async () => {
    const [rows] = await pool.execute(
        `
        SELECT

            COUNT(*) AS totalPatients,

            SUM(
                CASE
                    WHEN DATE(created_at) = CURDATE()
                    THEN 1
                    ELSE 0
                END
            ) AS todayPatients,

            SUM(
                CASE
                    WHEN created_at >= DATE_SUB(
                        NOW(),
                        INTERVAL 30 DAY
                    )
                    THEN 1
                    ELSE 0
                END
            ) AS newPatients

        FROM patients
        `
    );

    return {
        totalPatients:
            Number(rows[0].totalPatients) || 0,

        todayPatients:
            Number(rows[0].todayPatients) || 0,

        newPatients:
            Number(rows[0].newPatients) || 0,
    };
};

module.exports = {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    getPatientStats,
};