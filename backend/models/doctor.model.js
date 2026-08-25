const { pool } = require("../config/db");

// =====================================================
// GET ALL DOCTORS
// =====================================================

const getAllDoctors = async () => {
    const [rows] = await pool.query(`
        SELECT
            id,
            name,
            email,
            phone,
            specialization,
            department,
            qualification,
            experience,
            consultation_fee,
            status,
            profile_image,
            created_at
        FROM doctors
        ORDER BY id DESC
    `);

    return rows;
};

// =====================================================
// GET DOCTOR BY ID
// =====================================================

const getDoctorById = async (id) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            specialization,
            department,
            qualification,
            experience,
            consultation_fee,
            status,
            profile_image,
            created_at
        FROM doctors
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

// =====================================================
// CREATE DOCTOR
// =====================================================

const createDoctor = async (doctor) => {
    const {
        name,
        email,
        phone,
        specialization,
        department,
        qualification,
        experience,
        consultation_fee,
        status,
        profile_image,
    } = doctor;

    const [result] = await pool.query(
        `
        INSERT INTO doctors
        (
            name,
            email,
            phone,
            specialization,
            department,
            qualification,
            experience,
            consultation_fee,
            status,
            profile_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            email,
            phone || null,
            specialization,
            department || null,
            qualification || null,
            experience || 0,
            consultation_fee || 0,
            status || "active",
            profile_image || null,
        ]
    );

    return result;
};

// =====================================================
// UPDATE DOCTOR
// =====================================================

const updateDoctor = async (id, doctor) => {
    const {
        name,
        email,
        phone,
        specialization,
        department,
        qualification,
        experience,
        consultation_fee,
        status,
        profile_image,
    } = doctor;

    const [result] = await pool.query(
        `
        UPDATE doctors
        SET
            name = ?,
            email = ?,
            phone = ?,
            specialization = ?,
            department = ?,
            qualification = ?,
            experience = ?,
            consultation_fee = ?,
            status = ?,
            profile_image = ?
        WHERE id = ?
        `,
        [
            name,
            email,
            phone || null,
            specialization,
            department || null,
            qualification || null,
            experience || 0,
            consultation_fee || 0,
            status || "active",
            profile_image || null,
            id,
        ]
    );

    return result;
};

// =====================================================
// DELETE DOCTOR
// =====================================================

const deleteDoctor = async (id) => {
    const [result] = await pool.query(
        `
        DELETE FROM doctors
        WHERE id = ?
        `,
        [id]
    );

    return result;
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
};