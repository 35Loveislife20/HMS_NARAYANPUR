/*
  Complaints routes (Express + mysql2, CommonJS)

  Routing rule:
    - Patient / Staff ki complaint                -> Hospital Admin (us hospital ka)
    - Patient / Staff ki complaint JO Hospital
      Admin ke KHILAF ho (againstHospitalAdmin)   -> Super Admin
    - Hospital Admin ki complaint (platform ke
      baare mein)                                 -> Super Admin

  Ye file apne aap pehchanti hai:
    1. ../config/db se database object (pool / db / connection / seedha query)
    2. aapka existing token middleware (agar mile), warna built-in JWT check
    3. role aur hospital id token ke alag-alag naamo se

  Server start hote hi console mein ek line aayegi ki kya mila.
*/

const express = require("express");

const router = express.Router();

/* =====================================================
   DATABASE (auto-detect)
===================================================== */

const dbModule = require("../config/db");

const db =
    dbModule.pool ||
    dbModule.db ||
    dbModule.connection ||
    dbModule.default ||
    dbModule;

if (
    typeof db.query !== "function" &&
    typeof db.execute !== "function"
) {
    throw new Error(
        "complaintRoutes: ../config/db se query/execute wala object nahi mila. " +
            "Is file mein `db` ko apne database object se set kijiye."
    );
}

/* mysql2 [rows, fields] aur custom helper (seedha rows) dono chalte hain */
const run = async (sql, params = []) => {
    const fn =
        typeof db.query === "function"
            ? db.query.bind(db)
            : db.execute.bind(db);

    const result = await fn(sql, params);

    if (
        Array.isArray(result) &&
        result.length === 2 &&
        (result[1] === undefined || Array.isArray(result[1]))
    ) {
        return result[0];
    }

    return result;
};

/* =====================================================
   AUTH (auto-detect)
===================================================== */

const tryRequire = (paths) => {
    for (const path of paths) {
        try {
            return require(path);
        } catch (error) {
            const missingThis =
                error.code === "MODULE_NOT_FOUND" &&
                String(error.message).includes(path);

            if (!missingThis) {
                throw error;
            }
        }
    }

    return null;
};

const pickMiddleware = (moduleValue) => {
    if (!moduleValue) {
        return null;
    }

    if (typeof moduleValue === "function") {
        return moduleValue;
    }

    const names = [
        "authenticate",
        "verifyToken",
        "protect",
        "authMiddleware",
        "authenticateToken",
        "auth",
        "requireAuth",
        "isAuthenticated",
        "verifyJWT",
    ];

    for (const name of names) {
        if (typeof moduleValue[name] === "function") {
            return moduleValue[name];
        }
    }

    return null;
};

const existingAuth = pickMiddleware(
    tryRequire([
        "../middleware/auth.middleware",
        "../middleware/auth",
        "../middleware/authMiddleware",
        "../middleware/authenticate",
        "../middlewares/auth.middleware",
        "../middlewares/auth",
    ])
);

/* fallback: seedha JWT_SECRET se token check */
const builtInAuth = (req, res, next) => {
    const jwt = require("jsonwebtoken");

    const header = req.headers.authorization || "";

    const token = header.startsWith("Bearer ")
        ? header.slice(7)
        : "";

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Authentication token missing." });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        return next();
    } catch (error) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid or expired token." });
    }
};

const authenticate = existingAuth || builtInAuth;

console.log(
    existingAuth
        ? "✅ Complaints: existing auth middleware use ho raha hai."
        : "⚠️ Complaints: existing middleware nahi mila, built-in JWT check (JWT_SECRET) use ho raha hai."
);

/* =====================================================
   ROLE + HOSPITAL ID (alag-alag token shapes)
===================================================== */

