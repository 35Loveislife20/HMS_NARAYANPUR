const ROLE_PERMISSIONS = {
    super_admin: [
        "dashboard",
        "patients",
        "doctors",
        "appointments",
        "departments",
        "laboratory",
        "pharmacy",
        "billing",
        "reports",
        "settings",
        "user_management",
    ],

    hospital_admin: [
        "dashboard",
        "patients",
        "doctors",
        "appointments",
        "departments",
        "laboratory",
        "pharmacy",
        "billing",
        "reports",
        "settings",
    ],

    receptionist: [
        "dashboard",
        "patients",
        "appointments",
    ],

    doctor: [
        "dashboard",
        "patients",
        "appointments",
        "departments",
        "laboratory",
        "reports",
    ],

    lab_technician: [
        "dashboard",
        "laboratory",
        "reports",
    ],

    pharmacist: [
        "dashboard",
        "pharmacy",
        "billing",
        "reports",
    ],

    accountant: [
        "dashboard",
        "pharmacy",
        "billing",
        "reports",
    ],

    nurse: [
        "dashboard",
        "patients",
        "appointments",
        "departments",
    ],
};

export const hasPermission = (role, permission) => {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

export const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role] || [];
};

export default ROLE_PERMISSIONS;