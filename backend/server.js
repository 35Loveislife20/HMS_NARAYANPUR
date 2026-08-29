require("dotenv").config();

const app = require("./app");

const {
    testDatabaseConnection,
    closeDatabase,
} = require("./config/db");

const {
    verifyEmailConnection,
} = require("./config/email");

const settingsRoutes =
    require("./routes/settings.routes");

const PORT =
    Number(process.env.PORT) || 5000;


// =====================================================
// SETTINGS ROUTE
// =====================================================

app.use(
    "/api/settings",
    settingsRoutes
);


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {

    try {

        // -------------------------------------------------
        // TEST DATABASE FIRST
        // -------------------------------------------------

        const databaseConnected =
            await testDatabaseConnection();


        if (!databaseConnected) {

            console.error(
                "❌ Server was not started because database connection failed."
            );

            process.exit(1);
        }


        // -------------------------------------------------
        // VERIFY EMAIL SERVICE
        // -------------------------------------------------

        await verifyEmailConnection();


        // -------------------------------------------------
        // START EXPRESS SERVER
        // -------------------------------------------------

        const server =
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
                        `⚙️ Settings: http://localhost:${PORT}/api/settings`
                    );

                    console.log(
                        "========================================"
                    );

                }
            );


        // -------------------------------------------------
        // GRACEFUL SHUTDOWN
        // -------------------------------------------------

        const shutdown =
            async (signal) => {

                console.log(
                    `\n${signal} received.`
                );


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


        // -------------------------------------------------
        // PROCESS SIGNALS
        // -------------------------------------------------

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
// RUN SERVER
// =====================================================

startServer();