const STATUSES = ["open", "in_review", "resolved", "rejected"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const userOf = (req) => req.user || req.auth || req.admin || {};

const roleOf = (req) => {
    const user = userOf(req);

    const raw = String(
        user.role ??
            user.role_name ??
            user.roleName ??
            user.role?.name ??
            user.userRole ??
            user.type ??
            ""
    )
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (raw.includes("super")) {
        return "super_admin";
    }

    if (raw === "admin" || (raw.includes("hospital") && raw.includes("admin"))) {
        return "hospital_admin";
    }

    return raw;
};

/* hospital id HAMESHA token se (request se nahi) */
const hospitalIdOf = (req) => {
    const user = userOf(req);

    return (
        user.hospitalId ??
        user.hospital_id ??
        user.hospital?.id ??
        null
    );
};

/* ---------- 1) Public form: patient / staff ---------- */
router.post("/", async (req, res) => {
    try {
        const {
            hospitalId,
            complainantType,
            complainantName,
            complainantEmail,
            complainantPhone,
            againstHospitalAdmin,
            subject,
            message,
            priority,
        } = req.body;

        if (!hospitalId || !complainantName || !subject || !message) {
            return res.status(400).json({
                message:
                    "hospitalId, complainantName, subject and message are required.",
            });
        }

        if (!["patient", "staff"].includes(complainantType)) {
            return res
                .status(400)
                .json({ message: "complainantType must be patient or staff." });
        }

        const against = againstHospitalAdmin ? 1 : 0;

        // Hospital Admin ke khilaf -> Super Admin, baaki -> Hospital Admin
        const assignedTo = against ? "super_admin" : "hospital_admin";

        const safePriority = PRIORITIES.includes(priority) ? priority : "medium";

        const result = await run(
            `INSERT INTO complaints
             (hospital_id, complainant_type, complainant_name, complainant_email,
              complainant_phone, against_hospital_admin, subject, message,
              priority, assigned_to)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hospitalId,
                complainantType,
                complainantName.trim(),
                complainantEmail || null,
                complainantPhone || null,
                against,
                subject.trim(),
                message.trim(),
                safePriority,
                assignedTo,
            ]
        );

        res.status(201).json({ id: result.insertId, message: "Complaint submitted." });
    } catch (error) {
        console.error("Create complaint error:", error);
        res.status(500).json({ message: "Unable to submit complaint." });
    }
});

/* ---------- 2) Hospital Admin -> Super Admin ---------- */
router.post("/from-hospital", authenticate, async (req, res) => {
    try {
        if (roleOf(req) !== "hospital_admin") {
            return res.status(403).json({ message: "Only Hospital Admin can use this." });
        }

        const { subject, message, priority } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: "subject and message are required." });
        }

        const safePriority = PRIORITIES.includes(priority) ? priority : "medium";

        const result = await run(
            `INSERT INTO complaints
             (hospital_id, complainant_type, complainant_name, complainant_email,
              against_hospital_admin, subject, message, priority, assigned_to)
             VALUES (?, 'hospital_admin', ?, ?, 0, ?, ?, ?, 'super_admin')`,
            [
                hospitalIdOf(req),
                req.user?.name || "Hospital Admin",
                req.user?.email || null,
                subject.trim(),
                message.trim(),
                safePriority,
            ]
        );

        res.status(201).json({ id: result.insertId, message: "Complaint sent to Super Admin." });
    } catch (error) {
        console.error("Hospital complaint error:", error);
        res.status(500).json({ message: "Unable to send complaint." });
    }
});

/* ---------- 3) List (role ke hisaab se scope) ---------- */
router.get("/", authenticate, async (req, res) => {
    try {
        const role = roleOf(req);

        let where = "";
        const params = [];

        if (role === "super_admin") {
            where = "WHERE c.assigned_to = 'super_admin'";
        } else if (role === "hospital_admin") {
            where = "WHERE c.assigned_to = 'hospital_admin' AND c.hospital_id = ?";
            params.push(hospitalIdOf(req));
        } else {
            return res.status(403).json({ message: "Access denied." });
        }

        if (req.query.status && STATUSES.includes(req.query.status)) {
            where += " AND c.status = ?";
            params.push(req.query.status);
        }

        const order =
            "ORDER BY FIELD(c.priority,'urgent','high','medium','low'), c.created_at DESC";

        let rows;

        try {
            rows = await run(
                `SELECT c.*, h.name AS hospital_name
                 FROM complaints c
                 LEFT JOIN hospitals h ON h.id = c.hospital_id
                 ${where}
                 ${order}`,
                params
            );
        } catch (joinError) {
            /* hospitals table/column ka naam alag ho to bina naam ke bhi chalega
               (frontend hospital id se naam khud dhoondh leta hai) */
            console.warn(
                "Complaints: hospital name join fail hua, bina join ke load ho raha hai:",
                joinError.message
            );

            rows = await run(
                `SELECT c.* FROM complaints c ${where} ${order}`,
                params
            );
        }

        if (!Array.isArray(rows)) {
            rows = [];
        }

        res.json({ complaints: rows });
    } catch (error) {
        console.error("List complaints error:", error);
        res.status(500).json({ message: "Unable to load complaints." });
    }
});

/* ---------- 4) Status / reply update ---------- */
router.patch("/:id", authenticate, async (req, res) => {
    try {
        const role = roleOf(req);
        const { status, adminReply } = req.body;

        if (!STATUSES.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        let scope = "";
        const params = [status, adminReply || null, status, req.params.id];

        if (role === "super_admin") {
            scope = "AND assigned_to = 'super_admin'";
        } else if (role === "hospital_admin") {
            scope = "AND assigned_to = 'hospital_admin' AND hospital_id = ?";
            params.push(hospitalIdOf(req));
        } else {
            return res.status(403).json({ message: "Access denied." });
        }

        const result = await run(
            `UPDATE complaints
             SET status = ?, admin_reply = ?,
                 resolved_at = IF(? IN ('resolved','rejected'), NOW(), NULL)
             WHERE id = ? ${scope}`,
            params
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Complaint not found." });
        }

        res.json({ message: "Complaint updated." });
    } catch (error) {
        console.error("Update complaint error:", error);
        res.status(500).json({ message: "Unable to update complaint." });
    }
});

module.exports = router;

/*
  server.js / app.js me ek line jodiye:
      app.use("/api/complaints", require("./routes/complaintRoutes"));
*/