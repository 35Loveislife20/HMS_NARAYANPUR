const mysql = require("mysql2/promise");

// =====================================================
// DATABASE POOL
// =====================================================

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    port: Number(process.env.DB_PORT) || 4000,

    ssl: {
        rejectUnauthorized: false,
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,

    connectTimeout: 30000,

    dateStrings: false,

    charset: "utf8mb4",

    multipleStatements: false,
});

// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

const testDatabaseConnection = async () => {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        console.log("========================================");
        console.log("✅ MySQL / TiDB Database Connected");
        console.log(`📦 Database: ${process.env.DB_NAME}`);
        console.log(`🌐 Host: ${process.env.DB_HOST}`);
        console.log(`🔌 Port: ${process.env.DB_PORT || 4000}`);
        console.log("========================================");

        return true;

    } catch (error) {

        console.error("========================================");
        console.error("❌ Database Connection Failed");
        console.error("========================================");
        console.error("Error Code:", error.code || "UNKNOWN");
        console.error("Error Message:", error.message);
        console.error("========================================");

        return false;

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// DATABASE HEALTH
// =====================================================

const checkDatabaseHealth = async () => {

    let connection;

    try {

        connection = await pool.getConnection();

        const [rows] = await connection.query(
            "SELECT 1 AS status"
        );

        return {
            connected: rows.length > 0,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 4000,
        };

    } catch (error) {

        return {
            connected: false,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 4000,
            error: error.message,
        };

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// CLOSE DATABASE
// =====================================================

const closeDatabase = async () => {

    try {

        await pool.end();

        console.log("✅ Database connection pool closed.");

    } catch (error) {

        console.error(
            "❌ Error closing database pool:",
            error.message
        );
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    pool,
    testDatabaseConnection,
    checkDatabaseHealth,
    closeDatabase,
};