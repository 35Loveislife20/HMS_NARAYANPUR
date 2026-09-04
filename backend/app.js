const express = require("express");
const cors = require("cors");
const path = require("path");

// =====================================================
// ROUTES
// =====================================================

const authRoutes =
    require("./routes/auth.routes");

const dashboardRoutes =
    require("./routes/dashboard.routes");

const patientRoutes =
    require("./routes/patient.routes");

const doctorRoutes =
    require("./routes/doctors.routes");

const appointmentRoutes =
    require("./routes/appointment.routes");

const departmentRoutes =
    require("./routes/department.routes");

const billingRoutes =
    require("./routes/billing.routes");

const laboratoryRoutes =
    require("./routes/laboratory.routes");

const medicineRoutes =
    require("./routes/medicine.routes");

const userRoutes =
    require("./routes/users.routes");

const settingsRoutes =
    require("./routes/settings.routes");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// GLOBAL MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

// Doctor photos will be available through:
// http://localhost:5000/uploads/doctors/filename.jpg

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HMS Backend API is running",
    });
});

// =====================================================
// AUTH
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

// =====================================================
// DASHBOARD
// =====================================================

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// =====================================================
// PATIENTS
// =====================================================

app.use(
    "/api/patients",
    patientRoutes
);

// =====================================================
// DOCTORS
// =====================================================

app.use(
    "/api/doctors",
    doctorRoutes
);

// =====================================================
// APPOINTMENTS
// =====================================================

app.use(
    "/api/appointments",
    appointmentRoutes
);

// =====================================================
// DEPARTMENTS
// =====================================================

app.use(
    "/api/departments",
    departmentRoutes
);

// =====================================================
// BILLING
// =====================================================

app.use(
    "/api/billing",
    billingRoutes
);

// =====================================================
// LABORATORY
// =====================================================

app.use(
    "/api/laboratory",
    laboratoryRoutes
);

// =====================================================
// PHARMACY / MEDICINES
// =====================================================

app.use(
    "/api/medicines",
    medicineRoutes
);

// =====================================================
// USER MANAGEMENT
// =====================================================

app.use(
    "/api/users",
    userRoutes
);

// =====================================================
// SETTINGS
// =====================================================

app.use(
    "/api/settings",
    settingsRoutes
);

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
    console.warn(
        "⚠️ API ROUTE NOT FOUND:",
        req.method,
        req.originalUrl
    );

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl,
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {
        console.error(
            "========================================"
        );

        console.error(
            "GLOBAL SERVER ERROR"
        );

        console.error(
            "Method:",
            req.method
        );

        console.error(
            "Path:",
            req.originalUrl
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "========================================"
        );

        res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal server error",
        });
    }
);

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;