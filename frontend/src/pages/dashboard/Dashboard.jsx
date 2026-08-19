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
    const user = JSON.parse(localStorage.getItem("hms_user")) || {};
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const [stats, setStats] = useState({
        totalPatients: 0, totalDoctors: 0, totalAppointments: 0, activeAdmissions: 0,
    });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [appointmentsError, setAppointmentsError] = useState("");

    const getHeaders = () => {
        const token = localStorage.getItem("hms_token");
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    };

    const fetchDashboardStats = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            setError("");
            const response = await fetch(`${API_URL}/dashboard/stats`, {
                method: "GET", headers: getHeaders(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load dashboard statistics.");
            if (!data.success || !data.stats) throw new Error("Invalid dashboard response.");
            setStats({
                totalPatients: Number(data.stats.totalPatients) || 0,
                totalDoctors: Number(data.stats.totalDoctors) || 0,
                totalAppointments: Number(data.stats.totalAppointments) || 0,
                activeAdmissions: Number(data.stats.activeAdmissions) || 0,
            });
        } catch (err) {
            console.error("Dashboard Stats Error:", err);
            setError(err.message || "Unable to connect to HMS server.");
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    const fetchRecentAppointments = async (showLoader = true) => {
        try {
            if (showLoader) setAppointmentsLoading(true);
            setAppointmentsError("");
            const response = await fetch(`${API_URL}/dashboard/recent-appointments?limit=5`, {
                method: "GET", headers: getHeaders(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load recent appointments.");
            if (!data.success) throw new Error("Invalid appointments response.");
            setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
        } catch (err) {
            console.error("Recent Appointments Error:", err);
            setAppointmentsError(err.message || "Unable to load recent appointments.");
            setAppointments([]);
        } finally {
            if (showLoader) setAppointmentsLoading(false);
        }
    };

    const loadDashboard = async (showLoader = true) => {
        try {
            if (showLoader) { setLoading(true); setAppointmentsLoading(true); }
            setError(""); setAppointmentsError("");
            await Promise.all([fetchDashboardStats(false), fetchRecentAppointments(false)]);
        } finally {
            if (showLoader) { setLoading(false); setAppointmentsLoading(false); }
        }
    };

    useEffect(() => { loadDashboard(true); }, []);

    const handleRefresh = async () => {
        if (refreshing) return;
        try { setRefreshing(true); await loadDashboard(false); }
        finally { setRefreshing(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("hms_token"); localStorage.removeItem("hms_user");
        navigate("/", { replace: true });
    };

    const handleAppointments = () => { navigate("/appointments"); };
    const formatTime = (time) => {
        if (!time) return "--:--";
        const parts = String(time).split(":");
        if (parts.length < 2) return time;
        let hours = Number(parts[0]); const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12; if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${ampm}`;
    };
    const getStatusClass = (status) => {
        switch (String(status).toLowerCase()) {
            case "completed": return "completed"; case "cancelled": return "cancelled";
            case "pending": return "pending"; case "scheduled": default: return "confirmed";
        }
    };
    const getStatusText = (status) => {
        switch (String(status).toLowerCase()) {
            case "completed": return "Completed"; case "cancelled": return "Cancelled";
            case "pending": return "Pending"; case "scheduled": default: return "Scheduled";
        }
    };

    const statCards = [
        { title: "Total Patients", value: stats.totalPatients, icon: <FaUsers /> },
        { title: "Doctors", value: stats.totalDoctors, icon: <FaUserCheck /> },
        { title: "Appointments", value: stats.totalAppointments, icon: <FaCalendarCheck /> },
        { title: "Active Admissions", value: stats.activeAdmissions, icon: <FaBed /> },
    ];

    return (
        <main className="dashboard-page">
            {/* Top Header */}
            <header className="dashboard-topbar">
                <div className="topbar-left">
                    <div className="brand-section">
                        <h1>HMS Dashboard</h1>
                        <p className="subtitle">Hospital Management System</p>
                    </div>
                </div>

                <div className="topbar-right">
                    {/* 3D Refresh Button */}
                    <button
                        type="button"
                        className={`btn-3d btn-refresh ${refreshing ? "is-refreshing" : ""}`}
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <FaSyncAlt className={refreshing ? "refresh-spinning" : ""} />
                    </button>

                    {/* User & 3D Logout Button */}
                    <div className="dashboard-user">
                        <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "A"}</div>
                        <div className="user-info">
                            <strong>{user.name || "HMS Admin"}</strong>
                            <span>{user.role || "Administrator"}</span>
                        </div>
                        <button type="button" className="btn-3d btn-logout" onClick={handleLogout}>
                            <FaSignOutAlt /> <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="dashboard-error">
                    <FaExclamationTriangle /> <span>{error}</span>
                    <button type="button" className="btn-3d btn-small" onClick={() => loadDashboard(true)}>Retry</button>
                </div>
            )}

            {/* Stats Grid */}
            <section className="stats-grid">
                {statCards.map((stat) => (
                    <div className="stat-card" key={stat.title}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <span>{stat.title}</span>
                            {loading ? (
                                <div className="stat-loading">Loading...</div>
                            ) : (
                                <h3>{stat.value.toLocaleString()}</h3>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            {/* Panels */}
            <section className="dashboard-content">
                <div className="dashboard-panel appointments-panel">
                    <div className="panel-header">
                        <h2>Recent Appointments</h2>
                        {/* ★ FIX: केवल btn-view-all (3D नहीं) */}
                        <button type="button" className="btn-view-all" onClick={handleAppointments}>View All</button>
                    </div>

                    {appointmentsError && (
                        <div className="appointments-error">
                            <FaExclamationTriangle /> <span>{appointmentsError}</span>
                            <button type="button" className="btn-3d btn-small" onClick={() => fetchRecentAppointments(true)}>Retry</button>
                        </div>
                    )}

                    {appointmentsLoading ? (
                        <div className="appointments-loading">
                            <FaSyncAlt className="refresh-spinning" />
                            <span>Loading recent appointments...</span>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="appointments-empty">
                            <FaCalendarCheck />
                            <strong>No appointments found</strong>
                            <span>Recent appointments will appear here.</span>
                        </div>
                    ) : (
                        <div className="appointment-list">
                            {appointments.map((appointment) => {
                                const patientName = appointment.patient_name || "Unknown Patient";
                                const specialization = appointment.doctor_specialization || "General Medicine";
                                const firstLetter = patientName.charAt(0).toUpperCase();
                                return (
                                    <div className="appointment-row" key={appointment.id}>
                                        <div className="patient-avatar">{firstLetter}</div>
                                        <div className="appointment-info">
                                            <strong>{patientName}</strong>
                                            <span>{specialization}</span>
                                        </div>
                                        <div className="appointment-time">
                                            {formatTime(appointment.appointment_time)}
                                        </div>
                                        <span className={`status ${getStatusClass(appointment.status)}`}>
                                            {getStatusText(appointment.status)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Heart Panel */}
                <div className="dashboard-panel heart-panel">
                    <div className="panel-header">
                        <h2>Heart Model</h2>
                    </div>
                    <div className="heart-image-container">
                        <video
                            src="/video-from-rawpixel-id-26020147-sd.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            onError={(e) => {
                                e.target.style.display = 'none';
                                document.getElementById('heart-panel-fallback').style.display = 'block';
                            }}
                        />
                        <img
                            id="heart-panel-fallback"
                            src="https://images.unsplash.com/photo-1621592479167-0f3db9cb59dd?q=80&w=800&auto=format&fit=crop"
                            alt="Backup 3D Heart"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Dashboard;