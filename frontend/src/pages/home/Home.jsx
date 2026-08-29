import { useEffect, useState } from "react";

import {
    FaSignInAlt,
    FaUserMd,
    FaHospital,
    FaShieldAlt,
    FaHeartbeat,
} from "react-icons/fa";

import LoginModal from "../auth/LoginModal";
import "./Home.css";

const API_BASE = "http://localhost:5000/api";

const DEFAULT_SETTINGS = {
    hospitalName: "HMS Hospital",
    tagline: "Hospital System",
    logo: "/hms-logo.png",
};

function Home() {

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


    // =====================================================
    // LOAD HOSPITAL SETTINGS FROM DATABASE
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

                if (!mounted) {
                    return;
                }

                const settings = result?.data || {};

                setHospitalName(
                    settings.hospitalName?.trim()
                        ? settings.hospitalName.trim()
                        : DEFAULT_SETTINGS.hospitalName
                );

                setTagline(
                    settings.tagline?.trim()
                        ? settings.tagline.trim()
                        : DEFAULT_SETTINGS.tagline
                );

                setHospitalLogo(
                    settings.logo?.trim()
                        ? settings.logo.trim()
                        : DEFAULT_SETTINGS.logo
                );

            } catch (error) {

                console.error(
                    "Unable to load hospital settings:",
                    error
                );

                if (!mounted) {
                    return;
                }

                setHospitalName(
                    DEFAULT_SETTINGS.hospitalName
                );

                setTagline(
                    DEFAULT_SETTINGS.tagline
                );

                setHospitalLogo(
                    DEFAULT_SETTINGS.logo
                );
            }
        };

        loadSettings();

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
    // LOGO ERROR FALLBACK
    // =====================================================

    const handleLogoError = (event) => {

        if (
            event.currentTarget.src.endsWith(
                DEFAULT_SETTINGS.logo
            )
        ) {
            return;
        }

        event.currentTarget.src =
            DEFAULT_SETTINGS.logo;
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <main className="home-page">

            {/* =================================================
                HIDDEN HEADER
            ================================================= */}

            <header className="home-header">
                {/* Header intentionally hidden */}
            </header>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <section className="home-content">


                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="home-left">


                    {/* =================================================
                        SMART HEALTHCARE MANAGEMENT
                        TOP
                    ================================================= */}

                    <div className="home-badge">

                        <FaHospital />

                        <span>
                            SMART HEALTHCARE MANAGEMENT
                        </span>

                    </div>


                    {/* =================================================
                        HOSPITAL BRAND
                        LOGO LEFT + DATABASE NAME RIGHT
                    ================================================= */}

                    <div className="home-brand">


                        {/* =================================================
                            LARGE REAL HOSPITAL LOGO
                        ================================================= */}

                        <div className="home-brand-icon">

                            <img
                                src={hospitalLogo}
                                alt={`${hospitalName} Logo`}
                                onError={handleLogoError}
                            />

                        </div>


                        {/* =================================================
                            DATABASE HOSPITAL NAME
                        ================================================= */}

                        <div className="home-brand-text">

                            <h1>
                                {hospitalName}
                            </h1>

                            <span>
                                {tagline}
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <p className="home-description">

                        Manage patients, doctors, appointments,
                        departments and hospital operations
                        from one secure platform.

                    </p>


                    {/* =================================================
                        LOGIN BUTTON
                    ================================================= */}

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


                    {/* =================================================
                        FEATURES
                    ================================================= */}

                    <div className="home-features">


                        {/* DOCTORS */}

                        <div className="home-feature">

                            <FaUserMd />

                            <div>

                                <h3>
                                    Doctors
                                </h3>

                                <p>
                                    Manage doctors and
                                    medical staff.
                                </p>

                            </div>

                        </div>


                        {/* PATIENTS */}

                        <div className="home-feature">

                            <FaHeartbeat />

                            <div>

                                <h3>
                                    Patients
                                </h3>

                                <p>
                                    Manage complete
                                    patient records.
                                </p>

                            </div>

                        </div>


                        {/* DEPARTMENTS */}

                        <div className="home-feature">

                            <FaHospital />

                            <div>

                                <h3>
                                    Departments
                                </h3>

                                <p>
                                    Organize hospital
                                    departments.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <div className="home-right">

                    <div className="hospital-card">


                        {/* CARD LOGO */}

                        <div className="hospital-card-icon">

                            <img
                                src={hospitalLogo}
                                alt={`${hospitalName} Logo`}
                                onError={handleLogoError}
                            />

                        </div>


                        {/* DYNAMIC HOSPITAL NAME */}

                        <h3>
                            {hospitalName}
                        </h3>


                        <p>
                            Everything you need to manage
                            your hospital efficiently.
                        </p>


                        {/* MANAGEMENT LIST */}

                        <div className="hospital-management-list">


                            <div className="management-item">

                                <FaUserMd />

                                <span>
                                    Doctors
                                </span>

                                <small>
                                    Manage
                                </small>

                            </div>


                            <div className="management-item">

                                <FaHeartbeat />

                                <span>
                                    Patients
                                </span>

                                <small>
                                    Manage
                                </small>

                            </div>


                            <div className="management-item">

                                <FaHospital />

                                <span>
                                    Departments
                                </span>

                                <small>
                                    Organize
                                </small>

                            </div>

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

            </section>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="home-footer">

                <span>
                    © 2026 {hospitalName}
                </span>

                <span>
                    Secure • Reliable • Digital Healthcare
                </span>

            </footer>


            {/* =================================================
                LOGIN MODAL
            ================================================= */}

            {showLoginModal && (

                <LoginModal
                    onClose={closeLoginModal}
                />

            )}

        </main>
    );
}


export default Home;