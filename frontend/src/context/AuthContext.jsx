import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    loginUser,
    logoutUser,
    getAuthToken,
    getStoredUser,
} from "../services/auth.service";


/* =========================================================
   HMS ROLES
========================================================= */

export const ROLES = {
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


export const ALL_ROLES = Object.values(ROLES);


/* =========================================================
   ROLE HELPERS
========================================================= */

export const normalizeRole = (role) => {
    if (!role) {
        return "";
    }

    return String(role)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
};


export const isValidRole = (role) => {
    const normalizedRole = normalizeRole(role);

    return ALL_ROLES.includes(normalizedRole);
};


/* =========================================================
   PERMISSIONS
========================================================= */

export const PERMISSIONS = {
    dashboard: ALL_ROLES,

    superAdmin: [
        ROLES.SUPER_ADMIN,
    ],

    hospitalAdmin: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
    ],

    receptionist: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.RECEPTIONIST,
    ],

    doctor: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.DOCTOR,
    ],

    nurse: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.NURSE,
    ],

    lab: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.LAB_TECHNICIAN,
    ],

    pharmacy: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.PHARMACIST,
    ],

    accountant: [
        ROLES.SUPER_ADMIN,
        ROLES.HOSPITAL_ADMIN,
        ROLES.ACCOUNTANT,
    ],

    patient: [
        ROLES.PATIENT,
    ],
};


/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = createContext(null);


