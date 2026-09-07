import React, { useState } from "react";

import {
    Outlet,
} from "react-router-dom";

import Sidebar from "../sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";

import {
    FaBars,
    FaTimes,
} from "react-icons/fa";

import "./Layout.css";


// =====================================================
// HMS LAYOUT
// =====================================================

const Layout = () => {

    const { role } = useAuth();
    const isSuperAdmin = role === "super_admin";

    const [
        isSidebarOpen,
        setIsSidebarOpen,
    ] = useState(false);


    // =====================================================
    // TOGGLE SIDEBAR
    // =====================================================

    const toggleSidebar = () => {

        setIsSidebarOpen(
            (previous) => !previous
        );
    };


    // =====================================================
    // CLOSE SIDEBAR
    // =====================================================

    const closeSidebar = () => {

        setIsSidebarOpen(false);
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            className={`layout-container ${isSuperAdmin ? "" : "staff-layout"}`}
        >

            {/* =================================================
                MOBILE HAMBURGER
            ================================================= */}

            {isSuperAdmin && (
                <button
                type="button"
                className="hamburger-menu"
                onClick={toggleSidebar}
                aria-label={
                    isSidebarOpen
                        ? "Close sidebar"
                        : "Open sidebar"
                }
                aria-expanded={
                    isSidebarOpen
                }
            >

                {isSidebarOpen ? (
                    <FaTimes />
                ) : (
                    <FaBars />
                )}

                </button>
            )}


            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {isSuperAdmin && isSidebarOpen && (

                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />

            )}


            {/* =================================================
                SIDEBAR
            ================================================= */}

            {isSuperAdmin && (
                <div
                className={
                    `sidebar-wrapper ${isSidebarOpen
                        ? "open"
                        : ""
                    }`
                }
            >

                <Sidebar
                    onNavigate={closeSidebar}
                />

                </div>
            )}


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="main-content">

                {/* 
                    IMPORTANT:
                    Nested React Router pages such as:

                    /dashboard
                    /patients
                    /doctors
                    /appointments

                    render here through Outlet.
                */}

                <Outlet />

            </main>

        </div>
    );
};


export default Layout;