import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaPlus,
    FaSyncAlt,
    FaTrash,
    FaTimes,
    FaPills,
    FaBoxes,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaIndustry,
    FaTag,
    FaFileMedicalAlt,
} from "react-icons/fa";

import "./Pharmacy.css";

const Pharmacy = () => {
    const navigate = useNavigate();

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    // =====================================================
    // STATES
    // =====================================================

    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    // =====================================================
    // EMPTY FORM
    // =====================================================

    const emptyForm = {
        medicine_code: "",
        medicine_name: "",
        category: "",
        manufacturer: "",
        batch_number: "",
        quantity: "",
        unit_price: "",
        expiry_date: "",
        description: "",
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
    // FETCH MEDICINES
    // =====================================================

    const fetchMedicines = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(`${API_URL}/medicines`, {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load medicines"
                );
            }

            if (!data.success || !Array.isArray(data.medicines)) {
                throw new Error("Invalid medicines response");
            }

            setMedicines([...data.medicines]);

        } catch (err) {
            console.error("Fetch Medicines Error:", err);

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
        fetchMedicines(false);
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        if (loading || refreshing) return;

        await fetchMedicines(true);
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
    // OPEN MODAL
    // =====================================================

    const openAddModal = () => {
        setFormData({
            ...emptyForm,
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
        setFormData({
            ...emptyForm,
        });
    };

    // =====================================================
    // ESC KEY
    // =====================================================

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && showModal) {
                closeModal();
            }
        };

        document.addEventListener("keydown", handleEsc);

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

        // -----------------------------
        // VALIDATION
        // -----------------------------

        if (!formData.medicine_code.trim()) {
            setError("Please enter medicine code.");
            return;
        }

        if (!formData.medicine_name.trim()) {
            setError("Please enter medicine name.");
            return;
        }

        if (!formData.quantity && formData.quantity !== 0) {
            setError("Please enter quantity.");
            return;
        }

        if (
            formData.quantity !== "" &&
            Number(formData.quantity) < 0
        ) {
            setError("Quantity cannot be negative.");
            return;
        }

        if (
            formData.unit_price !== "" &&
            Number(formData.unit_price) < 0
        ) {
            setError("Unit price cannot be negative.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/medicines`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        medicine_code:
                            formData.medicine_code.trim(),

                        medicine_name:
                            formData.medicine_name.trim(),

                        category:
                            formData.category.trim() || null,

                        manufacturer:
                            formData.manufacturer.trim() || null,

                        batch_number:
                            formData.batch_number.trim() || null,

                        quantity:
                            Number(formData.quantity) || 0,

                        unit_price:
                            Number(formData.unit_price) || 0,

                        expiry_date:
                            formData.expiry_date || null,

                        description:
                            formData.description.trim() || null,

                        status:
                            formData.status || "active",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to create medicine"
                );
            }

            await fetchMedicines(true);

            setShowModal(false);

            setFormData({
                ...emptyForm,
            });

        } catch (err) {
            console.error(
                "Create Medicine Error:",
                err
            );

            setError(
                err.message ||
                "Unable to create medicine."
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
            "Are you sure you want to delete this medicine?"
        );

        if (!confirmed) return;

        try {
            setDeletingId(id);
            setError("");

            const response = await fetch(
                `${API_URL}/medicines/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete medicine"
                );
            }

            setMedicines((prev) =>
                prev.filter(
                    (medicine) =>
                        medicine.id !== id
                )
            );

        } catch (err) {
            console.error(
                "Delete Medicine Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete medicine."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "-";
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

    const formatPrice = (price) => {
        const number = Number(price);

        if (Number.isNaN(number)) {
            return "₹0.00";
        }

        return `₹${number.toFixed(2)}`;
    };

    const getStatusClass = (status) => {
        const normalized = String(
            status || "active"
        ).toLowerCase();

        return `medicine-status ${normalized}`;
    };

    const getStockClass = (quantity) => {
        const stock = Number(quantity) || 0;

        if (stock === 0) {
            return "stock-zero";
        }

        if (stock <= 10) {
            return "stock-low";
        }

        return "stock-good";
    };

    const getStockText = (quantity) => {
        const stock = Number(quantity) || 0;

        if (stock === 0) {
            return "Out of Stock";
        }

        if (stock <= 10) {
            return "Low Stock";
        }

        return "In Stock";
    };

    // =====================================================
    // SORT
    // =====================================================

    const sortedMedicines = useMemo(() => {
        return [...medicines].sort((a, b) => {
            const dateA = new Date(
                a.created_at || 0
            );

            const dateB = new Date(
                b.created_at || 0
            );

            return dateB - dateA;
        });
    }, [medicines]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalMedicines =
        medicines.length;

    const activeMedicines =
        medicines.filter(
            (medicine) =>
                String(
                    medicine.status || ""
                ).toLowerCase() === "active"
        ).length;

    const lowStockMedicines =
        medicines.filter((medicine) => {
            const quantity =
                Number(medicine.quantity) || 0;

            return quantity > 0 && quantity <= 10;
        }).length;

    const outOfStockMedicines =
        medicines.filter((medicine) => {
            const quantity =
                Number(medicine.quantity) || 0;

            return quantity === 0;
        }).length;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="pharmacy-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="pharmacy-header">

                <div className="pharmacy-header-left">

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
                        <h1>Pharmacy</h1>

                        <p>
                            Manage medicines, stock and
                            pharmacy inventory
                        </p>
                    </div>

                </div>

                <div className="pharmacy-header-actions">

                    <button
                        type="button"
                        className="pharmacy-refresh"
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
                        className="add-medicine-button"
                        onClick={openAddModal}
                    >
                        <FaPlus />
                        <span>
                            Add Medicine
                        </span>
                    </button>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && !showModal && (
                <div className="pharmacy-main-error">

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
                STATISTICS
            ================================================= */}

            <section className="pharmacy-summary-grid">

                {/* TOTAL */}

                <div className="pharmacy-summary">

                    <div className="summary-icon">
                        <FaPills />
                    </div>

                    <div>
                        <span>
                            Total Medicines
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : totalMedicines}
                        </strong>
                    </div>

                </div>

                {/* ACTIVE */}

                <div className="pharmacy-summary">

                    <div className="summary-icon">
                        <FaBoxes />
                    </div>

                    <div>
                        <span>
                            Active
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : activeMedicines}
                        </strong>
                    </div>

                </div>

                {/* LOW STOCK */}

                <div className="pharmacy-summary">

                    <div className="summary-icon">
                        <FaExclamationTriangle />
                    </div>

                    <div>
                        <span>
                            Low Stock
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : lowStockMedicines}
                        </strong>
                    </div>

                </div>

                {/* OUT OF STOCK */}

                <div className="pharmacy-summary">

                    <div className="summary-icon">
                        <FaFileMedicalAlt />
                    </div>

                    <div>
                        <span>
                            Out of Stock
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : outOfStockMedicines}
                        </strong>
                    </div>

                </div>

            </section>

            {/* =================================================
                PANEL
            ================================================= */}

            <section className="pharmacy-panel">

                <div className="pharmacy-panel-header">

                    <div>

                        <h2>
                            Medicine Inventory
                        </h2>

                        <p>
                            View and manage pharmacy
                            medicines and stock
                        </p>

                    </div>

                    <span>
                        {loading
                            ? "Loading..."
                            : `${medicines.length} medicines`}
                    </span>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="pharmacy-page-loading">

                        <FaSyncAlt className="refresh-spin" />

                        <span>
                            Loading medicines...
                        </span>

                    </div>

                ) : medicines.length === 0 ? (

                    /* =================================================
                       EMPTY
                    ================================================= */

                    <div className="pharmacy-page-empty">

                        <FaPills />

                        <strong>
                            No medicines found
                        </strong>

                        <span>
                            Click "Add Medicine" to
                            add your first medicine.
                        </span>

                    </div>

                ) : (

                    /* =================================================
                       TABLE
                    ================================================= */

                    <div className="pharmacy-table-wrapper">

                        <table className="pharmacy-table">

                            <thead>

                                <tr>

                                    <th>
                                        Medicine
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Manufacturer
                                    </th>

                                    <th>
                                        Batch
                                    </th>

                                    <th>
                                        Stock
                                    </th>

                                    <th>
                                        Price
                                    </th>

                                    <th>
                                        Expiry
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

                                {sortedMedicines.map(
                                    (medicine) => (

                                        <tr
                                            key={
                                                medicine.id
                                            }
                                        >

                                            {/* MEDICINE */}

                                            <td>

                                                <div className="medicine-cell">

                                                    <div className="medicine-mini-avatar">
                                                        <FaPills />
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                medicine.medicine_name ||
                                                                "Unknown Medicine"
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                medicine.medicine_code ||
                                                                `MED-${medicine.id}`
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* CATEGORY */}

                                            <td>

                                                <span className="category-cell">

                                                    {medicine.category ||
                                                        "-"}

                                                </span>

                                            </td>

                                            {/* MANUFACTURER */}

                                            <td>

                                                <div className="manufacturer-cell">

                                                    <FaIndustry />

                                                    <span>
                                                        {
                                                            medicine.manufacturer ||
                                                            "-"
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            {/* BATCH */}

                                            <td>

                                                <span className="batch-cell">

                                                    {medicine.batch_number ||
                                                        "-"}

                                                </span>

                                            </td>

                                            {/* STOCK */}

                                            <td>

                                                <div className="stock-cell">

                                                    <strong
                                                        className={getStockClass(
                                                            medicine.quantity
                                                        )}
                                                    >
                                                        {
                                                            Number(
                                                                medicine.quantity
                                                            ) || 0
                                                        }
                                                    </strong>

                                                    <span
                                                        className={getStockClass(
                                                            medicine.quantity
                                                        )}
                                                    >
                                                        {getStockText(
                                                            medicine.quantity
                                                        )}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* PRICE */}

                                            <td>

                                                <strong className="price-cell">

                                                    {formatPrice(
                                                        medicine.unit_price
                                                    )}

                                                </strong>

                                            </td>

                                            {/* EXPIRY */}

                                            <td>

                                                <div className="expiry-cell">

                                                    <FaCalendarAlt />

                                                    <span>
                                                        {formatDate(
                                                            medicine.expiry_date
                                                        )}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={getStatusClass(
                                                        medicine.status
                                                    )}
                                                >
                                                    {
                                                        medicine.status ||
                                                        "active"
                                                    }
                                                </span>

                                            </td>

                                            {/* DELETE */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="delete-medicine-button"
                                                    title="Delete Medicine"
                                                    disabled={
                                                        deletingId ===
                                                        medicine.id
                                                    }
                                                    onClick={() =>
                                                        handleDelete(
                                                            medicine.id
                                                        )
                                                    }
                                                >

                                                    {deletingId ===
                                                        medicine.id ? (
                                                        <FaSyncAlt className="refresh-spin" />
                                                    ) : (
                                                        <FaTrash />
                                                    )}

                                                </button>

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
                ADD MEDICINE MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="pharmacy-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="pharmacy-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="pharmacy-modal-header">

                            <div>

                                <h2>
                                    Add New Medicine
                                </h2>

                                <p>
                                    Enter medicine and
                                    inventory details
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* FORM ERROR */}

                        {error && (

                            <div className="pharmacy-form-error">

                                <FaExclamationTriangle />

                                <span>
                                    {error}
                                </span>

                            </div>

                        )}

                        {/* FORM */}

                        <form
                            className="pharmacy-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-grid">

                                {/* MEDICINE CODE */}

                                <div className="form-group">

                                    <label htmlFor="medicine_code">
                                        <FaTag />
                                        Medicine Code
                                    </label>

                                    <input
                                        id="medicine_code"
                                        type="text"
                                        name="medicine_code"
                                        placeholder="e.g. MED-0001"
                                        value={
                                            formData.medicine_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        required
                                    />

                                </div>

                                {/* MEDICINE NAME */}

                                <div className="form-group">

                                    <label htmlFor="medicine_name">
                                        <FaPills />
                                        Medicine Name
                                    </label>

                                    <input
                                        id="medicine_name"
                                        type="text"
                                        name="medicine_name"
                                        placeholder="Enter medicine name"
                                        value={
                                            formData.medicine_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        required
                                    />

                                </div>

                                {/* CATEGORY */}

                                <div className="form-group">

                                    <label htmlFor="category">
                                        <FaFileMedicalAlt />
                                        Category
                                    </label>

                                    <input
                                        id="category"
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Antibiotic"
                                        value={
                                            formData.category
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* MANUFACTURER */}

                                <div className="form-group">

                                    <label htmlFor="manufacturer">
                                        <FaIndustry />
                                        Manufacturer
                                    </label>

                                    <input
                                        id="manufacturer"
                                        type="text"
                                        name="manufacturer"
                                        placeholder="Enter manufacturer"
                                        value={
                                            formData.manufacturer
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* BATCH */}

                                <div className="form-group">

                                    <label htmlFor="batch_number">
                                        <FaTag />
                                        Batch Number
                                    </label>

                                    <input
                                        id="batch_number"
                                        type="text"
                                        name="batch_number"
                                        placeholder="Enter batch number"
                                        value={
                                            formData.batch_number
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* QUANTITY */}

                                <div className="form-group">

                                    <label htmlFor="quantity">
                                        <FaBoxes />
                                        Quantity
                                    </label>

                                    <input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        min="0"
                                        placeholder="0"
                                        value={
                                            formData.quantity
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        required
                                    />

                                </div>

                                {/* UNIT PRICE */}

                                <div className="form-group">

                                    <label htmlFor="unit_price">
                                        Unit Price
                                    </label>

                                    <input
                                        id="unit_price"
                                        type="number"
                                        name="unit_price"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={
                                            formData.unit_price
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* EXPIRY DATE */}

                                <div className="form-group">

                                    <label htmlFor="expiry_date">
                                        <FaCalendarAlt />
                                        Expiry Date
                                    </label>

                                    <input
                                        id="expiry_date"
                                        type="date"
                                        name="expiry_date"
                                        value={
                                            formData.expiry_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                </div>

                                {/* DESCRIPTION */}

                                <div className="form-group form-group-full">

                                    <label htmlFor="description">
                                        Description
                                    </label>

                                    <textarea
                                        id="description"
                                        name="description"
                                        placeholder="Enter medicine description"
                                        value={
                                            formData.description
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                        rows="3"
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="form-group">

                                    <label htmlFor="status">
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

                            </div>

                            {/* FORM ACTIONS */}

                            <div className="pharmacy-form-actions">

                                <button
                                    type="button"
                                    className="cancel-form-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-medicine-button"
                                    disabled={saving}
                                >

                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="refresh-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            Add Medicine
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
};

export default Pharmacy;