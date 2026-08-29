import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSyncAlt,
    FaSearch,
    FaEdit,
    FaTrash,
    FaEye,
    FaTimes,
    FaUserMd,
    FaPhone,
    FaEnvelope,
    FaGraduationCap,
    FaBriefcase,
    FaMoneyBillWave,
    FaBuilding,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Doctors.css";

function Doctors() {
    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATE
    // =====================================================

    const [doctors, setDoctors] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingDoctor, setEditingDoctor] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const [saving, setSaving] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(null);

    const [form, setForm] = useState({
        doctor_code: "",
        name: "",
        specialization: "",
        qualification: "",
        phone: "",
        email: "",
        experience_years: "",
        consultation_fee: "",
        department_id: "",
        hospital_id: "",
        status: "available",
    });

    // =====================================================
    // AUTH HEADERS
    // =====================================================

    const getHeaders = () => {
        const token = localStorage.getItem("hms_token");

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

    // =====================================================
    // FETCH DOCTORS
    // =====================================================

    const fetchDoctors = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/doctors`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load doctors."
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load doctors."
                );
            }

            setDoctors(
                Array.isArray(data.doctors)
                    ? data.doctors
                    : []
            );
        } catch (err) {
            console.error(
                "Fetch Doctors Error:",
                err
            );

            setDoctors([]);

            setError(
                err.message ||
                "Unable to connect to server."
            );
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchDoctors(true);
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        if (refreshing) {
            return;
        }

        try {
            setRefreshing(true);

            await fetchDoctors(false);
        } finally {
            setRefreshing(false);
        }
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredDoctors = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        if (!query) {
            return doctors;
        }

        return doctors.filter((doctor) => {
            return (
                String(
                    doctor.doctor_code || ""
                )
                    .toLowerCase()
                    .includes(query) ||
                String(
                    doctor.name || ""
                )
                    .toLowerCase()
                    .includes(query) ||
                String(
                    doctor.specialization || ""
                )
                    .toLowerCase()
                    .includes(query) ||
                String(
                    doctor.phone || ""
                )
                    .toLowerCase()
                    .includes(query) ||
                String(
                    doctor.email || ""
                )
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [doctors, search]);

    // =====================================================
    // TOTAL DOCTORS
    // =====================================================

    const totalDoctors = doctors.length;

    // =====================================================
    // AVAILABLE DOCTORS
    // =====================================================

    const availableDoctors = doctors.filter(
        (doctor) =>
            String(
                doctor.status || ""
            ).toLowerCase() === "available"
    ).length;

    // =====================================================
    // AVERAGE CONSULTATION FEE
    // =====================================================

    const averageConsultation =
        doctors.length > 0
            ? doctors.reduce(
                (total, doctor) => {
                    return (
                        total +
                        Number(
                            doctor.consultation_fee ||
                            0
                        )
                    );
                },
                0
            ) / doctors.length
            : 0;

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {
        setForm({
            doctor_code: "",
            name: "",
            specialization: "",
            qualification: "",
            phone: "",
            email: "",
            experience_years: "",
            consultation_fee: "",
            department_id: "",
            hospital_id: "",
            status: "available",
        });
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = async () => {
        resetForm();

        setEditingDoctor(null);

        setShowModal(true);

        try {
            const response = await fetch(
                `${API_URL}/doctors/next-code`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data =
                await response.json();

            if (
                response.ok &&
                data.success
            ) {
                const nextCode =
                    data.doctor_code ||
                    data.nextCode ||
                    data.code ||
                    "";

                setForm((previous) => ({
                    ...previous,
                    doctor_code:
                        nextCode,
                }));
            }
        } catch (err) {
            console.error(
                "Next Doctor Code Error:",
                err
            );
        }
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (doctor) => {
        setEditingDoctor(doctor);

        setForm({
            doctor_code:
                doctor.doctor_code || "",

            name:
                doctor.name || "",

            specialization:
                doctor.specialization || "",

            qualification:
                doctor.qualification || "",

            phone:
                doctor.phone || "",

            email:
                doctor.email || "",

            experience_years:
                doctor.experience_years ??
                "",

            consultation_fee:
                doctor.consultation_fee ??
                "",

            department_id:
                doctor.department_id ??
                "",

            hospital_id:
                doctor.hospital_id ??
                "",

            status:
                doctor.status ||
                "available",
        });

        setShowModal(true);
    };

    // =====================================================
    // VIEW DOCTOR
    // =====================================================

    const openViewModal = (doctor) => {
        setSelectedDoctor(doctor);

        setShowViewModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingDoctor(null);

        resetForm();
    };

    const closeViewModal = () => {
        setShowViewModal(false);

        setSelectedDoctor(null);
    };

    // =====================================================
    // SAVE DOCTOR
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            setError(
                "Doctor name is required."
            );

            return;
        }

        try {
            setSaving(true);

            setError("");

            const isEdit =
                Boolean(editingDoctor);

            const url = isEdit
                ? `${API_URL}/doctors/${editingDoctor.id}`
                : `${API_URL}/doctors`;

            const method = isEdit
                ? "PUT"
                : "POST";

            const body = {
                doctor_code:
                    form.doctor_code.trim(),

                name:
                    form.name.trim(),

                specialization:
                    form.specialization.trim(),

                qualification:
                    form.qualification.trim(),

                phone:
                    form.phone.trim(),

                email:
                    form.email.trim(),

                experience_years:
                    form.experience_years ===
                        ""
                        ? 0
                        : Number(
                            form.experience_years
                        ),

                consultation_fee:
                    form.consultation_fee ===
                        ""
                        ? 0
                        : Number(
                            form.consultation_fee
                        ),

                department_id:
                    form.department_id ===
                        ""
                        ? null
                        : Number(
                            form.department_id
                        ),

                hospital_id:
                    form.hospital_id ===
                        ""
                        ? null
                        : Number(
                            form.hospital_id
                        ),

                status:
                    form.status ||
                    "available",
            };

            const response = await fetch(
                url,
                {
                    method,
                    headers: getHeaders(),
                    body: JSON.stringify(
                        body
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to save doctor."
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to save doctor."
                );
            }

            setShowModal(false);

            setEditingDoctor(null);

            resetForm();

            await fetchDoctors(false);
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

    const handleDelete = async (doctor) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${doctor.name}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(
                doctor.id
            );

            setError("");

            const response = await fetch(
                `${API_URL}/doctors/${doctor.id}`,
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
                    "Unable to delete doctor."
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to delete doctor."
                );
            }

            await fetchDoctors(false);
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
            setDeleteLoading(null);
        }
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {
        switch (
        String(
            status || ""
        ).toLowerCase()
        ) {
            case "available":
                return "available";

            case "busy":
                return "busy";

            case "offline":
                return "offline";

            default:
                return "offline";
        }
    };

    // =====================================================
    // STATUS TEXT
    // =====================================================

    const getStatusText = (status) => {
        switch (
        String(
            status || ""
        ).toLowerCase()
        ) {
            case "available":
                return "Available";

            case "busy":
                return "Busy";

            case "offline":
                return "Offline";

            default:
                return "Offline";
        }
    };

    // =====================================================
    // FORMAT CURRENCY
    // =====================================================

    const formatCurrency = (value) => {
        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="doctors-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <header className="doctors-header">

                <div>
                    <h1>Doctors</h1>

                    <p>
                        Manage hospital doctors
                        and their information
                    </p>
                </div>

                <button
                    type="button"
                    className="add-doctor-btn"
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
                        onClick={() => {
                            setError("");
                            fetchDoctors(true);
                        }}
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <section className="doctor-stats">

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaUserMd />
                    </div>

                    <div>
                        <span>
                            Total Doctors
                        </span>

                        <strong>
                            {totalDoctors}
                        </strong>
                    </div>

                </div>

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaUserMd />
                    </div>

                    <div>
                        <span>
                            Available
                        </span>

                        <strong>
                            {availableDoctors}
                        </strong>
                    </div>

                </div>

                <div className="doctor-stat-card">

                    <div className="doctor-stat-icon">
                        <FaMoneyBillWave />
                    </div>

                    <div>
                        <span>
                            Avg. Consultation
                        </span>

                        <strong>
                            ₹
                            {averageConsultation.toFixed(
                                2
                            )}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                DOCTOR LIST
            ================================================= */}

            <section className="doctors-panel">

                <div className="doctors-panel-header">

                    <div>
                        <h2>
                            Doctor List
                        </h2>

                        <p>
                            {filteredDoctors.length}{" "}
                            doctor
                            {filteredDoctors.length !==
                                1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>

                    <div className="doctor-tools">

                        <div className="doctor-search">

                            <FaSearch />

                            <input
                                type="text"
                                placeholder="Search doctors..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch(
                                            ""
                                        )
                                    }
                                >
                                    <FaTimes />
                                </button>
                            )}

                        </div>

                        <button
                            type="button"
                            className="refresh-btn"
                            onClick={
                                handleRefresh
                            }
                            disabled={
                                refreshing
                            }
                        >
                            <FaSyncAlt
                                className={
                                    refreshing
                                        ? "spin"
                                        : ""
                                }
                            />

                            <span>
                                Refresh
                            </span>
                        </button>

                    </div>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="doctor-loading">

                        <FaSyncAlt className="spin" />

                        <span>
                            Loading doctors...
                        </span>

                    </div>
                ) : filteredDoctors.length ===
                    0 ? (
                    <div className="doctor-empty">

                        <FaUserMd />

                        <h3>
                            No doctors found
                        </h3>

                        <p>
                            {search
                                ? "Try a different search."
                                : "Add your first doctor to get started."}
                        </p>

                    </div>
                ) : (
                    <div className="doctor-table-wrapper">

                        <table className="doctor-table">

                            <thead>
                                <tr>
                                    <th>
                                        Doctor ID
                                    </th>

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
                                        Experience
                                    </th>

                                    <th>
                                        Consultation
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

                                {filteredDoctors.map(
                                    (doctor) => {
                                        const name =
                                            doctor.name ||
                                            "Unknown Doctor";

                                        const firstLetter =
                                            name
                                                .charAt(
                                                    0
                                                )
                                                .toUpperCase();

                                        return (
                                            <tr
                                                key={
                                                    doctor.id
                                                }
                                            >

                                                {/* ID */}

                                                <td>
                                                    <strong className="doctor-code">
                                                        {doctor.doctor_code ||
                                                            `D-${doctor.id}`}
                                                    </strong>
                                                </td>

                                                {/* DOCTOR */}

                                                <td>

                                                    <div className="doctor-person">

                                                        <div className="doctor-avatar">
                                                            {firstLetter}
                                                        </div>

                                                        <div className="doctor-person-info">

                                                            <strong>
                                                                {
                                                                    name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {doctor.email ||
                                                                    "No email"}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* SPECIALIZATION */}

                                                <td>
                                                    <span className="specialization">
                                                        {doctor.specialization ||
                                                            "General Medicine"}
                                                    </span>
                                                </td>

                                                {/* PHONE */}

                                                <td>
                                                    <div className="table-contact">
                                                        <FaPhone />

                                                        <span>
                                                            {doctor.phone ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* EXPERIENCE */}

                                                <td>
                                                    <strong>
                                                        {Number(
                                                            doctor.experience_years ||
                                                            0
                                                        )}{" "}
                                                        yrs
                                                    </strong>
                                                </td>

                                                {/* FEE */}

                                                <td>
                                                    <strong className="consultation-fee">
                                                        ₹
                                                        {formatCurrency(
                                                            doctor.consultation_fee
                                                        )}
                                                    </strong>
                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`doctor-status ${getStatusClass(
                                                            doctor.status
                                                        )}`}
                                                    >
                                                        <span className="status-dot"></span>

                                                        {getStatusText(
                                                            doctor.status
                                                        )}
                                                    </span>

                                                </td>

                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="doctor-actions">

                                                        <button
                                                            type="button"
                                                            className="action-btn view"
                                                            title="View Doctor"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    doctor
                                                                )
                                                            }
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="action-btn edit"
                                                            title="Edit Doctor"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    doctor
                                                                )
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="action-btn delete"
                                                            title="Delete Doctor"
                                                            disabled={
                                                                deleteLoading ===
                                                                doctor.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    doctor
                                                                )
                                                            }
                                                        >
                                                            {deleteLoading ===
                                                                doctor.id ? (
                                                                <FaSyncAlt className="spin" />
                                                            ) : (
                                                                <FaTrash />
                                                            )}
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="doctor-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="doctor-modal">

                        <div className="doctor-modal-header">

                            <div>
                                <h2>
                                    {editingDoctor
                                        ? "Edit Doctor"
                                        : "Add Doctor"}
                                </h2>

                                <p>
                                    {editingDoctor
                                        ? "Update doctor information"
                                        : "Enter doctor information"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="doctor-form-grid">

                                <div className="form-group">

                                    <label>
                                        Doctor Code
                                    </label>

                                    <input
                                        type="text"
                                        name="doctor_code"
                                        value={
                                            form.doctor_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="D-20260001"
                                        readOnly={
                                            Boolean(
                                                editingDoctor
                                            )
                                        }
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Doctor Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={
                                            form.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Dr. John Doe"
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Specialization
                                    </label>

                                    <input
                                        type="text"
                                        name="specialization"
                                        value={
                                            form.specialization
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Cardiology"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Qualification
                                    </label>

                                    <input
                                        type="text"
                                        name="qualification"
                                        value={
                                            form.qualification
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="MBBS, MD"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={
                                            form.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="9876543210"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            form.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="doctor@hms.com"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Experience
                                        (Years)
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        name="experience_years"
                                        value={
                                            form.experience_years
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="10"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Consultation
                                        Fee
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="consultation_fee"
                                        value={
                                            form.consultation_fee
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="500"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Department ID
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        name="department_id"
                                        value={
                                            form.department_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Optional"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Hospital ID
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        name="hospital_id"
                                        value={
                                            form.hospital_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Optional"
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            form.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="available">
                                            Available
                                        </option>

                                        <option value="busy">
                                            Busy
                                        </option>

                                        <option value="offline">
                                            Offline
                                        </option>
                                    </select>

                                </div>

                            </div>

                            <div className="doctor-modal-footer">

                                <button
                                    type="button"
                                    className="cancel-btn"
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
                                    className="save-doctor-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="spin" />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingDoctor
                                                ? "Update Doctor"
                                                : "Save Doctor"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            {showViewModal &&
                selectedDoctor && (
                    <div
                        className="doctor-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div className="doctor-view-modal">

                            <div className="doctor-modal-header">

                                <div>
                                    <h2>
                                        Doctor Details
                                    </h2>

                                    <p>
                                        Complete doctor
                                        information
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FaTimes />
                                </button>

                            </div>

                            <div className="doctor-profile">

                                <div className="large-doctor-avatar">
                                    {(
                                        selectedDoctor.name ||
                                        "D"
                                    )
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()}
                                </div>

                                <div>

                                    <h3>
                                        {
                                            selectedDoctor.name
                                        }
                                    </h3>

                                    <p>
                                        {
                                            selectedDoctor.specialization ||
                                            "General Medicine"
                                        }
                                    </p>

                                    <span
                                        className={`doctor-status ${getStatusClass(
                                            selectedDoctor.status
                                        )}`}
                                    >
                                        <span className="status-dot"></span>

                                        {getStatusText(
                                            selectedDoctor.status
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div className="doctor-detail-grid">

                                <div className="detail-item">

                                    <FaUserMd />

                                    <div>
                                        <span>
                                            Doctor ID
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.doctor_code
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaEnvelope />

                                    <div>
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.email ||
                                                "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaPhone />

                                    <div>
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.phone ||
                                                "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaGraduationCap />

                                    <div>
                                        <span>
                                            Qualification
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.qualification ||
                                                "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaBriefcase />

                                    <div>
                                        <span>
                                            Experience
                                        </span>

                                        <strong>
                                            {Number(
                                                selectedDoctor.experience_years ||
                                                0
                                            )}{" "}
                                            years
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaMoneyBillWave />

                                    <div>
                                        <span>
                                            Consultation
                                            Fee
                                        </span>

                                        <strong>
                                            ₹
                                            {formatCurrency(
                                                selectedDoctor.consultation_fee
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaBuilding />

                                    <div>
                                        <span>
                                            Department
                                            ID
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.department_id ||
                                                "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-item">

                                    <FaBuilding />

                                    <div>
                                        <span>
                                            Hospital ID
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.hospital_id ||
                                                "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div className="doctor-view-footer">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="save-doctor-btn"
                                    onClick={() => {
                                        closeViewModal();

                                        openEditModal(
                                            selectedDoctor
                                        );
                                    }}
                                >
                                    <FaEdit />

                                    Edit Doctor
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </main>
    );
}

export default Doctors;