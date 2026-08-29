import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaUserCheck,
    FaCalendarCheck,
    FaBed,
    FaSignOutAlt,
    FaSyncAlt,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState({});

    // =====================================================
    // HOSPITAL NAME
    // =====================================================

    const [hospitalName, setHospitalName] =
        useState("HMS Hospital");

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

    /*
    =====================================================
    API URL
    =====================================================
    */

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    /*
    =====================================================
    LOAD USER + HOSPITAL SETTINGS
    =====================================================
    */

    useEffect(() => {
        try {
            // -----------------------------
            // LOAD USER
            // -----------------------------

            const savedUser =
                localStorage.getItem("hms_user");

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }

            // -----------------------------
            // LOAD HOSPITAL SETTINGS
            // -----------------------------

            const savedSettings =
                localStorage.getItem("hmsSettings");

            if (savedSettings) {
                const parsedSettings =
                    JSON.parse(savedSettings);

                if (
                    parsedSettings.hospitalName &&
                    String(
                        parsedSettings.hospitalName
                    ).trim()
                ) {
                    setHospitalName(
                        parsedSettings.hospitalName.trim()
                    );
                }
            }
        } catch (error) {
            console.error(
                "USER / SETTINGS PARSE ERROR:",
                error
            );
        }
    }, []);

    /*
    =====================================================
    UPDATE HOSPITAL NAME WHEN SETTINGS CHANGE
    =====================================================
    */

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key !== "hmsSettings") {
                return;
            }

            try {
                if (!event.newValue) {
                    setHospitalName("HMS Hospital");
                    return;
                }

                const parsedSettings =
                    JSON.parse(event.newValue);

                const newHospitalName =
                    parsedSettings?.hospitalName;

                if (
                    newHospitalName &&
                    String(
                        newHospitalName
                    ).trim()
                ) {
                    setHospitalName(
                        String(
                            newHospitalName
                        ).trim()
                    );
                } else {
                    setHospitalName("HMS Hospital");
                }
            } catch (error) {
                console.error(
                    "SETTINGS STORAGE ERROR:",
                    error
                );
            }
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, []);

    /*
    =====================================================
    CHECK SETTINGS WHEN WINDOW GETS FOCUS
    =====================================================
    */

    useEffect(() => {
        const handleWindowFocus = () => {
            try {
                const savedSettings =
                    localStorage.getItem("hmsSettings");

                if (!savedSettings) {
                    setHospitalName("HMS Hospital");
                    return;
                }

                const parsedSettings =
                    JSON.parse(savedSettings);

                const newHospitalName =
                    parsedSettings?.hospitalName;

                if (
                    newHospitalName &&
                    String(
                        newHospitalName
                    ).trim()
                ) {
                    setHospitalName(
                        String(
                            newHospitalName
                        ).trim()
                    );
                }
            } catch (error) {
                console.error(
                    "FOCUS SETTINGS ERROR:",
                    error
                );
            }
        };

        window.addEventListener(
            "focus",
            handleWindowFocus
        );

        return () => {
            window.removeEventListener(
                "focus",
                handleWindowFocus
            );
        };
    }, []);

    /*
    =====================================================
    AUTH HEADERS
    =====================================================
    */

    const getHeaders = () => {
        const token =
            localStorage.getItem("hms_token");

        if (!token) {
            throw new Error(
                "Login session expired. Please login again."
            );
        }

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    /*
    =====================================================
    SAFE JSON
    =====================================================
    */

    const getResponseData = async (response) => {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                success: false,
                message: text,
            };
        }
    };

    /*
    =====================================================
    AUTH ERROR
    =====================================================
    */

    const handleAuthError = (status) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem("hms_token");
            localStorage.removeItem("hms_user");

            navigate("/login", {
                replace: true,
            });

            return true;
        }

        return false;
    };

    /*
    =====================================================
    DASHBOARD STATS
    =====================================================
    */

    const fetchDashboardStats = async () => {
        try {
            setError("");

            const response = await fetch(
                `${API_URL}/dashboard/stats`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data =
                await getResponseData(response);

            if (
                handleAuthError(
                    response.status
                )
            ) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load dashboard statistics."
                );
            }

            if (
                !data.success ||
                !data.stats
            ) {
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
        } catch (error) {
            console.error(
                "DASHBOARD STATS ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to connect to HMS server."
            );
        }
    };

    /*
    =====================================================
    RECENT APPOINTMENTS
    =====================================================
    */

    const fetchRecentAppointments = async () => {
        try {
            setAppointmentsError("");

            const response = await fetch(
                `${API_URL}/dashboard/recent-appointments?limit=5`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data =
                await getResponseData(response);

            if (
                handleAuthError(
                    response.status
                )
            ) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load appointments."
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Invalid appointments response."
                );
            }

            setAppointments(
                Array.isArray(
                    data.appointments
                )
                    ? data.appointments
                    : []
            );
        } catch (error) {
            console.error(
                "APPOINTMENTS ERROR:",
                error
            );

            setAppointmentsError(
                error.message ||
                "Unable to load appointments."
            );

            setAppointments([]);
        }
    };

    /*
    =====================================================
    LOAD DASHBOARD
    =====================================================
    */

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setAppointmentsLoading(true);

            await Promise.all([
                fetchDashboardStats(),
                fetchRecentAppointments(),
            ]);
        } finally {
            setLoading(false);
            setAppointmentsLoading(false);
        }
    };

    /*
    =====================================================
    INITIAL LOAD
    =====================================================
    */

    useEffect(() => {
        loadDashboard();
    }, []);

    /*
    =====================================================
    REFRESH
    =====================================================
    */

    const handleRefresh = async () => {
        if (refreshing) {
            return;
        }

        try {
            setRefreshing(true);

            // Reload hospital name also
            try {
                const savedSettings =
                    localStorage.getItem("hmsSettings");

                if (savedSettings) {
                    const parsedSettings =
                        JSON.parse(savedSettings);

                    if (
                        parsedSettings?.hospitalName &&
                        String(
                            parsedSettings.hospitalName
                        ).trim()
                    ) {
                        setHospitalName(
                            String(
                                parsedSettings.hospitalName
                            ).trim()
                        );
                    }
                }
            } catch (settingsError) {
                console.error(
                    "REFRESH SETTINGS ERROR:",
                    settingsError
                );
            }

            await loadDashboard();
        } finally {
            setRefreshing(false);
        }
    };

    /*
    =====================================================
    LOGOUT
    =====================================================
    */

    const handleLogout = () => {
        localStorage.removeItem("hms_token");
        localStorage.removeItem("hms_user");

        navigate("/", {
            replace: true,
        });
    };

    /*
    =====================================================
    DATE HELPERS
    =====================================================
    */

    const normalizeDate = (date) => {
        if (!date) {
            return "";
        }

        const value =
            String(date).trim();

        if (!value) {
            return "";
        }

        const match =
            value.match(
                /^(\d{4}-\d{2}-\d{2})/
            );

        if (match) {
            return match[1];
        }

        return value;
    };

    /*
    =====================================================
    DATE FORMAT
    =====================================================
    */

    const formatDate = (date) => {
        const value =
            normalizeDate(date);

        if (!value) {
            return "--";
        }

        const parts =
            value.split("-");

        if (parts.length !== 3) {
            return value;
        }

        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]);

        const day =
            Number(parts[2]);

        if (
            !year ||
            !month ||
            !day
        ) {
            return value;
        }

        const dateObject =
            new Date(
                year,
                month - 1,
                day
            );

        if (
            Number.isNaN(
                dateObject.getTime()
            )
        ) {
            return value;
        }

        return dateObject.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    /*
    =====================================================
    TIME FORMAT
    =====================================================
    */

    const formatTime = (time) => {
        if (
            time === null ||
            time === undefined ||
            time === ""
        ) {
            return "--:--";
        }

        const value =
            String(time).trim();

        const match =
            value.match(
                /^(\d{1,2}):(\d{2})(?::(\d{2}))?/
            );

        if (!match) {
            return value;
        }

        let hours =
            Number(match[1]);

        const minutes =
            match[2];

        if (
            Number.isNaN(hours) ||
            hours < 0 ||
            hours > 23
        ) {
            return value;
        }

        const suffix =
            hours >= 12
                ? "PM"
                : "AM";

        hours =
            hours % 12 || 12;

        return `${hours}:${minutes} ${suffix}`;
    };

    /*
    =====================================================
    STATUS CLASS
    =====================================================
    */

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

            case "confirmed":
                return "confirmed";

            default:
                return "confirmed";
        }
    };

    /*
    =====================================================
    STATUS TEXT
    =====================================================
    */

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

            case "confirmed":
                return "Confirmed";

            default:
                return "Scheduled";
        }
    };

    /*
    =====================================================
    STAT CARDS
    =====================================================
    */

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

    /*
    =====================================================
    UI
    =====================================================
    */

    return (
        <main className="dashboard-page">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <header className="dashboard-topbar">

                <div className="topbar-left">

                    <div className="brand-section">

                        <h1>
                            {hospitalName} Dashboard
                        </h1>

                        <p className="subtitle">
                            Hospital Management System
                        </p>

                    </div>

                </div>

                <div className="topbar-right">

                    <button
                        type="button"
                        className={`btn-3d btn-refresh ${refreshing
                                ? "is-refreshing"
                                : ""
                            }`}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh"
                    >
                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "refresh-spinning"
                                    : ""
                            }
                        />
                    </button>

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
                            className="btn-3d btn-logout"
                            onClick={handleLogout}
                        >
                            <FaSignOutAlt />

                            <span>
                                Logout
                            </span>
                        </button>

                    </div>

                </div>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="dashboard-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        className="btn-3d btn-small"
                        onClick={loadDashboard}
                    >
                        Retry
                    </button>

                </div>
            )}


            {/* =================================================
                STATS
            ================================================= */}

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


            {/* =================================================
                CONTENT
            ================================================= */}

            <section className="dashboard-content">

                {/* APPOINTMENTS */}

                <div className="dashboard-panel appointments-panel">

                    <div className="panel-header">

                        <h2>
                            Recent Appointments
                        </h2>

                        <button
                            type="button"
                            className="btn-view-all"
                            onClick={() =>
                                navigate(
                                    "/appointments"
                                )
                            }
                        >
                            View All
                        </button>

                    </div>


                    {appointmentsError && (
                        <div className="appointments-error">

                            <FaExclamationTriangle />

                            <span>
                                {appointmentsError}
                            </span>

                            <button
                                type="button"
                                className="btn-3d btn-small"
                                onClick={
                                    fetchRecentAppointments
                                }
                            >
                                Retry
                            </button>

                        </div>
                    )}


                    {appointmentsLoading ? (

                        <div className="appointments-loading">

                            <FaSyncAlt className="refresh-spinning" />

                            <span>
                                Loading...
                            </span>

                        </div>

                    ) : appointments.length === 0 ? (

                        <div className="appointments-empty">

                            <FaCalendarCheck />

                            <strong>
                                No appointments found
                            </strong>

                            <span>
                                Recent appointments will appear here.
                            </span>

                        </div>

                    ) : (

                        <div className="appointment-list">

                            {appointments.map(
                                (appointment) => {

                                    const patientName =
                                        appointment.patient_name ||
                                        "Unknown Patient";

                                    const specialization =
                                        appointment.doctor_specialization ||
                                        appointment.specialization ||
                                        "General Medicine";

                                    return (

                                        <div
                                            className="appointment-row"
                                            key={
                                                appointment.id
                                            }
                                        >

                                            <div className="patient-avatar">

                                                {patientName
                                                    .charAt(0)
                                                    .toUpperCase()}

                                            </div>

                                            <div className="appointment-info">

                                                <strong>
                                                    {patientName}
                                                </strong>

                                                <span>
                                                    {specialization}
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


                {/* =================================================
                    HEART MODEL
                ================================================= */}

                <div className="dashboard-panel heart-panel">

                    <div className="panel-header">

                        <h2>
                            Heart Model
                        </h2>

                    </div>

                    <div className="heart-image-container">

                        <video
                            src="/video-from-rawpixel-id-26020147-sd.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Dashboard;