import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaSyncAlt,
    FaPlus,
    FaTrash,
    FaTimes,
    FaFlask,
    FaCheckCircle,
    FaBan,
    FaVial,
    FaRupeeSign,
    FaExclamationTriangle,
    FaEdit,
} from "react-icons/fa";

import "./Laboratory.css";

function Laboratory() {
    const navigate = useNavigate();

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATES
    // =====================================================

    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // =====================================================
    // FORM
    // =====================================================

    const emptyForm = {
        test_name: "",
        category: "",
        description: "",
        price: "",
        status: "active",
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
    // FETCH TESTS
    // =====================================================

    const fetchTests = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/laboratory`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load laboratory tests"
                );
            }

            if (
                !data.success ||
                !Array.isArray(data.tests)
            ) {
                throw new Error(
                    "Invalid laboratory response"
                );
            }

            setTests([...data.tests]);

        } catch (err) {
            console.error(
                "Fetch Laboratory Tests Error:",
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
        fetchTests(false);
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        if (loading || refreshing) return;

        await fetchTests(true);
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

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
        setFormData({
            ...emptyForm,
        });

        setError("");
        setShowModal(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (test) => {
        setEditingId(test.id);

        setFormData({
            test_name: test.test_name || "",
            category: test.category || "",
            description: test.description || "",
            price:
                test.price !== null &&
                    test.price !== undefined
                    ? String(test.price)
                    : "",
            status:
                test.status || "active",
        });

        setError("");
        setShowModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingId(null);

        setFormData({
            ...emptyForm,
        });
    };

    // =====================================================
    // ESCAPE KEY
    // =====================================================

    useEffect(() => {
        const handleEsc = (e) => {
            if (
                e.key === "Escape" &&
                showModal
            ) {
                closeModal();
            }
        };

        document.addEventListener(
            "keydown",
            handleEsc
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEsc
            );
        };
    }, [showModal, saving]);

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.test_name.trim()) {
            setError("Please enter test name.");
            return;
        }

        if (
            formData.price === "" ||
            Number(formData.price) < 0
        ) {
            setError(
                "Please enter a valid test price."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const url = editingId
                ? `${API_URL}/laboratory/${editingId}`
                : `${API_URL}/laboratory`;

            const method = editingId
                ? "PUT"
                : "POST";

            const response = await fetch(
                url,
                {
                    method,
                    headers: getHeaders(),
                    body: JSON.stringify({
                        test_name:
                            formData.test_name.trim(),

                        category:
                            formData.category.trim() ||
                            null,

                        description:
                            formData.description.trim() ||
                            null,

                        price:
                            Number(formData.price) || 0,

                        status:
                            formData.status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to save laboratory test"
                );
            }

            await fetchTests(true);

            closeModal();

        } catch (err) {
            console.error(
                "Save Laboratory Test Error:",
                err
            );

            setError(
                err.message ||
                "Unable to save laboratory test."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this laboratory test?"
        );

        if (!confirmed) return;

        try {
            setDeletingId(id);
            setError("");

            const response = await fetch(
                `${API_URL}/laboratory/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete laboratory test"
                );
            }

            setTests((prev) =>
                prev.filter(
                    (test) => test.id !== id
                )
            );

            await fetchTests(true);

        } catch (err) {
            console.error(
                "Delete Laboratory Test Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete laboratory test."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const formatPrice = (price) => {
        const value = Number(price);

        if (Number.isNaN(value)) {
            return "₹0.00";
        }

        return `₹${value.toFixed(2)}`;
    };

    const getStatusClass = (status) => {
        const normalized =
            String(status || "active")
                .toLowerCase();

        return `laboratory-status ${normalized}`;
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalTests = tests.length;

    const activeTests = tests.filter(
        (test) =>
            String(test.status)
                .toLowerCase() === "active"
    ).length;

    const inactiveTests = tests.filter(
        (test) =>
            String(test.status)
                .toLowerCase() === "inactive"
    ).length;

    const totalValue = tests.reduce(
        (sum, test) =>
            sum + Number(test.price || 0),
        0
    );

    // =====================================================
    // SORT
    // =====================================================

    const sortedTests = useMemo(() => {
        return [...tests].sort(
            (a, b) => {
                return (
                    new Date(
                        b.created_at || 0
                    ) -
                    new Date(
                        a.created_at || 0
                    )
                );
            }
        );
    }, [tests]);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="laboratory-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="laboratory-header">

                <div className="laboratory-header-left">

                    <button
                        type="button"
                        className="back-dashboard-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        title="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1>Laboratory</h1>

                        <p>
                            Manage laboratory tests
                            and diagnostic services
                        </p>
                    </div>

                </div>

                <div className="laboratory-header-actions">

                    <button
                        type="button"
                        className="laboratory-refresh"
                        onClick={handleRefresh}
                        disabled={
                            loading ||
                            refreshing
                        }
                        title="Refresh"
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
                        className="add-laboratory-button"
                        onClick={
                            openAddModal
                        }
                    >
                        <FaPlus />

                        <span>
                            Add Lab Test
                        </span>
                    </button>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && !showModal && (
                <div className="laboratory-main-error">

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
                STATS
            ================================================= */}

            <section className="laboratory-summary-grid">

                <div className="laboratory-summary">

                    <div className="summary-icon">
                        <FaFlask />
                    </div>

                    <div>
                        <span>
                            Total Tests
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalTests}
                        </strong>
                    </div>

                </div>

                <div className="laboratory-summary">

                    <div className="summary-icon">
                        <FaCheckCircle />
                    </div>

                    <div>
                        <span>
                            Active Tests
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : activeTests}
                        </strong>
                    </div>

                </div>

                <div className="laboratory-summary">

                    <div className="summary-icon">
                        <FaBan />
                    </div>

                    <div>
                        <span>
                            Inactive Tests
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : inactiveTests}
                        </strong>
                    </div>

                </div>

                <div className="laboratory-summary">

                    <div className="summary-icon">
                        <FaRupeeSign />
                    </div>

                    <div>
                        <span>
                            Total Test Value
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : formatPrice(
                                    totalValue
                                )}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                PANEL
            ================================================= */}

            <section className="laboratory-panel">

                <div className="laboratory-panel-header">

                    <div>
                        <h2>
                            Laboratory Test List
                        </h2>

                        <p>
                            View and manage
                            diagnostic tests
                        </p>
                    </div>

                    <span>
                        {loading
                            ? "Loading..."
                            : `${tests.length} tests`}
                    </span>

                </div>

                {/* LOADING */}

                {loading ? (

                    <div className="laboratory-loading">

                        <FaSyncAlt className="refresh-spin" />

                        <span>
                            Loading laboratory
                            tests...
                        </span>

                    </div>

                ) : tests.length === 0 ? (

                    /* EMPTY */

                    <div className="laboratory-empty">

                        <FaFlask />

                        <strong>
                            No laboratory tests found
                        </strong>

                        <span>
                            Click "Add Lab Test"
                            to create your first
                            laboratory test.
                        </span>

                    </div>

                ) : (

                    /* TABLE */

                    <div className="laboratory-table-wrapper">

                        <table className="laboratory-table">

                            <thead>

                                <tr>

                                    <th>
                                        Test
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Price
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

                                {sortedTests.map(
                                    (test) => (

                                        <tr
                                            key={
                                                test.id
                                            }
                                        >

                                            {/* TEST */}

                                            <td>

                                                <div className="laboratory-test-cell">

                                                    <div className="laboratory-mini-avatar">
                                                        <FaVial />
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                test.test_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                test.test_code
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* CATEGORY */}

                                            <td>

                                                <span className="laboratory-category">

                                                    {
                                                        test.category ||
                                                        "General"
                                                    }

                                                </span>

                                            </td>

                                            {/* DESCRIPTION */}

                                            <td>

                                                <span className="laboratory-description">

                                                    {
                                                        test.description ||
                                                        "-"
                                                    }

                                                </span>

                                            </td>

                                            {/* PRICE */}

                                            <td>

                                                <strong className="laboratory-price">

                                                    {
                                                        formatPrice(
                                                            test.price
                                                        )
                                                    }

                                                </strong>

                                            </td>

                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={
                                                        getStatusClass(
                                                            test.status
                                                        )
                                                    }
                                                >
                                                    {
                                                        test.status ||
                                                        "active"
                                                    }
                                                </span>

                                            </td>

                                            {/* ACTION */}

                                            <td>

                                                <div className="laboratory-actions">

                                                    <button
                                                        type="button"
                                                        className="edit-laboratory-button"
                                                        title="Edit"
                                                        onClick={() =>
                                                            openEditModal(
                                                                test
                                                            )
                                                        }
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete-laboratory-button"
                                                        title="Delete"
                                                        disabled={
                                                            deletingId ===
                                                            test.id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                test.id
                                                            )
                                                        }
                                                    >

                                                        {deletingId ===
                                                            test.id ? (

                                                            <FaSyncAlt className="refresh-spin" />

                                                        ) : (

                                                            <FaTrash />

                                                        )}

                                                    </button>

                                                </div>

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
                MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="laboratory-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="laboratory-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="laboratory-modal-header">

                            <div>

                                <h2>
                                    {editingId
                                        ? "Edit Laboratory Test"
                                        : "Add New Laboratory Test"}
                                </h2>

                                <p>
                                    Enter diagnostic
                                    test information
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close-button"
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

                        {/* FORM ERROR */}

                        {error && (

                            <div className="laboratory-form-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}

                        {/* FORM */}

                        <form
                            className="laboratory-form"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="laboratory-form-grid">

                                {/* TEST NAME */}

                                <div className="form-group">

                                    <label htmlFor="test_name">
                                        <FaFlask />
                                        Test Name
                                    </label>

                                    <input
                                        id="test_name"
                                        type="text"
                                        name="test_name"
                                        placeholder="e.g. Complete Blood Count"
                                        value={
                                            formData.test_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    />

                                </div>

                                {/* CATEGORY */}

                                <div className="form-group">

                                    <label htmlFor="category">
                                        <FaVial />
                                        Category
                                    </label>

                                    <input
                                        id="category"
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Blood Test"
                                        value={
                                            formData.category
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    />

                                </div>

                                {/* PRICE */}

                                <div className="form-group">

                                    <label htmlFor="price">
                                        <FaRupeeSign />
                                        Price
                                    </label>

                                    <input
                                        id="price"
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter test price"
                                        value={
                                            formData.price
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="form-group">

                                    <label htmlFor="status">
                                        <FaCheckCircle />
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

                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="inactive">
                                            Inactive
                                        </option>

                                    </select>

                                </div>

                                {/* DESCRIPTION */}

                                <div className="form-group form-group-full">

                                    <label htmlFor="description">
                                        <FaFlask />
                                        Description
                                    </label>

                                    <textarea
                                        id="description"
                                        name="description"
                                        placeholder="Enter test description"
                                        value={
                                            formData.description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        rows="4"
                                    />

                                </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="laboratory-form-actions">

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
                                    className="save-laboratory-button"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving ? (

                                        <>
                                            <FaSyncAlt className="refresh-spin" />
                                            {editingId
                                                ? "Updating..."
                                                : "Saving..."}
                                        </>

                                    ) : (

                                        <>
                                            {editingId ? (
                                                <FaEdit />
                                            ) : (
                                                <FaPlus />
                                            )}

                                            {editingId
                                                ? "Update Test"
                                                : "Create Test"}
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

export default Laboratory;