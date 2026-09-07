import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    FaCamera,
    FaArrowRight,
    FaArrowLeft,
    FaHeartbeat,
    FaXRay,
    FaBone,
    FaBrain,
    FaStethoscope,
    FaFlask,
    FaCapsules,
    FaAmbulance,
    FaHospital,
} from "react-icons/fa";

import "./Doctors.css";

/* =========================================================
   API
========================================================= */

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
    doctor_code: "",
    name: "",
    specialization: "",
    qualification: "",
    phone: "",
    email: "",
    experience_years: "",
    consultation_fee: "",
    status: "available",
};

/* =========================================================
   DEPARTMENT THEMES
========================================================= */

const DEPARTMENT_THEMES = {
    cardiology: {
        className: "theme-red",
        icon: FaHeartbeat,
        description: "Heart and cardiovascular system care",
    },

    radiology: {
        className: "theme-blue",
        icon: FaXRay,
        description: "Imaging and diagnostic radiology services",
    },

    orthopedics: {
        className: "theme-green",
        icon: FaBone,
        description: "Bone, joint and muscle care",
    },

    neurology: {
        className: "theme-purple",
        icon: FaBrain,
        description: "Brain and nervous system care",
    },

    "general medicine": {
        className: "theme-yellow",
        icon: FaStethoscope,
        description: "Comprehensive primary healthcare",
    },

    laboratory: {
        className: "theme-cyan",
        icon: FaFlask,
        description: "Diagnostic testing and pathology",
    },

    pharmacy: {
        className: "theme-pink",
        icon: FaCapsules,
        description: "Medicine and pharmaceutical care",
    },

    emergency: {
        className: "theme-orange",
        icon: FaAmbulance,
        description: "24/7 emergency medical services",
    },

    default: {
        className: "theme-teal",
        icon: FaHospital,
        description: "Hospital medical services",
    },
};

/* =========================================================
   GET DEPARTMENT THEME
========================================================= */

const getDepartmentTheme = (departmentName) => {
    const key = String(departmentName || "")
        .trim()
        .toLowerCase();

    return (
        DEPARTMENT_THEMES[key] ||
        DEPARTMENT_THEMES.default
    );
};

/* =========================================================
   IMAGE
========================================================= */

const getDoctorPhoto = (doctor) => {
    if (!doctor) {
        return "/default-doctor.png";
    }

    const photo =
        doctor.photo ||
        doctor.profile_photo ||
        doctor.profilePhoto ||
        doctor.image ||
        doctor.image_url ||
        doctor.photo_url;

    if (!photo) {
        return "/default-doctor.png";
    }

    if (
        photo.startsWith("http://") ||
        photo.startsWith("https://")
    ) {
        return photo;
    }

    if (photo.startsWith("/")) {
        return `${BACKEND_URL}${photo}`;
    }

    return `${BACKEND_URL}/${photo}`;
};

const handleImageError = (event) => {
    if (
        event.currentTarget.src.includes(
            "default-doctor.png"
        )
    ) {
        return;
    }

    event.currentTarget.src =
        "/default-doctor.png";
};

/* =========================================================
   COMPONENT
========================================================= */

