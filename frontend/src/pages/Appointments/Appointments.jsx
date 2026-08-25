import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaCalendarAlt,
    FaPlus,
    FaSyncAlt,
    FaTrash,
    FaTimes,
    FaArrowLeft,
    FaExclamationTriangle,
    FaUserInjured,
    FaUserMd,
    FaClock,
    FaNotesMedical,
} from "react-icons/fa";

import "./Appointments.css";

function Appointments() {
    const navigate = useNavigate();

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATES
    // =====================================================

    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // =====================================================
    // EMPTY FORM
    // =====================================================

    const emptyForm = {
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
        status: "pending",
    };

    const [formData, setFormData] = useState(emptyForm);

    // =====================================================
    // HEADERS
    // =====================================================

    const getHeaders = () => {
        const token = localStorage.getItem("hms_token");

        return {
            "Content-Type": "application/json",
            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
        };
    };

    // =====================================================
    // FETCH APPOINTMENTS
    // =====================================================

    const fetchAppointments = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/appointments`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load appointments"
                );
            }

            if (
                !data.success ||
                !Array.isArray(data.appointments)
            ) {
                throw new Error("Invalid appointments response");
            }

            setAppointments([...data.appointments]);

        } catch (err) {
            console.error(
                "Fetch Appointments Error:",
                err
            );

            setError(
                err.message ||
                "Unable to connect to HMS server."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // FETCH PATIENTS
    // =====================================================

    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);

            const response = await fetch(
                `${API_URL}/patients`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load patients"
                );
            }

            if (
                !data.success ||
                !Array.isArray(data.patients)
            ) {
                throw new Error(
                    "Invalid patients response"
                );
            }

            setPatients([...data.patients]);

        } catch (err) {
            console.error(
                "Fetch Patients Error:",
                err
            );
        } finally {
            setLoadingPatients(false);
        }
    };

    // =====================================================
    // FETCH DOCTORS
    // =====================================================

    const fetchDoctors = async () => {
        try {
            setLoadingDoctors(true);

            const response = await fetch(
                `${API_URL}/doctors`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load doctors"
                );
            }

            if (
                !data.success ||
                !Array.isArray(data.doctors)
            ) {
                throw new Error(
                    "Invalid doctors response"
                );
            }

            setDoctors([...data.doctors]);

        } catch (err) {
            console.error(
                "Fetch Doctors Error:",
                err
            );
        } finally {
            setLoadingDoctors(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchAppointments(false);
        fetchPatients();
        fetchDoctors();
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        if (loading || refreshing) return;

        await Promise.all([
            fetchAppointments(true),
            fetchPatients(),
            fetchDoctors(),
        ]);
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // OPEN MODAL
    // =====================================================

    const openAddModal = () => {
        setFormData({
            ...emptyForm,
        });

        setError("");
        setShowModal(true);

        fetchPatients();
        fetchDoctors();
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setFormData({
            ...emptyForm,
        });
    };

    // =====================================================
    // ESCAPE
    // =====================================================

    useEffect(() => {
        const handleEscape = (e) => {
            if (
                e.key === "Escape" &&
                showModal
            ) {
                closeModal();
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [showModal, saving]);

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patient_id) {
            setError("Please select a patient.");
            return;
        }

        if (!formData.doctor_id) {
            setError("Please select a doctor.");
            return;
        }

        if (!formData.appointment_date) {
            setError(
                "Please select appointment date."
            );
            return;
        }

        if (!formData.appointment_time) {
            setError(
                "Please select appointment time."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/appointments`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        patient_id:
                            Number(
                                formData.patient_id
                            ),
                        doctor_id:
                            Number(
                                formData.doctor_id
                            ),
                        appointment_date:
                            formData.appointment_date,
                        appointment_time:
                            formData.appointment_time,
                        reason:
                            formData.reason.trim() ||
                            null,
                        status:
                            formData.status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create appointment"
                );
            }

            await fetchAppointments(true);

            setShowModal(false);

            setFormData({
                ...emptyForm,
            });

        } catch (err) {
            console.error(
                "Create Appointment Error:",
                err
            );

            setError(
                err.message ||
                "Unable to create appointment."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (id) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this appointment?"
            );

        if (!confirmDelete) return;

        try {
            setDeletingId(id);
            setError("");

            const response = await fetch(
                `${API_URL}/appointments/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete appointment"
                );
            }

            setAppointments((prev) =>
                prev.filter(
                    (appointment) =>
                        appointment.id !== id
                )
            );

            await fetchAppointments(true);

        } catch (err) {
            console.error(
                "Delete Appointment Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete appointment."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const getPatientName = (appointment) => {
        if (appointment.patient_name) {
            return appointment.patient_name;
        }

        const patient = patients.find(
            (p) =>
                Number(p.id) ===
                Number(appointment.patient_id)
        );

        return patient?.name || "Unknown Patient";
    };

    const getDoctorName = (appointment) => {
        if (appointment.doctor_name) {
            return appointment.doctor_name;
        }

        const doctor = doctors.find(
            (d) =>
                Number(d.id) ===
                Number(appointment.doctor_id)
        );

        return doctor?.name ||
            `Dr. ${appointment.doctor_id}`;
    };

    const getDoctorSpecialization = (
        appointment
    ) => {
        if (appointment.specialization) {
            return appointment.specialization;
        }

        const doctor = doctors.find(
            (d) =>
                Number(d.id) ===
                Number(appointment.doctor_id)
        );

        return doctor?.specialization ||
            "Doctor";
    };

    const getPatientCode = (appointment) => {
        if (appointment.patient_code) {
            return appointment.patient_code;
        }

        const patient = patients.find(
            (p) =>
                Number(p.id) ===
                Number(appointment.patient_id)
        );

        return (
            patient?.patient_code ||
            `PAT-${appointment.patient_id}`
        );
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "-";
        }

        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatTime = (time) => {
        if (!time) return "-";

        const parts =
            String(time).split(":");

        if (parts.length < 2) {
            return time;
        }

        let hours =
            Number(parts[0]);

        const minutes = parts[1];

        const suffix =
            hours >= 12 ? "PM" : "AM";

        hours =
            hours % 12 || 12;

        return `${hours}:${minutes} ${suffix}`;
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalAppointments =
        appointments.length;

    const pendingAppointments =
        appointments.filter(
            (a) =>
                String(a.status)
                    .toLowerCase() ===
                "pending"
        ).length;

    const completedAppointments =
        appointments.filter(
            (a) =>
                String(a.status)
                    .toLowerCase() ===
                "completed"
        ).length;

    const cancelledAppointments =
        appointments.filter(
            (a) =>
                String(a.status)
                    .toLowerCase() ===
                "cancelled"
        ).length;

    // =====================================================
    // SEARCH + SORT
    // =====================================================

    const filteredAppointments =
        useMemo(() => {
            const value =
                search
                    .toLowerCase()
                    .trim();

            let result = [...appointments];

            if (value) {
                result =
                    result.filter(
                        (appointment) => {
                            const patientName =
                                getPatientName(
                                    appointment
                                );

                            const doctorName =
                                getDoctorName(
                                    appointment
                                );

                            const patientCode =
                                getPatientCode(
                                    appointment
                                );

                            const reason =
                                appointment.reason ||
                                "";

                            const status =
                                appointment.status ||
                                "";

                            return (
                                patientName
                                    .toLowerCase()
                                    .includes(value) ||
                                doctorName
                                    .toLowerCase()
                                    .includes(value) ||
                                patientCode
                                    .toLowerCase()
                                    .includes(value) ||
                                reason
                                    .toLowerCase()
                                    .includes(value) ||
                                status
                                    .toLowerCase()
                                    .includes(value)
                            );
                        }
                    );
            }

            return result.sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            `${a.appointment_date}T${a.appointment_time ||
                            "00:00"
                            }`
                        );

                    const dateB =
                        new Date(
                            `${b.appointment_date}T${b.appointment_time ||
                            "00:00"
                            }`
                        );

                    return dateA - dateB;
                }
            );
        }, [
            appointments,
            search,
            patients,
            doctors,
        ]);

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {
        const normalized =
            String(
                status || "pending"
            ).toLowerCase();

        return `appointment-status ${normalized}`;
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="appointments-page">

            {/* HEADER */}
            <header className="appointments-header">

                <div className="appointments-header-left">

                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1>Appointments</h1>
                        <p>
                            Manage hospital appointments
                            and schedules
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="add-appointment-button"
                    onClick={openAddModal}
                >
                    <FaPlus />
                    <span>
                        Add Appointment
                    </span>
                </button>

            </header>

            {/* ERROR */}
            {error && (
                <div className="appointments-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        Retry
                    </button>

                    <button
                        type="button"
                        className="error-close"
                        onClick={() =>
                            setError("")
                        }
                        aria-label="Close error"
                    >
                        <FaTimes />
                    </button>

                </div>
            )}

            {/* STATISTICS */}
            <section className="appointment-stats">

                <div className="appointment-stat-card">
                    <div className="appointment-stat-icon">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span>
                            Total Appointments
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalAppointments}
                        </strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="appointment-stat-icon">
                        <FaClock />
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : pendingAppointments}
                        </strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="appointment-stat-icon">
                        <FaNotesMedical />
                    </div>

                    <div>
                        <span>
                            Completed
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : completedAppointments}
                        </strong>
                    </div>
                </div>

                <div className="appointment-stat-card">
                    <div className="appointment-stat-icon">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span>
                            Cancelled
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : cancelledAppointments}
                        </strong>
                    </div>
                </div>

            </section>

            {/* APPOINTMENT PANEL */}
            <section className="appointments-panel">

                <div className="appointments-toolbar">

                    <div>
                        <h2>
                            Appointment List
                        </h2>

                        <span>
                            {loading
                                ? "Loading appointments..."
                                : `${filteredAppointments.length} appointments found`}
                        </span>
                    </div>

                    <div className="appointment-toolbar-actions">

                        <div className="appointment-search">

                            <FaCalendarAlt />

                            <input
                                type="text"
                                placeholder="Search appointment..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <button
                            type="button"
                            className={`appointment-refresh-button ${refreshing
                                    ? "is-refreshing"
                                    : ""
                                }`}
                            onClick={handleRefresh}
                            disabled={
                                loading ||
                                refreshing
                            }
                            title="Refresh appointments"
                        >

                            <FaSyncAlt
                                className={
                                    refreshing
                                        ? "refresh-spinning"
                                        : ""
                                }
                            />

                            <span>
                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </span>

                        </button>

                    </div>

                </div>

                {/* LOADING */}
                {loading ? (

                    <div className="appointments-loading">

                        <FaSyncAlt className="refresh-spinning" />

                        <p>
                            Loading appointments...
                        </p>

                    </div>

                ) : (

                    <div className="appointments-table-wrapper">

                        <table className="appointments-table">

                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredAppointments.length >
                                    0 ? (

                                    filteredAppointments.map(
                                        (appointment) => (

                                            <tr
                                                key={
                                                    appointment.id
                                                }
                                            >

                                                {/* PATIENT */}
                                                <td>

                                                    <div className="appointment-patient-name">

                                                        <div className="appointment-patient-avatar">

                                                            {getPatientName(
                                                                appointment
                                                            )
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                .toUpperCase() ||
                                                                "P"}

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {getPatientName(
                                                                    appointment
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {getPatientCode(
                                                                    appointment
                                                                )}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* DOCTOR */}
                                                <td>

                                                    <div className="appointment-doctor-name">

                                                        <strong>
                                                            {getDoctorName(
                                                                appointment
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {getDoctorSpecialization(
                                                                appointment
                                                            )}
                                                        </span>

                                                    </div>

                                                </td>

                                                {/* DATE */}
                                                <td>

                                                    <div className="appointment-date-cell">

                                                        <FaCalendarAlt />

                                                        {formatDate(
                                                            appointment.appointment_date
                                                        )}

                                                    </div>

                                                </td>

                                                {/* TIME */}
                                                <td>

                                                    <div className="appointment-time-cell">

                                                        <FaClock />

                                                        {formatTime(
                                                            appointment.appointment_time
                                                        )}

                                                    </div>

                                                </td>

                                                {/* REASON */}
                                                <td>

                                                    <span className="appointment-reason">

                                                        {appointment.reason ||
                                                            "-"}

                                                    </span>

                                                </td>

                                                {/* STATUS */}
                                                <td>

                                                    <span
                                                        className={getStatusClass(
                                                            appointment.status
                                                        )}
                                                    >
                                                        {appointment.status ||
                                                            "pending"}
                                                    </span>

                                                </td>

                                                {/* ACTION */}
                                                <td>

                                                    <div className="appointment-actions">

                                                        <button
                                                            type="button"
                                                            className="delete-appointment-action"
                                                            title="Delete Appointment"
                                                            disabled={
                                                                deletingId ===
                                                                appointment.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    appointment.id
                                                                )
                                                            }
                                                        >

                                                            {deletingId ===
                                                                appointment.id ? (
                                                                <FaSyncAlt className="refresh-spinning" />
                                                            ) : (
                                                                <FaTrash />
                                                            )}

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="empty-appointments"
                                        >
                                            {search
                                                ? "No appointments match your search."
                                                : "No appointments found."}
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* MODAL */}
            {showModal && (

                <div
                    className="appointment-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="appointment-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="appointment-modal-close"
                            onClick={closeModal}
                            disabled={saving}
                            title="Close"
                        >
                            <FaTimes />
                        </button>

                        <div className="appointment-modal-icon">
                            <FaCalendarAlt />
                        </div>

                        <h2>
                            Add New Appointment
                        </h2>

                        <p>
                            Select patient, doctor and
                            appointment schedule
                        </p>

                        {error && (
                            <div className="appointment-form-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>
                        )}

                        <form
                            className="appointment-form"
                            onSubmit={handleSubmit}
                        >

                            {/* PATIENT */}
                            <div className="form-group">

                                <label htmlFor="patient_id">
                                    <FaUserInjured />
                                    Patient
                                    <span className="required">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="patient_id"
                                    name="patient_id"
                                    value={
                                        formData.patient_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        saving ||
                                        loadingPatients
                                    }
                                >

                                    <option value="">
                                        {loadingPatients
                                            ? "Loading..."
                                            : "Select Patient"}
                                    </option>

                                    {patients.map(
                                        (patient) => (

                                            <option
                                                key={
                                                    patient.id
                                                }
                                                value={
                                                    patient.id
                                                }
                                            >
                                                {patient.name} —{" "}
                                                {patient.patient_code ||
                                                    `PAT-${patient.id}`}
                                            </option>

                                        )
                                    )}

                                </select>

                                {!loadingPatients &&
                                    patients.length ===
                                    0 && (
                                        <small>
                                            No patients
                                            available.
                                        </small>
                                    )}

                            </div>

                            {/* DOCTOR */}
                            <div className="form-group">

                                <label htmlFor="doctor_id">
                                    <FaUserMd />
                                    Doctor
                                    <span className="required">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="doctor_id"
                                    name="doctor_id"
                                    value={
                                        formData.doctor_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        saving ||
                                        loadingDoctors
                                    }
                                >

                                    <option value="">
                                        {loadingDoctors
                                            ? "Loading..."
                                            : "Select Doctor"}
                                    </option>

                                    {doctors.map(
                                        (doctor) => (

                                            <option
                                                key={
                                                    doctor.id
                                                }
                                                value={
                                                    doctor.id
                                                }
                                            >
                                                {doctor.name ||
                                                    `Dr. ${doctor.doctor_code}`}{" "}
                                                —{" "}
                                                {doctor.specialization ||
                                                    "General"}
                                            </option>

                                        )
                                    )}

                                </select>

                                {!loadingDoctors &&
                                    doctors.length ===
                                    0 && (
                                        <small>
                                            No doctors
                                            available.
                                        </small>
                                    )}

                            </div>

                            {/* DATE + TIME */}
                            <div className="form-row">

                                <div className="form-group">

                                    <label htmlFor="appointment_date">
                                        <FaCalendarAlt />
                                        Appointment Date
                                        <span className="required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="appointment_date"
                                        type="date"
                                        name="appointment_date"
                                        value={
                                            formData.appointment_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={saving}
                                    />

                                </div>

                                <div className="form-group">

                                    <label htmlFor="appointment_time">
                                        <FaClock />
                                        Appointment Time
                                        <span className="required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        id="appointment_time"
                                        type="time"
                                        name="appointment_time"
                                        value={
                                            formData.appointment_time
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={saving}
                                    />

                                </div>

                            </div>

                            {/* REASON */}
                            <div className="form-group">

                                <label htmlFor="reason">
                                    <FaNotesMedical />
                                    Reason
                                </label>

                                <textarea
                                    id="reason"
                                    name="reason"
                                    placeholder="Enter appointment reason"
                                    value={
                                        formData.reason
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="3"
                                    disabled={saving}
                                />

                            </div>

                            {/* STATUS */}
                            <div className="form-group">

                                <label htmlFor="status">
                                    <FaNotesMedical />
                                    Status
                                </label>

                                <select
                                    id="status"
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={saving}
                                >

                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="confirmed">
                                        Confirmed
                                    </option>

                                    <option value="completed">
                                        Completed
                                    </option>

                                    <option value="cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                            {/* ACTIONS */}
                            <div className="appointment-form-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-appointment-button"
                                    disabled={
                                        saving ||
                                        loadingPatients ||
                                        loadingDoctors ||
                                        patients.length ===
                                        0 ||
                                        doctors.length ===
                                        0
                                    }
                                >

                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="refresh-spinning" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            Add Appointment
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </main>
    );
}

export default Appointments;