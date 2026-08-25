import { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Layout.css";

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="layout-container">

            {/* =========================================
                MOBILE HAMBURGER
            ========================================= */}
            <button
                type="button"
                className="hamburger-menu"
                onClick={toggleSidebar}
                aria-label={
                    isSidebarOpen
                        ? "Close sidebar"
                        : "Open sidebar"
                }
            >
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* =========================================
                MOBILE OVERLAY
            ========================================= */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            {/* =========================================
                SIDEBAR
            ========================================= */}
            <div
                className={`sidebar-wrapper ${isSidebarOpen ? "open" : ""
                    }`}
            >
                <Sidebar onNavigate={closeSidebar} />
            </div>

            {/* =========================================
                MAIN CONTENT
            ========================================= */}
            <main className="main-content">
                {children}
            </main>

        </div>
    );
};

export default Layout;