import { useEffect, useState } from "react";
import { FaBell, FaHospital } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import "./Header.css";

const API_BASE = "http://localhost:5000/api";
const BACKEND_ORIGIN = "http://localhost:5000";

/*
 * Logo ka path do tarah ka ho sakta hai:
 *  - "/hms-logo.png"        -> frontend public/ folder se
 *  - "/uploads/logo.png"    -> backend server se
 *  - "https://..." / data:  -> jaise hai waise
 */
const resolveLogoUrl = (logo) => {
    if (!logo) return "";

    if (/^(https?:|data:|blob:)/i.test(logo)) {
        return logo;
    }

    if (logo.startsWith("/uploads/") || logo.startsWith("uploads/")) {
        return `${BACKEND_ORIGIN}/${logo.replace(/^\/+/, "")}`;
    }

    return logo;
};

const DEFAULT_SETTINGS = {
    hospitalName: "HMS Hospital Narayanpur",
    tagline: "Hospital System",
    logo: "/hms-logo.png",
};

const Header = () => {
    const { user } = useAuth();

    const [hospitalSettings, setHospitalSettings] =
        useState(DEFAULT_SETTINGS);

    const [logoFailed, setLogoFailed] = useState(false);

    /* =========================================================
       LOAD HOSPITAL SETTINGS
       ========================================================= */

    const loadSettings = async () => {
        try {
            /*
             * First load local cache so Header appears immediately.
             */
            const storedSettings =
                localStorage.getItem("hmsSettings");

            if (storedSettings) {
                try {
                    const parsed =
                        JSON.parse(storedSettings);

                    setHospitalSettings({
                        ...DEFAULT_SETTINGS,
                        ...parsed,
                    });
                } catch (error) {
                    console.error(
                        "Invalid HMS settings in localStorage:",
                        error
                    );
                }
            }

            /*
             * Then get latest settings from backend.
             */
            const response = await fetch(
                `${API_BASE}/settings`
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to fetch hospital settings."
                );
            }

            const result =
                await response.json();

            if (
                result.success &&
                result.data
            ) {
                const updatedSettings = {
                    ...DEFAULT_SETTINGS,
                    ...result.data,
                };

                setHospitalSettings(
                    updatedSettings
                );

                /*
                 * Keep local cache synchronized.
                 */
                localStorage.setItem(
                    "hmsSettings",
                    JSON.stringify(
                        updatedSettings
                    )
                );
            }
        } catch (error) {
            console.error(
                "Header settings error:",
                error
            );

            /*
             * Keep cached/default settings
             * if backend is unavailable.
             */
        }
    };

    useEffect(() => {
        setLogoFailed(false);
    }, [hospitalSettings.logo]);

    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {
        loadSettings();
    }, []);

    /* =========================================================
       LISTEN FOR SETTINGS UPDATE
       ========================================================= */

    useEffect(() => {
        const handleSettingsUpdate = () => {
            loadSettings();
        };

        window.addEventListener(
            "hmsSettingsUpdated",
            handleSettingsUpdate
        );

        return () => {
            window.removeEventListener(
                "hmsSettingsUpdated",
                handleSettingsUpdate
            );
        };
    }, []);

    /* =========================================================
       USER DETAILS
       ========================================================= */

    const userName =
        user?.name ||
        user?.fullName ||
        "HMS Admin";

    const userRole =
        user?.role ||
        "Administrator";

    const userInitial =
        userName
            ?.charAt(0)
            ?.toUpperCase() || "A";

    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <header className="header">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="header-left">

                <div className="header-title-icon">
                    {resolveLogoUrl(hospitalSettings.logo) && !logoFailed ? (
                        <img
                            src={resolveLogoUrl(hospitalSettings.logo)}
                            alt={hospitalSettings.hospitalName}
                            onError={() => setLogoFailed(true)}
                        />
                    ) : (
                        <FaHospital />
                    )}
                </div>

                <div className="header-title-content">

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Welcome back to{" "}
                        <strong>
                            {
                                hospitalSettings.hospitalName
                            }
                        </strong>
                    </p>

                </div>

            </div>


            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="header-right">

                {/* Hospital Name Badge */}

                <div className="header-hospital-info">

                    <FaHospital />

                    <div>
                        <strong>
                            {
                                hospitalSettings.hospitalName
                            }
                        </strong>

                        <span>
                            {
                                hospitalSettings.tagline ||
                                "Hospital System"
                            }
                        </span>
                    </div>

                </div>


                {/* Notification */}

                <button
                    type="button"
                    className="notification-btn"
                    title="Notifications"
                >
                    <FaBell />

                    <span className="notification-dot" />
                </button>


                {/* User Profile */}

                <div className="user-profile">

                    <div className="user-avatar">
                        {userInitial}
                    </div>

                    <div className="user-details">

                        <strong>
                            {userName}
                        </strong>

                        <span>
                            {userRole}
                        </span>

                    </div>

                </div>

            </div>

        </header>
    );
};

export default Header;