import { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiRefreshCw,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiArrowRight,
    FiLayers,
} from "react-icons/fi";
import {
    FaHospital,
    FaHeartbeat,
    FaXRay,
    FaBone,
    FaBrain,
    FaStethoscope,
    FaPills,
    FaAmbulance,
    FaAssistiveListeningSystems,
    FaEye,
    FaTooth,
    FaBaby,
    FaFemale,
    FaLungs,
    FaVial,
    FaBed,
    FaProcedures,
    FaWheelchair,
    FaUserMd,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./Departments.css";
import SuccessPopup from "../../components/common/SuccessPopup";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
    name: "",
    description: "",
    status: "active",
};

const emptySuccessPopup = {
    open: false,
    title: "Success",
    message: "",
};

// =====================================================
// DEPARTMENT VISUAL IDENTITY
// Naam ke keywords ke hisaab se icon + color.
// Upar wala match pehle milta hai.
// =====================================================

const DEPARTMENT_THEMES = [
    { match: /\b(ent|ear|nose|throat|audiolog\w*|hearing)\b/, color: "#14b8a6", icon: FaAssistiveListeningSystems },
    { match: /\b(eye|eyes|ophthalm\w*|vision)\b/, color: "#38bdf8", icon: FaEye },
    { match: /\b(dental|dentist|tooth|teeth|oral)\b/, color: "#e2e8f0", icon: FaTooth },
    { match: /\b(pediatric\w*|paediatric\w*|child\w*|kids?)\b/, color: "#facc15", icon: FaBaby },
    { match: /\b(gynae\w*|gynec\w*|obstetric\w*|maternity)\b/, color: "#f472b6", icon: FaFemale },
    { match: /\b(lung\w*|chest|pulmon\w*|respirat\w*)\b/, color: "#60a5fa", icon: FaLungs },
    { match: /\b(cardio\w*|heart)\b/, color: "#ff4d6d", icon: FaHeartbeat },
    { match: /\b(neuro\w*|brain)\b/, color: "#8b5cf6", icon: FaBrain },
    { match: /\b(ortho\w*|bone|fracture)\b/, color: "#22c55e", icon: FaBone },
    { match: /\b(radiolog\w*|x-?ray|imaging|scan)\b/, color: "#3b82f6", icon: FaXRay },
    { match: /\b(lab|laboratory|patholog\w*)\b/, color: "#06b6d4", icon: FaVial },
    { match: /\b(pharmac\w*)\b/, color: "#ec4899", icon: FaPills },
    { match: /\b(emergency|trauma|casualty|ambulance)\b/, color: "#ef4444", icon: FaAmbulance },
    { match: /\b(icu|intensive|critical care)\b/, color: "#a3e635", icon: FaBed },
    { match: /\b(surg\w*|operation\w*|ot)\b/, color: "#fb923c", icon: FaProcedures },
    { match: /\b(physio\w*|rehab\w*)\b/, color: "#2dd4bf", icon: FaWheelchair },
    { match: /\b(skin|derma\w*)\b/, color: "#fda4af", icon: FaUserMd },
    { match: /\b(general|medicine|medical)\b/, color: "#f5a623", icon: FaStethoscope },
];

const FALLBACK_PALETTE = [
    "#00ff22",
    "#3b82f6",
    "#f5a623",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#ef4444",
    "#22c55e",
];

const getDepartmentStyle = (name, index) => {
    const key = (name || "").trim().toLowerCase();

    const theme = DEPARTMENT_THEMES.find((t) => t.match.test(key));

    const color = theme
        ? theme.color
        : FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];

    return {
        color,
        // Halka color upar se, gehra neeche (card/icon ke liye)
        bg: `linear-gradient(135deg, ${color}33, ${color}0d)`,
        icon: theme ? theme.icon : FaHospital,
    };
};

const toValidHospitalId = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) && number > 0 ? number : null;
};

