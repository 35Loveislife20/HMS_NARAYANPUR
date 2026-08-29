const express = require("express");

const {
    getUsers,
    getUserById,
    addUser,
    editUser,
    deleteUser,
    updateUserStatus,
} = require("../controllers/user.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


const router = express.Router();


// =====================================================
// ALL USER ROUTES REQUIRE LOGIN
// =====================================================

router.use(
    authMiddleware
);


// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

router.get(
    "/",
    getUsers
);


// =====================================================
// GET SINGLE USER
// GET /api/users/:id
// =====================================================

router.get(
    "/:id",
    getUserById
);


// =====================================================
// CREATE USER
// POST /api/users
// =====================================================

router.post(
    "/",
    addUser
);


// =====================================================
// UPDATE USER
// PUT /api/users/:id
// =====================================================

router.put(
    "/:id",
    editUser
);


// =====================================================
// UPDATE USER STATUS
// PATCH /api/users/:id/status
// =====================================================

router.patch(
    "/:id/status",
    updateUserStatus
);


// =====================================================
// DELETE USER
// DELETE /api/users/:id
// =====================================================

router.delete(
    "/:id",
    deleteUser
);


module.exports = router;