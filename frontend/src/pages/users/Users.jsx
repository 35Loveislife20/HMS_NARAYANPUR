import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaSyncAlt,
    FaPlus,
    FaSearch,
    FaTimes,
    FaUser,
    FaUserShield,
    FaUserMd,
    FaUserNurse,
    FaUserTie,
    FaFlask,
    FaPills,
    FaCalculator,
    FaHospital,
    FaEnvelope,
    FaPhone,
    FaIdBadge,
    FaEdit,
    FaTrash,
    FaEye,
    FaCheckCircle,
    FaTimesCircle,
    FaSave,
    FaExclamationTriangle,
    FaUsers,
    FaUserCheck,
    FaUserTimes,
    FaChevronDown,
} from "react-icons/fa";

import "./Users.css";


// =====================================================
// API CONFIG
// =====================================================

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";


// =====================================================
// ROLE LIST
// =====================================================

const ROLES = [
    {
        value: "super_admin",
        label: "Super Admin",
        shortLabel: "Super Admin",
    },
    {
        value: "hospital_admin",
        label: "Hospital Admin",
        shortLabel: "Hospital Admin",
    },
    {
        value: "admin",
        label: "Admin",
        shortLabel: "Admin",
    },
    {
        value: "doctor",
        label: "Doctor",
        shortLabel: "Doctor",
    },
    {
        value: "nurse",
        label: "Nurse",
        shortLabel: "Nurse",
    },
    {
        value: "receptionist",
        label: "Receptionist",
        shortLabel: "Receptionist",
    },
    {
        value: "pharmacist",
        label: "Pharmacist",
        shortLabel: "Pharmacist",
    },
    {
        value: "lab_technician",
        label: "Lab Technician",
        shortLabel: "Lab Technician",
    },
    {
        value: "accountant",
        label: "Accountant",
        shortLabel: "Accountant",
    },
    {
        value: "patient",
        label: "Patient",
        shortLabel: "Patient",
    },
];


// =====================================================
// EMPTY FORM
// =====================================================

const EMPTY_FORM = {
    name: "",
    email: "",
    phone: "",
    role: "receptionist",
    password: "",
};


// =====================================================
// TOKEN HELPERS
// =====================================================

const getAuthToken = () => {
    const keys = [
        "hms_token",
        "token",
        "authToken",
    ];

    for (const key of keys) {
        const value = localStorage.getItem(key);

        if (value && value.trim()) {
            return value.trim();
        }
    }

    return null;
};


const getAuthHeaders = () => {
    const token = getAuthToken();

    return {
        "Content-Type": "application/json",

        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };
};


// =====================================================
// API ERROR HELPER
// =====================================================

const getApiErrorMessage = async (response) => {
    try {
        const data = await response.json();

        return (
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
    } catch {
        return `Request failed with status ${response.status}`;
    }
};


// =====================================================
// ROLE HELPERS
// =====================================================

const getRoleLabel = (role) => {
    const found = ROLES.find(
        (item) => item.value === role
    );

    if (found) {
        return found.label;
    }

    return role
        ? String(role)
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) =>
                  char.toUpperCase()
              )
        : "Unknown";
};


const getRoleIcon = (role) => {
    switch (role) {
        case "super_admin":
            return FaUserShield;

        case "hospital_admin":
        case "admin":
            return FaHospital;

        case "doctor":
            return FaUserMd;

        case "nurse":
            return FaUserNurse;

        case "receptionist":
            return FaUserTie;

        case "pharmacist":
            return FaPills;

        case "lab_technician":
            return FaFlask;

        case "accountant":
            return FaCalculator;

        case "patient":
            return FaUser;

        default:
            return FaUser;
    }
};


// =====================================================
// NAME INITIALS
// =====================================================

const getInitials = (name) => {
    if (!name) {
        return "U";
    }

    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
};


// =====================================================
// DATE FORMAT
// =====================================================

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};


// =====================================================
// NORMALIZE USER
// =====================================================

const normalizeUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        ...user,

        id:
            user.id !== undefined &&
            user.id !== null
                ? user.id
                : null,

        name: user.name || "",

        email: user.email || "",

        phone: user.phone || "",

        role: user.role || "patient",

        status:
            user.status === "inactive"
                ? "inactive"
                : "active",

        created_at:
            user.created_at ||
            user.createdAt ||
            null,
    };
};


// =====================================================
// COMPONENT
// =====================================================

const Users = () => {
    const navigate = useNavigate();

    // -------------------------------------------------
    // DATA
    // -------------------------------------------------

    const [users, setUsers] = useState([]);

    // -------------------------------------------------
    // UI STATES
    // -------------------------------------------------

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState(null);

    const [statusUpdatingId, setStatusUpdatingId] =
        useState(null);

    // -------------------------------------------------
    // MESSAGES
    // -------------------------------------------------

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    // -------------------------------------------------
    // FILTERS
    // -------------------------------------------------

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    // -------------------------------------------------
    // MODALS
    // -------------------------------------------------

    const [showModal, setShowModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [editingUser, setEditingUser] =
        useState(null);

    const [viewingUser, setViewingUser] =
        useState(null);

    // -------------------------------------------------
    // FORM
    // -------------------------------------------------

    const [form, setForm] =
        useState(EMPTY_FORM);


    // =================================================
    // TOKEN CHECK
    // =================================================

    const requireToken = () => {
        const token = getAuthToken();

        if (!token) {
            setError(
                "Authentication token not found. Please login again."
            );

            return false;
        }

        return true;
    };


    // =================================================
    // FETCH USERS
    // =================================================

    const fetchUsers = async (
        showRefreshLoader = false
    ) => {
        if (!requireToken()) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (showRefreshLoader) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await fetch(
                `${API_BASE}/users`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
            );

            if (
                response.status === 401
            ) {
                throw new Error(
                    "Authentication failed. Please login again."
                );
            }

            if (
                response.status === 403
            ) {
                throw new Error(
                    "You are not authorized to manage users."
                );
            }

            if (!response.ok) {
                const message =
                    await getApiErrorMessage(
                        response
                    );

                throw new Error(message);
            }

            const data =
                await response.json();

            const receivedUsers =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.users)
                    ? data.users
                    : Array.isArray(data?.data)
                    ? data.data
                    : [];

            setUsers(
                receivedUsers
                    .map(normalizeUser)
                    .filter(Boolean)
            );
        } catch (err) {
            console.error(
                "FETCH USERS ERROR:",
                err
            );

            setUsers([]);

            setError(
                err?.message ||
                    "Unable to fetch users"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        fetchUsers();
    }, []);


    // =================================================
    // AUTO CLEAR SUCCESS
    // =================================================

    useEffect(() => {
        if (!success) {
            return;
        }

        const timer =
            setTimeout(() => {
                setSuccess("");
            }, 3500);

        return () =>
            clearTimeout(timer);
    }, [success]);


    // =================================================
    // REFRESH
    // =================================================

    const handleRefresh = () => {
        fetchUsers(true);
    };


    // =================================================
    // FILTERED USERS
    // =================================================

    const filteredUsers = useMemo(() => {
        const query =
            search
                .trim()
                .toLowerCase();

        return [...users]
            .filter((user) => {
                if (!query) {
                    return true;
                }

                const searchable = [
                    user.name,
                    user.email,
                    user.phone,
                    user.role,
                    getRoleLabel(user.role),
                    String(user.id),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    query
                );
            })
            .filter((user) => {
                if (!roleFilter) {
                    return true;
                }

                return (
                    user.role ===
                    roleFilter
                );
            })
            .filter((user) => {
                if (!statusFilter) {
                    return true;
                }

                return (
                    user.status ===
                    statusFilter
                );
            })
            .sort((a, b) =>
                String(a.name).localeCompare(
                    String(b.name)
                )
            );
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
    ]);


    // =================================================
    // STATISTICS
    // =================================================

    const stats = useMemo(() => {
        const totalUsers =
            users.length;

        const activeUsers =
            users.filter(
                (user) =>
                    user.status ===
                    "active"
            ).length;

        const inactiveUsers =
            users.filter(
                (user) =>
                    user.status ===
                    "inactive"
            ).length;

        const administrators =
            users.filter((user) =>
                [
                    "admin",
                    "super_admin",
                    "hospital_admin",
                ].includes(user.role)
            ).length;

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            administrators,
        };
    }, [users]);


    // =================================================
    // FORM HANDLERS
    // =================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // =================================================
    // OPEN ADD MODAL
    // =================================================

    const openAddModal = () => {
        setEditingUser(null);

        setForm({
            ...EMPTY_FORM,
        });

        setError("");

        setShowModal(true);
    };


    // =================================================
    // OPEN EDIT MODAL
    // =================================================

    const openEditModal = (user) => {
        setEditingUser(user);

        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "receptionist",
            password: "",
        });

        setError("");

        setShowModal(true);
    };


    // =================================================
    // CLOSE FORM MODAL
    // =================================================

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);

        setEditingUser(null);

        setForm({
            ...EMPTY_FORM,
        });

        setError("");
    };


    // =================================================
    // VIEW USER
    // =================================================

    const openViewModal = (user) => {
        setViewingUser(user);

        setShowViewModal(true);
    };


    // =================================================
    // CLOSE VIEW MODAL
    // =================================================

    const closeViewModal = () => {
        setShowViewModal(false);
        setViewingUser(null);
    };


    // =================================================
    // SUBMIT USER
    // =================================================

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (!requireToken()) {
            return;
        }

        setError("");
        setSuccess("");

        const name =
            form.name.trim();

        const email =
            form.email.trim().toLowerCase();

        const phone =
            form.phone.trim();

        const password =
            form.password.trim();

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!name) {
            setError(
                "Name is required."
            );

            return;
        }

        if (!email) {
            setError(
                "Email is required."
            );

            return;
        }

        if (!roleFilter && !form.role) {
            setError(
                "Role is required."
            );

            return;
        }

        if (!editingUser && !password) {
            setError(
                "Password is required for a new user."
            );

            return;
        }

        if (
            !editingUser &&
            password.length < 6
        ) {
            setError(
                "Password must be at least 6 characters."
            );

            return;
        }

        if (
            editingUser &&
            password &&
            password.length < 6
        ) {
            setError(
                "Password must be at least 6 characters."
            );

            return;
        }

        setSaving(true);

        try {
            const payload = {
                name,
                email,
                phone: phone || null,
                role: form.role,
            };

            if (password) {
                payload.password =
                    password;
            }

            const url = editingUser
                ? `${API_BASE}/users/${editingUser.id}`
                : `${API_BASE}/users`;

            const method = editingUser
                ? "PUT"
                : "POST";

            const response =
                await fetch(url, {
                    method,
                    headers:
                        getAuthHeaders(),
                    body: JSON.stringify(
                        payload
                    ),
                });

            if (
                response.status === 401
            ) {
                throw new Error(
                    "Authentication failed. Please login again."
                );
            }

            if (
                response.status === 403
            ) {
                throw new Error(
                    "You are not authorized to perform this action."
                );
            }

            if (!response.ok) {
                const message =
                    await getApiErrorMessage(
                        response
                    );

                throw new Error(message);
            }

            const data =
                await response.json();

            const returnedUser =
                normalizeUser(
                    data?.user
                );

            if (editingUser) {
                if (returnedUser) {
                    setUsers(
                        (previous) =>
                            previous.map(
                                (user) =>
                                    Number(
                                        user.id
                                    ) ===
                                    Number(
                                        returnedUser.id
                                    )
                                        ? returnedUser
                                        : user
                            )
                    );
                } else {
                    await fetchUsers();
                }

                setSuccess(
                    "User updated successfully."
                );
            } else {
                if (returnedUser) {
                    setUsers(
                        (previous) => [
                            ...previous,
                            returnedUser,
                        ]
                    );
                } else {
                    await fetchUsers();
                }

                setSuccess(
                    "User created successfully."
                );
            }

            setShowModal(false);

            setEditingUser(null);

            setForm({
                ...EMPTY_FORM,
            });
        } catch (err) {
            console.error(
                "SAVE USER ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to save user"
            );
        } finally {
            setSaving(false);
        }
    };


    // =================================================
    // DELETE USER
    // =================================================

    const handleDelete = async (
        user
    ) => {
        if (!requireToken()) {
            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${user.name}"?`
            );

        if (!confirmed) {
            return;
        }

        setDeletingId(user.id);

        setError("");
        setSuccess("");

        try {
            const response =
                await fetch(
                    `${API_BASE}/users/${user.id}`,
                    {
                        method: "DELETE",
                        headers:
                            getAuthHeaders(),
                    }
                );

            if (
                response.status === 401
            ) {
                throw new Error(
                    "Authentication failed. Please login again."
                );
            }

            if (
                response.status === 403
            ) {
                throw new Error(
                    "You are not authorized to delete users."
                );
            }

            if (!response.ok) {
                const message =
                    await getApiErrorMessage(
                        response
                    );

                throw new Error(message);
            }

            setUsers(
                (previous) =>
                    previous.filter(
                        (item) =>
                            Number(
                                item.id
                            ) !==
                            Number(
                                user.id
                            )
                    )
            );

            setSuccess(
                "User deleted successfully."
            );
        } catch (err) {
            console.error(
                "DELETE USER ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to delete user"
            );
        } finally {
            setDeletingId(null);
        }
    };


    // =================================================
    // TOGGLE STATUS
    // =================================================

    const handleToggleStatus = async (
        user
    ) => {
        if (!requireToken()) {
            return;
        }

        const newStatus =
            user.status ===
            "active"
                ? "inactive"
                : "active";

        setStatusUpdatingId(
            user.id
        );

        setError("");
        setSuccess("");

        try {
            const response =
                await fetch(
                    `${API_BASE}/users/${user.id}/status`,
                    {
                        method: "PATCH",
                        headers:
                            getAuthHeaders(),
                        body: JSON.stringify(
                            {
                                status:
                                    newStatus,
                            }
                        ),
                    }
                );

            if (
                response.status === 401
            ) {
                throw new Error(
                    "Authentication failed. Please login again."
                );
            }

            if (
                response.status === 403
            ) {
                throw new Error(
                    "You are not authorized to change user status."
                );
            }

            if (!response.ok) {
                const message =
                    await getApiErrorMessage(
                        response
                    );

                throw new Error(message);
            }

            const data =
                await response.json();

            const updatedUser =
                normalizeUser(
                    data?.user
                );

            if (updatedUser) {
                setUsers(
                    (previous) =>
                        previous.map(
                            (item) =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    updatedUser.id
                                )
                                    ? updatedUser
                                    : item
                        )
                );
            } else {
                setUsers(
                    (previous) =>
                        previous.map(
                            (item) =>
                                Number(
                                    item.id
                                ) ===
                                Number(
                                    user.id
                                )
                                    ? {
                                          ...item,
                                          status:
                                              newStatus,
                                      }
                                    : item
                        )
                );
            }

            setSuccess(
                `User marked as ${newStatus}.`
            );
        } catch (err) {
            console.error(
                "UPDATE USER STATUS ERROR:",
                err
            );

            setError(
                err?.message ||
                    "Unable to update user status"
            );
        } finally {
            setStatusUpdatingId(
                null
            );
        }
    };


    // =================================================
    // CLEAR FILTERS
    // =================================================

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("");
        setStatusFilter("");
    };


    // =================================================
    // BACK
    // =================================================

    const handleBack = () => {
        navigate(-1);
    };


    // =================================================
    // RENDER
    // =================================================

    return (
        <div className="users-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="users-header">

                <div className="users-header-left">

                    <button
                        type="button"
                        className="users-back-btn"
                        onClick={
                            handleBack
                        }
                        title="Go Back"
                    >
                        <FaArrowLeft />
                    </button>

                    <div>
                        <h1>
                            User Management
                        </h1>

                        <p>
                            Manage HMS
                            administrators,
                            doctors and
                            staff
                        </p>
                    </div>

                </div>


                <div className="users-header-actions">

                    <button
                        type="button"
                        className={`refresh-users-btn ${
                            refreshing
                                ? "refreshing"
                                : ""
                        }`}
                        onClick={
                            handleRefresh
                        }
                        disabled={
                            refreshing ||
                            loading
                        }
                        title="Refresh Users"
                    >
                        <FaSyncAlt />

                        <span>
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </span>
                    </button>


                    <button
                        type="button"
                        className="add-user-btn"
                        onClick={
                            openAddModal
                        }
                        title="Add User"
                    >
                        <FaPlus />

                        <span>
                            Add User
                        </span>
                    </button>

                </div>

            </div>


            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
                <div className="users-success">
                    <FaCheckCircle />

                    <span>
                        {success}
                    </span>
                </div>
            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    className="users-success"
                    style={{
                        borderColor:
                            "rgba(255,70,70,.25)",
                        background:
                            "rgba(255,70,70,.07)",
                        color:
                            "#ff8585",
                    }}
                >
                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        style={{
                            marginLeft:
                                "8px",
                            border: "none",
                            background:
                                "transparent",
                            color:
                                "inherit",
                            cursor:
                                "pointer",
                        }}
                        title="Close"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="users-stats">

                <div className="user-stat-card">

                    <div className="user-stat-icon">
                        <FaUsers />
                    </div>

                    <div>
                        <span>
                            Total Users
                        </span>

                        <strong>
                            {
                                stats.totalUsers
                            }
                        </strong>
                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="user-stat-icon active">
                        <FaUserCheck />
                    </div>

                    <div>
                        <span>
                            Active Users
                        </span>

                        <strong>
                            {
                                stats.activeUsers
                            }
                        </strong>
                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="user-stat-icon inactive">
                        <FaUserTimes />
                    </div>

                    <div>
                        <span>
                            Inactive Users
                        </span>

                        <strong>
                            {
                                stats.inactiveUsers
                            }
                        </strong>
                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="user-stat-icon admin">
                        <FaUserShield />
                    </div>

                    <div>
                        <span>
                            Administrators
                        </span>

                        <strong>
                            {
                                stats.administrators
                            }
                        </strong>
                    </div>

                </div>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="users-toolbar">

                <div className="users-search">

                    <FaSearch />

                    <input
                        type="text"
                        value={
                            search
                        }
                        onChange={(event) =>
                            setSearch(
                                event.target
                                    .value
                            )
                        }
                        placeholder="Search users by name, email, phone or role..."
                    />

                </div>


                <div className="users-filter">

                    <FaUserShield />

                    <select
                        value={
                            roleFilter
                        }
                        onChange={(event) =>
                            setRoleFilter(
                                event.target
                                    .value
                            )
                        }
                    >
                        <option value="">
                            All Roles
                        </option>

                        {ROLES.map(
                            (role) => (
                                <option
                                    key={
                                        role.value
                                    }
                                    value={
                                        role.value
                                    }
                                >
                                    {
                                        role.label
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <FaChevronDown
                        style={{
                            pointerEvents:
                                "none",
                        }}
                    />

                </div>


                <div className="users-filter">

                    <FaCheckCircle />

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(event) =>
                            setStatusFilter(
                                event.target
                                    .value
                            )
                        }
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>
                    </select>

                    <FaChevronDown
                        style={{
                            pointerEvents:
                                "none",
                        }}
                    />

                </div>


                {(search ||
                    roleFilter ||
                    statusFilter) && (
                    <button
                        type="button"
                        className="clear-filter-btn"
                        onClick={
                            clearFilters
                        }
                    >
                        Clear
                    </button>
                )}

            </div>


            {/* =================================================
                USERS CARD
            ================================================= */}

            <div className="users-card">

                <div className="users-card-header">

                    <div>
                        <h2>
                            System Users
                        </h2>

                        <p>
                            {loading
                                ? "Loading users..."
                                : `${filteredUsers.length} users found`}
                        </p>
                    </div>

                    <FaUsers />

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="users-empty">

                        <div className="empty-icon">
                            <FaSyncAlt
                                style={{
                                    animation:
                                        "users-refresh-spin .8s linear infinite",
                                }}
                            />
                        </div>

                        <h3>
                            Loading users
                        </h3>

                        <p>
                            Fetching users
                            from the
                            database...
                        </p>

                    </div>
                ) : filteredUsers.length ===
                  0 ? (
                    /* =============================================
                       EMPTY
                    ============================================= */

                    <div className="users-empty">

                        <div className="empty-icon">
                            <FaUsers />
                        </div>

                        <h3>
                            No users found
                        </h3>

                        <p>
                            {users.length ===
                            0
                                ? "No users are available in the database."
                                : "No users match your current filters."}
                        </p>

                        {users.length ===
                            0 && (
                            <button
                                type="button"
                                onClick={
                                    openAddModal
                                }
                            >
                                <FaPlus
                                    style={{
                                        marginRight:
                                            "6px",
                                    }}
                                />
                                Add First User
                            </button>
                        )}

                    </div>
                ) : (
                    /* =============================================
                       TABLE
                    ============================================= */

                    <div className="users-table-wrapper">

                        <table className="users-table">

                            <thead>
                                <tr>

                                    <th>
                                        User
                                    </th>

                                    <th>
                                        Contact
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Created
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>
                            </thead>


                            <tbody>

                                {filteredUsers.map(
                                    (user) => {
                                        const RoleIcon =
                                            getRoleIcon(
                                                user.role
                                            );

                                        return (
                                            <tr
                                                key={
                                                    user.id
                                                }
                                            >

                                                {/* USER */}

                                                <td>

                                                    <div className="user-cell">

                                                        <div className="user-avatar">
                                                            {user.profile_image ? (
                                                                <img
                                                                    src={
                                                                        user.profile_image
                                                                    }
                                                                    alt={
                                                                        user.name
                                                                    }
                                                                    style={{
                                                                        width:
                                                                            "100%",
                                                                        height:
                                                                            "100%",
                                                                        objectFit:
                                                                            "cover",
                                                                        borderRadius:
                                                                            "inherit",
                                                                    }}
                                                                    onError={(
                                                                        event
                                                                    ) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";

                                                                        if (
                                                                            event.currentTarget
                                                                                .nextSibling
                                                                        ) {
                                                                            event.currentTarget.nextSibling.style.display =
                                                                                "flex";
                                                                        }
                                                                    }}
                                                                />
                                                            ) : null}

                                                            <span
                                                                style={{
                                                                    display:
                                                                        user.profile_image
                                                                            ? "none"
                                                                            : "block",
                                                                }}
                                                            >
                                                                {getInitials(
                                                                    user.name
                                                                )}
                                                            </span>
                                                        </div>


                                                        <div>

                                                            <strong>
                                                                {
                                                                    user.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                ID:{" "}
                                                                {
                                                                    user.id
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* CONTACT */}

                                                <td>

                                                    <div className="contact-cell">

                                                        <span>
                                                            <FaEnvelope />

                                                            {
                                                                user.email
                                                            }
                                                        </span>

                                                        <span>
                                                            <FaPhone />

                                                            {
                                                                user.phone ||
                                                                    "No phone"
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* ROLE */}

                                                <td>

                                                    <div className="role-cell">

                                                        <div className="role-icon">
                                                            <RoleIcon />
                                                        </div>

                                                        {
                                                            getRoleLabel(
                                                                user.role
                                                            )
                                                        }

                                                    </div>

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className={`status-badge ${
                                                            user.status ===
                                                            "active"
                                                                ? "active"
                                                                : "inactive"
                                                        }`}
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                user
                                                            )
                                                        }
                                                        disabled={
                                                            statusUpdatingId ===
                                                            user.id
                                                        }
                                                        title={`Click to mark ${user.status === "active" ? "inactive" : "active"}`}
                                                    >

                                                        {statusUpdatingId ===
                                                        user.id ? (
                                                            <FaSyncAlt
                                                                style={{
                                                                    animation:
                                                                        "users-refresh-spin .8s linear infinite",
                                                                }}
                                                            />
                                                        ) : user.status ===
                                                          "active" ? (
                                                            <FaCheckCircle />
                                                        ) : (
                                                            <FaTimesCircle />
                                                        )}

                                                        {
                                                            user.status ===
                                                            "active"
                                                                ? "Active"
                                                                : "Inactive"
                                                        }

                                                    </button>

                                                </td>


                                                {/* CREATED */}

                                                <td>

                                                    <span
                                                        style={{
                                                            color:
                                                                "#9aa49d",
                                                            fontSize:
                                                                "11px",
                                                        }}
                                                    >
                                                        {
                                                            formatDate(
                                                                user.created_at
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="user-actions">

                                                        <button
                                                            type="button"
                                                            className="view-action"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    user
                                                                )
                                                            }
                                                            title="View User"
                                                        >
                                                            <FaEye />
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="edit-action"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    user
                                                                )
                                                            }
                                                            title="Edit User"
                                                        >
                                                            <FaEdit />
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="delete-action"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                user.id
                                                            }
                                                            title="Delete User"
                                                        >
                                                            {deletingId ===
                                                            user.id ? (
                                                                <FaSyncAlt
                                                                    style={{
                                                                        animation:
                                                                            "users-refresh-spin .8s linear infinite",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <FaTrash />
                                                            )}
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>


            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="users-modal-overlay"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div
                        className="users-modal"
                        role="dialog"
                        aria-modal="true"
                    >

                        <div className="users-modal-header">

                            <div>

                                <h2>
                                    {editingUser
                                        ? "Edit User"
                                        : "Add New User"}
                                </h2>

                                <p>
                                    {editingUser
                                        ? "Update user account information"
                                        : "Create a new HMS user account"}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                title="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="user-form-grid">

                                {/* NAME */}

                                <div className="user-form-field">

                                    <label>
                                        Full Name
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="user-input">

                                        <FaUser />

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                form.name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter full name"
                                            autoComplete="name"
                                            required
                                        />

                                    </div>

                                </div>


                                {/* EMAIL */}

                                <div className="user-form-field">

                                    <label>
                                        Email Address
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="user-input">

                                        <FaEnvelope />

                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                form.email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter email address"
                                            autoComplete="email"
                                            required
                                        />

                                    </div>

                                </div>


                                {/* PHONE */}

                                <div className="user-form-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <div className="user-input">

                                        <FaPhone />

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={
                                                form.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter phone number"
                                            autoComplete="tel"
                                            maxLength="15"
                                        />

                                    </div>

                                </div>


                                {/* ROLE */}

                                <div className="user-form-field">

                                    <label>
                                        Role
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <div className="user-input">

                                        <FaUserShield />

                                        <select
                                            name="role"
                                            value={
                                                form.role
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            {ROLES.map(
                                                (
                                                    role
                                                ) => (
                                                    <option
                                                        key={
                                                            role.value
                                                        }
                                                        value={
                                                            role.value
                                                        }
                                                    >
                                                        {
                                                            role.label
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>


                                {/* PASSWORD */}

                                <div
                                    className="user-form-field"
                                    style={{
                                        gridColumn:
                                            "1 / -1",
                                    }}
                                >

                                    <label>
                                        Password
                                        {!editingUser && (
                                            <span>
                                                *
                                            </span>
                                        )}
                                    </label>

                                    <div className="user-input">

                                        <FaIdBadge />

                                        <input
                                            type="password"
                                            name="password"
                                            value={
                                                form.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder={
                                                editingUser
                                                    ? "Leave blank to keep current password"
                                                    : "Enter password"
                                            }
                                            autoComplete={
                                                editingUser
                                                    ? "new-password"
                                                    : "new-password"
                                            }
                                            required={
                                                !editingUser
                                            }
                                        />

                                    </div>

                                </div>

                            </div>


                            {error && (
                                <div className="user-form-error">

                                    <FaExclamationTriangle
                                        style={{
                                            marginRight:
                                                "7px",
                                        }}
                                    />

                                    {
                                        error
                                    }

                                </div>
                            )}


                            <div className="users-modal-actions">

                                <button
                                    type="button"
                                    className="cancel-user-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    <FaTimes />

                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="save-user-btn"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving ? (
                                        <FaSyncAlt
                                            style={{
                                                animation:
                                                    "users-refresh-spin .8s linear infinite",
                                            }}
                                        />
                                    ) : (
                                        <FaSave />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : editingUser
                                        ? "Update User"
                                        : "Create User"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* =================================================
                VIEW USER MODAL
            ================================================= */}

            {showViewModal &&
                viewingUser && (
                    <div
                        className="users-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeViewModal();
                            }
                        }}
                    >

                        <div
                            className="users-view-modal"
                            role="dialog"
                            aria-modal="true"
                        >

                            <div className="users-modal-header">

                                <div>

                                    <h2>
                                        User Profile
                                    </h2>

                                    <p>
                                        Account
                                        information
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                    title="Close"
                                >
                                    <FaTimes />
                                </button>

                            </div>


                            {/* PROFILE */}

                            <div className="view-user-profile">

                                <div className="view-user-avatar">

                                    {viewingUser.profile_image ? (
                                        <img
                                            src={
                                                viewingUser.profile_image
                                            }
                                            alt={
                                                viewingUser.name
                                            }
                                            style={{
                                                width:
                                                    "100%",
                                                height:
                                                    "100%",
                                                objectFit:
                                                    "cover",
                                                borderRadius:
                                                    "inherit",
                                            }}
                                        />
                                    ) : (
                                        getInitials(
                                            viewingUser.name
                                        )
                                    )}

                                </div>


                                <h3>
                                    {
                                        viewingUser.name
                                    }
                                </h3>


                                <div className="view-user-role">
                                    {
                                        getRoleLabel(
                                            viewingUser.role
                                        )
                                    }
                                </div>

                            </div>


                            {/* DETAILS */}

                            <div className="view-user-details">

                                <div>

                                    <span>
                                        <FaIdBadge />

                                        User ID
                                    </span>

                                    <strong>
                                        {
                                            viewingUser.id
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        <FaEnvelope />

                                        Email
                                    </span>

                                    <strong>
                                        {
                                            viewingUser.email ||
                                                "—"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        <FaPhone />

                                        Phone
                                    </span>

                                    <strong>
                                        {
                                            viewingUser.phone ||
                                                "Not provided"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        <FaUserShield />

                                        Role
                                    </span>

                                    <strong>
                                        {
                                            getRoleLabel(
                                                viewingUser.role
                                            )
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        <FaCheckCircle />

                                        Status
                                    </span>

                                    <strong
                                        className={
                                            viewingUser.status ===
                                            "active"
                                                ? "active"
                                                : "inactive"
                                        }
                                    >
                                        {
                                            viewingUser.status ===
                                            "active"
                                                ? "Active"
                                                : "Inactive"
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        <FaHospital />

                                        Created
                                    </span>

                                    <strong>
                                        {formatDate(
                                            viewingUser.created_at
                                        )}
                                    </strong>

                                </div>

                            </div>


                            {/* ACTIONS */}

                            <div className="view-user-actions">

                                <button
                                    type="button"
                                    className="cancel-user-btn"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    <FaTimes />

                                    Close
                                </button>


                                <button
                                    type="button"
                                    className="save-user-btn"
                                    onClick={() => {
                                        closeViewModal();

                                        openEditModal(
                                            viewingUser
                                        );
                                    }}
                                >
                                    <FaEdit />

                                    Edit User
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
};


export default Users;