const mysql = require("mysql2/promise");

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = Number(process.env.DB_PORT) || 4000;

// =====================================================
// DATABASE POOL
// =====================================================

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,

    port: DB_PORT,

    // Force IPv4
    family: 4,

    // TiDB Cloud requires SSL
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
        console.log("========================================");
        console.log("🔄 Connecting to TiDB...");
        console.log("🌐 Host:", DB_HOST);
        console.log("🔌 Port:", DB_PORT);
        console.log("📦 Database:", DB_NAME);
        console.log("========================================");

        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        console.log("========================================");
        console.log("✅ MySQL / TiDB Database Connected");
        console.log("========================================");

        return true;

    } catch (error) {

        console.error("========================================");
        console.error("❌ Database Connection Failed");
        console.error("========================================");
        console.error("Error Code:", error.code || "UNKNOWN");
        console.error("Error Message:", error.message);
        console.error("Error Host:", DB_HOST);
        console.error("Error Port:", DB_PORT);
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
            database: DB_NAME,
            host: DB_HOST,
            port: DB_PORT,
        };

    } catch (error) {

        return {
            connected: false,
            database: DB_NAME,
            host: DB_HOST,
            port: DB_PORT,
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