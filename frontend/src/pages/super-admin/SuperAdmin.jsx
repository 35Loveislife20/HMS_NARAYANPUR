import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    FaArrowRight,
    FaCopy,
    FaPrint,
    FaBell,
    FaPauseCircle,
    FaHospital,
    FaCheckCircle,
    FaChevronDown,
    FaCircleNotch,
    FaEnvelope,
    FaFilePdf,
    FaIdCard,
    FaImage,
    FaLock,
    FaMapMarkerAlt,
    FaPhone,
    FaPlus,
    FaSearch,
    FaShieldAlt,
    FaSyncAlt,
    FaTimes,
    FaTrash,
    FaUpload,
    FaUser,
    FaUserShield,
    FaUsers,
    FaExclamationTriangle,
    FaPowerOff,
    FaCog,
    FaSort,
    FaGlobe,
    FaDownload,
    FaBed,
    FaChevronLeft,
    FaChevronRight,
    FaInbox,
    FaCommentDots,
    FaLink,
    FaStamp,
    FaCertificate,
    FaAward,
    FaWhatsapp,
    FaPaperPlane,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import {
    COUNTRY_LIST,
    DEFAULT_COUNTRY,
    getStateList,
    getDistrictList,
} from "./locationData";

import "./SuperAdmin.css";

/* =========================================================
   API
========================================================= */

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const API_ORIGIN = API_BASE_URL.replace(
    /\/api\/?$/,
    ""
);

const SUPER_LOGO_FALLBACK = "/hms-logo.png";

const HOSPITAL_ENDPOINTS = [
    "/hospitals",
    "/super-admin/hospitals",
    "/admin/hospitals",
];

/* =========================================================
   EMPTY FORMS
========================================================= */

const EMPTY_SETTINGS_FORM = {
    adminName: "",
    adminEmail: "",
    adminLogo: "",
    backgroundImage: "",
    adminSignature: "",
    adminStamp: "",
};

const EMPTY_HOSPITAL_FORM = {
    hospitalName: "",
    directorName: "",
    hospitalEmail: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: DEFAULT_COUNTRY,
    district: "",
};

/* =========================================================
   ASSET URL
========================================================= */

const resolveAssetUrl = (value) => {
    if (!value) return "";

    const stringValue = String(value).trim();

    if (!stringValue) return "";

    if (
        /^https?:\/\//i.test(stringValue) ||
        /^blob:/i.test(stringValue) ||
        /^data:/i.test(stringValue)
    ) {
        return stringValue;
    }

    return `${API_ORIGIN}${stringValue.startsWith("/")
            ? stringValue
            : `/${stringValue}`
        }`;
};

/* =========================================================
   TOKEN
========================================================= */

const TOKEN_KEYS = [
    "token",
    "authToken",
    "accessToken",
    "access_token",
    "jwt",
    "jwtToken",
    "adminToken",
    "superAdminToken",
];

const getToken = () => {
    for (const key of TOKEN_KEYS) {
        const value =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (value) {
            return value.replace(/^"|"$/g, "");
        }
    }

    for (const key of [
        "user",
        "currentUser",
        "auth",
    ]) {
        const raw =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);

            const nested =
                parsed?.token ||
                parsed?.accessToken ||
                parsed?.access_token ||
                parsed?.data?.token;

            if (nested) return nested;
        } catch {
            // ignore
        }
    }

    const jwtPattern =
        /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/;

    for (const store of [
        localStorage,
        sessionStorage,
    ]) {
        for (let i = 0; i < store.length; i += 1) {
            const key = store.key(i);

            const value = (
                store.getItem(key) || ""
            ).replace(/^"|"$/g, "");

            if (jwtPattern.test(value)) {
                return value;
            }
        }
    }

    return "";
};

/* =========================================================
   STORED USER
========================================================= */

const getStoredUser = () => {
    const raw =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/* =========================================================
   CLEAR AUTH
========================================================= */

const clearAuthStorage = () => {
    const keys = [
        "token",
        "authToken",
        "user",
        "currentUser",
        "auth",
        "current_user",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};

/* =========================================================
   SAVE USER
========================================================= */

const saveStoredUser = (updatedUser) => {
    if (!updatedUser) return;

    const rawLocalUser =
        localStorage.getItem("user");

    const rawSessionUser =
        sessionStorage.getItem("user");

    if (rawLocalUser) {
        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );
    }

    if (rawSessionUser) {
        sessionStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );
    }

    if (!rawLocalUser && !rawSessionUser) {
        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );
    }

    if (localStorage.getItem("currentUser")) {
        localStorage.setItem(
            "currentUser",
            JSON.stringify(updatedUser)
        );
    }

    if (sessionStorage.getItem("currentUser")) {
        sessionStorage.setItem(
            "currentUser",
            JSON.stringify(updatedUser)
        );
    }
};

/* =========================================================
   DIRECTOR NAME FALLBACK
   Agar backend director_name save / return nahi karta, to naam yahan
   (browser me, hospital email ke hisaab se) yaad rakha jata hai taaki
   certificate par Director Name hamesha dikhe.
========================================================= */

const DIRECTOR_MAP_KEY = "hmsHospitalDirectors";

const readDirectorMap = () => {
    try {
        return JSON.parse(localStorage.getItem(DIRECTOR_MAP_KEY) || "{}") || {};
    } catch {
        return {};
    }
};

const rememberDirectorName = (email, directorName) => {
    const key = String(email || "").trim().toLowerCase();
    const value = String(directorName || "").trim();
    if (!key || !value) return;
    try {
        localStorage.setItem(
            DIRECTOR_MAP_KEY,
            JSON.stringify({ ...readDirectorMap(), [key]: value })
        );
    } catch {
        /* storage unavailable - ignore */
    }
};

/* =========================================================
   NORMALIZE HOSPITAL
========================================================= */

const normalizeHospital = (hospital) => {
    if (
        !hospital ||
        typeof hospital !== "object"
    ) {
        return null;
    }

    const id =
        hospital.id ??
        hospital.hospitalId ??
        hospital.hospital_id ??
        hospital._id;

    const name =
        hospital.hospitalName ??
        hospital.hospital_name ??
        hospital.name ??
        hospital.title ??
        "Unnamed Hospital";

    const email =
        hospital.hospitalEmail ??
        hospital.hospital_email ??
        hospital.email ??
        "";

    const phone =
        hospital.phone ??
        hospital.phoneNumber ??
        hospital.phone_number ??
        "";

    const address =
        hospital.address ??
        hospital.hospitalAddress ??
        hospital.hospital_address ??
        "";

    const city =
        hospital.city ?? "";

    const state =
        hospital.state ?? "";

    const pincode =
        hospital.pincode ??
        hospital.pinCode ??
        hospital.pin_code ??
        "";

    // Keep registration/licence data from the real API response.
    const registrationNumber =
        hospital.registrationNumber ??
        hospital.registration_number ??
        hospital.registrationNo ??
        hospital.registration_no ??
        hospital.hospitalRegistrationNumber ??
        hospital.hospital_registration_number ??
        hospital.regNo ??
        hospital.reg_no ??
        hospital.certificateNumber ??
        hospital.certificate_number ??
        "";

    const licenseNumber =
        hospital.licenseNumber ??
        hospital.license_number ??
        hospital.licenseNo ??
        hospital.license_no ??
        hospital.licenceNumber ??
        hospital.licence_number ??
        hospital.licenceNo ??
        hospital.licence_no ??
        hospital.license ??
        hospital.licence ??
        "";

    const directorFromServer = String(
        hospital.directorName ||
        hospital.director_name ||
        hospital.director ||
        hospital.ownerName ||
        hospital.owner_name ||
        ""
    ).trim();

    const directorName =
        directorFromServer ||
        readDirectorMap()[String(email || "").trim().toLowerCase()] ||
        "";

    const licenseExpiry = formatLicenseDate(
        hospital.licenseExpiry ??
        hospital.license_expiry ??
        hospital.licenceExpiry ??
        hospital.licence_expiry ??
        hospital.licenseValidUntil ??
        hospital.license_valid_until ??
        ""
    );

    const image =
        hospital.image ??
        hospital.imageUrl ??
        hospital.image_url ??
        hospital.hospitalImage ??
        hospital.hospital_image ??
        hospital.logo ??
        hospital.logo_url ??
        "";

    const statusValue =
        hospital.status ??
        hospital.isActive ??
        hospital.is_active ??
        hospital.active ??
        true;

    let isActive = true;

    if (
        statusValue === false ||
        statusValue === 0 ||
        String(statusValue).toLowerCase() ===
        "inactive" ||
        String(statusValue).toLowerCase() ===
        "false"
    ) {
        isActive = false;
    }

    return {
        ...hospital,
        id,
        name,
        hospitalName: name,
        email,
        hospitalEmail: email,
        phone,
        address,
        city,
        state,
        pincode,
        directorName,
        registrationNumber,
        licenseNumber,
        licenseExpiry,
        image,
        isActive,
        status: isActive
            ? "active"
            : "inactive",
    };
};

/* =========================================================
   ARRAY EXTRACTION
========================================================= */

const extractArray = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (
        !payload ||
        typeof payload !== "object"
    ) {
        return [];
    }

    const possibleKeys = [
        "hospitals",
        "data",
        "results",
        "items",
    ];

    for (const key of possibleKeys) {
        if (Array.isArray(payload[key])) {
            return payload[key];
        }
    }

    if (
        payload.data &&
        typeof payload.data === "object"
    ) {
        for (const key of possibleKeys) {
            if (
                Array.isArray(
                    payload.data[key]
                )
            ) {
                return payload.data[key];
            }
        }
    }

    return [];
};

/* =========================================================
   ERROR MESSAGE
========================================================= */

const getErrorMessage = async (
    response
) => {
    try {
        const data =
            await response.json();

        return (
            data?.message ||
            data?.error ||
            "Something went wrong."
        );
    } catch {
        return (
            response.statusText ||
            "Something went wrong."
        );
    }
};

/* =========================================================
   PICK FIRST
========================================================= */

const pickFirst = (...values) =>
    values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    );

/* =========================================================
   EXTRACT CREDENTIALS
========================================================= */

const extractCredentials = (
    result,
    payload
) => {
    const root =
        result &&
            typeof result === "object"
            ? result
            : {};

    const hospital =
        root.hospital ??
        root.data?.hospital ??
        (
            root.data &&
                typeof root.data === "object"
                ? root.data
                : root
        );

    const creds =
        root.credentials ??
        root.data?.credentials ??
        hospital?.credentials ??
        {};

    const loginEmail = pickFirst(
        creds.loginEmail,
        creds.email,
        creds.username,
        creds.login_email,
        root.loginEmail,
        root.login_email,
        root.email,
        root.username,
        hospital?.loginEmail,
        hospital?.login_email,
        hospital?.email,
        payload?.hospitalEmail
    ) || "";

    return {
        hospitalName:
            pickFirst(
                hospital?.hospitalName,
                hospital?.name,
                payload?.hospitalName
            ) || "",

        hospitalId:
            pickFirst(
                creds.hospitalId,
                creds.hospital_id,
                creds.loginId,
                creds.username,
                root.hospitalId,
                root.hospital_id,
                root.loginId,
                hospital?.hospitalId,
                hospital?.hospital_id,
                hospital?.loginId,
                hospital?.hospitalCode,
                hospital?.code,
                hospital?.id,
                hospital?._id
            ) || "",

        email: loginEmail,

        username:
            pickFirst(
                creds.username,
                creds.loginEmail,
                creds.email,
                root.username,
                root.loginEmail,
                root.email,
                loginEmail
            ) || "",

        password:
            pickFirst(
                creds.password,
                creds.tempPassword,
                creds.temporaryPassword,
                root.password,
                root.tempPassword,
                root.temporaryPassword,
                root.generatedPassword,
                root.plainPassword,
                hospital?.tempPassword,
                hospital?.temporaryPassword,
                hospital?.generatedPassword
            ) || "",

        loginUrl:
            pickFirst(
                creds.loginUrl,
                creds.login_url,
                root.loginUrl,
                root.login_url
            ) ||
            `${window.location.origin}/login`,

        registrationNumber:
            pickFirst(
                hospital?.registrationNumber,
                hospital?.registration_number,
                hospital?.registrationNo,
                hospital?.registration_no,
                hospital?.hospitalRegistrationNumber,
                hospital?.hospital_registration_number,
                hospital?.regNo,
                hospital?.reg_no,
                hospital?.certificateNumber,
                hospital?.certificate_number,
                root.registrationNumber,
                root.registration_number,
                root.registrationNo,
                root.registration_no,
                payload?.registrationNumber
            ) || "",

        licenseNumber:
            pickFirst(
                hospital?.licenseNumber,
                hospital?.license_number,
                hospital?.licenseNo,
                hospital?.license_no,
                hospital?.licenceNumber,
                hospital?.licence_number,
                hospital?.licenceNo,
                hospital?.licence_no,
                hospital?.license,
                hospital?.licence,
                root.licenseNumber,
                root.license_number,
                root.licenseNo,
                root.license_no,
                root.licenceNumber,
                root.licence_number,
                payload?.licenseNumber
            ) || "",

        licenseExpiry:
            pickFirst(
                hospital?.licenseExpiry,
                hospital?.license_expiry,
                hospital?.licenceExpiry,
                hospital?.licence_expiry,
                hospital?.licenseValidUntil,
                hospital?.license_valid_until,
                root.licenseExpiry,
                root.license_expiry
            ) || "",

        createdAt:
            new Date().toLocaleString(),

        emailSent:
            root.emailSent ??
            root.data?.emailSent ??
            creds.emailSent ??
            false,
    };
};

/* =========================================================
   ESCAPE HTML
========================================================= */

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/* =========================================================
   PRINT CREDENTIALS
========================================================= */

const openPrintablePage = (creds) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(creds.hospitalName || "Hospital")} - Login Credentials</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:36px;background:#eef4fb;color:#10243e;font-family:"Segoe UI",Arial,sans-serif}.sheet{max-width:760px;margin:auto;background:#fff;border:1px solid #cfe0f3;border-radius:22px;overflow:hidden;box-shadow:0 20px 55px rgba(20,55,100,.12)}.head{padding:28px 32px;background:linear-gradient(135deg,#0f4c9a,#2563eb);color:#fff}.head h1{margin:0;font-size:25px}.head p{margin:6px 0 0;opacity:.85}.badge{display:inline-block;margin-top:16px;padding:7px 12px;border:1px solid rgba(255,255,255,.35);border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.12em}.body{padding:28px 32px}.row{display:grid;grid-template-columns:220px 1fr;gap:18px;padding:14px 0;border-bottom:1px dashed #d5e1ee}.label{font-size:12px;font-weight:800;color:#60748d;text-transform:uppercase;letter-spacing:.06em}.value{font-size:15px;font-weight:700;word-break:break-word}.license{color:#135ec7;font-family:Consolas,monospace}.note{margin-top:22px;padding:14px 16px;border-radius:13px;background:#f1f7ff;border:1px solid #d8e8fb;color:#52677f;font-size:12px;line-height:1.5}.actions{max-width:760px;margin:16px auto;text-align:center}.actions button{border:0;border-radius:10px;padding:11px 22px;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}@media print{body{padding:0;background:#fff}.sheet{box-shadow:none;border:1px solid #cfe0f3}.actions{display:none}}
</style></head><body><div class="sheet"><div class="head"><h1>Hospital Management System</h1><p>Hospital Admin Login Credentials</p><span class="badge">OFFICIAL CREDENTIAL RECORD</span></div><div class="body">
<div class="row"><div class="label">Hospital Name</div><div class="value">${escapeHtml(creds.hospitalName || "-")}</div></div>
<div class="row"><div class="label">Hospital ID</div><div class="value">${escapeHtml(creds.hospitalId || "-")}</div></div>
<div class="row"><div class="label">Registration Number</div><div class="value license">${escapeHtml(creds.registrationNumber || "Not provided by API")}</div></div>
<div class="row"><div class="label">License Number</div><div class="value license">${escapeHtml(creds.licenseNumber || "Not provided by API")}</div></div>
<div class="row"><div class="label">Login Email / Username</div><div class="value">${escapeHtml(creds.email || creds.username || "-")}</div></div>
<div class="row"><div class="label">Password</div><div class="value">${escapeHtml(creds.password || "-")}</div></div>
<div class="row"><div class="label">Login URL</div><div class="value">${escapeHtml(creds.loginUrl || "-")}</div></div>
<div class="row"><div class="label">Created On</div><div class="value">${escapeHtml(creds.createdAt || "-")}</div></div>
<div class="note">Keep these credentials confidential. Change the temporary password after the first login. Registration and license numbers above are displayed from the hospital API response; no number is fabricated by the dashboard.</div>
</div></div><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),350));</script></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
};

/* "2027-10-08" / ISO date -> "08 Oct 2027" (plain text stays unchanged) */
function formatLicenseDate(value) {
    if (!value) return "";

    const text = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;

    const [y, m, d] = text.slice(0, 10).split("-").map(Number);
    const date = new Date(y, m - 1, d);

    if (Number.isNaN(date.getTime())) return text;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/* Digital signature shown on every certificate (set in Super Admin > Settings) */
const SIGNATURE_STORAGE_KEY = "hmsCertificateSignature";

let certificateSignature = "";

try {
    certificateSignature =
        localStorage.getItem(SIGNATURE_STORAGE_KEY) || "";
} catch {
    certificateSignature = "";
}

const setCertificateSignature = (value) => {
    certificateSignature = value || "";
};

/* Official stamp (muhar) shown on every certificate */
const STAMP_STORAGE_KEY = "hmsCertificateStamp";

let certificateStamp = "";

try {
    certificateStamp =
        localStorage.getItem(STAMP_STORAGE_KEY) || "";
} catch {
    certificateStamp = "";
}

const setCertificateStamp = (value) => {
    certificateStamp = value || "";
};

/* Super Admin name (Settings > Admin Name) shown on every certificate + verified badge */
const ADMIN_NAME_STORAGE_KEY = "hmsCertificateAdminName";

let certificateAdminName = "";

try {
    certificateAdminName =
        localStorage.getItem(ADMIN_NAME_STORAGE_KEY) || "";
} catch {
    certificateAdminName = "";
}

const setCertificateAdminName = (value) => {
    certificateAdminName = String(value || "").trim();

    try {
        if (certificateAdminName) {
            localStorage.setItem(ADMIN_NAME_STORAGE_KEY, certificateAdminName);
        } else {
            localStorage.removeItem(ADMIN_NAME_STORAGE_KEY);
        }
    } catch {
        /* ignore */
    }
};

/* Top-centre seal (sticker) of the certificate - set in Settings > Certificate Seal */
const SEAL_STORAGE_KEY = "hmsCertificateSeal";

let certificateSeal = "";

try {
    certificateSeal = localStorage.getItem(SEAL_STORAGE_KEY) || "";
} catch {
    certificateSeal = "";
}

const setCertificateSeal = (value) => {
    certificateSeal = value || "";
};

/* "HMS NETWORK VERIFIED" sticker (bottom-centre) - set in Settings > Verified Sticker */
const BADGE_STORAGE_KEY = "hmsCertificateBadge";

let certificateBadge = "";

try {
    certificateBadge = localStorage.getItem(BADGE_STORAGE_KEY) || "";
} catch {
    certificateBadge = "";
}

const setCertificateBadge = (value) => {
    certificateBadge = value || "";
};

const EMPTY_LOCAL_BRAND = {
    seal: { preview: "", removed: false },
    badge: { preview: "", removed: false },
};

/* Super Admin logo shown big on the left of every certificate */
let certificateLogo = "";

const setCertificateLogo = (value) => {
    certificateLogo = value || "";
};

/*
   Optional emblem for the top-centre of the certificate.
   Put your image at  frontend/public/certificate-emblem.png
   If that file does not exist the default gold HMS seal is shown.
   NOTE: the State Emblem of India is legally protected - use it only if
   you are authorised to do so.
*/
const CERTIFICATE_EMBLEM_SRC = "/certificate-emblem.png";

const BRAND_IMAGE_ACCEPT =
    "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml";

/* Reusable card: preview + upload + URL option (used for logo, background, signature, stamp) */
function BrandingCard({
    title,
    hint,
    previewClass,
    src,
    alt,
    emptyText,
    inputRef,
    onFileChange,
    uploadLabel,
    canRemove,
    onRemove,
    urlDraft,
    onUrlDraftChange,
    onApplyUrl,
    urlApplied,
    disabled,
    icon,
}) {
    const [broken, setBroken] = useState(false);

    useEffect(() => {
        setBroken(false);
    }, [src]);

    const showImage = src && !broken;

    return (
        <div className="settings-upload-card brand-card">
            <div className="settings-upload-heading">
                <div>
                    <span>{title}</span>
                    <small>{hint}</small>
                </div>

                {icon || <FaImage />}
            </div>

            <div
                className={`settings-image-preview brand-preview ${previewClass}`}
            >
                {showImage ? (
                    <img
                        src={src}
                        alt={alt}
                        onError={() => setBroken(true)}
                    />
                ) : (
                    <div className="settings-empty-image">
                        {icon || <FaImage />}
                        <span>
                            {broken
                                ? "Image could not be loaded"
                                : emptyText}
                        </span>
                    </div>
                )}
            </div>

            <div className="settings-upload-actions">
                <input
                    ref={inputRef}
                    type="file"
                    accept={BRAND_IMAGE_ACCEPT}
                    onChange={onFileChange}
                    hidden
                />

                <button
                    type="button"
                    className="settings-upload-button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                >
                    <FaUpload />
                    {uploadLabel}
                </button>

                {canRemove && (
                    <button
                        type="button"
                        className="settings-remove-button"
                        onClick={onRemove}
                        disabled={disabled}
                    >
                        <FaTrash />
                    </button>
                )}
            </div>

            <div className="brand-url-row">
                <div className="settings-input-wrap brand-url-input">
                    <FaLink className="settings-input-icon" />

                    <input
                        type="url"
                        value={urlDraft}
                        onChange={(event) =>
                            onUrlDraftChange(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                onApplyUrl();
                            }
                        }}
                        placeholder="Paste image URL"
                        disabled={disabled}
                    />
                </div>

                <button
                    type="button"
                    className="settings-upload-button brand-url-apply"
                    onClick={onApplyUrl}
                    disabled={disabled || !urlDraft.trim()}
                >
                    Use URL
                </button>
            </div>

            {urlApplied && (
                <small className="brand-url-note">
                    URL selected - click Save Settings to apply
                </small>
            )}
        </div>
    );
}

