import React from "react";

import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


// =====================================================
// 9 VALID HMS ROLES
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
// PROTECTED ROUTE
// =====================================================
//
// Usage:
//
// <ProtectedRoute />
//
// OR:
//
// <ProtectedRoute
//     allowedRoles={[
//         "super_admin",
//         "hospital_admin",
//     ]}
// >
//     <Component />
// </ProtectedRoute>
//
// =====================================================

const ProtectedRoute = ({
    children,
    allowedRoles = null,
}) => {

    const {
        user,
        isAuthenticated,
    } = useAuth();

    const location = useLocation();


    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!isAuthenticated || !user) {

        return (
            <Navigate
                to="/"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }


    // =====================================================
    // NORMALIZE ROLE
    // =====================================================

    const userRole =
        typeof user.role === "string"
            ? user.role.trim().toLowerCase()
            : "";


    // =====================================================
    // INVALID ROLE
    // =====================================================

    if (
        !VALID_ROLES.includes(
            userRole
        )
    ) {

        console.error(
            "Invalid HMS user role:",
            user.role
        );

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    // =====================================================
    // ROLE CHECK
    // =====================================================

    if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0
    ) {

        const normalizedAllowedRoles =
            allowedRoles
                .filter(
                    (role) =>
                        typeof role === "string"
                )
                .map(
                    (role) =>
                        role
                            .trim()
                            .toLowerCase()
                );


        const hasPermission =
            normalizedAllowedRoles.includes(
                userRole
            );


        // -------------------------------------------------
        // ACCESS DENIED
        // -------------------------------------------------

        if (!hasPermission) {

            console.warn(
                `HMS access denied: ${userRole}`
            );


            // User stays inside authenticated
            // application but is sent to dashboard.

            return (
                <Navigate
                    to="/dashboard"
                    replace
                    state={{
                        accessDenied: true,
                        attemptedPath:
                            location.pathname,
                    }}
                />
            );
        }
    }


    // =====================================================
    // AUTHORIZED
    // =====================================================

    // When children are supplied, render them.
    //
    // When used as a parent route, render Outlet.

    if (children) {
        return children;
    }


    return <Outlet />;
};


export default ProtectedRoute;