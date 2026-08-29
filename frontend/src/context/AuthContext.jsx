import {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";

import { loginUser } from "../services/auth.service";


// =====================================================
// AUTH CONTEXT
// =====================================================

const AuthContext = createContext(null);


// =====================================================
// 9 HMS ROLES
// IMPORTANT:
// These values MUST match backend user.role exactly.
// =====================================================

export const HMS_ROLES = {
    SUPER_ADMIN: "super_admin",
    HOSPITAL_ADMIN: "hospital_admin",
    RECEPTIONIST: "receptionist",
    DOCTOR: "doctor",
    LAB_TECHNICIAN: "lab_technician",
    PHARMACIST: "pharmacist",
    ACCOUNTANT: "accountant",
    NURSE: "nurse",
    PATIENT: "patient",
};


// =====================================================
// ALL ROLES
// =====================================================

export const ALL_ROLES = [
    HMS_ROLES.SUPER_ADMIN,
    HMS_ROLES.HOSPITAL_ADMIN,
    HMS_ROLES.RECEPTIONIST,
    HMS_ROLES.DOCTOR,
    HMS_ROLES.LAB_TECHNICIAN,
    HMS_ROLES.PHARMACIST,
    HMS_ROLES.ACCOUNTANT,
    HMS_ROLES.NURSE,
    HMS_ROLES.PATIENT,
];


// =====================================================
// PERMISSIONS
//
// Matrix:
//
// super_admin
//     Dashboard      Patients       Doctors
//     Appointments   Departments    Laboratory
//     Pharmacy       Billing        Reports
//     Settings       User Management
//
// hospital_admin
//     Dashboard      Patients       Doctors
//     Appointments   Departments    Laboratory
//     Pharmacy       Billing        Reports
//     Settings
//
// receptionist
//     Dashboard      Patients       Appointments
//
// doctor
//     Dashboard      Patients       Appointments
//     Departments    Laboratory     Reports
//
// lab_technician
//     Dashboard      Laboratory     Reports
//
// pharmacist
//     Dashboard      Pharmacy       Billing
//     Reports
//
// accountant
//     Dashboard      Pharmacy       Billing
//     Reports
//
// nurse
//     Dashboard      Patients       Appointments
//     Departments
//
// patient
//     Dashboard      Appointments
// =====================================================

export const PERMISSIONS = {

    dashboard: ALL_ROLES,

    patients: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.RECEPTIONIST,
        HMS_ROLES.DOCTOR,
        HMS_ROLES.NURSE,
    ],

    doctors: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
    ],

    appointments: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.RECEPTIONIST,
        HMS_ROLES.DOCTOR,
        HMS_ROLES.NURSE,
        HMS_ROLES.PATIENT,
    ],

    departments: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.DOCTOR,
        HMS_ROLES.NURSE,
    ],

    laboratory: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.DOCTOR,
        HMS_ROLES.LAB_TECHNICIAN,
    ],

    pharmacy: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.PHARMACIST,
        HMS_ROLES.ACCOUNTANT,
    ],

    billing: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.PHARMACIST,
        HMS_ROLES.ACCOUNTANT,
    ],

    reports: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
        HMS_ROLES.DOCTOR,
        HMS_ROLES.LAB_TECHNICIAN,
        HMS_ROLES.PHARMACIST,
        HMS_ROLES.ACCOUNTANT,
    ],

    settings: [
        HMS_ROLES.SUPER_ADMIN,
        HMS_ROLES.HOSPITAL_ADMIN,
    ],

    users: [
        HMS_ROLES.SUPER_ADMIN,
    ],
};


// =====================================================
// ROLE LABELS
// =====================================================

export const ROLE_LABELS = {

    [HMS_ROLES.SUPER_ADMIN]:
        "Super Admin",

    [HMS_ROLES.HOSPITAL_ADMIN]:
        "Hospital Admin",

    [HMS_ROLES.RECEPTIONIST]:
        "Receptionist",

    [HMS_ROLES.DOCTOR]:
        "Doctor",

    [HMS_ROLES.LAB_TECHNICIAN]:
        "Lab Technician",

    [HMS_ROLES.PHARMACIST]:
        "Pharmacist",

    [HMS_ROLES.ACCOUNTANT]:
        "Accountant",

    [HMS_ROLES.NURSE]:
        "Nurse",

    [HMS_ROLES.PATIENT]:
        "Patient",
};


// =====================================================
// ROLE FORMATTER
// =====================================================

export const getRoleLabel = (role) => {

    if (!role) {
        return "Unknown Role";
    }

    return (
        ROLE_LABELS[role] ||
        String(role)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                (char) => char.toUpperCase()
            )
    );
};


// =====================================================
// VALIDATE ROLE
// =====================================================

export const isValidRole = (role) => {

    return ALL_ROLES.includes(role);
};


// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
    children,
}) => {

    // =================================================
    // LOAD USER
    // =================================================

    const [user, setUser] = useState(() => {

        try {

            const token =
                localStorage.getItem(
                    "hms_token"
                );

            const savedUser =
                localStorage.getItem(
                    "hms_user"
                );

            if (
                !token ||
                !savedUser
            ) {
                return null;
            }

            const parsedUser =
                JSON.parse(savedUser);

            // -----------------------------------------
            // Invalid stored user
            // -----------------------------------------

            if (
                !parsedUser ||
                !parsedUser.id ||
                !parsedUser.role ||
                !isValidRole(parsedUser.role)
            ) {

                localStorage.removeItem(
                    "hms_user"
                );

                localStorage.removeItem(
                    "hms_token"
                );

                return null;
            }

            return parsedUser;

        } catch (error) {

            console.error(
                "AUTH RESTORE ERROR:",
                error
            );

            localStorage.removeItem(
                "hms_user"
            );

            localStorage.removeItem(
                "hms_token"
            );

            return null;
        }
    });


    // =================================================
    // LOGIN
    // =================================================

    const login = async (
        email,
        password
    ) => {

        const data =
            await loginUser({
                email:
                    String(email || "")
                        .trim()
                        .toLowerCase(),

                password,
            });


        // ---------------------------------------------
        // Validate response
        // ---------------------------------------------

        if (
            !data ||
            !data.success ||
            !data.token ||
            !data.user
        ) {

            throw new Error(
                data?.message ||
                "Login failed"
            );
        }


        // ---------------------------------------------
        // Validate role
        // ---------------------------------------------

        const role =
            data.user.role;


        if (!isValidRole(role)) {

            console.error(
                "INVALID ROLE FROM BACKEND:",
                role
            );

            throw new Error(
                `Invalid user role: ${role || "missing"}`
            );
        }


        // ---------------------------------------------
        // Normalize user
        // ---------------------------------------------

        const normalizedUser = {

            ...data.user,

            role,

            name:
                data.user.name ||
                "HMS User",

            email:
                data.user.email ||
                email,
        };


        // ---------------------------------------------
        // Save token
        // ---------------------------------------------

        localStorage.setItem(
            "hms_token",
            data.token
        );


        // ---------------------------------------------
        // Save user
        // ---------------------------------------------

        localStorage.setItem(
            "hms_user",
            JSON.stringify(
                normalizedUser
            )
        );


        // ---------------------------------------------
        // Update state
        // ---------------------------------------------

        setUser(
            normalizedUser
        );


        return {
            ...data,

            user:
                normalizedUser,
        };
    };


    // =================================================
    // LOGOUT
    // =================================================

    const logout = () => {

        localStorage.removeItem(
            "hms_token"
        );

        localStorage.removeItem(
            "hms_user"
        );

        setUser(null);
    };


    // =================================================
    // CURRENT ROLE
    // =================================================

    const role =
        user?.role || null;


    // =================================================
    // HAS ROLE
    // =================================================

    const hasRole = (
        requiredRole
    ) => {

        if (!role) {
            return false;
        }

        // ---------------------------------------------
        // Array of roles
        // ---------------------------------------------

        if (
            Array.isArray(
                requiredRole
            )
        ) {

            return requiredRole.includes(
                role
            );
        }

        // ---------------------------------------------
        // Single role
        // ---------------------------------------------

        return role === requiredRole;
    };


    // =================================================
    // HAS ANY ROLE
    // =================================================

    const hasAnyRole = (
        requiredRoles = []
    ) => {

        if (!role) {
            return false;
        }

        if (
            !Array.isArray(
                requiredRoles
            )
        ) {

            return false;
        }

        return requiredRoles.includes(
            role
        );
    };


    // =================================================
    // HAS PERMISSION
    // =================================================

    const hasPermission = (
        permission
    ) => {

        if (!role) {
            return false;
        }

        const allowedRoles =
            PERMISSIONS[
            permission
            ];

        if (
            !Array.isArray(
                allowedRoles
            )
        ) {

            return false;
        }

        return allowedRoles.includes(
            role
        );
    };


    // =================================================
    // GET USER PERMISSIONS
    // =================================================

    const getUserPermissions = () => {

        if (!role) {
            return [];
        }

        return Object.keys(
            PERMISSIONS
        ).filter(
            (permission) =>
                PERMISSIONS[
                    permission
                ].includes(role)
        );
    };


    // =================================================
    // AUTH STATUS
    // =================================================

    const isAuthenticated =
        Boolean(
            user &&
            user.id &&
            user.role &&
            isValidRole(user.role) &&
            localStorage.getItem(
                "hms_token"
            )
        );


    // =================================================
    // CONTEXT VALUE
    // =================================================

    const contextValue =
        useMemo(
            () => ({

                // -------------------------------------
                // User
                // -------------------------------------

                user,

                setUser,

                // -------------------------------------
                // Authentication
                // -------------------------------------

                login,

                logout,

                isAuthenticated,

                // -------------------------------------
                // Role
                // -------------------------------------

                role,

                roleLabel:
                    getRoleLabel(role),

                // -------------------------------------
                // Role helpers
                // -------------------------------------

                hasRole,

                hasAnyRole,

                isValidRole,

                // -------------------------------------
                // Permission helpers
                // -------------------------------------

                hasPermission,

                getUserPermissions,

                // -------------------------------------
                // Constants
                // -------------------------------------

                roles:
                    HMS_ROLES,

                allRoles:
                    ALL_ROLES,

                permissions:
                    PERMISSIONS,

                roleLabels:
                    ROLE_LABELS,

            }),
            [
                user,
                role,
                isAuthenticated,
            ]
        );


    // =================================================
    // PROVIDER
    // =================================================

    return (

        <AuthContext.Provider
            value={
                contextValue
            }
        >

            {children}

        </AuthContext.Provider>
    );
};


// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {

    const context =
        useContext(
            AuthContext
        );


    if (!context) {

        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }


    return context;
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default AuthContext;