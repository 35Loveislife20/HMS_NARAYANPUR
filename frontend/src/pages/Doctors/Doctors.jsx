import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaSearch,
    FaPlus,
    FaUserMd,
    FaEdit,
    FaTrash,
    FaEye,
    FaPhone,
    FaMoneyBillWave,
    FaTimes,
    FaArrowLeft,
    FaSyncAlt,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Doctors.css";

function Doctors() {
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

    const [doctors, setDoctors] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [modalMode, setModalMode] = useState("add");

    const [activeDoctorId, setActiveDoctorId] =
        useState(null);

    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    // =====================================================
    // EMPTY FORM
    // =====================================================

    const emptyForm = {
        name: "",
        doctor_code: "",
        specialization: "",
        phone: "",
        consultation_fee: "",
        department_id: "",
        user_id: "",
    };

    const [formData, setFormData] =
        useState(emptyForm);

    // =====================================================
    // SPECIALIZATIONS
    // =====================================================

    const specializations = [
        "General Medicine",
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "Gynecology",
        "Dermatology",
        "ENT",
        "Ophthalmology",
        "Psychiatry",
        "Dentistry",
        "Radiology",
        "Anesthesiology",
        "Pathology",
        "General Surgery",
    ];

    // =====================================================
    // HEADERS
    // =====================================================

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

    // =====================================================
    // FETCH DOCTORS
    // =====================================================

    const fetchDoctors = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
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
                    "Unable to load doctors."
                );
            }

            if (
                !data.success ||
                !Array.isArray(data.doctors)
            ) {
                throw new Error(
                    "Invalid doctors response."
                );
            }

            setDoctors([...data.doctors]);

        } catch (err) {
            console.error(
                "Fetch Doctors Error:",
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
        fetchDoctors(false);
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

        await fetchDoctors(true);
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredDoctors =
        useMemo(() => {
            const value =
                search
                    .toLowerCase()
                    .trim();

            if (!value) {
                return doctors;
            }

            return doctors.filter(
                (doctor) => {
                    return (
                        String(
                            doctor.name || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            doctor.doctor_code || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            doctor.specialization || ""
                        )
                            .toLowerCase()
                            .includes(value) ||

                        String(
                            doctor.phone || ""
                        )
                            .toLowerCase()
                            .includes(value)
                    );
                }
            );
        }, [doctors, search]);

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        setModalMode("add");

        setActiveDoctorId(null);

        setFormData({
            ...emptyForm,
        });

        setError("");

        setShowModal(true);
    };

    // =====================================================
    // OPEN VIEW MODAL
    // =====================================================

    const openViewModal = (doctor) => {
        setModalMode("view");

        setActiveDoctorId(
            doctor.id
        );

        setFormData({
            name:
                doctor.name ||
                "",

            doctor_code:
                doctor.doctor_code ||
                "",

            specialization:
                doctor.specialization ||
                "",

            phone:
                doctor.phone ||
                "",

            consultation_fee:
                doctor.consultation_fee ||
                "",

            department_id:
                doctor.department_id ||
                "",

            user_id:
                doctor.user_id ||
                "",
        });

        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (doctor) => {
        setModalMode("edit");

        setActiveDoctorId(
            doctor.id
        );

        setFormData({
            name:
                doctor.name ||
                "",

            doctor_code:
                doctor.doctor_code ||
                "",

            specialization:
                doctor.specialization ||
                "",

            phone:
                doctor.phone ||
                "",

            consultation_fee:
                doctor.consultation_fee ||
                "",

            department_id:
                doctor.department_id ||
                "",

            user_id:
                doctor.user_id ||
                "",
        });

        setError("");

        setShowModal(true);
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
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setModalMode("add");

        setActiveDoctorId(null);

        setFormData({
            ...emptyForm,
        });
    };

    // =====================================================
    // ESC CLOSE
    // =====================================================

    useEffect(() => {
        const handleEscape = (
            event
        ) => {
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
    }, [
        showModal,
        saving,
    ]);

    // =====================================================
    // GENERATE DOCTOR CODE
    // =====================================================

    const generateDoctorCode = () => {
        const nextNumber =
            doctors.length + 1;

        return `DOC-${String(
            nextNumber
        ).padStart(3, "0")}`;
    };

    // =====================================================
    // ADD / EDIT DOCTOR
    // =====================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!formData.name.trim()) {
            setError(
                "Doctor name is required."
            );

            return;
        }

        if (!formData.specialization) {
            setError(
                "Please select specialization."
            );

            return;
        }

        try {
            setSaving(true);

            setError("");

            const doctorCode =
                formData.doctor_code.trim() ||
                generateDoctorCode();

            // =================================================
            // REQUEST BODY
            // =================================================

            const requestBody = {
                name:
                    formData.name.trim(),

                doctor_code:
                    doctorCode,

                specialization:
                    formData.specialization.trim() ||
                    null,

                phone:
                    formData.phone.trim() ||
                    null,

                consultation_fee:
                    formData.consultation_fee ||
                    0,

                department_id:
                    formData.department_id
                        ? Number(
                            formData.department_id
                        )
                        : null,

                user_id:
                    formData.user_id
                        ? Number(
                            formData.user_id
                        )
                        : null,
            };

            // =================================================
            // ADD
            // =================================================

            if (
                modalMode === "add"
            ) {
                const response =
                    await fetch(
                        `${API_URL}/doctors`,
                        {
                            method: "POST",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify(
                                    requestBody
                                ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to add doctor."
                    );
                }
            }

            // =================================================
            // EDIT
            // =================================================

            if (
                modalMode === "edit" &&
                activeDoctorId !== null
            ) {
                const response =
                    await fetch(
                        `${API_URL}/doctors/${activeDoctorId}`,
                        {
                            method: "PUT",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify(
                                    requestBody
                                ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to update doctor."
                    );
                }
            }

            // =================================================
            // REFRESH LIST
            // =================================================

            await fetchDoctors(true);

            // =================================================
            // RESET
            // =================================================

            setShowModal(false);

            setModalMode("add");

            setActiveDoctorId(null);

            setFormData({
                ...emptyForm,
            });

        } catch (err) {
            console.error(
                "Save Doctor Error:",
                err
            );

            setError(
                err.message ||
                "Unable to save doctor."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE DOCTOR
    // =====================================================

    const handleDelete = async (
        id
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this doctor?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(id);

            setError("");

            const response =
                await fetch(
                    `${API_URL}/doctors/${id}`,
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
                    "Unable to delete doctor."
                );
            }

            setDoctors(
                (previous) =>
                    previous.filter(
                        (doctor) =>
                            doctor.id !== id
                    )
            );

        } catch (err) {
            console.error(
                "Delete Doctor Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete doctor."
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
            ? "Add New Doctor"
            : modalMode === "edit"
                ? "Edit Doctor"
                : "Doctor Details";

    const modalSubtitle =
        modalMode === "add"
            ? "Enter doctor information below"
            : modalMode === "edit"
                ? "Update doctor information below"
                : "Viewing doctor record";

    // =====================================================
    // AVERAGE CONSULTATION
    // =====================================================

    const averageConsultation =
        doctors.length > 0
            ? doctors.reduce(
                (
                    total,
                    doctor
                ) =>
                    total +
                    Number(
                        doctor.consultation_fee ||
                        0
                    ),
                0
            ) / doctors.length
            : 0;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="doctors-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="doctors-header">

                <div className="doctors-header-left">

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
                            Doctors
                        </h1>

                        <p>
                            Manage hospital doctors
                            and their information
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="add-doctor-button"
                    onClick={
                        openAddModal
                    }
                >
                    <FaPlus />

                    <span>
                        Add Doctor
                    </span>
                </button>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="doctors-error">

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

            <section className="doctor-stats">

                {/* TOTAL */}

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaUserMd />
                    </div>

                    <div>
                        <span>
                            Total Doctors
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : doctors.length}
                        </strong>
                    </div>

                </div>

                {/* ACTIVE */}

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaUserMd />
                    </div>

                    <div>
                        <span>
                            Active Doctors
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : doctors.length}
                        </strong>
                    </div>

                </div>

                {/* AVERAGE FEE */}

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaMoneyBillWave />
                    </div>

                    <div>
                        <span>
                            Avg. Consultation
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : `₹${averageConsultation.toFixed(0)}`}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                DOCTOR LIST
            ================================================= */}

            <section className="doctors-panel">

                {/* TOOLBAR */}

                <div className="doctors-toolbar">

                    <div>
                        <h2>
                            Doctor List
                        </h2>

                        <span>
                            {loading
                                ? "Loading doctors..."
                                : `${filteredDoctors.length} doctors found`}
                        </span>
                    </div>

                    <div className="doctor-toolbar-actions">

                        {/* SEARCH */}

                        <div className="doctor-search">

                            <FaSearch />

                            <input
                                type="text"
                                placeholder="Search doctor..."
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        {/* REFRESH */}

                        <button
                            type="button"
                            className={`doctor-refresh-button ${refreshing
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
                            title="Refresh doctors"
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

                    <div className="doctors-loading">

                        <FaSyncAlt className="refresh-spinning" />

                        <p>
                            Loading doctors...
                        </p>

                    </div>

                ) : (

                    <div className="doctors-table-wrapper">

                        <table className="doctors-table">

                            <thead>

                                <tr>

                                    <th>
                                        Doctor
                                    </th>

                                    <th>
                                        Specialization
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Consultation
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredDoctors.length >
                                    0 ? (

                                    filteredDoctors.map(
                                        (
                                            doctor
                                        ) => (

                                            <tr
                                                key={
                                                    doctor.id
                                                }
                                            >

                                                {/* =================================================
                                                    DOCTOR
                                                ================================================= */}

                                                <td>

                                                    <div className="doctor-name">

                                                        <div className="doctor-avatar">
                                                            <FaUserMd />
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {doctor.name ||
                                                                    "Unnamed Doctor"}
                                                            </strong>

                                                            <span>
                                                                {doctor.doctor_code ||
                                                                    `Doctor ID: ${doctor.id}`}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* =================================================
                                                    SPECIALIZATION
                                                ================================================= */}

                                                <td>

                                                    <span className="specialization-cell">

                                                        {doctor.specialization ||
                                                            "General Medicine"}

                                                    </span>

                                                </td>

                                                {/* =================================================
                                                    PHONE
                                                ================================================= */}

                                                <td>

                                                    <div className="phone-cell">

                                                        <FaPhone />

                                                        {
                                                            doctor.phone ||
                                                            "-"
                                                        }

                                                    </div>

                                                </td>

                                                {/* =================================================
                                                    DEPARTMENT
                                                ================================================= */}

                                                <td>

                                                    <span className="department-cell">

                                                        {doctor.department_id
                                                            ? `Department #${doctor.department_id}`
                                                            : "Not Assigned"}

                                                    </span>

                                                </td>

                                                {/* =================================================
                                                    FEE
                                                ================================================= */}

                                                <td>

                                                    <strong className="fee-cell">

                                                        ₹
                                                        {Number(
                                                            doctor.consultation_fee ||
                                                            0
                                                        ).toFixed(2)}

                                                    </strong>

                                                </td>

                                                {/* =================================================
                                                    ACTION
                                                ================================================= */}

                                                <td>

                                                    <div className="doctor-actions">

                                                        {/* VIEW */}

                                                        <button
                                                            type="button"
                                                            className="view-action"
                                                            title="View Doctor"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    doctor
                                                                )
                                                            }
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        {/* EDIT */}

                                                        <button
                                                            type="button"
                                                            className="edit-action"
                                                            title="Edit Doctor"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    doctor
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        {/* DELETE */}

                                                        <button
                                                            type="button"
                                                            className="delete-action"
                                                            title="Delete Doctor"
                                                            disabled={
                                                                deletingId ===
                                                                doctor.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    doctor.id
                                                                )
                                                            }
                                                        >

                                                            {deletingId ===
                                                                doctor.id ? (
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
                                            colSpan="6"
                                            className="empty-doctors"
                                        >

                                            {search
                                                ? "No doctors match your search."
                                                : "No doctors found."}

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
                    className="doctor-modal-overlay"
                    onClick={
                        closeModal
                    }
                >

                    <div
                        className="doctor-modal"
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >

                        {/* CLOSE */}

                        <button
                            type="button"
                            className="doctor-modal-close"
                            onClick={
                                closeModal
                            }
                            title="Close"
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>

                        {/* ICON */}

                        <div className="doctor-modal-icon">
                            <FaUserMd />
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

                            <div className="doctor-details">

                                {/* NAME */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        <FaUserMd />
                                        Doctor Name
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.name ||
                                            "Unnamed Doctor"}
                                    </span>

                                </div>

                                {/* CODE */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        <FaUserMd />
                                        Doctor Code
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.doctor_code ||
                                            "-"}
                                    </span>

                                </div>

                                {/* SPECIALIZATION */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        Specialization
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.specialization ||
                                            "General Medicine"}
                                    </span>

                                </div>

                                {/* PHONE */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        <FaPhone />
                                        Phone
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.phone ||
                                            "-"}
                                    </span>

                                </div>

                                {/* FEE */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        <FaMoneyBillWave />
                                        Consultation Fee
                                    </span>

                                    <span className="doctor-detail-value">
                                        ₹
                                        {Number(
                                            formData.consultation_fee ||
                                            0
                                        ).toFixed(2)}
                                    </span>

                                </div>

                                {/* DEPARTMENT */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        Department
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.department_id
                                            ? `Department #${formData.department_id}`
                                            : "Not Assigned"}
                                    </span>

                                </div>

                                {/* USER */}

                                <div className="doctor-detail-row">

                                    <span className="doctor-detail-label">
                                        User ID
                                    </span>

                                    <span className="doctor-detail-value">
                                        {formData.user_id ||
                                            "Not Assigned"}
                                    </span>

                                </div>

                                {/* ACTIONS */}

                                <div className="doctor-form-actions">

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
                                        className="save-doctor-button"
                                        onClick={() => {

                                            const doctor =
                                                doctors.find(
                                                    (
                                                        item
                                                    ) =>
                                                        item.id ===
                                                        activeDoctorId
                                                );

                                            if (
                                                doctor
                                            ) {
                                                openEditModal(
                                                    doctor
                                                );
                                            }

                                        }}
                                    >

                                        <FaEdit />

                                        Edit Doctor

                                    </button>

                                </div>

                            </div>

                        ) : (

                            /* =================================================
                                ADD / EDIT MODE
                            ================================================= */

                            <form
                                className="doctor-form"
                                onSubmit={
                                    handleSubmit
                                }
                            >

                                {/* =================================================
                                    DOCTOR NAME
                                ================================================= */}

                                <div className="form-group">

                                    <label>
                                        Doctor Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Dr. Rahul Sharma"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                {/* =================================================
                                    DOCTOR CODE
                                ================================================= */}

                                <div className="form-group">

                                    <label>
                                        Doctor Code
                                    </label>

                                    <input
                                        type="text"
                                        name="doctor_code"
                                        placeholder="DOC-001"
                                        value={
                                            formData.doctor_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            modalMode ===
                                            "edit"
                                        }
                                    />

                                    {modalMode ===
                                        "add" && (
                                            <small>
                                                Leave empty to generate automatically.
                                            </small>
                                        )}

                                </div>

                                {/* =================================================
                                    SPECIALIZATION
                                ================================================= */}

                                <div className="form-group">

                                    <label>
                                        Specialization
                                    </label>

                                    <select
                                        name="specialization"
                                        value={
                                            formData.specialization
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Specialization
                                        </option>

                                        {specializations.map(
                                            (
                                                specialization
                                            ) => (
                                                <option
                                                    key={
                                                        specialization
                                                    }
                                                    value={
                                                        specialization
                                                    }
                                                >
                                                    {
                                                        specialization
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* =================================================
                                    PHONE + FEE
                                ================================================= */}

                                <div className="form-row">

                                    {/* PHONE */}

                                    <div className="form-group">

                                        <label>
                                            Phone
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

                                    {/* FEE */}

                                    <div className="form-group">

                                        <label>
                                            Consultation Fee
                                        </label>

                                        <input
                                            type="number"
                                            name="consultation_fee"
                                            min="0"
                                            step="0.01"
                                            placeholder="500"
                                            value={
                                                formData.consultation_fee
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                </div>

                                {/* =================================================
                                    DEPARTMENT + USER
                                ================================================= */}

                                <div className="form-row">

                                    {/* DEPARTMENT */}

                                    <div className="form-group">

                                        <label>
                                            Department ID
                                        </label>

                                        <input
                                            type="number"
                                            name="department_id"
                                            min="1"
                                            placeholder="Optional"
                                            value={
                                                formData.department_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                    {/* USER */}

                                    <div className="form-group">

                                        <label>
                                            User ID
                                        </label>

                                        <input
                                            type="number"
                                            name="user_id"
                                            min="1"
                                            placeholder="Optional"
                                            value={
                                                formData.user_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                </div>

                                {/* =================================================
                                    FORM ACTIONS
                                ================================================= */}

                                <div className="doctor-form-actions">

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
                                        className="save-doctor-button"
                                        disabled={
                                            saving
                                        }
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
                                                        Add Doctor
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

export default Doctors;