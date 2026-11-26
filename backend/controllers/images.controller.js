const { findImageById } = require("../models/image.model");

/*
GET /uploads/images/:id
Public route (img tag Authorization header nahi bhej sakta).
Id har upload par naya banta hai, isliye lamba cache safe hai.
*/

const getImage = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(404).json({
                success: false,
                message: "Image not found.",
            });
        }

        const image = await findImageById(id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: "Image not found.",
            });
        }

        const buffer = Buffer.isBuffer(image.data)
            ? image.data
            : Buffer.from(image.data);

        res.set({
            "Content-Type": image.mime_type,
            "Cache-Control":
                "public, max-age=31536000, immutable",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "X-Content-Type-Options": "nosniff",
        });

        return res.status(200).send(buffer);
    } catch (error) {
        console.error("GET IMAGE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load image.",
        });
    }
};

module.exports = {
    getImage,
};