const express = require("express");

const { getImage } = require("../controllers/images.controller");

const router = express.Router();

// Mounted at /uploads/images  ->  GET /uploads/images/:id
router.get("/:id", getImage);

module.exports = router;