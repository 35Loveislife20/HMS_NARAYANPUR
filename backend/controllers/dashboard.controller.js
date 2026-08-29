const {
    getDashboardStats,
    getRecentAppointments,
} = require("../models/dashboard.model");

// =====================================================
// DASHBOARD STATS
// =====================================================

const getStats = async (req, res) => {
    try {

        const stats =
            await getDashboardStats();

        return res.status(200).json({
            success: true,

            stats: {
                totalPatients:
                    Number(stats.totalPatients) || 0,

                totalDoctors:
                    Number(stats.totalDoctors) || 0,

                totalAppointments:
                    Number(stats.totalAppointments) || 0,

                activeAdmissions:
                    Number(stats.activeAdmissions) || 0,
            },
        });

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "DASHBOARD STATS ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "SQL State:",
            error.sqlState
        );

        console.error(
            "================================="
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load dashboard statistics",
            error: error.message,
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

        let limit =
            Number(req.query.limit) || 5;

        if (limit < 1) {
            limit = 5;
        }

        if (limit > 20) {
            limit = 20;
        }

        const appointments =
            await getRecentAppointments(limit);

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "RECENT APPOINTMENTS ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "SQL State:",
            error.sqlState
        );

        console.error(
            "================================="
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load recent appointments",
            error: error.message,
        });
    }
};

module.exports = {
    getStats,
    getRecentAppointmentsController,
};