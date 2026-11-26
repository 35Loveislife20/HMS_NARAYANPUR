const db = require("../config/db");

/*
IMAGE MODEL (TiDB table: images)
Columns: id, entity_type, entity_id, mime_type, file_name, data (LONGBLOB), created_at
*/

const insertImage = async ({
    entityType,
    entityId = null,
    mimeType,
    fileName = null,
    data,
}) => {
    const [result] = await db.query(
        `
        INSERT INTO images
            (entity_type, entity_id, mime_type, file_name, data)
        VALUES
            (?, ?, ?, ?, ?)
        `,
        [
            String(entityType || "general").slice(0, 50),
            entityId === null || entityId === undefined
                ? null
                : String(entityId).slice(0, 64),
            mimeType,
            fileName ? String(fileName).slice(0, 255) : null,
            data,
        ]
    );

    return result.insertId;
};

const findImageById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT id, mime_type, file_name, data
        FROM images
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

const deleteImageById = async (id) => {
    const [result] = await db.query(
        "DELETE FROM images WHERE id = ?",
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    insertImage,
    findImageById,
    deleteImageById,
};