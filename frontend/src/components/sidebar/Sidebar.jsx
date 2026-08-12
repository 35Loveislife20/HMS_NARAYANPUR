import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        {
            label: "Dashboard",
            path: "/dashboard",
            icon: "📊",
        },
        {
            label: "Patients",
            path: "/patients",
            icon: "👨‍⚕️",
        },
        {
            label: "Doctors",
            path: "/doctors",
            icon: "🩺",
        },
        {
            label: "Appointments",
            path: "/appointments",
            icon: "📅",
        },
        {
            label: "Departments",
            path: "/departments",
            icon: "🏥",
        },
        {
            label: "Pharmacy",
            path: "/pharmacy",
            icon: "💊",
        },
        {
            label: "Laboratory",
            path: "/laboratory",
            icon: "🧪",
        },
        {
            label: "Billing",
            path: "/billing",
            icon: "💳",
        },
    ];

    return (
        <aside className="sidebar">

            <div className="sidebar-logo">
                <div className="logo-icon">🏥</div>

                <div>
                    <h2>HMS</h2>
                    <span>Hospital System</span>
                </div>
            </div>

            <nav className="sidebar-nav">

                <p className="menu-title">
                    MAIN MENU
                </p>

                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                    >
                        <span className="sidebar-icon">
                            {item.icon}
                        </span>

                        <span>{item.label}</span>
                    </NavLink>
                ))}

            </nav>

            <div className="sidebar-bottom">

                <button
                    className="sidebar-link logout-btn"
                    onClick={logout}
                >
                    <span className="sidebar-icon">🚪</span>
                    Logout
                </button>

            </div>

        </aside>
    );
};

export default Sidebar;