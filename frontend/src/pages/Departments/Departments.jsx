import { useEffect, useState } from "react";
import {
    FiArrowLeft,
    FiPlus,
    FiEdit2,
    FiTrash2,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Departments.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
    name: "",
    description: "",
    status: "active",
};

const Departments = () => {
    const navigate = useNavigate();

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // =====================================================
    // FETCH DEPARTMENTS
    // =====================================================

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("hms_token");

            const response = await fetch(`${API_URL}/departments`, {
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
    // ADD / UPDATE DEPARTMENT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Department name is required");
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("hms_token");

            const isEditing = editingId !== null;

            const url = isEditing
                ? `${API_URL}/departments/${editingId}`
                : `${API_URL}/departments`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
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

            alert(
                isEditing
                    ? "Department updated successfully"
                    : "Department created successfully"
            );

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

        try {
            const token = localStorage.getItem("hms_token");

            const response = await fetch(
                `${API_URL}/departments/${department.id}`,
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

            alert("Department deleted successfully");

            await fetchDepartments();
        } catch (err) {
            console.error("Delete department error:", err);

            alert(
                err.message || "Failed to delete department"
            );
        }
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="departments-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="departments-header">

                <div className="departments-header-left">

                    {/* BACK BUTTON */}

                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={handleBack}
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FiArrowLeft className="back-arrow-icon" />
                    </button>

                    {/* TITLE */}

                    <div>
                        <h1>Departments</h1>

                        <p>
                            Manage hospital departments
                        </p>
                    </div>

                </div>

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

            {/* =================================================
                TABLE
            ================================================= */}

            {!loading && !error && (
                <div className="departments-table-wrapper">

                    <table className="departments-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Department</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {departments.length > 0 ? (

                                departments.map((department) => (

                                    <tr key={department.id}>

                                        {/* ID */}

                                        <td>
                                            {department.id}
                                        </td>

                                        {/* NAME */}

                                        <td className="department-name">
                                            {department.name}
                                        </td>

                                        {/* DESCRIPTION */}

                                        <td className="department-description">
                                            {department.description || "-"}
                                        </td>

                                        {/* STATUS */}

                                        <td>
                                            <span
                                                className={`status-badge ${department.status || "active"
                                                    }`}
                                            >
                                                {department.status || "active"}
                                            </span>
                                        </td>

                                        {/* CREATED */}

                                        <td>
                                            {formatDate(
                                                department.created_at
                                            )}
                                        </td>

                                        {/* ACTIONS */}

                                        <td>

                                            <div className="department-actions">

                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    className="department-edit-btn"
                                                    onClick={() =>
                                                        openEditModal(
                                                            department
                                                        )
                                                    }
                                                    title="Edit Department"
                                                >
                                                    <FiEdit2 />
                                                    <span>Edit</span>
                                                </button>

                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    className="department-delete-btn"
                                                    onClick={() =>
                                                        handleDelete(
                                                            department
                                                        )
                                                    }
                                                    title="Delete Department"
                                                >
                                                    <FiTrash2 />
                                                    <span>Delete</span>
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="no-departments"
                                    >
                                        No departments found
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

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

        </div>
    );
};

export default Departments;