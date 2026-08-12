const {
    getDashboardStats,
    getRecentAppointments,
} = require("../models/dashboard.model");

// =====================================================
// GET DASHBOARD STATS
// =====================================================

const getStats = async (req, res) => {
    try {
        const stats = await getDashboardStats();

        return res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error(
            "Dashboard Stats Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load dashboard statistics",
        });
    }
};

// =====================================================
// GET RECENT APPOINTMENTS
// =====================================================

const getRecentAppointmentsController = async (
    req,
    res
) => {
    try {
        const limit = req.query.limit || 5;

        const appointments =
            await getRecentAppointments(limit);

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        console.error(
            "Recent Appointments Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load recent appointments",
        });
    }
};

module.exports = {
    getStats,
    getRecentAppointmentsController,
};