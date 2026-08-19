import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import "./Layout.css";

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Mobile par route change hone par sidebar band karo
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Escape key se sidebar band karo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Body scroll lock jab mobile sidebar open ho
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (
        <div className="layout-root">

            {/* =========================================
                MOBILE TOPBAR
            ========================================= */}
            <div className="mobile-topbar">

                <button
                    className="hamburger-btn"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation menu"
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className="mobile-logo">
                    <span className="mobile-logo-icon">🏥</span>
                    <strong>HMS</strong>
                </div>

            </div>

            {/* =========================================
                OVERLAY (mobile sidebar ke peeche)
            ========================================= */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* =========================================
                SIDEBAR
            ========================================= */}
            <aside className={`layout-sidebar ${sidebarOpen ? "is-open" : ""}`}>

                {/* Mobile close button */}
                <button
                    className="sidebar-close-btn"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation menu"
                >
                    ✕
                </button>

                <Sidebar />

            </aside>

            {/* =========================================
                MAIN CONTENT
            ========================================= */}
            <main className="layout-main">
                {children}
            </main>

        </div>
    );
};

export default Layout;