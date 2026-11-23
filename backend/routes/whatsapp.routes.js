const express = require("express");
const { sendWhatsAppTemplate } = require("../services/whatsapp.service");

const authMiddleware = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";

// Sends a WhatsApp message (costs money, can be abused),
// so only a logged-in super admin may call it.
router.post(
    "/send-whatsapp",
    authMiddleware,
    requireRole("super_admin"),
    async (req, res) => {
        const { to } = req.body || {};

        if (!to) {
            return res
                .status(400)
                .json({ success: false, message: "'to' number required hai" });
        }

        const digits = String(to).replace(/\D/g, "");

        if (digits.length < 10 || digits.length > 15) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid phone number" });
        }

        try {
            const data = await sendWhatsAppTemplate(to);
            res.json({ success: true, data });
        } catch (err) {
            console.error("WHATSAPP SEND ERROR:", err);

            res.status(500).json({
                success: false,
                message: isProduction
                    ? "Unable to send WhatsApp message"
                    : err.message,
            });
        }
    }
);

module.exports = router;