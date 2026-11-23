const { pool } = require("../config/db");

// =====================================================
// CREATE USER
// =====================================================

const createUser = async (
    name,
    email,
    hashedPassword,
    phone,
    role,
    profileImage = null,
    hospitalId = null
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
            hospital_id,
            status,
            profile_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            email,
            hashedPassword,
            phone || null,
            role,
            hospitalId || null,
            "active",
            profileImage || null,
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
            hospital_id,
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
            hospital_id,
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
// FIND HOSPITAL ADMIN BY HOSPITAL ID
// =====================================================

const findHospitalAdminByHospitalId = async (hospitalId) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            hospital_id,
            status,
            profile_image,
            created_at
        FROM users
        WHERE hospital_id = ?
        AND role = 'hospital_admin'
        ORDER BY id ASC
        LIMIT 1
        `,
        [hospitalId]
    );

    return rows[0] || null;
};


// =====================================================
// FIND USER BY HOSPITAL ID
// =====================================================

const findUsersByHospitalId = async (hospitalId) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            hospital_id,
            status,
            profile_image,
            created_at
        FROM users
        WHERE hospital_id = ?
        ORDER BY id ASC
        `,
        [hospitalId]
    );

    return rows;
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
            hospital_id,
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

const findAllUsers = async (hospitalId = null) => {
    let query = `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            hospital_id,
            status,
            profile_image,
            created_at
        FROM users
    `;

    const params = [];

    if (hospitalId !== null && hospitalId !== undefined) {
        query += `
            WHERE hospital_id = ?
        `;

        params.push(hospitalId);
    }

    query += `
        ORDER BY id DESC
    `;

    const [rows] = await pool.query(query, params);

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
    role,
    hashedPassword = null,
    profileImage = null,
    hospitalId = null
) => {
    // Optional columns are only touched when a value is given,
    // so editing a user can never wipe the password / image.
    const fields = [
        "name = ?",
        "email = ?",
        "phone = ?",
        "role = ?",
        "hospital_id = ?",
    ];

    const params = [
        name,
        email,
        phone || null,
        role,
        hospitalId || null,
    ];

    if (hashedPassword) {
        fields.push("password = ?");
        params.push(hashedPassword);
    }

    if (profileImage) {
        fields.push("profile_image = ?");
        params.push(profileImage);
    }

    params.push(id);

    const [result] = await pool.query(
        `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        params
    );

    return result;
};


// =====================================================
// UPDATE USER PROFILE IMAGE
// =====================================================

const updateUserProfileImage = async (
    id,
    profileImage
) => {
    const [result] = await pool.query(
        `
        UPDATE users
        SET profile_image = ?
        WHERE id = ?
        `,
        [
            profileImage || null,
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
        SET
            password = ?,
            reset_token = NULL,
            reset_token_expires_at = NULL
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

    findHospitalAdminByHospitalId,

    findUsersByHospitalId,

    findUserByResetToken,

    saveResetToken,

    clearResetToken,

    findAllUsers,

    updateUser,

    updateUserPassword,

    updateUserProfileImage,

    updateUserStatus,

    deleteUserById,

    updateUserRole,
};