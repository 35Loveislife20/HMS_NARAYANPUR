const { pool } = require("../config/db");

// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

const getAllDepartments = async () => {
    const [rows] = await pool.query(
        `SELECT 
            id,
            name,
            description,
            status,
            created_at,
            updated_at
         FROM departments
         ORDER BY id DESC`
    );

    return rows;
};

// =====================================================
// GET DEPARTMENT BY ID
// =====================================================

const getDepartmentById = async (id) => {
    const [rows] = await pool.query(
        `SELECT 
            id,
            name,
            description,
            status,
            created_at,
            updated_at
         FROM departments
         WHERE id = ?`,
        [id]
    );

    return rows[0];
};

// =====================================================
// CREATE DEPARTMENT
// =====================================================

const createDepartment = async (
    name,
    description,
    status = "active"
) => {
    const [result] = await pool.query(
        `INSERT INTO departments
            (name, description, status)
         VALUES (?, ?, ?)`,
        [
            name,
            description || null,
            status
        ]
    );

    return result.insertId;
};

// =====================================================
// UPDATE DEPARTMENT
// =====================================================

const updateDepartment = async (
    id,
    name,
    description,
    status
) => {
    const [result] = await pool.query(
        `UPDATE departments
         SET
            name = ?,
            description = ?,
            status = ?
         WHERE id = ?`,
        [
            name,
            description || null,
            status,
            id
        ]
    );

    return result.affectedRows;
};

// =====================================================
// DELETE DEPARTMENT
// =====================================================

const deleteDepartment = async (id) => {
    const [result] = await pool.query(
        `UPDATE departments
         SET status = 'inactive'
         WHERE id = ?`,
        [id]
    );

    return result.affectedRows;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
};