const Doctors = () => {
    const navigate = useNavigate();

    /* =====================================================
       STATES
    ===================================================== */

    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] =
        useState(false);

    const [editingDoctor, setEditingDoctor] =
        useState(null);

    const [selectedDoctor, setSelectedDoctor] =
        useState(null);

    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] =
        useState(null);

    const [form, setForm] =
        useState(EMPTY_FORM);

    const [selectedPhoto, setSelectedPhoto] =
        useState(null);

    const [photoPreview, setPhotoPreview] =
        useState("");

    /* =====================================================
       AUTH HEADERS
    ===================================================== */

    const getAuthHeaders = () => {
        const token =
            localStorage.getItem("hms_token");

        const headers = {};

        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        return headers;
    };

    /* =====================================================
       FETCH DOCTORS
    ===================================================== */

    const fetchDoctors = async (
        showRefresh = false
    ) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await fetch(
                `${API_URL}/doctors`,
                {
                    method: "GET",
                    headers: {
                        ...getAuthHeaders(),
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch doctors"
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                        "Failed to fetch doctors"
                );
            }

            setDoctors(
                Array.isArray(data.doctors)
                    ? data.doctors
                    : []
            );
        } catch (err) {
            console.error(
                "Fetch doctors error:",
                err
            );

            setError(
                err.message ||
                    "Failed to load doctors"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /* =====================================================
       FETCH DEPARTMENTS
    ===================================================== */

    const fetchDepartments = async () => {
        try {
            const response = await fetch(
                `${API_URL}/departments`,
                {
                    method: "GET",
                    headers: {
                        ...getAuthHeaders(),
                    },
                }
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.success) {
                return;
            }

            const list =
                Array.isArray(
                    data.departments
                )
                    ? data.departments
                    : [];

            setDepartments(list);
        } catch (err) {
            console.warn(
                "Department fetch skipped:",
                err
            );
        }
    };

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchDoctors();
        fetchDepartments();
    }, []);

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh = async () => {
        await Promise.all([
            fetchDoctors(true),
            fetchDepartments(),
        ]);
    };

    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {
        const { name, value } =
            event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    /* =====================================================
       PHOTO CHANGE
    ===================================================== */

    const handlePhotoChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {
            alert(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            );

            event.target.value = "";

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            alert(
                "Doctor photo must be 5 MB or smaller."
            );

            event.target.value = "";

            return;
        }

        setSelectedPhoto(file);

        if (photoPreview) {
            URL.revokeObjectURL(
                photoPreview
            );
        }

        const previewUrl =
            URL.createObjectURL(file);

        setPhotoPreview(previewUrl);
    };

    /* =====================================================
       CLEAR PHOTO
    ===================================================== */

    const clearSelectedPhoto = () => {
        setSelectedPhoto(null);

        if (photoPreview) {
            URL.revokeObjectURL(
                photoPreview
            );
        }

        setPhotoPreview("");
    };

    /* =====================================================
       GET DEPARTMENT NAME
    ===================================================== */

    const getDepartmentName = (doctor) => {
        if (!doctor) {
            return "Unassigned Department";
        }

        if (doctor.department_name) {
            return doctor.department_name;
        }

        if (doctor.departmentName) {
            return doctor.departmentName;
        }

        if (
            doctor.department &&
            typeof doctor.department ===
                "object"
        ) {
            return (
                doctor.department.name ||
                doctor.department.department_name ||
                doctor.department.title ||
                `Department ${
                    doctor.department.id || ""
                }`
            );
        }

        if (
            typeof doctor.department ===
            "string"
        ) {
            return doctor.department;
        }

        if (
            doctor.department_id &&
            departments.length > 0
        ) {
            const department =
                departments.find(
                    (item) =>
                        String(item.id) ===
                        String(
                            doctor.department_id
                        )
                );

            if (department) {
                return (
                    department.name ||
                    department.department_name ||
                    department.title ||
                    `Department ${doctor.department_id}`
                );
            }
        }

        if (doctor.department_id) {
            return `Department ${doctor.department_id}`;
        }

        return "Unassigned Department";
    };

    /* =====================================================
       GET DEPARTMENT DESCRIPTION
    ===================================================== */

    const getDepartmentDescription = (
        departmentName
    ) => {
        const theme =
            getDepartmentTheme(
                departmentName
            );

        return theme.description;
    };

    /* =====================================================
       OPEN ADD MODAL
    ===================================================== */

    const openAddModal = async () => {
        try {
            setEditingDoctor(null);
            setForm(EMPTY_FORM);
            clearSelectedPhoto();

            setShowModal(true);

            const response = await fetch(
                `${API_URL}/doctors/next-code`,
                {
                    method: "GET",
                    headers: {
                        ...getAuthHeaders(),
                    },
                }
            );

            const data =
                await response.json();

            if (
                response.ok &&
                data.success
            ) {
                setForm((previous) => ({
                    ...previous,
                    doctor_code:
                        data.doctor_code ||
                        "",
                }));
            }
        } catch (err) {
            console.error(
                "Generate doctor code error:",
                err
            );
        }
    };

    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

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

            status:
                doctor.status ||
                "available",
        });

        setSelectedPhoto(null);

        setPhotoPreview(
            doctor.photo ||
                doctor.profile_photo ||
                doctor.profilePhoto ||
                doctor.image ||
                doctor.image_url ||
                doctor.photo_url
                ? getDoctorPhoto(doctor)
                : ""
        );

        setShowModal(true);
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {
        if (
            photoPreview &&
            photoPreview.startsWith(
                "blob:"
            )
        ) {
            URL.revokeObjectURL(
                photoPreview
            );
        }

        setShowModal(false);
        setEditingDoctor(null);
        setForm(EMPTY_FORM);
        setSelectedPhoto(null);
        setPhotoPreview("");
    };

    /* =====================================================
       SUBMIT DOCTOR
    ===================================================== */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (!form.name.trim()) {
            alert(
                "Doctor name is required."
            );

            return;
        }

        const isEditing =
            Boolean(editingDoctor);

        try {
            setSaving(true);
            setError("");

            const formData =
                new FormData();

            Object.entries(form).forEach(
                ([key, value]) => {
                    formData.append(
                        key,
                        value ?? ""
                    );
                }
            );

            if (selectedPhoto) {
                formData.append(
                    "photo",
                    selectedPhoto
                );
            }

            const url = isEditing
                ? `${API_URL}/doctors/${editingDoctor.id}`
                : `${API_URL}/doctors`;

            const method = isEditing
                ? "PUT"
                : "POST";

            const response = await fetch(
                url,
                {
                    method,
                    headers: {
                        ...getAuthHeaders(),
                    },
                    body: formData,
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        data.message ||
                        "Failed to save doctor"
                );
            }

            if (!data.success) {
                throw new Error(
                    data.error ||
                        data.message ||
                        "Failed to save doctor"
                );
            }

            closeModal();

            await fetchDoctors();

            alert(
                isEditing
                    ? "Doctor updated successfully."
                    : "Doctor added successfully."
            );
        } catch (err) {
            console.error(
                isEditing
                    ? "Update doctor error:"
                    : "Save doctor error:",
                err
            );

            setError(
                err.message ||
                    "Failed to save doctor"
            );

            alert(
                    err.message ||
                    "Failed to save doctor"
            );
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       DELETE DOCTOR
    ===================================================== */

    const handleDelete = async (
        doctor
    ) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete Dr. ${doctor.name}?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(
                doctor.id
            );

            setError("");

            const response =
                await fetch(
                    `${API_URL}/doctors/${doctor.id}`,
                    {
                        method: "DELETE",
                        headers: {
                            ...getAuthHeaders(),
                        },
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete doctor"
                );
            }

            if (!data.success) {
                throw new Error(
                    data.message ||
                        "Failed to delete doctor"
                );
            }

            await fetchDoctors();
        } catch (err) {
            console.error(
                "Delete doctor error:",
                err
            );

            setError(
                err.message ||
                    "Failed to delete doctor"
            );

            alert(
                err.message ||
                    "Failed to delete doctor"
            );
        } finally {
            setDeleteLoading(null);
        }
    };

    /* =====================================================
       VIEW DOCTOR
    ===================================================== */

    const openViewModal = (doctor) => {
        setSelectedDoctor(doctor);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setSelectedDoctor(null);
    };

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredDoctors =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return doctors;
            }

            return doctors.filter(
                (doctor) => {
                    const departmentName =
                        getDepartmentName(
                            doctor
                        );

                    return (
                        String(
                            doctor.doctor_code ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            doctor.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            doctor.specialization ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            doctor.qualification ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            doctor.phone || ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            doctor.email || ""
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        String(
                            departmentName
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                    );
                }
            );
        }, [
            doctors,
            search,
            departments,
        ]);

    /* =====================================================
       DEPARTMENT GROUPING
    ===================================================== */

    const departmentGroups =
        useMemo(() => {
            const groups = {};

            filteredDoctors.forEach(
                (doctor) => {
                    const departmentName =
                        getDepartmentName(
                            doctor
                        );

                    if (
                        !groups[
                            departmentName
                        ]
                    ) {
                        groups[
                            departmentName
                        ] = [];
                    }

                    groups[
                        departmentName
                    ].push(doctor);
                }
            );

            return Object.entries(
                groups
            ).sort(
                (
                    [departmentA],
                    [departmentB]
                ) =>
                    departmentA.localeCompare(
                        departmentB
                    )
            );
        }, [
            filteredDoctors,
            departments,
        ]);

    /* =====================================================
       STATS
    ===================================================== */

    const totalDoctors =
        doctors.length;

    const availableDoctors =
        doctors.filter(
            (doctor) =>
                doctor.status ===
                "available"
        ).length;

    const busyDoctors =
        doctors.filter(
            (doctor) =>
                doctor.status ===
                "busy"
        ).length;

    const offlineDoctors =
        doctors.filter(
            (doctor) =>
                doctor.status ===
                "offline"
        ).length;

    /* =====================================================
       STATUS LABEL
    ===================================================== */

    const getStatusLabel = (
        status
    ) => {
        switch (status) {
            case "available":
                return "Available";

            case "busy":
                return "Busy";

            case "offline":
                return "Offline";

            default:
                return (
                    status ||
                    "Available"
                );
        }
    };

    /* =====================================================
       FORMAT FEE
    ===================================================== */

    const formatFee = (fee) => {
        if (
            fee === null ||
            fee === undefined ||
            fee === ""
        ) {
            return "₹0";
        }

        const number = Number(fee);

        if (Number.isNaN(number)) {
            return `₹${fee}`;
        }

        return `₹${number.toLocaleString(
            "en-IN"
        )}`;
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading &&
        doctors.length === 0
    ) {
        return (
            <div className="doctors-page">
                <div className="doctors-loading">
                    <FaSyncAlt className="loading-spin" />
                    <span>
                        Loading doctors...
                    </span>
                </div>
            </div>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="doctors-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="doctors-header">

                <div className="doctors-header-left">

                    <button
                        type="button"
                        className="doctors-back-button"
                        onClick={() => navigate("/dashboard")}
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>

                    <div className="doctors-title-icon">
                        <FaUserMd />
                    </div>

                    <div>
                        <h1>
                            Doctors
                        </h1>

                        <p>
                            Manage hospital doctors
                            and their information
                        </p>
                    </div>

                </div>

                <div className="doctors-header-actions">

                    <div className="doctors-search-top">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search doctors, department, phone..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                title="Clear search"
                                aria-label="Clear search"
                            >
                                <FaTimes />
                            </button>
                        )}

                    </div>

                    <button
                        type="button"
                        className="doctors-refresh-btn"
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
                                    ? "loading-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        className="doctors-add-btn"
                        onClick={
                            openAddModal
                        }
                    >
                        <FaPlus />
                        Add Doctor
                    </button>

                </div>

            </div>

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
                        onClick={() =>
                            setError("")
                        }
                        title="Dismiss"
                        aria-label="Dismiss"
                    >
                        <FaTimes />
                    </button>

                </div>
            )}

            {/* =================================================
                STATS
            ================================================= */}

            <div className="doctors-stats">

                <div className="doctor-stat-card total">

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

                <div className="doctor-stat-card available">

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

                <div className="doctor-stat-card busy">

                    <div className="doctor-stat-icon">
                        <FaBriefcase />
                    </div>

                    <div>
                        <span>
                            Busy
                        </span>

                        <strong>
                            {busyDoctors}
                        </strong>
                    </div>

                </div>

                <div className="doctor-stat-card offline">

                    <div className="doctor-stat-icon">
                        <FaTimes />
                    </div>

                    <div>
                        <span>
                            Offline
                        </span>

                        <strong>
                            {offlineDoctors}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                RESULT COUNT
            ================================================= */}

            <div className="doctors-result-bar">

                <div>
                    <strong>
                        {departmentGroups.length}
                    </strong>

                    <span>
                        {" "}
                        Department
                        {departmentGroups.length !==
                        1
                            ? "s"
                            : ""}
                    </span>
                </div>

                <span>
                    {filteredDoctors.length} doctor
                    {filteredDoctors.length !==
                    1
                        ? "s"
                        : ""}
                </span>

            </div>

            <section className="doctors-panel">

                <div className="doctors-toolbar">

                    <div>
                        <h2>Doctor List</h2>
                        <span>
                            {filteredDoctors.length} doctor
                            {filteredDoctors.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="doctors-toolbar-actions">
                        <div className="doctor-panel-search">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search doctor, specialization, phone..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        <button
                            type="button"
                            className="doctor-panel-refresh"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <FaSyncAlt
                                className={refreshing ? "loading-spin" : ""}
                            />
                            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                        </button>
                    </div>

                </div>

                {loading ? (
                    <div className="doctors-table-message">
                        <FaSyncAlt className="loading-spin" />
                        <span>Loading doctors...</span>
                    </div>
                ) : (
                    <div className="doctors-table-wrapper">
                        <table className="doctors-table">
                            <thead>
                                <tr>
                                    <th>Doctor</th>
                                    <th>Specialization</th>
                                    <th>Department</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.length > 0 ? (
                                    filteredDoctors.map((doctor) => (
                                        <tr key={doctor.id}>
                                            <td>
                                                <div className="doctor-table-person">
                                                    <div className="doctor-table-avatar">
                                                        <img
                                                            src={getDoctorPhoto(doctor)}
                                                            alt={doctor.name || "Doctor"}
                                                            onError={handleImageError}
                                                        />
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Dr. {doctor.name || "Doctor"}
                                                        </strong>
                                                        <span>
                                                            {doctor.doctor_code || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="doctor-table-specialization">
                                                    {doctor.specialization || "General Medicine"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="doctor-table-department">
                                                    {getDepartmentName(doctor)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="doctor-table-contact">
                                                    <span>{doctor.phone || "No phone"}</span>
                                                    <small>{doctor.email || "No email"}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`doctor-table-status ${doctor.status || "available"}`}
                                                >
                                                    {String(doctor.status || "available")
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        String(doctor.status || "available").slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="doctor-table-actions">
                                                    <button
                                                        type="button"
                                                        className="doctor-action view"
                                                        title="View Doctor"
                                                        aria-label="View Doctor"
                                                        onClick={() => openViewModal(doctor)}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="doctor-action edit"
                                                        title="Edit Doctor"
                                                        aria-label="Edit Doctor"
                                                        onClick={() => openEditModal(doctor)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="doctor-action delete"
                                                        title="Delete Doctor"
                                                        aria-label="Delete Doctor"
                                                        disabled={deleteLoading === doctor.id}
                                                        onClick={() => handleDelete(doctor)}
                                                    >
                                                        {deleteLoading === doctor.id ? (
                                                            <FaSyncAlt className="loading-spin" />
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
                                        <td colSpan="6" className="doctors-table-empty">
                                            No doctors found. Add a doctor or change your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

            </section>

            {/* =================================================
                DEPARTMENT CARDS
            ================================================= */}

            {departmentGroups.length === 0 ? (
                <div className="doctors-empty-wrapper">

                    <div className="doctors-empty">

                        <FaUserMd />

                        <h3>
                            No doctors found
                        </h3>

                        <p>
                            Add a doctor or
                            change your search.
                        </p>

                    </div>

                </div>
            ) : (
                <div className="department-cards-grid">

                    {departmentGroups.map(
                        (
                            [
                                departmentName,
                                departmentDoctors,
                            ]
                        ) => {

                            const theme =
                                getDepartmentTheme(
                                    departmentName
                                );

                            const DepartmentIcon =
                                theme.icon;

                            return (
                                <section
                                    key={
                                        departmentName
                                    }
                                    className={`department-card ${theme.className}`}
                                >

                                    {/* =================================
                                        DEPARTMENT CARD HEADER
                                    ================================= */}

                                    <div className="department-card-header">

                                        <div className="department-main-info">

                                            <div className="department-card-icon">
                                                <DepartmentIcon />
                                            </div>

                                            <div>

                                                <h2>
                                                    {
                                                        departmentName
                                                    }
                                                </h2>

                                                <strong>
                                                    {
                                                        departmentDoctors.length
                                                    }{" "}
                                                    Doctor
                                                    {
                                                        departmentDoctors.length !==
                                                        1
                                                            ? "s"
                                                            : ""
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="department-arrow"
                                            onClick={() =>
                                                setSearch(
                                                    departmentName
                                                )
                                            }
                                            title={`View ${departmentName}`}
                                            aria-label={`View ${departmentName}`}
                                        >
                                            <FaArrowRight />
                                        </button>

                                    </div>

                                    {/* =================================
                                        DESCRIPTION
                                    ================================= */}

                                    <p className="department-description">
                                        {getDepartmentDescription(
                                            departmentName
                                        )}
                                    </p>

                                    {/* =================================
                                        DOCTORS INSIDE DEPARTMENT
                                    ================================= */}

                                    <div className="department-doctors-list">

                                        {departmentDoctors.map(
                                            (
                                                doctor
                                            ) => (
                                                <div
                                                    className="department-doctor-card"
                                                    key={
                                                        doctor.id
                                                    }
                                                >

                                                    {/* PHOTO */}

                                                    <div className="department-doctor-photo">

                                                        <img
                                                            src={getDoctorPhoto(
                                                                doctor
                                                            )}
                                                            alt={
                                                                doctor.name ||
                                                                "Doctor"
                                                            }
                                                            onError={
                                                                handleImageError
                                                            }
                                                        />

                                                        <span
                                                            className={`doctor-photo-status ${
                                                                doctor.status ||
                                                                "available"
                                                            }`}
                                                        />

                                                    </div>

                                                    {/* INFO */}

                                                    <div className="department-doctor-info">

                                                        <h3>
                                                            Dr.{" "}
                                                            {
                                                                doctor.name ||
                                                                "Doctor"
                                                            }
                                                        </h3>

                                                        <span>
                                                            {
                                                                doctor.specialization ||
                                                                "General Medicine"
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                doctor.doctor_code ||
                                                                "N/A"
                                                            }
                                                        </small>

                                                    </div>

                                                    {/* ACTIONS */}

                                                    <div className="department-doctor-actions">

                                                        <button
                                                            type="button"
                                                            className="doctor-action view"
                                                            title="View Doctor"
                                                            aria-label="View Doctor"
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
                                                            className="doctor-action edit"
                                                            title="Edit Doctor"
                                                            aria-label="Edit Doctor"
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
                                                            className="doctor-action delete"
                                                            title="Delete Doctor"
                                                            aria-label="Delete Doctor"
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
                                                                <FaSyncAlt className="loading-spin" />
                                                            ) : (
                                                                <FaTrash />
                                                            )}
                                                        </button>

                                                    </div>

                                                </div>
                                            )
                                        )}

                                    </div>

                                    {/* =================================
                                        DEPARTMENT FOOTER
                                    ================================= */}

                                    <div className="department-card-footer">

                                        <span>
                                            {
                                                departmentDoctors.length
                                            }{" "}
                                            doctor
                                            {
                                                departmentDoctors.length !==
                                                1
                                                    ? "s"
                                                    : ""
                                            }{" "}
                                            in this department
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSearch(
                                                    departmentName
                                                )
                                            }
                                        >
                                            View Department
                                            <FaArrowRight />
                                        </button>

                                    </div>

                                </section>
                            );
                        }
                    )}

                </div>
            )}

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="doctor-modal-overlay"
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
                                        : "Add a new doctor to the hospital"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                title="Close"
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="doctor-form"
                        >

                            {/* PHOTO */}

                            <div className="doctor-photo-upload-section">

                                <div className="doctor-photo-preview">

                                    {photoPreview ? (
                                        <img
                                            src={
                                                photoPreview
                                            }
                                            alt="Doctor preview"
                                            onError={
                                                handleImageError
                                            }
                                        />
                                    ) : (
                                        <FaUserMd />
                                    )}

                                </div>

                                <div className="doctor-photo-upload-content">

                                    <h4>
                                        Doctor Photo
                                    </h4>

                                    <p>
                                        JPG, PNG or
                                        WEBP • Maximum
                                        5 MB
                                    </p>

                                    <label className="doctor-photo-upload-btn">

                                        <FaCamera />

                                        <span>
                                            {selectedPhoto
                                                ? "Change Photo"
                                                : "Choose Photo"}
                                        </span>

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={
                                                handlePhotoChange
                                            }
                                        />

                                    </label>

                                    {selectedPhoto && (
                                        <button
                                            type="button"
                                            className="doctor-remove-photo"
                                            onClick={
                                                clearSelectedPhoto
                                            }
                                        >
                                            <FaTimes />
                                            Remove selected
                                            photo
                                        </button>
                                    )}

                                </div>

                            </div>

                            {/* FORM GRID */}

                            <div className="doctor-form-grid">

                                <div className="doctor-form-group">
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
                                        readOnly
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="Enter doctor name"
                                        required
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="e.g. Cardiology"
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="e.g. MBBS, MD"
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="0"
                                    />
                                </div>

                                <div className="doctor-form-group">
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
                                        placeholder="0"
                                    />
                                </div>

                                <div className="doctor-form-group">
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

                            {/* FOOTER */}

                            <div className="doctor-modal-footer">

                                <button
                                    type="button"
                                    className="doctor-cancel-btn"
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
                                    className="doctor-save-btn"
                                    disabled={
                                        saving
                                    }
                                >
                                    {saving ? (
                                        <>
                                            <FaSyncAlt className="loading-spin" />
                                            Saving...
                                        </>
                                    ) : editingDoctor ? (
                                        <>
                                            <FaEdit />
                                            Update Doctor
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            Add Doctor
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
                                    onClick={
                                        closeViewModal
                                    }
                                    title="Close"
                                    aria-label="Close"
                                >
                                    <FaTimes />
                                </button>

                            </div>

                            {/* PROFILE */}

                            <div className="doctor-view-profile">

                                <div className="doctor-view-photo">

                                    <img
                                        src={getDoctorPhoto(
                                            selectedDoctor
                                        )}
                                        alt={
                                            selectedDoctor.name ||
                                            "Doctor"
                                        }
                                        onError={
                                            handleImageError
                                        }
                                    />

                                </div>

                                <div className="doctor-view-profile-info">

                                    <span className="doctor-view-label">
                                        {
                                            selectedDoctor.doctor_code ||
                                            "Doctor"
                                        }
                                    </span>

                                    <h3>
                                        Dr.{" "}
                                        {
                                            selectedDoctor.name ||
                                            "Doctor"
                                        }
                                    </h3>

                                    <p>
                                        {
                                            selectedDoctor.specialization ||
                                            "General Medicine"
                                        }
                                    </p>

                                    <span
                                        className={`doctor-status ${
                                            selectedDoctor.status ||
                                            "available"
                                        }`}
                                    >
                                        <span />
                                        {
                                            getStatusLabel(
                                                selectedDoctor.status
                                            )
                                        }
                                    </span>

                                </div>

                            </div>

                            {/* DETAILS */}

                            <div className="doctor-view-details">

                                <div className="doctor-view-detail">
                                    <FaGraduationCap />

                                    <div>
                                        <span>
                                            Qualification
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.qualification ||
                                                "MBBS"
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="doctor-view-detail">
                                    <FaBriefcase />

                                    <div>
                                        <span>
                                            Experience
                                        </span>

                                        <strong>
                                            {Number(
                                                selectedDoctor.experience_years
                                            ) || 0}{" "}
                                            Years
                                        </strong>
                                    </div>
                                </div>

                                <div className="doctor-view-detail">
                                    <FaPhone />

                                    <div>
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.phone ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="doctor-view-detail">
                                    <FaEnvelope />

                                    <div>
                                        <span>
                                            Email
                                        </span>

                                        <strong>
                                            {
                                                selectedDoctor.email ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="doctor-view-detail">
                                    <FaMoneyBillWave />

                                    <div>
                                        <span>
                                            Consultation
                                            Fee
                                        </span>

                                        <strong>
                                            {formatFee(
                                                selectedDoctor.consultation_fee
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="doctor-view-detail">
                                    <FaBuilding />

                                    <div>
                                        <span>
                                            Department
                                        </span>

                                        <strong>
                                            {getDepartmentName(
                                                selectedDoctor
                                            )}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="doctor-view-footer">

                                <button
                                    type="button"
                                    className="doctor-cancel-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="doctor-save-btn"
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

        </div>
    );
};

export default Doctors;