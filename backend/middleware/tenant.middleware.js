/* =========================================================
   HMS TENANT (HOSPITAL) SCOPE MIDDLEWARE  -- NEW FILE
   Use AFTER authMiddleware:

   router.use(authMiddleware, tenantScope);

   Then in controllers/models ONLY use req.hospitalScope,
   never hospital_id from req.body / req.query / req.params
   for hospital users.
========================================================= */

const SUPER_ADMIN = "super_admin";

const toPositiveInt = (value) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const n = Number(value);

    return Number.isInteger(n) && n > 0 ? n : NaN;
};

const tenantScope = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    const role = String(req.user.role || "").trim().toLowerCase();

    // ---------------------------------------------
    // SUPER ADMIN: global. May optionally focus on
    // one hospital via ?hospital_id= / body / header
    // ---------------------------------------------
    if (role === SUPER_ADMIN) {
        const requested = toPositiveInt(
            req.query?.hospital_id ??
                req.body?.hospital_id ??
                req.headers["x-hospital-id"]
        );

        if (Number.isNaN(requested)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hospital_id",
            });
        }

        req.hospitalScope = {
            isSuperAdmin: true,
            hospitalId: requested, // null = all hospitals
        };

        return next();
    }

    // ---------------------------------------------
    // EVERY OTHER ROLE: hospital comes ONLY from token
    // ---------------------------------------------
    const hospitalId = toPositiveInt(req.user.hospital_id);

    if (!hospitalId || Number.isNaN(hospitalId)) {
        return res.status(403).json({
            success: false,
            message: "No hospital is assigned to this account",
        });
    }

    req.hospitalScope = {
        isSuperAdmin: false,
        hospitalId,
    };

    // Client-supplied hospital_id must never win
    if (req.body && typeof req.body === "object") {
        req.body.hospital_id = hospitalId;
        if ("hospitalId" in req.body) {
            req.body.hospitalId = hospitalId;
        }
    }

    next();
};

/*
 * SQL helper. `column` must be a trusted constant
 * written by you (e.g. "p.hospital_id"), never user input.
 *
 * const { clause, params } = hospitalFilter(req, "p.hospital_id");
 * pool.query(`SELECT * FROM patients p WHERE 1=1 ${clause}`, params);
 */
const hospitalFilter = (req, column = "hospital_id") => {
    const scope = req.hospitalScope;

    if (!scope || scope.hospitalId === null) {
        // Only a super admin without a chosen hospital reaches here
        if (scope && scope.isSuperAdmin) {
            return { clause: "", params: [] };
        }

        throw new Error("Hospital scope missing: use tenantScope middleware");
    }

    return { clause: ` AND ${column} = ?`, params: [scope.hospitalId] };
};

module.exports = {
    tenantScope,
    hospitalFilter,
};
