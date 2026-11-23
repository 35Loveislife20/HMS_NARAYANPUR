const { pool } = require("../config/db");

/* =========================================================
   HOSPITAL SELECT FIELDS
========================================================= */

const HOSPITAL_SELECT = `
    id,
    name,
    address,
    city,
    state,
    district,
    country,
    pincode,
    registration_number,
    license_number,
    tagline,
    location,
    phone,
    email,
    image_url,
    logo_url,
    login_background_image,
    signature,
    stamp,
    seal,
    verified_sticker,
    total_beds,
    available_beds,
    status,
    latitude,
    longitude,
    created_at
`;

/* =========================================================
   CREATE HOSPITAL
========================================================= */

const createHospital = async ({
    name,
    address = null,
    city = null,
    state = null,
    district = null,
    country = null,
    pincode = null,

    /*
     * HMS Registration Number
     */
    registration_number = null,

    /*
     * Hospital License Number
     */
    license_number = null,

    /*
     * Tagline is kept in DB because
     * Hospital Admin can manage it later.
     */
    tagline = null,

    location = null,
    phone = null,
    email = null,
    image_url = null,
    logo_url = null,
    total_beds = 0,
    available_beds = 0,
    status = "active",
    latitude = null,
    longitude = null,
}) => {
    const sql = `
        INSERT INTO hospitals (
            name,
            address,
            city,
            state,
            district,
            country,
            pincode,
            registration_number,
            license_number,
            tagline,
            location,
            phone,
            email,
            image_url,
            logo_url,
            total_beds,
            available_beds,
            status,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        name,
        address,
        city,
        state,
        district,
        country,
        pincode,
        registration_number,
        license_number,
        tagline,
        location,
        phone,
        email,
        image_url,
        logo_url,
        total_beds,
        available_beds,
        status,
        latitude,
        longitude,
    ];

    const [result] =
        await pool.query(
            sql,
            params
        );

    return result;
};

/* =========================================================
   FIND HOSPITAL BY ID
========================================================= */

const findHospitalById = async (
    id
) => {
    const sql = `
        SELECT
            ${HOSPITAL_SELECT}
        FROM hospitals
        WHERE id = ?
        LIMIT 1
    `;

    const [rows] =
        await pool.query(
            sql,
            [id]
        );

    return rows[0] || null;
};

/* =========================================================
   FIND HOSPITAL BY NAME
========================================================= */

const findHospitalByName =
    async (name) => {
        const sql = `
            SELECT
                ${HOSPITAL_SELECT}
            FROM hospitals
            WHERE LOWER(TRIM(name)) =
                  LOWER(TRIM(?))
            LIMIT 1
        `;

        const [rows] =
            await pool.query(
                sql,
                [name]
            );

        return rows[0] || null;
    };

/* =========================================================
   FIND HOSPITAL BY NAME
   EXCEPT CURRENT ID
========================================================= */

const findHospitalByNameExceptId =
    async (
        name,
        id
    ) => {
        const sql = `
            SELECT
                ${HOSPITAL_SELECT}
            FROM hospitals
            WHERE LOWER(TRIM(name)) =
                  LOWER(TRIM(?))
              AND id <> ?
            LIMIT 1
        `;

        const [rows] =
            await pool.query(
                sql,
                [name, id]
            );

        return rows[0] || null;
    };

/* =========================================================
   FIND ALL HOSPITALS
========================================================= */

const findAllHospitals =
    async () => {
        const sql = `
            SELECT
                ${HOSPITAL_SELECT}
            FROM hospitals
            ORDER BY id DESC
        `;

        const [rows] =
            await pool.query(
                sql
            );

        return rows;
    };

/* =========================================================
   FIND ACTIVE HOSPITALS
========================================================= */

const findActiveHospitals =
    async () => {
        const sql = `
            SELECT
                ${HOSPITAL_SELECT}
            FROM hospitals
            WHERE LOWER(
                COALESCE(status, 'active')
            ) NOT IN (
                'inactive',
                'disabled',
                'deleted',
                'deactivated'
            )
            ORDER BY name ASC
        `;

        const [rows] =
            await pool.query(
                sql
            );

        return rows;
    };

/* =========================================================
   SEARCH HOSPITALS
========================================================= */

const searchHospitals =
    async (keyword) => {
        const search =
            `%${String(
                keyword || ""
            ).trim()}%`;

        const sql = `
            SELECT
                ${HOSPITAL_SELECT}
            FROM hospitals
            WHERE
                name LIKE ?
                OR address LIKE ?
                OR city LIKE ?
                OR state LIKE ?
                OR district LIKE ?
                OR country LIKE ?
                OR pincode LIKE ?

                /*
                 * HMS Registration Number
                 */
                OR registration_number LIKE ?

                /*
                 * Hospital License Number
                 */
                OR license_number LIKE ?

                OR location LIKE ?
                OR phone LIKE ?
                OR email LIKE ?
            ORDER BY
                name ASC
        `;

        const params = [
            search,
            search,
            search,
            search,
            search,
            search,
            search,
            search,
            search,
            search,
            search,
            search,
        ];

        const [rows] =
            await pool.query(
                sql,
                params
            );

        return rows;
    };

/* =========================================================
   UPDATE HOSPITAL
========================================================= */

const updateHospital = async (
    id,
    {
        name,
        address = null,
        city = null,
        state = null,
        district = null,
        country = null,
        pincode = null,

        /*
         * HMS Registration Number
         */
        registration_number = null,

        /*
         * Hospital License Number
         */
        license_number = null,

        /*
         * Keep tagline in model.
         * Controller decides whether Super Admin
         * is allowed to modify it.
         */
        tagline = null,

        location = null,
        phone = null,
        email = null,
        image_url = null,
        logo_url = null,
        total_beds = 0,
        available_beds = 0,
        status = "active",
        latitude = null,
        longitude = null,
    }
) => {
    const sql = `
        UPDATE hospitals
        SET
            name = ?,
            address = ?,
            city = ?,
            state = ?,
            district = ?,
            country = ?,
            pincode = ?,
            registration_number = ?,
            license_number = ?,
            tagline = ?,
            location = ?,
            phone = ?,
            email = ?,
            image_url = ?,
            logo_url = ?,
            total_beds = ?,
            available_beds = ?,
            status = ?,
            latitude = ?,
            longitude = ?
        WHERE id = ?
    `;

    const params = [
        name,
        address,
        city,
        state,
        district,
        country,
        pincode,
        registration_number,
        license_number,
        tagline,
        location,
        phone,
        email,
        image_url,
        logo_url,
        total_beds,
        available_beds,
        status,
        latitude,
        longitude,
        id,
    ];

    const [result] =
        await pool.query(
            sql,
            params
        );

    return result;
};

/* =========================================================
   UPDATE HOSPITAL STATUS
========================================================= */

const updateHospitalStatus =
    async (
        id,
        status
    ) => {
        const sql = `
            UPDATE hospitals
            SET status = ?
            WHERE id = ?
        `;

        const [result] =
            await pool.query(
                sql,
                [
                    status,
                    id,
                ]
            );

        return result;
    };

/* =========================================================
   UPDATE HOSPITAL BEDS
========================================================= */

const updateHospitalBeds =
    async (
        id,
        totalBeds,
        availableBeds
    ) => {
        const sql = `
            UPDATE hospitals
            SET
                total_beds = ?,
                available_beds = ?
            WHERE id = ?
        `;

        const [result] =
            await pool.query(
                sql,
                [
                    totalBeds,
                    availableBeds,
                    id,
                ]
            );

        return result;
    };

/* =========================================================
   DELETE HOSPITAL
========================================================= */

const deleteHospital =
    async (id) => {
        const sql = `
            DELETE FROM hospitals
            WHERE id = ?
        `;

        const [result] =
            await pool.query(
                sql,
                [id]
            );

        return result;
    };

/* =========================================================
   COUNT HOSPITAL DATA
========================================================= */

const countByHospital =
    async (
        tableName,
        hospitalId
    ) => {
        /*
         * IMPORTANT:
         * Table name cannot be passed as a
         * normal SQL parameter.
         *
         * Keep this allow-list for safety.
         */

        const allowedTables = [
            "patients",
            "doctors",
            "appointments",
            "departments",
            "medicines",
            "lab_tests",
            "billing",
            "users",
        ];

        if (
            !allowedTables.includes(
                tableName
            )
        ) {
            throw new Error(
                `Invalid table name: ${tableName}`
            );
        }

        const sql = `
            SELECT COUNT(*) AS total
            FROM ${tableName}
            WHERE hospital_id = ?
        `;

        const [rows] =
            await pool.query(
                sql,
                [hospitalId]
            );

        return Number(
            rows?.[0]?.total || 0
        );
    };

/* =========================================================
   GET HOSPITAL STATS
========================================================= */

const getHospitalStats =
    async (hospitalId) => {
        const hospital =
            await findHospitalById(
                hospitalId
            );

        if (!hospital) {
            return null;
        }

        /*
         * Run counts independently.
         *
         * Some HMS installations may not have
         * every optional table yet.
         *
         * Therefore each count is protected.
         */

        const safeCount =
            async (
                tableName
            ) => {
                try {
                    return await countByHospital(
                        tableName,
                        hospitalId
                    );
                } catch (
                    error
                ) {
                    console.warn(
                        `Stats table ${tableName} unavailable:`,
                        error.message
                    );

                    return 0;
                }
            };

        const [
            patients,
            doctors,
            appointments,
            departments,
            medicines,
            labTests,
            billing,
            users,
        ] = await Promise.all([
            safeCount(
                "patients"
            ),
            safeCount(
                "doctors"
            ),
            safeCount(
                "appointments"
            ),
            safeCount(
                "departments"
            ),
            safeCount(
                "medicines"
            ),
            safeCount(
                "lab_tests"
            ),
            safeCount(
                "billing"
            ),
            safeCount(
                "users"
            ),
        ]);

        return {
            patients,
            doctors,
            appointments,
            departments,
            medicines,
            labTests,
            billing,
            users,

            totalBeds:
                Number(
                    hospital.total_beds ||
                        0
                ),

            availableBeds:
                Number(
                    hospital.available_beds ||
                        0
                ),

            occupiedBeds:
                Math.max(
                    0,
                    Number(
                        hospital.total_beds ||
                            0
                    ) -
                        Number(
                            hospital.available_beds ||
                                0
                        )
                ),
        };
    };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    createHospital,
    findHospitalById,
    findHospitalByName,
    findHospitalByNameExceptId,
    findAllHospitals,
    findActiveHospitals,
    searchHospitals,
    updateHospital,
    updateHospitalStatus,
    updateHospitalBeds,
    deleteHospital,
    countByHospital,
    getHospitalStats,
};
