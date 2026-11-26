const bcrypt = require("bcryptjs");

const {
    generatePassword,
    issueCredentials,
} = require("../utils/credentialMailer");

const {
    createUser,
    findUserByEmail,
    findUserById,
    findAllUsers,
    updateUser,
    updateUserRole,
    updateUserStatus,
    updateUserProfileImage,
    deleteUserById
} = require("../models/user.model");

const VALID_ROLES = [
    "patient",
    "super_admin",
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse"
];

const HOSPITAL_ROLES = [
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
    "patient"
];

/*
|--------------------------------------------------------------------------
| Permission Helpers
|--------------------------------------------------------------------------
*/

const isSuperAdmin = (req) => {
    return req.user?.role === "super_admin";
};

const isHospitalAdmin = (req) => {
    return req.user?.role === "hospital_admin";
};

const isAdmin = (req) => {
    return isSuperAdmin(req) || isHospitalAdmin(req);
};

/*
|--------------------------------------------------------------------------
| Hospital Scope
|--------------------------------------------------------------------------
*/

const getHospitalScope = (req) => {
    if (isSuperAdmin(req)) {
        return null;
    }

    return req.user?.hospital_id || null;
};

const canAccessUser = (req, targetUser) => {
    if (!req.user || !targetUser) {
        return false;
    }

    // Super admin can access every user
    if (isSuperAdmin(req)) {
        return true;
    }

    // Hospital users can only access users from their hospital
    return (
        targetUser.hospital_id !== null &&
        Number(targetUser.hospital_id) === Number(req.user.hospital_id)
    );
};

/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/

const getAllUsers = async (req, res) => {
    try {
        const hospitalId = getHospitalScope(req);

        const users = await findAllUsers(hospitalId);

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Get all users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await findUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!canAccessUser(req, user)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user"
        });
    }
};

/*
|--------------------------------------------------------------------------
| ADD USER
|--------------------------------------------------------------------------
*/

const addUser = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can create users"
            });
        }

        const {
            name,
            email,
            password,
            phone,
            role,
            profile_image
        } = req.body;

        // Password optional: khali ho to auto-generate hoga aur mail me jayega
        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email and role are required"
            });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        if (
            password &&
            String(password).trim() &&
            String(password).trim().length < 6
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        /*
         * Hospital Admin:
         * - Can only create hospital-level users
         * - Cannot create super_admin
         * - New user automatically belongs to same hospital
         */
        if (isHospitalAdmin(req)) {
            if (!HOSPITAL_ROLES.includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Hospital Admin cannot create this role"
                });
            }
        }

        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const plainPassword =
            password && String(password).trim()
                ? String(password).trim()
                : makeTempPassword();

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        /*
         * IMPORTANT:
         * hospital_id is NEVER taken from req.body.
         *
         * Super Admin:
         *    hospital_id = null
         *
         * Hospital Admin:
         *    hospital_id = logged-in admin's hospital
         */
        const hospitalId = isSuperAdmin(req)
            ? null
            : req.user.hospital_id;

        if (!isSuperAdmin(req) && !hospitalId) {
            return res.status(400).json({
                success: false,
                message: "Hospital association is required"
            });
        }

        const user = await createUser(
            String(name).trim(),
            normalizedEmail,
            hashedPassword,
            phone || null,
            role,
            profile_image || null,
            hospitalId
        );

        // Credentials PDF + email (fail hone par user create fail nahi hota)
        const mailSent = await issueCredentials({
            userId: user?.insertId ?? user?.id,
            name: String(name).trim(),
            email: normalizedEmail,
            role,
            password: plainPassword,
            hospitalId
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            mailSent,
            user
        });

    } catch (error) {
        console.error("Add user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create user"
        });
    }
};

/*
|--------------------------------------------------------------------------
| EDIT USER
|--------------------------------------------------------------------------
*/

