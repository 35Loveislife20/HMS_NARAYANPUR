require("dotenv").config();

const app = require("./app");

const {
    testDatabaseConnection,
    closeDatabase,
} = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
    try {
        // Test database first
        const databaseConnected = await testDatabaseConnection();

        if (!databaseConnected) {
            console.error(
                "❌ Server was not started because database connection failed."
            );

            process.exit(1);
        }

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log("========================================");
            console.log("🚀 HMS Backend Server Started");
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log("========================================");
        });

        // -------------------------------------------------
        // GRACEFUL SHUTDOWN
        // -------------------------------------------------

        const shutdown = async (signal) => {
            console.log(`\n${signal} received.`);

            server.close(async () => {
                console.log("HTTP server closed.");

                await closeDatabase();

                process.exit(0);
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));

        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.error("❌ Server startup failed:");
        console.error(error);

        process.exit(1);
    }
};

// =====================================================
// RUN
// =====================================================

startServer();