/* ---------- Tiny QR code generator (byte mode, error correction M, versions 1-10) ---------- */
const buildQrMatrix = (text) => {
    const bytes = Array.from(new TextEncoder().encode(String(text)));

    /* [ec codewords per block, [[blocks, data codewords per block], ...]] */
    const EC_TABLE = [
        null,
        [10, [[1, 16]]],
        [16, [[1, 28]]],
        [26, [[1, 44]]],
        [18, [[2, 32]]],
        [24, [[2, 43]]],
        [16, [[4, 27]]],
        [18, [[4, 31]]],
        [22, [[2, 38], [2, 39]]],
        [22, [[3, 36], [2, 37]]],
        [26, [[4, 43], [1, 44]]],
    ];
    const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

    const dataCapacity = (v) =>
        EC_TABLE[v][1].reduce((sum, [count, len]) => sum + count * len, 0);

    let version = 0;
    for (let v = 1; v <= 10; v += 1) {
        const countBits = v < 10 ? 8 : 16;
        if (4 + countBits + bytes.length * 8 <= dataCapacity(v) * 8) {
            version = v;
            break;
        }
    }
    if (!version) return null;

    /* ---- data bits ---- */
    const bits = [];
    const put = (value, length) => {
        for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
    };
    put(0b0100, 4);
    put(bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((b) => put(b, 8));

    const capacityBits = dataCapacity(version) * 8;
    put(0, Math.min(4, capacityBits - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) put(pad, 8);

    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
        data.push(byte);
    }

    /* ---- Reed-Solomon ---- */
    const EXP = new Array(512);
    const LOG = new Array(256);
    for (let i = 0, x = 1; i < 255; i += 1) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
    const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

    const ecLen = EC_TABLE[version][0];
    let generator = [1];
    for (let i = 0; i < ecLen; i += 1) {
        const next = new Array(generator.length + 1).fill(0);
        generator.forEach((coef, j) => {
            next[j] ^= coef;
            next[j + 1] ^= gfMul(coef, EXP[i]);
        });
        generator = next;
    }
    const rsRemainder = (block) => {
        const result = new Array(ecLen).fill(0);
        block.forEach((byte) => {
            const factor = byte ^ result.shift();
            result.push(0);
            generator.slice(1).forEach((coef, i) => {
                result[i] ^= gfMul(coef, factor);
            });
        });
        return result;
    };

    const dataBlocks = [];
    let offset = 0;
    EC_TABLE[version][1].forEach(([count, len]) => {
        for (let i = 0; i < count; i += 1) {
            dataBlocks.push(data.slice(offset, offset + len));
            offset += len;
        }
    });
    const ecBlocks = dataBlocks.map(rsRemainder);

    const finalBytes = [];
    const maxData = Math.max(...dataBlocks.map((b) => b.length));
    for (let i = 0; i < maxData; i += 1) {
        dataBlocks.forEach((block) => {
            if (i < block.length) finalBytes.push(block[i]);
        });
    }
    for (let i = 0; i < ecLen; i += 1) {
        ecBlocks.forEach((block) => finalBytes.push(block[i]));
    }

    /* ---- matrix ---- */
    const size = 17 + 4 * version;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFunction = (x, y, dark) => {
        modules[y][x] = dark;
        isFunction[y][x] = true;
    };

    for (let i = 0; i < size; i += 1) {
        setFunction(6, i, i % 2 === 0);
        setFunction(i, 6, i % 2 === 0);
    }

    const drawFinder = (cx, cy) => {
        for (let dy = -4; dy <= 4; dy += 1) {
            for (let dx = -4; dx <= 4; dx += 1) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < size && y >= 0 && y < size) {
                    setFunction(x, y, dist !== 2 && dist !== 4);
                }
            }
        }
    };
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);

    const alignPositions = ALIGN[version];
    alignPositions.forEach((cy, i) => {
        alignPositions.forEach((cx, j) => {
            const last = alignPositions.length - 1;
            if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
            for (let dy = -2; dy <= 2; dy += 1) {
                for (let dx = -2; dx <= 2; dx += 1) {
                    setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
                }
            }
        });
    });

    const drawFormat = (mask) => {
        const formatData = (0b00 << 3) | mask; /* error correction level M = 00 */
        let rem = formatData;
        for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const formatBits = ((formatData << 10) | rem) ^ 0x5412;
        const bit = (i) => ((formatBits >>> i) & 1) !== 0;
        for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
        setFunction(8, 7, bit(6));
        setFunction(8, 8, bit(7));
        setFunction(7, 8, bit(8));
        for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));
        for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, bit(i));
        for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, bit(i));
        setFunction(8, size - 8, true);
    };
    drawFormat(0);

    if (version >= 7) {
        let rem = version;
        for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        const versionBits = (version << 12) | rem;
        for (let i = 0; i < 18; i += 1) {
            const dark = ((versionBits >>> i) & 1) !== 0;
            const a = size - 11 + (i % 3);
            const b = Math.floor(i / 3);
            setFunction(a, b, dark);
            setFunction(b, a, dark);
        }
    }

    /* ---- place data (zig-zag) ---- */
    let bitIndex = 0;
    const totalBits = finalBytes.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert += 1) {
            for (let j = 0; j < 2; j += 1) {
                const x = right - j;
                const upward = ((right + 1) & 2) === 0;
                const y = upward ? size - 1 - vert : vert;
                if (!isFunction[y][x] && bitIndex < totalBits) {
                    modules[y][x] = ((finalBytes[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
                    bitIndex += 1;
                }
            }
        }
    }

    /* ---- masks ---- */
    const maskTest = [
        (x, y) => (x + y) % 2 === 0,
        (x, y) => y % 2 === 0,
        (x, y) => x % 3 === 0,
        (x, y) => (x + y) % 3 === 0,
        (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
        (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
        (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
        (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    const applyMask = (mask) => {
        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                if (!isFunction[y][x] && maskTest[mask](x, y)) modules[y][x] = !modules[y][x];
            }
        }
    };

    const penalty = () => {
        let score = 0;
        const runScore = (line) => {
            let run = 1;
            for (let i = 1; i < line.length; i += 1) {
                if (line[i] === line[i - 1]) {
                    run += 1;
                } else {
                    if (run >= 5) score += run - 2;
                    run = 1;
                }
            }
            if (run >= 5) score += run - 2;
        };
        for (let y = 0; y < size; y += 1) runScore(modules[y]);
        for (let x = 0; x < size; x += 1) runScore(modules.map((row) => row[x]));
        for (let y = 0; y < size - 1; y += 1) {
            for (let x = 0; x < size - 1; x += 1) {
                const c = modules[y][x];
                if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
            }
        }
        const pattern = [true, false, true, true, true, false, true, false, false, false, false];
        const reversed = [...pattern].reverse();
        const matches = (line, start, p) => p.every((v, i) => line[start + i] === v);
        const finderScore = (line) => {
            for (let i = 0; i + 11 <= line.length; i += 1) {
                if (matches(line, i, pattern)) score += 40;
                if (matches(line, i, reversed)) score += 40;
            }
        };
        for (let y = 0; y < size; y += 1) finderScore(modules[y]);
        for (let x = 0; x < size; x += 1) finderScore(modules.map((row) => row[x]));
        const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
        score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
        return score;
    };

    let bestMask = 0;
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask += 1) {
        applyMask(mask);
        drawFormat(mask);
        const score = penalty();
        if (score < bestScore) {
            bestScore = score;
            bestMask = mask;
        }
        applyMask(mask); /* undo */
    }
    applyMask(bestMask);
    drawFormat(bestMask);

    return modules;
};

/* QR code as an SVG string (works the same in print, PDF, e-mail and WhatsApp) */
const buildQrSvg = (text, pixelSize = 96) => {
    const matrix = buildQrMatrix(text);
    if (!matrix) return "";
    const quiet = 2;
    const total = matrix.length + quiet * 2;
    let path = "";
    matrix.forEach((row, y) => {
        row.forEach((dark, x) => {
            if (dark) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
        });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#111"/></svg>`;
};

/*
   Builds the certificate HTML.
   The SAME html is used for: print, Save as PDF, E-mail and WhatsApp.
   options.forExport = true  -> no auto print / no buttons / no zoom (used for PDF)
   options.images            -> optional data-URL overrides { logo, stamp, signature, emblem }
*/
const buildHospitalCertificateHtml = (hospital, options = {}) => {
    if (!hospital) return "";
    const { forExport = false, images = {} } = options;
    const c = {
        hospitalName: hospital.name || hospital.hospitalName || "",
        hospitalId: hospital.id ?? "",
        registrationNumber: hospital.registrationNumber || "",
        licenseNumber: hospital.licenseNumber || "",
        licenseExpiry: hospital.licenseExpiry || "",
        directorName: String(
            hospital.directorName ||
            hospital.director_name ||
            hospital.director ||
            hospital.ownerName ||
            hospital.owner_name ||
            ""
        ).trim(),
        email: hospital.email || "",
        phone: hospital.phone || "",
        location:
            [hospital.address, hospital.city, hospital.state].filter(Boolean).join(", ") +
            (hospital.pincode ? ` - ${hospital.pincode}` : ""),
        date: (() => {
            const raw = hospital.created_at || hospital.createdAt;
            const parsed = raw ? new Date(raw) : new Date();
            const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
            return safe.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        })(),
    };
    const e = escapeHtml;
    const pick = (override, fallback) =>
        override !== undefined ? override : fallback;
    const sigSrc = pick(images.signature, certificateSignature);
    const stampSrc = pick(images.stamp, certificateStamp);
    const logoSrc = pick(images.logo, certificateLogo);
    const sealSrc = pick(images.seal, certificateSeal);
    const badgeSrc = pick(images.badge, certificateBadge);
    const adminNameText = String(
        options.adminName !== undefined ? options.adminName : certificateAdminName
    ).trim();
    const emblemSrc = pick(images.emblem, CERTIFICATE_EMBLEM_SRC);
    const sigImg = sigSrc
        ? `<img class="sigimg" src="${e(sigSrc)}" alt="Signature"/>`
        : "";
    const stampImg = stampSrc
        ? `<img class="stampimg" src="${e(stampSrc)}" alt="Official stamp"/>`
        : "";
    const logoImg = logoSrc
        ? `<img class="logoimg" src="${e(logoSrc)}" alt="Super Admin logo"/>`
        : "";
    const emblemImg = emblemSrc && !sealSrc
        ? `<div class="abs emblem"><img src="${e(emblemSrc)}" alt="Emblem" onerror="this.parentNode.remove()"/></div>`
        : "";
    const sealImg = sealSrc
        ? `<img class="abs sealimg" src="${e(sealSrc)}" alt="Certificate seal"/>`
        : "";
    /* centre watermark: same logo, white background removed (ink mode) */
    const wmSrc = pick(images.wm, logoSrc);
    const wmImg = wmSrc
        ? `<img class="abs wmimg" src="${e(wmSrc)}" alt=""/>`
        : "";
    const qrSvg =
        buildQrSvg(
            [
                "HMS REGISTRATION CERTIFICATE",
                `Reg No: ${c.registrationNumber || "-"}`,
                `Hospital: ${String(c.hospitalName || "-").slice(0, 40)}`,
                `License: ${c.licenseNumber || "-"}`,
                `Valid Until: ${c.licenseExpiry || "-"}`,
            ].join("\n"),
            96
        ) ||
        buildQrSvg(`HMS ${c.registrationNumber || c.hospitalId}`, 96);
    /* gold "HMS NETWORK VERIFIED" badge (bottom centre) */
    const laurel = (mirror) =>
        Array.from({ length: 8 }, (_, i) => {
            const th = 250 - i * 14;
            const rad = (th * Math.PI) / 180;
            const x = 75 + 40 * Math.cos(rad);
            const y = 46 - 40 * Math.sin(rad);
            const rot = (Math.atan2(-Math.cos(rad), -Math.sin(rad)) * 180) / Math.PI + 28;
            const cx = mirror ? 150 - x : x;
            const rr = mirror ? -rot : rot;
            return `<ellipse cx="${cx.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.8" transform="rotate(${rr.toFixed(1)} ${cx.toFixed(1)} ${y.toFixed(1)})" fill="url(#vg)" stroke="#7a5b14" stroke-width=".6"/>`;
        }).join("");
    const verifiedBadge = `<div class="abs vbadge"><div class="vwrap">
<svg width="170" height="104" viewBox="0 0 170 104" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e596"/><stop offset=".55" stop-color="#cba43f"/><stop offset="1" stop-color="#8a6819"/></linearGradient><linearGradient id="vr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9cf79"/><stop offset="1" stop-color="#b98f2a"/></linearGradient></defs><g transform="translate(10 0)">${laurel(false)}${laurel(true)}</g><path d="M85 8L111 17V39C111 55 100 65 85 72C70 65 59 55 59 39V17Z" fill="url(#vg)" stroke="#7a5b14" stroke-width="1.6"/><path d="M85 14L105 21V39C105 51 97 59 85 65C73 59 65 51 65 39V21Z" fill="#b98f2a" stroke="#f8e596" stroke-width="1"/><path d="M73 39L82 48L99 29" fill="none" stroke="#fff6cf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 70H30V94H4L12 82Z" fill="#9c7a22" stroke="#7a5b14" stroke-width="1"/><path d="M166 70H140V94H166L158 82Z" fill="#9c7a22" stroke="#7a5b14" stroke-width="1"/><rect x="22" y="64" width="126" height="24" fill="url(#vr)" stroke="#7a5b14" stroke-width="1.2"/></svg>
<div class="vtxt">VERIFIED</div></div></div>`;
    /* A4 landscape = 297 x 210 mm = 1122 x 793 CSS px */
    const W = 1122, H = 793;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Certificate of Registration - ${e(c.hospitalName || "Hospital")}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=EB+Garamond:wght@400;500;600&family=UnifrakturCook:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
@page{size:297mm 210mm;margin:0}
html,body{margin:0;padding:0}
body{background:#cfcbbb;font-family:"EB Garamond","Times New Roman",serif;color:#1d2b1f}
.wrap{width:${W}px;margin:18px auto 0}
.page{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#f7f1de;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.page>svg.bg{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.abs{position:absolute}
.org{left:0;right:0;top:104px;text-align:center;font:700 36px "Cinzel","Times New Roman",serif;letter-spacing:.06em}
.sub{left:0;right:0;top:150px;text-align:center;font:500 17px "Cinzel","Times New Roman",serif;letter-spacing:.05em}
.auth{left:0;right:0;top:203px;text-align:center;font:700 16px "Cinzel","Times New Roman",serif;letter-spacing:.04em}
h1{position:absolute;left:0;right:0;top:222px;margin:0;text-align:center;font:400 62px/1.1 "UnifrakturCook","Old English Text MT","Blackadder ITC",serif;color:#111;font-weight:700}
.no{left:0;right:0;top:302px;text-align:center;font:500 21px "EB Garamond",serif}
.ref{right:90px;top:160px;text-align:center;font:500 18px "EB Garamond",serif;letter-spacing:.04em}
.ref svg{display:block;margin:4px auto 0}
.certify{left:118px;right:118px;top:334px;font-size:20.5px;line-height:1.5;text-align:justify;font-weight:500;margin:0}
.certify b{font-weight:700}
.grid{left:118px;right:118px;top:450px;display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:6px}
.f{display:flex;align-items:baseline;gap:10px;font-size:20px;min-width:0}
.f label{white-space:nowrap}
.f span{flex:1;min-width:0;border-bottom:1px solid #666e62;padding:0 4px 1px;overflow-wrap:anywhere}
.f.full{grid-column:1 / -1}
.f span.ct{font-size:20px}
.f span.one{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;overflow-wrap:normal}
.date{left:290px;bottom:148px;font:500 22px "EB Garamond",serif}
.sig{right:100px;bottom:92px;width:370px;text-align:center;font:500 15.5px "EB Garamond",serif;letter-spacing:.03em}
.sig .sigimg{display:block;margin:8px auto 8px;padding:8px 20px;max-height:66px;max-width:260px;object-fit:contain}
.stampimg{position:absolute;left:${W / 2 - 64}px;bottom:99px;width:128px;height:128px;object-fit:contain}
.logoimg{position:absolute;left:85px;top:148px;width:160px;height:160px;object-fit:contain}
.emblem{left:${W / 2 - 48}px;top:4px;width:96px;height:96px;border-radius:50%;background:#f7f1de;display:flex;align-items:center;justify-content:center}
.emblem img{max-width:80%;max-height:82%;object-fit:contain}
.sig .l{border-top:1px solid #1d2b1f;padding-top:5px;text-transform:uppercase;line-height:1.35}
.sig .sn{display:block;font:700 17px "Cinzel","Times New Roman",serif;letter-spacing:.05em;margin-bottom:2px}
.sealimg{left:${W / 2 - 60}px;top:4px;width:120px;height:96px;object-fit:contain;object-position:center top}
.wmimg{left:${W / 2 - 215}px;top:180px;width:430px;height:430px;object-fit:contain;opacity:.12}
.badgeimg{display:block;margin:0 auto;max-width:180px;max-height:92px;object-fit:contain}
.vname{margin:2px auto 0;max-width:176px;text-align:center;font:italic 600 13px "EB Garamond",serif;color:#3f2c05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vbadge{left:82px;bottom:102px;width:180px;height:104px;display:flex;align-items:center;justify-content:center;text-align:center}
.vwrap{position:relative;width:170px;height:104px;margin:0 auto}
.vwrap svg{display:block}
.vtxt{position:absolute;left:22px;width:126px;top:64px;height:24px;line-height:24px;text-align:center;font:700 14px "Cinzel","Times New Roman",serif;letter-spacing:.16em;color:#fff3c4;text-shadow:0 1px 0 #7a5b14}
.vbadge svg{display:block;margin:0 auto}
.vrib{position:relative;margin:-14px auto 0;max-width:176px;padding:3px 8px 4px;background:linear-gradient(#e9cf79,#b98f2a);border:1px solid #7a5b14;border-radius:3px;color:#3f2c05;line-height:1.2}
.vrib b{display:block;font:700 9.5px "Cinzel","Times New Roman",serif;letter-spacing:.05em}
.vrib i{display:block;font:italic 600 11px "EB Garamond",serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.foot{left:0;right:0;bottom:72px;text-align:center;font:500 11.5px "EB Garamond",serif;letter-spacing:.04em}
.actions{width:${W}px;margin:14px auto 20px;text-align:center}
.actions button{border:0;border-radius:10px;padding:12px 28px;background:#2f5d3a;color:#fff;font:600 15px "Cinzel",serif;letter-spacing:.06em;cursor:pointer}
${forExport ? ".wrap{margin:0!important}body{background:#f7f1de!important}" : ""}
@media print{
 html,body{width:297mm;height:210mm;overflow:hidden;background:#fff}
 .wrap{margin:0;zoom:1!important}
 .page{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .actions{display:none}
}
</style></head><body>
<div class="wrap" id="wrap">
<div class="page" id="page">
<svg class="bg" id="bg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <pattern id="guil" width="16" height="16" patternUnits="userSpaceOnUse">
   <rect width="16" height="16" fill="#2c5a38"/>
   <g fill="none" stroke="#6f9d78" stroke-width=".6" opacity=".85">
    <circle cx="0" cy="0" r="8"/><circle cx="16" cy="0" r="8"/><circle cx="0" cy="16" r="8"/><circle cx="16" cy="16" r="8"/><circle cx="8" cy="8" r="8"/>
   </g>
   <g fill="none" stroke="#183a22" stroke-width=".5" opacity=".8"><circle cx="8" cy="0" r="5"/><circle cx="8" cy="16" r="5"/><circle cx="0" cy="8" r="5"/><circle cx="16" cy="8" r="5"/></g>
  </pattern>
  <radialGradient id="gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#f8e596"/><stop offset=".55" stop-color="#cba43f"/><stop offset="1" stop-color="#8a6819"/></radialGradient>
  <radialGradient id="wax" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#c2b078"/><stop offset=".6" stop-color="#85743f"/><stop offset="1" stop-color="#4f4421"/></radialGradient>
  <path id="arc" d="M59,59 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"/>
  <g id="cad" fill="none" stroke="#a79a6c" stroke-linecap="round">
   <path d="M0-92V96" stroke-width="3.5"/><circle cy="-98" r="6" stroke-width="2.5"/>
   <path d="M-6-70C-40-98-85-92-112-62C-86-70-52-64-30-50C-60-52-90-40-100-22C-70-30-42-30-22-24C-44-14-62-2-70 16C-48 8-30 6-14 8" stroke-width="2.2"/>
   <path d="M6-70C40-98 85-92 112-62C86-70 52-64 30-50C60-52 90-40 100-22C70-30 42-30 22-24C44-14 62-2 70 16C48 8 30 6 14 8" stroke-width="2.2"/>
   <path d="M0-52C34-42-34-22 0-6C34 10-34 30 0 46C34 62-34 78 0 90" stroke-width="3"/>
   <path d="M0-52C-34-42 34-22 0-6C-34 10 34 30 0 46C-34 62 34 78 0 90" stroke-width="3"/>
  </g>
 </defs>

 <path id="wavyOuter" fill="url(#guil)" stroke="#173a21" stroke-width="2.5"/>
 <path id="wavyGold" fill="none" stroke="#c9a545" stroke-width="2"/>
 <path id="wavyThin" fill="none" stroke="#a9c9ae" stroke-width="1" opacity=".8"/>
 <rect x="54" y="54" width="${W - 108}" height="${H - 108}" fill="#f7f1de" stroke="#b58f2c" stroke-width="3.5"/>
 <rect x="63" y="63" width="${W - 126}" height="${H - 126}" fill="none" stroke="#1f4a2c" stroke-width="1.6"/>
 <rect x="70" y="70" width="${W - 140}" height="${H - 140}" fill="none" stroke="#b58f2c" stroke-width="1"/>

 <!-- watermarks -->
 <g opacity=".13">
${logoSrc ? "" : `  <g transform="translate(168 218)" fill="none" stroke="#9c8a55"><circle r="80" stroke-width="3"/><circle r="70" stroke-width="1"/><circle r="52" stroke-width="1" stroke-dasharray="2 3"/>
   <text y="17" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="50" fill="#9c8a55" stroke="none">HMS</text></g>`}
  <use href="#cad" transform="translate(190 590) scale(.95)"/>
  <use href="#cad" transform="translate(932 590) scale(.95)"/>
 </g>

${sealSrc ? "" : `
 <!-- gold seal (top) -->
 <g transform="translate(${W / 2} 54)">
  <path id="rosA" fill="url(#gold)" stroke="#7a5b14" stroke-width="2"/>
  <circle r="40" fill="none" stroke="#fbe9a2" stroke-width="1.8"/>
  <circle r="34" fill="none" stroke="#7a5b14" stroke-width="1" stroke-dasharray="1.5 2.5"/>
  <text y="9" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="25" fill="#5f430a">HMS</text>
 </g>
`}
 <!-- ornament -->
 <g transform="translate(${W / 2} 186)" stroke="#b58f2c"><path d="M-190 0H-14M14 0H190" stroke-width="1.5"/><path d="M0-6L6 0L0 6L-6 0Z" fill="#b58f2c" stroke="none"/><circle cx="-24" r="2" fill="#b58f2c" stroke="none"/><circle cx="24" r="2" fill="#b58f2c" stroke="none"/></g>

${stampSrc ? "" : `
 <!-- wax seal (bottom left) -->
 <g transform="translate(${W / 2} ${H - 163})">
  <path id="rosB" fill="url(#wax)" stroke="#4a3f1d" stroke-width="2"/>
  <circle r="46" fill="none" stroke="#e1d193" stroke-width="1" stroke-dasharray="2 2.2"/>
  <circle r="28" fill="none" stroke="#e1d193" stroke-width="1.5"/>
  <text y="8" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="22" fill="#f4e9bd">HMS</text>
  <g transform="translate(-59 -59)"><text font-family="Cinzel,serif" font-size="8.2" fill="#ebdfae" letter-spacing="1.3"><textPath href="#arc" startOffset="2%">CENTRAL ADMINISTRATION &#9733; HMS</textPath></text></g>
 </g>
`}
</svg>

${wmImg}${logoImg}${emblemImg}${sealImg}
<div class="abs org">HOSPITAL MANAGEMENT SYSTEM</div>
<div class="abs sub">CENTRAL ADMINISTRATION &bull; HOSPITAL NETWORK REGISTRY</div>
<div class="abs auth">THE SUPER ADMINISTRATOR, HMS</div>
<div class="abs ref">HMS-${e(String(c.hospitalId).padStart(6, "0"))}${qrSvg}</div>
<h1>Certificate of Registration</h1>
<div class="abs no">(No: ${e(c.registrationNumber || "—")} )</div>

<p class="abs certify">We hereby certify that <b>${e(c.hospitalName)}</b>${c.location.trim() ? `, located at ${e(c.location)},` : ""} has on this day been duly registered within the Hospital Management System (HMS) network.</p>

<div class="abs grid">
 <div class="f"><label>Hospital Name:</label><span class="one" style="font-size:${c.hospitalName.length > 40 ? 15 : c.hospitalName.length > 30 ? 17 : 20}px">${e(c.hospitalName || "—")}</span></div>
 <div class="f"><label>Registration Number:</label><span>${e(c.registrationNumber || "—")}</span></div>
 <div class="f"><label>License Number:</label><span>${e(c.licenseNumber || "—")}</span></div>
 <div class="f"><label>License Valid Until:</label><span>${e(c.licenseExpiry || "—")}</span></div>
 <div class="f"><label>Director Name:</label><span class="one" style="font-size:${c.directorName.length > 30 ? 15 : c.directorName.length > 24 ? 17 : 20}px">${e(c.directorName || "—")}</span></div>
 <div class="f"><label>Contact:</label><span class="ct one" style="font-size:${Math.max(13, Math.min(20, Math.floor(340 / (0.43 * Math.max(1, [c.phone, c.email].filter(Boolean).join(" | ").length)))))}px">${e([c.phone, c.email].filter(Boolean).join(" | ") || "—")}</span></div>
</div>

<div class="abs date">Date: ${e(c.date)}</div>
${stampImg}
${badgeSrc ? `<div class="abs vbadge"><img class="badgeimg" src="${e(badgeSrc)}" alt="Verified badge"/></div>` : verifiedBadge}
<div class="abs sig">${sigImg}<div class="l">${adminNameText ? `<span class="sn">${e(adminNameText)}</span>` : ""}Super Administrator<br>Hospital Management System</div></div>
<div class="abs foot">SYSTEM-GENERATED HMS NETWORK REGISTRATION CERTIFICATE - NOT A GOVERNMENT DOCUMENT</div>
</div>
${forExport ? "" : `<div class="actions"><button onclick="window.print()">Print Certificate / Save as PDF</button></div>`}
</div>
<script>
(function(){
 var W=${W},H=${H};
 function wave(inset,a,l){
  var p=[],x,y,w=W-2*inset,h=H-2*inset;
  var nx=Math.round(w/l),ny=Math.round(h/l),lx=w/nx,ly=h/ny;
  for(x=0;x<=w;x+=2)p.push([inset+x,inset+a+a*Math.sin(2*Math.PI*x/lx)]);
  for(y=0;y<=h;y+=2)p.push([W-inset-a-a*Math.sin(2*Math.PI*y/ly),inset+y]);
  for(x=w;x>=0;x-=2)p.push([inset+x,H-inset-a-a*Math.sin(2*Math.PI*x/lx)]);
  for(y=h;y>=0;y-=2)p.push([inset+a+a*Math.sin(2*Math.PI*y/ly),inset+y]);
  return "M"+p.map(function(q){return q[0].toFixed(1)+","+q[1].toFixed(1)}).join("L")+"Z";
 }
 function ros(r,n,amp){var p=[],i,t,rr;for(i=0;i<=n*8;i++){t=i/(n*8)*2*Math.PI;rr=r+amp*Math.sin(n*t);p.push((rr*Math.cos(t)).toFixed(1)+","+(rr*Math.sin(t)).toFixed(1));}return "M"+p.join("L")+"Z";}
 document.getElementById("wavyOuter").setAttribute("d",wave(2,9,38));
 document.getElementById("wavyGold").setAttribute("d",wave(20,5,38));
 document.getElementById("wavyThin").setAttribute("d",wave(30,3,38));
 var rA=document.getElementById("rosA");if(rA)rA.setAttribute("d",ros(46,28,2.6));
 var rB=document.getElementById("rosB");if(rB)rB.setAttribute("d",ros(57,26,2.6));
${forExport ? "" : `
 /* fit preview to the window (print is always 1:1 on A4) */
 var wrap=document.getElementById("wrap");
 function fit(){var z=Math.min(1,(window.innerWidth-24)/W);wrap.style.zoom=z;}
 fit();window.addEventListener("resize",fit);
 window.addEventListener("beforeprint",function(){wrap.style.zoom=1;});
 window.addEventListener("afterprint",fit);
 window.addEventListener("load",function(){setTimeout(function(){window.print()},1000);});
`}
})();
</script>
</body></html>`;
    return html;
};

/* ---------- certificate images: fetch -> crop transparent padding ---------- */

/* Converts a remote image to a data URL (returns "" if it is not a readable image) */
const imageToDataUrl = async (src) => {
    if (!src) return "";
    if (/^data:/i.test(src)) return src;
    try {
        const response = await fetch(src, { mode: "cors", credentials: "omit", cache: "reload" });
        if (!response.ok) throw new Error("image fetch failed");
        const blob = await response.blob();
        if (!/^image\//i.test(blob.type)) throw new Error("not an image");
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
};

/* Crops the transparent padding around an image and ignores tiny stray marks (e.g. corner watermark) */
const trimTransparentImage = (src) =>
    new Promise((resolve) => {
        if (!src || /^data:image\/svg/i.test(src)) {
            resolve(src);
            return;
        }

        const img = new Image();

        img.onload = () => {
            try {
                const width = img.naturalWidth;
                const height = img.naturalHeight;
                if (!width || !height) return resolve(src);

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const { data } = ctx.getImageData(0, 0, width, height);

                /* count visible pixels per grid cell */
                const GRID = 160;
                const mass = new Array(GRID * GRID).fill(0);
                for (let y = 0; y < height; y += 1) {
                    const cy = Math.min(GRID - 1, Math.floor((y * GRID) / height));
                    for (let x = 0; x < width; x += 1) {
                        if (data[(y * width + x) * 4 + 3] > 40) {
                            const cx = Math.min(GRID - 1, Math.floor((x * GRID) / width));
                            mass[cy * GRID + cx] += 1;
                        }
                    }
                }

                /* group nearby cells into blobs */
                const label = new Array(GRID * GRID).fill(-1);
                const blobs = [];
                for (let start = 0; start < mass.length; start += 1) {
                    if (!mass[start] || label[start] !== -1) continue;
                    const blob = { mass: 0, minX: GRID, minY: GRID, maxX: -1, maxY: -1 };
                    const id = blobs.length;
                    const stack = [start];
                    label[start] = id;
                    while (stack.length) {
                        const cell = stack.pop();
                        const cx = cell % GRID;
                        const cy = Math.floor(cell / GRID);
                        blob.mass += mass[cell];
                        blob.minX = Math.min(blob.minX, cx);
                        blob.maxX = Math.max(blob.maxX, cx);
                        blob.minY = Math.min(blob.minY, cy);
                        blob.maxY = Math.max(blob.maxY, cy);
                        for (let dy = -2; dy <= 2; dy += 1) {
                            for (let dx = -2; dx <= 2; dx += 1) {
                                const nx = cx + dx;
                                const ny = cy + dy;
                                if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
                                const next = ny * GRID + nx;
                                if (mass[next] && label[next] === -1) {
                                    label[next] = id;
                                    stack.push(next);
                                }
                            }
                        }
                    }
                    blobs.push(blob);
                }

                if (!blobs.length) return resolve(src);

                const biggest = Math.max(...blobs.map((b) => b.mass));
                /* keep real content; drop small marks sitting near the image edge (watermarks) */
                const inEdgeZone = (b) => {
                    const mx = (b.minX + b.maxX + 1) / 2 / GRID;
                    const my = (b.minY + b.maxY + 1) / 2 / GRID;
                    return mx < 0.12 || mx > 0.88 || my < 0.12 || my > 0.88;
                };
                const kept = blobs.filter(
                    (b) =>
                        inEdgeZone(b)
                            ? b.mass >= biggest * 0.35
                            : b.mass >= biggest * 0.01
                );

                const cellW = width / GRID;
                const cellH = height / GRID;
                const pad = 2;
                const left = Math.max(0, Math.floor(Math.min(...kept.map((b) => b.minX)) * cellW) - pad);
                const top = Math.max(0, Math.floor(Math.min(...kept.map((b) => b.minY)) * cellH) - pad);
                const right = Math.min(width, Math.ceil((Math.max(...kept.map((b) => b.maxX)) + 1) * cellW) + pad);
                const bottom = Math.min(height, Math.ceil((Math.max(...kept.map((b) => b.maxY)) + 1) * cellH) + pad);
                const cropW = right - left;
                const cropH = bottom - top;

                if (cropW <= 0 || cropH <= 0 || (cropW >= width * 0.98 && cropH >= height * 0.98)) {
                    return resolve(src);
                }

                const out = document.createElement("canvas");
                out.width = cropW;
                out.height = cropH;
                out.getContext("2d").drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
                resolve(out.toDataURL("image/png"));
            } catch {
                resolve(src);
            }
        };

        img.onerror = () => resolve(src);
        img.src = src;
    });

/*
   Makes a flat (white / single colour) image background transparent.
   Only the background that touches the image edge is removed, so white
   inside a logo / stamp stays. Already transparent images are left alone.
*/
const removeImageBackground = (src, maxSide = 1400) =>
    new Promise((resolve) => {
        if (!src || /^data:image\/svg/i.test(src)) {
            resolve(src);
            return;
        }

        const img = new Image();

        if (!/^(data|blob):/i.test(src)) img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                if (!nw || !nh) return resolve(src);

                const k = Math.min(1, maxSide / Math.max(nw, nh));
                const w = Math.max(1, Math.round(nw * k));
                const h = Math.max(1, Math.round(nh * k));

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, w, h);

                const imageData = ctx.getImageData(0, 0, w, h);
                const d = imageData.data;
                const unchanged = () =>
                    resolve(k < 1 ? canvas.toDataURL("image/png") : src);

                const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(
                    ([x, y]) => {
                        const i = (y * w + x) * 4;
                        return [d[i], d[i + 1], d[i + 2], d[i + 3]];
                    }
                );

                /* already transparent, or not a flat background */
                if (corners.some((c) => c[3] < 200)) return unchanged();

                const bg = [0, 1, 2].map(
                    (ch) => corners.reduce((sum, c) => sum + c[ch], 0) / 4
                );
                if (
                    corners.some(
                        (c) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]) > 40
                    )
                ) {
                    return unchanged();
                }

                const TOL = 55;
                const dist = (i) =>
                    Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
                const seen = new Uint8Array(w * h);
                const stack = [];
                const push = (x, y) => {
                    const p = y * w + x;
                    if (seen[p] || dist(p * 4) > TOL) return;
                    seen[p] = 1;
                    stack.push(p);
                };

                for (let x = 0; x < w; x += 1) {
                    push(x, 0);
                    push(x, h - 1);
                }
                for (let y = 0; y < h; y += 1) {
                    push(0, y);
                    push(w - 1, y);
                }

                let removed = 0;
                while (stack.length) {
                    const p = stack.pop();
                    d[p * 4 + 3] = 0;
                    removed += 1;
                    const x = p % w;
                    const y = (p - x) / w;
                    if (x > 0) push(x - 1, y);
                    if (x < w - 1) push(x + 1, y);
                    if (y > 0) push(x, y - 1);
                    if (y < h - 1) push(x, y + 1);
                }

                const ratio = removed / (w * h);
                if (ratio < 0.01 || ratio > 0.92) return unchanged();

                /* soften the edge so no white halo is left */
                for (let y = 0; y < h; y += 1) {
                    for (let x = 0; x < w; x += 1) {
                        const p = y * w + x;
                        if (seen[p]) continue;
                        const near =
                            (x > 0 && seen[p - 1]) ||
                            (x < w - 1 && seen[p + 1]) ||
                            (y > 0 && seen[p - w]) ||
                            (y < h - 1 && seen[p + w]);
                        if (!near) continue;
                        const dd = dist(p * 4);
                        if (dd < TOL * 1.8) {
                            d[p * 4 + 3] = Math.round(
                                255 * Math.min(1, Math.max(0, (dd - TOL) / (TOL * 0.8)))
                            );
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } catch {
                resolve(src);
            }
        };

        img.onerror = () => resolve(src);
        img.src = src;
    });

/*
   Signature: pen ink on light paper -> transparent background.
   Works even when the paper is not perfectly uniform (photo / scan / jpg).
*/
const removeInkBackground = (src, maxSide = 1400) =>
    new Promise((resolve) => {
        if (!src || /^data:image\/svg/i.test(src)) {
            resolve(src);
            return;
        }

        const img = new Image();

        if (!/^(data|blob):/i.test(src)) img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                if (!nw || !nh) return resolve(src);

                const k = Math.min(1, maxSide / Math.max(nw, nh));
                const w = Math.max(1, Math.round(nw * k));
                const h = Math.max(1, Math.round(nh * k));

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, w, h);

                const imageData = ctx.getImageData(0, 0, w, h);
                const d = imageData.data;

                /* already transparent: nothing to do */
                const cornerIdx = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
                if (cornerIdx.some((i) => d[i + 3] < 200)) {
                    return resolve(k < 1 ? canvas.toDataURL("image/png") : src);
                }

                /* paper colour = brightest 50% of the border pixels, averaged */
                const border = [];
                const addBorder = (x, y) => {
                    const i = (y * w + x) * 4;
                    border.push([d[i], d[i + 1], d[i + 2], d[i] + d[i + 1] + d[i + 2]]);
                };
                for (let x = 0; x < w; x += 1) {
                    addBorder(x, 0);
                    addBorder(x, h - 1);
                }
                for (let y = 0; y < h; y += 1) {
                    addBorder(0, y);
                    addBorder(w - 1, y);
                }
                border.sort((a, b) => b[3] - a[3]);
                const top = border.slice(0, Math.max(1, Math.floor(border.length / 2)));
                const bg = [0, 1, 2].map(
                    (ch) => top.reduce((sum, c) => sum + c[ch], 0) / top.length
                );

                /* the "paper" must really be light, otherwise leave the image alone */
                if (bg[0] + bg[1] + bg[2] < 540) return resolve(src);

                for (let i = 0; i < d.length; i += 4) {
                    let strength = 0;
                    for (let ch = 0; ch < 3; ch += 1) {
                        const diff = (bg[ch] - d[i + ch]) / Math.max(bg[ch], 1);
                        if (diff > strength) strength = diff;
                    }

                    const alpha = Math.min(1, Math.max(0, (strength - 0.1) / 0.45));

                    if (alpha <= 0) {
                        d[i + 3] = 0;
                        continue;
                    }

                    /* pure ink colour (removes the light paper tint from the edges) */
                    const t = Math.max(strength, 0.05);
                    for (let ch = 0; ch < 3; ch += 1) {
                        const ink = (d[i + ch] - (1 - t) * bg[ch]) / t;
                        d[i + ch] = Math.max(0, Math.min(255, Math.round(ink)));
                    }
                    d[i + 3] = Math.round(alpha * 255);
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } catch {
                resolve(src);
            }
        };

        img.onerror = () => resolve(src);
        img.src = src;
    });

const certificateImageCache = new Map();

const prepareCertificateImage = async (src, fallbackToSrc, mode = "flat") => {
    if (!src) return "";
    const key = `${fallbackToSrc ? "f" : "n"}|${mode}|${src}`;
    if (certificateImageCache.has(key)) return certificateImageCache.get(key);

    const dataUrl = await imageToDataUrl(src);
    let result = dataUrl
        ? await trimTransparentImage(
            mode === "ink"
                ? await removeInkBackground(dataUrl)
                : await removeImageBackground(dataUrl)
        )
        : "";
    if (!result && fallbackToSrc) result = src;

    if (/^data:/i.test(result)) certificateImageCache.set(key, result);
    return result;
};

/* logo, stamp, signature (+ optional emblem) ready for the certificate */
const prepareCertificateImages = async () => {
    const [logo, stamp, signature, emblem, seal, badge, wm] = await Promise.all([
        prepareCertificateImage(certificateLogo, true),
        prepareCertificateImage(certificateStamp, true),
        prepareCertificateImage(certificateSignature, true, "ink"),
        prepareCertificateImage(CERTIFICATE_EMBLEM_SRC, false),
        prepareCertificateImage(certificateSeal, true),
        prepareCertificateImage(certificateBadge, true),
        prepareCertificateImage(certificateLogo, true, "ink"),
    ]);
    return { logo, stamp, signature, emblem, seal, badge, wm };
};

/* Print / Save as PDF window */
const openHospitalCertificate = async (hospital) => {
    if (!hospital) return;

    /* open the window first (inside the click) so pop-up blockers allow it */
    const certificateWindow = window.open("", "_blank");
    if (!certificateWindow) {
        window.alert("Certificate window was blocked by the browser. Please allow pop-ups for this site and try again.");
        return;
    }

    try {
        certificateWindow.document.write(
            "<p style='font-family:sans-serif;padding:24px'>Preparing certificate...</p>"
        );
    } catch {
        /* ignore */
    }

    let images;
    try {
        images = await prepareCertificateImages();
    } catch {
        images = undefined;
    }

    const html = buildHospitalCertificateHtml(hospital, images ? { images } : {});
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    certificateWindow.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 120000);
};

/*
   Draws an inline <svg> with the browser itself (exactly like print) and swaps it for a PNG <img>.
   html2canvas cannot reliably draw SVG patterns / <use> / gradients (green border, QR),
   so that part is NOT left to it.
*/
const rasterizeSvgInDocument = async (doc, svg, scale) => {
    const rect = svg.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    if (!width || !height) return;

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(
        new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
    );

    try {
        const image = new Image();

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

        const computed = doc.defaultView.getComputedStyle(svg);
        const replacement = doc.createElement("img");

        replacement.alt = "";
        replacement.src = canvas.toDataURL("image/png");
        replacement.style.cssText = `position:${computed.position};left:${computed.left};top:${computed.top};display:${computed.display};margin:${computed.margin};width:${width}px;height:${height}px;`;

        svg.replaceWith(replacement);
    } catch {
        /* keep the original svg if the browser could not draw it */
    } finally {
        URL.revokeObjectURL(url);
    }
};

/* ---------- native (browser) renderer for the PDF ----------
   html2canvas lays text out again with its own engine, so spaces vanish / letters collide.
   Here the browser itself draws the certificate (SVG foreignObject = same layout engine as print),
   with the Google fonts embedded as base64 so they also work inside the SVG image. */
let certificateFontCssPromise = null;

const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

const getEmbeddedCertificateFontCss = () => {
    if (!certificateFontCssPromise) {
        certificateFontCssPromise = (async () => {
            const cssUrl =
                "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=EB+Garamond:wght@400;500;600&family=UnifrakturCook:wght@700&display=swap";
            const response = await fetch(cssUrl);
            if (!response.ok) throw new Error("font css not available");
            const css = await response.text();

            const allBlocks = css.match(/@font-face\s*\{[^}]*\}/g) || [];
            const latinBlocks = allBlocks.filter((block) =>
                /unicode-range:\s*U\+0000-00FF/i.test(block)
            );
            const blocks = latinBlocks.length ? latinBlocks : allBlocks;
            if (!blocks.length) throw new Error("no font faces found");

            const embedded = await Promise.all(
                blocks.map(async (block) => {
                    const match = block.match(/url\((['"]?)(https?:[^)'"]+)\1\)/);
                    if (!match) return block;
                    const fontResponse = await fetch(match[2]);
                    if (!fontResponse.ok) throw new Error("font file not available");
                    const dataUrl = await blobToDataUrl(await fontResponse.blob());
                    return block.replace(match[0], `url(${dataUrl})`);
                })
            );

            return embedded.join("\n");
        })().catch((error) => {
            certificateFontCssPromise = null;
            throw error;
        });
    }

    return certificateFontCssPromise;
};

const renderCertificateNatively = async (doc, page, W, H, scale) => {
    const fontCss = await getEmbeddedCertificateFontCss();

    const styleText = Array.from(doc.querySelectorAll("style"))
        .map((element) => element.textContent)
        .join("\n");

    const escapeXml = (text) =>
        String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");

    const pageXml = new XMLSerializer().serializeToString(page);

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
        `<foreignObject x="0" y="0" width="${W}" height="${H}">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;margin:0;padding:0;overflow:hidden;font-family:'EB Garamond','Times New Roman',serif;color:#1d2b1f;">` +
        `<style>${escapeXml(fontCss)}\n${escapeXml(styleText)}</style>` +
        `${pageXml}</div></foreignObject></svg>`;

    const image = new Image();

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("native certificate render failed"));
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });

    /* let nested images finish decoding */
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f7f1de";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    /* throws when the browser marked the canvas as tainted -> caller falls back to html2canvas */
    ctx.getImageData(0, 0, 1, 1);

    return canvas;
};

/* Logo / stamp / signature that are set but could not be loaded as real image data */
const findMissingCertificateImages = (images) => {
    const missing = [];
    const notLoaded = (configured, value) =>
        Boolean(configured) && !/^data:/i.test(value || "");

    if (notLoaded(certificateLogo, images.logo)) missing.push("Super Admin logo");
    if (notLoaded(certificateStamp, images.stamp)) missing.push("Official stamp");
    if (notLoaded(certificateSignature, images.signature)) missing.push("Signature");
    if (notLoaded(certificateSeal, images.seal)) missing.push("Certificate seal");
    if (notLoaded(certificateBadge, images.badge)) missing.push("Verified sticker");

    return missing;
};

/*
   Renders the SAME certificate html that is printed and turns it into an A4 landscape PDF.
   Used for Email and WhatsApp, so what is received looks exactly like the printed certificate.
   Needs:  npm i html2canvas jspdf
*/
const generateHospitalCertificatePdf = async (hospital, preparedImages) => {
    const W = 1122, H = 793;
    const SCALE = 2.5;

    const images = preparedImages || (await prepareCertificateImages());

    const html = buildHospitalCertificateHtml(hospital, {
        forExport: true,
        images,
    });

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px;height:${H + 40}px;border:0;pointer-events:none;`;
    document.body.appendChild(iframe);

    try {
        await new Promise((resolve) => {
            iframe.onload = resolve;
            iframe.srcdoc = html;
        });

        const doc = iframe.contentDocument;

        /* wait until the certificate fonts are really loaded (also reused for html2canvas' own clone) */
        const fontSpecs = [
            '700 36px "Cinzel"',
            '500 17px "Cinzel"',
            '600 16px "Cinzel"',
            '700 62px "UnifrakturCook"',
            '400 20px "EB Garamond"',
            '500 20px "EB Garamond"',
            '600 20px "EB Garamond"',
            '700 20px "EB Garamond"',
        ];

        const waitForFonts = async (targetDoc) => {
            if (!targetDoc?.fonts) return;

            const fontJobs = fontSpecs.map((spec) =>
                targetDoc.fonts
                    .load(spec, "Hospital Certificate 0123 VERIFIED")
                    .catch(() => null)
            );

            await Promise.race([
                Promise.all(fontJobs).then(() => targetDoc.fonts.ready),
                new Promise((resolve) => setTimeout(resolve, 6000)),
            ]);
        };

        await waitForFonts(doc);

        /* wait until every image is decoded */
        await Promise.all(
            Array.from(doc.images).map((img) =>
                img.complete
                    ? img.decode
                        ? img.decode().catch(() => null)
                        : null
                    : new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    })
            )
        );

        /* border + QR are drawn by the browser, not by html2canvas */
        for (const svg of Array.from(doc.querySelectorAll("svg"))) {
            await rasterizeSvgInDocument(doc, svg, SCALE);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const page = doc.getElementById("page");
        const { jsPDF } = await import("jspdf");

        /* 1st choice: the browser draws the certificate itself (identical to print).
           2nd choice: html2canvas, if the browser blocks that (e.g. fonts could not be fetched). */
        let canvas;

        try {
            canvas = await renderCertificateNatively(doc, page, W, H, SCALE);
        } catch (nativeError) {
            console.warn("Native certificate render failed, using html2canvas:", nativeError);

            const html2canvas = (await import("html2canvas")).default;

            canvas = await html2canvas(page, {
                scale: SCALE,
                useCORS: true,
                backgroundColor: "#f7f1de",
                logging: false,
                width: W,
                height: H,
                windowWidth: W,
                windowHeight: H + 40,
                scrollX: 0,
                scrollY: 0,
                /* html2canvas measures text inside its own clone: fonts must be loaded THERE too */
                onclone: (clonedDoc) => waitForFonts(clonedDoc),
            });
        }

        /* exact A4 landscape (297 x 210 mm) */
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.95),
            "JPEG",
            0,
            0,
            297,
            210
        );

        return pdf.output("blob");
    } finally {
        iframe.remove();
    }
};

const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
            resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

/* Frontend certificate PDF banata hai aur backend /send-welcome ko bhejta hai */
const sendWelcomeEmail = async (hospital, password, readyPdfBlob = null) => {
    try {
        const pdfBlob = readyPdfBlob || await generateHospitalCertificatePdf(hospital);
        const certificatePdfBase64 = await blobToBase64(pdfBlob);

        const res = await fetch(
            `${API_BASE_URL}/hospitals/${hospital.id}/send-welcome`,
            {
                method: "POST",
                headers: {
                    ...requestHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ certificatePdfBase64, password }),
            }
        );

        const data = await res.json().catch(() => ({}));

        return {
            emailSent: data?.emailSent === true,
            message: data?.message || "",
        };
    } catch (error) {
        return {
            emailSent: false,
            message: error?.message || "Certificate could not be generated",
        };
    }
};

const getHospitalPhone = (hospital) =>
    pickFirst(hospital?.phone, hospital?.phoneNumber, hospital?.phone_number, hospital?.mobile, hospital?.mobileNumber) || "";

/* =========================================================
   REQUEST HEADERS
========================================================= */

const requestHeaders = () => {
    const token =
        getToken();

    return {
        Accept:
            "application/json",

        ...(token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {}),
    };
};

/* =========================================================
   COMPLAINTS
========================================================= */

const COMPLAINT_STATUS_LABELS = {
    open: "Open",
    in_review: "In Review",
    resolved: "Resolved",
    rejected: "Rejected",
};

const COMPLAINT_PRIORITY_ORDER = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
};

const COMPLAINT_TYPE_LABELS = {
    patient: "Patient",
    staff: "Staff",
    hospital_admin: "Hospital Admin",
};

const normalizeComplaint = (item = {}) => ({
    id: item.id ?? item.complaint_id,
    hospitalId: item.hospitalId ?? item.hospital_id ?? null,
    hospitalName:
        item.hospitalName ??
        item.hospital_name ??
        item.hospital?.name ??
        "",
    subject: item.subject ?? item.title ?? "Complaint",
    message: item.message ?? item.description ?? "",
    priority: String(item.priority ?? "medium").toLowerCase(),
    status: String(item.status ?? "open")
        .toLowerCase()
        .replace(/\s+/g, "_"),
    complainantName:
        item.complainantName ?? item.complainant_name ?? "",
    complainantType: String(
        item.complainantType ?? item.complainant_type ?? ""
    )
        .toLowerCase()
        .replace(/\s+/g, "_"),
    complainantEmail:
        item.complainantEmail ?? item.complainant_email ?? "",
    complainantPhone:
        item.complainantPhone ?? item.complainant_phone ?? "",
    againstHospitalAdmin: Boolean(
        item.againstHospitalAdmin ?? item.against_hospital_admin
    ),
    adminReply: item.adminReply ?? item.admin_reply ?? "",
    createdAt: item.createdAt ?? item.created_at ?? "",
});

const formatComplaintDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString();
};

/* =========================================================
   COMPONENT
========================================================= */

function SuperAdmin() {
    const navigate =
        useNavigate();

    const currentUser =
        getStoredUser();

    const [
        hospitals,
        setHospitals,
    ] = useState([]);

    const [
        hospitalsLoading,
        setHospitalsLoading,
    ] = useState(true);

    const [
        hospitalError,
        setHospitalError,
    ] = useState("");

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        selectedHospital,
        setSelectedHospital,
    ] = useState(null);

    const [
        showHospitalModal,
        setShowHospitalModal,
    ] = useState(false);

    const [
        showAddHospital,
        setShowAddHospital,
    ] = useState(false);

    const [
        hospitalForm,
        setHospitalForm,
    ] = useState(
        EMPTY_HOSPITAL_FORM
    );

    const [
        addHospitalLoading,
        setAddHospitalLoading,
    ] = useState(false);

    const [
        addHospitalError,
        setAddHospitalError,
    ] = useState("");

    const [
        addHospitalSuccess,
        setAddHospitalSuccess,
    ] = useState("");

    const [
        showProfileMenu,
        setShowProfileMenu,
    ] = useState(false);

    const [
        createdCredentials,
        setCreatedCredentials,
    ] = useState(null);

    const [
        copiedField,
        setCopiedField,
    ] = useState("");

    const [
        updatingHospitalId,
        setUpdatingHospitalId,
    ] = useState(null);

    const [
        deletingHospitalId,
        setDeletingHospitalId,
    ] = useState(null);

    const [
        showSettings,
        setShowSettings,
    ] = useState(false);

    const [
        settingsForm,
        setSettingsForm,
    ] = useState(
        EMPTY_SETTINGS_FORM
    );

    const [
        siteSettings,
        setSiteSettings,
    ] = useState({
        adminName: "",
        adminEmail: "",
        adminLogo: "",
        backgroundImage: "",
        adminSignature: "",
        adminStamp: "",
    });

    const [
        settingsLoading,
        setSettingsLoading,
    ] = useState(false);

    const [
        settingsSaving,
        setSettingsSaving,
    ] = useState(false);

    const [
        settingsError,
        setSettingsError,
    ] = useState("");

    const [
        settingsSuccess,
        setSettingsSuccess,
    ] = useState("");

    const [
        adminLogoFile,
        setAdminLogoFile,
    ] = useState(null);

    const [
        backgroundImageFile,
        setBackgroundImageFile,
    ] = useState(null);

    const [
        adminLogoPreview,
        setAdminLogoPreview,
    ] = useState("");

    const [
        backgroundImagePreview,
        setBackgroundImagePreview,
    ] = useState("");

    const adminLogoInputRef =
        useRef(null);

    const backgroundInputRef =
        useRef(null);

    const adminLogoObjectUrlRef =
        useRef("");

    const backgroundObjectUrlRef =
        useRef("");

    const [signatureFile, setSignatureFile] = useState(null);

    const [signaturePreview, setSignaturePreview] = useState("");

    const [signatureRemoved, setSignatureRemoved] = useState(false);

    const signatureInputRef = useRef(null);

    const [stampFile, setStampFile] = useState(null);

    const [stampPreview, setStampPreview] = useState("");

    const [stampRemoved, setStampRemoved] = useState(false);

    const stampInputRef = useRef(null);

    /* URLs chosen instead of uploading a file (sent to backend on save) */
    const EMPTY_BRAND_URLS = {
        logo: "",
        background: "",
        signature: "",
        stamp: "",
        seal: "",
        badge: "",
    };

    const [localBrand, setLocalBrand] = useState(EMPTY_LOCAL_BRAND);

    const sealInputRef = useRef(null);

    const badgeInputRef = useRef(null);

    const [brandUrls, setBrandUrls] = useState(EMPTY_BRAND_URLS);

    const [urlDrafts, setUrlDrafts] = useState(EMPTY_BRAND_URLS);

    const userDisplayName =
        siteSettings.adminName ||
        currentUser?.name ||
        currentUser?.fullName ||
        currentUser?.username ||
        "Super Admin";

    const userEmail =
        siteSettings.adminEmail ||
        currentUser?.email ||
        "";

    const filteredHospitals =
        useMemo(() => {
            const term =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!term) {
                return hospitals;
            }

            return hospitals.filter(
                (hospital) => {
                    const searchable = [
                        hospital.name,
                        hospital.hospitalName,
                        hospital.registrationNumber,
                        hospital.email,
                        hospital.hospitalEmail,
                        hospital.phone,
                        hospital.address,
                        hospital.city,
                        hospital.state,
                        hospital.pincode,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        term
                    );
                }
            );
        }, [
            hospitals,
            searchTerm,
        ]);

    const [sortAsc, setSortAsc] = useState(true);

    const [statusFilter, setStatusFilter] = useState("all");

    const [page, setPage] = useState(1);

    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    /* in-app popup that shows the progress / result of "send credentials & certificate" */
    const [sendStatus, setSendStatus] = useState(null);

    /* when everything was sent successfully the big tick closes by itself */
    useEffect(() => {
        if (!sendStatus || sendStatus.running) return undefined;

        const active = sendStatus.steps.filter(
            (step) => step.state !== "skipped"
        );

        const allSent =
            active.length > 0 &&
            active.every((step) => step.state === "success");

        if (!allSent) return undefined;

        const timer = setTimeout(() => setSendStatus(null), 2200);

        return () => clearTimeout(timer);
    }, [sendStatus]);

    const [complaints, setComplaints] = useState([]);

    const [complaintsOpen, setComplaintsOpen] = useState(false);

    const [complaintsLoading, setComplaintsLoading] = useState(false);

    const [complaintsAvailable, setComplaintsAvailable] = useState(true);

    const [complaintsError, setComplaintsError] = useState("");

    const [complaintStatusFilter, setComplaintStatusFilter] =
        useState("open");

    const [complaintHospitalFilter, setComplaintHospitalFilter] =
        useState(null);

    const [selectedComplaintId, setSelectedComplaintId] = useState(null);

    const [complaintReply, setComplaintReply] = useState("");

    const [complaintSaving, setComplaintSaving] = useState(false);

    const loadComplaints = async (showLoader = false) => {
        if (!getToken()) {
            return;
        }

        if (showLoader) {
            setComplaintsLoading(true);
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/complaints`,
                {
                    headers: requestHeaders(),
                }
            );

            if (response.status === 404) {
                setComplaintsAvailable(false);
                setComplaints([]);
                return;
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response)
                );
            }

            const data = await response.json();

            const list = Array.isArray(data)
                ? data
                : data.complaints || data.data || [];

            setComplaints(
                list.map(normalizeComplaint)
            );

            setComplaintsAvailable(true);
            setComplaintsError("");
        } catch (error) {
            setComplaintsError(
                error.message ||
                "Unable to load complaints."
            );
        } finally {
            setComplaintsLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints(false);

        const timer = setInterval(
            () => loadComplaints(false),
            60000
        );

        return () => clearInterval(timer);
    }, []);

    const openComplaints = (hospitalId = null) => {
        setComplaintHospitalFilter(hospitalId);
        setSelectedComplaintId(null);
        setComplaintReply("");
        setComplaintStatusFilter("open");
        setComplaintsOpen(true);
        loadComplaints(true);
    };

    const openComplaintCount = useMemo(
        () =>
            complaints.filter(
                (item) => item.status === "open"
            ).length,
        [complaints]
    );

    const openComplaintsByHospital = useMemo(() => {
        const map = {};

        complaints.forEach((item) => {
            if (
                item.hospitalId != null &&
                (
                    item.status === "open" ||
                    item.status === "in_review"
                )
            ) {
                map[item.hospitalId] =
                    (map[item.hospitalId] || 0) + 1;
            }
        });

        return map;
    }, [complaints]);

    const hospitalScopedComplaints = useMemo(
        () =>
            complaints.filter(
                (item) =>
                    complaintHospitalFilter == null ||
                    String(item.hospitalId) ===
                    String(complaintHospitalFilter)
            ),
        [
            complaints,
            complaintHospitalFilter,
        ]
    );

    const complaintCounts = useMemo(
        () => ({
            open: hospitalScopedComplaints.filter(
                (i) => i.status === "open"
            ).length,

            in_review:
                hospitalScopedComplaints.filter(
                    (i) => i.status === "in_review"
                ).length,

            resolved:
                hospitalScopedComplaints.filter(
                    (i) =>
                        i.status === "resolved" ||
                        i.status === "rejected"
                ).length,

            all:
                hospitalScopedComplaints.length,
        }),
        [hospitalScopedComplaints]
    );

    const visibleComplaints = useMemo(() => {
        const list =
            hospitalScopedComplaints.filter(
                (item) => {
                    if (
                        complaintStatusFilter ===
                        "all"
                    ) {
                        return true;
                    }

                    if (
                        complaintStatusFilter ===
                        "resolved"
                    ) {
                        return (
                            item.status ===
                            "resolved" ||
                            item.status ===
                            "rejected"
                        );
                    }

                    return (
                        item.status ===
                        complaintStatusFilter
                    );
                }
            );

        return [...list].sort((a, b) => {
            const byPriority =
                (
                    COMPLAINT_PRIORITY_ORDER[
                    a.priority
                    ] ?? 9
                ) -
                (
                    COMPLAINT_PRIORITY_ORDER[
                    b.priority
                    ] ?? 9
                );

            if (byPriority !== 0) {
                return byPriority;
            }

            return (
                new Date(
                    b.createdAt || 0
                ).getTime() -
                new Date(
                    a.createdAt || 0
                ).getTime()
            );
        });
    }, [
        hospitalScopedComplaints,
        complaintStatusFilter,
    ]);

    const selectedComplaint = useMemo(
        () =>
            complaints.find(
                (item) =>
                    String(item.id) ===
                    String(selectedComplaintId)
            ) || null,
        [
            complaints,
            selectedComplaintId,
        ]
    );

    const complaintHospitalLabel = (item) =>
        item.hospitalName ||
        hospitals.find(
            (hospital) =>
                String(hospital.id) ===
                String(item.hospitalId)
        )?.name ||
        "Unknown hospital";

    const handleSelectComplaint = (item) => {
        setSelectedComplaintId(item.id);
        setComplaintReply(
            item.adminReply || ""
        );
        setComplaintsError("");
    };

    const updateComplaint = async (status) => {
        if (!selectedComplaint) {
            return;
        }

        if (
            (
                status === "resolved" ||
                status === "rejected"
            ) &&
            complaintReply.trim().length < 3
        ) {
            setComplaintsError(
                "Resolve ya reject karne se pehle reply likhna zaroori hai."
            );

            return;
        }

        setComplaintSaving(true);
        setComplaintsError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/complaints/${selectedComplaint.id}`,
                {
                    method: "PATCH",
                    headers: {
                        ...requestHeaders(),
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        status,
                        adminReply:
                            complaintReply.trim(),
                    }),
                }
            );

            if (response.status === 401) {
                throw new Error(
                    "Session expired. Please login again as Super Admin."
                );
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response)
                );
            }

            setComplaints(
                (previous) =>
                    previous.map(
                        (item) =>
                            String(item.id) ===
                                String(
                                    selectedComplaint.id
                                )
                                ? {
                                    ...item,
                                    status,
                                    adminReply:
                                        complaintReply.trim(),
                                }
                                : item
                    )
            );
        } catch (error) {
            setComplaintsError(
                error.message ||
                "Unable to update complaint."
            );
        } finally {
            setComplaintSaving(false);
        }
    };

    const hospitalStats = useMemo(() => {
        const toNumber = (value) =>
            Number(value) || 0;

        return {
            total: hospitals.length,

            active:
                hospitals.filter(
                    (item) => item.isActive
                ).length,

            inactive:
                hospitals.filter(
                    (item) => !item.isActive
                ).length,

            beds:
                hospitals.reduce(
                    (sum, item) =>
                        sum +
                        toNumber(
                            item.total_beds ??
                            item.beds ??
                            item.totalBeds
                        ),
                    0
                ),

            availableBeds:
                hospitals.reduce(
                    (sum, item) =>
                        sum +
                        toNumber(
                            item.available_beds ??
                            item.availableBeds
                        ),
                    0
                ),
        };
    }, [hospitals]);

    const statusFilteredHospitals = useMemo(() => {
        if (statusFilter === "active") {
            return filteredHospitals.filter(
                (item) => item.isActive
            );
        }

        if (statusFilter === "inactive") {
            return filteredHospitals.filter(
                (item) => !item.isActive
            );
        }

        return filteredHospitals;
    }, [
        filteredHospitals,
        statusFilter,
    ]);

    const sortedHospitals = useMemo(() => {
        return [
            ...statusFilteredHospitals,
        ].sort((a, b) => {
            const result =
                String(a.name || "").localeCompare(
                    String(b.name || ""),
                    undefined,
                    {
                        sensitivity:
                            "base",
                    }
                );

            return sortAsc
                ? result
                : -result;
        });
    }, [
        statusFilteredHospitals,
        sortAsc,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            sortedHospitals.length /
            pageSize
        )
    );

    const currentPage = Math.min(
        page,
        totalPages
    );

    const pageStart =
        (currentPage - 1) *
        pageSize;

    const pagedHospitals =
        sortedHospitals.slice(
            pageStart,
            pageStart + pageSize
        );

    useEffect(() => {
        setPage(1);
    }, [
        searchTerm,
        statusFilter,
        pageSize,
    ]);

    const handleExportCsv = () => {
        const header = [
            "Hospital Name",
            "Registration No",
            "Email",
            "Phone",
            "Address",
            "City",
            "State",
            "Pincode",
            "License",
            "Total Beds",
            "Available Beds",
            "Status",
        ];

        const clean = (value) =>
            `"${String(value ?? "").replace(
                /"/g,
                '""'
            )}"`;

        const rows =
            sortedHospitals.map(
                (item) => [
                    item.name,
                    item.registrationNumber,
                    item.email,
                    item.phone,
                    item.address,
                    item.city,
                    item.state,
                    item.pincode,
                    item.licenseNumber ||
                    item.license,
                    item.total_beds ??
                    item.beds ??
                    item.totalBeds,
                    item.available_beds ??
                    item.availableBeds,
                    item.isActive
                        ? "Active"
                        : "Inactive",
                ]
            );

        const csv = [
            header,
            ...rows,
        ]
            .map((row) =>
                row
                    .map(clean)
                    .join(",")
            )
            .join("\r\n");

        const blob = new Blob(
            ["\ufeff" + csv],
            {
                type:
                    "text/csv;charset=utf-8;",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `hospitals-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const stateOptions = useMemo(
        () =>
            getStateList(
                hospitalForm.country
            ),
        [hospitalForm.country]
    );

    const districtOptions = useMemo(
        () =>
            getDistrictList(
                hospitalForm.country,
                hospitalForm.state
            ),
        [
            hospitalForm.country,
            hospitalForm.state,
        ]
    );

    const districtIsSelect =
        stateOptions.length > 0 &&
        (
            !hospitalForm.state ||
            districtOptions.length > 0
        );

    const activeHospitals =
        useMemo(
            () =>
                hospitals.filter(
                    (hospital) =>
                        hospital.isActive
                ).length,
            [hospitals]
        );

    const hospitalCount =
        hospitals.length;

    const adminTotal =
        useMemo(
            () =>
                hospitals.reduce(
                    (
                        sum,
                        hospital
                    ) =>
                        sum +
                        (
                            Number(
                                hospital.adminCount ??
                                hospital.admin_count
                            ) ||
                            (
                                Array.isArray(
                                    hospital.admins
                                )
                                    ? hospital.admins.length
                                    : 0
                            )
                        ),
                    0
                ),
            [hospitals]
        );

    const staffTotal =
        useMemo(
            () =>
                hospitals.reduce(
                    (
                        sum,
                        hospital
                    ) =>
                        sum +
                        (
                            Number(
                                hospital.staffCount ??
                                hospital.staff_count
                            ) ||
                            (
                                Array.isArray(
                                    hospital.staff
                                )
                                    ? hospital.staff.length
                                    : 0
                            )
                        ),
                    0
                ),
            [hospitals]
        );

    const applySettings =
        useCallback(
            (settings) => {
                if (!settings) return;

                const normalized = {
                    adminName:
                        settings.adminName ??
                        settings.admin_name ??
                        "",

                    adminEmail:
                        settings.adminEmail ??
                        settings.admin_email ??
                        "",

                    adminLogo:
                        settings.superAdminLogo ??
                        settings.super_admin_logo ??
                        settings.adminLogo ??
                        settings.logo ??
                        "",

                    backgroundImage:
                        settings.loginBackgroundImage ??
                        settings.login_background_image ??
                        settings.backgroundImage ??
                        "",

                    adminSignature:
                        settings.adminSignature ??
                        settings.admin_signature ??
                        settings.superAdminSignature ??
                        settings.super_admin_signature ??
                        settings.digitalSignature ??
                        settings.digital_signature ??
                        settings.signature ??
                        "",

                    adminStamp:
                        settings.adminStamp ??
                        settings.admin_stamp ??
                        settings.superAdminStamp ??
                        settings.super_admin_stamp ??
                        settings.stamp ??
                        settings.muhar ??
                        "",
                };

                setSiteSettings(
                    normalized
                );

                setCertificateAdminName(
                    normalized.adminName
                );

                if (normalized.adminLogo) {
                    setCertificateLogo(
                        resolveAssetUrl(
                            normalized.adminLogo
                        )
                    );
                }

                if (normalized.adminSignature) {
                    setCertificateSignature(
                        resolveAssetUrl(
                            normalized.adminSignature
                        )
                    );
                }

                if (normalized.adminStamp) {
                    setCertificateStamp(
                        resolveAssetUrl(
                            normalized.adminStamp
                        )
                    );
                }

                setSettingsForm({
                    adminName:
                        normalized.adminName,

                    adminEmail:
                        normalized.adminEmail,

                    adminLogo:
                        normalized.adminLogo,

                    backgroundImage:
                        normalized.backgroundImage,

                    adminSignature:
                        normalized.adminSignature,

                    adminStamp:
                        normalized.adminStamp,
                });
            },
            []
        );

    const fetchSettings =
        useCallback(
            async (
                showLoader = true
            ) => {
                if (showLoader) {
                    setSettingsLoading(
                        true
                    );
                }

                setSettingsError("");

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/settings`,
                            {
                                method:
                                    "GET",

                                headers:
                                    requestHeaders(),
                            }
                        );

                    if (!response.ok) {
                        throw new Error(
                            await getErrorMessage(
                                response
                            )
                        );
                    }

                    const payload =
                        await response.json();

                    const settings =
                        payload?.settings ??
                        payload?.data ??
                        payload;

                    applySettings(
                        settings
                    );
                } catch (
                error
                ) {
                    console.error(
                        "Fetch settings error:",
                        error
                    );

                    setSettingsError(
                        error?.message ||
                        "Unable to load settings."
                    );
                } finally {
                    if (showLoader) {
                        setSettingsLoading(
                            false
                        );
                    }
                }
            },
            [applySettings]
        );

    const fetchHospitals =
        useCallback(
            async (
                isRefresh = false
            ) => {
                if (isRefresh) {
                    setRefreshing(
                        true
                    );
                } else {
                    setHospitalsLoading(
                        true
                    );
                }

                setHospitalError("");

                let lastError =
                    "Unable to load hospitals.";

                try {
                    for (
                        const endpoint of
                        HOSPITAL_ENDPOINTS
                    ) {
                        try {
                            const response =
                                await fetch(
                                    `${API_BASE_URL}${endpoint}`,
                                    {
                                        method:
                                            "GET",

                                        headers:
                                            requestHeaders(),
                                    }
                                );

                            if (
                                response.status ===
                                404
                            ) {
                                continue;
                            }

                            if (
                                !response.ok
                            ) {
                                lastError =
                                    await getErrorMessage(
                                        response
                                    );

                                continue;
                            }

                            const payload =
                                await response.json();

                            const list =
                                extractArray(
                                    payload
                                )
                                    .map(
                                        normalizeHospital
                                    )
                                    .filter(
                                        Boolean
                                    );

                            setHospitals(
                                list
                            );

                            return;
                        } catch (
                        error
                        ) {
                            lastError =
                                error?.message ||
                                lastError;
                        }
                    }

                    throw new Error(
                        lastError
                    );
                } catch (
                error
                ) {
                    console.error(
                        "Fetch hospitals error:",
                        error
                    );

                    setHospitalError(
                        error?.message ||
                        "Unable to load hospitals."
                    );
                } finally {
                    setHospitalsLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );
                }
            },
            []
        );

    useEffect(() => {
        fetchHospitals(false);
        fetchSettings(true);
    }, [
        fetchHospitals,
        fetchSettings,
    ]);

    useEffect(() => {
        return () => {
            if (
                adminLogoObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    adminLogoObjectUrlRef.current
                );
            }

            if (
                backgroundObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    backgroundObjectUrlRef.current
                );
            }
        };
    }, []);

    useEffect(() => {
        if (!showSettings) {
            setAdminLogoFile(null);
            setSignatureFile(null);
            setSignaturePreview("");
            setSignatureRemoved(false);
            setStampFile(null);
            setStampPreview("");
            setStampRemoved(false);
            setLocalBrand(EMPTY_LOCAL_BRAND);
            setBrandUrls(EMPTY_BRAND_URLS);
            setUrlDrafts(EMPTY_BRAND_URLS);
            setBackgroundImageFile(null);

            if (
                adminLogoObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    adminLogoObjectUrlRef.current
                );

                adminLogoObjectUrlRef.current =
                    "";
            }

            if (
                backgroundObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    backgroundObjectUrlRef.current
                );

                backgroundObjectUrlRef.current =
                    "";
            }

            setAdminLogoPreview("");
            setBackgroundImagePreview("");
        }
    }, [showSettings]);

    const handleLogout = () => {
        clearAuthStorage();

        window.dispatchEvent(
            new Event(
                "hmsAuthUpdated"
            )
        );

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    };

    const handleOpenHospital = (
        hospital
    ) => {
        setSelectedHospital(
            hospital
        );

        setShowHospitalModal(
            true
        );
    };

    const handleCloseHospital = () => {
        setShowHospitalModal(
            false
        );

        setSelectedHospital(
            null
        );
    };

    const handleOpenAddHospital =
        () => {
            setHospitalForm(
                EMPTY_HOSPITAL_FORM
            );

            setAddHospitalError("");
            setAddHospitalSuccess("");

            setShowAddHospital(
                true
            );
        };

    const handleCloseAddHospital =
        () => {
            if (
                addHospitalLoading
            ) {
                return;
            }

            setShowAddHospital(
                false
            );

            setHospitalForm(
                EMPTY_HOSPITAL_FORM
            );

            setAddHospitalError("");
            setAddHospitalSuccess("");
        };

    const handleHospitalFormChange =
        (event) => {
            const {
                name,
                value,
            } = event.target;

            setHospitalForm(
                (previous) => ({
                    ...previous,
                    [name]: value,

                    ...(name === "country"
                        ? {
                            state: "",
                            district: "",
                        }
                        : {}),

                    ...(name === "state"
                        ? {
                            district: "",
                        }
                        : {}),
                })
            );
        };

    const handleAddHospital =
        async (event) => {
            event.preventDefault();

            setAddHospitalError("");
            setAddHospitalSuccess("");
            setAddHospitalLoading(true);

            try {
                const payload = {
                    hospitalName:
                        hospitalForm.hospitalName.trim(),

                    hospitalEmail:
                        hospitalForm.hospitalEmail.trim(),

                    directorName:
                        (hospitalForm.directorName || "").trim(),

                    phone:
                        hospitalForm.phone.trim(),

                    address:
                        hospitalForm.address.trim(),

                    city:
                        hospitalForm.city.trim(),

                    state:
                        hospitalForm.state.trim(),

                    pincode:
                        hospitalForm.pincode.trim(),

                    country:
                        hospitalForm.country.trim(),

                    district:
                        hospitalForm.district.trim(),
                };

                if (
                    !payload.hospitalName
                ) {
                    throw new Error(
                        "Hospital name is required."
                    );
                }

                if (
                    !payload.hospitalEmail
                ) {
                    throw new Error(
                        "Hospital email is required."
                    );
                }

                if (!getToken()) {
                    throw new Error(
                        "Login token not found in browser storage. Please log out and log in again as Super Admin."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/hospitals`,
                        {
                            method:
                                "POST",

                            headers: {
                                ...requestHeaders(),

                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    ...payload,

                                    name:
                                        payload.hospitalName,

                                    email:
                                        payload.hospitalEmail,

                                    hospital_name:
                                        payload.hospitalName,

                                    director_name:
                                        payload.directorName,

                                    location:
                                        [
                                            payload.address,
                                            payload.city,
                                            payload.state,
                                            payload.pincode,
                                        ]
                                            .filter(
                                                Boolean
                                            )
                                            .join(
                                                ", "
                                            ),
                                }),
                        }
                    );

                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Session expired or invalid token (401). Please log out and log in again."
                    );
                }

                if (
                    !response.ok
                ) {
                    throw new Error(
                        await getErrorMessage(
                            response
                        )
                    );
                }

                let result = {};

                try {
                    result =
                        await response.json();
                } catch {
                    result = {};
                }

                rememberDirectorName(
                    payload.hospitalEmail,
                    payload.directorName
                );

                const created =
                    extractCredentials(
                        result,
                        payload
                    );

                const welcome =
                    result?.hospital &&
                        result?.credentials?.password
                        ? await sendWelcomeEmail(
                            normalizeHospital(result.hospital),
                            result.credentials.password
                        )
                        : { emailSent: false, message: "Hospital details missing" };

                created.emailSent = welcome.emailSent;

                setHospitalForm(
                    EMPTY_HOSPITAL_FORM
                );

                setShowAddHospital(
                    false
                );

                setAddHospitalSuccess(
                    ""
                );

                setCreatedCredentials(
                    created
                );

                await fetchHospitals(
                    true
                );
            } catch (
            error
            ) {
                console.error(
                    "Add hospital error:",
                    error
                );

                setAddHospitalError(
                    error?.message ||
                    "Unable to add hospital."
                );
            } finally {
                setAddHospitalLoading(
                    false
                );
            }
        };

    const handleCopyField =
        async (
            label,
            value
        ) => {
            try {
                await navigator.clipboard.writeText(
                    String(value || "")
                );

                setCopiedField(
                    label
                );

                setTimeout(
                    () =>
                        setCopiedField(
                            ""
                        ),
                    1500
                );
            } catch {
                setCopiedField("");
            }
        };

    /*
       ONE click: sends the login credentials (Email + SMS) and the registration
       certificate (Email + WhatsApp). A popup shows live progress and the final
       result of every step; a failure in one step never stops the others.
    */
    const handleSendAll = async (hospital) => {
        if (!hospital?.id) return;

        const email = hospital.email || "";
        const phone = getHospitalPhone(hospital);

        if (!email && !phone) {
            setHospitalError("Hospital email and mobile number are both not available.");
            return;
        }

        if (!getToken()) {
            setHospitalError("Authentication token not found. Please login again as Super Admin.");
            return;
        }

        const targets = [
            email && `Email (${email})`,
            phone && `SMS and WhatsApp (${phone})`,
        ]
            .filter(Boolean)
            .join(" and ");

        if (
            !window.confirm(
                `Send the login credentials and the registration certificate of "${hospital.name}" to ${targets}?\n\nA new temporary password will be generated.`
            )
        ) {
            return;
        }

        setHospitalError("");
        setUpdatingHospitalId(hospital.id);

        const hospitalName = hospital.name || hospital.hospitalName || "Hospital";

        const stepList = [
            { key: "credEmail", label: "Email - Credentials + Certificate PDF", target: email },
            { key: "credSms", label: "SMS - Login credentials", target: phone },
            { key: "certWhatsapp", label: "WhatsApp - Certificate", target: phone },
        ].map((step) => ({
            ...step,
            state: step.target ? "pending" : "skipped",
            detail: step.target ? "" : "Not available for this hospital",
        }));

        setSendStatus({ hospitalName, running: true, steps: stepList });

        const setStep = (key, state, detail = "") =>
            setSendStatus((previous) =>
                previous
                    ? {
                        ...previous,
                        steps: previous.steps.map((step) =>
                            step.key === key ? { ...step, state, detail } : step
                        ),
                    }
                    : previous
            );

        const hasTarget = (key) => stepList.find((step) => step.key === key)?.target;

        try {
            /* ---- 1. login credentials: Email + SMS ---- */
            if (hasTarget("credEmail")) setStep("credEmail", "running");
            if (hasTarget("credSms")) setStep("credSms", "running");

            const credentialEndpoints = [
                `/hospitals/${hospital.id}/send-credentials`,
                `/hospitals/${hospital.id}/resend-credentials-sms`,
                `/hospitals/${hospital.id}/send-credentials-sms`,
                `/super-admin/hospitals/${hospital.id}/resend-credentials-sms`,
            ];

            let credentialsHandled = false;
            let newPassword = "";
            let credentialsFailed = "";

            for (const endpoint of credentialEndpoints) {
                try {
                    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: "POST",
                        headers: { ...requestHeaders(), "Content-Type": "application/json" },
                        body: JSON.stringify({
                            hospitalId: hospital.id,
                            phone,
                            hospitalPhone: phone,
                            /* email goes out ONCE below (credentials + certificate PDF together) */
                            skipEmail: true,
                            sendEmail: false,
                            channels: ["sms"],
                        }),
                    });

                    if ([404, 405].includes(response.status)) continue;

                    credentialsHandled = true;

                    if (!response.ok) {
                        credentialsFailed = await getErrorMessage(response);
                        if (hasTarget("credEmail")) setStep("credEmail", "error", credentialsFailed);
                        if (hasTarget("credSms")) setStep("credSms", "error", credentialsFailed);
                        break;
                    }

                    const result = await response.json().catch(() => ({}));

                    newPassword =
                        result?.credentials?.password ||
                        result?.data?.credentials?.password ||
                        result?.password ||
                        result?.temporaryPassword ||
                        result?.tempPassword ||
                        "";

                    if (hasTarget("credSms")) {
                        if (result?.smsError) {
                            setStep("credSms", "error", result.smsError);
                        } else {
                            setStep("credSms", "success", "Sent");
                        }
                    }

                    break;
                } catch (error) {
                    credentialsHandled = true;
                    credentialsFailed = error?.message || "Failed";
                    if (hasTarget("credEmail")) setStep("credEmail", "error", credentialsFailed);
                    if (hasTarget("credSms")) setStep("credSms", "error", credentialsFailed);
                    break;
                }
            }

            if (!credentialsHandled) {
                credentialsFailed = "Server endpoint is not available.";
                if (hasTarget("credEmail")) setStep("credEmail", "error", credentialsFailed);
                if (hasTarget("credSms")) setStep("credSms", "error", credentialsFailed);
            }

            if (hasTarget("credEmail") && !credentialsFailed && !newPassword) {
                credentialsFailed = "Server did not return the new password, so the email could not be sent.";
                setStep("credEmail", "error", credentialsFailed);
            }

            /* ---- 2. certificate PDF -> ONE email (with credentials) + WhatsApp ---- */
            const needEmail = Boolean(hasTarget("credEmail")) && !credentialsFailed;
            const needWhatsapp = Boolean(hasTarget("certWhatsapp"));

            if (needEmail) setStep("credEmail", "running", "Preparing certificate...");
            if (needWhatsapp) setStep("certWhatsapp", "running", "Preparing certificate...");

            let pdfBlob = null;

            if (needEmail || needWhatsapp) {
                try {
                    const certificateImages = await prepareCertificateImages();
                    const missingImages = findMissingCertificateImages(certificateImages);

                    if (
                        missingImages.length &&
                        !window.confirm(
                            `${missingImages.join(", ")} could not be loaded into the certificate, so it would be sent without ${missingImages.length > 1 ? "them" : "it"}.\n\nThe backend must allow CORS on the uploads folder.\n\nSend the certificate anyway?`
                        )
                    ) {
                        const message = "Skipped (images could not be loaded)";
                        if (needEmail) setStep("credEmail", "skipped", message);
                        if (needWhatsapp) setStep("certWhatsapp", "skipped", message);
                    } else {
                        pdfBlob = await generateHospitalCertificatePdf(hospital, certificateImages);
                    }
                } catch (error) {
                    console.error("Certificate PDF error:", error);
                    const message = `Certificate PDF could not be generated: ${error?.message || "unknown error"}`;
                    if (needEmail) setStep("credEmail", "error", message);
                    if (needWhatsapp) setStep("certWhatsapp", "error", message);
                }
            }

            if (pdfBlob && needEmail) {
                setStep("credEmail", "running", "Sending...");

                const welcome = await sendWelcomeEmail(hospital, newPassword, pdfBlob);

                if (welcome.emailSent) {
                    setStep("credEmail", "success", "Sent");
                } else {
                    setStep("credEmail", "error", welcome.message || "Email could not be sent.");
                }
            }

            if (pdfBlob && needWhatsapp) {
                setStep("certWhatsapp", "running", "Sending...");

                try {
                    const formData = new FormData();
                    formData.append("certificate", pdfBlob, `HMS-Certificate-${hospital.id}.pdf`);
                    formData.append("channels", "whatsapp");
                    formData.append("hospitalName", hospitalName);
                    formData.append("registrationNumber", hospital.registrationNumber || "");
                    formData.append("email", email);
                    formData.append("phone", phone);

                    const response = await fetch(
                        `${API_BASE_URL}/hospitals/${hospital.id}/send-certificate`,
                        { method: "POST", headers: requestHeaders(), body: formData }
                    );

                    if (!response.ok) {
                        throw new Error(await getErrorMessage(response));
                    }

                    const result = await response.json().catch(() => ({}));
                    const wa = result?.whatsapp;

                    if (wa && wa.sent === false) {
                        const notConfigured =
                            wa.reason === "not_configured" ||
                            (!wa.reason && /not configured/i.test(wa.error || ""));

                        if (notConfigured && wa.link) {
                            window.open(wa.link, "_blank");
                            setStep("certWhatsapp", "success", "WhatsApp API is not configured - WhatsApp Web was opened, press Send there.");
                        } else {
                            /* API is configured but failed: show the real reason */
                            if (wa.link) {
                                window.open(wa.link, "_blank");
                            }

                            throw new Error(
                                `${wa.error || "WhatsApp message could not be sent."}${wa.link ? " (WhatsApp Web was opened as a backup - press Send there.)" : ""}`
                            );
                        }
                    } else {
                        setStep("certWhatsapp", "success", "Sent");
                    }
                } catch (error) {
                    console.error("Send certificate (whatsapp) error:", error);
                    setStep("certWhatsapp", "error", error?.message || "Failed");
                }
            }
        } finally {
            setSendStatus((previous) =>
                previous ? { ...previous, running: false } : previous
            );
            setUpdatingHospitalId(null);
        }
    };

    const handleToggleHospitalStatus =
        async (hospital) => {
            if (!hospital?.id) {
                return;
            }

            const nextStatus =
                hospital.isActive
                    ? "inactive"
                    : "active";

            const actionText =
                nextStatus === "active"
                    ? "activate"
                    : "deactivate";

            const confirmed =
                window.confirm(
                    `Are you sure you want to ${actionText} "${hospital.name}"?`
                );

            if (!confirmed) {
                return;
            }

            setUpdatingHospitalId(
                hospital.id
            );

            setHospitalError("");

            try {
                if (!getToken()) {
                    throw new Error(
                        "Authentication token not found. Please login again as Super Admin."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/hospitals/${hospital.id}`,
                        {
                            method:
                                "PUT",

                            headers: {
                                ...requestHeaders(),

                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    name:
                                        hospital.name,

                                    hospitalName:
                                        hospital.name,

                                    email:
                                        hospital.email ||
                                        null,

                                    hospitalEmail:
                                        hospital.email ||
                                        null,

                                    phone:
                                        hospital.phone ||
                                        null,

                                    address:
                                        hospital.address ||
                                        null,

                                    city:
                                        hospital.city ||
                                        null,

                                    state:
                                        hospital.state ||
                                        null,

                                    pincode:
                                        hospital.pincode ||
                                        null,

                                    location:
                                        [
                                            hospital.address,
                                            hospital.city,
                                            hospital.state,
                                            hospital.pincode,
                                        ]
                                            .filter(
                                                Boolean
                                            )
                                            .join(
                                                ", "
                                            ),

                                    image_url:
                                        hospital.image_url ||
                                        null,

                                    logo_url:
                                        hospital.logo_url ||
                                        null,

                                    total_beds:
                                        Number(
                                            hospital.total_beds ??
                                            hospital.totalBeds ??
                                            hospital.beds ??
                                            0
                                        ),

                                    available_beds:
                                        Number(
                                            hospital.available_beds ??
                                            hospital.availableBeds ??
                                            0
                                        ),

                                    director_name:
                                        hospital.directorName ||
                                        null,

                                    directorName:
                                        hospital.directorName ||
                                        null,

                                    status:
                                        nextStatus,
                                }),
                        }
                    );

                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Session expired. Please login again as Super Admin."
                    );
                }

                if (
                    !response.ok
                ) {
                    throw new Error(
                        await getErrorMessage(
                            response
                        )
                    );
                }

                await fetchHospitals(
                    true
                );

                if (
                    selectedHospital?.id ===
                    hospital.id
                ) {
                    setSelectedHospital(
                        (previous) =>
                            previous
                                ? {
                                    ...previous,

                                    isActive:
                                        nextStatus ===
                                        "active",

                                    status:
                                        nextStatus,
                                }
                                : previous
                    );
                }
            } catch (
            error
            ) {
                console.error(
                    "Toggle hospital status error:",
                    error
                );

                setHospitalError(
                    error?.message ||
                    "Unable to change hospital status."
                );
            } finally {
                setUpdatingHospitalId(
                    null
                );
            }
        };

    const handleDeleteHospital = (
        hospital
    ) => {
        if (!hospital?.id) {
            return;
        }

        setDeleteConfirmText("");
        setDeleteTarget(hospital);
    };

    const confirmDeleteHospital =
        async () => {
            const target =
                deleteTarget;

            if (!target) {
                return;
            }

            setDeleteTarget(null);
            setDeleteConfirmText("");

            await performDeleteHospital(
                target
            );
        };

    const performDeleteHospital =
        async (hospital) => {
            if (!hospital?.id) {
                return;
            }

            setDeletingHospitalId(
                hospital.id
            );

            setHospitalError("");

            try {
                if (!getToken()) {
                    throw new Error(
                        "Authentication token not found. Please login again as Super Admin."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/hospitals/${hospital.id}`,
                        {
                            method:
                                "DELETE",

                            headers:
                                requestHeaders(),
                        }
                    );

                if (
                    response.status ===
                    401
                ) {
                    throw new Error(
                        "Session expired. Please login again as Super Admin."
                    );
                }

                if (
                    !response.ok
                ) {
                    throw new Error(
                        await getErrorMessage(
                            response
                        )
                    );
                }

                if (
                    selectedHospital?.id ===
                    hospital.id
                ) {
                    handleCloseHospital();
                }

                await fetchHospitals(
                    true
                );
            } catch (
            error
            ) {
                console.error(
                    "Delete hospital error:",
                    error
                );

                setHospitalError(
                    error?.message ||
                    "Unable to delete hospital."
                );
            } finally {
                setDeletingHospitalId(
                    null
                );
            }
        };

    const handleOpenSettings =
        async () => {
            setShowProfileMenu(
                false
            );

            setSettingsError("");
            setSettingsSuccess("");

            setShowSettings(
                true
            );

            await fetchSettings(
                true
            );
        };

    const handleCloseSettings =
        () => {
            if (
                settingsSaving
            ) {
                return;
            }

            setShowSettings(
                false
            );

            setSettingsError("");
            setSettingsSuccess("");
        };

    const handleSettingsChange =
        (event) => {
            const {
                name,
                value,
            } = event.target;

            setSettingsForm(
                (previous) => ({
                    ...previous,
                    [name]: value,
                })
            );
        };

    const validateImage =
        (file) => {
            if (!file) return true;

            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "image/gif",
                "image/svg+xml",
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {
                throw new Error(
                    "Only JPG, JPEG, PNG, WEBP, GIF and SVG images are allowed."
                );
            }

            if (
                file.size >
                5 * 1024 * 1024
            ) {
                throw new Error(
                    "Image size must not exceed 5MB."
                );
            }

            return true;
        };

    const handleAdminLogoChange =
        (event) => {
            const file =
                event.target
                    .files?.[0];

            if (!file) return;

            try {
                validateImage(
                    file
                );

                if (
                    adminLogoObjectUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        adminLogoObjectUrlRef.current
                    );
                }

                const previewUrl =
                    URL.createObjectURL(
                        file
                    );

                adminLogoObjectUrlRef.current =
                    previewUrl;

                setAdminLogoFile(
                    file
                );

                setBrandUrl("logo", "");

                setAdminLogoPreview(
                    previewUrl
                );

                setSettingsError("");
                setSettingsSuccess("");
            } catch (
            error
            ) {
                event.target.value =
                    "";

                setSettingsError(
                    error?.message ||
                    "Invalid logo image."
                );
            }
        };

    const handleBackgroundImageChange =
        (event) => {
            const file =
                event.target
                    .files?.[0];

            if (!file) return;

            try {
                validateImage(
                    file
                );

                if (
                    backgroundObjectUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        backgroundObjectUrlRef.current
                    );
                }

                const previewUrl =
                    URL.createObjectURL(
                        file
                    );

                backgroundObjectUrlRef.current =
                    previewUrl;

                setBackgroundImageFile(
                    file
                );

                setBrandUrl("background", "");

                setBackgroundImagePreview(
                    previewUrl
                );

                setSettingsError("");
                setSettingsSuccess("");
            } catch (
            error
            ) {
                event.target.value =
                    "";

                setSettingsError(
                    error?.message ||
                    "Invalid background image."
                );
            }
        };

    const handleRemoveAdminLogo =
        () => {
            setBrandUrl("logo", "");

            setAdminLogoFile(
                null
            );

            setAdminLogoPreview(
                ""
            );

            if (
                adminLogoObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    adminLogoObjectUrlRef.current
                );

                adminLogoObjectUrlRef.current =
                    "";
            }

            if (
                adminLogoInputRef.current
            ) {
                adminLogoInputRef.current.value =
                    "";
            }
        };

    const handleRemoveBackgroundImage =
        () => {
            setBrandUrl("background", "");

            setBackgroundImageFile(
                null
            );

            setBackgroundImagePreview(
                ""
            );

            if (
                backgroundObjectUrlRef.current
            ) {
                URL.revokeObjectURL(
                    backgroundObjectUrlRef.current
                );

                backgroundObjectUrlRef.current =
                    "";
            }

            if (
                backgroundInputRef.current
            ) {
                backgroundInputRef.current.value =
                    "";
            }
        };

    const handleSignatureChange =
        (event) => {
            const file =
                event.target.files?.[0];

            if (!file) return;

            try {
                validateImage(file);

                const reader = new FileReader();

                reader.onload = async () => {
                    setSignaturePreview(
                        await removeInkBackground(
                            String(reader.result || ""),
                            900
                        )
                    );

                    setSignatureFile(file);
                    setSignatureRemoved(false);
                    setBrandUrl("signature", "");
                    setSettingsError("");
                    setSettingsSuccess("");
                };

                reader.onerror = () =>
                    setSettingsError(
                        "Unable to read the signature image."
                    );

                reader.readAsDataURL(file);
            } catch (error) {
                event.target.value = "";

                setSettingsError(
                    error?.message ||
                    "Invalid signature image."
                );
            }
        };

    const handleRemoveSignature =
        () => {
            setBrandUrl("signature", "");
            setSignatureFile(null);
            setSignaturePreview("");
            setSignatureRemoved(true);

            if (signatureInputRef.current) {
                signatureInputRef.current.value = "";
            }
        };

    const handleStampChange =
        (event) => {
            const file =
                event.target.files?.[0];

            if (!file) return;

            try {
                validateImage(file);

                const reader = new FileReader();

                reader.onload = () => {
                    setStampPreview(
                        String(reader.result || "")
                    );

                    setStampFile(file);
                    setStampRemoved(false);
                    setBrandUrl("stamp", "");
                    setSettingsError("");
                    setSettingsSuccess("");
                };

                reader.onerror = () =>
                    setSettingsError(
                        "Unable to read the stamp image."
                    );

                reader.readAsDataURL(file);
            } catch (error) {
                event.target.value = "";

                setSettingsError(
                    error?.message ||
                    "Invalid stamp image."
                );
            }
        };

    const handleRemoveStamp =
        () => {
            setBrandUrl("stamp", "");
            setStampFile(null);
            setStampPreview("");
            setStampRemoved(true);

            if (stampInputRef.current) {
                stampInputRef.current.value = "";
            }
        };

    /* certificate seal + verified sticker: upload (background auto-transparent) or URL */
    const localBrandRefs = { seal: sealInputRef, badge: badgeInputRef };

    const handleLocalBrandChange = (key, label) => (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            validateImage(file);

            const reader = new FileReader();

            reader.onload = async () => {
                const processed = await removeImageBackground(
                    String(reader.result || ""),
                    700
                );

                setLocalBrand((previous) => ({
                    ...previous,
                    [key]: { preview: processed, removed: false },
                }));
                setBrandUrl(key, "");
                setSettingsError("");
                setSettingsSuccess("");
            };

            reader.onerror = () =>
                setSettingsError(`Unable to read the ${label} image.`);

            reader.readAsDataURL(file);
        } catch (error) {
            event.target.value = "";
            setSettingsError(error?.message || `Invalid ${label} image.`);
        }
    };

    const handleLocalBrandRemove = (key) => () => {
        setBrandUrl(key, "");
        setLocalBrand((previous) => ({
            ...previous,
            [key]: { preview: "", removed: true },
        }));

        if (localBrandRefs[key].current) {
            localBrandRefs[key].current.value = "";
        }
    };

    const setBrandUrl = (key, value) =>
        setBrandUrls((previous) => ({
            ...previous,
            [key]: value,
        }));

    const setUrlDraft = (key, value) =>
        setUrlDrafts((previous) => ({
            ...previous,
            [key]: value,
        }));

    const applyBrandUrl = (key) => {
        const raw = (urlDrafts[key] || "").trim();

        if (!raw) return;

        if (!/^https?:\/\/\S+$/i.test(raw)) {
            setSettingsError(
                "Please enter a valid image URL starting with http:// or https://"
            );
            return;
        }

        /* a URL replaces any file picked for the same slot */
        if (key === "logo") {
            handleRemoveAdminLogo();
        } else if (key === "background") {
            handleRemoveBackgroundImage();
        } else if (key === "signature") {
            setSignatureFile(null);
            setSignaturePreview("");
            setSignatureRemoved(false);

            if (signatureInputRef.current) {
                signatureInputRef.current.value = "";
            }
        } else if (key === "stamp") {
            setStampFile(null);
            setStampPreview("");
            setStampRemoved(false);

            if (stampInputRef.current) {
                stampInputRef.current.value = "";
            }
        } else if (key === "seal" || key === "badge") {
            setLocalBrand((previous) => ({
                ...previous,
                [key]: { preview: "", removed: false },
            }));

            if (localBrandRefs[key].current) {
                localBrandRefs[key].current.value = "";
            }
        }

        setBrandUrl(key, raw);
        setUrlDraft(key, "");
        setSettingsError("");
        setSettingsSuccess("");
    };

    const handleSaveSettings =
        async (event) => {
            event.preventDefault();

            setSettingsSaving(
                true
            );

            setSettingsError("");
            setSettingsSuccess("");

            try {
                /* certificate assets + name are applied on this browser first,
                   so they stay updated even when the server is unreachable */
                const persistLocal = (storageKey, value, remove, apply) => {
                    if (value) {
                        try {
                            localStorage.setItem(storageKey, value);
                        } catch {
                            // storage full / blocked: used for this session only
                        }
                        apply(value);
                    } else if (remove) {
                        try {
                            localStorage.removeItem(storageKey);
                        } catch {
                            // ignore
                        }
                        apply("");
                    }
                };

                persistLocal(
                    SEAL_STORAGE_KEY,
                    localBrand.seal.preview || brandUrls.seal,
                    localBrand.seal.removed,
                    setCertificateSeal
                );
                persistLocal(
                    BADGE_STORAGE_KEY,
                    localBrand.badge.preview || brandUrls.badge,
                    localBrand.badge.removed,
                    setCertificateBadge
                );
                persistLocal(
                    SIGNATURE_STORAGE_KEY,
                    (signatureFile && signaturePreview) || brandUrls.signature,
                    signatureRemoved,
                    setCertificateSignature
                );
                persistLocal(
                    STAMP_STORAGE_KEY,
                    (stampFile && stampPreview) || brandUrls.stamp,
                    stampRemoved,
                    setCertificateStamp
                );
                setCertificateAdminName(settingsForm.adminName);
                setLocalBrand(EMPTY_LOCAL_BRAND);
                setBrandUrls((previous) => ({ ...previous, seal: "", badge: "" }));

                const formData =
                    new FormData();

                formData.append(
                    "adminName",
                    settingsForm.adminName.trim()
                );

                formData.append(
                    "adminEmail",
                    settingsForm.adminEmail.trim()
                );

                if (
                    adminLogoFile
                ) {
                    formData.append(
                        "adminLogo",
                        adminLogoFile
                    );
                }

                if (
                    backgroundImageFile
                ) {
                    formData.append(
                        "backgroundImage",
                        backgroundImageFile
                    );
                }

                if (signatureFile) {
                    formData.append(
                        "adminSignature",
                        signatureFile
                    );
                }

                if (signatureRemoved) {
                    formData.append(
                        "removeAdminSignature",
                        "true"
                    );
                }

                if (stampFile) {
                    formData.append(
                        "adminStamp",
                        stampFile
                    );
                }

                if (stampRemoved) {
                    formData.append(
                        "removeAdminStamp",
                        "true"
                    );
                }

                /* image given as URL instead of file */
                if (brandUrls.logo) {
                    formData.append("adminLogoUrl", brandUrls.logo);
                }

                if (brandUrls.background) {
                    formData.append("backgroundImageUrl", brandUrls.background);
                }

                if (brandUrls.signature) {
                    formData.append("adminSignatureUrl", brandUrls.signature);
                }

                if (brandUrls.stamp) {
                    formData.append("adminStampUrl", brandUrls.stamp);
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/settings`,
                        {
                            method:
                                "PUT",

                            headers:
                                requestHeaders(),

                            body:
                                formData,
                        }
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        await getErrorMessage(
                            response
                        )
                    );
                }

                const payload =
                    await response.json();

                const savedSettings =
                    payload?.settings ??
                    payload?.data ??
                    payload;

                applySettings(
                    savedSettings
                );

                const updatedUser = {
                    ...(getStoredUser() ||
                        {}),

                    name:
                        savedSettings?.adminName ??
                        settingsForm.adminName.trim(),

                    fullName:
                        savedSettings?.adminName ??
                        settingsForm.adminName.trim(),

                    email:
                        savedSettings?.adminEmail ??
                        settingsForm.adminEmail.trim(),
                };

                saveStoredUser(
                    updatedUser
                );

                window.dispatchEvent(
                    new Event(
                        "hmsAuthUpdated"
                    )
                );

                setAdminLogoFile(
                    null
                );

                setBackgroundImageFile(
                    null
                );

                if (
                    adminLogoObjectUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        adminLogoObjectUrlRef.current
                    );

                    adminLogoObjectUrlRef.current =
                        "";
                }

                if (
                    backgroundObjectUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        backgroundObjectUrlRef.current
                    );

                    backgroundObjectUrlRef.current =
                        "";
                }

                setAdminLogoPreview(
                    ""
                );

                setBackgroundImagePreview(
                    ""
                );

                if (
                    adminLogoInputRef.current
                ) {
                    adminLogoInputRef.current.value =
                        "";
                }

                if (
                    backgroundInputRef.current
                ) {
                    backgroundInputRef.current.value =
                        "";
                }

                const backendSignature =
                    savedSettings?.adminSignature ??
                    savedSettings?.admin_signature ??
                    savedSettings?.superAdminSignature ??
                    savedSettings?.digitalSignature ??
                    savedSettings?.signature ??
                    "";

                if (signatureFile && signaturePreview) {
                    try {
                        localStorage.setItem(
                            SIGNATURE_STORAGE_KEY,
                            signaturePreview
                        );
                    } catch {
                        // storage full / blocked: certificate still uses it this session
                    }

                    setCertificateSignature(
                        backendSignature
                            ? resolveAssetUrl(backendSignature)
                            : signaturePreview
                    );
                }

                if (brandUrls.signature && !signatureFile) {
                    try {
                        localStorage.setItem(
                            SIGNATURE_STORAGE_KEY,
                            brandUrls.signature
                        );
                    } catch {
                        // ignore
                    }

                    setCertificateSignature(
                        backendSignature
                            ? resolveAssetUrl(backendSignature)
                            : brandUrls.signature
                    );
                }

                const backendStamp =
                    savedSettings?.adminStamp ??
                    savedSettings?.admin_stamp ??
                    savedSettings?.superAdminStamp ??
                    savedSettings?.stamp ??
                    savedSettings?.muhar ??
                    "";

                const newStampValue =
                    (stampFile && stampPreview) ||
                    brandUrls.stamp ||
                    "";

                if (newStampValue) {
                    try {
                        localStorage.setItem(
                            STAMP_STORAGE_KEY,
                            newStampValue
                        );
                    } catch {
                        // ignore
                    }

                    setCertificateStamp(
                        backendStamp
                            ? resolveAssetUrl(backendStamp)
                            : newStampValue
                    );
                }

                if (stampRemoved) {
                    try {
                        localStorage.removeItem(
                            STAMP_STORAGE_KEY
                        );
                    } catch {
                        // ignore
                    }

                    setCertificateStamp("");
                }

                setStampFile(null);
                setStampPreview("");
                setStampRemoved(false);
                setBrandUrls(EMPTY_BRAND_URLS);
                setUrlDrafts(EMPTY_BRAND_URLS);

                if (stampInputRef.current) {
                    stampInputRef.current.value = "";
                }

                if (signatureRemoved) {
                    try {
                        localStorage.removeItem(
                            SIGNATURE_STORAGE_KEY
                        );
                    } catch {
                        // ignore
                    }

                    setCertificateSignature("");
                }

                setSignatureFile(null);
                setSignaturePreview("");
                setSignatureRemoved(false);

                if (signatureInputRef.current) {
                    signatureInputRef.current.value = "";
                }


                setSettingsSuccess(
                    payload?.message ||
                    "HMS settings saved successfully."
                );

                await fetchSettings(
                    false
                );
            } catch (
            error
            ) {
                console.error(
                    "Save settings error:",
                    error
                );

                setSettingsError(
                    `${error?.message || "Unable to save settings."} - ` +
                    "Certificate logo, seal, stamp, signature, verified sticker and name are still updated on this browser."
                );
            } finally {
                setSettingsSaving(
                    false
                );
            }
        };

    const headerLogo =
        resolveAssetUrl(
            siteSettings.adminLogo ||
            SUPER_LOGO_FALLBACK
        );

    const currentBackground =
        backgroundImagePreview ||
        resolveAssetUrl(
            siteSettings.backgroundImage
        );

    return (
        <div
            className="super-admin-page"
            style={
                currentBackground
                    ? {
                        "--super-admin-background-image":
                            `url("${currentBackground}")`,
                    }
                    : undefined
            }
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <header className="super-admin-header">

                <div className="header-brand">

                    <img
                        src={headerLogo}
                        alt="HMS Logo"
                        className="header-logo super-admin-header-logo"
                        onError={(event) => {
                            if (
                                event.currentTarget.src.endsWith(
                                    SUPER_LOGO_FALLBACK
                                )
                            ) {
                                return;
                            }

                            event.currentTarget.src =
                                SUPER_LOGO_FALLBACK;
                        }}
                    />

                    <div className="header-brand-text">

                        <div className="header-title">
                            Hospital Management System
                        </div>

                        <div className="header-divider" />

                        <div className="header-role">
                            Super Admin
                        </div>

                    </div>

                </div>

                <div className="header-right">

                    <button
                        type="button"
                        className="notif-button"
                        aria-label="Notifications"
                        onClick={() =>
                            openComplaints()
                        }
                    >
                        <FaBell />

                        {openComplaintCount > 0 && (
                            <span className="notif-dot">
                                {openComplaintCount}
                            </span>
                        )}
                    </button>

                    <div className="header-profile-wrap">

                        <button
                            type="button"
                            className="profile-button"
                        >

                            <span className="profile-avatar">
                                {(
                                    userDisplayName
                                        .split(" ")
                                        .filter(Boolean)
                                        .map(
                                            (word) =>
                                                word[0]
                                        )
                                        .join("")
                                        .slice(
                                            0,
                                            2
                                        ) ||
                                    "SA"
                                ).toUpperCase()}
                            </span>

                            <span className="profile-text">

                                <strong>
                                    {
                                        userDisplayName
                                    }
                                </strong>

                                <small>
                                    Super Admin
                                </small>

                            </span>

                        </button>

                    </div>

                    <button
                        type="button"
                        className="header-gear-button"
                        onClick={
                            handleOpenSettings
                        }
                        title="Settings"
                        aria-label="Settings"
                    >
                        <FaCog />
                    </button>

                    <button
                        type="button"
                        className="header-power-button"
                        onClick={
                            handleLogout
                        }
                        title="Logout"
                    >
                        <FaPowerOff />
                    </button>

                </div>

            </header>

            {/* =================================================
                STATUS MARQUEE
            ================================================= */}

            <div className="emergency-marquee">

                <div className="emergency-label">

                    <span className="emergency-pulse" />

                    SYSTEM STATUS

                </div>

                <div className="emergency-track-wrap">

                    <div className="emergency-track">

                        <span>
                            HMS CENTRAL CONTROL
                            PANEL
                        </span>

                        <span>
                            HOSPITAL NETWORK
                            ONLINE
                        </span>

                        <span>
                            ALL CORE SERVICES
                            OPERATIONAL
                        </span>

                        <span>
                            SECURE ADMIN ACCESS
                        </span>

                    </div>

                </div>

            </div>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="super-admin-main">

                <div className="top-toolbar">

                    <section className="directory-bar">

                        <div className="directory-heading">

                            <span className="directory-icon">
                                <FaHospital />
                            </span>

                            <div>

                                <h1>
                                    Hospitals
                                </h1>

                                <p>
                                    Manage and monitor
                                    all hospitals
                                    connected to HMS.
                                </p>

                            </div>

                        </div>

                        <div className="directory-actions">

                            <div className="search-box">

                                <FaSearch className="search-icon" />

                                <input
                                    type="text"
                                    value={
                                        searchTerm
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchTerm(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search hospitals..."
                                />

                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="clear-search"
                                        onClick={() =>
                                            setSearchTerm(
                                                ""
                                            )
                                        }
                                        aria-label="Clear search"
                                    >
                                        <FaTimes />
                                    </button>
                                )}

                            </div>

                            <button
                                type="button"
                                className="refresh-button"
                                onClick={() =>
                                    fetchHospitals(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                            >
                                <FaSyncAlt
                                    className={
                                        refreshing
                                            ? "refresh-spin"
                                            : ""
                                    }
                                />

                                Refresh
                            </button>

                            <button
                                type="button"
                                className="add-hospital-button"
                                onClick={
                                    handleOpenAddHospital
                                }
                            >
                                <FaPlus />

                                Add Hospital
                            </button>

                        </div>

                    </section>

                    <section className="filter-bar">

                        <div className="filter-tabs">

                            {[
                                [
                                    "all",
                                    "All",
                                    hospitalStats.total,
                                ],
                                [
                                    "active",
                                    "Active",
                                    hospitalStats.active,
                                ],
                                [
                                    "inactive",
                                    "Inactive",
                                    hospitalStats.inactive,
                                ],
                            ].map(
                                ([
                                    key,
                                    label,
                                    count,
                                ]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`filter-tab ${statusFilter ===
                                                key
                                                ? "active"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setStatusFilter(
                                                key
                                            )
                                        }
                                    >
                                        {label}
                                        <span>
                                            {count}
                                        </span>
                                    </button>
                                )
                            )}

                        </div>

                        <div className="filter-actions">

                            <button
                                type="button"
                                className="complaints-button"
                                onClick={() =>
                                    openComplaints()
                                }
                            >
                                <FaCommentDots />
                                Complaints

                                {openComplaintCount >
                                    0 && (
                                        <span className="complaints-button-count">
                                            {
                                                openComplaintCount
                                            }
                                        </span>
                                    )}
                            </button>

                            <button
                                type="button"
                                className="export-button"
                                onClick={
                                    handleExportCsv
                                }
                                disabled={
                                    !sortedHospitals.length
                                }
                            >
                                <FaDownload />
                                Export CSV
                            </button>

                        </div>

                    </section>

                </div>

                {hospitalError && (
                    <div className="hospital-error">

                        <FaExclamationTriangle />

                        <span>
                            {
                                hospitalError
                            }
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                fetchHospitals(
                                    true
                                )
                            }
                        >
                            Retry
                        </button>

                    </div>
                )}

                {hospitalsLoading ? (
                    <section className="hospital-grid">

                        {Array.from({
                            length: 6,
                        }).map(
                            (_, index) => (
                                <div
                                    className="skeleton-card"
                                    key={
                                        index
                                    }
                                >

                                    <div className="skeleton skeleton-image" />

                                    <div className="skeleton-content">

                                        <div className="skeleton skeleton-title" />

                                        <div className="skeleton skeleton-line" />

                                        <div className="skeleton skeleton-line short" />

                                        <div className="skeleton skeleton-button" />

                                    </div>

                                </div>
                            )
                        )}

                    </section>
                ) : filteredHospitals.length ? (

                    <section className="hospital-table-shell">

                        <div className="hospital-table-scroll">

                            <table className="hospital-table hospital-table-full">

                                <thead>

                                    <tr>

                                        <th>#</th>

                                        <th
                                            className="th-sortable"
                                            onClick={() =>
                                                setSortAsc(
                                                    (previous) =>
                                                        !previous
                                                )
                                            }
                                        >
                                            Hospital Name
                                            <FaSort className="sort-icon" />
                                        </th>

                                        <th>
                                            Reg. No.
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Phone
                                        </th>

                                        <th>
                                            Address
                                        </th>

                                        <th>
                                            City
                                        </th>

                                        <th>
                                            State
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {pagedHospitals.map(
                                        (
                                            hospital,
                                            index
                                        ) => {

                                            const isUpdating =
                                                updatingHospitalId ===
                                                hospital.id;

                                            const isDeleting =
                                                deletingHospitalId ===
                                                hospital.id;

                                            return (
                                                <tr
                                                    key={
                                                        hospital.id ??
                                                        `hospital-${index}`
                                                    }
                                                    className={
                                                        hospital.isActive
                                                            ? ""
                                                            : "row-inactive"
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            pageStart +
                                                            index +
                                                            1
                                                        }
                                                    </td>

                                                    <td className="cell-name">

                                                        {
                                                            hospital.name
                                                        }

                                                        {
                                                            openComplaintsByHospital[
                                                            hospital.id
                                                            ] >
                                                            0 && (
                                                                <button
                                                                    type="button"
                                                                    className="hospital-complaint-badge"
                                                                    onClick={() =>
                                                                        openComplaints(
                                                                            hospital.id
                                                                        )
                                                                    }
                                                                    title="Open complaints"
                                                                >
                                                                    <FaExclamationTriangle />

                                                                    {
                                                                        openComplaintsByHospital[
                                                                        hospital.id
                                                                        ]
                                                                    }
                                                                </button>
                                                            )
                                                        }

                                                    </td>

                                                    <td className="cell-nowrap cell-reg">
                                                        {
                                                            hospital.registrationNumber ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="cell-wrap">
                                                        {
                                                            hospital.email ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="cell-nowrap">
                                                        {
                                                            hospital.phone ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td className="cell-wrap">
                                                        {
                                                            hospital.address ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            hospital.city ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            hospital.state ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>

                                                        <span
                                                            title={
                                                                hospital.isActive
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }
                                                            aria-label={
                                                                hospital.isActive
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }
                                                            className={`status-badge status-icon ${hospital.isActive
                                                                    ? "status-active"
                                                                    : "status-inactive"
                                                                }`}
                                                        >
                                                            {
                                                                hospital.isActive ? (
                                                                    <FaCheckCircle />
                                                                ) : (
                                                                    <FaPauseCircle />
                                                                )
                                                            }
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="row-actions">

                                                            <button
                                                                type="button"
                                                                className="row-action-btn row-view"
                                                                onClick={() =>
                                                                    handleOpenHospital(
                                                                        hospital
                                                                    )
                                                                }
                                                                title="View Hospital"
                                                            >
                                                                <FaArrowRight />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="row-action-btn row-sms"
                                                                onClick={() => handleSendAll(hospital)}
                                                                disabled={isUpdating || isDeleting}
                                                                title="Send credentials and certificate (Email + SMS + WhatsApp)"
                                                            >
                                                                {isUpdating ? <FaCircleNotch className="button-spinner" /> : <FaPaperPlane />}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="row-action-btn row-certificate"
                                                                onClick={() => openHospitalCertificate(hospital)}
                                                                disabled={isUpdating || isDeleting}
                                                                title="Print hospital registration certificate"
                                                            >
                                                                <FaPrint />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="row-action-btn row-pdf"
                                                                onClick={() => openHospitalCertificate(hospital)}
                                                                disabled={isUpdating || isDeleting}
                                                                title="Save hospital certificate as PDF"
                                                            >
                                                                <FaFilePdf />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={`row-action-btn ${hospital.isActive
                                                                        ? "row-deactivate"
                                                                        : "row-activate"
                                                                    }`}
                                                                onClick={() =>
                                                                    handleToggleHospitalStatus(
                                                                        hospital
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating ||
                                                                    isDeleting
                                                                }
                                                                title={
                                                                    hospital.isActive
                                                                        ? "Deactivate Hospital"
                                                                        : "Activate Hospital"
                                                                }
                                                            >
                                                                {isUpdating ? (
                                                                    <FaCircleNotch className="button-spinner" />
                                                                ) : hospital.isActive ? (
                                                                    <FaPauseCircle />
                                                                ) : (
                                                                    <FaCheckCircle />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="row-action-btn row-delete"
                                                                onClick={() =>
                                                                    handleDeleteHospital(
                                                                        hospital
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdating ||
                                                                    isDeleting
                                                                }
                                                                title="Delete Hospital"
                                                            >
                                                                {isDeleting ? (
                                                                    <FaCircleNotch className="button-spinner" />
                                                                ) : (
                                                                    <FaTrash />
                                                                )}
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                    {!pagedHospitals.length && (
                                        <tr>
                                            <td
                                                colSpan={10}
                                                className="table-empty"
                                            >
                                                No hospitals match this filter.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <div className="table-footer">

                            <span className="table-footer-info">
                                Showing{" "}
                                {
                                    sortedHospitals.length
                                        ? pageStart +
                                        1
                                        : 0
                                }
                                {"–"}
                                {Math.min(
                                    pageStart +
                                    pageSize,
                                    sortedHospitals.length
                                )}{" "}
                                of{" "}
                                {
                                    sortedHospitals.length
                                }
                            </span>

                            <div className="table-pager">

                                <select
                                    value={
                                        pageSize
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setPageSize(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                    aria-label="Rows per page"
                                >
                                    <option value={10}>
                                        10 / page
                                    </option>

                                    <option value={25}>
                                        25 / page
                                    </option>

                                    <option value={50}>
                                        50 / page
                                    </option>

                                </select>

                                <button
                                    type="button"
                                    className="pager-button"
                                    onClick={() =>
                                        setPage(
                                            Math.max(
                                                1,
                                                currentPage -
                                                1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage <=
                                        1
                                    }
                                    aria-label="Previous page"
                                >
                                    <FaChevronLeft />
                                </button>

                                <span className="pager-label">
                                    {
                                        currentPage
                                    }{" "}
                                    /{" "}
                                    {
                                        totalPages
                                    }
                                </span>

                                <button
                                    type="button"
                                    className="pager-button"
                                    onClick={() =>
                                        setPage(
                                            Math.min(
                                                totalPages,
                                                currentPage +
                                                1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage >=
                                        totalPages
                                    }
                                    aria-label="Next page"
                                >
                                    <FaChevronRight />
                                </button>

                            </div>

                        </div>

                    </section>

                ) : (

                    <section className="empty-state">

                        <div className="empty-icon">
                            <FaHospital />
                        </div>

                        <h2>
                            No hospitals found
                        </h2>

                        <p>
                            {searchTerm
                                ? "Try another search term."
                                : "No hospitals are currently available in the directory."}
                        </p>

                        {!searchTerm && (
                            <button
                                type="button"
                                className="add-hospital-button"
                                onClick={
                                    handleOpenAddHospital
                                }
                            >
                                <FaPlus />
                                Add Hospital
                            </button>
                        )}

                    </section>
                )}

                {complaintsOpen && (
                    <div
                        className="complaints-backdrop"
                        onClick={() =>
                            setComplaintsOpen(
                                false
                            )
                        }
                    >

                        <aside
                            className="complaints-drawer"
                            onClick={(
                                event
                            ) =>
                                event.stopPropagation()
                            }
                        >

                            <header className="complaints-header">

                                <div>

                                    <span className="complaints-kicker">
                                        HOSPITAL-LEVEL
                                    </span>

                                    <h2>
                                        Complaints
                                    </h2>

                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() =>
                                        setComplaintsOpen(
                                            false
                                        )
                                    }
                                    aria-label="Close"
                                >
                                    <FaTimes />
                                </button>

                            </header>

                            {complaintHospitalFilter !=
                                null && (
                                    <button
                                        type="button"
                                        className="complaints-hospital-chip"
                                        onClick={() =>
                                            setComplaintHospitalFilter(
                                                null
                                            )
                                        }
                                    >
                                        {
                                            hospitals.find(
                                                (h) =>
                                                    String(
                                                        h.id
                                                    ) ===
                                                    String(
                                                        complaintHospitalFilter
                                                    )
                                            )?.name ||
                                            "Hospital"
                                        }

                                        <FaTimes />
                                    </button>
                                )}

                            {selectedComplaint ? (
                                <div className="complaint-detail">

                                    <button
                                        type="button"
                                        className="complaint-back"
                                        onClick={() =>
                                            setSelectedComplaintId(
                                                null
                                            )
                                        }
                                    >
                                        <FaChevronLeft />
                                        Back to list
                                    </button>

                                    <div className="complaint-detail-head">

                                        <h3>
                                            {
                                                selectedComplaint.subject
                                            }
                                        </h3>

                                        <div className="complaint-tags">

                                            <span
                                                className={`priority-tag priority-${selectedComplaint.priority}`}
                                            >
                                                {
                                                    selectedComplaint.priority
                                                }
                                            </span>

                                            <span
                                                className={`complaint-status status-${selectedComplaint.status}`}
                                            >
                                                {
                                                    COMPLAINT_STATUS_LABELS[
                                                    selectedComplaint.status
                                                    ] ||
                                                    selectedComplaint.status
                                                }
                                            </span>

                                        </div>

                                    </div>

                                    <div className="complaint-meta">

                                        <div>
                                            <small>
                                                Hospital
                                            </small>

                                            <strong>
                                                {
                                                    complaintHospitalLabel(
                                                        selectedComplaint
                                                    )
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                From
                                            </small>

                                            <strong>
                                                {
                                                    selectedComplaint.complainantName ||
                                                    "Unknown"
                                                }

                                                {selectedComplaint.complainantType
                                                    ? ` (${COMPLAINT_TYPE_LABELS[
                                                    selectedComplaint
                                                        .complainantType
                                                    ] ||
                                                    selectedComplaint.complainantType
                                                    })`
                                                    : ""}
                                            </strong>
                                        </div>

                                        {selectedComplaint.complainantEmail && (
                                            <div>
                                                <small>
                                                    Email
                                                </small>

                                                <strong>
                                                    {
                                                        selectedComplaint.complainantEmail
                                                    }
                                                </strong>
                                            </div>
                                        )}

                                        {selectedComplaint.complainantPhone && (
                                            <div>
                                                <small>
                                                    Phone
                                                </small>

                                                <strong>
                                                    {
                                                        selectedComplaint.complainantPhone
                                                    }
                                                </strong>
                                            </div>
                                        )}

                                        <div>
                                            <small>
                                                Received
                                            </small>

                                            <strong>
                                                {
                                                    formatComplaintDate(
                                                        selectedComplaint.createdAt
                                                    ) ||
                                                    "—"
                                                }
                                            </strong>
                                        </div>

                                        {selectedComplaint.againstHospitalAdmin && (
                                            <div>
                                                <small>
                                                    Note
                                                </small>

                                                <strong>
                                                    Filed against the Hospital Admin
                                                </strong>
                                            </div>
                                        )}

                                    </div>

                                    <div className="complaint-message">
                                        {
                                            selectedComplaint.message ||
                                            "No details provided."
                                        }
                                    </div>

                                    <label className="complaint-reply-label">
                                        Your reply
                                    </label>

                                    <textarea
                                        className="complaint-reply"
                                        rows={4}
                                        value={
                                            complaintReply
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setComplaintReply(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Write the action taken or reply..."
                                    />

                                    {complaintsError && (
                                        <div className="hospital-error">
                                            {
                                                complaintsError
                                            }
                                        </div>
                                    )}

                                    <div className="complaint-actions">

                                        <button
                                            type="button"
                                            className="row-action-btn-text review"
                                            onClick={() =>
                                                updateComplaint(
                                                    "in_review"
                                                )
                                            }
                                            disabled={
                                                complaintSaving
                                            }
                                        >
                                            <FaPauseCircle />
                                            Mark In Review
                                        </button>

                                        <button
                                            type="button"
                                            className="row-action-btn-text reject"
                                            onClick={() =>
                                                updateComplaint(
                                                    "rejected"
                                                )
                                            }
                                            disabled={
                                                complaintSaving
                                            }
                                        >
                                            <FaTimes />
                                            Reject
                                        </button>

                                        <button
                                            type="button"
                                            className="row-action-btn-text resolve"
                                            onClick={() =>
                                                updateComplaint(
                                                    "resolved"
                                                )
                                            }
                                            disabled={
                                                complaintSaving
                                            }
                                        >
                                            {complaintSaving ? (
                                                <FaCircleNotch className="button-spinner" />
                                            ) : (
                                                <FaCheckCircle />
                                            )}

                                            Resolve
                                        </button>

                                    </div>

                                </div>
                            ) : (
                                <>
                                    <div className="complaint-filters">

                                        {[
                                            [
                                                "open",
                                                "Open",
                                            ],
                                            [
                                                "in_review",
                                                "In Review",
                                            ],
                                            [
                                                "resolved",
                                                "Closed",
                                            ],
                                            [
                                                "all",
                                                "All",
                                            ],
                                        ].map(
                                            ([
                                                key,
                                                label,
                                            ]) => (
                                                <button
                                                    key={
                                                        key
                                                    }
                                                    type="button"
                                                    className={`filter-tab ${complaintStatusFilter ===
                                                            key
                                                            ? "active"
                                                            : ""
                                                        }`}
                                                    onClick={() =>
                                                        setComplaintStatusFilter(
                                                            key
                                                        )
                                                    }
                                                >
                                                    {
                                                        label
                                                    }

                                                    <span>
                                                        {
                                                            complaintCounts[
                                                            key
                                                            ]
                                                        }
                                                    </span>
                                                </button>
                                            )
                                        )}

                                    </div>

                                    <div className="complaint-list">

                                        {complaintsLoading && (
                                            <div className="complaint-empty">

                                                <FaCircleNotch className="button-spinner" />

                                                Loading complaints...

                                            </div>
                                        )}

                                        {!complaintsLoading &&
                                            !complaintsAvailable && (
                                                <div className="complaint-empty">

                                                    <FaInbox />

                                                    Complaints API not found on the backend yet.

                                                </div>
                                            )}

                                        {!complaintsLoading &&
                                            complaintsAvailable &&
                                            complaintsError &&
                                            !visibleComplaints.length && (
                                                <div className="hospital-error">
                                                    {
                                                        complaintsError
                                                    }
                                                </div>
                                            )}

                                        {!complaintsLoading &&
                                            complaintsAvailable &&
                                            !complaintsError &&
                                            !visibleComplaints.length && (
                                                <div className="complaint-empty">

                                                    <FaInbox />

                                                    No complaints here.

                                                </div>
                                            )}

                                        {visibleComplaints.map(
                                            (
                                                item
                                            ) => (
                                                <button
                                                    key={
                                                        item.id
                                                    }
                                                    type="button"
                                                    className={`complaint-card priority-border-${item.priority}`}
                                                    onClick={() =>
                                                        handleSelectComplaint(
                                                            item
                                                        )
                                                    }
                                                >

                                                    <div className="complaint-card-top">

                                                        <strong>
                                                            {
                                                                item.subject
                                                            }
                                                        </strong>

                                                        <span
                                                            className={`priority-tag priority-${item.priority}`}
                                                        >
                                                            {
                                                                item.priority
                                                            }
                                                        </span>

                                                    </div>

                                                    <div className="complaint-card-hospital">
                                                        {
                                                            complaintHospitalLabel(
                                                                item
                                                            )
                                                        }
                                                    </div>

                                                    <div className="complaint-card-bottom">

                                                        <span>
                                                            {
                                                                item.complainantName ||
                                                                "Unknown"
                                                            }

                                                            {item.complainantType
                                                                ? ` · ${COMPLAINT_TYPE_LABELS[
                                                                item
                                                                    .complainantType
                                                                ] ||
                                                                item.complainantType
                                                                }`
                                                                : ""}
                                                        </span>

                                                        <span
                                                            className={`complaint-status status-${item.status}`}
                                                        >
                                                            {
                                                                COMPLAINT_STATUS_LABELS[
                                                                item.status
                                                                ] ||
                                                                item.status
                                                            }
                                                        </span>

                                                    </div>

                                                    <small>
                                                        {
                                                            formatComplaintDate(
                                                                item.createdAt
                                                            )
                                                        }
                                                    </small>

                                                </button>
                                            )
                                        )}

                                    </div>
                                </>
                            )}

                        </aside>

                    </div>
                )}

            </main>

            {/* =================================================
                HOSPITAL DETAIL MODAL
            ================================================= */}

            {showHospitalModal &&
                selectedHospital && (
                    <div
                        className="hospital-modal-backdrop"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                handleCloseHospital();
                            }
                        }}
                    >

                        <div className="hospital-detail-modal">

                            <div className="detail-modal-header">

                                <h2>
                                    Hospital Details
                                </h2>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        handleCloseHospital
                                    }
                                    aria-label="Close"
                                >
                                    <FaTimes />
                                </button>

                            </div>

                            <div className="hospital-detail-content">

                                <div className="detail-grid">

                                    <div className="detail-field">
                                        <span>
                                            Hospital Name:
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.name
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            <FaEnvelope />
                                            Email
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.email ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            <FaPhone />
                                            Phone
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.phone ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            <FaUser />
                                            Director Name
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.directorName ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            <FaMapMarkerAlt />
                                            City
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.city ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            <FaMapMarkerAlt />
                                            State
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.state ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            Pincode
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.pincode ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                    <div className="detail-field">
                                        <span>
                                            Address
                                        </span>

                                        <strong>
                                            {
                                                selectedHospital.address ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="detail-grid detail-license-grid">
                                    <div className="detail-field detail-license-card">
                                        <span><FaIdCard /> Hospital Registration Number</span>
                                        <strong>{selectedHospital.registrationNumber || "Not available"}</strong>
                                    </div>
                                    <div className="detail-field detail-license-card">
                                        <span><FaIdCard /> License Number</span>
                                        <strong>{selectedHospital.licenseNumber || "Not available"}</strong>
                                    </div>
                                    <div className="detail-field detail-license-card">
                                        <span><FaIdCard /> License Valid Until</span>
                                        <strong>{selectedHospital.licenseExpiry || "Not available"}</strong>
                                    </div>
                                </div>

                                <div className="detail-modal-actions detail-document-actions">
                                    <button type="button" className="document-action certificate-print-action" onClick={() => openHospitalCertificate(selectedHospital)}><FaPrint /> Print Certificate</button>
                                    <button type="button" className="document-action certificate-pdf-action" onClick={() => openHospitalCertificate(selectedHospital)}><FaFilePdf /> Save PDF</button>
                                    <button type="button" className="document-action certificate-sms-action certificate-sendall-action" onClick={() => handleSendAll(selectedHospital)} disabled={updatingHospitalId === selectedHospital.id}>{updatingHospitalId === selectedHospital.id ? <FaCircleNotch className="button-spinner" /> : <FaPaperPlane />} Send Credentials &amp; Certificate (Email + SMS + WhatsApp)</button>
                                </div>

                                <div className="detail-field detail-status-field">

                                    <span>
                                        Operational Status:
                                    </span>

                                    <span
                                        className={`hospital-status ${selectedHospital.isActive
                                                ? "status-active"
                                                : "status-inactive"
                                            }`}
                                    >
                                        <span />

                                        {selectedHospital.isActive
                                            ? "Active - Fully Operational"
                                            : "Inactive"}
                                    </span>

                                </div>

                                <div className="detail-modal-actions">

                                    <button
                                        type="button"
                                        className={`hospital-status-action detail-status-action ${selectedHospital.isActive
                                                ? "deactivate-action"
                                                : "activate-action"
                                            }`}
                                        onClick={() =>
                                            handleToggleHospitalStatus(
                                                selectedHospital
                                            )
                                        }
                                        disabled={
                                            updatingHospitalId ===
                                            selectedHospital.id
                                        }
                                    >
                                        {updatingHospitalId ===
                                            selectedHospital.id ? (
                                            <FaCircleNotch className="button-spinner" />
                                        ) : selectedHospital.isActive ? (
                                            <FaPauseCircle />
                                        ) : (
                                            <FaCheckCircle />
                                        )}

                                        {selectedHospital.isActive
                                            ? "Deactivate Hospital"
                                            : "Activate Hospital"}
                                    </button>

                                    <button
                                        type="button"
                                        className="hospital-delete-action detail-delete-action"
                                        onClick={() =>
                                            handleDeleteHospital(
                                                selectedHospital
                                            )
                                        }
                                        disabled={
                                            deletingHospitalId ===
                                            selectedHospital.id
                                        }
                                    >
                                        {deletingHospitalId ===
                                            selectedHospital.id ? (
                                            <FaCircleNotch className="button-spinner" />
                                        ) : (
                                            <FaTrash />
                                        )}

                                        Delete Hospital
                                    </button>

                                    <button
                                        type="button"
                                        className="modal-done-button"
                                        onClick={
                                            handleCloseHospital
                                        }
                                    >
                                        Done
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>
                )}

            {/* =================================================
                SEND STATUS POPUP (credentials + certificate)
            ================================================= */}

            {sendStatus && (() => {
                const doneSteps = sendStatus.steps.filter((step) => step.state !== "skipped");
                const anySuccess = doneSteps.some((step) => step.state === "success");
                const anyError = doneSteps.some((step) => step.state === "error");
                const tone = sendStatus.running
                    ? "running"
                    : anyError
                        ? anySuccess ? "partial" : "failed"
                        : "ok";
                if (tone === "ok") {
                    return (
                        <div
                            className="send-status-backdrop"
                            onClick={() => setSendStatus(null)}
                        >
                            <div
                                className="send-success-modal"
                                role="status"
                                aria-label="Sent successfully"
                            >
                                <FaCheckCircle />
                            </div>
                        </div>
                    );
                }

                const title = sendStatus.running
                    ? "Sending..."
                    : tone === "ok"
                        ? "Sent successfully"
                        : tone === "partial"
                            ? "Sent with some issues"
                            : "Could not be sent";

                return (
                    <div className="send-status-backdrop">
                        <div className="send-status-modal">
                            <div className="send-status-head">
                                <span className={`send-status-badge ${tone}`}>
                                    {tone === "running" ? (
                                        <FaCircleNotch className="button-spinner" />
                                    ) : tone === "ok" ? (
                                        <FaCheckCircle />
                                    ) : (
                                        <FaExclamationTriangle />
                                    )}
                                </span>

                                <div>
                                    <h3>{title}</h3>
                                    <p>{sendStatus.hospitalName}</p>
                                </div>
                            </div>

                            <ul className="send-status-list">
                                {sendStatus.steps.map((step) => (
                                    <li key={step.key} className={`send-step ${step.state}`}>
                                        <span className="send-step-icon">
                                            {step.state === "running" ? (
                                                <FaCircleNotch className="button-spinner" />
                                            ) : step.state === "success" ? (
                                                <FaCheckCircle />
                                            ) : step.state === "error" ? (
                                                <FaExclamationTriangle />
                                            ) : step.state === "skipped" ? (
                                                <FaTimes />
                                            ) : (
                                                <span className="send-step-dot" />
                                            )}
                                        </span>

                                        <div className="send-step-text">
                                            <strong>{step.label}</strong>
                                            {step.target ? <small>{step.target}</small> : null}
                                            {step.detail ? (
                                                <em>{step.detail}</em>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="send-status-actions">
                                <button
                                    type="button"
                                    className="modal-done-button"
                                    disabled={sendStatus.running}
                                    onClick={() => setSendStatus(null)}
                                >
                                    {sendStatus.running ? "Please wait..." : "Done"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* =================================================
                DELETE CONFIRMATION (outside <main> so it is always
                in front of the Hospital Details card)
            ================================================= */}

            {deleteTarget && (
                <div
                    className="delete-confirm-backdrop"
                    onClick={() =>
                        setDeleteTarget(
                            null
                        )
                    }
                >

                    <div
                        className="delete-confirm-modal"
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >

                        <span className="delete-confirm-icon">
                            <FaExclamationTriangle />
                        </span>

                        <h3>
                            Delete hospital permanently?
                        </h3>

                        <p>
                            <strong>
                                {
                                    deleteTarget.name
                                }
                            </strong>{" "}
                            and its data
                            will be removed.
                            This cannot be
                            undone. Type the
                            hospital name to
                            confirm.
                        </p>

                        <input
                            type="text"
                            value={
                                deleteConfirmText
                            }
                            onChange={(
                                event
                            ) =>
                                setDeleteConfirmText(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder={
                                deleteTarget.name
                            }
                            autoFocus
                        />

                        <div className="delete-confirm-actions">

                            <button
                                type="button"
                                className="cancel-add-button"
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="delete-confirm-button"
                                disabled={
                                    deleteConfirmText.trim() !==
                                    String(
                                        deleteTarget.name ||
                                        ""
                                    ).trim()
                                }
                                onClick={
                                    confirmDeleteHospital
                                }
                            >
                                <FaTrash />
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                CREATED CREDENTIALS MODAL
            ================================================= */}

            {createdCredentials && (
                <div className="hospital-modal-backdrop">

                    <div className="hospital-detail-modal credentials-modal">

                        <div className="detail-modal-header">

                            <h2>
                                Hospital Created
                            </h2>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setCreatedCredentials(
                                        null
                                    )
                                }
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <div className="hospital-detail-content">

                            <p className="credentials-intro">

                                <FaCheckCircle />

                                <span>
                                    <strong>
                                        {
                                            createdCredentials.hospitalName
                                        }
                                    </strong>{" "}
                                    has been added.
                                    Save or print
                                    these credentials
                                    now.
                                </span>

                            </p>

                            <div className="detail-grid">

                                {[
                                    [
                                        "Hospital ID",
                                        createdCredentials.hospitalId,
                                    ],
                                    [
                                        "Login Email / Username",
                                        createdCredentials.email ||
                                        createdCredentials.username,
                                    ],
                                    [
                                        "Password",
                                        createdCredentials.password,
                                    ],
                                    [
                                        "Login URL",
                                        createdCredentials.loginUrl,
                                    ],
                                ].map(
                                    ([
                                        label,
                                        value,
                                    ]) => (
                                        <div
                                            className="detail-field credentials-row"
                                            key={
                                                label
                                            }
                                        >

                                            <span>
                                                {
                                                    label
                                                }:
                                            </span>

                                            <strong>
                                                {
                                                    value ||
                                                    "Not provided"
                                                }
                                            </strong>

                                            {value && (
                                                <button
                                                    type="button"
                                                    className="credentials-copy"
                                                    onClick={() =>
                                                        handleCopyField(
                                                            label,
                                                            value
                                                        )
                                                    }
                                                    title="Copy"
                                                >
                                                    {copiedField ===
                                                        label ? (
                                                        <FaCheckCircle />
                                                    ) : (
                                                        <FaCopy />
                                                    )}
                                                </button>
                                            )}

                                        </div>
                                    )
                                )}

                            </div>

                            {createdCredentials.emailSent ===
                                true && (
                                    <p className="credentials-intro">

                                        <FaCheckCircle />

                                        <span>
                                            Login details
                                            were emailed
                                            to{" "}

                                            <strong>
                                                {
                                                    createdCredentials.email
                                                }
                                            </strong>
                                            .
                                        </span>

                                    </p>
                                )}

                            {createdCredentials.emailSent ===
                                false && (
                                    <div className="add-form-error">

                                        <FaExclamationTriangle />

                                        <span>
                                            Email could
                                            not be sent.
                                            Please share
                                            the printed
                                            credentials
                                            manually.
                                        </span>

                                    </div>
                                )}

                            {(!createdCredentials.hospitalId ||
                                !createdCredentials.password) && (
                                    <div className="add-form-error">

                                        <FaExclamationTriangle />

                                        <span>
                                            The server did
                                            not return a
                                            Hospital ID or
                                            password. The
                                            backend must
                                            generate and
                                            return them.
                                        </span>

                                    </div>
                                )}

                            <div className="credentials-actions">

                                <button
                                    type="button"
                                    className="modal-done-button"
                                    onClick={() =>
                                        openPrintablePage(
                                            createdCredentials
                                        )
                                    }
                                >
                                    <FaPrint />

                                    Open Printable
                                    Page
                                </button>

                                <button
                                    type="button"
                                    className="cancel-add-button"
                                    onClick={() =>
                                        setCreatedCredentials(
                                            null
                                        )
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                ADD HOSPITAL MODAL
            ================================================= */}

            {showAddHospital && (
                <div
                    className="add-hospital-backdrop"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleCloseAddHospital();
                        }
                    }}
                >

                    <div className="add-hospital-modal">

                        <div className="add-modal-header">

                            <div>

                                <span className="add-modal-kicker">
                                    HMS DIRECTORY
                                </span>

                                <h2>
                                    Add New Hospital
                                </h2>

                                <p>
                                    Register a new
                                    hospital in the
                                    HMS network.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="add-modal-close"
                                onClick={
                                    handleCloseAddHospital
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            className="add-hospital-form"
                            onSubmit={
                                handleAddHospital
                            }
                        >

                            <div className="form-section-title">
                                Hospital Information
                            </div>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Hospital Name
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaHospital />

                                        <input
                                            name="hospitalName"
                                            value={
                                                hospitalForm.hospitalName
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="Enter hospital name"
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Director Name
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaUser />

                                        <input
                                            name="directorName"
                                            value={
                                                hospitalForm.directorName
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="Enter director name"
                                        />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Hospital Email
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaEnvelope />

                                        <input
                                            type="email"
                                            name="hospitalEmail"
                                            value={
                                                hospitalForm.hospitalEmail
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="hospital@example.com"
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaPhone />

                                        <input
                                            name="phone"
                                            value={
                                                hospitalForm.phone
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="Hospital phone"
                                        />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Country
                                    </label>

                                    <div className="settings-input-wrap select-wrap">

                                        <FaGlobe />

                                        <select
                                            name="country"
                                            value={
                                                hospitalForm.country
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                        >
                                            <option value="">
                                                Select country
                                            </option>

                                            {COUNTRY_LIST.map(
                                                (
                                                    country
                                                ) => (
                                                    <option
                                                        key={
                                                            country.code
                                                        }
                                                        value={
                                                            country.name
                                                        }
                                                    >
                                                        {
                                                            country.name
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                        <FaChevronDown className="select-arrow" />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        State
                                    </label>

                                    <div className="settings-input-wrap select-wrap">

                                        <FaMapMarkerAlt />

                                        {stateOptions.length ? (
                                            <>
                                                <select
                                                    name="state"
                                                    value={
                                                        hospitalForm.state
                                                    }
                                                    onChange={
                                                        handleHospitalFormChange
                                                    }
                                                >
                                                    <option value="">
                                                        Select state
                                                    </option>

                                                    {stateOptions.map(
                                                        (
                                                            name
                                                        ) => (
                                                            <option
                                                                key={
                                                                    name
                                                                }
                                                                value={
                                                                    name
                                                                }
                                                            >
                                                                {
                                                                    name
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                </select>

                                                <FaChevronDown className="select-arrow" />
                                            </>
                                        ) : (
                                            <input
                                                name="state"
                                                value={
                                                    hospitalForm.state
                                                }
                                                onChange={
                                                    handleHospitalFormChange
                                                }
                                                placeholder="State"
                                            />
                                        )}

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        District
                                    </label>

                                    <div className="settings-input-wrap select-wrap">

                                        <FaMapMarkerAlt />

                                        {districtIsSelect ? (
                                            <>
                                                <select
                                                    name="district"
                                                    value={
                                                        hospitalForm.district
                                                    }
                                                    onChange={
                                                        handleHospitalFormChange
                                                    }
                                                    disabled={
                                                        !hospitalForm.state
                                                    }
                                                >
                                                    <option value="">
                                                        {
                                                            hospitalForm.state
                                                                ? "Select district"
                                                                : "Select state first"
                                                        }
                                                    </option>

                                                    {districtOptions.map(
                                                        (
                                                            name
                                                        ) => (
                                                            <option
                                                                key={
                                                                    name
                                                                }
                                                                value={
                                                                    name
                                                                }
                                                            >
                                                                {
                                                                    name
                                                                }
                                                            </option>
                                                        )
                                                    )}

                                                </select>

                                                <FaChevronDown className="select-arrow" />
                                            </>
                                        ) : (
                                            <input
                                                name="district"
                                                value={
                                                    hospitalForm.district
                                                }
                                                onChange={
                                                    handleHospitalFormChange
                                                }
                                                placeholder="District"
                                            />
                                        )}

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        City
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaMapMarkerAlt />

                                        <input
                                            name="city"
                                            value={
                                                hospitalForm.city
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="City"
                                            required
                                        />

                                    </div>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Pincode
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaMapMarkerAlt />

                                        <input
                                            name="pincode"
                                            value={
                                                hospitalForm.pincode
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="Pincode"
                                        />

                                    </div>

                                </div>

                                <div className="form-group full-width">

                                    <label>
                                        Address
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaMapMarkerAlt />

                                        <input
                                            name="address"
                                            value={
                                                hospitalForm.address
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="Complete hospital address"
                                        />

                                    </div>

                                </div>

                            </div>

                            {addHospitalError && (
                                <div className="add-form-error">

                                    <FaExclamationTriangle />

                                    {
                                        addHospitalError
                                    }

                                </div>
                            )}

                            {addHospitalSuccess && (
                                <div className="add-form-success">

                                    <FaCheckCircle />

                                    {
                                        addHospitalSuccess
                                    }

                                </div>
                            )}

                            <div className="add-form-actions">

                                <button
                                    type="button"
                                    className="cancel-add-button"
                                    onClick={
                                        handleCloseAddHospital
                                    }
                                    disabled={
                                        addHospitalLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-hospital-button"
                                    disabled={
                                        addHospitalLoading
                                    }
                                >

                                    {addHospitalLoading ? (
                                        <>
                                            <FaCircleNotch className="button-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus />
                                            Save Hospital
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* =================================================
                SETTINGS MODAL
            ================================================= */}

            {showSettings && (
                <div
                    className="settings-backdrop"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleCloseSettings();
                        }
                    }}
                >

                    <div className="settings-modal">

                        <div className="settings-modal-header">

                            <div className="settings-profile">

                                <div className="profile-avatar">
                                    {userDisplayName
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()}
                                </div>

                                <div>

                                    <span>
                                        SUPER ADMIN
                                    </span>

                                    <h2>
                                        Account
                                        Settings
                                    </h2>

                                </div>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={
                                    handleCloseSettings
                                }
                                disabled={
                                    settingsSaving
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <form
                            className="settings-form"
                            onSubmit={
                                handleSaveSettings
                            }
                        >

                            <div className="settings-section-title">
                                Administrator
                                Information
                            </div>

                            <div className="settings-fields">

                                <div className="settings-field">

                                    <label>
                                        Admin Name
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaUser className="settings-input-icon" />

                                        <input
                                            type="text"
                                            name="adminName"
                                            value={
                                                settingsForm.adminName
                                            }
                                            onChange={
                                                handleSettingsChange
                                            }
                                            placeholder="Enter admin name"
                                            disabled={
                                                settingsSaving
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="settings-field">

                                    <label>
                                        Admin Email
                                    </label>

                                    <div className="settings-input-wrap">

                                        <FaEnvelope className="settings-input-icon" />

                                        <input
                                            type="email"
                                            name="adminEmail"
                                            value={
                                                settingsForm.adminEmail
                                            }
                                            onChange={
                                                handleSettingsChange
                                            }
                                            placeholder="Enter admin email"
                                            disabled={
                                                settingsSaving
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="settings-field">

                                    <label>
                                        Role
                                    </label>

                                    <div className="settings-input-wrap settings-readonly">

                                        <FaUserShield className="settings-input-icon" />

                                        <input
                                            value="Super Admin"
                                            readOnly
                                        />

                                        <FaLock className="settings-lock" />

                                    </div>

                                </div>

                            </div>

                            <div className="settings-section-title settings-media-title">
                                Branding
                            </div>

                            <div className="settings-upload-grid">

                                <BrandingCard
                                    title="Admin Logo"
                                    hint="JPG, PNG, WEBP, GIF or SVG"
                                    previewClass="logo-preview"
                                    src={
                                        adminLogoPreview ||
                                        brandUrls.logo ||
                                        resolveAssetUrl(settingsForm.adminLogo)
                                    }
                                    alt="Admin logo preview"
                                    emptyText="No logo selected"
                                    inputRef={adminLogoInputRef}
                                    onFileChange={handleAdminLogoChange}
                                    uploadLabel="Choose Logo"
                                    canRemove={Boolean(
                                        adminLogoFile ||
                                        brandUrls.logo ||
                                        settingsForm.adminLogo
                                    )}
                                    onRemove={handleRemoveAdminLogo}
                                    urlDraft={urlDrafts.logo}
                                    onUrlDraftChange={(value) => setUrlDraft("logo", value)}
                                    onApplyUrl={() => applyBrandUrl("logo")}
                                    urlApplied={Boolean(brandUrls.logo)}
                                    disabled={settingsSaving}
                                />

                                <BrandingCard
                                    title="Background Image"
                                    hint="Login background"
                                    previewClass="background-preview"
                                    src={
                                        backgroundImagePreview ||
                                        brandUrls.background ||
                                        resolveAssetUrl(settingsForm.backgroundImage)
                                    }
                                    alt="Background preview"
                                    emptyText="No background selected"
                                    inputRef={backgroundInputRef}
                                    onFileChange={handleBackgroundImageChange}
                                    uploadLabel="Choose Background"
                                    canRemove={Boolean(
                                        backgroundImageFile ||
                                        brandUrls.background ||
                                        settingsForm.backgroundImage
                                    )}
                                    onRemove={handleRemoveBackgroundImage}
                                    urlDraft={urlDrafts.background}
                                    onUrlDraftChange={(value) => setUrlDraft("background", value)}
                                    onApplyUrl={() => applyBrandUrl("background")}
                                    urlApplied={Boolean(brandUrls.background)}
                                    disabled={settingsSaving}
                                />

                                <BrandingCard
                                    title="Digital Signature"
                                    hint="Printed on certificates (transparent PNG best)"
                                    previewClass="signature-preview"
                                    src={
                                        signatureRemoved
                                            ? ""
                                            : signaturePreview ||
                                            brandUrls.signature ||
                                            resolveAssetUrl(settingsForm.adminSignature) ||
                                            certificateSignature
                                    }
                                    alt="Digital signature preview"
                                    emptyText="No signature uploaded"
                                    inputRef={signatureInputRef}
                                    onFileChange={handleSignatureChange}
                                    uploadLabel="Upload Signature"
                                    canRemove={
                                        !signatureRemoved &&
                                        Boolean(
                                            signaturePreview ||
                                            brandUrls.signature ||
                                            settingsForm.adminSignature ||
                                            certificateSignature
                                        )
                                    }
                                    onRemove={handleRemoveSignature}
                                    urlDraft={urlDrafts.signature}
                                    onUrlDraftChange={(value) => setUrlDraft("signature", value)}
                                    onApplyUrl={() => applyBrandUrl("signature")}
                                    urlApplied={Boolean(brandUrls.signature)}
                                    disabled={settingsSaving}
                                />

                                <BrandingCard
                                    title="Official Stamp (Muhar)"
                                    hint="Printed on certificates (transparent PNG best)"
                                    previewClass="stamp-preview"
                                    icon={<FaStamp />}
                                    src={
                                        stampRemoved
                                            ? ""
                                            : stampPreview ||
                                            brandUrls.stamp ||
                                            resolveAssetUrl(settingsForm.adminStamp) ||
                                            certificateStamp
                                    }
                                    alt="Official stamp preview"
                                    emptyText="No stamp uploaded"
                                    inputRef={stampInputRef}
                                    onFileChange={handleStampChange}
                                    uploadLabel="Upload Stamp"
                                    canRemove={
                                        !stampRemoved &&
                                        Boolean(
                                            stampPreview ||
                                            brandUrls.stamp ||
                                            settingsForm.adminStamp ||
                                            certificateStamp
                                        )
                                    }
                                    onRemove={handleRemoveStamp}
                                    urlDraft={urlDrafts.stamp}
                                    onUrlDraftChange={(value) => setUrlDraft("stamp", value)}
                                    onApplyUrl={() => applyBrandUrl("stamp")}
                                    urlApplied={Boolean(brandUrls.stamp)}
                                    disabled={settingsSaving}
                                />

                                <BrandingCard
                                    title="Certificate Seal (Top Sticker)"
                                    hint="Top-centre of certificate (background auto-transparent)"
                                    previewClass="stamp-preview"
                                    icon={<FaCertificate />}
                                    src={
                                        localBrand.seal.removed
                                            ? ""
                                            : localBrand.seal.preview ||
                                            brandUrls.seal ||
                                            certificateSeal
                                    }
                                    alt="Certificate seal preview"
                                    emptyText="Default gold HMS seal"
                                    inputRef={sealInputRef}
                                    onFileChange={handleLocalBrandChange("seal", "seal")}
                                    uploadLabel="Upload Seal"
                                    canRemove={
                                        !localBrand.seal.removed &&
                                        Boolean(
                                            localBrand.seal.preview ||
                                            brandUrls.seal ||
                                            certificateSeal
                                        )
                                    }
                                    onRemove={handleLocalBrandRemove("seal")}
                                    urlDraft={urlDrafts.seal}
                                    onUrlDraftChange={(value) => setUrlDraft("seal", value)}
                                    onApplyUrl={() => applyBrandUrl("seal")}
                                    urlApplied={Boolean(brandUrls.seal)}
                                    disabled={settingsSaving}
                                />

                                <BrandingCard
                                    title="Verified Sticker"
                                    hint="Bottom-centre of certificate (background auto-transparent)"
                                    previewClass="stamp-preview"
                                    icon={<FaAward />}
                                    src={
                                        localBrand.badge.removed
                                            ? ""
                                            : localBrand.badge.preview ||
                                            brandUrls.badge ||
                                            certificateBadge
                                    }
                                    alt="Verified sticker preview"
                                    emptyText="Default VERIFIED badge"
                                    inputRef={badgeInputRef}
                                    onFileChange={handleLocalBrandChange("badge", "verified sticker")}
                                    uploadLabel="Upload Sticker"
                                    canRemove={
                                        !localBrand.badge.removed &&
                                        Boolean(
                                            localBrand.badge.preview ||
                                            brandUrls.badge ||
                                            certificateBadge
                                        )
                                    }
                                    onRemove={handleLocalBrandRemove("badge")}
                                    urlDraft={urlDrafts.badge}
                                    onUrlDraftChange={(value) => setUrlDraft("badge", value)}
                                    onApplyUrl={() => applyBrandUrl("badge")}
                                    urlApplied={Boolean(brandUrls.badge)}
                                    disabled={settingsSaving}
                                />

                            </div>

                            <div className="settings-section-title settings-stats-title">
                                HMS Overview
                            </div>

                            <div className="settings-overview-grid">

                                <div className="settings-overview-card">

                                    <div className="settings-overview-icon">
                                        <FaHospital />
                                    </div>

                                    <div>

                                        <span>
                                            Hospitals
                                            Managed
                                        </span>

                                        <strong>
                                            {
                                                hospitalCount
                                            }
                                        </strong>

                                    </div>

                                </div>

                                <div className="settings-overview-card settings-overview-active">

                                    <div className="settings-overview-icon">
                                        <FaCheckCircle />
                                    </div>

                                    <div>

                                        <span>
                                            Active
                                            Hospitals
                                        </span>

                                        <strong>
                                            {
                                                activeHospitals
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>

                            {settingsLoading && (
                                <div className="settings-loading">

                                    <FaCircleNotch className="settings-spinner" />

                                    Loading saved
                                    settings...

                                </div>
                            )}

                            {settingsError && (
                                <div className="settings-message settings-message-error">

                                    <FaExclamationTriangle />

                                    <span>
                                        {
                                            settingsError
                                        }
                                    </span>

                                </div>
                            )}

                            {settingsSuccess && (
                                <div className="settings-message settings-message-success">

                                    <FaCheckCircle />

                                    <span>
                                        {
                                            settingsSuccess
                                        }
                                    </span>

                                </div>
                            )}

                            <div className="settings-actions">

                                <button
                                    type="button"
                                    className="cancel-add-button"
                                    onClick={
                                        handleCloseSettings
                                    }
                                    disabled={
                                        settingsSaving
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="settings-save-button"
                                    disabled={
                                        settingsSaving ||
                                        settingsLoading
                                    }
                                >

                                    {settingsSaving ? (
                                        <>
                                            <FaCircleNotch className="button-spinner" />
                                            Saving
                                            Settings...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle />
                                            Save Settings
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default SuperAdmin;