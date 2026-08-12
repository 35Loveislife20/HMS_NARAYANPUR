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

    // =====================================================
    // API
    // =====================================================

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATES
    // =====================================================

    const [appointments, setAppointments] = useState([]);

    const [patients, setPatients] = useState([]);

    const [doctors, setDoctors] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [loadingPatients, setLoadingPatients] =
        useState(false);

    const [loadingDoctors, setLoadingDoctors] =
        useState(false);

    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    // =====================================================
    // FORM
    // =====================================================

    const emptyForm = {
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
        status: "scheduled",
        notes: "",
    };

    const [formData, setFormData] =
        useState(emptyForm);

    // =====================================================
    // AUTH HEADER
    // =====================================================

    const getHeaders = () => {
        const token =
            localStorage.getItem("hms_token");

        return {
            "Content-Type": "application/json",

            ...(token && {
                Authorization:
                    `Bearer ${token}`,
            }),
        };
    };

    // =====================================================
    // FETCH APPOINTMENTS
    // =====================================================

    const fetchAppointments = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response =
                await fetch(
                    `${API_URL}/appointments`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                        cache: "no-store",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load appointments"
                );
            }

            if (
                !data.success ||
                !Array.isArray(
                    data.appointments
                )
            ) {
                throw new Error(
                    "Invalid appointments response"
                );
            }

            setAppointments(
                [...data.appointments]
            );

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

            const response =
                await fetch(
                    `${API_URL}/patients`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                        cache: "no-store",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load patients"
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

            setPatients(
                [...data.patients]
            );

        } catch (err) {
            console.error(
                "Fetch Patients Error:",
                err
            );

            setError(
                err.message ||
                "Unable to load patients."
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

            const response =
                await fetch(
                    `${API_URL}/doctors`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                        cache: "no-store",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load doctors"
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

            setDoctors(
                [...data.doctors]
            );

        } catch (err) {
            console.error(
                "Fetch Doctors Error:",
                err
            );

            setError(
                err.message ||
                "Unable to load doctors."
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
        if (
            loading ||
            refreshing
        ) {
            return;
        }

        await Promise.all([
            fetchAppointments(true),
            fetchPatients(),
            fetchDoctors(),
        ]);
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        setFormData({
            ...emptyForm,
        });

        setError("");

        setShowModal(true);

        // Make sure dropdown data is fresh
        fetchPatients();
        fetchDoctors();
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setFormData({
            ...emptyForm,
        });
    };

    // =====================================================
    // ESC CLOSE
    // =====================================================

    useEffect(() => {
        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
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
    // SUBMIT APPOINTMENT
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.patient_id) {
            setError(
                "Please select a patient."
            );
            return;
        }

        if (!formData.doctor_id) {
            setError(
                "Please select a doctor."
            );
            return;
        }

        if (
            !formData.appointment_date
        ) {
            setError(
                "Please select appointment date."
            );
            return;
        }

        if (
            !formData.appointment_time
        ) {
            setError(
                "Please select appointment time."
            );
            return;
        }

        try {
            setSaving(true);

            setError("");

            const response =
                await fetch(
                    `${API_URL}/appointments`,
                    {
                        method: "POST",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify({
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

                                notes:
                                    formData.notes.trim() ||
                                    null,
                            }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create appointment"
                );
            }

            // Refresh appointment list
            await fetchAppointments(true);

            // Close modal
            setShowModal(false);

            // Reset form
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
    // DELETE APPOINTMENT
    // =====================================================

    const handleDelete = async (id) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this appointment?"
            );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeletingId(id);

            setError("");

            const response =
                await fetch(
                    `${API_URL}/appointments/${id}`,
                    {
                        method: "DELETE",
                        headers:
                            getHeaders(),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete appointment"
                );
            }

            // Immediate UI update
            setAppointments(
                (previous) =>
                    previous.filter(
                        (appointment) =>
                            appointment.id !== id
                    )
            );

            // Get latest data
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
    // FIND PATIENT
    // =====================================================

    const getPatientName = (appointment) => {
        if (
            appointment.patient_name
        ) {
            return appointment.patient_name;
        }

        const patient =
            patients.find(
                (item) =>
                    Number(item.id) ===
                    Number(
                        appointment.patient_id
                    )
            );

        return (
            patient?.name ||
            "Unknown Patient"
        );
    };

    // =====================================================
    // FIND DOCTOR
    // =====================================================

    const getDoctorName = (appointment) => {
        if (
            appointment.doctor_name
        ) {
            return appointment.doctor_name;
        }

        const doctor =
            doctors.find(
                (item) =>
                    Number(item.id) ===
                    Number(
                        appointment.doctor_id
                    )
            );

        if (!doctor) {
            return "Unknown Doctor";
        }

        return (
            doctor.name ||
            doctor.doctor_name ||
            `Dr. ${doctor.doctor_code}`
        );
    };

    // =====================================================
    // DOCTOR SPECIALIZATION
    // =====================================================

    const getDoctorSpecialization = (
        appointment
    ) => {
        if (
            appointment.specialization
        ) {
            return appointment.specialization;
        }

        const doctor =
            doctors.find(
                (item) =>
                    Number(item.id) ===
                    Number(
                        appointment.doctor_id
                    )
            );

        return (
            doctor?.specialization ||
            "Doctor"
        );
    };

    // =====================================================
    // PATIENT CODE
    // =====================================================

    const getPatientCode = (
        appointment
    ) => {
        if (
            appointment.patient_code
        ) {
            return appointment.patient_code;
        }

        const patient =
            patients.find(
                (item) =>
                    Number(item.id) ===
                    Number(
                        appointment.patient_id
                    )
            );

        return (
            patient?.patient_code ||
            `PAT-${appointment.patient_id}`
        );
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (time) => {
        if (!time) {
            return "-";
        }

        // If API returns HH:mm:ss
        const parts =
            String(time).split(":");

        if (
            parts.length < 2
        ) {
            return time;
        }

        let hours =
            Number(parts[0]);

        const minutes =
            parts[1];

        const suffix =
            hours >= 12
                ? "PM"
                : "AM";

        hours =
            hours % 12 || 12;

        return `${hours}:${minutes} ${suffix}`;
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalAppointments =
        appointments.length;

    const scheduledAppointments =
        appointments.filter(
            (appointment) =>
                String(
                    appointment.status || ""
                ).toLowerCase() ===
                "scheduled"
        ).length;

    const pendingAppointments =
        appointments.filter(
            (appointment) =>
                String(
                    appointment.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;

    const completedAppointments =
        appointments.filter(
            (appointment) =>
                String(
                    appointment.status || ""
                ).toLowerCase() ===
                "completed"
        ).length;

    // =====================================================
    // SORT APPOINTMENTS
    // =====================================================

    const sortedAppointments =
        useMemo(() => {
            return [...appointments].sort(
                (a, b) => {
                    const dateA =
                        new Date(
                            `${a.appointment_date || ""}T${a.appointment_time || "00:00"}`
                        );

                    const dateB =
                        new Date(
                            `${b.appointment_date || ""}T${b.appointment_time || "00:00"}`
                        );

                    return (
                        dateA - dateB
                    );
                }
            );
        }, [appointments]);

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (
        status
    ) => {
        const normalized =
            String(
                status || "scheduled"
            ).toLowerCase();

        return [
            "appointment-status",
            normalized,
        ].join(" ");
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="appointments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="appointments-header">

                <div className="appointments-header-left">

                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1>
                            Appointments
                        </h1>

                        <p>
                            Manage hospital
                            appointments
                            and schedules
                        </p>
                    </div>

                </div>

                <div className="appointments-header-actions">

                    <button
                        type="button"
                        className="appointment-refresh"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            loading ||
                            refreshing
                        }
                        title="Refresh appointments"
                        aria-label="Refresh appointments"
                    >
                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "refresh-spin"
                                    : ""
                            }
                        />
                    </button>

                    <button
                        type="button"
                        className="add-appointment-button"
                        onClick={
                            openAddModal
                        }
                    >
                        <FaPlus />

                        <span>
                            Add Appointment
                        </span>
                    </button>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="appointments-main-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        Dismiss
                    </button>

                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <section className="appointment-summary-grid">

                <div className="appointment-summary">

                    <div className="summary-icon">
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

                <div className="appointment-summary">

                    <div className="summary-icon">
                        <FaClock />
                    </div>

                    <div>
                        <span>
                            Scheduled
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : scheduledAppointments}
                        </strong>
                    </div>

                </div>

                <div className="appointment-summary">

                    <div className="summary-icon">
                        <FaCalendarAlt />
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

                <div className="appointment-summary">

                    <div className="summary-icon">
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

            </section>

            {/* =================================================
                MAIN PANEL
            ================================================= */}

            <section className="appointments-panel">

                <div className="appointments-panel-header">

                    <div>
                        <h2>
                            Appointment List
                        </h2>

                        <p>
                            View and manage
                            scheduled
                            appointments
                        </p>
                    </div>

                    <span>
                        {loading
                            ? "Loading..."
                            : `${appointments.length} appointments`}
                    </span>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="appointments-page-loading">

                        <FaSyncAlt className="refresh-spin" />

                        <span>
                            Loading appointments...
                        </span>

                    </div>

                ) : appointments.length ===
                    0 ? (

                    /* =================================================
                        EMPTY
                    ================================================= */

                    <div className="appointments-page-empty">

                        <FaCalendarAlt />

                        <strong>
                            No appointments found
                        </strong>

                        <span>
                            Click "Add Appointment"
                            to create your first
                            appointment.
                        </span>

                    </div>

                ) : (

                    /* =================================================
                        TABLE
                    ================================================= */

                    <div className="appointments-table-wrapper">

                        <table className="appointments-table">

                            <thead>

                                <tr>

                                    <th>
                                        Patient
                                    </th>

                                    <th>
                                        Doctor
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Time
                                    </th>

                                    <th>
                                        Reason
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {sortedAppointments.map(
                                    (
                                        appointment
                                    ) => (

                                        <tr
                                            key={
                                                appointment.id
                                            }
                                        >

                                            {/* PATIENT */}

                                            <td>

                                                <div className="patient-cell">

                                                    <div className="patient-mini-avatar">
                                                        {
                                                            getPatientName(
                                                                appointment
                                                            )
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        }
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                getPatientName(
                                                                    appointment
                                                                )
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                getPatientCode(
                                                                    appointment
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* DOCTOR */}

                                            <td>

                                                <div className="doctor-cell">

                                                    <strong>
                                                        {
                                                            getDoctorName(
                                                                appointment
                                                            )
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            getDoctorSpecialization(
                                                                appointment
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            {/* DATE */}

                                            <td>
                                                {
                                                    formatDate(
                                                        appointment.appointment_date
                                                    )
                                                }
                                            </td>

                                            {/* TIME */}

                                            <td>
                                                {
                                                    formatTime(
                                                        appointment.appointment_time
                                                    )
                                                }
                                            </td>

                                            {/* REASON */}

                                            <td>

                                                <span className="reason-cell">

                                                    {
                                                        appointment.reason ||
                                                        "-"
                                                    }

                                                </span>

                                            </td>

                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={
                                                        getStatusClass(
                                                            appointment.status
                                                        )
                                                    }
                                                >
                                                    {
                                                        appointment.status ||
                                                        "Scheduled"
                                                    }
                                                </span>

                                            </td>

                                            {/* DELETE */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="delete-appointment-button"
                                                    title="Delete Appointment"
                                                    aria-label="Delete Appointment"
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
                                                        <FaSyncAlt className="refresh-spin" />
                                                    ) : (
                                                        <FaTrash />
                                                    )}

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* =================================================
                ADD APPOINTMENT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="appointment-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="appointment-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

                        <div className="appointment-modal-header">

                            <div>
                                <h2>
                                    Add New Appointment
                                </h2>

                                <p>
                                    Select patient,
                                    doctor and
                                    appointment
                                    schedule
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                                title="Close"
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* =================================================
                            FORM ERROR
                        ================================================= */}

                        {error && (
                            <div className="appointment-form-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>
                        )}

                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            className="appointment-form"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="form-grid">

                                {/* =================================================
                                    PATIENT DROPDOWN
                                ================================================= */}

                                <div className="form-group">

                                    <label htmlFor="patient_id">
                                        <FaUserInjured />
                                        Patient
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
                                                ? "Loading patients..."
                                                : "Select Patient"}
                                        </option>

                                        {patients.map(
                                            (
                                                patient
                                            ) => (

                                                <option
                                                    key={
                                                        patient.id
                                                    }
                                                    value={
                                                        patient.id
                                                    }
                                                >
                                                    {
                                                        patient.name
                                                    }
                                                    {" "}
                                                    —
                                                    {" "}
                                                    {
                                                        patient.patient_code ||
                                                        `PAT-${patient.id}`
                                                    }
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

                                {/* =================================================
                                    DOCTOR DROPDOWN
                                ================================================= */}

                                <div className="form-group">

                                    <label htmlFor="doctor_id">
                                        <FaUserMd />
                                        Doctor
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
                                                ? "Loading doctors..."
                                                : "Select Doctor"}
                                        </option>

                                        {doctors.map(
                                            (
                                                doctor
                                            ) => (

                                                <option
                                                    key={
                                                        doctor.id
                                                    }
                                                    value={
                                                        doctor.id
                                                    }
                                                >
                                                    {doctor.name ||
                                                        doctor.doctor_name ||
                                                        `Dr. ${doctor.doctor_code}`}
                                                    {" "}
                                                    —
                                                    {" "}
                                                    {
                                                        doctor.specialization ||
                                                        "General"
                                                    }
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

                                {/* =================================================
                                    DATE
                                ================================================= */}

                                <div className="form-group">

                                    <label htmlFor="appointment_date">
                                        <FaCalendarAlt />
                                        Appointment Date
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
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                {/* =================================================
                                    TIME
                                ================================================= */}

                                <div className="form-group">

                                    <label htmlFor="appointment_time">
                                        <FaClock />
                                        Appointment Time
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
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                {/* =================================================
                                    REASON
                                ================================================= */}

                                <div className="form-group form-group-full">

                                    <label htmlFor="reason">
                                        <FaNotesMedical />
                                        Reason
                                    </label>

                                    <input
                                        id="reason"
                                        type="text"
                                        name="reason"
                                        placeholder="Enter appointment reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                {/* =================================================
                                    STATUS
                                ================================================= */}

                                <div className="form-group">

                                    <label htmlFor="status">
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
                                        disabled={
                                            saving
                                        }
                                    >

                                        <option value="scheduled">
                                            Scheduled
                                        </option>

                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>

                                        <option value="cancelled">
                                            Cancelled
                                        </option>

                                    </select>

                                </div>

                                {/* =================================================
                                    NOTES
                                ================================================= */}

                                <div className="form-group form-group-full">

                                    <label htmlFor="notes">
                                        Notes
                                    </label>

                                    <textarea
                                        id="notes"
                                        name="notes"
                                        placeholder="Enter additional notes..."
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="3"
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                            </div>

                            {/* =================================================
                                FORM ACTIONS
                            ================================================= */}

                            <div className="appointment-form-actions">

                                <button
                                    type="button"
                                    className="cancel-form-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
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
                                            <FaSyncAlt className="refresh-spin" />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />

                                            Create Appointment
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