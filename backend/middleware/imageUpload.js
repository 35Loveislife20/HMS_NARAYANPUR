const multer = require("multer");

const {
    ALLOWED_MIME_TYPES,
    MAX_IMAGE_BYTES,
} = require("../utils/imageStore");

/*
IMAGE UPLOAD (multer, memory storage)
File disk par nahi jati. req.file / req.files[...] me buffer aata hai,
aur controller use TiDB me save karta hai.

Use:
    imageUpload.single("photo")
    imageUpload.fields([{ name: "logo", maxCount: 1 }, ...])
*/

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const error = new Error(
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );
        error.status = 400;
        return cb(error);
    }

    return cb(null, true);
};

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_IMAGE_BYTES,
        files: 10,
    },
    fileFilter,
});

module.exports = imageUpload;