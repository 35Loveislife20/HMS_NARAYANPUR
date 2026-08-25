import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaSyncAlt,
    FaPlus,
    FaFileInvoiceDollar,
    FaSearch,
    FaTimes,
    FaUser,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaCreditCard,
    FaNotesMedical,
    FaExclamationTriangle,
    FaSave,
    FaPrint,
    FaFilePdf,
    FaEdit,
    FaTrash,
    FaCheckCircle,
    FaClock,
    FaUserMd,
} from "react-icons/fa";
import "./Billing.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToday = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const emptyForm = {
    patient_id: "",
    bill_date: getToday(),
    consultation_fee: "",
    medicine_amount: "",
    laboratory_amount: "",
    other_charges: "",
    discount: "",
    tax: "",
    payment_method: "cash",
    payment_status: "paid",
    notes: "",
};

const Billing = () => {
    const navigate = useNavigate();
    const printRef = useRef(null);

    const [billing, setBilling] = useState([]);
    const [patients, setPatients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        ...emptyForm,
    });

    const [printBill, setPrintBill] = useState(null);

    /* =====================================================
       AUTH HEADERS
    ===================================================== */

    const getHeaders = () => {
        const token = localStorage.getItem("hms_token");

        return {
            "Content-Type": "application/json",
            ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {}),
        };
    };

    /* =====================================================
       FETCH BILLING
    ===================================================== */

    const fetchBilling = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/billing`, {
                method: "GET",
                headers: getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load billing records"
                );
            }

            const records =
                data.data ||
                data.billing ||
                data.bills ||
                [];

            setBilling(Array.isArray(records) ? records : []);
        } catch (err) {
            console.error("Billing fetch error:", err);

            setError(
                err.message ||
                "Unable to load billing records"
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       FETCH PATIENTS
    ===================================================== */

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${API_URL}/patients`, {
                method: "GET",
                headers: getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load patients"
                );
            }

            const records =
                data.data ||
                data.patients ||
                [];

            setPatients(
                Array.isArray(records)
                    ? records
                    : []
            );
        } catch (err) {
            console.error("Patients fetch error:", err);
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchBilling();
        fetchPatients();
    }, []);

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh = async () => {
        await Promise.all([
            fetchBilling(),
            fetchPatients(),
        ]);
    };

    /* =====================================================
       NUMBER
    ===================================================== */

    const numberValue = (value) => {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    };

    /* =====================================================
       TOTAL
    ===================================================== */

    const calculateTotal = (data) => {
        const consultation =
            numberValue(data.consultation_fee);

        const medicine =
            numberValue(data.medicine_amount);

        const laboratory =
            numberValue(data.laboratory_amount);

        const other =
            numberValue(data.other_charges);

        const discount =
            numberValue(data.discount);

        const tax =
            numberValue(data.tax);

        return Math.max(
            0,
            consultation +
            medicine +
            laboratory +
            other -
            discount +
            tax
        );
    };

    const formTotal = useMemo(() => {
        return calculateTotal(formData);
    }, [formData]);

    /* =====================================================
       SEARCH
    ===================================================== */

    const filteredBilling = useMemo(() => {
        const value = search
            .toLowerCase()
            .trim();

        if (!value) {
            return billing;
        }

        return billing.filter((bill) => {
            const patientName =
                bill.patient_name ||
                bill.name ||
                "";

            const patientCode =
                bill.patient_code ||
                bill.patient_id_code ||
                "";

            const billNumber =
                bill.bill_number ||
                bill.invoice_number ||
                bill.bill_no ||
                `BILL-${bill.id || ""}`;

            return (
                String(patientName)
                    .toLowerCase()
                    .includes(value) ||
                String(patientCode)
                    .toLowerCase()
                    .includes(value) ||
                String(billNumber)
                    .toLowerCase()
                    .includes(value) ||
                String(
                    bill.payment_method || ""
                )
                    .toLowerCase()
                    .includes(value) ||
                String(
                    bill.payment_status || ""
                )
                    .toLowerCase()
                    .includes(value)
            );
        });
    }, [billing, search]);

    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary = useMemo(() => {
        let totalAmount = 0;
        let paidAmount = 0;
        let pendingCount = 0;

        billing.forEach((bill) => {
            const total = calculateTotal(bill);

            totalAmount += total;

            const status = String(
                bill.payment_status ||
                bill.status ||
                "pending"
            ).toLowerCase();

            if (status === "paid") {
                paidAmount += total;
            }

            if (
                status === "pending" ||
                status === "partial"
            ) {
                pendingCount++;
            }
        });

        return {
            totalBills: billing.length,
            totalAmount,
            paidAmount,
            pendingCount,
        };
    }, [billing]);

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFormError("");
    };

    /* =====================================================
       OPEN ADD
    ===================================================== */

    const openAddModal = () => {
        setEditingId(null);

        setFormData({
            ...emptyForm,
            bill_date: getToday(),
        });

        setFormError("");
        setShowModal(true);
    };

    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const openEditModal = (bill) => {
        setEditingId(bill.id);

        setFormData({
            patient_id:
                bill.patient_id || "",

            bill_date:
                bill.bill_date
                    ? String(
                        bill.bill_date
                    ).slice(0, 10)
                    : getToday(),

            consultation_fee:
                bill.consultation_fee ??
                "",

            medicine_amount:
                bill.medicine_amount ??
                "",

            laboratory_amount:
                bill.laboratory_amount ??
                "",

            other_charges:
                bill.other_charges ??
                "",

            discount:
                bill.discount ?? "",

            tax:
                bill.tax ?? "",

            payment_method:
                bill.payment_method ||
                "cash",

            payment_status:
                bill.payment_status ||
                bill.status ||
                "paid",

            notes:
                bill.notes ||
                bill.description ||
                "",
        });

        setFormError("");
        setShowModal(true);
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingId(null);
        setFormError("");

        setFormData({
            ...emptyForm,
            bill_date: getToday(),
        });
    };

    /* =====================================================
       SAVE BILL
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        if (!formData.patient_id) {
            setFormError(
                "Please select a patient."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                patient_id:
                    Number(formData.patient_id),

                bill_date:
                    formData.bill_date,

                consultation_fee:
                    numberValue(
                        formData.consultation_fee
                    ),

                medicine_amount:
                    numberValue(
                        formData.medicine_amount
                    ),

                laboratory_amount:
                    numberValue(
                        formData.laboratory_amount
                    ),

                other_charges:
                    numberValue(
                        formData.other_charges
                    ),

                discount:
                    numberValue(
                        formData.discount
                    ),

                tax:
                    numberValue(formData.tax),

                payment_method:
                    formData.payment_method,

                payment_status:
                    formData.payment_status,

                notes:
                    formData.notes.trim(),
            };

            const url = editingId
                ? `${API_URL}/billing/${editingId}`
                : `${API_URL}/billing`;

            const method = editingId
                ? "PUT"
                : "POST";

            const response = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to save billing record"
                );
            }

            closeModal();

            await fetchBilling();
        } catch (err) {
            console.error(
                "Save billing error:",
                err
            );

            setFormError(
                err.message ||
                "Unable to save billing record"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       DELETE BILL
    ===================================================== */

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this bill?"
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(id);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/billing/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to delete bill"
                );
            }

            await fetchBilling();
        } catch (err) {
            console.error(
                "Delete billing error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete bill"
            );
        } finally {
            setDeletingId(null);
        }
    };

    /* =====================================================
       FORMAT CURRENCY
    ===================================================== */

    const formatCurrency = (amount) => {
        return `₹${numberValue(
            amount
        ).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    /* =====================================================
       FORMAT DATE
    ===================================================== */

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return String(date);
        }

        return parsed.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    /* =====================================================
       BILL NUMBER
    ===================================================== */

    const getBillNumber = (bill) => {
        return (
            bill.bill_number ||
            bill.invoice_number ||
            bill.bill_no ||
            `BILL-${String(
                bill.id || 0
            ).padStart(4, "0")}`
        );
    };

    /* =====================================================
       PATIENT NAME
    ===================================================== */

    const getPatientName = (bill) => {
        return (
            bill.patient_name ||
            bill.name ||
            "Unknown Patient"
        );
    };

    /* =====================================================
       PATIENT CODE
    ===================================================== */

    const getPatientCode = (bill) => {
        return (
            bill.patient_code ||
            bill.patient_id_code ||
            "N/A"
        );
    };

    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    const getPaymentStatus = (bill) => {
        return (
            bill.payment_status ||
            bill.status ||
            "pending"
        );
    };

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const formatPaymentMethod = (
        method
    ) => {
        const value = String(
            method || ""
        ).toLowerCase();

        const labels = {
            cash: "Cash",
            upi: "UPI",
            card: "Card",
            bank_transfer:
                "Bank Transfer",
            insurance: "Insurance",
        };

        return (
            labels[value] ||
            method ||
            "-"
        );
    };

    /* =====================================================
       PRINT BILL
    ===================================================== */

    const handlePrint = (bill) => {
        setPrintBill(bill);

        setTimeout(() => {
            window.print();
        }, 150);
    };

    /* =====================================================
       AFTER PRINT
    ===================================================== */

    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintBill(null);
        };

        window.addEventListener(
            "afterprint",
            handleAfterPrint
        );

        return () => {
            window.removeEventListener(
                "afterprint",
                handleAfterPrint
            );
        };
    }, []);

    /* =====================================================
       PRINT DATA
    ===================================================== */

    const printTotal = printBill
        ? calculateTotal(printBill)
        : 0;

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="billing-page">
            {/* =================================================
                HEADER
            ================================================= */}

            <header className="billing-header">
                <div className="billing-header-left">
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
                        <h1>Billing</h1>

                        <p>
                            Manage hospital
                            bills and payments
                        </p>
                    </div>
                </div>

                <div className="billing-header-actions">
                    <button
                        type="button"
                        className="billing-refresh"
                        onClick={
                            handleRefresh
                        }
                        disabled={loading}
                        title="Refresh"
                    >
                        <FaSyncAlt
                            className={
                                loading
                                    ? "refresh-spin"
                                    : ""
                            }
                        />
                    </button>

                    <button
                        type="button"
                        className="add-billing-button"
                        onClick={
                            openAddModal
                        }
                    >
                        <FaPlus />
                        <span>
                            Add Bill
                        </span>
                    </button>
                </div>
            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="billing-main-error">
                    <FaExclamationTriangle />

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="billing-summary-grid">
                <div className="billing-summary">
                    <div className="summary-icon">
                        <FaFileInvoiceDollar />
                    </div>

                    <div>
                        <span>
                            Total Bills
                        </span>

                        <strong>
                            {
                                summary.totalBills
                            }
                        </strong>
                    </div>
                </div>

                <div className="billing-summary">
                    <div className="summary-icon">
                        <FaMoneyBillWave />
                    </div>

                    <div>
                        <span>
                            Total Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                summary.totalAmount
                            )}
                        </strong>
                    </div>
                </div>

                <div className="billing-summary">
                    <div className="summary-icon">
                        <FaCheckCircle />
                    </div>

                    <div>
                        <span>
                            Paid Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                summary.paidAmount
                            )}
                        </strong>
                    </div>
                </div>

                <div className="billing-summary">
                    <div className="summary-icon">
                        <FaClock />
                    </div>

                    <div>
                        <span>
                            Pending Bills
                        </span>

                        <strong>
                            {
                                summary.pendingCount
                            }
                        </strong>
                    </div>
                </div>
            </section>

            {/* =================================================
                MAIN PANEL
            ================================================= */}

            <section className="billing-panel">
                <div className="billing-panel-header">
                    <div>
                        <h2>
                            Billing Records
                        </h2>

                        <p>
                            View and manage
                            patient invoices
                        </p>
                    </div>

                    <span>
                        {loading
                            ? "Loading..."
                            : `${filteredBilling.length} bills`}
                    </span>
                </div>

                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="billing-toolbar">
                    <div className="billing-search">
                        <FaSearch />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Search patient, bill number, payment..."
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch(
                                        ""
                                    )
                                }
                                title="Clear search"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>

                {/* =================================================
                    CONTENT
                ================================================= */}

                {loading ? (
                    <div className="billing-page-loading">
                        <FaSyncAlt className="refresh-spin" />

                        <span>
                            Loading billing
                            records...
                        </span>
                    </div>
                ) : filteredBilling.length ===
                    0 ? (
                    <div className="billing-page-empty">
                        <FaFileInvoiceDollar />

                        <strong>
                            No billing records
                            found
                        </strong>

                        <span>
                            Create a new bill
                            to get started.
                        </span>

                        <button
                            type="button"
                            className="empty-create-billing-button"
                            onClick={
                                openAddModal
                            }
                        >
                            <FaPlus />
                            Create Bill
                        </button>
                    </div>
                ) : (
                    <div className="billing-table-wrapper">
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>
                                        Bill
                                    </th>

                                    <th>
                                        Patient
                                    </th>

                                    <th>
                                        Bill Date
                                    </th>

                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBilling.map(
                                    (bill) => {
                                        const status =
                                            String(
                                                getPaymentStatus(
                                                    bill
                                                )
                                            ).toLowerCase();

                                        return (
                                            <tr
                                                key={
                                                    bill.id
                                                }
                                            >
                                                <td>
                                                    <div className="bill-cell">
                                                        <div className="bill-mini-avatar">
                                                            <FaFileInvoiceDollar />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {getBillNumber(
                                                                    bill
                                                                )}
                                                            </strong>

                                                            <span>
                                                                ID #
                                                                {
                                                                    bill.id
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="patient-bill-cell">
                                                        <div className="patient-mini-avatar">
                                                            <FaUser />
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {getPatientName(
                                                                    bill
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {
                                                                    getPatientCode(
                                                                        bill
                                                                    )
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="billing-date-cell">
                                                        <FaCalendarAlt />

                                                        <span>
                                                            {formatDate(
                                                                bill.bill_date
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="payment-method">
                                                        {formatPaymentMethod(
                                                            bill.payment_method
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="billing-total-cell">
                                                        {formatCurrency(
                                                            calculateTotal(
                                                                bill
                                                            )
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`billing-status ${status}`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="billing-actions">
                                                        <button
                                                            type="button"
                                                            className="print-billing-button"
                                                            onClick={() =>
                                                                handlePrint(
                                                                    bill
                                                                )
                                                            }
                                                            title="Print Bill"
                                                        >
                                                            <FaPrint />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="pdf-billing-button"
                                                            onClick={() =>
                                                                handlePrint(
                                                                    bill
                                                                )
                                                            }
                                                            title="Print / Save PDF"
                                                        >
                                                            <FaFilePdf />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="edit-billing-button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    bill
                                                                )
                                                            }
                                                            title="Edit Bill"
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-billing-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    bill.id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                bill.id
                                                            }
                                                            title="Delete Bill"
                                                        >
                                                            {deletingId ===
                                                                bill.id ? (
                                                                <FaSyncAlt className="refresh-spin" />
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
                BILLING MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="billing-modal-overlay"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="billing-modal">
                        <div className="billing-modal-header">
                            <div>
                                <h2>
                                    {editingId
                                        ? "Edit Bill"
                                        : "Create New Bill"}
                                </h2>

                                <p>
                                    Enter patient
                                    billing
                                    information
                                </p>
                            </div>

                            <button
                                type="button"
                                className="billing-modal-close-button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {formError && (
                            <div className="billing-form-error">
                                <FaExclamationTriangle />

                                <span>
                                    {
                                        formError
                                    }
                                </span>
                            </div>
                        )}

                        <form
                            className="billing-form"
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <div className="billing-form-grid">
                                {/* PATIENT */}

                                <div className="billing-form-group">
                                    <label htmlFor="patient_id">
                                        <FaUser />
                                        Patient
                                    </label>

                                    <select
                                        id="patient_id"
                                        name="patient_id"
                                        value={
                                            formData.patient_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Patient
                                        </option>

                                        {patients.map(
                                            (
                                                patient
                                            ) => (
                                                <option
                                                    key={
                                                        patient.id
                                                    }
                                                    value={
                                                        patient.id
                                                    }
                                                >
                                                    {patient.name ||
                                                        patient.full_name}{" "}
                                                    -{" "}
                                                    {patient.patient_code ||
                                                        `P-${patient.id}`}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* DATE */}

                                <div className="billing-form-group">
                                    <label htmlFor="bill_date">
                                        <FaCalendarAlt />
                                        Bill Date
                                    </label>

                                    <input
                                        id="bill_date"
                                        name="bill_date"
                                        type="date"
                                        value={
                                            formData.bill_date
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

                                {/* CONSULTATION */}

                                <div className="billing-form-group">
                                    <label htmlFor="consultation_fee">
                                        <FaMoneyBillWave />
                                        Consultation Fee
                                    </label>

                                    <input
                                        id="consultation_fee"
                                        name="consultation_fee"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.consultation_fee
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* MEDICINE */}

                                <div className="billing-form-group">
                                    <label htmlFor="medicine_amount">
                                        <FaMoneyBillWave />
                                        Medicine
                                    </label>

                                    <input
                                        id="medicine_amount"
                                        name="medicine_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.medicine_amount
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* LABORATORY */}

                                <div className="billing-form-group">
                                    <label htmlFor="laboratory_amount">
                                        <FaNotesMedical />
                                        Laboratory
                                    </label>

                                    <input
                                        id="laboratory_amount"
                                        name="laboratory_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.laboratory_amount
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* OTHER */}

                                <div className="billing-form-group">
                                    <label htmlFor="other_charges">
                                        <FaMoneyBillWave />
                                        Other Charges
                                    </label>

                                    <input
                                        id="other_charges"
                                        name="other_charges"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.other_charges
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* DISCOUNT */}

                                <div className="billing-form-group">
                                    <label htmlFor="discount">
                                        <FaMoneyBillWave />
                                        Discount
                                    </label>

                                    <input
                                        id="discount"
                                        name="discount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.discount
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* TAX */}

                                <div className="billing-form-group">
                                    <label htmlFor="tax">
                                        <FaMoneyBillWave />
                                        Tax
                                    </label>

                                    <input
                                        id="tax"
                                        name="tax"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            formData.tax
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* PAYMENT METHOD */}

                                <div className="billing-form-group">
                                    <label htmlFor="payment_method">
                                        <FaCreditCard />
                                        Payment Method
                                    </label>

                                    <select
                                        id="payment_method"
                                        name="payment_method"
                                        value={
                                            formData.payment_method
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        <option value="cash">
                                            Cash
                                        </option>

                                        <option value="upi">
                                            UPI
                                        </option>

                                        <option value="card">
                                            Card
                                        </option>

                                        <option value="bank_transfer">
                                            Bank Transfer
                                        </option>

                                        <option value="insurance">
                                            Insurance
                                        </option>
                                    </select>
                                </div>

                                {/* STATUS */}

                                <div className="billing-form-group">
                                    <label htmlFor="payment_status">
                                        <FaCheckCircle />
                                        Payment Status
                                    </label>

                                    <select
                                        id="payment_status"
                                        name="payment_status"
                                        value={
                                            formData.payment_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        <option value="paid">
                                            Paid
                                        </option>

                                        <option value="pending">
                                            Pending
                                        </option>

                                        <option value="partial">
                                            Partial
                                        </option>

                                        <option value="cancelled">
                                            Cancelled
                                        </option>
                                    </select>
                                </div>

                                {/* NOTES */}

                                <div className="billing-form-group billing-form-group-full">
                                    <label htmlFor="notes">
                                        <FaNotesMedical />
                                        Notes
                                    </label>

                                    <textarea
                                        id="notes"
                                        name="notes"
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            saving
                                        }
                                        placeholder="Additional billing notes..."
                                    />
                                </div>
                            </div>

                            {/* TOTAL */}

                            <div className="billing-total-preview">
                                <div>
                                    <span>
                                        Grand Total
                                    </span>

                                    <small>
                                        Consultation +
                                        Medicine +
                                        Laboratory +
                                        Other - Discount
                                        + Tax
                                    </small>
                                </div>

                                <strong>
                                    {formatCurrency(
                                        formTotal
                                    )}
                                </strong>
                            </div>

                            {/* ACTIONS */}

                            <div className="billing-form-actions">
                                <button
                                    type="button"
                                    className="cancel-billing-button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    <FaTimes />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-billing-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="refresh-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            {editingId
                                                ? "Update Bill"
                                                : "Save Bill"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                PRINTABLE A4 INVOICE
            ================================================= */}

            <div
                ref={printRef}
                className="print-bill-container"
            >
                {printBill && (
                    <div className="print-bill">

                        {/* DOCTOR WATERMARK */}

                        <div
                            className="print-doctor-watermark"
                            aria-hidden="true"
                        >
                            <img
                                src="/doctor-watermark.png"
                                alt=""
                            />
                        </div>

                        {/* HMS HEADER */}

                        <header className="print-hospital-header">
                            <div className="print-hospital-brand">
                                <img
                                    src="/hms-logo.png"
                                    alt="HMS Hospital"
                                    className="print-hospital-logo"
                                />

                                <div className="print-hospital-name">
                                    <h1>
                                        HMS HOSPITAL
                                    </h1>

                                    <p>
                                        Hospital
                                        Management
                                        System
                                    </p>

                                    <span>
                                        Quality
                                        Healthcare &
                                        Patient Care
                                    </span>
                                </div>
                            </div>

                            <div className="print-invoice-box">
                                <strong>
                                    INVOICE
                                </strong>

                                <span>
                                    {getBillNumber(
                                        printBill
                                    )}
                                </span>
                            </div>
                        </header>

                        {/* PATIENT + BILL INFORMATION */}

                        <section className="print-patient-section">
                            <div>
                                <h3>
                                    Patient Information
                                </h3>

                                <p>
                                    <strong>
                                        Name:
                                    </strong>{" "}
                                    {getPatientName(
                                        printBill
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Patient ID:
                                    </strong>{" "}
                                    {getPatientCode(
                                        printBill
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Phone:
                                    </strong>{" "}
                                    {printBill.patient_phone ||
                                        printBill.phone ||
                                        "N/A"}
                                </p>
                            </div>

                            <div>
                                <h3>
                                    Bill Information
                                </h3>

                                <p>
                                    <strong>
                                        Bill Date:
                                    </strong>{" "}
                                    {formatDate(
                                        printBill.bill_date
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Payment:
                                    </strong>{" "}
                                    {formatPaymentMethod(
                                        printBill.payment_method
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Status:
                                    </strong>{" "}
                                    {String(
                                        getPaymentStatus(
                                            printBill
                                        )
                                    ).toUpperCase()}
                                </p>
                            </div>
                        </section>

                        {/* BILL TABLE */}

                        <table className="print-bill-table">
                            <thead>
                                <tr>
                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>
                                        Consultation
                                        Fee
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            printBill.consultation_fee
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        Medicine
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            printBill.medicine_amount
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        Laboratory
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            printBill.laboratory_amount
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        Other Charges
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            printBill.other_charges
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        Discount
                                    </td>

                                    <td>
                                        -{" "}
                                        {formatCurrency(
                                            printBill.discount
                                        )}
                                    </td>
                                </tr>

                                <tr>
                                    <td>
                                        Tax
                                    </td>

                                    <td>
                                        {formatCurrency(
                                            printBill.tax
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* GRAND TOTAL */}

                        <div className="print-total-row">
                            <span>
                                Grand Total
                            </span>

                            <strong>
                                {formatCurrency(
                                    printTotal
                                )}
                            </strong>
                        </div>

                        {/* NOTES */}

                        {printBill.notes ||
                            printBill.description ? (
                            <div className="print-notes">
                                <strong>
                                    Notes
                                </strong>

                                <p>
                                    {printBill.notes ||
                                        printBill.description}
                                </p>
                            </div>
                        ) : null}

                        {/* FOOTER */}

                        <footer className="print-footer">
                            <div className="print-footer-brand">
                                <img
                                    src="/hms-logo.png"
                                    alt="HMS Hospital"
                                />

                                <div>
                                    <strong>
                                        HMS HOSPITAL
                                    </strong>

                                    <span>
                                        Hospital
                                        Management
                                        System
                                    </span>
                                </div>
                            </div>

                            <p>
                                Thank you for
                                choosing HMS
                                Hospital.
                            </p>

                            <span>
                                Quality Healthcare
                                & Patient Care
                            </span>
                        </footer>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Billing;