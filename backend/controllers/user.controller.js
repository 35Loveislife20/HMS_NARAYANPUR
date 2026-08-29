const bcrypt = require("bcryptjs");

const {
    createUser,
    findUserByEmail,
    findUserById,
    findAllUsers,
    updateUser,
    updateUserPassword,
    deleteUserById,
} = require("../models/user.model");


// =====================================================
// VALID ROLES
// =====================================================

const VALID_ROLES = [
    "patient",
    "super_admin",
    "hospital_admin",
    "receptionist",
    "doctor",
    "lab_technician",
    "pharmacist",
    "accountant",
    "nurse",
];


// =====================================================
// ADMIN CHECK
// =====================================================

const isAdmin = (req) => {

    return [
        "admin",
        "super_admin",
        "hospital_admin",
    ].includes(req.user?.role);

};


// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

const getUsers = async (req, res) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view users",
            });

        }


        const users =
            await findAllUsers();


        return res.status(200).json({

            success: true,

            count: users.length,

            users,

        });

    } catch (error) {

        console.error(
            "GET USERS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch users",

            error:
                error.message,

        });

    }

};


// =====================================================
// GET USER BY ID
// GET /api/users/:id
// =====================================================

const getUserById = async (
    req,
    res
) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized",
            });

        }


        const id =
            Number(req.params.id);


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid user ID",
            });

        }


        const user =
            await findUserById(id);


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found",
            });

        }


        return res.status(200).json({

            success: true,

            user,

        });

    } catch (error) {

        console.error(
            "GET USER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch user",

            error:
                error.message,

        });

    }

};


// =====================================================
// CREATE USER
// POST /api/users
// =====================================================

const addUser = async (
    req,
    res
) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to create users",
            });

        }


        const {
            name,
            email,
            password,
            phone,
            role,
        } = req.body;


        // -------------------------------------------------
        // REQUIRED FIELDS
        // -------------------------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email, password and role are required",

            });

        }


        // -------------------------------------------------
        // VALIDATE ROLE
        // -------------------------------------------------

        if (
            !VALID_ROLES.includes(role)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid role",

                allowed_roles:
                    VALID_ROLES,

            });

        }


        // -------------------------------------------------
        // NORMALIZE EMAIL
        // -------------------------------------------------

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        // -------------------------------------------------
        // CHECK EMAIL
        // -------------------------------------------------

        const existingUser =
            await findUserByEmail(
                normalizedEmail
            );


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already registered",

            });

        }


        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // -------------------------------------------------
        // CREATE USER
        // -------------------------------------------------

        const result =
            await createUser(

                name.trim(),

                normalizedEmail,

                hashedPassword,

                phone,

                role

            );


        const userId =
            result.insertId;


        // -------------------------------------------------
        // GET CREATED USER
        // -------------------------------------------------

        const user =
            await findUserById(
                userId
            );


        return res.status(201).json({

            success: true,

            message:
                "User created successfully",

            user,

        });

    } catch (error) {

        console.error(
            "CREATE USER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create user",

            error:
                error.message,

        });

    }

};


// =====================================================
// UPDATE USER
// PUT /api/users/:id
// =====================================================

const editUser = async (
    req,
    res
) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update users",
            });

        }


        const id =
            Number(req.params.id);


        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid user ID",
            });

        }


        const {
            name,
            email,
            phone,
            role,
            password,
        } = req.body;


        // -------------------------------------------------
        // REQUIRED
        // -------------------------------------------------

        if (
            !name ||
            !email ||
            !role
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and role are required",

            });

        }


        // -------------------------------------------------
        // VALID ROLE
        // -------------------------------------------------

        if (
            !VALID_ROLES.includes(role)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid role",

                allowed_roles:
                    VALID_ROLES,

            });

        }


        // -------------------------------------------------
        // CHECK USER
        // -------------------------------------------------

        const existingUser =
            await findUserById(id);


        if (!existingUser) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found",

            });

        }


        // -------------------------------------------------
        // NORMALIZE EMAIL
        // -------------------------------------------------

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        // -------------------------------------------------
        // CHECK EMAIL DUPLICATE
        // -------------------------------------------------

        const emailUser =
            await findUserByEmail(
                normalizedEmail
            );


        if (
            emailUser &&
            Number(emailUser.id) !== id
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already registered by another user",

            });

        }


        // -------------------------------------------------
        // UPDATE BASIC INFORMATION
        // -------------------------------------------------

        await updateUser(

            id,

            name.trim(),

            normalizedEmail,

            phone,

            role

        );


        // -------------------------------------------------
        // UPDATE PASSWORD IF PROVIDED
        // -------------------------------------------------

        if (
            password &&
            password.trim()
        ) {

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            await updateUserPassword(

                id,

                hashedPassword

            );

        }


        // -------------------------------------------------
        // GET UPDATED USER
        // -------------------------------------------------

        const updatedUser =
            await findUserById(id);


        return res.status(200).json({

            success: true,

            message:
                "User updated successfully",

            user:
                updatedUser,

        });

    } catch (error) {

        console.error(
            "UPDATE USER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to update user",

            error:
                error.message,

        });

    }

};


// =====================================================
// DELETE USER
// DELETE /api/users/:id
// =====================================================

const deleteUser = async (
    req,
    res
) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to delete users",

            });

        }


        const id =
            Number(req.params.id);


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid user ID",

            });

        }


        // -------------------------------------------------
        // PREVENT SELF DELETE
        // -------------------------------------------------

        if (
            Number(req.user?.id) === id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "You cannot delete your own account",

            });

        }


        // -------------------------------------------------
        // CHECK USER
        // -------------------------------------------------

        const user =
            await findUserById(id);


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found",

            });

        }


        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        await deleteUserById(id);


        return res.status(200).json({

            success: true,

            message:
                "User deleted successfully",

        });

    } catch (error) {

        console.error(
            "DELETE USER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to delete user",

            error:
                error.message,

        });

    }

};


// =====================================================
// UPDATE USER STATUS
// PATCH /api/users/:id/status
// =====================================================
//
// IMPORTANT:
// Ye function tabhi use hoga jab users table me
// `status` column available ho.
// =====================================================

const updateUserStatus = async (
    req,
    res
) => {

    try {

        if (!isAdmin(req)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized",

            });

        }


        const id =
            Number(req.params.id);


        const {
            status,
        } = req.body;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid user ID",

            });

        }


        if (
            !["active", "inactive"].includes(
                status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Status must be active or inactive",

            });

        }


        const { pool } =
            require("../config/db");


        const [result] =
            await pool.query(

                `
                UPDATE users
                SET status = ?
                WHERE id = ?
                `,

                [
                    status,
                    id,
                ]

            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found",

            });

        }


        const updatedUser =
            await findUserById(id);


        return res.status(200).json({

            success: true,

            message:
                "User status updated successfully",

            user:
                updatedUser,

        });

    } catch (error) {

        console.error(
            "UPDATE USER STATUS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to update user status",

            error:
                error.message,

        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getUsers,

    getUserById,

    addUser,

    editUser,

    deleteUser,

    updateUserStatus,

};