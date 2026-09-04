import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaSignInAlt,
    FaUserMd,
    FaHospital,
    FaShieldAlt,
    FaUserPlus,
    FaCalendarPlus,
    FaHistory,
    FaStethoscope,
    FaGraduationCap,
    FaBriefcase,
} from "react-icons/fa";

import LoginModal from "../auth/LoginModal";
import "./Home.css";

const API_BASE = "http://localhost:5000/api";
const BACKEND_BASE = "http://localhost:5000";

const DEFAULT_SETTINGS = {
    hospitalName: "HMS Hospital",
    tagline: "Hospital System",
    logo: "/hms-logo.png",
};

function Home() {
    const navigate = useNavigate();

    const [showLoginModal, setShowLoginModal] = useState(false);

    const [hospitalName, setHospitalName] = useState(
        DEFAULT_SETTINGS.hospitalName
    );

    const [tagline, setTagline] = useState(
        DEFAULT_SETTINGS.tagline
    );

    const [hospitalLogo, setHospitalLogo] = useState(
        DEFAULT_SETTINGS.logo
    );

    const [doctors, setDoctors] = useState([]);

    // =====================================================
    // LOAD HOSPITAL SETTINGS
    // =====================================================

    useEffect(() => {
        let mounted = true;

        const loadSettings = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/settings`
                );

                if (!response.ok) {
                    throw new Error(
                        `Settings API failed: ${response.status}`
                    );
                }

                const result = await response.json();

                if (!mounted) return;

                const settings = result?.data || {};

                setHospitalName(
                    typeof settings.hospitalName === "string" &&
                        settings.hospitalName.trim()
                        ? settings.hospitalName.trim()
                        : DEFAULT_SETTINGS.hospitalName
                );

                setTagline(
                    typeof settings.tagline === "string" &&
                        settings.tagline.trim()
                        ? settings.tagline.trim()
                        : DEFAULT_SETTINGS.tagline
                );

                setHospitalLogo(
                    typeof settings.logo === "string" &&
                        settings.logo.trim()
                        ? settings.logo.trim()
                        : DEFAULT_SETTINGS.logo
                );
            } catch (error) {
                console.error(
                    "Unable to load hospital settings:",
                    error
                );
            }
        };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, []);

    // =====================================================
    // LOAD DOCTORS
    // =====================================================

    useEffect(() => {
        let mounted = true;

        const loadDoctors = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/doctors`
                );

                if (!response.ok) {
                    throw new Error(
                        `Doctors API failed: ${response.status}`
                    );
                }

                const result = await response.json();

                if (!mounted) return;

                const doctorsList = Array.isArray(result?.doctors)
                    ? result.doctors
                    : Array.isArray(result?.data)
                        ? result.data
                        : Array.isArray(result)
                            ? result
                            : [];

                console.log(
                    "HMS Doctors loaded:",
                    doctorsList
                );

                setDoctors(doctorsList);
            } catch (error) {
                console.error(
                    "Unable to load doctors:",
                    error
                );

                if (mounted) {
                    setDoctors([]);
                }
            }
        };

        loadDoctors();

        return () => {
            mounted = false;
        };
    }, []);

    // =====================================================
    // LOGIN
    // =====================================================

    const openLoginModal = () => {
        setShowLoginModal(true);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    // =====================================================
    // PATIENT SERVICE NAVIGATION
    // =====================================================

    const goToPatientRegistration = () => {
        navigate("/patients");
    };

    const goToNewAppointment = () => {
        navigate("/appointments");
    };

    const goToOldAppointment = () => {
        navigate("/appointments");
    };

    // =====================================================
    // LOGO FALLBACK
    // =====================================================

    const handleLogoError = (event) => {
        if (
            event.currentTarget.dataset.fallback === "true"
        ) {
            return;
        }

        event.currentTarget.dataset.fallback = "true";
        event.currentTarget.src = DEFAULT_SETTINGS.logo;
    };

    // =====================================================
    // DOCTOR PHOTO FALLBACK
    // =====================================================

    const handleDoctorPhotoError = (event) => {
        if (
            event.currentTarget.dataset.fallback === "true"
        ) {
            return;
        }

        event.currentTarget.dataset.fallback = "true";
        event.currentTarget.src = "/default-doctor.png";
    };

    // =====================================================
    // DOCTOR PHOTO URL
    // =====================================================

    const getDoctorPhoto = (doctor) => {
        const photo =
            doctor?.photo ||
            doctor?.profile_photo ||
            doctor?.profilePhoto ||
            doctor?.image ||
            doctor?.image_url ||
            doctor?.photo_url;

        if (
            !photo ||
            typeof photo !== "string" ||
            !photo.trim()
        ) {
            return "/default-doctor.png";
        }

        const cleanPhoto = photo.trim();

        // Full backend/frontend URL
        if (
            cleanPhoto.startsWith("http://") ||
            cleanPhoto.startsWith("https://")
        ) {
            return cleanPhoto;
        }

        // /uploads/doctors/file.jpg
        if (
            cleanPhoto.startsWith("/uploads/")
        ) {
            return `${BACKEND_BASE}${cleanPhoto}`;
        }

        // uploads/doctors/file.jpg
        if (
            cleanPhoto.startsWith("uploads/")
        ) {
            return `${BACKEND_BASE}/${cleanPhoto}`;
        }

        // Any other absolute path
        if (
            cleanPhoto.startsWith("/")
        ) {
            return `${BACKEND_BASE}${cleanPhoto}`;
        }

        // Only filename
        if (
            !cleanPhoto.includes("/")
        ) {
            return `${BACKEND_BASE}/uploads/doctors/${cleanPhoto}`;
        }

        // Other relative path
        return `${BACKEND_BASE}/${cleanPhoto.replace(
            /^\/+/,
            ""
        )}`;
    };

    // =====================================================
    // DOCTOR NAME
    // =====================================================

    const getDoctorName = (doctor) => {
        return (
            doctor?.name ||
            doctor?.doctor_name ||
            doctor?.full_name ||
            doctor?.fullName ||
            "Doctor"
        );
    };

    // =====================================================
    // SPECIALIZATION
    // =====================================================

    const getSpecialization = (doctor) => {
        return (
            doctor?.specialization ||
            doctor?.speciality ||
            doctor?.specialty ||
            doctor?.department_name ||
            doctor?.department ||
            "Medical Specialist"
        );
    };

    // =====================================================
    // QUALIFICATION
    // =====================================================

    const getQualification = (doctor) => {
        return (
            doctor?.qualification ||
            doctor?.qualifications ||
            doctor?.degree ||
            doctor?.education ||
            "MBBS"
        );
    };

    // =====================================================
    // EXPERIENCE
    // =====================================================

    const getExperience = (doctor) => {
        const experience =
            doctor?.experience_years ??
            doctor?.experience ??
            doctor?.years_of_experience;

        if (
            experience !== undefined &&
            experience !== null &&
            experience !== ""
        ) {
            return `${experience} Years`;
        }

        return "Experienced";
    };

    // =====================================================
    // DOCTOR CARD
    // =====================================================

    const DoctorCard = ({
        doctor,
        duplicate = false,
    }) => {
        const doctorPhoto = getDoctorPhoto(doctor);
        const doctorName = getDoctorName(doctor);

        return (
            <article
                className="doctor-card"
                aria-hidden={
                    duplicate ? "true" : "false"
                }
            >
                <div className="doctor-card-photo">

                    <img
                        src={doctorPhoto}
                        alt={
                            duplicate
                                ? ""
                                : doctorName
                        }
                        loading="lazy"
                        onError={handleDoctorPhotoError}
                    />

                    <div className="doctor-photo-badge">
                        <FaUserMd />
                    </div>

                </div>

                <div className="doctor-card-info">

                    <div className="doctor-card-label">

                        <FaStethoscope />

                        <span>
                            Medical Specialist
                        </span>

                    </div>

                    <h3>
                        {doctorName}
                    </h3>

                    <p className="doctor-specialization">
                        {getSpecialization(doctor)}
                    </p>

                    <div className="doctor-meta">

                        <span>
                            <FaGraduationCap />
                            {getQualification(doctor)}
                        </span>

                        <span>
                            <FaBriefcase />
                            {getExperience(doctor)}
                        </span>

                    </div>

                </div>
            </article>
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <main className="home-page">

            <header className="home-header"></header>

            <section className="home-content">

                {/* =================================================
                    MAIN HOME AREA
                ================================================= */}

                <div className="home-left">

                    <div className="home-badge">

                        <FaHospital />

                        <span>
                            SMART HEALTHCARE MANAGEMENT
                        </span>

                    </div>

                    <div className="home-brand">

                        <div className="home-brand-icon">

                            <img
                                src={hospitalLogo}
                                alt={`${hospitalName} Logo`}
                                onError={handleLogoError}
                            />

                        </div>

                        <div className="home-brand-text">

                            <h1>
                                {hospitalName}
                            </h1>

                            <span>
                                {tagline}
                            </span>

                        </div>

                    </div>

                    <p className="home-description">
                        Manage patients, doctors, appointments,
                        departments and hospital operations
                        from one secure platform.
                    </p>

                    <div className="home-login-wrapper">

                        <button
                            type="button"
                            className="home-login-button"
                            onClick={openLoginModal}
                        >

                            <FaSignInAlt />

                            <span>
                                Login to HMS
                            </span>

                        </button>

                    </div>

                </div>

                {/* =================================================
                    PATIENT SERVICES
                ================================================= */}

                <div className="home-right">

                    <div className="hospital-card">

                        <div className="hospital-card-icon">

                            <img
                                src={hospitalLogo}
                                alt={`${hospitalName} Logo`}
                                onError={handleLogoError}
                            />

                        </div>

                        <h3>
                            {hospitalName}
                        </h3>

                        <p>
                            Everything you need to manage
                            your hospital efficiently.
                        </p>

                        {/* PATIENT SERVICES */}

                        <div className="hospital-management-list">

                            <h4>
                                Patient Services
                            </h4>

                            {/* NEW PATIENT REGISTRATION */}

                            <button
                                type="button"
                                className="management-item"
                                onClick={
                                    goToPatientRegistration
                                }
                            >

                                <FaUserPlus />

                                <span>
                                    New Patient Registration
                                </span>

                                <small>
                                    Register
                                </small>

                            </button>

                            {/* NEW PATIENT APPOINTMENT */}

                            <button
                                type="button"
                                className="management-item"
                                onClick={
                                    goToNewAppointment
                                }
                            >

                                <FaCalendarPlus />

                                <span>
                                    New Patient Appointment
                                </span>

                                <small>
                                    Book
                                </small>

                            </button>

                            {/* OLD PATIENT APPOINTMENT */}

                            <button
                                type="button"
                                className="management-item"
                                onClick={
                                    goToOldAppointment
                                }
                            >

                                <FaHistory />

                                <span>
                                    Old Patient Appointment
                                </span>

                                <small>
                                    View
                                </small>

                            </button>

                        </div>

                        {/* SECURITY */}

                        <div className="hospital-security">

                            <FaShieldAlt />

                            <span>
                                Secure Healthcare Platform
                            </span>

                        </div>

                    </div>

                </div>

                {/* =================================================
                    DOCTORS MARQUEE
                ================================================= */}

                {doctors.length > 0 && (

                    <section className="doctors-section">

                        <div className="doctors-marquee">

                            <div className="doctors-marquee-track">

                                {/* FIRST SET */}

                                {doctors.map(
                                    (doctor, index) => (
                                        <DoctorCard
                                            key={
                                                `doctor-a-${doctor.id ||
                                                doctor._id ||
                                                index
                                                }`
                                            }
                                            doctor={doctor}
                                        />
                                    )
                                )}

                                {/* DUPLICATE SET */}

                                {doctors.map(
                                    (doctor, index) => (
                                        <DoctorCard
                                            key={
                                                `doctor-b-${doctor.id ||
                                                doctor._id ||
                                                index
                                                }`
                                            }
                                            doctor={doctor}
                                            duplicate
                                        />
                                    )
                                )}

                            </div>

                        </div>

                    </section>

                )}

            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="home-footer">

                <span>
                    © 2026 {hospitalName}
                </span>

                <span>
                    Secure • Reliable • Digital Healthcare
                </span>

            </footer>

            {/* =====================================================
                LOGIN MODAL
            ===================================================== */}

            {showLoginModal && (

                <LoginModal
                    onClose={closeLoginModal}
                />

            )}

        </main>
    );
}

export default Home;