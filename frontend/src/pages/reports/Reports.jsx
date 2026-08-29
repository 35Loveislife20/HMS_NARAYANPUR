import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import "./Reports.css";

const API_BASE = "http://localhost:5000/api";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getAuthHeaders = () => {
    const token =
        localStorage.getItem("hms_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return {
        ...(token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : {}),
        "Content-Type": "application/json",
    };
};

const fetchJSON = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            `Request failed: ${response.status}`
        );
    }

    if (data?.success === false) {
        throw new Error(
            data?.message || "Request failed."
        );
    }

    return data;
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    loading,
}) => {
    return (
        <div className="report-stat-card">
            <div className="report-stat-icon">
                {icon}
            </div>

            <div className="report-stat-content">
                <span>{title}</span>

                <strong>
                    {loading ? "..." : value}
                </strong>

                {subtitle && (
                    <small>{subtitle}</small>
                )}
            </div>
        </div>
    );
};

/* =========================================================
   PROGRESS ROW
========================================================= */

const ProgressRow = ({
    label,
    value,
    total,
    percentage,
}) => {
    const calculatedPercentage =
        percentage !== undefined
            ? Number(percentage)
            : total > 0
                ? Math.round(
                    (Number(value || 0) /
                        Number(total || 0)) *
                    100
                )
                : 0;

    const safePercentage = Math.min(
        Math.max(calculatedPercentage, 0),
        100
    );

    return (
        <div className="report-progress-row">
            <div className="report-progress-info">
                <span>{label}</span>

                <strong>{value}</strong>
            </div>

            <div className="report-progress-track">
                <div
                    className="report-progress-fill"
                    style={{
                        width: `${safePercentage}%`,
                    }}
                />
            </div>

            <small>
                {calculatedPercentage}%
            </small>
        </div>
    );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({ message }) => {
    return (
        <div className="report-empty-state">
            <div className="report-empty-icon">
                📊
            </div>

            <strong>No Data Available</strong>

            <p>{message}</p>
        </div>
    );
};

/* =========================================================
   REPORTS
========================================================= */

const Reports = () => {
    const [activeReport, setActiveReport] =
        useState("overview");

    const [dashboardStats, setDashboardStats] =
        useState(null);

    const [hospitalSettings, setHospitalSettings] =
        useState({
            hospitalName: "HMS Hospital",
            hospitalEmail: "",
            phone: "",
            address: "",
            tagline: "Hospital Management System",
            logo: "/hms-logo.png",
        });

    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] =
        useState([]);
    const [bills, setBills] = useState([]);
    const [labTests, setLabTests] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] = useState("");

    /* =====================================================
       LOAD REPORT DATA
    ===================================================== */

    const loadReports = async () => {
        setLoading(true);
        setError("");

        try {
            const results =
                await Promise.allSettled([
                    fetchJSON(
                        `${API_BASE}/dashboard/stats`
                    ),

                    fetchJSON(
                        `${API_BASE}/patients`
                    ),

                    fetchJSON(
                        `${API_BASE}/doctors`
                    ),

                    fetchJSON(
                        `${API_BASE}/appointments`
                    ),

                    fetchJSON(
                        `${API_BASE}/billing`
                    ),

                    fetchJSON(
                        `${API_BASE}/laboratory`
                    ),

                    fetchJSON(
                        `${API_BASE}/settings`
                    ),
                ]);

            const [
                dashboardResult,
                patientsResult,
                doctorsResult,
                appointmentsResult,
                billsResult,
                laboratoryResult,
                settingsResult,
            ] = results;

            /* ---------------------------------------------
               DASHBOARD
            --------------------------------------------- */

            if (
                dashboardResult.status ===
                "fulfilled"
            ) {
                const data =
                    dashboardResult.value;

                setDashboardStats(
                    data?.stats ||
                    data ||
                    null
                );
            }

            /* ---------------------------------------------
               PATIENTS
            --------------------------------------------- */

            if (
                patientsResult.status ===
                "fulfilled"
            ) {
                const data =
                    patientsResult.value;

                setPatients(
                    Array.isArray(data)
                        ? data
                        : data?.patients || []
                );
            }

            /* ---------------------------------------------
               DOCTORS
            --------------------------------------------- */

            if (
                doctorsResult.status ===
                "fulfilled"
            ) {
                const data =
                    doctorsResult.value;

                setDoctors(
                    Array.isArray(data)
                        ? data
                        : data?.doctors || []
                );
            }

            /* ---------------------------------------------
               APPOINTMENTS
            --------------------------------------------- */

            if (
                appointmentsResult.status ===
                "fulfilled"
            ) {
                const data =
                    appointmentsResult.value;

                setAppointments(
                    Array.isArray(data)
                        ? data
                        : data?.appointments || []
                );
            }

            /* ---------------------------------------------
               BILLING
            --------------------------------------------- */

            if (
                billsResult.status ===
                "fulfilled"
            ) {
                const data =
                    billsResult.value;

                setBills(
                    Array.isArray(data)
                        ? data
                        : data?.billing ||
                        data?.bills ||
                        []
                );
            }

            /* ---------------------------------------------
               LABORATORY
            --------------------------------------------- */

            if (
                laboratoryResult.status ===
                "fulfilled"
            ) {
                const data =
                    laboratoryResult.value;

                setLabTests(
                    Array.isArray(data)
                        ? data
                        : data?.tests || []
                );
            }

            /* ---------------------------------------------
               HOSPITAL SETTINGS
            --------------------------------------------- */

            if (
                settingsResult.status ===
                "fulfilled"
            ) {
                const data =
                    settingsResult.value;

                const settings =
                    data?.data || {};

                setHospitalSettings({
                    hospitalName:
                        settings?.hospitalName ||
                        "HMS Hospital",

                    hospitalEmail:
                        settings?.hospitalEmail ||
                        "",

                    phone:
                        settings?.phone ||
                        "",

                    address:
                        settings?.address ||
                        "",

                    tagline:
                        settings?.tagline ||
                        "Hospital Management System",

                    logo:
                        settings?.logo ||
                        "/hms-logo.png",
                });
            }

            /* ---------------------------------------------
               FAILED REQUESTS
            --------------------------------------------- */

            const failedRequests =
                results.filter(
                    (result) =>
                        result.status ===
                        "rejected"
                );

            /*
             * Settings API fail hone par report ko
             * completely block nahi karna hai.
             */

            const reportDataResults =
                results.slice(0, 6);

            const failedReportRequests =
                reportDataResults.filter(
                    (result) =>
                        result.status ===
                        "rejected"
                );

            if (
                failedReportRequests.length ===
                reportDataResults.length
            ) {
                throw new Error(
                    "Unable to load report data."
                );
            }

            if (
                failedRequests.length > 0
            ) {
                console.warn(
                    "Some report APIs failed:",
                    failedRequests
                );
            }
        } catch (err) {
            console.error(
                "Reports Load Error:",
                err
            );

            setError(
                err?.message ||
                "Failed to load reports."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        loadReports();
    }, []);

    /* =====================================================
       REPORT STATS
    ===================================================== */

    const reportStats = useMemo(() => {
        /* ---------------------------------------------
           BILL TOTALS
        --------------------------------------------- */

        const totalBills = bills.length;

        const getBillAmount = (bill) =>
            Number(
                bill?.total_amount ??
                bill?.total ??
                bill?.amount ??
                0
            );

        const getPaymentStatus = (bill) =>
            String(
                bill?.payment_status ??
                bill?.paymentStatus ??
                bill?.status ??
                ""
            ).toLowerCase();

        const totalBillAmount =
            bills.reduce(
                (sum, bill) =>
                    sum + getBillAmount(bill),
                0
            );

        /* ---------------------------------------------
           PAID
        --------------------------------------------- */

        const paidBills = bills.filter(
            (bill) =>
                [
                    "paid",
                    "completed",
                ].includes(
                    getPaymentStatus(bill)
                )
        );

        /* ---------------------------------------------
           PENDING
        --------------------------------------------- */

        const pendingBills = bills.filter(
            (bill) =>
                [
                    "pending",
                    "unpaid",
                    "partial",
                    "partially_paid",
                ].includes(
                    getPaymentStatus(bill)
                )
        );

        const paidAmount =
            paidBills.reduce(
                (sum, bill) =>
                    sum + getBillAmount(bill),
                0
            );

        const pendingAmount =
            pendingBills.reduce(
                (sum, bill) =>
                    sum + getBillAmount(bill),
                0
            );

        /* ---------------------------------------------
           APPOINTMENTS
        --------------------------------------------- */

        const scheduledAppointments =
            appointments.filter(
                (appointment) =>
                    [
                        "scheduled",
                        "pending",
                        "confirmed",
                    ].includes(
                        String(
                            appointment?.status ||
                            ""
                        ).toLowerCase()
                    )
            ).length;

        const completedAppointments =
            appointments.filter(
                (appointment) =>
                    String(
                        appointment?.status ||
                        ""
                    ).toLowerCase() ===
                    "completed"
            ).length;

        const cancelledAppointments =
            appointments.filter(
                (appointment) =>
                    String(
                        appointment?.status ||
                        ""
                    ).toLowerCase() ===
                    "cancelled"
            ).length;

        /* ---------------------------------------------
           LABORATORY
        --------------------------------------------- */

        const activeLabTests =
            labTests.filter(
                (test) =>
                    String(
                        test?.status || ""
                    ).toLowerCase() ===
                    "active"
            ).length;

        const inactiveLabTests =
            labTests.filter(
                (test) =>
                    String(
                        test?.status || ""
                    ).toLowerCase() ===
                    "inactive"
            ).length;

        const labValue =
            labTests.reduce(
                (sum, test) =>
                    sum +
                    Number(
                        test?.price || 0
                    ),
                0
            );

        /* ---------------------------------------------
           DASHBOARD VALUES
        --------------------------------------------- */

        const totalPatients =
            dashboardStats?.totalPatients ??
            dashboardStats?.total_patients ??
            patients.length;

        const totalDoctors =
            dashboardStats?.totalDoctors ??
            dashboardStats?.total_doctors ??
            doctors.length;

        const totalAppointments =
            dashboardStats?.totalAppointments ??
            dashboardStats?.total_appointments ??
            appointments.length;

        const totalBillsFromDashboard =
            dashboardStats?.totalBills ??
            dashboardStats?.total_bills;

        const totalRevenueFromDashboard =
            dashboardStats?.totalRevenue ??
            dashboardStats?.total_revenue;

        const paidAmountFromDashboard =
            dashboardStats?.paidAmount ??
            dashboardStats?.paid_amount;

        return {
            totalPatients: Number(
                totalPatients || 0
            ),

            totalDoctors: Number(
                totalDoctors || 0
            ),

            totalAppointments: Number(
                totalAppointments || 0
            ),

            totalBills:
                totalBillsFromDashboard !==
                    undefined
                    ? Number(
                        totalBillsFromDashboard ||
                        0
                    )
                    : totalBills,

            totalRevenue:
                totalRevenueFromDashboard !==
                    undefined
                    ? Number(
                        totalRevenueFromDashboard ||
                        0
                    )
                    : totalBillAmount,

            paidAmount:
                paidAmountFromDashboard !==
                    undefined
                    ? Number(
                        paidAmountFromDashboard ||
                        0
                    )
                    : paidAmount,

            pendingAmount,

            scheduledAppointments,

            completedAppointments,

            cancelledAppointments,

            activeLabTests,

            inactiveLabTests,

            totalLabTests:
                labTests.length,

            labValue,
        };
    }, [
        dashboardStats,
        patients,
        doctors,
        appointments,
        bills,
        labTests,
    ]);

    /* =====================================================
       APPOINTMENT PERCENTAGES
    ===================================================== */

    const appointmentPercentages =
        useMemo(() => {
            const total = Number(
                reportStats.totalAppointments ||
                0
            );

            if (!total) {
                return {
                    scheduled: 0,
                    completed: 0,
                    cancelled: 0,
                };
            }

            return {
                scheduled: Math.round(
                    (reportStats
                        .scheduledAppointments /
                        total) *
                    100
                ),

                completed: Math.round(
                    (reportStats
                        .completedAppointments /
                        total) *
                    100
                ),

                cancelled: Math.round(
                    (reportStats
                        .cancelledAppointments /
                        total) *
                    100
                ),
            };
        }, [reportStats]);

    /* =====================================================
       GENDER STATS
    ===================================================== */

    const genderStats = useMemo(() => {
        const male =
            patients.filter(
                (patient) =>
                    String(
                        patient?.gender || ""
                    ).toLowerCase() ===
                    "male"
            ).length;

        const female =
            patients.filter(
                (patient) =>
                    String(
                        patient?.gender || ""
                    ).toLowerCase() ===
                    "female"
            ).length;

        const other =
            patients.filter(
                (patient) =>
                    ![
                        "male",
                        "female",
                    ].includes(
                        String(
                            patient?.gender ||
                            ""
                        ).toLowerCase()
                    )
            ).length;

        return {
            male,
            female,
            other,
            total: patients.length,
        };
    }, [patients]);

    /* =====================================================
       SPECIALIZATION STATS
    ===================================================== */

    const specializationStats =
        useMemo(() => {
            const counts = {};

            doctors.forEach((doctor) => {
                const specialization =
                    doctor?.specialization ||
                    "General";

                counts[specialization] =
                    (counts[specialization] ||
                        0) + 1;
            });

            return Object.entries(counts)
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                )
                .slice(0, 6);
        }, [doctors]);

    /* =====================================================
       PAYMENT STATS
    ===================================================== */

    const paymentStats = useMemo(() => {
        const counts = {};

        bills.forEach((bill) => {
            const method =
                bill?.payment_method ||
                bill?.paymentMethod ||
                bill?.payment ||
                "Unknown";

            const normalized =
                String(method).toLowerCase();

            counts[normalized] =
                (counts[normalized] ||
                    0) + 1;
        });

        return Object.entries(
            counts
        ).sort(
            (a, b) => b[1] - a[1]
        );
    }, [bills]);

    /* =====================================================
       RECENT PATIENTS
    ===================================================== */

    const recentPatients = useMemo(() => {
        return [...patients]
            .sort(
                (a, b) =>
                    new Date(
                        b?.created_at ||
                        b?.createdAt ||
                        0
                    ) -
                    new Date(
                        a?.created_at ||
                        a?.createdAt ||
                        0
                    )
            )
            .slice(0, 5);
    }, [patients]);

    /* =====================================================
       REPORT TABS
    ===================================================== */

    const reportTabs = [
        {
            id: "overview",
            label: "Overview",
            icon: "📊",
        },
        {
            id: "appointments",
            label: "Appointments",
            icon: "📅",
        },
        {
            id: "patients",
            label: "Patients",
            icon: "👥",
        },
        {
            id: "billing",
            label: "Billing",
            icon: "💰",
        },
        {
            id: "laboratory",
            label: "Laboratory",
            icon: "🧪",
        },
        {
            id: "doctors",
            label: "Doctors",
            icon: "👨‍⚕️",
        },
    ];

    /* =====================================================
       PRINT REPORT
    ===================================================== */

    const handlePrint = () => {
        const reportElement =
            document.querySelector(
                ".reports-page"
            );

        if (!reportElement) {
            console.error(
                "Reports content not found."
            );
            return;
        }

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1200,height=900"
            );

        if (!printWindow) {
            alert(
                "Please allow pop-ups to print the report."
            );
            return;
        }

        const reportClone =
            reportElement.cloneNode(true);

        /* ---------------------------------------------
           REMOVE SCREEN UI
        --------------------------------------------- */

        reportClone
            .querySelectorAll(
                ".reports-header-actions, .reports-tabs, .reports-error"
            )
            .forEach((element) =>
                element.remove()
            );

        reportClone
            .querySelectorAll("button")
            .forEach((button) =>
                button.remove()
            );

        /* ---------------------------------------------
           DYNAMIC SETTINGS
        --------------------------------------------- */

        const hospitalName =
            hospitalSettings?.hospitalName ||
            "HMS Hospital";

        const hospitalTagline =
            hospitalSettings?.tagline ||
            "Hospital Management System";

        const hospitalLogo =
            hospitalSettings?.logo ||
            "/hms-logo.png";

        const hospitalAddress =
            hospitalSettings?.address ||
            "";

        const hospitalPhone =
            hospitalSettings?.phone ||
            "";

        const reportDate =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );

        /* ---------------------------------------------
           PRINT HEADER
        --------------------------------------------- */

        const printHeader = `
            <div class="print-report-header">

                <div class="print-report-brand">

                    <img
                        src="${hospitalLogo}"
                        alt="${hospitalName}"
                        onerror="this.style.display='none';"
                    />

                    <div>

                        <h1>
                            ${hospitalName}
                        </h1>

                        <p>
                            ${hospitalTagline}
                        </p>

                        ${hospitalAddress
                ? `<span>
                                    ${hospitalAddress}
                                </span>`
                : ""
            }

                        ${hospitalPhone
                ? `<span class="print-hospital-phone">
                                    ${hospitalPhone}
                                </span>`
                : ""
            }

                    </div>

                </div>

                <div class="print-report-title-box">

                    <strong>
                        REPORT
                    </strong>

                    <span>
                        ${reportDate}
                    </span>

                </div>

            </div>
        `;

        /* ---------------------------------------------
           PRINT FOOTER
        --------------------------------------------- */

        const printFooter = `
            <div class="print-report-footer">

                <div class="print-footer-brand">

                    <img
                        src="${hospitalLogo}"
                        alt="${hospitalName}"
                        onerror="this.style.display='none';"
                    />

                    <div>

                        <strong>
                            ${hospitalName}
                        </strong>

                        <span>
                            ${hospitalTagline}
                        </span>

                    </div>

                </div>

                <div class="print-footer-message">

                    <strong>
                        Hospital Management Report
                    </strong>

                    <span>
                        Quality Healthcare &amp; Patient Care
                    </span>

                </div>

                <div class="print-footer-sign">
                    Authorized Report
                </div>

            </div>
        `;

        /* ---------------------------------------------
           PRINT CSS
        --------------------------------------------- */

        const printStyles = `
            @page {
                size: A4 portrait;
                margin: 0;
            }

            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                width: 210mm;
                min-width: 210mm;
                background: #ffffff;
                color: #183b72;
                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            body {
                padding: 0;
            }

            .reports-page {
                width: 210mm !important;
                min-width: 210mm !important;
                max-width: 210mm !important;
                min-height: 297mm !important;

                padding:
                    0
                    10mm
                    12mm !important;

                margin: 0 !important;

                background: #ffffff !important;
                color: #183b72 !important;
            }

            .print-report-header {
                width: 190mm;
                min-height: 42mm;

                margin:
                    0
                    0
                    7mm;

                padding:
                    9mm
                    0
                    7mm;

                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 10mm;

                border-bottom:
                    3px solid
                    #0ca7c7;

                position: relative;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .print-report-header::after {
                content: "";

                position: absolute;

                left: 0;
                right: 0;
                bottom: -3px;

                height: 3px;

                background:
                    linear-gradient(
                        90deg,
                        #0b4d9a 0%,
                        #087cc1 40%,
                        #0ca7c7 70%,
                        #13c2d5 100%
                    );
            }

            .print-report-brand {
                display: flex;
                align-items: center;
                gap: 5mm;

                min-width: 0;
            }

            .print-report-brand img {
                width: 25mm;
                height: 25mm;

                flex: 0 0 auto;

                object-fit: contain;
            }

            .print-report-brand h1 {
                margin: 0;

                color: #087cc1;

                font-size: 25px;
                line-height: 1.05;

                font-weight: 900;

                letter-spacing: 0.6px;

                max-width: 125mm;

                word-break: break-word;
            }

            .print-report-brand p {
                margin:
                    3px
                    0
                    2px;

                color: #173b82;

                font-size: 10px;

                font-weight: 700;
            }

            .print-report-brand span {
                display: block;

                color: #6b7d98;

                font-size: 8.5px;

                margin-top: 1px;
            }

            .print-report-brand
            .print-hospital-phone {
                color: #087cc1;
                font-weight: 700;
            }

            .print-report-title-box {
                min-width: 38mm;

                padding:
                    5mm
                    7mm;

                border:
                    2px solid
                    #173f89;

                text-align: center;

                background: #ffffff;

                flex: 0 0 auto;
            }

            .print-report-title-box strong,
            .print-report-title-box span {
                display: block;
            }

            .print-report-title-box strong {
                color: #173f89;

                font-size: 14px;

                letter-spacing: 1px;
            }

            .print-report-title-box span {
                margin-top: 3px;

                color: #087cc1;

                font-size: 9px;

                font-weight: 700;
            }

            .reports-header {
                display: none !important;
            }

            .reports-tabs,
            .reports-header-actions,
            .reports-error {
                display: none !important;
            }

            .report-content {
                width: 190mm !important;
                max-width: 190mm !important;

                color: #183b72 !important;
            }

            .report-section-heading {
                margin-bottom: 4mm !important;

                display: flex !important;

                align-items: center !important;
                justify-content: space-between !important;

                gap: 5mm;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .report-section-heading h2 {
                margin:
                    0
                    0
                    1.2mm !important;

                color: #173f89 !important;

                font-size: 16px !important;

                font-weight: 900 !important;
            }

            .report-section-heading p {
                margin: 0 !important;

                color: #6b7d98 !important;

                font-size: 9px !important;
            }

            .report-live-badge {
                padding:
                    1.8mm
                    3.2mm !important;

                border-radius: 10mm !important;

                color: #087cc1 !important;

                background: #eef9fc !important;

                border:
                    1px solid
                    #b9dfe8 !important;

                font-size: 8px !important;

                font-weight: 700 !important;
            }

            .report-stats-grid {
                width: 190mm !important;

                display: grid !important;

                grid-template-columns:
                    repeat(
                        4,
                        minmax(0, 1fr)
                    )
                    !important;

                gap: 3mm !important;

                margin-bottom: 4mm !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .report-stats-grid.three {
                grid-template-columns:
                    repeat(
                        3,
                        minmax(0, 1fr)
                    )
                    !important;
            }

            .report-stat-card {
                min-width: 0 !important;

                padding: 3.5mm !important;

                display: flex !important;

                align-items: center !important;

                gap: 3mm !important;

                background: #ffffff !important;

                color: #183b72 !important;

                border:
                    1px solid
                    #cbd9e5 !important;

                border-radius: 2mm !important;

                box-shadow: none !important;

                transform: none !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .report-stat-icon {
                width: 10mm !important;
                height: 10mm !important;

                flex: 0 0 auto !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                border-radius: 2mm !important;

                background: #eef9fc !important;

                border:
                    1px solid
                    #c2e3eb !important;

                font-size: 14px !important;
            }

            .report-stat-content {
                min-width: 0 !important;
            }

            .report-stat-content span {
                display: block !important;

                margin-bottom: 1mm !important;

                color: #607694 !important;

                font-size: 7.5px !important;
            }

            .report-stat-content strong {
                display: block !important;

                color: #173f89 !important;

                font-size: 14px !important;

                line-height: 1.15 !important;
            }

            .report-stat-content small {
                display: block !important;

                margin-top: 1mm !important;

                color: #8091a8 !important;

                font-size: 6.5px !important;
            }

            .reports-two-column {
                width: 190mm !important;

                display: grid !important;

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0, 1fr)
                    )
                    !important;

                gap: 4mm !important;

                margin-bottom: 4mm !important;

                align-items: start !important;
            }

            .report-panel {
                min-width: 0 !important;

                padding: 4mm !important;

                background: #ffffff !important;

                color: #183b72 !important;

                border:
                    1px solid
                    #cbd9e5 !important;

                border-radius: 2mm !important;

                box-shadow: none !important;

                break-inside: avoid;
                page-break-inside: avoid;

                overflow: visible !important;
            }

            .report-panel.full-width {
                width: 190mm !important;

                margin-bottom: 4mm !important;
            }

            .report-panel-header {
                display: flex !important;

                align-items: flex-start !important;

                justify-content:
                    space-between !important;

                gap: 3mm !important;

                margin-bottom: 3.5mm !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .report-panel-header h3 {
                margin:
                    0
                    0
                    1mm !important;

                color: #173f89 !important;

                font-size: 11px !important;
            }

            .report-panel-header p {
                margin: 0 !important;

                color: #71839a !important;

                font-size: 7.5px !important;
            }

            .panel-icon {
                width: 8mm !important;
                height: 8mm !important;

                border-radius: 2mm !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                background: #eef9fc !important;

                border:
                    1px solid
                    #c2e3eb !important;

                font-size: 12px !important;
            }

            .report-progress-list {
                display: flex !important;

                flex-direction: column !important;

                gap: 3.5mm !important;
            }

            .report-progress-list.large {
                gap: 4mm !important;
            }

            .report-progress-row {
                display: grid !important;

                grid-template-columns:
                    minmax(25mm, 1fr)
                    minmax(35mm, 2fr)
                    10mm !important;

                align-items: center !important;

                gap: 3mm !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .report-progress-info {
                display: flex !important;

                align-items: center !important;

                justify-content:
                    space-between !important;

                gap: 2mm !important;
            }

            .report-progress-info span,
            .report-progress-info strong {
                font-size: 7.5px !important;
            }

            .report-progress-info span {
                color: #607694 !important;
            }

            .report-progress-info strong {
                color: #173f89 !important;
            }

            .report-progress-track {
                height: 2mm !important;

                overflow: hidden !important;

                border-radius: 20px !important;

                background: #e5edf3 !important;
            }

            .report-progress-fill {
                height: 100% !important;

                background:
                    linear-gradient(
                        90deg,
                        #087cc1,
                        #13b7c8
                    ) !important;

                box-shadow: none !important;
            }

            .report-progress-row > small {
                color: #607694 !important;

                font-size: 7px !important;

                text-align: right !important;
            }

            .billing-summary-list > div,
            .revenue-summary > div {
                padding:
                    2.5mm
                    0 !important;

                border-bottom:
                    1px solid
                    #dbe5ec !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .billing-summary-list span,
            .revenue-summary span {
                color: #607694 !important;

                font-size: 8px !important;
            }

            .billing-summary-list strong,
            .revenue-summary strong {
                color: #173f89 !important;

                font-size: 9px !important;
            }

            .billing-summary-list
            .amount-success,
            .billing-summary-list
            .amount-warning {
                color: #087cc1 !important;
            }

            .billing-summary-list
            .billing-total {
                border-top:
                    1px solid
                    #a9c5d8 !important;
            }

            .billing-summary-list
            .billing-total span,
            .billing-summary-list
            .billing-total strong {
                color: #173f89 !important;

                font-size: 10px !important;
            }

            .gender-report {
                display: flex !important;

                flex-direction: column !important;

                gap: 3.5mm !important;
            }

            .recent-patient {
                display: flex !important;

                align-items: center !important;

                gap: 3mm !important;

                padding:
                    2.5mm
                    0 !important;

                border-bottom:
                    1px solid
                    #dbe5ec !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .patient-avatar {
                width: 9mm !important;
                height: 9mm !important;

                flex: 0 0 auto !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                color: #087cc1 !important;

                background: #eef9fc !important;

                border:
                    1px solid
                    #c2e3eb !important;

                font-size: 9px !important;
            }

            .recent-patient strong {
                display: block !important;

                margin-bottom: 0.7mm !important;

                color: #173f89 !important;

                font-size: 8px !important;
            }

            .recent-patient span {
                color: #71839a !important;

                font-size: 7px !important;
            }

            .lab-summary {
                display: grid !important;

                grid-template-columns:
                    repeat(
                        3,
                        1fr
                    )
                    !important;

                gap: 2.5mm !important;
            }

            .lab-summary-item,
            .lab-summary-total {
                padding: 3mm !important;

                background: #f8fcfe !important;

                border:
                    1px solid
                    #d2e1ea !important;

                border-radius: 2mm !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .lab-summary-item span,
            .lab-summary-total span {
                display: block !important;

                margin-bottom: 1mm !important;

                color: #607694 !important;

                font-size: 7px !important;
            }

            .lab-summary-item strong,
            .lab-summary-total strong {
                color: #173f89 !important;

                font-size: 12px !important;
            }

            .lab-summary-total {
                grid-column: 1 / -1 !important;

                display: flex !important;

                align-items: center !important;

                justify-content:
                    space-between !important;
            }

            .lab-summary-total strong {
                color: #087cc1 !important;
            }

            .revenue-summary {
                display: flex !important;

                flex-direction: column !important;
            }

            .lab-test-report-grid {
                display: grid !important;

                grid-template-columns:
                    repeat(
                        2,
                        minmax(0, 1fr)
                    )
                    !important;

                gap: 3mm !important;
            }

            .lab-test-report-card {
                min-width: 0 !important;

                padding: 3.5mm !important;

                display: grid !important;

                grid-template-columns:
                    auto
                    1fr
                    auto !important;

                grid-template-rows:
                    auto
                    auto !important;

                gap:
                    1mm
                    3mm !important;

                background: #ffffff !important;

                border:
                    1px solid
                    #d2e1ea !important;

                border-radius: 2mm !important;

                box-shadow: none !important;

                transform: none !important;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .lab-test-code {
                width: 10mm !important;
                height: 10mm !important;

                border-radius: 2mm !important;

                display: flex !important;

                align-items: center !important;
                justify-content: center !important;

                color: #087cc1 !important;

                background: #eef9fc !important;

                font-size: 7px !important;
            }

            .lab-test-report-card h4 {
                margin:
                    0
                    0
                    0.7mm !important;

                color: #173f89 !important;

                font-size: 8px !important;
            }

            .lab-test-report-card
            > div:nth-child(2)
            span {
                color: #71839a !important;

                font-size: 7px !important;
            }

            .lab-test-report-card > strong {
                color: #087cc1 !important;

                font-size: 8px !important;
            }

            .lab-test-report-card em {
                padding:
                    0.7mm
                    2mm !important;

                color: #087cc1 !important;

                background: #eef9fc !important;

                border-radius: 10mm !important;

                font-size: 6.5px !important;

                font-style: normal !important;
            }

            .lab-test-report-card em.inactive {
                color: #71839a !important;

                background: #f0f3f5 !important;
            }

            .report-empty-state {
                min-height: 28mm !important;

                color: #173f89 !important;
            }

            .report-empty-state strong {
                color: #173f89 !important;

                font-size: 9px !important;
            }

            .report-empty-state p {
                color: #71839a !important;

                font-size: 7.5px !important;
            }

            .report-empty-icon {
                width: 10mm !important;
                height: 10mm !important;

                margin-bottom: 2mm !important;

                background: #eef9fc !important;

                border:
                    1px solid
                    #c2e3eb !important;

                font-size: 14px !important;
            }

            .print-report-footer {
                width: 190mm;
                min-height: 27mm;

                margin-top: 7mm;

                padding:
                    5mm
                    7mm;

                display: flex;

                align-items: center;

                justify-content:
                    space-between;

                gap: 5mm;

                background:
                    linear-gradient(
                        90deg,
                        #e9f9fc,
                        #c7f1f5,
                        #13b7c8
                    );

                border-top:
                    1px solid
                    #79cbd7;

                break-inside: avoid;
                page-break-inside: avoid;
            }

            .print-footer-brand {
                display: flex;

                align-items: center;

                gap: 3mm;

                min-width: 0;
            }

            .print-footer-brand img {
                width: 13mm;
                height: 13mm;

                object-fit: contain;

                flex: 0 0 auto;
            }

            .print-footer-brand
            strong,
            .print-footer-brand
            span {
                display: block;
            }

            .print-footer-brand
            strong {
                color: #173f89;

                font-size: 9px;

                max-width: 55mm;

                word-break: break-word;
            }

            .print-footer-brand
            span {
                margin-top: 1mm;

                color: #4e6886;

                font-size: 6.5px;
            }

            .print-footer-message {
                text-align: center;
            }

            .print-footer-message
            strong,
            .print-footer-message
            span {
                display: block;
            }

            .print-footer-message
            strong {
                color: #173f89;

                font-size: 8px;
            }

            .print-footer-message
            span {
                margin-top: 1mm;

                color: #4e6886;

                font-size: 6.5px;
            }

            .print-footer-sign {
                color: #173f89;

                font-size: 6.5px;

                font-weight: 700;

                text-align: right;
            }

            h1,
            h2,
            h3,
            h4 {
                break-after: avoid !important;

                page-break-after:
                    avoid !important;
            }

            .report-stat-card,
            .report-panel,
            .lab-test-report-card,
            .lab-summary-item,
            .lab-summary-total,
            .recent-patient,
            .report-progress-row {
                -webkit-print-color-adjust:
                    exact !important;

                print-color-adjust:
                    exact !important;
            }
        `;

        /* ---------------------------------------------
           WRITE PRINT WINDOW
        --------------------------------------------- */

        printWindow.document.open();

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

                <head>

                    <meta charset="UTF-8" />

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    />

                    <title>
                        ${hospitalName} - Hospital Report
                    </title>

                    <style>
                        ${printStyles}
                    </style>

                </head>

                <body>

                    ${printHeader}

                    ${reportClone.outerHTML}

                    ${printFooter}

                    <script>
                        window.onload = function () {
                            setTimeout(function () {
                                window.focus();
                                window.print();
                            }, 700);
                        };

                        window.onafterprint = function () {
                            setTimeout(function () {
                                window.close();
                            }, 200);
                        };
                    <\/script>

                </body>

            </html>
        `);

        printWindow.document.close();
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="reports-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="reports-header">

                <div className="reports-title-row">

                    <div className="reports-title-icon">
                        📊
                    </div>

                    <div>

                        <h1>
                            Reports
                        </h1>

                        <p>
                            {hospitalSettings.hospitalName
                                ? `${hospitalSettings.hospitalName} — Hospital performance and operational reports`
                                : "Analyze hospital performance and operational data"}
                        </p>

                    </div>

                </div>

                <div className="reports-header-actions">

                    <button
                        type="button"
                        className="reports-refresh-btn"
                        onClick={loadReports}
                        disabled={loading}
                    >

                        <span className="reports-button-icon">
                            ↻
                        </span>

                        <span>
                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </span>

                    </button>

                    <button
                        type="button"
                        className="reports-print-btn"
                        onClick={handlePrint}
                    >

                        <span className="reports-button-icon">
                            🖨
                        </span>

                        <span>
                            Print Report
                        </span>

                    </button>

                </div>

            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="reports-error">

                    <span className="reports-error-icon">
                        ⚠️
                    </span>

                    <div>

                        <strong>
                            Some report data
                            could not be loaded
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        aria-label="Close error"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* =================================================
                TABS
            ================================================= */}

            <nav className="reports-tabs">

                {reportTabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        className={
                            activeReport ===
                                tab.id
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveReport(
                                tab.id
                            )
                        }
                    >

                        <span>
                            {tab.icon}
                        </span>

                        {tab.label}

                    </button>
                ))}

            </nav>

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeReport === "overview" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                {hospitalSettings.hospitalName ||
                                    "Hospital"}{" "}
                                Overview
                            </h2>

                            <p>
                                Current hospital
                                statistics and
                                performance summary
                            </p>

                        </div>

                        <span className="report-live-badge">

                            <span>
                                ●
                            </span>

                            Live Data

                        </span>

                    </div>

                    <div className="report-stats-grid">

                        <StatCard
                            icon="👥"
                            title="Total Patients"
                            value={
                                reportStats.totalPatients
                            }
                            subtitle="Registered patients"
                            loading={loading}
                        />

                        <StatCard
                            icon="👨‍⚕️"
                            title="Total Doctors"
                            value={
                                reportStats.totalDoctors
                            }
                            subtitle="Medical professionals"
                            loading={loading}
                        />

                        <StatCard
                            icon="📅"
                            title="Appointments"
                            value={
                                reportStats.totalAppointments
                            }
                            subtitle="Total appointments"
                            loading={loading}
                        />

                        <StatCard
                            icon="💰"
                            title="Total Revenue"
                            value={formatCurrency(
                                reportStats.totalRevenue
                            )}
                            subtitle="From billing records"
                            loading={loading}
                        />

                    </div>

                    <div className="reports-two-column">

                        {/* APPOINTMENT OVERVIEW */}

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Appointment
                                        Overview
                                    </h3>

                                    <p>
                                        Appointment
                                        status
                                        distribution
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    📅
                                </span>

                            </div>

                            <div className="report-progress-list">

                                <ProgressRow
                                    label="Scheduled"
                                    value={
                                        reportStats.scheduledAppointments
                                    }
                                    percentage={
                                        appointmentPercentages.scheduled
                                    }
                                />

                                <ProgressRow
                                    label="Completed"
                                    value={
                                        reportStats.completedAppointments
                                    }
                                    percentage={
                                        appointmentPercentages.completed
                                    }
                                />

                                <ProgressRow
                                    label="Cancelled"
                                    value={
                                        reportStats.cancelledAppointments
                                    }
                                    percentage={
                                        appointmentPercentages.cancelled
                                    }
                                />

                            </div>

                        </div>

                        {/* BILLING SUMMARY */}

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Billing Summary
                                    </h3>

                                    <p>
                                        Financial
                                        performance
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    💰
                                </span>

                            </div>

                            <div className="billing-summary-list">

                                <div>

                                    <span>
                                        Total Bills
                                    </span>

                                    <strong>
                                        {
                                            reportStats.totalBills
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Paid Amount
                                    </span>

                                    <strong className="amount-success">
                                        {formatCurrency(
                                            reportStats.paidAmount
                                        )}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Pending Amount
                                    </span>

                                    <strong className="amount-warning">
                                        {formatCurrency(
                                            reportStats.pendingAmount
                                        )}
                                    </strong>

                                </div>

                                <div className="billing-total">

                                    <span>
                                        Total Revenue
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            reportStats.totalRevenue
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="reports-two-column">

                        {/* PATIENT DEMOGRAPHICS */}

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Patient
                                        Demographics
                                    </h3>

                                    <p>
                                        Gender
                                        distribution
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    👥
                                </span>

                            </div>

                            {genderStats.total === 0 ? (
                                <EmptyState message="No patient data available." />
                            ) : (
                                <div className="gender-report">

                                    <ProgressRow
                                        label="Male"
                                        value={
                                            genderStats.male
                                        }
                                        total={
                                            genderStats.total
                                        }
                                    />

                                    <ProgressRow
                                        label="Female"
                                        value={
                                            genderStats.female
                                        }
                                        total={
                                            genderStats.total
                                        }
                                    />

                                    <ProgressRow
                                        label="Other"
                                        value={
                                            genderStats.other
                                        }
                                        total={
                                            genderStats.total
                                        }
                                    />

                                </div>
                            )}

                        </div>

                        {/* LAB SUMMARY */}

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Laboratory
                                        Summary
                                    </h3>

                                    <p>
                                        Diagnostic
                                        test statistics
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    🧪
                                </span>

                            </div>

                            <div className="lab-summary">

                                <div className="lab-summary-item">

                                    <span>
                                        Total Tests
                                    </span>

                                    <strong>
                                        {
                                            reportStats.totalLabTests
                                        }
                                    </strong>

                                </div>

                                <div className="lab-summary-item">

                                    <span>
                                        Active
                                    </span>

                                    <strong>
                                        {
                                            reportStats.activeLabTests
                                        }
                                    </strong>

                                </div>

                                <div className="lab-summary-item">

                                    <span>
                                        Inactive
                                    </span>

                                    <strong>
                                        {
                                            reportStats.inactiveLabTests
                                        }
                                    </strong>

                                </div>

                                <div className="lab-summary-total">

                                    <span>
                                        Total Test Value
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            reportStats.labValue
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                APPOINTMENTS
            ================================================= */}

            {activeReport === "appointments" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                Appointment Report
                            </h2>

                            <p>
                                Appointment activity
                                and status breakdown
                            </p>

                        </div>

                    </div>

                    <div className="report-stats-grid three">

                        <StatCard
                            icon="📅"
                            title="Total"
                            value={
                                reportStats.totalAppointments
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="⏳"
                            title="Scheduled"
                            value={
                                reportStats.scheduledAppointments
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="✓"
                            title="Completed"
                            value={
                                reportStats.completedAppointments
                            }
                            loading={loading}
                        />

                    </div>

                    <div className="report-panel full-width">

                        <div className="report-panel-header">

                            <div>

                                <h3>
                                    Appointment Status
                                </h3>

                                <p>
                                    Current
                                    distribution
                                </p>

                            </div>

                            <span className="panel-icon">
                                📅
                            </span>

                        </div>

                        <div className="report-progress-list large">

                            <ProgressRow
                                label="Scheduled"
                                value={
                                    reportStats.scheduledAppointments
                                }
                                percentage={
                                    appointmentPercentages.scheduled
                                }
                            />

                            <ProgressRow
                                label="Completed"
                                value={
                                    reportStats.completedAppointments
                                }
                                percentage={
                                    appointmentPercentages.completed
                                }
                            />

                            <ProgressRow
                                label="Cancelled"
                                value={
                                    reportStats.cancelledAppointments
                                }
                                percentage={
                                    appointmentPercentages.cancelled
                                }
                            />

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                PATIENTS
            ================================================= */}

            {activeReport === "patients" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                Patient Report
                            </h2>

                            <p>
                                Patient registration
                                and demographic
                                overview
                            </p>

                        </div>

                    </div>

                    <div className="report-stats-grid three">

                        <StatCard
                            icon="👥"
                            title="Total Patients"
                            value={
                                reportStats.totalPatients
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="♂"
                            title="Male"
                            value={
                                genderStats.male
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="♀"
                            title="Female"
                            value={
                                genderStats.female
                            }
                            loading={loading}
                        />

                    </div>

                    <div className="reports-two-column">

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Gender
                                        Distribution
                                    </h3>

                                    <p>
                                        Patient gender
                                        overview
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    👥
                                </span>

                            </div>

                            <div className="report-progress-list">

                                <ProgressRow
                                    label="Male"
                                    value={
                                        genderStats.male
                                    }
                                    total={
                                        genderStats.total
                                    }
                                />

                                <ProgressRow
                                    label="Female"
                                    value={
                                        genderStats.female
                                    }
                                    total={
                                        genderStats.total
                                    }
                                />

                                <ProgressRow
                                    label="Other"
                                    value={
                                        genderStats.other
                                    }
                                    total={
                                        genderStats.total
                                    }
                                />

                            </div>

                        </div>

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Recent Patients
                                    </h3>

                                    <p>
                                        Latest
                                        registrations
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    👤
                                </span>

                            </div>

                            {recentPatients.length === 0 ? (
                                <EmptyState message="No patients found." />
                            ) : (
                                <div className="recent-patient-list">

                                    {recentPatients.map(
                                        (
                                            patient,
                                            index
                                        ) => (
                                            <div
                                                className="recent-patient"
                                                key={
                                                    patient?.id ??
                                                    `patient-${index}`
                                                }
                                            >

                                                <div className="patient-avatar">

                                                    {String(
                                                        patient?.name ||
                                                        "P"
                                                    )
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}

                                                </div>

                                                <div>

                                                    <strong>
                                                        {patient?.name ||
                                                            "Unnamed Patient"}
                                                    </strong>

                                                    <span>
                                                        {patient?.patient_code ||
                                                            patient?.patientCode ||
                                                            `ID #${patient?.id ??
                                                            "N/A"}`}
                                                    </span>

                                                </div>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                BILLING
            ================================================= */}

            {activeReport === "billing" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                Billing Report
                            </h2>

                            <p>
                                Hospital billing
                                and payment
                                performance
                            </p>

                        </div>

                    </div>

                    <div className="report-stats-grid">

                        <StatCard
                            icon="🧾"
                            title="Total Bills"
                            value={
                                reportStats.totalBills
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="💰"
                            title="Total Amount"
                            value={formatCurrency(
                                reportStats.totalRevenue
                            )}
                            loading={loading}
                        />

                        <StatCard
                            icon="✓"
                            title="Paid Amount"
                            value={formatCurrency(
                                reportStats.paidAmount
                            )}
                            loading={loading}
                        />

                        <StatCard
                            icon="⏳"
                            title="Pending Amount"
                            value={formatCurrency(
                                reportStats.pendingAmount
                            )}
                            loading={loading}
                        />

                    </div>

                    <div className="reports-two-column">

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Payment Methods
                                    </h3>

                                    <p>
                                        Bills by
                                        payment method
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    💳
                                </span>

                            </div>

                            {paymentStats.length === 0 ? (
                                <EmptyState message="No payment data available." />
                            ) : (
                                <div className="report-progress-list">

                                    {paymentStats.map(
                                        ([
                                            method,
                                            count,
                                        ]) => (
                                            <ProgressRow
                                                key={
                                                    method
                                                }
                                                label={String(
                                                    method
                                                ).toUpperCase()}
                                                value={
                                                    count
                                                }
                                                total={
                                                    bills.length
                                                }
                                            />
                                        )
                                    )}

                                </div>
                            )}

                        </div>

                        <div className="report-panel">

                            <div className="report-panel-header">

                                <div>

                                    <h3>
                                        Revenue Summary
                                    </h3>

                                    <p>
                                        Financial
                                        collection
                                        overview
                                    </p>

                                </div>

                                <span className="panel-icon">
                                    ₹
                                </span>

                            </div>

                            <div className="revenue-summary">

                                <div>

                                    <span>
                                        Total Revenue
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            reportStats.totalRevenue
                                        )}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Paid Revenue
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            reportStats.paidAmount
                                        )}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Outstanding
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            reportStats.pendingAmount
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                LABORATORY
            ================================================= */}

            {activeReport === "laboratory" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                Laboratory Report
                            </h2>

                            <p>
                                Diagnostic test
                                statistics and
                                value
                            </p>

                        </div>

                    </div>

                    <div className="report-stats-grid">

                        <StatCard
                            icon="🧪"
                            title="Total Tests"
                            value={
                                reportStats.totalLabTests
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="✓"
                            title="Active Tests"
                            value={
                                reportStats.activeLabTests
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="○"
                            title="Inactive Tests"
                            value={
                                reportStats.inactiveLabTests
                            }
                            loading={loading}
                        />

                        <StatCard
                            icon="₹"
                            title="Total Test Value"
                            value={formatCurrency(
                                reportStats.labValue
                            )}
                            loading={loading}
                        />

                    </div>

                    <div className="report-panel full-width">

                        <div className="report-panel-header">

                            <div>

                                <h3>
                                    Laboratory Tests
                                </h3>

                                <p>
                                    Available
                                    diagnostic
                                    services
                                </p>

                            </div>

                            <span className="panel-icon">
                                🧪
                            </span>

                        </div>

                        {labTests.length === 0 ? (
                            <EmptyState message="No laboratory tests found." />
                        ) : (
                            <div className="lab-test-report-grid">

                                {labTests.map(
                                    (
                                        test,
                                        index
                                    ) => (
                                        <div
                                            className="lab-test-report-card"
                                            key={
                                                test?.id ??
                                                `lab-${index}`
                                            }
                                        >

                                            <div className="lab-test-code">

                                                {test?.test_code ||
                                                    "LAB"}

                                            </div>

                                            <div>

                                                <h4>
                                                    {test?.test_name ||
                                                        "Unnamed Test"}
                                                </h4>

                                                <span>
                                                    {test?.category ||
                                                        "General"}
                                                </span>

                                            </div>

                                            <strong>
                                                {formatCurrency(
                                                    test?.price
                                                )}
                                            </strong>

                                            <em
                                                className={
                                                    String(
                                                        test?.status ||
                                                        ""
                                                    ).toLowerCase() ===
                                                        "active"
                                                        ? "active"
                                                        : "inactive"
                                                }
                                            >
                                                {test?.status ||
                                                    "Unknown"}
                                            </em>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>

                </div>
            )}

            {/* =================================================
                DOCTORS
            ================================================= */}

            {activeReport === "doctors" && (
                <div className="report-content">

                    <div className="report-section-heading">

                        <div>

                            <h2>
                                Doctor Report
                            </h2>

                            <p>
                                Medical staff and
                                specialization
                                overview
                            </p>

                        </div>

                    </div>

                    <div className="report-stats-grid">

                        <StatCard
                            icon="👨‍⚕️"
                            title="Total Doctors"
                            value={
                                reportStats.totalDoctors
                            }
                            subtitle="Medical professionals"
                            loading={loading}
                        />

                    </div>

                    <div className="report-panel full-width">

                        <div className="report-panel-header">

                            <div>

                                <h3>
                                    Specialization
                                    Distribution
                                </h3>

                                <p>
                                    Doctors by
                                    specialization
                                </p>

                            </div>

                            <span className="panel-icon">
                                👨‍⚕️
                            </span>

                        </div>

                        {specializationStats.length ===
                            0 ? (
                            <EmptyState message="No doctor data available." />
                        ) : (
                            <div className="report-progress-list large">

                                {specializationStats.map(
                                    ([
                                        specialization,
                                        count,
                                    ]) => (
                                        <ProgressRow
                                            key={
                                                specialization
                                            }
                                            label={
                                                specialization
                                            }
                                            value={
                                                count
                                            }
                                            total={
                                                doctors.length
                                            }
                                        />
                                    )
                                )}

                            </div>
                        )}

                    </div>

                </div>
            )}

        </div>
    );
};

export default Reports;