const pool = require("../config/db");

const createUser = async (user) => {
    const { name, email, password, role } = user;

    const [result] = await pool.execute(
        `INSERT INTO users
    (name, email, password, role)
    VALUES (?, ?, ?, ?)`,
        [name, email, password, role || "receptionist"]
    );

    return result.insertId;
};

const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT id, name, email, password, role, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
        [email]
    );

    return rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
};