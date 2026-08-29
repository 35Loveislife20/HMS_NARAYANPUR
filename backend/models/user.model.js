const { pool } = require("../config/db");

// =====================================================
// CREATE USER
// =====================================================

const createUser = async (
    name,
    email,
    hashedPassword,
    phone,
    role
) => {

    const [result] = await pool.query(
        `
        INSERT INTO users
        (
            name,
            email,
            password,
            phone,
            role,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            email,
            hashedPassword,
            phone || null,
            role,
            "active",
        ]
    );

    return result;
};


// =====================================================
// FIND USER BY EMAIL
// =====================================================

const findUserByEmail = async (email) => {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            password,
            phone,
            role,
            status,
            profile_image,
            created_at,
            reset_token,
            reset_token_expires_at
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
};


// =====================================================
// FIND USER BY ID
// =====================================================

const findUserById = async (id) => {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            status,
            profile_image,
            created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};


// =====================================================
// FIND USER BY RESET TOKEN
// =====================================================

const findUserByResetToken = async (token) => {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            password,
            phone,
            role,
            status,
            profile_image,
            created_at,
            reset_token,
            reset_token_expires_at
        FROM users
        WHERE reset_token = ?
        AND reset_token_expires_at > NOW()
        LIMIT 1
        `,
        [token]
    );

    return rows[0] || null;
};


// =====================================================
// SAVE PASSWORD RESET TOKEN
// =====================================================

const saveResetToken = async (
    userId,
    resetToken,
    expiresAt
) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET
            reset_token = ?,
            reset_token_expires_at = ?
        WHERE id = ?
        `,
        [
            resetToken,
            expiresAt,
            userId,
        ]
    );

    return result;
};


// =====================================================
// CLEAR PASSWORD RESET TOKEN
// =====================================================

const clearResetToken = async (userId) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET
            reset_token = NULL,
            reset_token_expires_at = NULL
        WHERE id = ?
        `,
        [userId]
    );

    return result;
};


// =====================================================
// GET ALL USERS
// =====================================================

const findAllUsers = async () => {

    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            status,
            profile_image,
            created_at
        FROM users
        ORDER BY id DESC
        `
    );

    return rows;
};


// =====================================================
// UPDATE USER
// =====================================================

const updateUser = async (
    id,
    name,
    email,
    phone,
    role
) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET
            name = ?,
            email = ?,
            phone = ?,
            role = ?
        WHERE id = ?
        `,
        [
            name,
            email,
            phone || null,
            role,
            id,
        ]
    );

    return result;
};


// =====================================================
// UPDATE USER PASSWORD
// =====================================================

const updateUserPassword = async (
    id,
    hashedPassword
) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
            hashedPassword,
            id,
        ]
    );

    return result;
};


// =====================================================
// UPDATE USER STATUS
// =====================================================

const updateUserStatus = async (
    id,
    status
) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET status = ?
        WHERE id = ?
        `,
        [
            status,
            id,
        ]
    );

    return result;
};


// =====================================================
// DELETE USER
// =====================================================

const deleteUserById = async (id) => {

    const [result] = await pool.query(
        `
        DELETE FROM users
        WHERE id = ?
        `,
        [id]
    );

    return result;
};


// =====================================================
// UPDATE USER ROLE
// =====================================================

const updateUserRole = async (
    id,
    role
) => {

    const [result] = await pool.query(
        `
        UPDATE users
        SET role = ?
        WHERE id = ?
        `,
        [
            role,
            id,
        ]
    );

    return result;
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createUser,

    findUserByEmail,

    findUserById,

    findUserByResetToken,

    saveResetToken,

    clearResetToken,

    findAllUsers,

    updateUser,

    updateUserPassword,

    updateUserStatus,

    deleteUserById,

    updateUserRole,

};