import { useEffect, useMemo, useState } from "react";

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
} from "react-icons/fa";

import "./Doctors.css";


/* =========================================================
   API
========================================================= */

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


/* =========================================================
   DEFAULT FORM
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
    department_id: "",
    hospital_id: "",
    status: "available",
};


/* =========================================================
   IMAGE HELPERS
========================================================= */

const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");


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

    event.currentTarget.src = "/default-doctor.png";
};


/* =========================================================
   COMPONENT
========================================================= */

const Doctors = () => {

    /* =====================================================
       STATES
    ===================================================== */

    const [doctors, setDoctors] = useState([]);

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

    const [form, setForm] = useState(EMPTY_FORM);

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
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchDoctors();
    }, []);


    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh = () => {
        fetchDoctors(true);
    };


    /* =====================================================
       FORM CHANGE
    ===================================================== */

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

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

        /* ---------------------------------------------
           VALIDATE TYPE
        --------------------------------------------- */

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {

            alert(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            );

            event.target.value = "";
            return;
        }


        /* ---------------------------------------------
           VALIDATE SIZE
        --------------------------------------------- */

        if (file.size > 5 * 1024 * 1024) {

            alert(
                "Doctor photo must be 5 MB or smaller."
            );

            event.target.value = "";
            return;
        }


        /* ---------------------------------------------
           SET FILE
        --------------------------------------------- */

        setSelectedPhoto(file);


        /* ---------------------------------------------
           PREVIEW
        --------------------------------------------- */

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
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoPreview("");
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


            /* -----------------------------------------
               GET NEXT DOCTOR CODE
            ----------------------------------------- */

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
                doctor.experience_years ?? "",

            consultation_fee:
                doctor.consultation_fee ?? "",

            department_id:
                doctor.department_id ?? "",

            hospital_id:
                doctor.hospital_id ?? "",

            status:
                doctor.status || "available",
        });


        setSelectedPhoto(null);

        setPhotoPreview(
            doctor.photo
                ? getDoctorPhoto(doctor)
                : ""
        );

        setShowModal(true);
    };


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setShowModal(false);

        setEditingDoctor(null);

        setForm(EMPTY_FORM);

        setSelectedPhoto(null);

        setPhotoPreview("");
    };


    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (!form.name.trim()) {

            alert(
                "Doctor name is required."
            );

            return;
        }


        try {

            setSaving(true);

            setError("");


            /* -----------------------------------------
               FORM DATA
            ----------------------------------------- */

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


            /* -----------------------------------------
               PHOTO
            ----------------------------------------- */

            if (selectedPhoto) {

                formData.append(
                    "photo",
                    selectedPhoto
                );
            }


            /* -----------------------------------------
               URL + METHOD
            ----------------------------------------- */

            const isEditing =
                Boolean(editingDoctor);

            const url = isEditing
                ? `${API_URL}/doctors/${editingDoctor.id}`
                : `${API_URL}/doctors`;

            const method = isEditing
                ? "PUT"
                : "POST";


            /* -----------------------------------------
               REQUEST
            ----------------------------------------- */

            const response =
                await fetch(url, {
                    method,
                    headers: {
                        ...getAuthHeaders(),
                    },
                    body: formData,
                });


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to save doctor"
                );
            }


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Failed to save doctor"
                );
            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            closeModal();

            await fetchDoctors();


            alert(
                isEditing
                    ? "Doctor updated successfully."
                    : "Doctor added successfully."
            );

        } catch (err) {

            console.error(
                "Save doctor error:",
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

    const handleDelete = async (doctor) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete Dr. ${doctor.name}?`
            );

        if (!confirmed) {
            return;
        }


        try {

            setDeleteLoading(doctor.id);

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
       FILTER DOCTORS
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

                    return (
                        String(
                            doctor.doctor_code || ""
                        )
                            .toLowerCase()
                            .includes(keyword) ||

                        String(
                            doctor.name || ""
                        )
                            .toLowerCase()
                            .includes(keyword) ||

                        String(
                            doctor.specialization ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword) ||

                        String(
                            doctor.qualification ||
                            ""
                        )
                            .toLowerCase()
                            .includes(keyword) ||

                        String(
                            doctor.phone || ""
                        )
                            .toLowerCase()
                            .includes(keyword) ||

                        String(
                            doctor.email || ""
                        )
                            .toLowerCase()
                            .includes(keyword)
                    );
                }
            );

        }, [doctors, search]);


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

    const getStatusLabel = (status) => {

        switch (status) {

            case "available":
                return "Available";

            case "busy":
                return "Busy";

            case "offline":
                return "Offline";

            default:
                return status || "Available";
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

        const number =
            Number(fee);

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

                    <FaSyncAlt
                        className="loading-spin"
                    />

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
                PAGE HEADER
            ================================================= */}

            <div className="doctors-header">

                <div className="doctors-header-left">

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

                    <button
                        type="button"
                        className="doctors-refresh-btn"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >

                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "loading-spin"
                                    : ""
                            }
                        />

                        <span>
                            Refresh
                        </span>

                    </button>


                    <button
                        type="button"
                        className="doctors-add-btn"
                        onClick={openAddModal}
                    >

                        <FaPlus />

                        <span>
                            Add Doctor
                        </span>

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
                    >
                        <FaTimes />
                    </button>

                </div>

            )}


            {/* =================================================
                STATS
            ================================================= */}

            <div className="doctors-stats">

                <div className="doctor-stat-card">

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
                SEARCH
            ================================================= */}

            <div className="doctors-toolbar">

                <div className="doctors-search">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search doctors..."
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
                        >
                            <FaTimes />
                        </button>

                    )}

                </div>

                <span className="doctors-result-count">
                    {filteredDoctors.length} doctor
                    {filteredDoctors.length !== 1
                        ? "s"
                        : ""}
                </span>

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="doctors-table-wrapper">

                <table className="doctors-table">

                    <thead>

                        <tr>

                            <th>
                                Doctor
                            </th>

                            <th>
                                Specialization
                            </th>

                            <th>
                                Qualification
                            </th>

                            <th>
                                Contact
                            </th>

                            <th>
                                Experience
                            </th>

                            <th>
                                Fee
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

                        {filteredDoctors.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="8"
                                    className="doctors-empty"
                                >

                                    <FaUserMd />

                                    <h3>
                                        No doctors found
                                    </h3>

                                    <p>
                                        Add a doctor or
                                        change your search.
                                    </p>

                                </td>

                            </tr>

                        ) : (

                            filteredDoctors.map(
                                (doctor) => (

                                    <tr
                                        key={doctor.id}
                                    >

                                        {/* DOCTOR */}

                                        <td>

                                            <div className="doctor-table-profile">

                                                <div className="doctor-table-photo">

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
                                                        className={`doctor-photo-status ${doctor.status || "available"}`}
                                                    />

                                                </div>

                                                <div>

                                                    <strong>
                                                        Dr.{" "}
                                                        {doctor.name ||
                                                            "Doctor"}
                                                    </strong>

                                                    <small>
                                                        {doctor.doctor_code ||
                                                            "N/A"}
                                                    </small>

                                                </div>

                                            </div>

                                        </td>


                                        {/* SPECIALIZATION */}

                                        <td>

                                            <span className="doctor-specialization">

                                                {doctor.specialization ||
                                                    "General Physician"}

                                            </span>

                                        </td>


                                        {/* QUALIFICATION */}

                                        <td>

                                            <div className="doctor-qualification">

                                                <FaGraduationCap />

                                                <span>
                                                    {doctor.qualification ||
                                                        "MBBS"}
                                                </span>

                                            </div>

                                        </td>


                                        {/* CONTACT */}

                                        <td>

                                            <div className="doctor-contact">

                                                {doctor.phone && (

                                                    <span>

                                                        <FaPhone />

                                                        {doctor.phone}

                                                    </span>

                                                )}

                                                {doctor.email && (

                                                    <span>

                                                        <FaEnvelope />

                                                        {doctor.email}

                                                    </span>

                                                )}

                                                {!doctor.phone &&
                                                    !doctor.email && (
                                                        <span>
                                                            No contact
                                                        </span>
                                                    )}

                                            </div>

                                        </td>


                                        {/* EXPERIENCE */}

                                        <td>

                                            <span className="doctor-experience">

                                                {Number(
                                                    doctor.experience_years
                                                ) || 0}{" "}
                                                Years

                                            </span>

                                        </td>


                                        {/* FEE */}

                                        <td>

                                            <div className="doctor-fee">

                                                <FaMoneyBillWave />

                                                {formatFee(
                                                    doctor.consultation_fee
                                                )}

                                            </div>

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`doctor-status ${doctor.status || "available"}`}
                                            >

                                                <span />

                                                {getStatusLabel(
                                                    doctor.status
                                                )}

                                            </span>

                                        </td>


                                        {/* ACTIONS */}

                                        <td>

                                            <div className="doctor-actions">

                                                <button
                                                    type="button"
                                                    className="doctor-action view"
                                                    title="View"
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
                                                    title="Edit"
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
                                                    title="Delete"
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

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="doctor-modal-overlay"
                    onMouseDown={(event) => {

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
                                onClick={closeModal}
                            >

                                <FaTimes />

                            </button>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="doctor-form"
                        >

                            {/* =================================
                                PHOTO
                            ================================= */}

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
                                        JPG, PNG or WEBP
                                        • Maximum 5 MB
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

                                            Remove selected photo

                                        </button>

                                    )}

                                </div>

                            </div>


                            {/* =================================
                                FORM GRID
                            ================================= */}

                            <div className="doctor-form-grid">


                                {/* Doctor Code */}

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


                                {/* Name */}

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


                                {/* Specialization */}

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


                                {/* Qualification */}

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


                                {/* Phone */}

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


                                {/* Email */}

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


                                {/* Experience */}

                                <div className="doctor-form-group">

                                    <label>
                                        Experience (Years)
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


                                {/* Consultation Fee */}

                                <div className="doctor-form-group">

                                    <label>
                                        Consultation Fee
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


                                {/* Department */}

                                <div className="doctor-form-group">

                                    <label>
                                        Department ID
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        name="department_id"
                                        value={
                                            form.department_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Department ID"
                                    />

                                </div>


                                {/* Hospital */}

                                <div className="doctor-form-group">

                                    <label>
                                        Hospital ID
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        name="hospital_id"
                                        value={
                                            form.hospital_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Hospital ID"
                                    />

                                </div>


                                {/* Status */}

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


                            {/* =================================
                                FORM ACTIONS
                            ================================= */}

                            <div className="doctor-modal-footer">

                                <button
                                    type="button"
                                    className="doctor-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >

                                    Cancel

                                </button>


                                <button
                                    type="submit"
                                    className="doctor-save-btn"
                                    disabled={saving}
                                >

                                    {saving ? (

                                        <>
                                            <FaSyncAlt className="loading-spin" />

                                            <span>
                                                Saving...
                                            </span>
                                        </>

                                    ) : (

                                        <>
                                            <FaPlus />

                                            <span>
                                                {editingDoctor
                                                    ? "Update Doctor"
                                                    : "Add Doctor"}
                                            </span>
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
                        onMouseDown={(event) => {

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
                                        Complete doctor information
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
                                        {selectedDoctor.doctor_code ||
                                            "Doctor"}
                                    </span>

                                    <h3>
                                        Dr.{" "}
                                        {selectedDoctor.name ||
                                            "Doctor"}
                                    </h3>

                                    <p>
                                        {selectedDoctor.specialization ||
                                            "General Physician"}
                                    </p>

                                    <span
                                        className={`doctor-status ${selectedDoctor.status || "available"}`}
                                    >

                                        <span />

                                        {getStatusLabel(
                                            selectedDoctor.status
                                        )}

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
                                            {selectedDoctor.qualification ||
                                                "MBBS"}
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
                                            {selectedDoctor.phone ||
                                                "Not available"}
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
                                            {selectedDoctor.email ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                </div>


                                <div className="doctor-view-detail">

                                    <FaMoneyBillWave />

                                    <div>

                                        <span>
                                            Consultation Fee
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
                                            Department ID
                                        </span>

                                        <strong>
                                            {selectedDoctor.department_id ||
                                                "Not assigned"}
                                        </strong>

                                    </div>

                                </div>

                            </div>


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