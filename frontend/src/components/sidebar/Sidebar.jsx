import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
    FaBars,
    FaTimes,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    /* =================================================
       CLOSE SIDEBAR WHEN ROUTE CHANGES
    ================================================= */

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    /* =================================================
       CLOSE SIDEBAR ON ESC
    ================================================= */

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsMobileOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    /* =================================================
       PREVENT BODY SCROLL WHEN MOBILE SIDEBAR OPEN
    ================================================= */

    useEffect(() => {
        if (isMobileOpen) {
            document.body.classList.add("sidebar-mobile-open");
        } else {
            document.body.classList.remove("sidebar-mobile-open");
        }

        return () => {
            document.body.classList.remove("sidebar-mobile-open");
        };
    }, [isMobileOpen]);

    /* =================================================
       LOGOUT
    ================================================= */

    const handleLogout = () => {
        setIsMobileOpen(false);

        logout();

        navigate("/", {
            replace: true,
        });
    };

    /* =================================================
       MENU ITEMS
    ================================================= */

    const menuItems = [
        {
            label: "Dashboard",
            path: "/dashboard",
            icon: <FaChartBar />,
        },
        {
            label: "Patients",
            path: "/patients",
            icon: <FaUsers />,
        },
        {
            label: "Doctors",
            path: "/doctors",
            icon: <FaUserMd />,
        },
        {
            label: "Appointments",
            path: "/appointments",
            icon: <FaCalendarCheck />,
        },
        {
            label: "Departments",
            path: "/departments",
            icon: <FaHospital />,
        },
        {
            label: "Pharmacy",
            path: "/pharmacy",
            icon: <FaPills />,
        },
        {
            label: "Laboratory",
            path: "/laboratory",
            icon: <FaFlask />,
        },
        {
            label: "Billing",
            path: "/billing",
            icon: <FaCreditCard />,
        },
    ];

    /* =================================================
       MOBILE MENU TOGGLE
    ================================================= */

    const toggleMobileSidebar = () => {
        setIsMobileOpen((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        setIsMobileOpen(false);
    };

    return (
        <>
            {/* =================================================
                MOBILE HAMBURGER
            ================================================= */}

            <button
                type="button"
                className="mobile-sidebar-toggle"
                onClick={toggleMobileSidebar}
                aria-label={
                    isMobileOpen
                        ? "Close navigation menu"
                        : "Open navigation menu"
                }
                aria-expanded={isMobileOpen}
            >
                {isMobileOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {isMobileOpen && (
                <div
                    className="sidebar-mobile-overlay"
                    onClick={closeMobileSidebar}
                    aria-hidden="true"
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`sidebar ${isMobileOpen ? "sidebar-mobile-active" : ""
                    }`}
            >
                {/* =================================================
                    LOGO
                ================================================= */}

                <div className="sidebar-logo">

                    <div className="logo-icon">
                        🏥
                    </div>

                    <div>
                        <h2>HMS</h2>

                        <span>
                            Hospital System
                        </span>
                    </div>

                    {/* MOBILE CLOSE BUTTON */}

                    <button
                        type="button"
                        className="mobile-sidebar-close"
                        onClick={closeMobileSidebar}
                        aria-label="Close sidebar"
                    >
                        <FaTimes />
                    </button>

                </div>

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav className="sidebar-nav">

                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive
                                    ? "sidebar-link active"
                                    : "sidebar-link"
                            }
                            onClick={closeMobileSidebar}
                        >
                            <span className="sidebar-icon">
                                {item.icon}
                            </span>

                            <span className="sidebar-link-text">
                                {item.label}
                            </span>
                        </NavLink>
                    ))}

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
                        <FaSignOutAlt className="sidebar-icon btn-icon" />

                        <span>
                            Logout
                        </span>
                    </button>

                </div>

            </aside>
        </>
    );
};

export default Sidebar;