import { useState } from "react";
import {
    FaSignInAlt,
    FaUserMd,
    FaHospital,
    FaShieldAlt,
    FaHeartbeat,
} from "react-icons/fa";

import LoginModal from "../auth/LoginModal";
import "./Home.css";

function Home() {
    const [showLoginModal, setShowLoginModal] = useState(false);

    const openLoginModal = () => {
        setShowLoginModal(true);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    return (
        <main className="home-page">

            {/* ================= HEADER ================= */}

            <header className="home-header">

                <div className="home-brand">

                    <div className="home-brand-icon">
                        <FaHeartbeat />
                    </div>

                    <div className="home-brand-text">
                        <h1>HMS</h1>

                        <span>
                            Hospital Management System
                        </span>
                    </div>

                </div>

            </header>


            {/* ================= MAIN CONTENT ================= */}

            <section className="home-content">

                {/* ================= LEFT SIDE ================= */}

                <div className="home-left">

                    <div className="home-badge">
                        <FaHospital />
                        <span>SMART HEALTHCARE MANAGEMENT</span>
                    </div>


                    <h2>
                        Hospital Management
                        <br />
                        <strong>Made Simple</strong>
                    </h2>


                    <p className="home-description">
                        Manage patients, doctors, appointments,
                        departments and hospital operations
                        from one secure platform.
                    </p>


                    {/* ================= LOGIN BUTTON ================= */}

                    <div className="home-login-wrapper">

                        <button
                            type="button"
                            className="home-login-button"
                            onClick={openLoginModal}
                        >
                            <FaSignInAlt />
                            <span>Login to HMS</span>
                        </button>

                    </div>


                    {/* ================= FEATURES ================= */}

                    <div className="home-features">

                        {/* DOCTORS */}

                        <div className="home-feature">

                            <FaUserMd />

                            <div>
                                <h3>Doctors</h3>

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
                                <h3>Patients</h3>

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
                                <h3>Departments</h3>

                                <p>
                                    Organize hospital
                                    departments.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>


                {/* ================= RIGHT SIDE ================= */}

                <div className="home-right">

                    <div className="hospital-card">

                        <div className="hospital-card-icon">
                            <FaHeartbeat />
                        </div>


                        <h3>
                            Hospital Management
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


            {/* ================= FOOTER ================= */}

            <footer className="home-footer">

                <span>
                    © 2026 HMS — Hospital Management System
                </span>

                <span>
                    Secure • Reliable • Digital Healthcare
                </span>

            </footer>


            {/* ================= LOGIN MODAL ================= */}

            {showLoginModal && (
                <LoginModal
                    onClose={closeLoginModal}
                />
            )}

        </main>
    );
}

export default Home;