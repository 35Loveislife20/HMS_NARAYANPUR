const { pool } = require("../config/db");

/* =========================================================
   GET ALL DOCTORS
========================================================= */
const getAllDoctors = async () => {
    const [rows] = await pool.query(`
        SELECT
            id,
            doctor_code,
            name,
            photo,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
            created_at,
            updated_at
        FROM doctors
        ORDER BY id DESC
    `);

    return rows;
};

/* =========================================================
   GET DOCTOR BY ID
========================================================= */
const getDoctorById = async (id) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            doctor_code,
            name,
            photo,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
            created_at,
            updated_at
        FROM doctors
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

/* =========================================================
   SEARCH DOCTORS
========================================================= */
const searchDoctors = async (search) => {
    const keyword = `%${search}%`;

    const [rows] = await pool.query(
        `
        SELECT
            id,
            doctor_code,
            name,
            photo,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status,
            created_at,
            updated_at
        FROM doctors
        WHERE
            name LIKE ?
            OR doctor_code LIKE ?
            OR specialization LIKE ?
            OR qualification LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
        ORDER BY id DESC
        `,
        [
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
        ]
    );

    return rows;
};

/* =========================================================
   GENERATE DOCTOR CODE
========================================================= */
const generateDoctorCode = async () => {
    const year = new Date().getFullYear();

    const [rows] = await pool.query(
        `
        SELECT doctor_code
        FROM doctors
        WHERE doctor_code LIKE ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [`D-${year}%`]
    );

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].doctor_code) {
        const lastCode = rows[0].doctor_code;

        const match = lastCode.match(/D-\d{4}(\d+)/);

        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    return `D-${year}${String(nextNumber).padStart(4, "0")}`;
};

/* =========================================================
   CREATE DOCTOR
========================================================= */
const createDoctor = async (doctorData) => {
    const {
        doctor_code,
        name,
        photo,
        specialization,
        qualification,
        phone,
        email,
        experience_years,
        consultation_fee,
        department_id,
        hospital_id,
        status,
    } = doctorData;

    const [result] = await pool.query(
        `
        INSERT INTO doctors (
            doctor_code,
            name,
            photo,
            specialization,
            qualification,
            phone,
            email,
            experience_years,
            consultation_fee,
            department_id,
            hospital_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            doctor_code,
            name,
            photo || null,
            specialization || null,
            qualification || null,
            phone || null,
            email || null,
            experience_years || 0,
            consultation_fee || 0,
            department_id || null,
            hospital_id || null,
            status || "available",
        ]
    );

    return {
        id: result.insertId,
        doctor_code,
    };
};

/* =========================================================
   UPDATE DOCTOR
========================================================= */
const updateDoctor = async (id, doctorData) => {
    const {
        doctor_code,
        name,
        photo,
        specialization,
        qualification,
        phone,
        email,
        experience_years,
        consultation_fee,
        department_id,
        hospital_id,
        status,
    } = doctorData;

    const [result] = await pool.query(
        `
        UPDATE doctors
        SET
            doctor_code = ?,
            name = ?,
            photo = ?,
            specialization = ?,
            qualification = ?,
            phone = ?,
            email = ?,
            experience_years = ?,
            consultation_fee = ?,
            department_id = ?,
            hospital_id = ?,
            status = ?
        WHERE id = ?
        `,
        [
            doctor_code,
            name,
            photo || null,
            specialization || null,
            qualification || null,
            phone || null,
            email || null,
            experience_years || 0,
            consultation_fee || 0,
            department_id || null,
            hospital_id || null,
            status || "available",
            id,
        ]
    );

    return result;
};

/* =========================================================
   DELETE DOCTOR
========================================================= */
const deleteDoctorById = async (id) => {
    const [result] = await pool.query(
        `
        DELETE FROM doctors
        WHERE id = ?
        `,
        [id]
    );

    return result;
};

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
    getAllDoctors,
    getDoctorById,
    searchDoctors,
    generateDoctorCode,
    createDoctor,
    updateDoctor,
    deleteDoctorById,
};