import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaUserCheck,
    FaCalendarCheck,
    FaBed,
    FaSignOutAlt,
    FaSyncAlt,
    FaUserPlus,
    FaFileMedical,
    FaUserMd,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    // =========================================
    // USER
    // =========================================

    const user =
        JSON.parse(localStorage.getItem("hms_user")) || {};

    // =========================================
    // API URL
    // =========================================

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =========================================
    // STATES
    // =========================================

    const [stats, setStats] = useState({
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        activeAdmissions: 0,
    });

    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [appointmentsLoading, setAppointmentsLoading] =
        useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [appointmentsError, setAppointmentsError] =
        useState("");

    // =========================================
    // COMMON HEADERS
    // =========================================

    const getHeaders = () => {
        const token =
            localStorage.getItem("hms_token");

        return {
            "Content-Type": "application/json",

            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
        };
    };

    // =========================================
    // FETCH DASHBOARD STATS
    // =========================================

    const fetchDashboardStats = async (
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/dashboard/stats`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load dashboard statistics."
                );
            }

            if (!data.success || !data.stats) {
                throw new Error(
                    "Invalid dashboard response."
                );
            }

            setStats({
                totalPatients:
                    Number(
                        data.stats.totalPatients
                    ) || 0,

                totalDoctors:
                    Number(
                        data.stats.totalDoctors
                    ) || 0,

                totalAppointments:
                    Number(
                        data.stats.totalAppointments
                    ) || 0,

                activeAdmissions:
                    Number(
                        data.stats.activeAdmissions
                    ) || 0,
            });

        } catch (err) {
            console.error(
                "Dashboard Stats Error:",
                err
            );

            setError(
                err.message ||
                "Unable to connect to HMS server."
            );

        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };

    // =========================================
    // FETCH RECENT APPOINTMENTS
    // =========================================

    const fetchRecentAppointments = async (
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setAppointmentsLoading(true);
            }

            setAppointmentsError("");

            const response = await fetch(
                `${API_URL}/dashboard/recent-appointments?limit=5`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load recent appointments."
                );
            }

            if (!data.success) {
                throw new Error(
                    "Invalid appointments response."
                );
            }

            setAppointments(
                Array.isArray(data.appointments)
                    ? data.appointments
                    : []
            );

        } catch (err) {
            console.error(
                "Recent Appointments Error:",
                err
            );

            setAppointmentsError(
                err.message ||
                "Unable to load recent appointments."
            );

            setAppointments([]);

        } finally {
            if (showLoader) {
                setAppointmentsLoading(false);
            }
        }
    };

    // =========================================
    // LOAD DASHBOARD
    // =========================================

    const loadDashboard = async (
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setLoading(true);
                setAppointmentsLoading(true);
            }

            setError("");
            setAppointmentsError("");

            await Promise.all([
                fetchDashboardStats(false),
                fetchRecentAppointments(false),
            ]);

        } finally {
            if (showLoader) {
                setLoading(false);
                setAppointmentsLoading(false);
            }
        }
    };

    // =========================================
    // INITIAL LOAD
    // =========================================

    useEffect(() => {
        loadDashboard(true);
    }, []);

    // =========================================
    // REFRESH
    // =========================================

    const handleRefresh = async () => {
        if (refreshing) {
            return;
        }

        try {
            setRefreshing(true);

            await loadDashboard(false);

        } catch (err) {
            console.error(
                "Dashboard Refresh Error:",
                err
            );
        } finally {
            setRefreshing(false);
        }
    };

    // =========================================
    // LOGOUT
    // =========================================

    const handleLogout = () => {
        localStorage.removeItem("hms_token");
        localStorage.removeItem("hms_user");

        navigate("/", {
            replace: true,
        });
    };

    // =========================================
    // NAVIGATION
    // =========================================

    const handleAddPatient = () => {
        navigate("/patients");
    };

    const handleAppointments = () => {
        navigate("/appointments");
    };

    const handleDoctors = () => {
        navigate("/doctors");
    };

    const handleReports = () => {
        navigate("/reports");
    };

    // =========================================
    // FORMAT TIME
    // =========================================

    const formatTime = (time) => {
        if (!time) {
            return "--:--";
        }

        const parts =
            String(time).split(":");

        if (parts.length < 2) {
            return time;
        }

        let hours =
            Number(parts[0]);

        const minutes =
            parts[1];

        const ampm =
            hours >= 12
                ? "PM"
                : "AM";

        hours =
            hours % 12;

        if (hours === 0) {
            hours = 12;
        }

        return `${hours}:${minutes} ${ampm}`;
    };

    // =========================================
    // STATUS CLASS
    // =========================================

    const getStatusClass = (status) => {
        switch (
        String(status).toLowerCase()
        ) {
            case "completed":
                return "completed";

            case "cancelled":
                return "cancelled";

            case "pending":
                return "pending";

            case "scheduled":
            default:
                return "confirmed";
        }
    };

    // =========================================
    // STATUS TEXT
    // =========================================

    const getStatusText = (status) => {
        switch (
        String(status).toLowerCase()
        ) {
            case "completed":
                return "Completed";

            case "cancelled":
                return "Cancelled";

            case "pending":
                return "Pending";

            case "scheduled":
            default:
                return "Scheduled";
        }
    };

    // =========================================
    // STAT CARDS
    // =========================================

    const statCards = [
        {
            title: "Total Patients",
            value: stats.totalPatients,
            icon: <FaUsers />,
        },
        {
            title: "Doctors",
            value: stats.totalDoctors,
            icon: <FaUserCheck />,
        },
        {
            title: "Appointments",
            value: stats.totalAppointments,
            icon: <FaCalendarCheck />,
        },
        {
            title: "Active Admissions",
            value: stats.activeAdmissions,
            icon: <FaBed />,
        },
    ];

    // =========================================
    // RENDER
    // =========================================

    return (
        <main className="dashboard-page">

            {/* =====================================
                HEADER
            ===================================== */}

            <header className="dashboard-header">

                <div className="dashboard-title">

                    <h1>
                        HMS Dashboard
                    </h1>

                    <p>
                        Hospital Management System
                    </p>

                </div>

                <div className="dashboard-user">

                    <div className="user-avatar">
                        {user.name
                            ? user.name
                                .charAt(0)
                                .toUpperCase()
                            : "A"}
                    </div>

                    <div className="user-info">

                        <strong>
                            {user.name ||
                                "HMS Admin"}
                        </strong>

                        <span>
                            {user.role ||
                                "Administrator"}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FaSignOutAlt />

                        <span>
                            Logout
                        </span>
                    </button>

                </div>

            </header>


            {/* =====================================
                WELCOME CARD
            ===================================== */}

            <section className="welcome-card">

                <div className="welcome-content">

                    <h2>
                        Welcome to HMS 👋
                    </h2>

                    <p>
                        Manage patients, doctors,
                        appointments and hospital
                        activities from one place.
                    </p>

                </div>

                <button
                    type="button"
                    className={`refresh-button ${refreshing
                        ? "is-refreshing"
                        : ""
                        }`}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title={
                        refreshing
                            ? "Refreshing..."
                            : "Refresh dashboard"
                    }
                    aria-label={
                        refreshing
                            ? "Refreshing dashboard"
                            : "Refresh dashboard"
                    }
                >
                    <FaSyncAlt
                        className={
                            refreshing
                                ? "refresh-spinning"
                                : "refresh-icon"
                        }
                    />
                </button>

            </section>


            {/* =====================================
                ERROR
            ===================================== */}

            {error && (
                <div className="dashboard-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboard(true)
                        }
                    >
                        Retry
                    </button>

                </div>
            )}


            {/* =====================================
                STATISTICS
            ===================================== */}

            <section className="stats-grid">

                {statCards.map((stat) => (
                    <div
                        className="stat-card"
                        key={stat.title}
                    >

                        <div className="stat-icon">
                            {stat.icon}
                        </div>

                        <div className="stat-content">

                            <span>
                                {stat.title}
                            </span>

                            {loading ? (
                                <div className="stat-loading">
                                    Loading...
                                </div>
                            ) : (
                                <h3>
                                    {stat.value.toLocaleString()}
                                </h3>
                            )}

                        </div>

                    </div>
                ))}

            </section>


            {/* =====================================
                DASHBOARD CONTENT
            ===================================== */}

            <section className="dashboard-content">

                {/* =================================
                    RECENT APPOINTMENTS
                ================================= */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <h2>
                            Recent Appointments
                        </h2>

                        <button
                            type="button"
                            onClick={
                                handleAppointments
                            }
                        >
                            View All
                        </button>

                    </div>


                    {/* APPOINTMENTS ERROR */}

                    {appointmentsError && (
                        <div className="appointments-error">

                            <FaExclamationTriangle />

                            <span>
                                {appointmentsError}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    fetchRecentAppointments(
                                        true
                                    )
                                }
                            >
                                Retry
                            </button>

                        </div>
                    )}


                    {/* LOADING */}

                    {appointmentsLoading ? (

                        <div className="appointments-loading">

                            <FaSyncAlt
                                className="refresh-spinning"
                            />

                            <span>
                                Loading recent
                                appointments...
                            </span>

                        </div>

                    ) : appointments.length === 0 ? (

                        /* EMPTY */

                        <div className="appointments-empty">

                            <FaCalendarCheck />

                            <strong>
                                No appointments found
                            </strong>

                            <span>
                                Recent appointments
                                will appear here.
                            </span>

                        </div>

                    ) : (

                        /* APPOINTMENT LIST */

                        <div className="appointment-list">

                            {appointments.map(
                                (appointment) => {

                                    const patientName =
                                        appointment.patient_name ||
                                        "Unknown Patient";

                                    const specialization =
                                        appointment.doctor_specialization ||
                                        "General Medicine";

                                    const firstLetter =
                                        patientName
                                            .charAt(0)
                                            .toUpperCase();

                                    return (
                                        <div
                                            className="appointment-row"
                                            key={
                                                appointment.id
                                            }
                                        >

                                            <div className="patient-avatar">
                                                {firstLetter}
                                            </div>


                                            <div className="appointment-info">

                                                <strong>
                                                    {
                                                        patientName
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        specialization
                                                    }
                                                </span>

                                            </div>


                                            <div className="appointment-time">

                                                {formatTime(
                                                    appointment.appointment_time
                                                )}

                                            </div>


                                            <span
                                                className={`status ${getStatusClass(
                                                    appointment.status
                                                )}`}
                                            >
                                                {getStatusText(
                                                    appointment.status
                                                )}
                                            </span>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>


                {/* =================================
                    QUICK ACTIONS
                ================================= */}

                <div className="dashboard-panel quick-panel">

                    <h2>
                        Quick Actions
                    </h2>

                    <button
                        type="button"
                        className="quick-button"
                        onClick={
                            handleAddPatient
                        }
                    >
                        <FaUserPlus />

                        <span>
                            Add Patient
                        </span>

                    </button>


                    <button
                        type="button"
                        className="quick-button"
                        onClick={
                            handleAppointments
                        }
                    >
                        <FaCalendarCheck />

                        <span>
                            New Appointment
                        </span>

                    </button>


                    <button
                        type="button"
                        className="quick-button"
                        onClick={
                            handleDoctors
                        }
                    >
                        <FaUserMd />

                        <span>
                            Add Doctor
                        </span>

                    </button>


                    <button
                        type="button"
                        className="quick-button"
                        onClick={
                            handleReports
                        }
                    >
                        <FaFileMedical />

                        <span>
                            View Reports
                        </span>

                    </button>

                </div>

            </section>

        </main>
    );
}

export default Dashboard;