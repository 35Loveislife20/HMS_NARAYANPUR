const { pool } = require("../config/db");


/*
=====================================================
GET ALL PATIENTS
=====================================================
*/

const getAllPatients = async () => {

    const [rows] = await pool.query(`
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
            created_at,
            updated_at
        FROM patients
        ORDER BY id DESC
    `);

    return rows;
};


/*
=====================================================
PUBLIC SEARCH PATIENTS
=====================================================

Used by:
Old Patient Appointment

Search by:
- Patient ID
- Patient Code
- Name
- Phone
- Email

NO LOGIN REQUIRED
=====================================================
*/

const searchPatientsModel = async (search) => {

    const searchValue = String(search || "").trim();

    if (!searchValue) {
        return [];
    }

    const likeValue = `%${searchValue}%`;

    const [rows] = await pool.query(
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
            created_at,
            updated_at
        FROM patients
        WHERE
            CAST(id AS CHAR) LIKE ?
            OR patient_code LIKE ?
            OR name LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
        ORDER BY id DESC
        LIMIT 20
        `,
        [
            likeValue,
            likeValue,
            likeValue,
            likeValue,
            likeValue,
        ]
    );

    return rows;
};


/*
=====================================================
GET PATIENT BY ID
=====================================================
*/

const getPatientByIdModel = async (id) => {

    const [rows] = await pool.query(
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
            created_at,
            updated_at
        FROM patients
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};


/*
=====================================================
CREATE PATIENT
=====================================================
*/

const createPatientModel = async (patient) => {

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


    /*
    If frontend does not provide patient code,
    generate one automatically.
    */

    const finalPatientCode =
        patient_code ||
        `P-${Date.now()}`;


    const [result] = await pool.query(
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
            finalPatientCode,
            name,
            gender,
            date_of_birth || null,
            phone || null,
            email || null,
            address || null,
            blood_group || null,
        ]
    );


    return result;
};


/*
=====================================================
UPDATE PATIENT
=====================================================
*/

const updatePatientModel = async (
    id,
    patient
) => {

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


    const [result] = await pool.query(
        `
        UPDATE patients
        SET
            patient_code = ?,
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
            patient_code,
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


    return result;
};


/*
=====================================================
DELETE PATIENT
=====================================================
*/

const deletePatientModel = async (id) => {

    const [result] = await pool.query(
        `
        DELETE FROM patients
        WHERE id = ?
        `,
        [id]
    );


    return result;
};


/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
    getAllPatients,
    searchPatientsModel,
    getPatientByIdModel,
    createPatientModel,
    updatePatientModel,
    deletePatientModel,
};