const Departments = () => {
    const navigate = useNavigate();
    const location = useLocation();

    /*
     * Department har hospital ke hisab se alag hota hai.
     * - Super admin: Dashboard me chuna hua hospital
     * - Baaki staff: login user ka apna hospital (hms_user)
     * - Purana key hms_hospital_id fallback
     */
    const getUserInfo = () => {
        try {
            const saved = localStorage.getItem("hms_user");

            const user = saved ? JSON.parse(saved) || {} : {};

            return {
                role: String(user?.role || "").toLowerCase(),
                ownHospital: toValidHospitalId(
                    user?.hospital_id ??
                        user?.hospitalId ??
                        (typeof user?.hospital === "object"
                            ? user?.hospital?.id
                            : user?.hospital)
                ),
            };
        } catch {
            return { role: "", ownHospital: null };
        }
    };

    const getHospitalId = () => {
        const { role, ownHospital } = getUserInfo();

        let selectedHospital = toValidHospitalId(
            location.state?.hospitalId
        );

        if (!selectedHospital) {
            try {
                selectedHospital = toValidHospitalId(
                    sessionStorage.getItem("hms_selected_hospital")
                );
            } catch {
                selectedHospital = null;
            }
        }

        const storedHospital = toValidHospitalId(
            localStorage.getItem("hms_hospital_id")
        );

        if (role === "super_admin") {
            return (
                selectedHospital || storedHospital || ownHospital || null
            );
        }

        return ownHospital || storedHospital || selectedHospital || null;
    };

    const needsHospitalSelection = () =>
        getUserInfo().role === "super_admin" && !getHospitalId();

    const withHospital = (url) => {
        const hospitalId = getHospitalId();

        if (!hospitalId) return url;

        return `${url}${
            url.includes("?") ? "&" : "?"
        }hospital_id=${hospitalId}`;
    };

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [successPopup, setSuccessPopup] = useState(emptySuccessPopup);

    // =====================================================
    // FETCH DEPARTMENTS
    // =====================================================

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError("");

            if (needsHospitalSelection()) {
                throw new Error(
                    "Hospital selection is missing. Please select a hospital first."
                );
            }

            const token = localStorage.getItem("hms_token");

            const response = await fetch(withHospital(`${API_URL}/departments`), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to fetch departments"
                );
            }

            setDepartments(result.data || []);
        } catch (err) {
            console.error("Departments error:", err);

            setError(
                err.message || "Failed to load departments"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // =====================================================
    // BACK TO DASHBOARD
    // =====================================================

    const handleBack = () => {
        navigate("/dashboard");
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
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (department) => {
        setEditingId(department.id);

        setFormData({
            name: department.name || "",
            description: department.description || "",
            status: department.status || "active",
        });

        setShowModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingId(null);
        setFormData({ ...emptyForm });
    };

    // =====================================================
    // SUCCESS POPUP CLOSE
    // =====================================================

    const closeSuccessPopup = () => {
        setSuccessPopup(emptySuccessPopup);
    };

    // =====================================================
    // ADD / UPDATE DEPARTMENT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Department name is required");
            return;
        }

        const isEditing = editingId !== null;

        if (needsHospitalSelection()) {
            alert(
                "Hospital selection is missing. Please select a hospital first."
            );
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("hms_token");

            const hospitalId = getHospitalId();

            const url = withHospital(
                isEditing
                    ? `${API_URL}/departments/${editingId}`
                    : `${API_URL}/departments`
            );

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...(hospitalId ? { hospital_id: hospitalId } : {}),
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    status: formData.status,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    (isEditing
                        ? "Failed to update department"
                        : "Failed to create department")
                );
            }

            setSuccessPopup({
                open: true,
                title: "Success",
                message: isEditing
                    ? "Department updated successfully"
                    : "Department created successfully",
            });

            setShowModal(false);
            setEditingId(null);
            setFormData({ ...emptyForm });

            await fetchDepartments();
        } catch (err) {
            console.error(
                isEditing
                    ? "Update department error:"
                    : "Create department error:",
                err
            );

            alert(
                err.message ||
                (isEditing
                    ? "Failed to update department"
                    : "Failed to create department")
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE DEPARTMENT
    // =====================================================

    const handleDelete = async (department) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${department.name}"?`
        );

        if (!confirmed) return;

        if (needsHospitalSelection()) {
            alert(
                "Hospital selection is missing. Please select a hospital first."
            );
            return;
        }

        try {
            const token = localStorage.getItem("hms_token");

            const response = await fetch(
                withHospital(`${API_URL}/departments/${department.id}`),
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to delete department"
                );
            }

            setSuccessPopup({
                open: true,
                title: "Deleted",
                message: "Department deleted successfully",
            });

            await fetchDepartments();
        } catch (err) {
            console.error("Delete department error:", err);

            alert(
                err.message || "Failed to delete department"
            );
        }
    };

    // =====================================================
    // SEARCH FILTER
    // =====================================================

    const filteredDepartments = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return departments;

        return departments.filter((department) =>
            (department.name || "").toLowerCase().includes(term)
        );
    }, [departments, searchTerm]);

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="departments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="departments-header">

                <div
                    className="departments-header-left"
                    onClick={handleBack}
                    title="Back to Dashboard"
                    role="button"
                    tabIndex={0}
                >

                    <button
                        type="button"
                        className="departments-back-button"
                        onClick={handleBack}
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FiArrowRight className="departments-back-icon" />
                    </button>

                    <div className="departments-header-icon">
                        <FaHospital />
                    </div>

                    <div>
                        <h1>Departments</h1>

                        <p>
                            Manage hospital departments and their information
                        </p>
                    </div>

                </div>

                <div className="departments-header-right">

                    {/* SEARCH */}

                    <div className="departments-search">
                        <FiSearch className="departments-search-icon" />

                        <input
                            type="text"
                            placeholder="Search department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* REFRESH */}

                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={fetchDepartments}
                        disabled={loading}
                    >
                        <FiRefreshCw
                            className={loading ? "spin-icon" : ""}
                        />
                        <span>Refresh</span>
                    </button>

                    {/* ADD DEPARTMENT */}

                    <button
                        type="button"
                        className="add-department-btn"
                        onClick={openAddModal}
                    >
                        <FiPlus />
                        <span>Add Department</span>
                    </button>

                </div>

            </div>

            {/* =================================================
                TOTAL DEPARTMENTS STAT
            ================================================= */}

            <div className="departments-stat">

                <div className="departments-stat-icon">
                    <FiLayers />
                </div>

                <div>
                    <p>Total Departments</p>
                    <h2>{departments.length}</h2>
                </div>

            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
                <div className="departments-message">
                    Loading departments...
                </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="departments-error">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={fetchDepartments}
                    >
                        Retry
                    </button>
                </div>
            )}

            <section className="departments-panel">

                <div className="departments-toolbar">

                    <div>
                        <h2>Department List</h2>
                        <span>
                            {filteredDepartments.length} department
                            {filteredDepartments.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="departments-toolbar-actions">
                        <div className="department-panel-search">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Search department..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="department-panel-refresh"
                            onClick={fetchDepartments}
                            disabled={loading}
                        >
                            <FiRefreshCw className={loading ? "spin-icon" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>

                </div>

                {loading ? (
                    <div className="departments-table-message">
                        <FiRefreshCw className="spin-icon" />
                        <span>Loading departments...</span>
                    </div>
                ) : (
                    <div className="departments-table-wrapper">
                        <table className="departments-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Description</th>
                                    <th>Doctors</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map((department, index) => {
                                        const { color, bg, icon: Icon } =
                                            getDepartmentStyle(department.name, index);
                                        const doctorCount =
                                            department.doctor_count ??
                                            department.doctors_count ??
                                            department.doctorsCount ??
                                            0;

                                        return (
                                            <tr key={department.id}>
                                                <td>
                                                    <div className="department-table-name">
                                                        <div
                                                            className="department-table-icon"
                                                            style={{
                                                                "--dept-color": color,
                                                                "--dept-bg": bg,
                                                            }}
                                                        >
                                                            <Icon />
                                                        </div>
                                                        <strong>{department.name}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="department-table-description">
                                                        {department.description ||
                                                            "No description available"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="department-table-count">
                                                        {doctorCount} {doctorCount === 1 ? "Doctor" : "Doctors"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`department-table-status ${department.status || "active"}`}
                                                    >
                                                        {String(department.status || "active")
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            String(department.status || "active").slice(1)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="department-table-actions">
                                                        <button
                                                            type="button"
                                                            className="department-table-edit"
                                                            onClick={() => openEditModal(department)}
                                                            title="Edit Department"
                                                            aria-label="Edit Department"
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="department-table-delete"
                                                            onClick={() => handleDelete(department)}
                                                            title="Delete Department"
                                                            aria-label="Delete Department"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="departments-table-empty">
                                            No departments found. Add a department or change your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

            </section>

            {/* =================================================
                DEPARTMENT CARDS GRID
            ================================================= */}

            {!loading && !error && (

                <div className="departments-grid">

                    {filteredDepartments.length > 0 ? (

                        filteredDepartments.map((department, index) => {

                            const { color, bg, icon: Icon } =
                                getDepartmentStyle(department.name, index);

                            const doctorCount =
                                department.doctor_count ??
                                department.doctors_count ??
                                department.doctorsCount ??
                                0;

                            return (

                                <div
                                    key={department.id}
                                    className="department-card"
                                    style={{
                                        "--dept-color": color,
                                        "--dept-bg": bg,
                                    }}
                                >

                                    <div className="department-card-top">

                                        <div className="department-card-icon">
                                            <Icon />
                                        </div>

                                        <div className="department-card-actions">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(department)
                                                }
                                                title="Edit Department"
                                                aria-label="Edit Department"
                                            >
                                                <FiEdit2 />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(department)
                                                }
                                                title="Delete Department"
                                                aria-label="Delete Department"
                                            >
                                                <FiTrash2 />
                                            </button>

                                        </div>

                                    </div>

                                    <h3 className="department-card-name">
                                        {department.name}
                                    </h3>

                                    <p className="department-card-doctors">
                                        {doctorCount}{" "}
                                        {doctorCount === 1
                                            ? "Doctor"
                                            : "Doctors"}
                                    </p>

                                    <div className="department-card-bottom">

                                        <p className="department-card-desc">
                                            {department.description ||
                                                "No description available"}
                                        </p>

                                        <button
                                            type="button"
                                            className="department-arrow-btn"
                                            onClick={() =>
                                                openEditModal(department)
                                            }
                                            title="View Department"
                                            aria-label="View Department"
                                        >
                                            <FiArrowRight />
                                        </button>

                                    </div>

                                </div>

                            );

                        })

                    ) : (

                        <div className="no-departments">
                            No departments found
                        </div>

                    )}

                </div>

            )}

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="department-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="department-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="department-modal-header">

                            <div>

                                <h2>
                                    {editingId
                                        ? "Edit Department"
                                        : "Add Department"}
                                </h2>

                                <p>
                                    {editingId
                                        ? "Update hospital department details"
                                        : "Create a new hospital department"}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="department-modal-close"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}

                        <form onSubmit={handleSubmit}>

                            {/* NAME */}

                            <div className="department-form-group">

                                <label>
                                    Department Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Cardiology"
                                    maxLength="100"
                                    required
                                    disabled={saving}
                                />

                            </div>

                            {/* DESCRIPTION */}

                            <div className="department-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter department description"
                                    maxLength="255"
                                    rows="4"
                                    disabled={saving}
                                />

                            </div>

                            {/* STATUS */}

                            <div className="department-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="active">
                                        Active
                                    </option>

                                    <option value="inactive">
                                        Inactive
                                    </option>
                                </select>

                            </div>

                            {/* ACTIONS */}

                            <div className="department-modal-actions">

                                <button
                                    type="button"
                                    className="department-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="department-save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Department"
                                            : "Save Department"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =================================================
                SUCCESS POPUP
            ================================================= */}

            <SuccessPopup
                open={successPopup.open}
                title={successPopup.title}
                message={successPopup.message}
                onClose={closeSuccessPopup}
            />

        </div>
    );
};

export default Departments;