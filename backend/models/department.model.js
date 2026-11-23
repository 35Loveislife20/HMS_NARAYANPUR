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

const normalizeOptionalHospitalId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return normalizeId(value, "Hospital ID");
};

const normalizeText = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const text = String(value).trim();

    return text === "" ? null : text;
};

const normalizeName = (value) => {
    const name = String(value || "").trim();

    if (!name) {
        throw new Error(
            "Department name is required."
        );
    }

    if (name.length > 150) {
        throw new Error(
            "Department name cannot exceed 150 characters."
        );
    }

    return name;
};

const normalizeStatus = (
    value,
    defaultValue = "active"
) => {
    const status = String(
        value || defaultValue
    ).trim().toLowerCase();

    const allowedStatuses = [
        "active",
        "inactive",
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Invalid department status."
        );
    }

    return status;
};


/* =========================================================
   GET ALL DEPARTMENTS

   hospitalId = null
   => global access (super_admin)

   hospitalId = number
   => only that hospital's departments
========================================================= */

const getAllDepartments = async (
    hospitalId = null
) => {
    const normalizedHospitalId =
        normalizeOptionalHospitalId(
            hospitalId
        );

    let query = `
        SELECT
            id,
            hospital_id,
            name,
            description,
            status,
            created_at,
            updated_at
        FROM departments
    `;

    const params = [];

    if (normalizedHospitalId !== null) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
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


/* =========================================================
   GET DEPARTMENT BY ID

   hospitalId = null
   => global access (super_admin)

   hospitalId = number
   => department must belong to that hospital
========================================================= */

const getDepartmentById = async (
    id,
    hospitalId = null
) => {
    const departmentId =
        normalizeId(
            id,
            "Department ID"
        );

    const normalizedHospitalId =
        normalizeOptionalHospitalId(
            hospitalId
        );

    let query = `
        SELECT
            id,
            hospital_id,
            name,
            description,
            status,
            created_at,
            updated_at
        FROM departments
        WHERE id = ?
    `;

    const params = [
        departmentId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
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


/* =========================================================
   CREATE DEPARTMENT

   hospitalId is REQUIRED
========================================================= */

const createDepartment = async (
    name,
    description,
    status = "active",
    hospitalId
) => {
    const normalizedName =
        normalizeName(name);

    const normalizedDescription =
        normalizeText(description);

    const normalizedStatus =
        normalizeStatus(status);

    const normalizedHospitalId =
        normalizeId(
            hospitalId,
            "Hospital ID"
        );

    const [result] = await pool.query(
        `
        INSERT INTO departments
        (
            hospital_id,
            name,
            description,
            status
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            normalizedHospitalId,
            normalizedName,
            normalizedDescription,
            normalizedStatus,
        ]
    );

    return result.insertId;
};


/* =========================================================
   UPDATE DEPARTMENT

   hospitalId = null
   => global access (super_admin)

   hospitalId = number
   => update only if department belongs
      to that hospital
========================================================= */

const updateDepartment = async (
    id,
    name,
    description,
    status,
    hospitalId = null
) => {
    const departmentId =
        normalizeId(
            id,
            "Department ID"
        );

    const normalizedName =
        normalizeName(name);

    const normalizedDescription =
        normalizeText(description);

    const normalizedStatus =
        normalizeStatus(status);

    const normalizedHospitalId =
        normalizeOptionalHospitalId(
            hospitalId
        );

    let query = `
        UPDATE departments
        SET
            name = ?,
            description = ?,
            status = ?
        WHERE id = ?
    `;

    const params = [
        normalizedName,
        normalizedDescription,
        normalizedStatus,
        departmentId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] = await pool.query(
        query,
        params
    );

    return result.affectedRows;
};


/* =========================================================
   DELETE DEPARTMENT
   Soft delete

   hospitalId = null
   => global access (super_admin)

   hospitalId = number
   => deactivate only within hospital
========================================================= */

const deleteDepartment = async (
    id,
    hospitalId = null
) => {
    const departmentId =
        normalizeId(
            id,
            "Department ID"
        );

    const normalizedHospitalId =
        normalizeOptionalHospitalId(
            hospitalId
        );

    let query = `
        UPDATE departments
        SET
            status = 'inactive'
        WHERE id = ?
    `;

    const params = [
        departmentId,
    ];

    if (normalizedHospitalId !== null) {
        query += `
            AND hospital_id = ?
        `;

        params.push(
            normalizedHospitalId
        );
    }

    const [result] = await pool.query(
        query,
        params
    );

    return result.affectedRows;
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};