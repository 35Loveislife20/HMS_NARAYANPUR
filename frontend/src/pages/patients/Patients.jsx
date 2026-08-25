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

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    const user =
        JSON.parse(localStorage.getItem("hms_user")) || {};
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
    const [activePatientId, setActivePatientId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // =====================================================
    // EMPTY FORM — no patient_code field
    // =====================================================

    const emptyForm = {
        name: "",
        gender: "male",
        date_of_birth: "",
        phone: "",
        email: "",
        address: "",
        blood_group: "",
    };

    const [formData, setFormData] = useState(emptyForm);

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

            const token = localStorage.getItem("hms_token");

            const response = await fetch(`${API_URL}/patients`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && {
                        Authorization: `Bearer ${token}`,
                    }),
                },
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load patients"
                );
            }

            if (!data.success || !Array.isArray(data.patients)) {
                throw new Error("Invalid patients response");
            }

            setPatients([...data.patients]);

        } catch (err) {
            console.error("Fetch Patients Error:", err);
            setError(err.message || "Unable to connect to HMS server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPatients(false);
    }, []);

    const handleRefresh = async () => {
        if (loading || refreshing) return;
        await fetchPatients(true);
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return "-";
        const dob = new Date(dateOfBirth);
        if (Number.isNaN(dob.getTime())) return "-";
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dob.getDate())
        ) {
            age--;
        }
        return age >= 0 ? age : "-";
    };

    const formatDate = (date) => {
        if (!date) return "-";
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "-";
        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const isToday = (date) => {
        if (!date) return false;
        const d = new Date(date);
        const today = new Date();
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    };

    const isNewPatient = (date) => {
        if (!date) return false;
        const created = new Date(date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return created >= sevenDaysAgo;
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalPatients = patients.length;
    const activePatients = patients.length;
    const todaysPatients = patients.filter((p) => isToday(p.created_at)).length;
    const newPatients = patients.filter((p) => isNewPatient(p.created_at)).length;

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredPatients = useMemo(() => {
        const value = search.toLowerCase().trim();
        if (!value) return patients;
        return patients.filter((patient) =>
            String(patient.name || "").toLowerCase().includes(value) ||
            String(patient.patient_code || "").toLowerCase().includes(value) ||
            String(patient.phone || "").toLowerCase().includes(value) ||
            String(patient.email || "").toLowerCase().includes(value) ||
            String(patient.gender || "").toLowerCase().includes(value)
        );
    }, [patients, search]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // =====================================================
    // MODAL OPEN/CLOSE
    // =====================================================

    const openAddModal = () => {
        setModalMode("add");
        setActivePatientId(null);
        setFormData({ ...emptyForm });
        setShowModal(true);
    };

    const openViewModal = (patient) => {
        setModalMode("view");
        setActivePatientId(patient.id);
        setFormData({
            name: patient.name || "",
            gender: patient.gender || "male",
            date_of_birth: patient.date_of_birth
                ? String(patient.date_of_birth).substring(0, 10)
                : "",
            phone: patient.phone || "",
            email: patient.email || "",
            address: patient.address || "",
            blood_group: patient.blood_group || "",
        });
        setShowModal(true);
    };

    const openEditModal = (patient) => {
        setModalMode("edit");
        setActivePatientId(patient.id);
        setFormData({
            name: patient.name || "",
            gender: patient.gender || "male",
            date_of_birth: patient.date_of_birth
                ? String(patient.date_of_birth).substring(0, 10)
                : "",
            phone: patient.phone || "",
            email: patient.email || "",
            address: patient.address || "",
            blood_group: patient.blood_group || "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setModalMode("add");
        setActivePatientId(null);
        setFormData({ ...emptyForm });
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && showModal) closeModal();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [showModal, saving]);

    // =====================================================
    // SUBMIT — ADD / EDIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const token = localStorage.getItem("hms_token");

            // ── ADD ─────────────────────────────────────
            if (modalMode === "add") {
                const response = await fetch(`${API_URL}/patients`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        gender: formData.gender,
                        date_of_birth: formData.date_of_birth || null,
                        phone: formData.phone.trim() || null,
                        email: formData.email.trim() || null,
                        address: formData.address.trim() || null,
                        blood_group: formData.blood_group.trim() || null,
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Unable to add patient");
                }
            }

            // ── EDIT ─────────────────────────────────────
            if (modalMode === "edit" && activePatientId !== null) {
                const response = await fetch(
                    `${API_URL}/patients/${activePatientId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` }),
                        },
                        body: JSON.stringify({
                            name: formData.name.trim(),
                            gender: formData.gender,
                            date_of_birth: formData.date_of_birth || null,
                            phone: formData.phone.trim() || null,
                            email: formData.email.trim() || null,
                            address: formData.address.trim() || null,
                            blood_group: formData.blood_group.trim() || null,
                        }),
                    }
                );

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Unable to update patient");
                }
            }

            await fetchPatients(true);
            setShowModal(false);
            setModalMode("add");
            setActivePatientId(null);
            setFormData({ ...emptyForm });

        } catch (err) {
            console.error("Save Patient Error:", err);
            setError(err.message || "Unable to save patient.");
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this patient?"
        );
        if (!confirmDelete) return;

        try {
            setDeletingId(id);
            setError("");

            const token = localStorage.getItem("hms_token");

            const response = await fetch(`${API_URL}/patients/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Unable to delete patient");
            }

            setPatients((prev) => prev.filter((p) => p.id !== id));
            await fetchPatients(true);

        } catch (err) {
            console.error("Delete Patient Error:", err);
            setError(err.message || "Unable to delete patient.");
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // MODAL META
    // =====================================================

    const isViewMode = modalMode === "view";
    const modalTitle = modalMode === "add" ? "Add New Patient"
        : modalMode === "edit" ? "Edit Patient"
            : "Patient Details";
    const modalSubtitle = modalMode === "add" ? "Enter patient information below"
        : modalMode === "edit" ? "Update patient information below"
            : "Viewing patient record";

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="patients-page">

            {/* HEADER */}
            <header className="patients-header">
                <div className="patients-header-left">
                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={() => navigate("/dashboard")}
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1>Patients</h1>
                        <p>Manage hospital patients and their information</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="add-patient-button"
                    onClick={openAddModal}
                >
                    <FaPlus />
                    <span>Add Patient</span>
                </button>
            </header>

            {/* ERROR */}
            {error && (
                <div className="patients-error">
                    <FaExclamationTriangle />
                    <span>{error}</span>
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
                        onClick={() => setError("")}
                        aria-label="Close error"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* STATISTICS */}
            <section className="patient-stats">
                <div className="patient-stat-card">
                    <div className="patient-stat-icon"><FaUserInjured /></div>
                    <div>
                        <span>Total Patients</span>
                        <strong>{loading ? "..." : totalPatients}</strong>
                    </div>
                </div>
                <div className="patient-stat-card">
                    <div className="patient-stat-icon"><FaUserInjured /></div>
                    <div>
                        <span>Active Patients</span>
                        <strong>{loading ? "..." : activePatients}</strong>
                    </div>
                </div>
                <div className="patient-stat-card">
                    <div className="patient-stat-icon"><FaCalendarAlt /></div>
                    <div>
                        <span>Today's Patients</span>
                        <strong>{loading ? "..." : todaysPatients}</strong>
                    </div>
                </div>
                <div className="patient-stat-card">
                    <div className="patient-stat-icon"><FaUserInjured /></div>
                    <div>
                        <span>New Patients</span>
                        <strong>{loading ? "..." : newPatients}</strong>
                    </div>
                </div>
            </section>

            {/* PATIENT LIST */}
            <section className="patients-panel">
                <div className="patients-toolbar">
                    <div>
                        <h2>Patient List</h2>
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
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className={`patient-refresh-button ${refreshing ? "is-refreshing" : ""}`}
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                            title="Refresh patients"
                        >
                            <FaSyncAlt className={refreshing ? "refresh-spinning" : ""} />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="patients-loading">
                        <FaSyncAlt className="refresh-spinning" />
                        <p>Loading patients...</p>
                    </div>
                ) : (
                    <div className="patients-table-wrapper">
                        <table className="patients-table">
                            <thead>
                                <tr>
                                    <th>Patient ID</th>
                                    <th>Patient</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Phone</th>
                                    <th>Blood Group</th>
                                    <th>Status</th>
                                    <th>Registered</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.id}>

                                            {/* PATIENT ID */}
                                            <td>
                                                <span className="patient-code-badge">
                                                    {patient.patient_code}
                                                </span>
                                            </td>

                                            {/* PATIENT NAME */}
                                            <td>
                                                <div className="patient-name">
                                                    <div className="patient-avatar">
                                                        {patient.name?.charAt(0).toUpperCase() || "P"}
                                                    </div>
                                                    <div>
                                                        <strong>{patient.name}</strong>
                                                        <span>{patient.email || "-"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* AGE */}
                                            <td>{calculateAge(patient.date_of_birth)}</td>

                                            {/* GENDER */}
                                            <td>
                                                {patient.gender
                                                    ? patient.gender.charAt(0).toUpperCase() +
                                                    patient.gender.slice(1)
                                                    : "-"}
                                            </td>

                                            {/* PHONE */}
                                            <td>
                                                <div className="phone-cell">
                                                    <FaPhone />
                                                    {patient.phone || "-"}
                                                </div>
                                            </td>

                                            {/* BLOOD GROUP */}
                                            <td>
                                                <span className="blood-group-badge">
                                                    {patient.blood_group || "-"}
                                                </span>
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
                                                    {formatDate(patient.created_at)}
                                                </div>
                                            </td>

                                            {/* ACTIONS */}
                                            <td>
                                                <div className="patient-actions">
                                                    <button
                                                        type="button"
                                                        className="view-action"
                                                        title="View Patient"
                                                        onClick={() => openViewModal(patient)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="edit-action"
                                                        title="Edit Patient"
                                                        onClick={() => openEditModal(patient)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="delete-action"
                                                        title="Delete Patient"
                                                        disabled={deletingId === patient.id}
                                                        onClick={() => handleDelete(patient.id)}
                                                    >
                                                        {deletingId === patient.id ? (
                                                            <FaSyncAlt className="refresh-spinning" />
                                                        ) : (
                                                            <FaTrash />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="empty-patients">
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

            {/* MODAL */}
            {showModal && (
                <div
                    className="patient-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="patient-modal"
                        onClick={(e) => e.stopPropagation()}
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

                        <h2>{modalTitle}</h2>
                        <p>{modalSubtitle}</p>

                        {/* VIEW MODE */}
                        {isViewMode ? (
                            <div className="patient-details">

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">
                                        <FaUserInjured /> Patient ID
                                    </span>
                                    <span className="patient-detail-value patient-code-badge">
                                        {patients.find((p) => p.id === activePatientId)?.patient_code || "-"}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">
                                        <FaUserInjured /> Name
                                    </span>
                                    <span className="patient-detail-value">{formData.name}</span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">
                                        <FaVenusMars /> Age / Gender
                                    </span>
                                    <span className="patient-detail-value">
                                        {calculateAge(formData.date_of_birth)} yrs, {formData.gender}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">
                                        <FaPhone /> Phone
                                    </span>
                                    <span className="patient-detail-value">
                                        {formData.phone || "-"}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">Email</span>
                                    <span className="patient-detail-value">
                                        {formData.email || "-"}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">
                                        <FaHospital /> Blood Group
                                    </span>
                                    <span className="blood-group-badge">
                                        {formData.blood_group || "-"}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">Address</span>
                                    <span className="patient-detail-value">
                                        {formData.address || "-"}
                                    </span>
                                </div>

                                <div className="patient-detail-row">
                                    <span className="patient-detail-label">Status</span>
                                    <span className="patient-status active">Active</span>
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
                                            const patient = patients.find(
                                                (p) => p.id === activePatientId
                                            );
                                            if (patient) openEditModal(patient);
                                        }}
                                    >
                                        <FaEdit /> Edit Patient
                                    </button>
                                </div>

                            </div>

                        ) : (

                            /* ADD / EDIT FORM */
                            <form className="patient-form" onSubmit={handleSubmit}>

                                <div className="form-group">
                                    <label>Patient Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter patient name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender <span className="required">*</span></label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Blood Group</label>
                                        <select
                                            name="blood_group"
                                            value={formData.blood_group}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        name="address"
                                        placeholder="Enter patient address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="3"
                                    />
                                </div>

                                {modalMode === "add" && (
                                    <div className="auto-id-info">
                                        🪪 Patient ID will be auto-generated
                                        <strong> (P-{new Date().getFullYear()}XXXX)</strong>
                                    </div>
                                )}

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
                                        ) : modalMode === "edit" ? (
                                            <><FaEdit /> Save Changes</>
                                        ) : (
                                            <><FaPlus /> Add Patient</>
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