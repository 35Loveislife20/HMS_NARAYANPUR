/* =========================================================
   HMS ROLE MIDDLEWARE
   Complete Replacement
   9 Roles + Exact Permission Matrix
========================================================= */


// =========================================================
// 9 HMS ROLES
// =========================================================

const ROLES = {
    SUPER_ADMIN: "super_admin",
    HOSPITAL_ADMIN: "hospital_admin",
    RECEPTIONIST: "receptionist",
    DOCTOR: "doctor",
    LAB_TECHNICIAN: "lab_technician",
    PHARMACIST: "pharmacist",
    ACCOUNTANT: "accountant",
    NURSE: "nurse",
    PATIENT: "patient",
};


// =========================================================
// ALL VALID ROLES
// =========================================================

const VALID_ROLES = Object.values(ROLES);


// =========================================================
// EXACT HMS PERMISSION MATRIX
// =========================================================
//
// Dashboard      -> All 9
// Patients       -> Super Admin, Hospital Admin,
//                   Receptionist, Doctor, Nurse
// Doctors        -> Super Admin, Hospital Admin
// Appointments   -> Super Admin, Hospital Admin,
//                   Receptionist, Doctor, Nurse, Patient
// Departments    -> Super Admin, Hospital Admin,
//                   Doctor, Nurse
// Laboratory     -> Super Admin, Hospital Admin,
//                   Doctor, Lab Technician
// Pharmacy       -> Super Admin, Hospital Admin,
//                   Pharmacist, Accountant
// Billing        -> Super Admin, Hospital Admin,
//                   Pharmacist, Accountant
// Reports        -> Super Admin, Hospital Admin,
//                   Doctor, Lab Technician,
//                   Pharmacist, Accountant
// Settings       -> Super Admin, Hospital Admin
// User Management-> Super Admin
//
// =========================================================

const PERMISSIONS = {

    dashboard: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.RECEPTIONIST,
        ROLES.DOCTOR,
        ROLES.LAB_TECHNICIAN,
        ROLES.PHARMACIST,
        ROLES.ACCOUNTANT,
        ROLES.NURSE,
        ROLES.PATIENT,
    ],

    patients: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.RECEPTIONIST,
        ROLES.DOCTOR,
        ROLES.NURSE,
    ],

    doctors: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
    ],

    appointments: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.RECEPTIONIST,
        ROLES.DOCTOR,
        ROLES.NURSE,
        ROLES.PATIENT,
    ],

    departments: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.DOCTOR,
        ROLES.NURSE,
    ],

    laboratory: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.DOCTOR,
        ROLES.LAB_TECHNICIAN,
    ],

    pharmacy: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.PHARMACIST,
        ROLES.ACCOUNTANT,
    ],

    billing: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.PHARMACIST,
        ROLES.ACCOUNTANT,
    ],

    reports: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.DOCTOR,
        ROLES.LAB_TECHNICIAN,
        ROLES.PHARMACIST,
        ROLES.ACCOUNTANT,
    ],

    settings: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
    ],

    users: [
        ROLES.SUPER_ADMIN,
    ],
};


// =========================================================
// ROLE NORMALIZER
// =========================================================

const normalizeRole = (role) => {

    if (typeof role !== "string") {
        return "";
    }

    return role
        .trim()
        .toLowerCase();
};


// =========================================================
// REQUIRE AUTHENTICATION
// =========================================================
//
// This middleware expects auth middleware to run BEFORE it.
//
// Example:
//
// router.get(
//     "/",
//     authenticate,
//     requireRole(...),
//     controller
// );
//
// =========================================================

