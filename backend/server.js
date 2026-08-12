require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT 1");

        console.log("MySQL Database Connected");

        app.listen(PORT, () => {
            console.log(`HMS Server running on port ${PORT}`);
            console.log(`http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();