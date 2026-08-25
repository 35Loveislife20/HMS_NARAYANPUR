const { pool } = require("../config/db");

const createUser = async (name, email, hashedPassword, phone, role) => {
    const [result] = await pool.query(
        `INSERT INTO users (name, email, password, phone, role)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, phone || null, role]
    );
    return result;
};

const findUserByEmail = async (email) => {
    const [rows] = await pool.query(
        `SELECT id, name, email, password, role, phone, profile_image, created_at
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );
    return rows[0] || null;
};

const findUserById = async (id) => {
    const [rows] = await pool.query(
        `SELECT id, name, email, role, phone, profile_image, created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id]
    );
    return rows[0] || null;
};

module.exports = { createUser, findUserByEmail, findUserById };