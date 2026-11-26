const { pool } = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

const normalizeHospitalId = (hospitalId) => {
    if (
        hospitalId === null ||
        hospitalId === undefined ||
        hospitalId === ""
    ) {
        return null;
    }

    const value = Number(hospitalId);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Invalid hospital ID");
    }

    return value;
};

const normalizePatientId = (id) => {
    const value = Number(id);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Invalid patient ID");
    }

    return value;
};

// =====================================================
// GET ALL PATIENTS
// =====================================================
// super_admin  -> ALL HOSPITALS
// other users  -> THEIR HOSPITAL ONLY
// =====================================================

const getAllPatients = async (hospitalId = null) => {
    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        SELECT
            id,
            hospital_id,
            user_id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            emergency_contact,
            created_at,
            updated_at
        FROM patients
    `;

    const params = [];

    if (normalizedHospitalId !== null) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(normalizedHospitalId);
    }

    query += `
        ORDER BY id DESC
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows;
};

// =====================================================
// SEARCH PATIENTS
// =====================================================
// Used by authenticated system and public patient portal.
//
// Public search should NOT expose:
// - address
// - blood_group
// - emergency_contact
//
// It returns only minimum information needed
// to identify a patient.
// =====================================================

const searchPatientsModel = async (
    search,
    hospitalId = null
) => {
    const searchValue =
        String(search || "").trim();

    if (!searchValue) {
        return [];
    }

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    const likeValue =
        `%${searchValue}%`;

    let query = `
        SELECT
            id,
            hospital_id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            created_at
        FROM patients
        WHERE
            (
                CAST(id AS CHAR) LIKE ?
                OR patient_code LIKE ?
                OR name LIKE ?
                OR phone LIKE ?
                OR email LIKE ?
            )
    `;

    const params = [
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(normalizedHospitalId);
    }

    query += `
        ORDER BY id DESC
        LIMIT 20
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows;
};

// =====================================================
// PUBLIC PATIENT LOOKUP (no login)
// =====================================================
// - hospital_id is REQUIRED
// - EXACT match on patient_code or phone only (no LIKE,
//   so the patient list cannot be enumerated)
// - returns the minimum needed to book an appointment
//   (phone is masked, no email / DOB / address)
// =====================================================

const maskPhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");

    if (digits.length < 4) {
        return null;
    }

    return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};

const findPatientForPublicLookup = async (
    search,
    hospitalId
) => {
    const searchValue =
        String(search || "").trim();

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    if (!searchValue || normalizedHospitalId === null) {
        return [];
    }

    const [rows] = await pool.query(
        `
        SELECT
            id,
            hospital_id,
            patient_code,
            name,
            gender,
            phone
        FROM patients
        WHERE hospital_id = ?
        AND (
            patient_code = ?
            OR phone = ?
        )
        ORDER BY id DESC
        LIMIT 5
        `,
        [
            normalizedHospitalId,
            searchValue,
            searchValue,
        ]
    );

    return rows.map((row) => ({
        id: row.id,
        hospital_id: row.hospital_id,
        patient_code: row.patient_code,
        name: row.name,
        gender: row.gender,
        phone: maskPhoneNumber(row.phone),
    }));
};

// =====================================================
// GET PATIENT BY ID
// =====================================================

const getPatientByIdModel = async (
    id,
    hospitalId = null
) => {
    const patientId =
        normalizePatientId(id);

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        SELECT
            id,
            hospital_id,
            user_id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            emergency_contact,
            created_at,
            updated_at
        FROM patients
        WHERE id = ?
    `;

    const params = [patientId];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(normalizedHospitalId);
    }

    query += `
        LIMIT 1
    `;

    const [rows] = await pool.query(
        query,
        params
    );

    return rows[0] || null;
};

// =====================================================
// CREATE PATIENT
// =====================================================

const createPatientModel = async (
    patient,
    hospitalId = null
) => {
    const {
        user_id,
        patient_code,
        name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        blood_group,
        emergency_contact,
        hospital_id,
    } = patient || {};

    const finalHospitalId =
        hospitalId !== null &&
        hospitalId !== undefined
            ? normalizeHospitalId(hospitalId)
            : normalizeHospitalId(hospital_id);

    if (finalHospitalId === null) {
        throw new Error(
            "Hospital ID is required to create patient"
        );
    }

    const finalPatientCode =
        String(patient_code || "").trim() ||
        `P-${Date.now()}`;

    const finalUserId =
        user_id === null ||
        user_id === undefined ||
        user_id === ""
            ? null
            : Number(user_id);

    if (
        finalUserId !== null &&
        (!Number.isInteger(finalUserId) ||
            finalUserId <= 0)
    ) {
        throw new Error("Invalid user ID");
    }

    const [result] = await pool.query(
        `
        INSERT INTO patients
        (
            hospital_id,
            user_id,
            patient_code,
            name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            blood_group,
            emergency_contact
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            finalHospitalId,
            finalUserId,
            finalPatientCode,
            name,
            gender,
            date_of_birth || null,
            phone || null,
            email || null,
            address || null,
            blood_group || null,
            emergency_contact || null,
        ]
    );

    return result;
};

// =====================================================
// UPDATE PATIENT
// =====================================================

const updatePatientModel = async (
    id,
    patient,
    hospitalId = null
) => {
    const patientId =
        normalizePatientId(id);

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    const {
        patient_code,
        name,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        blood_group,
        emergency_contact,
    } = patient || {};

    let query = `
        UPDATE patients
        SET
            name = ?,
            gender = ?,
            date_of_birth = ?,
            phone = ?,
            email = ?,
            address = ?,
            blood_group = ?,
            emergency_contact = ?
        WHERE id = ?
    `;

    const params = [
        name,
        gender,
        date_of_birth || null,
        phone || null,
        email || null,
        address || null,
        blood_group || null,
        emergency_contact || null,
        patientId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(normalizedHospitalId);
    }

    const [result] = await pool.query(
        query,
        params
    );

    return result;
};

// =====================================================
// DELETE PATIENT
// =====================================================

const deletePatientModel = async (
    id,
    hospitalId = null
) => {
    const patientId =
        normalizePatientId(id);

    const normalizedHospitalId =
        normalizeHospitalId(hospitalId);

    let query = `
        DELETE FROM patients
        WHERE id = ?
    `;

    const params = [patientId];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(normalizedHospitalId);
    }

    const [result] = await pool.query(
        query,
        params
    );

    return result;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getAllPatients,
    searchPatientsModel,
    findPatientForPublicLookup,
    getPatientByIdModel,
    createPatientModel,
    updatePatientModel,
    deletePatientModel,
};