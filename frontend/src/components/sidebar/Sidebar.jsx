import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import { useAuth } from "../../context/AuthContext";

import {
    FaSignOutAlt,
    FaChartBar,
    FaUsers,
    FaUserMd,
    FaCalendarCheck,
    FaHospital,
    FaPills,
    FaFlask,
    FaCreditCard,
    FaFileAlt,
    FaCog,
    FaUserShield,
} from "react-icons/fa";

import "./Sidebar.css";


// =====================================================
// API
// =====================================================

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// =====================================================
// DEFAULT HOSPITAL SETTINGS
// =====================================================

const DEFAULT_HOSPITAL_NAME =
    "HMS Hospital";

const DEFAULT_LOGO =
    "/hms-logo.png";


// =====================================================
// 9 HMS ROLES
// =====================================================

const VALID_ROLES = [
    "super_admin",
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
    "patient",
];


// =====================================================
// ROLE DISPLAY NAMES
// =====================================================

const ROLE_NAMES = {
    super_admin: "Super Admin",
    hospital_admin: "Hospital Admin",
    receptionist: "Receptionist",
    doctor: "Doctor",
    lab_technician: "Lab Technician",
    pharmacist: "Pharmacist",
    accountant: "Accountant",
    nurse: "Nurse",
    patient: "Patient",
};


// =====================================================
// SIDEBAR
// =====================================================

