const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const doctorsRoutes = require("./routes/doctors.routes");


const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HMS Backend API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorsRoutes);

module.exports = app;