const {
    insertImage,
    deleteImageById,
} = require("../models/image.model");

/*
IMAGE STORE
Image TiDB (images table) me save hoti hai aur URL /uploads/images/<id>
banakar columns me jata hai. Ye URL purane /uploads/... jaisa hi dikhta hai,
isliye frontend ka URL-banane wala code bina badlav ke chalta hai.
*/

const IMAGE_URL_PREFIX = "/uploads/images";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const createImageError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    error.status = 400;
    return error;
};

const saveImageFile = async (
    file,
    { entityType = "general", entityId = null } = {}
) => {
    if (!file) {
        return null;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw createImageError(
            "INVALID_IMAGE_TYPE",
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );
    }

    if (!file.buffer || !file.buffer.length) {
        throw createImageError(
            "EMPTY_IMAGE",
            "Uploaded image is empty."
        );
    }

    if (file.buffer.length > MAX_IMAGE_BYTES) {
        throw createImageError(
            "IMAGE_TOO_LARGE",
            "Image 2 MB se badi nahi honi chahiye."
        );
    }

    const id = await insertImage({
        entityType,
        entityId,
        mimeType:
            file.mimetype === "image/jpg"
                ? "image/jpeg"
                : file.mimetype,
        fileName: file.originalname,
        data: file.buffer,
    });

    return `${IMAGE_URL_PREFIX}/${id}`;
};

const getImageIdFromUrl = (url) => {
    if (!url) {
        return null;
    }

    const match = String(url).match(
        /\/uploads\/images\/(\d+)(?:[?#].*)?$/
    );

    return match ? Number(match[1]) : null;
};

const deleteImageByUrl = async (url) => {
    try {
        const id = getImageIdFromUrl(url);

        if (id) {
            await deleteImageById(id);
        }
    } catch (error) {
        console.error(
            "DELETE OLD IMAGE ERROR:",
            error.message
        );
    }
};

module.exports = {
    IMAGE_URL_PREFIX,
    ALLOWED_MIME_TYPES,
    MAX_IMAGE_BYTES,
    saveImageFile,
    getImageIdFromUrl,
    deleteImageByUrl,
};