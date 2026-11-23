const { pool } = require("../config/db");

// =====================================================
// OTP CHALLENGES TABLE (created automatically on first use)
//   verified_until : password was verified until this time (epoch ms)
//   code_hash      : HMAC of the OTP (the OTP itself is never stored)
//   expires_at     : OTP expiry (epoch ms)
// =====================================================

let tableReady = false;

const ensureOtpTable = async () => {
    if (tableReady) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS otp_challenges (
            user_id        BIGINT NOT NULL PRIMARY KEY,
            verified_until BIGINT NOT NULL,
            code_hash      VARCHAR(64) NULL,
            method         VARCHAR(10) NULL,
            expires_at     BIGINT NULL,
            attempts       INT NOT NULL DEFAULT 0,
            last_sent_at   BIGINT NULL
        )
    `);

    tableReady = true;
};

// password was correct -> open a short window in which OTP can be requested
const startChallenge = async (userId, verifiedUntil) => {
    await ensureOtpTable();

    await pool.query(
        `
        INSERT INTO otp_challenges
            (user_id, verified_until, code_hash, method, expires_at, attempts, last_sent_at)
        VALUES (?, ?, NULL, NULL, NULL, 0, NULL)
        ON DUPLICATE KEY UPDATE
            verified_until = VALUES(verified_until),
            code_hash = NULL,
            method = NULL,
            expires_at = NULL,
            attempts = 0,
            last_sent_at = NULL
        `,
        [userId, verifiedUntil]
    );
};

const getChallenge = async (userId) => {
    await ensureOtpTable();

    const [rows] = await pool.query(
        `SELECT * FROM otp_challenges WHERE user_id = ? LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

const saveCode = async (userId, codeHash, method, expiresAt, now) => {
    await pool.query(
        `
        UPDATE otp_challenges
        SET code_hash = ?, method = ?, expires_at = ?, attempts = 0, last_sent_at = ?
        WHERE user_id = ?
        `,
        [codeHash, method, expiresAt, now, userId]
    );
};

const addAttempt = async (userId) => {
    await pool.query(
        `UPDATE otp_challenges SET attempts = attempts + 1 WHERE user_id = ?`,
        [userId]
    );
};

const deleteChallenge = async (userId) => {
    await pool.query(
        `DELETE FROM otp_challenges WHERE user_id = ?`,
        [userId]
    );
};

module.exports = {
    ensureOtpTable,
    startChallenge,
    getChallenge,
    saveCode,
    addAttempt,
    deleteChallenge,
};