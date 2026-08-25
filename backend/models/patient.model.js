const { pool } = require("../config/db");

const generatePatientCode = async () => {
    const currentYear = new Date().getFullYear();
    const prefix = `P-${currentYear}`;

    const [rows] = await pool.query(
        `SELECT patient_code 
         FROM patients 
         WHERE patient_code LIKE ?
         ORDER BY patient_code DESC
         LIMIT 1`,
        [`${prefix}%`]
    );

    if (rows.length === 0) return `${prefix}0001`;

    const lastCode = rows[0].patient_code;
    const lastNumber = parseInt(lastCode.replace(prefix, ""), 10);
    const nextNumber = lastNumber + 1;

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

const createPatient = async (patient) => {
    const { name, gender, date_of_birth, phone, email, address, blood_group } = patient;

    const patient_code = await generatePatientCode();

    const [result] = await pool.query(
        `INSERT INTO patients
        (patient_code, name, gender, date_of_birth, phone, email, address, blood_group)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient_code, name, gender, date_of_birth || null, phone || null, email || null, address || null, blood_group || null]
    );

    return result.insertId;
};

const getAllPatients = async () => {
    const [rows] = await pool.query(
        `SELECT id, patient_code, name, gender, date_of_birth, phone, email, address, blood_group, created_at
        FROM patients
        ORDER BY created_at DESC`
    );
    return rows;
};

const getPatientById = async (id) => {
    const [rows] = await pool.query(
        `SELECT id, patient_code, name, gender, date_of_birth, phone, email, address, blood_group, created_at
        FROM patients WHERE id = ? LIMIT 1`,
        [id]
    );
    return rows[0];
};

const updatePatient = async (id, patient) => {
    const { name, gender, date_of_birth, phone, email, address, blood_group } = patient;

    const [result] = await pool.query(
        `UPDATE patients SET
            name = ?, gender = ?, date_of_birth = ?,
            phone = ?, email = ?, address = ?, blood_group = ?
        WHERE id = ?`,
        [name, gender, date_of_birth || null, phone || null, email || null, address || null, blood_group || null, id]
    );
    return result.affectedRows;
};

const deletePatient = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM patients WHERE id = ?`, [id]
    );
    return result.affectedRows;
};

const getPatientStats = async () => {
    const [rows] = await pool.query(
        `SELECT
            COUNT(*) AS totalPatients,
            SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS todayPatients,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS newPatients
        FROM patients`
    );

    return {
        totalPatients: Number(rows[0].totalPatients) || 0,
        todayPatients: Number(rows[0].todayPatients) || 0,
        newPatients: Number(rows[0].newPatients) || 0,
    };
};

module.exports = {
    createPatient, getAllPatients, getPatientById,
    updatePatient, deletePatient, getPatientStats,
};