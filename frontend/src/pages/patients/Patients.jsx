import { useEffect, useMemo, useState } from "react";
import {
    FaPlus,
    FaSyncAlt,
    FaSearch,
    FaEdit,
    FaTrash,
    FaEye,
    FaTimes,
    FaUserInjured,
    FaPhone,
    FaEnvelope,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaTint,
    FaVenusMars,
    FaExclamationTriangle,
} from "react-icons/fa";

import "./Patients.css";

function Patients() {
    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATE
    // =====================================================

    const [patients, setPatients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const [editingPatient, setEditingPatient] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        gender: "male",
        date_of_birth: "",
        phone: "",
        email: "",
        address: "",
        blood_group: "",
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
            Authorization: `Bearer ${token} `,
        };
    };

    // =====================================================
    // FETCH PATIENTS
    // =====================================================

    const fetchPatients = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/patients`,
                {
                    method: "GET",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load patients."
                );
            }

            if (
                data.success === false
            ) {
                throw new Error(
                    data.message ||
                    "Unable to load patients."
                );
            }

            setPatients(
                Array.isArray(data.patients)
                    ? data.patients
                    : []
            );
        } catch (err) {
            console.error(
                "Fetch Patients Error:",
                err
            );

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
        fetchPatients(true);
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
            await fetchPatients(false);
        } finally {
            setRefreshing(false);
        }
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredPatients = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return patients;
        }

        return patients.filter((patient) => {
            return (
                String(
                    patient.patient_code || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    patient.name || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    patient.phone || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    patient.email || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    patient.gender || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    patient.blood_group || ""
                )
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [patients, search]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalPatients = patients.length;

    const malePatients = patients.filter(
        (patient) =>
            String(
                patient.gender || ""
            ).toLowerCase() === "male"
    ).length;

    const femalePatients = patients.filter(
        (patient) =>
            String(
                patient.gender || ""
            ).toLowerCase() === "female"
    ).length;

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {
        setFormData({
            name: "",
            gender: "male",
            date_of_birth: "",
            phone: "",
            email: "",
            address: "",
            blood_group: "",
        });
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        resetForm();

        setEditingPatient(null);

        setError("");

        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (patient) => {
        setEditingPatient(patient);

        setFormData({
            name: patient.name || "",

            gender:
                patient.gender || "male",

            date_of_birth:
                patient.date_of_birth
                    ? String(
                        patient.date_of_birth
                    ).slice(0, 10)
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

        setError("");

        setShowModal(true);
    };

    // =====================================================
    // OPEN VIEW MODAL
    // =====================================================

    const openViewModal = (patient) => {
        setSelectedPatient(patient);

        setShowViewModal(true);
    };

    // =====================================================
    // CLOSE MODALS
    // =====================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingPatient(null);

        resetForm();
    };

    const closeViewModal = () => {
        setShowViewModal(false);

        setSelectedPatient(null);
    };

    // =====================================================
    // SAVE PATIENT
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.name.trim()) {
            setError(
                "Patient name is required."
            );

            return;
        }

        try {
            setSaving(true);

            setError("");

            const isEdit =
                Boolean(editingPatient);

            const url = isEdit
                ? `${API_URL}/patients/${editingPatient.id}`
                : `${API_URL}/patients`;

            const method = isEdit
                ? "PUT"
                : "POST";

            const body = {
                name:
                    formData.name.trim(),

                gender:
                    formData.gender || "male",

                date_of_birth:
                    formData.date_of_birth ||
                    null,

                phone:
                    formData.phone.trim(),

                email:
                    formData.email.trim(),

                address:
                    formData.address.trim(),

                blood_group:
                    formData.blood_group || "",
            };

            const response =
                await fetch(url, {
                    method,
                    headers: getHeaders(),
                    body: JSON.stringify(body),
                });

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to save patient."
                );
            }

            if (
                data.success === false
            ) {
                throw new Error(
                    data.message ||
                    "Unable to save patient."
                );
            }

            setShowModal(false);

            setEditingPatient(null);

            resetForm();

            await fetchPatients(false);
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

    const handleDelete = async (patient) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${patient.name}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(patient.id);

            setError("");

            const response =
                await fetch(
                    `${API_URL}/patients/${patient.id}`,
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
                    "Unable to delete patient."
                );
            }

            if (
                data.success === false
            ) {
                throw new Error(
                    data.message ||
                    "Unable to delete patient."
                );
            }

            await fetchPatients(false);
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
            setDeleteLoading(null);
        }
    };

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        const parsed =
            new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "N/A";
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

    // =====================================================
    // GENDER TEXT
    // =====================================================

    const getGenderText = (gender) => {
        const value =
            String(
                gender || ""
            ).toLowerCase();

        switch (value) {
            case "male":
                return "Male";

            case "female":
                return "Female";

            case "other":
                return "Other";

            default:
                return "N/A";
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="patients-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <header className="patients-header">

                <div>
                    <h1>
                        Patients
                    </h1>

                    <p>
                        Manage hospital patients
                        and their information
                    </p>
                </div>

                <div className="patients-actions">

                    <button
                        type="button"
                        className="patients-refresh"
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

                    <button
                        type="button"
                        className="patients-add"
                        onClick={
                            openAddModal
                        }
                    >
                        <FaPlus />

                        <span>
                            Add Patient
                        </span>
                    </button>

                </div>

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
                        onClick={() => {
                            setError("");

                            fetchPatients(true);
                        }}
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* =================================================
                SUMMARY CARDS
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
                            {totalPatients}
                        </strong>
                    </div>

                </div>

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaVenusMars />
                    </div>

                    <div>
                        <span>
                            Male Patients
                        </span>

                        <strong>
                            {malePatients}
                        </strong>
                    </div>

                </div>

                <div className="patient-stat-card">

                    <div className="patient-stat-icon">
                        <FaVenusMars />
                    </div>

                    <div>
                        <span>
                            Female Patients
                        </span>

                        <strong>
                            {femalePatients}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                PATIENT LIST
            ================================================= */}

            <section className="patients-card">

                <div className="patients-panel-header">

                    <div>
                        <h2>
                            Patient List
                        </h2>

                        <p>
                            {filteredPatients.length}{" "}
                            patient
                            {filteredPatients.length !==
                                1
                                ? "s"
                                : ""}{" "}
                            found
                        </p>
                    </div>

                    <div className="patients-toolbar">

                        <div className="patients-search">

                            <FaSearch />

                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
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

                    </div>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="patients-loading">

                        <FaSyncAlt className="spin" />

                        <span>
                            Loading patients...
                        </span>

                    </div>
                ) : filteredPatients.length ===
                    0 ? (
                    <div className="patients-empty">

                        <FaUserInjured />

                        <h3>
                            No patients found
                        </h3>

                        <p>
                            {search
                                ? "Try a different search."
                                : "Add your first patient to get started."}
                        </p>

                        {!search && (
                            <button
                                type="button"
                                onClick={
                                    openAddModal
                                }
                            >
                                <FaPlus />

                                Add Patient
                            </button>
                        )}

                    </div>
                ) : (
                    <div className="patients-table-wrapper">

                        <table className="patients-table">

                            <thead>
                                <tr>

                                    <th>
                                        Patient ID
                                    </th>

                                    <th>
                                        Patient
                                    </th>

                                    <th>
                                        Gender
                                    </th>

                                    <th>
                                        Date of Birth
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Blood Group
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredPatients.map(
                                    (patient) => {
                                        const name =
                                            patient.name ||
                                            "Unknown Patient";

                                        const firstLetter =
                                            name
                                                .charAt(
                                                    0
                                                )
                                                .toUpperCase();

                                        return (
                                            <tr
                                                key={
                                                    patient.id
                                                }
                                            >

                                                {/* PATIENT ID */}

                                                <td>
                                                    <strong className="patient-code">
                                                        {patient.patient_code ||
                                                            `P-${patient.id}`}
                                                    </strong>
                                                </td>

                                                {/* PATIENT */}

                                                <td>

                                                    <div className="patient-name">

                                                        <div className="patient-avatar">
                                                            {
                                                                firstLetter
                                                            }
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {patient.email ||
                                                                    "No email"}
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* GENDER */}

                                                <td>
                                                    <span className="gender-badge">
                                                        {getGenderText(
                                                            patient.gender
                                                        )}
                                                    </span>
                                                </td>

                                                {/* DOB */}

                                                <td>
                                                    {formatDate(
                                                        patient.date_of_birth
                                                    )}
                                                </td>

                                                {/* PHONE */}

                                                <td>
                                                    <div className="table-contact">
                                                        <FaPhone />

                                                        <span>
                                                            {patient.phone ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* BLOOD GROUP */}

                                                <td>
                                                    <span className="blood-badge">
                                                        {patient.blood_group ||
                                                            "-"}
                                                    </span>
                                                </td>

                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="patient-row-actions">

                                                        <button
                                                            type="button"
                                                            className="action-btn view"
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
                                                            className="action-btn edit edit-button"
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
                                                            className="action-btn delete delete-button"
                                                            title="Delete Patient"
                                                            disabled={
                                                                deleteLoading ===
                                                                patient.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    patient
                                                                )
                                                            }
                                                        >
                                                            {deleteLoading ===
                                                                patient.id ? (
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
                    className="patient-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="patient-modal">

                        <div className="patient-modal-header">

                            <div>

                                <h2>
                                    {editingPatient
                                        ? "Edit Patient"
                                        : "Add Patient"}
                                </h2>

                                <p>
                                    {editingPatient
                                        ? "Update patient information"
                                        : "Enter patient information"}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="patient-form"
                        >

                            <div className="form-grid">

                                {/* NAME */}

                                <div className="form-group full">

                                    <label>
                                        Full Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={
                                            formData.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter patient name"
                                        required
                                    />

                                </div>

                                {/* GENDER */}

                                <div className="form-group">

                                    <label>
                                        Gender *
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

                                {/* DOB */}

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

                                {/* PHONE */}

                                <div className="form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={
                                            formData.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="9876543210"
                                    />

                                </div>

                                {/* EMAIL */}

                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="patient@email.com"
                                    />

                                </div>

                                {/* BLOOD GROUP */}

                                <div className="form-group">

                                    <label>
                                        Blood Group
                                    </label>

                                    <select
                                        name="blood_group"
                                        value={
                                            formData.blood_group
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="">
                                            Select Blood Group
                                        </option>

                                        <option value="A+">
                                            A+
                                        </option>

                                        <option value="A-">
                                            A-
                                        </option>

                                        <option value="B+">
                                            B+
                                        </option>

                                        <option value="B-">
                                            B-
                                        </option>

                                        <option value="AB+">
                                            AB+
                                        </option>

                                        <option value="AB-">
                                            AB-
                                        </option>

                                        <option value="O+">
                                            O+
                                        </option>

                                        <option value="O-">
                                            O-
                                        </option>

                                    </select>

                                </div>

                                {/* ADDRESS */}

                                <div className="form-group full">

                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={
                                            formData.address
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="3"
                                        placeholder="Enter patient address"
                                    />

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="patient-form-actions">

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
                                    className="save-button"
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
                                            {editingPatient
                                                ? "Update Patient"
                                                : "Save Patient"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
                VIEW PATIENT MODAL
            ================================================= */}

            {showViewModal &&
                selectedPatient && (
                    <div
                        className="patient-modal-overlay"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div className="patient-view-modal">

                            {/* HEADER */}

                            <div className="patient-modal-header">

                                <div>

                                    <h2>
                                        Patient Details
                                    </h2>

                                    <p>
                                        Complete patient
                                        information
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FaTimes />
                                </button>

                            </div>

                            {/* PROFILE */}

                            <div className="patient-profile">

                                <div className="large-patient-avatar">

                                    {(
                                        selectedPatient.name ||
                                        "P"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}

                                </div>

                                <div>

                                    <h3>
                                        {
                                            selectedPatient.name
                                        }
                                    </h3>

                                    <p>
                                        {selectedPatient.patient_code ||
                                            `P-${selectedPatient.id}`}
                                    </p>

                                </div>

                            </div>

                            {/* DETAILS */}

                            <div className="patient-detail-grid">

                                <div className="patient-detail-item">

                                    <FaUserInjured />

                                    <div>
                                        <span>
                                            Patient ID
                                        </span>

                                        <strong>
                                            {selectedPatient.patient_code ||
                                                `P-${selectedPatient.id}`}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item">

                                    <FaVenusMars />

                                    <div>
                                        <span>
                                            Gender
                                        </span>

                                        <strong>
                                            {getGenderText(
                                                selectedPatient.gender
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item">

                                    <FaCalendarAlt />

                                    <div>
                                        <span>
                                            Date of Birth
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedPatient.date_of_birth
                                            )}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item">

                                    <FaPhone />

                                    <div>
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {selectedPatient.phone ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item">

                                    <FaEnvelope />

                                    <div>
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {selectedPatient.email ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item">

                                    <FaTint />

                                    <div>
                                        <span>
                                            Blood Group
                                        </span>

                                        <strong>
                                            {selectedPatient.blood_group ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                </div>

                                <div className="patient-detail-item patient-address-item">

                                    <FaMapMarkerAlt />

                                    <div>
                                        <span>
                                            Address
                                        </span>

                                        <strong>
                                            {selectedPatient.address ||
                                                "N/A"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="patient-view-footer">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="save-button"
                                    onClick={() => {
                                        const patient =
                                            selectedPatient;

                                        closeViewModal();

                                        openEditModal(
                                            patient
                                        );
                                    }}
                                >
                                    <FaEdit />

                                    Edit Patient
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </main>
    );
}

export default Patients;