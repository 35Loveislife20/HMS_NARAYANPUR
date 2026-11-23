const {
    getDashboardStats,
    getRecentAppointments,
} = require("../models/dashboard.model");

// =====================================================
// HELPER
// =====================================================

const getRole = (req) =>
    String(req.user?.role || "").toLowerCase();

const getHospitalScope = (req) => {
    const role = getRole(req);

    // Super Admin can see global dashboard data
    if (role === "super_admin") {
        return null;
    }

    // hospital_id ya hospitalId dono naam accept karein
    const rawHospitalId =
        req.user?.hospital_id ??
        req.user?.hospitalId ??
        req.user?.hospital?.id;

    // Every non-super-admin user must have a hospital
    if (
        rawHospitalId === undefined ||
        rawHospitalId === null ||
        rawHospitalId === ""
    ) {
        const error = new Error(
            "User is not assigned to a hospital"
        );

        error.statusCode = 403;

        throw error;
    }

    const hospitalId = Number(rawHospitalId);

    if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
        const error = new Error(
            "Invalid hospital assignment"
        );

        error.statusCode = 403;

        throw error;
    }

    return hospitalId;
};

// =====================================================
// SCOPE
// =====================================================

const getScopeName = (req) =>
    getRole(req) === "super_admin"
        ? "global"
        : "hospital";

// =====================================================
// DASHBOARD STATS
// =====================================================

const getStats = async (req, res) => {
    try {
        const hospitalId = getHospitalScope(req);

        const stats = await getDashboardStats(
            hospitalId
        );

        return res.status(200).json({
            success: true,

            scope: getScopeName(req),

            stats: {
                totalPatients:
                    Number(stats?.totalPatients) || 0,

                totalDoctors:
                    Number(stats?.totalDoctors) || 0,

                totalAppointments:
                    Number(stats?.totalAppointments) || 0,

                activeAdmissions:
                    Number(stats?.activeAdmissions) || 0,
            },
        });
    } catch (error) {
        console.error(
            "DASHBOARD STATS ERROR:",
            error
        );

        const statusCode =
            Number(error?.statusCode) === 403
                ? 403
                : 500;

        return res.status(statusCode).json({
            success: false,
            message:
                statusCode === 403
                    ? error.message
                    : "Unable to load dashboard statistics",
        });
    }
};

// =====================================================
// RECENT APPOINTMENTS
// =====================================================

const getRecentAppointmentsController = async (
    req,
    res
) => {
    try {
        let limit = Number(req.query.limit);

        if (!Number.isInteger(limit) || limit < 1) {
            limit = 5;
        }

        if (limit > 20) {
            limit = 20;
        }

        const hospitalId = getHospitalScope(req);

        const appointments =
            await getRecentAppointments(
                limit,
                hospitalId
            );

        return res.status(200).json({
            success: true,

            scope: getScopeName(req),

            count: Array.isArray(appointments)
                ? appointments.length
                : 0,

            appointments:
                Array.isArray(appointments)
                    ? appointments
                    : [],
        });
    } catch (error) {
        console.error(
            "RECENT APPOINTMENTS ERROR:",
            error
        );

        const statusCode =
            Number(error?.statusCode) === 403
                ? 403
                : 500;

        return res.status(statusCode).json({
            success: false,
            message:
                statusCode === 403
                    ? error.message
                    : "Unable to load recent appointments",
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    getStats,
    getRecentAppointmentsController,
};