const editUser = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can edit users"
            });
        }

        const { id } = req.params;

        const existingUser = await findUserById(id);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!canAccessUser(req, existingUser)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        /*
         * Hospital Admin cannot modify Super Admin.
         */
        if (isHospitalAdmin(req) && existingUser.role === "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Hospital Admin cannot modify Super Admin"
            });
        }

        const {
            name,
            email,
            phone,
            role,
            password,
            profile_image
        } = req.body;

        if (role && !VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        /*
         * Hospital Admin cannot assign global super_admin role.
         */
        if (isHospitalAdmin(req) && role === "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Hospital Admin cannot assign super_admin role"
            });
        }

        /*
         * Prevent changing another user's email to an existing email.
         */
        if (email && email !== existingUser.email) {
            const emailUser = await findUserByEmail(email);

            if (emailUser && Number(emailUser.id) !== Number(id)) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered"
                });
            }
        }

        let hashedPassword = null;

        if (password && password.trim()) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        /*
         * Hospital ID is controlled by backend.
         *
         * Super Admin:
         *   - Can keep/change hospital assignment
         *
         * Hospital Admin:
         *   - User stays in admin's hospital
         */
        const hospitalId = isSuperAdmin(req)
            ? (
                req.body.hospital_id !== undefined
                    ? req.body.hospital_id
                    : existingUser.hospital_id
            )
            : req.user.hospital_id;

        if (
            role === "super_admin" &&
            hospitalId !== null &&
            hospitalId !== undefined &&
            hospitalId !== ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Super Admin cannot belong to a hospital"
            });
        }

        await updateUser(
            id,
            name ?? existingUser.name,
            email ?? existingUser.email,
            phone ?? existingUser.phone,
            role ?? existingUser.role,
            hashedPassword,
            profile_image ?? existingUser.profile_image,
            hospitalId
        );

        const updatedUser = await findUserById(id);

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Edit user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user"
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE USER ROLE
|--------------------------------------------------------------------------
*/

const changeUserRole = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can change roles"
            });
        }

        const { id } = req.params;
        const { role } = req.body;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        const targetUser = await findUserById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!canAccessUser(req, targetUser)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (isHospitalAdmin(req)) {
            if (
                targetUser.role === "super_admin" ||
                role === "super_admin"
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Hospital Admin cannot manage super_admin"
                });
            }
        }

        await updateUserRole(id, role);

        return res.status(200).json({
            success: true,
            message: "User role updated successfully"
        });

    } catch (error) {
        console.error("Change user role error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user role"
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE USER STATUS
|--------------------------------------------------------------------------
*/

const changeUserStatus = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can change user status"
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "inactive", "suspended"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user status"
            });
        }

        const targetUser = await findUserById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!canAccessUser(req, targetUser)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (
            isHospitalAdmin(req) &&
            targetUser.role === "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Hospital Admin cannot modify Super Admin"
            });
        }

        /*
         * Do not allow an administrator to deactivate themselves.
         */
        if (Number(targetUser.id) === Number(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own status"
            });
        }

        await updateUserStatus(id, status);

        return res.status(200).json({
            success: true,
            message: "User status updated successfully"
        });

    } catch (error) {
        console.error("Change user status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user status"
        });
    }
};

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/

const deleteUser = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can delete users"
            });
        }

        const { id } = req.params;

        if (Number(id) === Number(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const targetUser = await findUserById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!canAccessUser(req, targetUser)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (
            isHospitalAdmin(req) &&
            targetUser.role === "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Hospital Admin cannot delete Super Admin"
            });
        }

        /*
         * Prevent accidental deletion of the only hospital admin.
         */
        if (
            isHospitalAdmin(req) &&
            targetUser.role === "hospital_admin"
        ) {
            const users = await findAllUsers(req.user.hospital_id);

            const hospitalAdmins = users.filter(
                user => user.role === "hospital_admin"
            );

            if (hospitalAdmins.length <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete the only Hospital Admin"
                });
            }
        }

        await deleteUserById(id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Delete user error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user"
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE IMAGE
|--------------------------------------------------------------------------
*/

const changeProfileImage = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await findUserById(id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        /*
         * User can update own image.
         * Admin can update users within their scope.
         */
        const isOwnProfile =
            Number(req.user.id) === Number(id);

        if (!isOwnProfile && !canAccessUser(req, targetUser)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required"
            });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;

        await updateUserProfileImage(id, imagePath);

        return res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            profile_image: imagePath
        });

    } catch (error) {
        console.error("Profile image update error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile image"
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    addUser,
    editUser,
    changeUserRole,
    changeUserStatus,
    deleteUser,
    changeProfileImage
};
/* Temp password generator (generatePassword import kaam nahi kar raha tha) */
function makeTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = require("crypto").randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}