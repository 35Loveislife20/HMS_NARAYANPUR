import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaSearch,
    FaPlus,
    FaUserInjured,
    FaEdit,
    FaTrash,
    FaEye,
    FaPhone,
    FaCalendarAlt,
    FaTimes,
    FaArrowLeft,
    FaVenusMars,
    FaHospital,
    FaSyncAlt,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Patients.css";

function Patients() {
    const navigate = useNavigate();

    // =====================================================
    // API
    // =====================================================

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // USER
    // =====================================================

    const user =
        JSON.parse(localStorage.getItem("hms_user")) || {};

    // Prevent unused-variable warning if user is not
    // currently required elsewhere.
    void user;

    // =====================================================
    // STATES
    // =====================================================

    const [patients, setPatients] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [modalMode, setModalMode] = useState("add");

    const [activePatientId, setActivePatientId] =
        useState(null);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    // =====================================================
    // EMPTY FORM
    // =====================================================

    const emptyForm = {
        patient_code: "",
        name: "",
        gender: "male",
        date_of_birth: "",
        phone: "",
        email: "",
        address: "",
        blood_group: "",
    };

    const [formData, setFormData] =
        useState(emptyForm);

    // =====================================================
    // FETCH PATIENTS
    // =====================================================

    const fetchPatients = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token =
                localStorage.getItem("hms_token");

            const response = await fetch(
                `${API_URL}/patients`,
                {
                    method: "GET",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...(token && {
                            Authorization:
                                `Bearer ${token}`,
                        }),
                    },

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

            // IMPORTANT:
            // Always replace old data with fresh API data.
            setPatients([...data.patients]);

        } catch (err) {
            console.error(
                "Fetch Patients Error:",
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
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchPatients(false);
    }, []);

    // =====================================================
    // REFRESH BUTTON
    // =====================================================

    const handleRefresh = async () => {
        if (loading || refreshing) {
            return;
        }

        await fetchPatients(true);
    };

    // =====================================================
    // CALCULATE AGE
    // =====================================================

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) {
            return "-";
        }

        const dob = new Date(dateOfBirth);

        if (Number.isNaN(dob.getTime())) {
            return "-";
        }

        const today = new Date();

        let age =
            today.getFullYear() -
            dob.getFullYear();

        const monthDifference =
            today.getMonth() -
            dob.getMonth();

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < dob.getDate()
            )
        ) {
            age--;
        }

        return age >= 0 ? age : "-";
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

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
    // TODAY CHECK
    // =====================================================

    const isToday = (date) => {
        if (!date) {
            return false;
        }

        const patientDate =
            new Date(date);

        const today =
            new Date();

        return (
            patientDate.getFullYear() ===
            today.getFullYear() &&
            patientDate.getMonth() ===
            today.getMonth() &&
            patientDate.getDate() ===
            today.getDate()
        );
    };

    // =====================================================
    // NEW PATIENT CHECK
    // Last 7 days
    // =====================================================

    const isNewPatient = (date) => {
        if (!date) {
            return false;
        }

        const createdDate =
            new Date(date);

        const now =
            new Date();

        const sevenDaysAgo =
            new Date();

        sevenDaysAgo.setDate(
            now.getDate() - 7
        );

        return createdDate >= sevenDaysAgo;
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalPatients =
        patients.length;

    const activePatients =
        patients.length;

    const todaysPatients =
        patients.filter(
            (patient) =>
                isToday(
                    patient.created_at
                )
        ).length;

    const newPatients =
        patients.filter(
            (patient) =>
                isNewPatient(
                    patient.created_at
                )
        ).length;

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredPatients =
        useMemo(() => {
            const value =
                search
                    .toLowerCase()
                    .trim();

            if (!value) {
                return patients;
            }

            return patients.filter(
                (patient) => {
                    return (
                        String(
                            patient.name || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            patient.patient_code || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            patient.phone || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            patient.email || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            patient.gender || ""
                        )
                            .toLowerCase()
                            .includes(value)
                    );
                }
            );
        }, [patients, search]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        setModalMode("add");

        setActivePatientId(null);

        setFormData({
            ...emptyForm,
        });

        setShowModal(true);
    };

    // =====================================================
    // OPEN VIEW MODAL
    // =====================================================

    const openViewModal = (patient) => {
        setModalMode("view");

        setActivePatientId(
            patient.id
        );

        setFormData({
            patient_code:
                patient.patient_code || "",

            name:
                patient.name || "",

            gender:
                patient.gender || "male",

            date_of_birth:
                patient.date_of_birth
                    ? String(
                        patient.date_of_birth
                    ).substring(0, 10)
                    : "",

            phone:
                patient.phone || "",

            email:
                patient.email || "",

            address:
                patient.address || "",

            blood_group:
                patient.blood_group || "",
        });

        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (patient) => {
        setModalMode("edit");

        setActivePatientId(
            patient.id
        );

        setFormData({
            patient_code:
                patient.patient_code || "",

            name:
                patient.name || "",

            gender:
                patient.gender || "male",

            date_of_birth:
                patient.date_of_birth
                    ? String(
                        patient.date_of_birth
                    ).substring(0, 10)
                    : "",

            phone:
                patient.phone || "",

            email:
                patient.email || "",

            address:
                patient.address || "",

            blood_group:
                patient.blood_group || "",
        });

        setShowModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setModalMode("add");

        setActivePatientId(null);

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
    // GENERATE PATIENT CODE
    // =====================================================

    const generatePatientCode = () => {
        const nextNumber =
            patients.length + 1;

        return `PID-${String(
            nextNumber
        ).padStart(4, "0")}`;
    };

    // =====================================================
    // ADD / EDIT PATIENT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            setError("");

            const token =
                localStorage.getItem("hms_token");

            // =================================================
            // ADD
            // =================================================

            if (
                modalMode === "add"
            ) {
                const patientCode =
                    formData.patient_code.trim() ||
                    generatePatientCode();

                const response =
                    await fetch(
                        `${API_URL}/patients`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                ...(token && {
                                    Authorization:
                                        `Bearer ${token}`,
                                }),
                            },

                            body: JSON.stringify({
                                patient_code:
                                    patientCode,

                                name:
                                    formData.name.trim(),

                                gender:
                                    formData.gender,

                                date_of_birth:
                                    formData.date_of_birth ||
                                    null,

                                phone:
                                    formData.phone.trim() ||
                                    null,

                                email:
                                    formData.email.trim() ||
                                    null,

                                address:
                                    formData.address.trim() ||
                                    null,

                                blood_group:
                                    formData.blood_group.trim() ||
                                    null,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to add patient"
                    );
                }
            }

            // =================================================
            // EDIT
            // =================================================

            if (
                modalMode === "edit" &&
                activePatientId !== null
            ) {
                const response =
                    await fetch(
                        `${API_URL}/patients/${activePatientId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                ...(token && {
                                    Authorization:
                                        `Bearer ${token}`,
                                }),
                            },

                            body: JSON.stringify({
                                name:
                                    formData.name.trim(),

                                gender:
                                    formData.gender,

                                date_of_birth:
                                    formData.date_of_birth ||
                                    null,

                                phone:
                                    formData.phone.trim() ||
                                    null,

                                email:
                                    formData.email.trim() ||
                                    null,

                                address:
                                    formData.address.trim() ||
                                    null,

                                blood_group:
                                    formData.blood_group.trim() ||
                                    null,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to update patient"
                    );
                }
            }

            // =================================================
            // REFRESH AFTER SAVE
            // =================================================

            await fetchPatients(true);

            setShowModal(false);

            setModalMode("add");

            setActivePatientId(null);

            setFormData({
                ...emptyForm,
            });

        } catch (err) {
            console.error(
                "Save Patient Error:",
                err
            );

            setError(
                err.message ||
                "Unable to save patient."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE PATIENT
    // =====================================================

    const handleDelete = async (id) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this patient?"
            );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeletingId(id);

            setError("");

            const token =
                localStorage.getItem("hms_token");

            const response =
                await fetch(
                    `${API_URL}/patients/${id}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(token && {
                                Authorization:
                                    `Bearer ${token}`,
                            }),
                        },
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete patient"
                );
            }

            // Immediately update UI
            setPatients(
                (previous) =>
                    previous.filter(
                        (patient) =>
                            patient.id !== id
                    )
            );

            // Get latest server data
            await fetchPatients(true);

        } catch (err) {
            console.error(
                "Delete Patient Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete patient."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // MODAL
    // =====================================================

    const isViewMode =
        modalMode === "view";

    const modalTitle =
        modalMode === "add"
            ? "Add New Patient"
            : modalMode === "edit"
                ? "Edit Patient"
                : "Patient Details";

    const modalSubtitle =
        modalMode === "add"
            ? "Enter patient information below"
            : modalMode === "edit"
                ? "Update patient information below"
                : "Viewing patient record";

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="patients-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="patients-header">

                <div className="patients-header-left">

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
                        <h1>
                            Patients
                        </h1>

                        <p>
                            Manage hospital patients
                            and their information
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="add-patient-button"
                    onClick={openAddModal}
                >
                    <FaPlus />

                    <span>
                        Add Patient
                    </span>
                </button>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="patients-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            handleRefresh()
                        }
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

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="patient-stats">

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaUserInjured />
                    </div>

                    <div>
                        <span>
                            Total Patients
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalPatients}
                        </strong>
                    </div>

                </div>

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaUserInjured />
                    </div>

                    <div>
                        <span>
                            Active Patients
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : activePatients}
                        </strong>
                    </div>

                </div>

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span>
                            Today's Patients
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : todaysPatients}
                        </strong>
                    </div>

                </div>

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaUserInjured />
                    </div>

                    <div>
                        <span>
                            New Patients
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : newPatients}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                PATIENT LIST
            ================================================= */}

            <section className="patients-panel">

                <div className="patients-toolbar">

                    <div>
                        <h2>
                            Patient List
                        </h2>

                        <span>
                            {loading
                                ? "Loading patients..."
                                : `${filteredPatients.length} patients found`}
                        </span>
                    </div>

                    <div className="patient-toolbar-actions">

                        <div className="patient-search">

                            <FaSearch />

                            <input
                                type="text"
                                placeholder="Search patient..."
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
                            className={`patient-refresh-button ${refreshing
                                    ? "is-refreshing"
                                    : ""
                                }`}
                            onClick={handleRefresh}
                            disabled={
                                loading ||
                                refreshing
                            }
                            title="Refresh patients"
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

                    <div className="patients-loading">

                        <FaSyncAlt className="refresh-spinning" />

                        <p>
                            Loading patients...
                        </p>

                    </div>

                ) : (

                    <div className="patients-table-wrapper">

                        <table className="patients-table">

                            <thead>

                                <tr>
                                    <th>
                                        Patient
                                    </th>

                                    <th>
                                        Age
                                    </th>

                                    <th>
                                        Gender
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Registered
                                    </th>

                                    <th>
                                        Action
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredPatients.length > 0 ? (

                                    filteredPatients.map(
                                        (patient) => (

                                            <tr
                                                key={
                                                    patient.id
                                                }
                                            >

                                                {/* PATIENT */}

                                                <td>

                                                    <div className="patient-name">

                                                        <div className="patient-avatar">

                                                            {patient.name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                                "P"}

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    patient.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    patient.patient_code
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* AGE */}

                                                <td>
                                                    {calculateAge(
                                                        patient.date_of_birth
                                                    )}
                                                </td>

                                                {/* GENDER */}

                                                <td>
                                                    {patient.gender
                                                        ? patient.gender
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        patient.gender.slice(
                                                            1
                                                        )
                                                        : "-"}
                                                </td>

                                                {/* PHONE */}

                                                <td>

                                                    <div className="phone-cell">

                                                        <FaPhone />

                                                        {patient.phone ||
                                                            "-"}

                                                    </div>

                                                </td>

                                                {/* DEPARTMENT */}

                                                <td>

                                                    <div className="department-cell">

                                                        <FaHospital />

                                                        Not Assigned

                                                    </div>

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <span className="patient-status active">
                                                        Active
                                                    </span>

                                                </td>

                                                {/* REGISTERED */}

                                                <td>

                                                    <div className="date-cell">

                                                        <FaCalendarAlt />

                                                        {formatDate(
                                                            patient.created_at
                                                        )}

                                                    </div>

                                                </td>

                                                {/* ACTION */}

                                                <td>

                                                    <div className="patient-actions">

                                                        <button
                                                            type="button"
                                                            className="view-action"
                                                            title="View Patient"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    patient
                                                                )
                                                            }
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="edit-action"
                                                            title="Edit Patient"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    patient
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-action"
                                                            title="Delete Patient"
                                                            disabled={
                                                                deletingId ===
                                                                patient.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    patient.id
                                                                )
                                                            }
                                                        >

                                                            {deletingId ===
                                                                patient.id ? (
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
                                            colSpan="8"
                                            className="empty-patients"
                                        >
                                            {search
                                                ? "No patients match your search."
                                                : "No patients found."}
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* =================================================
                MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="patient-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="patient-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="patient-modal-close"
                            onClick={closeModal}
                            title="Close"
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>

                        <div className="patient-modal-icon">
                            <FaUserInjured />
                        </div>

                        <h2>
                            {modalTitle}
                        </h2>

                        <p>
                            {modalSubtitle}
                        </p>

                        {/* =================================================
                            VIEW MODE
                        ================================================= */}

                        {isViewMode ? (

                            <div className="patient-details">

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        <FaUserInjured />
                                        Patient ID
                                    </span>

                                    <span className="patient-detail-value">
                                        {
                                            formData.patient_code
                                        }
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        <FaUserInjured />
                                        Name
                                    </span>

                                    <span className="patient-detail-value">
                                        {
                                            formData.name
                                        }
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        <FaVenusMars />
                                        Age / Gender
                                    </span>

                                    <span className="patient-detail-value">
                                        {
                                            calculateAge(
                                                formData.date_of_birth
                                            )
                                        }{" "}
                                        yrs,{" "}
                                        {
                                            formData.gender
                                        }
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        <FaPhone />
                                        Phone
                                    </span>

                                    <span className="patient-detail-value">
                                        {
                                            formData.phone ||
                                            "-"
                                        }
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        Email
                                    </span>

                                    <span className="patient-detail-value">
                                        {
                                            formData.email ||
                                            "-"
                                        }
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        <FaHospital />
                                        Department
                                    </span>

                                    <span className="patient-detail-value">
                                        Not Assigned
                                    </span>

                                </div>

                                <div className="patient-detail-row">

                                    <span className="patient-detail-label">
                                        Status
                                    </span>

                                    <span className="patient-status active">
                                        Active
                                    </span>

                                </div>

                                <div className="patient-form-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="save-patient-button"
                                        onClick={() => {
                                            const patient =
                                                patients.find(
                                                    (p) =>
                                                        p.id ===
                                                        activePatientId
                                                );

                                            if (patient) {
                                                openEditModal(
                                                    patient
                                                );
                                            }
                                        }}
                                    >
                                        <FaEdit />
                                        Edit Patient
                                    </button>

                                </div>

                            </div>

                        ) : (

                            /* =================================================
                                ADD / EDIT FORM
                            ================================================= */

                            <form
                                className="patient-form"
                                onSubmit={handleSubmit}
                            >

                                <div className="form-group">

                                    <label>
                                        Patient Code
                                    </label>

                                    <input
                                        type="text"
                                        name="patient_code"
                                        placeholder="PID-0001"
                                        value={
                                            formData.patient_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            modalMode ===
                                            "edit"
                                        }
                                    />

                                    {modalMode === "add" && (
                                        <small>
                                            Leave empty to generate
                                            automatically.
                                        </small>
                                    )}

                                </div>

                                <div className="form-group">

                                    <label>
                                        Patient Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter patient name"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <label>
                                            Date of Birth
                                        </label>

                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={
                                                formData.date_of_birth
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Gender
                                        </label>

                                        <select
                                            name="gender"
                                            value={
                                                formData.gender
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="male">
                                                Male
                                            </option>

                                            <option value="female">
                                                Female
                                            </option>

                                            <option value="other">
                                                Other
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter email address"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Blood Group
                                    </label>

                                    <input
                                        type="text"
                                        name="blood_group"
                                        placeholder="Example: O+"
                                        value={
                                            formData.blood_group
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        placeholder="Enter patient address"
                                        value={
                                            formData.address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="3"
                                    />

                                </div>

                                <div className="patient-form-actions">

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
                                        className="save-patient-button"
                                        disabled={saving}
                                    >

                                        {saving ? (
                                            <>
                                                <FaSyncAlt className="refresh-spinning" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                {modalMode ===
                                                    "edit" ? (
                                                    <>
                                                        <FaEdit />
                                                        Save Changes
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPlus />
                                                        Add Patient
                                                    </>
                                                )}
                                            </>
                                        )}

                                    </button>

                                </div>

                            </form>

                        )}

                    </div>

                </div>

            )}

        </main>
    );
}

export default Patients;