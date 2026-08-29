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
    FaEye,
    FaEdit,
    FaCheckCircle,
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
    const [modalMode, setModalMode] = useState("add");

    const [selectedAppointment, setSelectedAppointment] =
        useState(null);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] =
        useState(null);

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
    // DATE / TIME HELPERS
    // IMPORTANT:
    // Database DATE and TIME are treated as LOCAL values.
    // No UTC timezone conversion is performed.
    // =====================================================

    /*
     * Converts:
     * 2026-09-01
     * 2026-09-01T00:00:00.000Z
     * 2026-09-01 00:00:00
     *
     * into:
     * 2026-09-01
     */
    const normalizeDateValue = (value) => {
        if (!value) return "";

        const stringValue = String(value).trim();

        // ISO / MySQL datetime
        if (stringValue.includes("T")) {
            return stringValue.split("T")[0];
        }

        // MySQL datetime
        if (stringValue.includes(" ")) {
            return stringValue.split(" ")[0];
        }

        return stringValue.slice(0, 10);
    };

    /*
     * Converts:
     * 11:10:00 -> 11:10
     * 01:00:00 -> 01:00
     * 12:00:00 -> 12:00
     *
     * NO timezone conversion.
     */
    const normalizeTimeValue = (value) => {
        if (!value) return "";

        const stringValue = String(value).trim();

        // If datetime somehow arrives
        if (stringValue.includes("T")) {
            const timePart =
                stringValue.split("T")[1] || "";

            return timePart.slice(0, 5);
        }

        // If datetime arrives with space
        if (stringValue.includes(" ")) {
            const timePart =
                stringValue.split(" ")[1] || "";

            return timePart.slice(0, 5);
        }

        return stringValue.slice(0, 5);
    };

    /*
     * DATE formatting.
     *
     * IMPORTANT:
     * Do NOT use new Date("2026-09-01")
     * because date-only strings can be interpreted
     * as UTC and create timezone problems.
     */
    const formatDate = (date) => {
        const value = normalizeDateValue(date);

        if (!value) return "-";

        const match =
            value.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

        if (!match) {
            return "-";
        }

        const [, year, month, day] = match;

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const monthNumber = Number(month);

        if (
            monthNumber < 1 ||
            monthNumber > 12
        ) {
            return "-";
        }

        return `${day} ${monthNames[monthNumber - 1]} ${year}`;
    };

    /*
     * TIME formatting.
     *
     * Database:
     * 00:00:00 -> 12:00 AM
     * 01:00:00 -> 1:00 AM
     * 10:00:00 -> 10:00 AM
     * 12:00:00 -> 12:00 PM
     * 13:00:00 -> 1:00 PM
     * 23:59:00 -> 11:59 PM
     *
     * NO timezone conversion.
     */
    const formatTime = (time) => {
        const value = normalizeTimeValue(time);

        if (!value) return "-";

        const match =
            value.match(
                /^(\d{1,2}):(\d{2})$/
            );

        if (!match) {
            return String(time);
        }

        let hours = Number(match[1]);
        const minutes = match[2];

        if (
            Number.isNaN(hours) ||
            hours < 0 ||
            hours > 23
        ) {
            return String(time);
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
     * Browser local date.
     *
     * We intentionally DO NOT use:
     *
     * new Date().toISOString().split("T")[0]
     *
     * because toISOString() is UTC.
     */
    const getLocalDateString = () => {
        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    /*
     * Converts local DATE + TIME into a timestamp
     * only for sorting.
     *
     * This is NOT used to display the appointment time.
     */
    const getAppointmentDateTime = (
        appointment
    ) => {
        const date =
            normalizeDateValue(
                appointment?.appointment_date
            );

        const time =
            normalizeTimeValue(
                appointment?.appointment_time
            );

        if (!date) return 0;

        const [year, month, day] =
            date.split("-").map(Number);

        const [hours, minutes] =
            (time || "00:00")
                .split(":")
                .map(Number);

        if (
            !year ||
            !month ||
            !day
        ) {
            return 0;
        }

        const localDate =
            new Date(
                year,
                month - 1,
                day,
                hours || 0,
                minutes || 0,
                0,
                0
            );

        const timestamp =
            localDate.getTime();

        return Number.isNaN(timestamp)
            ? 0
            : timestamp;
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
                !Array.isArray(
                    data.patients
                )
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
                !Array.isArray(
                    data.doctors
                )
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
        } finally {
            setLoadingDoctors(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
        fetchDoctors();
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        if (loading || refreshing) {
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        setModalMode("add");
        setSelectedAppointment(null);

        setFormData({
            ...emptyForm,
        });

        setError("");
        setShowModal(true);

        fetchPatients();
        fetchDoctors();
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (
        appointment
    ) => {
        setModalMode("edit");
        setSelectedAppointment(
            appointment
        );

        setFormData({
            patient_id:
                appointment.patient_id
                    ? String(
                        appointment.patient_id
                    )
                    : "",

            doctor_id:
                appointment.doctor_id
                    ? String(
                        appointment.doctor_id
                    )
                    : "",

            appointment_date:
                normalizeDateValue(
                    appointment.appointment_date
                ),

            appointment_time:
                normalizeTimeValue(
                    appointment.appointment_time
                ),

            reason:
                appointment.reason ||
                "",

            status:
                appointment.status ||
                "pending",
        });

        setError("");
        setShowModal(true);

        fetchPatients();
        fetchDoctors();
    };

    // =====================================================
    // OPEN VIEW MODAL
    // =====================================================

    const openViewModal = (
        appointment
    ) => {
        setSelectedAppointment(
            appointment
        );

        setModalMode("view");
        setError("");
        setShowModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setSelectedAppointment(null);
        setModalMode("add");

        setFormData({
            ...emptyForm,
        });

        setError("");
    };

    // =====================================================
    // ESCAPE
    // =====================================================

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key !== "Escape") {
                return;
            }

            if (showDeleteModal) {
                closeDeleteModal();
                return;
            }

            if (showModal) {
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
    }, [
        showModal,
        showDeleteModal,
        saving,
        deletingId,
    ]);

    // =====================================================
    // SUBMIT ADD / EDIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

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

            const isEdit =
                modalMode === "edit";

            const endpoint = isEdit
                ? `${API_URL}/appointments/${selectedAppointment.id}`
                : `${API_URL}/appointments`;

            /*
             * IMPORTANT:
             *
             * We send DATE and TIME exactly as
             * selected by the user.
             *
             * No:
             * new Date()
             * toISOString()
             * UTC conversion
             */
            const payload = {
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
                    formData.status ||
                    "pending",
            };

            const response =
                await fetch(
                    endpoint,
                    {
                        method: isEdit
                            ? "PUT"
                            : "POST",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (
                        isEdit
                            ? "Unable to update appointment"
                            : "Unable to create appointment"
                    )
                );
            }

            await fetchAppointments(
                true
            );

            setShowModal(false);
            setSelectedAppointment(null);
            setModalMode("add");

            setFormData({
                ...emptyForm,
            });
        } catch (err) {
            console.error(
                isEdit
                    ? "Update Appointment Error:"
                    : "Create Appointment Error:",
                err
            );

            setError(
                err.message ||
                (
                    modalMode === "edit"
                        ? "Unable to update appointment."
                        : "Unable to create appointment."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE CONFIRMATION
    // =====================================================

    const openDeleteModal = (
        appointment
    ) => {
        setAppointmentToDelete(
            appointment
        );

        setShowDeleteModal(true);
        setError("");
    };

    const closeDeleteModal = () => {
        if (deletingId !== null) {
            return;
        }

        setShowDeleteModal(false);
        setAppointmentToDelete(null);
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async () => {
        if (!appointmentToDelete) {
            return;
        }

        const id =
            appointmentToDelete.id;

        try {
            setDeletingId(id);
            setError("");

            const response =
                await fetch(
                    `${API_URL}/appointments/${id}`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
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

            setAppointments(
                (prev) =>
                    prev.filter(
                        (appointment) =>
                            Number(
                                appointment.id
                            ) !== Number(id)
                    )
            );

            setShowDeleteModal(false);
            setAppointmentToDelete(
                null
            );
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

    const getPatientName = (
        appointment
    ) => {
        if (
            appointment?.patient_name
        ) {
            return appointment.patient_name;
        }

        const patient =
            patients.find(
                (p) =>
                    Number(p.id) ===
                    Number(
                        appointment?.patient_id
                    )
            );

        return (
            patient?.name ||
            "Unknown Patient"
        );
    };

    const getDoctorName = (
        appointment
    ) => {
        if (
            appointment?.doctor_name
        ) {
            return appointment.doctor_name;
        }

        const doctor =
            doctors.find(
                (d) =>
                    Number(d.id) ===
                    Number(
                        appointment?.doctor_id
                    )
            );

        return (
            doctor?.name ||
            `Dr. ${appointment?.doctor_id || ""}`
        );
    };

    const getDoctorSpecialization = (
        appointment
    ) => {
        if (
            appointment?.specialization
        ) {
            return appointment.specialization;
        }

        const doctor =
            doctors.find(
                (d) =>
                    Number(d.id) ===
                    Number(
                        appointment?.doctor_id
                    )
            );

        return (
            doctor?.specialization ||
            "Doctor"
        );
    };

    const getPatientCode = (
        appointment
    ) => {
        if (
            appointment?.patient_code
        ) {
            return appointment.patient_code;
        }

        const patient =
            patients.find(
                (p) =>
                    Number(p.id) ===
                    Number(
                        appointment?.patient_id
                    )
            );

        return (
            patient?.patient_code ||
            `PAT-${appointment?.patient_id || ""}`
        );
    };

    const normalizeStatus = (
        status
    ) =>
        String(
            status || "pending"
        ).toLowerCase();

    const getStatusClass = (
        status
    ) => {
        return `appointment-status ${normalizeStatus(
            status
        )}`;
    };

    const formatStatus = (
        status
    ) => {
        const normalized =
            normalizeStatus(status);

        return (
            normalized.charAt(0).toUpperCase() +
            normalized.slice(1)
        );
    };

    // =====================================================
    // TODAY
    // =====================================================

    const todayString =
        getLocalDateString();

    const isToday = (date) => {
        return (
            normalizeDateValue(date) ===
            todayString
        );
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalAppointments =
        appointments.length;

    const todayAppointments =
        appointments.filter(
            (appointment) =>
                isToday(
                    appointment.appointment_date
                )
        ).length;

    const pendingAppointments =
        appointments.filter(
            (appointment) =>
                normalizeStatus(
                    appointment.status
                ) === "pending"
        ).length;

    const completedAppointments =
        appointments.filter(
            (appointment) =>
                normalizeStatus(
                    appointment.status
                ) === "completed"
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

            let result =
                [...appointments];

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

                            const specialization =
                                getDoctorSpecialization(
                                    appointment
                                );

                            const reason =
                                appointment.reason ||
                                "";

                            const status =
                                appointment.status ||
                                "";

                            const date =
                                formatDate(
                                    appointment.appointment_date
                                );

                            const time =
                                formatTime(
                                    appointment.appointment_time
                                );

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

                                specialization
                                    .toLowerCase()
                                    .includes(value) ||

                                reason
                                    .toLowerCase()
                                    .includes(value) ||

                                status
                                    .toLowerCase()
                                    .includes(value) ||

                                date
                                    .toLowerCase()
                                    .includes(value) ||

                                time
                                    .toLowerCase()
                                    .includes(value)
                            );
                        }
                    );
            }

            /*
             * Sort chronologically:
             * oldest appointment first.
             *
             * Since date + time are database-local values,
             * sorting also stays local.
             */
            return result.sort(
                (a, b) =>
                    getAppointmentDateTime(a) -
                    getAppointmentDateTime(b)
            );
        }, [
            appointments,
            search,
            patients,
            doctors,
        ]);

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
                            appointments and
                            schedules
                        </p>
                    </div>

                </div>

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

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="appointments-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            refreshing
                        }
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

            {/* =================================================
                STATISTICS
            ================================================= */}

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
                            Today
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : todayAppointments}
                        </strong>
                    </div>

                </div>

                <div className="appointment-stat-card">

                    <div className="appointment-stat-icon">
                        <FaNotesMedical />
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
                        <FaCheckCircle />
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
                APPOINTMENT PANEL
            ================================================= */}

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
                                placeholder="Search patient, doctor, code..."
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
                            onClick={
                                handleRefresh
                            }
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

                {/* =================================================
                    LOADING
                ================================================= */}

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

                                {filteredAppointments.length >
                                    0 ? (

                                    filteredAppointments.map(
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
                                                        {formatStatus(
                                                            appointment.status
                                                        )}
                                                    </span>

                                                </td>

                                                {/* ACTION */}

                                                <td>

                                                    <div className="appointment-actions">

                                                        <button
                                                            type="button"
                                                            className="view-appointment-action"
                                                            title="View Appointment"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    appointment
                                                                )
                                                            }
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="edit-appointment-action"
                                                            title="Edit Appointment"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    appointment
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-appointment-action"
                                                            title="Delete Appointment"
                                                            disabled={
                                                                deletingId ===
                                                                appointment.id
                                                            }
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    appointment
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

            {/* =================================================
                ADD / EDIT / VIEW MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="appointment-modal-overlay"
                    onClick={
                        closeModal
                    }
                >

                    <div
                        className={`appointment-modal ${modalMode === "view"
                                ? "appointment-view-modal"
                                : ""
                            }`}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="appointment-modal-close"
                            onClick={
                                closeModal
                            }
                            disabled={
                                saving
                            }
                            title="Close"
                        >
                            <FaTimes />
                        </button>

                        <div className="appointment-modal-icon">

                            {modalMode ===
                                "view" ? (
                                <FaEye />
                            ) : modalMode ===
                                "edit" ? (
                                <FaEdit />
                            ) : (
                                <FaCalendarAlt />
                            )}

                        </div>

                        <h2>
                            {modalMode ===
                                "view"
                                ? "Appointment Details"
                                : modalMode ===
                                    "edit"
                                    ? "Edit Appointment"
                                    : "Add New Appointment"}
                        </h2>

                        <p>
                            {modalMode ===
                                "view"
                                ? "View complete appointment information"
                                : modalMode ===
                                    "edit"
                                    ? "Update appointment information"
                                    : "Select patient, doctor and appointment schedule"}
                        </p>

                        {modalMode ===
                            "view" ? (

                            /* =================================================
                               VIEW
                            ================================================= */

                            <div className="appointment-view-content">

                                <div className="appointment-view-patient">

                                    <div className="appointment-view-avatar">
                                        {getPatientName(
                                            selectedAppointment
                                        )
                                            ?.charAt(
                                                0
                                            )
                                            .toUpperCase() ||
                                            "P"}
                                    </div>

                                    <div>

                                        <span>
                                            Patient
                                        </span>

                                        <strong>
                                            {getPatientName(
                                                selectedAppointment
                                            )}
                                        </strong>

                                        <small>
                                            {getPatientCode(
                                                selectedAppointment
                                            )}
                                        </small>

                                    </div>

                                </div>

                                <div className="appointment-view-grid">

                                    <div className="appointment-detail-card">

                                        <span>
                                            <FaUserMd />
                                            Doctor
                                        </span>

                                        <strong>
                                            {getDoctorName(
                                                selectedAppointment
                                            )}
                                        </strong>

                                        <small>
                                            {getDoctorSpecialization(
                                                selectedAppointment
                                            )}
                                        </small>

                                    </div>

                                    <div className="appointment-detail-card">

                                        <span>
                                            <FaCalendarAlt />
                                            Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedAppointment.appointment_date
                                            )}
                                        </strong>

                                    </div>

                                    <div className="appointment-detail-card">

                                        <span>
                                            <FaClock />
                                            Time
                                        </span>

                                        <strong>
                                            {formatTime(
                                                selectedAppointment.appointment_time
                                            )}
                                        </strong>

                                    </div>

                                    <div className="appointment-detail-card">

                                        <span>
                                            <FaNotesMedical />
                                            Status
                                        </span>

                                        <strong>
                                            <span
                                                className={getStatusClass(
                                                    selectedAppointment.status
                                                )}
                                            >
                                                {formatStatus(
                                                    selectedAppointment.status
                                                )}
                                            </span>
                                        </strong>

                                    </div>

                                </div>

                                <div className="appointment-detail-reason">

                                    <span>
                                        <FaNotesMedical />
                                        Reason
                                    </span>

                                    <p>
                                        {selectedAppointment.reason ||
                                            "No reason provided."}
                                    </p>

                                </div>

                                <div className="appointment-view-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={
                                            closeModal
                                        }
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="save-appointment-button"
                                        onClick={() =>
                                            openEditModal(
                                                selectedAppointment
                                            )
                                        }
                                    >
                                        <FaEdit />
                                        Edit Appointment
                                    </button>

                                </div>

                            </div>

                        ) : (

                            /* =================================================
                               ADD / EDIT FORM
                            ================================================= */

                            <>
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
                                    onSubmit={
                                        handleSubmit
                                    }
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

                                                Appointment
                                                Date

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
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label htmlFor="appointment_time">

                                                <FaClock />

                                                Appointment
                                                Time

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
                                                disabled={
                                                    saving
                                                }
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
                                            disabled={
                                                saving
                                            }
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
                                            disabled={
                                                saving
                                            }
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
                                                    <FaSyncAlt className="refresh-spinning" />

                                                    {modalMode ===
                                                        "edit"
                                                        ? "Updating..."
                                                        : "Saving..."}
                                                </>
                                            ) : (
                                                <>
                                                    {modalMode ===
                                                        "edit" ? (
                                                        <FaEdit />
                                                    ) : (
                                                        <FaPlus />
                                                    )}

                                                    {modalMode ===
                                                        "edit"
                                                        ? "Update Appointment"
                                                        : "Add Appointment"}
                                                </>
                                            )}

                                        </button>

                                    </div>

                                </form>
                            </>

                        )}

                    </div>

                </div>

            )}

            {/* =================================================
                DELETE CONFIRMATION MODAL
            ================================================= */}

            {showDeleteModal &&
                appointmentToDelete && (

                    <div
                        className="appointment-modal-overlay appointment-delete-overlay"
                        onClick={
                            closeDeleteModal
                        }
                    >

                        <div
                            className="appointment-delete-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="appointment-delete-icon">
                                <FaTrash />
                            </div>

                            <h2>
                                Delete Appointment?
                            </h2>

                            <p>
                                Are you sure you want
                                to delete this
                                appointment?
                            </p>

                            <div className="delete-appointment-summary">

                                <strong>
                                    {getPatientName(
                                        appointmentToDelete
                                    )}
                                </strong>

                                <span>
                                    {formatDate(
                                        appointmentToDelete.appointment_date
                                    )}{" "}
                                    •{" "}
                                    {formatTime(
                                        appointmentToDelete.appointment_time
                                    )}
                                </span>

                            </div>

                            <small>
                                This action cannot be
                                undone.
                            </small>

                            <div className="delete-confirm-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        deletingId !==
                                        null
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="confirm-delete-button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        deletingId !==
                                        null
                                    }
                                >

                                    {deletingId !==
                                        null ? (
                                        <>
                                            <FaSyncAlt className="refresh-spinning" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FaTrash />
                                            Delete
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </main>
    );
}

export default Appointments;