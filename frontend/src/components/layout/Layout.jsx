import { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Layout.css";

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="layout-container">
            {/* Mobile Only Hamburger Button */}
            <button className="hamburger-menu" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Sidebar को क्लास dynamically दें */}
            <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <Sidebar />
            </div>

            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

export default Layout;