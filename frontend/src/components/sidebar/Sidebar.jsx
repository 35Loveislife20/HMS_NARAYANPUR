import { NavLink, useNavigate } from "react-router-dom";
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
} from "react-icons/fa";

import "./Sidebar.css";

const Sidebar = ({ onNavigate }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    /* =========================================================
       LOGOUT
    ========================================================= */

    const handleLogout = () => {
        if (onNavigate) {
            onNavigate();
        }

        logout();

        navigate("/", {
            replace: true,
        });
    };

    /* =========================================================
       MENU ITEMS
    ========================================================= */

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

    /* =========================================================
       NAVIGATION CLICK
    ========================================================= */

    const handleNavigation = () => {
        if (onNavigate) {
            onNavigate();
        }
    };

    return (
        <aside className="sidebar">

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
                        onClick={handleNavigation}
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
    );
};

export default Sidebar;