/* =========================================================
   AUTH PROVIDER
========================================================= */

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);


    /* =====================================================
       RESTORE AUTHENTICATION
    ===================================================== */

    useEffect(() => {
        try {
            const token = getAuthToken();

            const storedUser =
                getStoredUser();


            if (
                token &&
                storedUser
            ) {
                const rawRole =
                    storedUser.role ||
                    storedUser.user_role ||
                    storedUser.userRole;


                const normalizedRole =
                    normalizeRole(rawRole);


                const normalizedId =
                    storedUser.id ??
                    storedUser.user_id ??
                    storedUser.userId;


                if (
                    normalizedId &&
                    isValidRole(normalizedRole)
                ) {
                    const normalizedUser = {
                        ...storedUser,

                        id: normalizedId,

                        role: normalizedRole,

                        name:
                            storedUser.name ||
                            storedUser.full_name ||
                            storedUser.fullName ||
                            "HMS User",

                        email:
                            storedUser.email ||
                            "",

                        hospital_id:
                            storedUser.hospital_id ??
                            storedUser.hospitalId ??
                            null,

                        hospitalId:
                            storedUser.hospitalId ??
                            storedUser.hospital_id ??
                            null,
                    };


                    setUser(
                        normalizedUser
                    );
                } else {
                    /*
                     * Stored authentication is invalid.
                     */
                    logoutUser();

                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error(
                "HMS authentication restore error:",
                error
            );

            logoutUser();

            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }, []);


    /* =====================================================
       LOGIN
    ===================================================== */

    const login = async (
        email,
        password,
        selectedRole = null,
        hospitalId = null
    ) => {
        const requestedRole =
            normalizeRole(selectedRole);


        /*
         * Send login request through auth.service.js
         */
        const data = await loginUser({
            email,
            password,
            role:
                requestedRole ||
                null,
            hospitalId,
            hospital_id:
                hospitalId,
        });


        /*
         * Support both response formats:
         *
         * FORMAT 1:
         * {
         *   success: true,
         *   token: "...",
         *   user: {...}
         * }
         *
         * FORMAT 2:
         * {
         *   success: true,
         *   data: {
         *      token: "...",
         *      user: {...}
         *   }
         * }
         */

        const responseData =
            data?.data ||
            data;


        const token =
            responseData?.token ||
            data?.token ||
            responseData?.accessToken ||
            data?.accessToken;


        const apiUser =
            responseData?.user ||
            data?.user;


        /* =================================================
           VALIDATE TOKEN
        ================================================= */

        if (!token) {
            throw new Error(
                responseData?.message ||
                data?.message ||
                "Login successful but authentication token was not returned."
            );
        }


        /* =================================================
           VALIDATE USER
        ================================================= */

        if (!apiUser) {
            throw new Error(
                "Login successful but user information was not returned by the server."
            );
        }


        /* =================================================
           NORMALIZE ROLE
        ================================================= */

        const backendRole =
            apiUser.role ||
            apiUser.user_role ||
            apiUser.userRole ||
            requestedRole;


        const normalizedRole =
            normalizeRole(
                backendRole
            );


        if (
            !isValidRole(
                normalizedRole
            )
        ) {
            throw new Error(
                `Invalid user role received from server: ${
                    backendRole ||
                    "unknown"
                }`
            );
        }


        /* =================================================
           NORMALIZE USER ID
        ================================================= */

        const normalizedId =
            apiUser.id ??
            apiUser.user_id ??
            apiUser.userId;


        if (!normalizedId) {
            throw new Error(
                "Login successful but user ID was not returned by the server."
            );
        }


        /* =================================================
           NORMALIZE HOSPITAL
        ================================================= */

        const normalizedHospitalId =
            apiUser.hospital_id ??
            apiUser.hospitalId ??
            hospitalId ??
            null;


        /* =================================================
           CREATE NORMALIZED USER
        ================================================= */

        const normalizedUser = {
            ...apiUser,

            id:
                normalizedId,

            role:
                normalizedRole,

            name:
                apiUser.name ||
                apiUser.full_name ||
                apiUser.fullName ||
                "HMS User",

            email:
                apiUser.email ||
                String(
                    email ||
                    ""
                )
                    .trim()
                    .toLowerCase(),

            hospital_id:
                normalizedHospitalId,

            hospitalId:
                normalizedHospitalId,
        };


        /* =================================================
           SAVE TOKEN
        ================================================= */

        localStorage.setItem(
            "hms_token",
            token
        );


        /* =================================================
           SAVE USER
        ================================================= */

        localStorage.setItem(
            "hms_user",
            JSON.stringify(
                normalizedUser
            )
        );


        /* =================================================
           COMPATIBILITY STORAGE
        ================================================= */

        localStorage.setItem(
            "token",
            token
        );


        localStorage.setItem(
            "authToken",
            token
        );


        localStorage.setItem(
            "hms_role",
            normalizedRole
        );


        localStorage.setItem(
            "role",
            normalizedRole
        );


        if (
            normalizedHospitalId !==
                null &&
            normalizedHospitalId !==
                undefined
        ) {
            localStorage.setItem(
                "hms_hospital_id",
                String(
                    normalizedHospitalId
                )
            );
        }


        /* =================================================
           IMPORTANT AUTH STATE UPDATE
        ================================================= */

        /*
         * THIS IS THE MAIN FIX.
         *
         * Previously Home.jsx only saved localStorage.
         *
         * ProtectedRoute uses AuthContext.user.
         *
         * Therefore user was null immediately after login.
         *
         * Now React AuthContext is updated here.
         */

        setUser(
            normalizedUser
        );


        /* =================================================
           RETURN LOGIN RESULT
        ================================================= */

        return {
            ...data,

            success:
                data?.success !== false,

            token,

            user:
                normalizedUser,
        };
    };


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logout = () => {
        logoutUser();

        setUser(null);
    };


    /* =====================================================
       CURRENT TOKEN
    ===================================================== */

    const token =
        getAuthToken();


    /* =====================================================
       AUTHENTICATION STATUS
    ===================================================== */

    const isAuthenticated =
        Boolean(
            user &&
            user.id &&
            user.role &&
            isValidRole(
                user.role
            ) &&
            token
        );


    /* =====================================================
       CONTEXT VALUE
    ===================================================== */

    const value = useMemo(
        () => ({
            user,

            role:
                user?.role ||
                null,

            token,

            isAuthenticated,

            authLoading,

            login,

            logout,

            setUser,

            isValidRole,

            normalizeRole,

            ROLES,

            ALL_ROLES,

            PERMISSIONS,
        }),
        [
            user,
            token,
            isAuthenticated,
            authLoading,
        ]
    );


    /* =====================================================
       PROVIDER
    ===================================================== */

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
};


/* =========================================================
   useAuth HOOK
========================================================= */

export const useAuth = () => {
    const context =
        useContext(
            AuthContext
        );


    if (!context) {
        throw new Error(
            "useAuth() must be used inside an AuthProvider."
        );
    }


    return context;
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default AuthContext;