const requireRole = (...allowedRoles) => {

    return (req, res, next) => {

        try {

            // -------------------------------------------------
            // USER CHECK
            // -------------------------------------------------

            if (!req.user) {

                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }


            // -------------------------------------------------
            // USER ROLE
            // -------------------------------------------------

            const userRole =
                normalizeRole(
                    req.user.role
                );


            // -------------------------------------------------
            // INVALID USER ROLE
            // -------------------------------------------------

            if (
                !VALID_ROLES.includes(
                    userRole
                )
            ) {

                console.error(
                    "❌ Invalid user role:",
                    req.user.role
                );

                return res.status(403).json({
                    success: false,
                    message: "Invalid user role",
                });
            }


            // -------------------------------------------------
            // NORMALIZE ALLOWED ROLES
            // -------------------------------------------------

            const normalizedAllowedRoles =
                allowedRoles
                    .filter(
                        (role) =>
                            typeof role === "string"
                    )
                    .map(
                        (role) =>
                            normalizeRole(role)
                    );


            // -------------------------------------------------
            // NO ROLES PROVIDED
            // -------------------------------------------------

            if (
                normalizedAllowedRoles.length === 0
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "No roles configured for this resource",
                });
            }


            // -------------------------------------------------
            // CHECK ROLE
            // -------------------------------------------------

            if (
                !normalizedAllowedRoles.includes(
                    userRole
                )
            ) {

                console.warn(
                    `🚫 Access denied | User: ${req.user.id} | Role: ${userRole}`
                );

                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have permission to access this resource",
                });
            }


            // -------------------------------------------------
            // AUTHORIZED
            // -------------------------------------------------

            next();

        } catch (error) {

            console.error(
                "ROLE MIDDLEWARE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Role authorization error",
            });
        }
    };
};


// =========================================================
// REQUIRE PERMISSION
// =========================================================
//
// Usage:
//
// requirePermission("patients")
//
// =========================================================

const requirePermission = (permission) => {

    return (req, res, next) => {

        try {

            // -------------------------------------------------
            // AUTHENTICATION CHECK
            // -------------------------------------------------

            if (!req.user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required",
                });
            }


            // -------------------------------------------------
            // PERMISSION CHECK
            // -------------------------------------------------

            if (
                typeof permission !== "string" ||
                !permission.trim()
            ) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Invalid permission configuration",
                });
            }


            const permissionKey =
                permission
                    .trim()
                    .toLowerCase();


            const allowedRoles =
                PERMISSIONS[
                permissionKey
                ];


            // -------------------------------------------------
            // UNKNOWN PERMISSION
            // -------------------------------------------------

            if (!allowedRoles) {

                console.error(
                    "❌ Unknown HMS permission:",
                    permissionKey
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unknown permission",
                });
            }


            // -------------------------------------------------
            // USER ROLE
            // -------------------------------------------------

            const userRole =
                normalizeRole(
                    req.user.role
                );


            // -------------------------------------------------
            // INVALID ROLE
            // -------------------------------------------------

            if (
                !VALID_ROLES.includes(
                    userRole
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Invalid user role",
                });
            }


            // -------------------------------------------------
            // PERMISSION CHECK
            // -------------------------------------------------

            if (
                !allowedRoles.includes(
                    userRole
                )
            ) {

                console.warn(
                    `🚫 Permission denied | Role: ${userRole} | Permission: ${permissionKey}`
                );

                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have permission to access this resource",
                    permission:
                        permissionKey,
                    role:
                        userRole,
                });
            }


            // -------------------------------------------------
            // AUTHORIZED
            // -------------------------------------------------

            next();

        } catch (error) {

            console.error(
                "PERMISSION MIDDLEWARE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Permission authorization error",
            });
        }
    };
};


// =========================================================
// INDIVIDUAL PERMISSION MIDDLEWARES
// =========================================================
//
// These are optional convenience middleware functions.
// They make routes cleaner.
//
// =========================================================

const canAccessDashboard =
    requirePermission("dashboard");

const canAccessPatients =
    requirePermission("patients");

const canAccessDoctors =
    requirePermission("doctors");

const canAccessAppointments =
    requirePermission("appointments");

const canAccessDepartments =
    requirePermission("departments");

const canAccessLaboratory =
    requirePermission("laboratory");

const canAccessPharmacy =
    requirePermission("pharmacy");

const canAccessBilling =
    requirePermission("billing");

const canAccessReports =
    requirePermission("reports");

const canAccessSettings =
    requirePermission("settings");

const canAccessUsers =
    requirePermission("users");


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    // Roles
    ROLES,

    VALID_ROLES,

    // Permission matrix
    PERMISSIONS,

    // Helpers
    normalizeRole,

    // Generic authorization
    requireRole,

    requirePermission,

    // Permission middleware
    canAccessDashboard,
    canAccessPatients,
    canAccessDoctors,
    canAccessAppointments,
    canAccessDepartments,
    canAccessLaboratory,
    canAccessPharmacy,
    canAccessBilling,
    canAccessReports,
    canAccessSettings,
    canAccessUsers,
};