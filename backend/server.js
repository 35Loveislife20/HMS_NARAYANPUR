require("./config/brevoPatch");
require("dotenv").config();

const app = require("./app");

const {
    testDatabaseConnection,
    closeDatabase,
} = require("./config/db");

const {
    verifyEmailConnection,
} = require("./config/email");

const PORT =
    Number(process.env.PORT) || 5000;

// =====================================================
// LOCAL DEVELOPMENT SERVER
// =====================================================

if (require.main === module) {

    let server;

    const startServer = async () => {

        try {

            // =================================================
            // TEST DATABASE
            // =================================================

            const databaseConnected =
                await testDatabaseConnection();

            if (!databaseConnected) {

                console.error(
                    "❌ Server was not started because database connection failed."
                );

                process.exit(1);
            }

            // =================================================
            // VERIFY EMAIL
            // =================================================
            //
            // Email failure should NOT stop the HMS API.
            //

            try {

                await verifyEmailConnection();

                console.log(
                    "✅ Email service verified successfully."
                );

            } catch (emailError) {

                console.error(
                    "⚠️ Email service verification failed:"
                );

                console.error(
                    emailError.message
                );

                console.error(
                    "⚠️ HMS API will continue running."
                );
            }

            // =================================================
            // START EXPRESS SERVER
            // =================================================

            server =
                app.listen(
                    PORT,
                    () => {

                        console.log(
                            "========================================"
                        );

                        console.log(
                            "🚀 HMS Backend Server Started"
                        );

                        console.log(
                            `📡 Port: ${PORT}`
                        );

                        console.log(
                            `🌐 API: http://localhost:${PORT}/api`
                        );

                        console.log(
                            `🔐 Login: http://localhost:${PORT}/api/auth/login`
                        );

                        console.log(
                            `⚙️ Settings: http://localhost:${PORT}/api/settings`
                        );

                        console.log(
                            "========================================"
                        );

                    }
                );

            // =================================================
            // GRACEFUL SHUTDOWN
            // =================================================

            const shutdown =
                async (signal) => {

                    console.log(
                        `\n${signal} received.`
                    );

                    if (!server) {

                        try {

                            await closeDatabase();

                        } catch (error) {

                            console.error(
                                "❌ Error while closing database:",
                                error
                            );

                        }

                        process.exit(0);
                    }

                    server.close(
                        async () => {

                            console.log(
                                "HTTP server closed."
                            );

                            try {

                                await closeDatabase();

                                console.log(
                                    "Database connection closed."
                                );

                            } catch (error) {

                                console.error(
                                    "❌ Error while closing database:",
                                    error
                                );

                            }

                            process.exit(0);

                        }
                    );

                };

            // =================================================
            // PROCESS SIGNALS
            // =================================================

            process.on(
                "SIGINT",
                () => {
                    shutdown("SIGINT");
                }
            );

            process.on(
                "SIGTERM",
                () => {
                    shutdown("SIGTERM");
                }
            );

        } catch (error) {

            console.error(
                "❌ Server startup failed:"
            );

            console.error(
                error
            );

            process.exit(1);
        }
    };

    // =====================================================
    // START SERVER
    // =====================================================

    startServer();
}

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;