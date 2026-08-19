import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    FaSignOutAlt, FaChartBar, FaUsers, FaUserMd,
    FaCalendarCheck, FaHospital, FaPills, FaFlask, FaCreditCard
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { label: "Dashboard", path: "/dashboard", icon: <FaChartBar /> },
        { label: "Patients", path: "/patients", icon: <FaUsers /> },
        { label: "Doctors", path: "/doctors", icon: <FaUserMd /> },
        { label: "Appointments", path: "/appointments", icon: <FaCalendarCheck /> },
        { label: "Departments", path: "/departments", icon: <FaHospital /> },
        { label: "Pharmacy", path: "/pharmacy", icon: <FaPills /> },
        { label: "Laboratory", path: "/laboratory", icon: <FaFlask /> },
        { label: "Billing", path: "/billing", icon: <FaCreditCard /> },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🏥</div>
                <div><h2>HMS</h2><span>Hospital System</span></div>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                        <span className="sidebar-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-bottom">
                {/* 3D रेड Logout बटन */}
                <button className="btn-3d btn-logout" onClick={logout}>
                    <FaSignOutAlt className="sidebar-icon btn-icon" /> Logout
                </button>
            </div>
        </aside>
    );
};
export default Sidebar;