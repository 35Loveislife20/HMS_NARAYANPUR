const express = require("express");
const cors = require("cors");
const path = require("path");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const patientRoutes = require("./routes/patient.routes");
const doctorRoutes = require("./routes/doctors.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const departmentRoutes = require("./routes/department.routes");
const billingRoutes = require("./routes/billing.routes");
const laboratoryRoutes = require("./routes/laboratory.routes");
const medicineRoutes = require("./routes/medicine.routes");
const userRoutes = require("./routes/users.routes");
const settingsRoutes = require("./routes/settings.routes");
const hospitalRoutes = require("./routes/hospital.routes");

// NEW: send registration certificate (PDF) by Email / WhatsApp
const hospitalCertificateRoutes = require("./routes/hospitalCertificate.routes");

// NEW: complaints
const complaintRoutes = require("./routes/complaintRoutes");

// NEW: WhatsApp
const whatsappRoutes = require("./routes/whatsapp.routes");

// =====================================================
// PUBLIC ROUTES
// =====================================================

const publicRoutes = require("./routes/public.routes");

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
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With",
        ],
    })
);

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

// =====================================================
// STATIC UPLOADS
// =====================================================

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
        api: "/api",
    });
});

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HMS API is running",
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
// HOSPITAL CERTIFICATE (Email / WhatsApp)
// =====================================================
//
// POST /api/hospitals/:id/send-certificate
//
// Must be mounted BEFORE the normal hospitals router.
//
// TEMPORARY SAFETY: this route has no login check yet, so it is only
// mounted when NODE_ENV is not "production". It must be protected with
// the Super Admin auth middleware before deploying.
//
// =====================================================

if (process.env.NODE_ENV !== "production") {
    app.use(
        "/api/hospitals",
        hospitalCertificateRoutes
    );
}

// =====================================================
// HOSPITALS
// =====================================================

app.use(
    "/api/hospitals",
    hospitalRoutes
);

// =====================================================
// COMPLAINTS (NEW)
// =====================================================
//
// POST  /api/complaints                -> public form (patient / staff)
// POST  /api/complaints/from-hospital  -> Hospital Admin -> Super Admin
// GET   /api/complaints                -> Super Admin / Hospital Admin
// PATCH /api/complaints/:id            -> status + reply
//
// =====================================================

app.use(
    "/api/complaints",
    complaintRoutes
);

// =====================================================
// WHATSAPP (NEW)
// =====================================================
//
// POST /api/send-whatsapp
//
// =====================================================

app.use(
    "/api",
    whatsappRoutes
);

// =====================================================
// PUBLIC HOMEPAGE APIs
// =====================================================
//
// Public homepage ke liye routes.
// Is route par authentication required nahi hai.
//
// Example:
// GET /api/public/doctors
//
// =====================================================

app.use(
    "/api/public",
    publicRoutes
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

        const statusCode =
            Number(error.status) ||
            Number(error.statusCode) ||
            500;

        res.status(statusCode).json({
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