const Sidebar = ({ onNavigate }) => {

    const {
        user,
        logout,
    } = useAuth();

    const navigate = useNavigate();


    // =====================================================
    // HOSPITAL SETTINGS
    // =====================================================

    const [hospitalName, setHospitalName] =
        useState(DEFAULT_HOSPITAL_NAME);

    const [hospitalLogo, setHospitalLogo] =
        useState(DEFAULT_LOGO);

    const [logoError, setLogoError] =
        useState(false);


    // =====================================================
    // LOAD HOSPITAL SETTINGS
    // =====================================================

    const loadHospitalSettings = async () => {

        let localSettings = null;

        // -------------------------------------------------
        // LOCAL STORAGE FIRST
        // -------------------------------------------------

        try {

            const storedSettings =
                localStorage.getItem("hmsSettings");

            if (storedSettings) {

                localSettings =
                    JSON.parse(storedSettings);

                if (
                    localSettings?.hospitalName &&
                    String(
                        localSettings.hospitalName
                    ).trim()
                ) {

                    setHospitalName(
                        String(
                            localSettings.hospitalName
                        ).trim()
                    );
                }

                if (
                    localSettings?.logo &&
                    String(
                        localSettings.logo
                    ).trim()
                ) {

                    setHospitalLogo(
                        String(
                            localSettings.logo
                        ).trim()
                    );

                    setLogoError(false);
                }
            }

        } catch (error) {

            console.warn(
                "HMS settings localStorage error:",
                error
            );
        }


        // -------------------------------------------------
        // DATABASE / API
        // -------------------------------------------------

        try {

            const token =
                localStorage.getItem("hms_token");

            const response =
                await fetch(
                    `${API_BASE}/settings`,
                    {
                        method: "GET",

                        headers: {
                            "Content-Type":
                                "application/json",

                            ...(token
                                ? {
                                    Authorization:
                                        `Bearer ${token}`,
                                }
                                : {}),
                        },
                    }
                );


            if (!response.ok) {
                throw new Error(
                    `Settings API failed: ${response.status}`
                );
            }


            const result =
                await response.json();


            if (
                result?.success &&
                result?.data
            ) {

                const settings =
                    result.data;


                // -----------------------------------------
                // HOSPITAL NAME
                // -----------------------------------------

                const dbName =
                    typeof settings.hospitalName ===
                        "string" &&
                        settings.hospitalName.trim()
                        ? settings.hospitalName.trim()
                        : DEFAULT_HOSPITAL_NAME;


                setHospitalName(dbName);


                // -----------------------------------------
                // HOSPITAL LOGO
                // -----------------------------------------

                const dbLogo =
                    typeof settings.logo ===
                        "string" &&
                        settings.logo.trim()
                        ? settings.logo.trim()
                        : DEFAULT_LOGO;


                setHospitalLogo(dbLogo);

                setLogoError(false);


                // -----------------------------------------
                // UPDATE CACHE
                // -----------------------------------------

                try {

                    localStorage.setItem(
                        "hmsSettings",
                        JSON.stringify(settings)
                    );

                } catch (storageError) {

                    console.warn(
                        "Unable to cache HMS settings:",
                        storageError
                    );
                }
            }

        } catch (error) {

            console.warn(
                "Unable to load HMS settings from API:",
                error
            );

            // ---------------------------------------------
            // LOCAL FALLBACK
            // ---------------------------------------------

            if (localSettings) {

                const fallbackName =
                    localSettings?.hospitalName;

                const fallbackLogo =
                    localSettings?.logo;


                setHospitalName(
                    typeof fallbackName ===
                        "string" &&
                        fallbackName.trim()
                        ? fallbackName.trim()
                        : DEFAULT_HOSPITAL_NAME
                );


                setHospitalLogo(
                    typeof fallbackLogo ===
                        "string" &&
                        fallbackLogo.trim()
                        ? fallbackLogo.trim()
                        : DEFAULT_LOGO
                );
            }
        }
    };


    // =====================================================
    // INITIAL SETTINGS
    // =====================================================

    useEffect(() => {

        loadHospitalSettings();

    }, []);


    // =====================================================
    // SETTINGS UPDATE LISTENER
    // =====================================================

    useEffect(() => {

        const handleSettingsUpdate = () => {
            loadHospitalSettings();
        };


        window.addEventListener(
            "storage",
            handleSettingsUpdate
        );


        window.addEventListener(
            "hmsSettingsUpdated",
            handleSettingsUpdate
        );


        return () => {

            window.removeEventListener(
                "storage",
                handleSettingsUpdate
            );

            window.removeEventListener(
                "hmsSettingsUpdated",
                handleSettingsUpdate
            );
        };

    }, []);


    // =====================================================
    // CURRENT USER ROLE
    // =====================================================

    const currentRole =
        VALID_ROLES.includes(user?.role)
            ? user.role
            : null;


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        if (onNavigate) {
            onNavigate();
        }

        logout();

        navigate(
            "/",
            {
                replace: true,
            }
        );
    };


    // =====================================================
    // ROLE-BASED MENU
    //
    // MATRIX
    //
    // Super Admin
    // ALL
    //
    // Hospital Admin
    // ALL except User Management
    //
    // Receptionist
    // Dashboard, Patients, Appointments
    //
    // Doctor
    // Dashboard, Patients, Appointments,
    // Departments, Laboratory, Reports
    //
    // Lab Technician
    // Dashboard, Laboratory, Reports
    //
    // Pharmacist
    // Dashboard, Pharmacy, Billing, Reports
    //
    // Accountant
    // Dashboard, Pharmacy, Billing, Reports
    //
    // Nurse
    // Dashboard, Patients, Appointments, Departments
    //
    // Patient
    // Dashboard, Appointments
    // =====================================================

    const menuItems = [

        // -------------------------------------------------
        // DASHBOARD
        // ALL 9 ROLES
        // -------------------------------------------------

        {
            label: "Dashboard",
            path: "/dashboard",
            icon: <FaChartBar />,
            roles: [
                "super_admin",
                "hospital_admin",
                "receptionist",
                "doctor",
                "lab_technician",
                "pharmacist",
                "accountant",
                "nurse",
                "patient",
            ],
        },


        // -------------------------------------------------
        // PATIENTS
        // Super Admin
        // Hospital Admin
        // Receptionist
        // Doctor
        // Nurse
        // -------------------------------------------------

        {
            label: "Patients",
            path: "/patients",
            icon: <FaUsers />,
            roles: [
                "super_admin",
                "hospital_admin",
                "receptionist",
                "doctor",
                "nurse",
            ],
        },


        // -------------------------------------------------
        // DOCTORS
        // Super Admin
        // Hospital Admin
        // -------------------------------------------------

        {
            label: "Doctors",
            path: "/doctors",
            icon: <FaUserMd />,
            roles: [
                "super_admin",
                "hospital_admin",
            ],
        },


        // -------------------------------------------------
        // APPOINTMENTS
        // Super Admin
        // Hospital Admin
        // Receptionist
        // Doctor
        // Nurse
        // Patient
        // -------------------------------------------------

        {
            label: "Appointments",
            path: "/appointments",
            icon: <FaCalendarCheck />,
            roles: [
                "super_admin",
                "hospital_admin",
                "receptionist",
                "doctor",
                "nurse",
                "patient",
            ],
        },


        // -------------------------------------------------
        // DEPARTMENTS
        // Super Admin
        // Hospital Admin
        // Doctor
        // Nurse
        // -------------------------------------------------

        {
            label: "Departments",
            path: "/departments",
            icon: <FaHospital />,
            roles: [
                "super_admin",
                "hospital_admin",
                "doctor",
                "nurse",
            ],
        },


        // -------------------------------------------------
        // LABORATORY
        // Super Admin
        // Hospital Admin
        // Doctor
        // Lab Technician
        // -------------------------------------------------

        {
            label: "Laboratory",
            path: "/laboratory",
            icon: <FaFlask />,
            roles: [
                "super_admin",
                "hospital_admin",
                "doctor",
                "lab_technician",
            ],
        },


        // -------------------------------------------------
        // PHARMACY
        // Super Admin
        // Hospital Admin
        // Pharmacist
        // Accountant
        // -------------------------------------------------

        {
            label: "Pharmacy",
            path: "/pharmacy",
            icon: <FaPills />,
            roles: [
                "super_admin",
                "hospital_admin",
                "pharmacist",
                "accountant",
            ],
        },


        // -------------------------------------------------
        // BILLING
        // Super Admin
        // Hospital Admin
        // Pharmacist
        // Accountant
        // -------------------------------------------------

        {
            label: "Billing",
            path: "/billing",
            icon: <FaCreditCard />,
            roles: [
                "super_admin",
                "hospital_admin",
                "pharmacist",
                "accountant",
            ],
        },


        // -------------------------------------------------
        // REPORTS
        // Super Admin
        // Hospital Admin
        // Doctor
        // Lab Technician
        // Pharmacist
        // Accountant
        // -------------------------------------------------

        {
            label: "Reports",
            path: "/reports",
            icon: <FaFileAlt />,
            roles: [
                "super_admin",
                "hospital_admin",
                "doctor",
                "lab_technician",
                "pharmacist",
                "accountant",
            ],
        },


        // -------------------------------------------------
        // SETTINGS
        // Super Admin
        // Hospital Admin
        // -------------------------------------------------

        {
            label: "Settings",
            path: "/settings",
            icon: <FaCog />,
            roles: [
                "super_admin",
                "hospital_admin",
            ],
        },


        // -------------------------------------------------
        // USER MANAGEMENT
        // ONLY SUPER ADMIN
        // -------------------------------------------------

        {
            label: "User Management",
            path: "/users",
            icon: <FaUserShield />,
            roles: [
                "super_admin",
            ],
        },

    ];


    // =====================================================
    // FILTER MENU BY ROLE
    // =====================================================

    const visibleMenuItems =
        menuItems.filter(
            (item) =>
                currentRole &&
                item.roles.includes(currentRole)
        );


    // =====================================================
    // NAVIGATION
    // =====================================================

    const handleNavigation = () => {

        if (onNavigate) {
            onNavigate();
        }
    };


    // =====================================================
    // USER NAME
    // =====================================================

    const userName =
        user?.name ||
        "HMS User";


    // =====================================================
    // USER ROLE
    // =====================================================

    const userRole =
        ROLE_NAMES[currentRole] ||
        "User";


    // =====================================================
    // LOGO ERROR
    // =====================================================

    const handleLogoError = () => {

        setLogoError(true);

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <aside className="sidebar">

            {/* =================================================
                HOSPITAL BRAND
            ================================================= */}

            <div className="sidebar-logo">

                <div className="logo-icon">

                    {!logoError && hospitalLogo ? (

                        <img
                            src={hospitalLogo}
                            alt={`${hospitalName} Logo`}
                            className="sidebar-hospital-logo"
                            onError={handleLogoError}
                        />

                    ) : (

                        <span className="logo-fallback">
                            🏥
                        </span>

                    )}

                </div>


                <div className="sidebar-logo-content">

                    <h2
                        title={hospitalName}
                    >
                        {hospitalName}
                    </h2>

                    <span>
                        Hospital System
                    </span>

                </div>

            </div>


            {/* =================================================
                USER PROFILE
            ================================================= */}

            <div className="sidebar-user">

                <div className="sidebar-user-avatar">

                    {userName
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}

                </div>


                <div className="sidebar-user-info">

                    <strong>
                        {userName}
                    </strong>

                    <span>
                        {userRole}
                    </span>

                </div>

            </div>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
                className="sidebar-nav"
                aria-label="Main navigation"
            >

                {visibleMenuItems.map(
                    (item) => (

                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive
                                    ? "sidebar-link active"
                                    : "sidebar-link"
                            }
                            onClick={handleNavigation}
                        >

                            <span className="sidebar-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-link-text">
                                {item.label}
                            </span>

                        </NavLink>

                    )
                )}

            </nav>


            {/* =================================================
                LOGOUT
            ================================================= */}

            <div className="sidebar-bottom">

                <button
                    type="button"
                    className="btn-3d btn-logout"
                    onClick={handleLogout}
                    title="Logout"
                >

                    <FaSignOutAlt
                        className="sidebar-icon btn-icon"
                    />

                    <span>
                        Logout
                    </span>

                </button>

            </div>

        </aside>
    );
};


export default Sidebar;