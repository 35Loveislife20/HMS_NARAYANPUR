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
    FaEnvelope,
    FaStar,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
} from "react-icons/fa";

import "./Doctors.css";

const SPECIALIZATIONS = [
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

const EMPTY_FORM = {
    name: "",
    specialization: "",
    qualification: "",
    phone: "",
    email: "",
    experience_years: "",
    consultation_fee: "",
    status: "available",
};

function Doctors() {
    const navigate = useNavigate();

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
    const [activeDoctorId, setActiveDoctorId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    // =====================================================
    // HEADERS
    // =====================================================

    const getHeaders = () => {
        const token = localStorage.getItem("hms_token");
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    };

    // =====================================================
    // FETCH DOCTORS
    // =====================================================

    const fetchDoctors = async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/doctors`, {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Unable to load doctors.");
            if (!data.success || !Array.isArray(data.doctors))
                throw new Error("Invalid doctors response.");

            setDoctors([...data.doctors]);

        } catch (err) {
            console.error("Fetch Doctors Error:", err);
            setError(err.message || "Unable to connect to HMS server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchDoctors(false); }, []);

    const handleRefresh = async () => {
        if (loading || refreshing) return;
        await fetchDoctors(true);
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredDoctors = useMemo(() => {
        const value = search.toLowerCase().trim();
        if (!value) return doctors;
        return doctors.filter((d) =>
            String(d.name || "").toLowerCase().includes(value) ||
            String(d.doctor_code || "").toLowerCase().includes(value) ||
            String(d.specialization || "").toLowerCase().includes(value) ||
            String(d.phone || "").toLowerCase().includes(value) ||
            String(d.email || "").toLowerCase().includes(value)
        );
    }, [doctors, search]);

    // =====================================================
    // STATS
    // =====================================================

    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter((d) => d.status === "available").length;
    const avgFee = doctors.length > 0
        ? doctors.reduce((t, d) => t + Number(d.consultation_fee || 0), 0) / doctors.length
        : 0;

    // =====================================================
    // MODAL HELPERS
    // =====================================================

    const openAddModal = () => {
        setModalMode("add");
        setActiveDoctorId(null);
        setFormData({ ...EMPTY_FORM });
        setError("");
        setShowModal(true);
    };

    const openViewModal = (doctor) => {
        setModalMode("view");
        setActiveDoctorId(doctor.id);
        setFormData({
            name: doctor.name || "",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            phone: doctor.phone || "",
            email: doctor.email || "",
            experience_years: doctor.experience_years ?? "",
            consultation_fee: doctor.consultation_fee || "",
            status: doctor.status || "available",
        });
        setShowModal(true);
    };

    const openEditModal = (doctor) => {
        setModalMode("edit");
        setActiveDoctorId(doctor.id);
        setFormData({
            name: doctor.name || "",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            phone: doctor.phone || "",
            email: doctor.email || "",
            experience_years: doctor.experience_years ?? "",
            consultation_fee: doctor.consultation_fee || "",
            status: doctor.status || "available",
        });
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setModalMode("add");
        setActiveDoctorId(null);
        setFormData({ ...EMPTY_FORM });
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && showModal) closeModal();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [showModal, saving]);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Doctor name is required.");
            return;
        }
        if (!formData.specialization) {
            setError("Please select specialization.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const body = {
                name: formData.name.trim(),
                specialization: formData.specialization || null,
                qualification: formData.qualification.trim() || null,
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                experience_years: formData.experience_years ? Number(formData.experience_years) : 0,
                consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : 0,
                status: formData.status || "available",
            };

            const url = modalMode === "edit"
                ? `${API_URL}/doctors/${activeDoctorId}`
                : `${API_URL}/doctors`;
            const method = modalMode === "edit" ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to save doctor.");

            await fetchDoctors(true);
            setShowModal(false);
            setModalMode("add");
            setActiveDoctorId(null);
            setFormData({ ...EMPTY_FORM });

        } catch (err) {
            console.error("Save Doctor Error:", err);
            setError(err.message || "Unable to save doctor.");
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this doctor?")) return;

        try {
            setDeletingId(id);
            setError("");

            const response = await fetch(`${API_URL}/doctors/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to delete doctor.");

            setDoctors((prev) => prev.filter((d) => d.id !== id));

        } catch (err) {
            console.error("Delete Doctor Error:", err);
            setError(err.message || "Unable to delete doctor.");
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // STATUS BADGE
    // =====================================================

    const StatusBadge = ({ status }) => {
        const config = {
            available: { icon: <FaCheckCircle />, label: "Available", cls: "status-available" },
            busy: { icon: <FaClock />, label: "Busy", cls: "status-busy" },
            offline: { icon: <FaTimesCircle />, label: "Offline", cls: "status-offline" },
        };
        const s = config[status] || config.available;
        return (
            <span className={`doctor-status-badge ${s.cls}`}>
                {s.icon} {s.label}
            </span>
        );
    };

    // =====================================================
    // MODAL META
    // =====================================================

    const isViewMode = modalMode === "view";
    const modalTitle = modalMode === "add" ? "Add New Doctor"
        : modalMode === "edit" ? "Edit Doctor"
            : "Doctor Details";
    const modalSubtitle = modalMode === "add" ? "Enter doctor information below"
        : modalMode === "edit" ? "Update doctor information below"
            : "Viewing doctor record";

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="doctors-page">

            {/* HEADER */}
            <header className="doctors-header">
                <div className="doctors-header-left">
                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={() => navigate("/dashboard")}
                        title="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1>Doctors</h1>
                        <p>Manage hospital doctors and their information</p>
                    </div>
                </div>
                <button type="button" className="add-doctor-button" onClick={openAddModal}>
                    <FaPlus />
                    <span>Add Doctor</span>
                </button>
            </header>

            {/* ERROR */}
            {error && (
                <div className="doctors-error">
                    <FaExclamationTriangle />
                    <span>{error}</span>
                    <button type="button" onClick={handleRefresh} disabled={refreshing}>Retry</button>
                    <button type="button" className="error-close" onClick={() => setError("")} aria-label="Close error">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* STATS */}
            <section className="doctor-stats">
                <div className="doctor-stat-card">
                    <div className="doctor-stat-icon"><FaUserMd /></div>
                    <div>
                        <span>Total Doctors</span>
                        <strong>{loading ? "..." : totalDoctors}</strong>
                    </div>
                </div>
                <div className="doctor-stat-card">
                    <div className="doctor-stat-icon"><FaCheckCircle /></div>
                    <div>
                        <span>Available</span>
                        <strong>{loading ? "..." : availableDoctors}</strong>
                    </div>
                </div>
                <div className="doctor-stat-card">
                    <div className="doctor-stat-icon"><FaMoneyBillWave /></div>
                    <div>
                        <span>Avg. Consultation</span>
                        <strong>{loading ? "..." : `₹${avgFee.toFixed(0)}`}</strong>
                    </div>
                </div>
            </section>

            {/* DOCTOR LIST */}
            <section className="doctors-panel">
                <div className="doctors-toolbar">
                    <div>
                        <h2>Doctor List</h2>
                        <span>
                            {loading
                                ? "Loading doctors..."
                                : `${filteredDoctors.length} doctors found`}
                        </span>
                    </div>
                    <div className="doctor-toolbar-actions">
                        <div className="doctor-search">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search doctor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className={`doctor-refresh-button ${refreshing ? "is-refreshing" : ""}`}
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                        >
                            <FaSyncAlt className={refreshing ? "refresh-spinning" : ""} />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="doctors-loading">
                        <FaSyncAlt className="refresh-spinning" />
                        <p>Loading doctors...</p>
                    </div>
                ) : (
                    <div className="doctors-table-wrapper">
                        <table className="doctors-table">
                            <thead>
                                <tr>
                                    <th>Doctor ID</th>
                                    <th>Doctor</th>
                                    <th>Specialization</th>
                                    <th>Phone</th>
                                    <th>Experience</th>
                                    <th>Consultation</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map((doctor) => (
                                        <tr key={doctor.id}>

                                            {/* DOCTOR ID */}
                                            <td>
                                                <span className="doctor-code-badge">
                                                    {doctor.doctor_code}
                                                </span>
                                            </td>

                                            {/* DOCTOR */}
                                            <td>
                                                <div className="doctor-name">
                                                    <div className="doctor-avatar">
                                                        <FaUserMd />
                                                    </div>
                                                    <div>
                                                        <strong>{doctor.name}</strong>
                                                        <span>{doctor.email || "-"}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SPECIALIZATION */}
                                            <td>
                                                <span className="specialization-badge">
                                                    {doctor.specialization || "-"}
                                                </span>
                                            </td>

                                            {/* PHONE */}
                                            <td>
                                                <div className="phone-cell">
                                                    <FaPhone />
                                                    {doctor.phone || "-"}
                                                </div>
                                            </td>

                                            {/* EXPERIENCE */}
                                            <td>
                                                <div className="experience-cell">
                                                    <FaStar />
                                                    {doctor.experience_years
                                                        ? `${doctor.experience_years} yrs`
                                                        : "-"}
                                                </div>
                                            </td>

                                            {/* FEE */}
                                            <td>
                                                <span className="fee-badge">
                                                    ₹{Number(doctor.consultation_fee || 0).toFixed(0)}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td>
                                                <StatusBadge status={doctor.status} />
                                            </td>

                                            {/* ACTIONS */}
                                            <td>
                                                <div className="doctor-actions">
                                                    <button
                                                        type="button"
                                                        className="view-action"
                                                        title="View Doctor"
                                                        onClick={() => openViewModal(doctor)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="edit-action"
                                                        title="Edit Doctor"
                                                        onClick={() => openEditModal(doctor)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="delete-action"
                                                        title="Delete Doctor"
                                                        disabled={deletingId === doctor.id}
                                                        onClick={() => handleDelete(doctor.id)}
                                                    >
                                                        {deletingId === doctor.id
                                                            ? <FaSyncAlt className="refresh-spinning" />
                                                            : <FaTrash />}
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="empty-doctors">
                                            {search ? "No doctors match your search." : "No doctors found."}
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
                <div className="doctor-modal-overlay" onClick={closeModal}>
                    <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>

                        <button
                            type="button"
                            className="doctor-modal-close"
                            onClick={closeModal}
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>

                        <div className="doctor-modal-icon"><FaUserMd /></div>
                        <h2>{modalTitle}</h2>
                        <p>{modalSubtitle}</p>

                        {/* VIEW MODE */}
                        {isViewMode ? (
                            <div className="doctor-details">

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaUserMd /> Doctor ID</span>
                                    <span className="doctor-code-badge">
                                        {doctors.find((d) => d.id === activeDoctorId)?.doctor_code || "-"}
                                    </span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaUserMd /> Name</span>
                                    <span className="doctor-detail-value">{formData.name}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label">Specialization</span>
                                    <span className="specialization-badge">{formData.specialization || "-"}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label">Qualification</span>
                                    <span className="doctor-detail-value">{formData.qualification || "-"}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaPhone /> Phone</span>
                                    <span className="doctor-detail-value">{formData.phone || "-"}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaEnvelope /> Email</span>
                                    <span className="doctor-detail-value">{formData.email || "-"}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaStar /> Experience</span>
                                    <span className="doctor-detail-value">
                                        {formData.experience_years ? `${formData.experience_years} years` : "-"}
                                    </span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label"><FaMoneyBillWave /> Consultation Fee</span>
                                    <span className="fee-badge">₹{Number(formData.consultation_fee || 0).toFixed(0)}</span>
                                </div>

                                <div className="doctor-detail-row">
                                    <span className="doctor-detail-label">Status</span>
                                    <StatusBadge status={formData.status} />
                                </div>

                                <div className="doctor-form-actions">
                                    <button type="button" className="cancel-button" onClick={closeModal}>Close</button>
                                    <button
                                        type="button"
                                        className="save-doctor-button"
                                        onClick={() => {
                                            const doctor = doctors.find((d) => d.id === activeDoctorId);
                                            if (doctor) openEditModal(doctor);
                                        }}
                                    >
                                        <FaEdit /> Edit Doctor
                                    </button>
                                </div>

                            </div>

                        ) : (

                            /* ADD / EDIT FORM */
                            <form className="doctor-form" onSubmit={handleSubmit}>

                                <div className="form-group">
                                    <label>Doctor Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Dr. Rahul Sharma"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Specialization <span className="required">*</span></label>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Specialization</option>
                                        {SPECIALIZATIONS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Qualification</label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        placeholder="MBBS, MD"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="9876543210"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="doctor@hms.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Experience (years)</label>
                                        <input
                                            type="number"
                                            name="experience_years"
                                            min="0"
                                            placeholder="10"
                                            value={formData.experience_years}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Consultation Fee (₹)</label>
                                        <input
                                            type="number"
                                            name="consultation_fee"
                                            min="0"
                                            placeholder="500"
                                            value={formData.consultation_fee}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="available">Available</option>
                                        <option value="busy">Busy</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                </div>

                                {modalMode === "add" && (
                                    <div className="auto-id-info">
                                        🪪 Doctor ID will be auto-generated
                                        <strong> (D-{new Date().getFullYear()}XXXX)</strong>
                                    </div>
                                )}

                                <div className="doctor-form-actions">
                                    <button type="button" className="cancel-button" onClick={closeModal} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-doctor-button" disabled={saving}>
                                        {saving ? (
                                            <><FaSyncAlt className="refresh-spinning" /> Saving...</>
                                        ) : modalMode === "edit" ? (
                                            <><FaEdit /> Save Changes</>
                                        ) : (
                                            <><FaPlus /> Add Doctor</>
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