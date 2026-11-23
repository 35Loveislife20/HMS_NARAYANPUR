import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaEnvelope,
    FaUserShield,
    FaLock,
    FaImage,
    FaLink,
    FaUpload,
    FaTrash,
    FaTimes,
    FaSave,
    FaCheckCircle,
    FaBed,
    FaHospital,
    FaPhone,
    FaMapMarkerAlt,
    FaTag,
    FaIdCard,
    FaCertificate,
    FaClock,
    FaAmbulance,
    FaHeadset,
    FaPercent,
    FaFileInvoiceDollar,
    FaMobileAlt,
    FaMoneyBillWave,
    FaCreditCard,
    FaCalendarCheck,
    FaCopy,
    FaCity,
    FaMapPin,
    FaHashtag,
    FaExclamationTriangle,
} from "react-icons/fa";

/*
  Hospital Settings (Hospital Admin)

  Tabs:
    1. Profile      - naam, email, phone, address, beds, license (read-only)
    2. Timings      - OPD timings, emergency, appointment slot, contact numbers
    3. Billing      - GST, tax, invoice prefix / footer, payment methods, UPI
    4. Branding     - logo, background, signature, stamp, seal, sticker

  Props:
    hospitalId  - logged-in user ka hospital id
    onClose     - modal band karne ke liye

  BACKEND:
    Load : GET /hospitals/:id
    Save : PUT /hospitals/:id/settings   (hospital.settings.controller.js)

    hospitals table me ye columns chahiye:
        settings (JSON), signature, stamp, seal, verified_sticker,
        login_background_image (LONGTEXT), logo_url (LONGTEXT)
    Jab tak backend settings save na kare, timings / billing browser me
    (localStorage) bhi save rehti hain taaki data kho na jaye.
*/

import "./HospitalSettings.css";
import SuccessPopup from "./SuccessPopup";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

/* =========================================================
   CONSTANTS
========================================================= */

const TABS = [
    { id: "profile", label: "Profile", icon: FaHospital },
    { id: "timings", label: "Timings & Contact", icon: FaClock },
    { id: "billing", label: "Billing", icon: FaFileInvoiceDollar },
    { id: "branding", label: "Branding", icon: FaImage },
];

const DAYS = [
    ["mon", "Monday"],
    ["tue", "Tuesday"],
    ["wed", "Wednesday"],
    ["thu", "Thursday"],
    ["fri", "Friday"],
    ["sat", "Saturday"],
    ["sun", "Sunday"],
];

const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

const CURRENCIES = [
    { value: "INR", label: "INR (₹)" },
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "AED", label: "AED (د.إ)" },
];

const buildDefaultSettings = () => ({
    timings: Object.fromEntries(
        DAYS.map(([key]) => [
            key,
            {
                closed: key === "sun",
                open: "09:00",
                close: "17:00",
            },
        ])
    ),
    emergency247: true,
    emergencyPhone: "",
    ambulancePhone: "",
    helpdeskEmail: "",
    slotMinutes: 15,
    advanceDays: 30,
    billing: {
        gstNumber: "",
        taxPercent: "0",
        currency: "INR",
        invoicePrefix: "INV-",
        invoiceFooter: "",
        payCash: true,
        payUpi: true,
        payCard: true,
        upiId: "",
    },
});

/* Saved (ya cached) settings ko defaults ke upar merge karta hai */
const mergeSettings = (raw) => {
    const base = buildDefaultSettings();

    let source = raw;

    if (typeof source === "string") {
        try {
            source = JSON.parse(source);
        } catch {
            source = null;
        }
    }

    if (!source || typeof source !== "object") {
        return base;
    }

    const timings = { ...base.timings };

    DAYS.forEach(([key]) => {
        if (source.timings?.[key]) {
            timings[key] = {
                ...base.timings[key],
                ...source.timings[key],
            };
        }
    });

    return {
        ...base,
        ...source,
        timings,
        billing: {
            ...base.billing,
            ...(source.billing || {}),
        },
    };
};

const settingsCacheKey = (hospitalId) =>
    `hms_hospital_settings_${hospitalId}`;

const BRAND_FIELDS = [
    {
        key: "logo",
        title: "Hospital Logo",
        hint: "JPG, PNG, WEBP, GIF or SVG",
        chooseLabel: "Choose Logo",
        icon: FaImage,
        previewClass: "",
    },
    {
        key: "background",
        title: "Login Background",
        hint: "Login background",
        chooseLabel: "Choose Background",
        icon: FaImage,
        previewClass: "brand-preview-wide",
    },
    {
        key: "signature",
        title: "Digital Signature",
        hint: "Printed on certificates (transparent PNG best)",
        chooseLabel: "Upload Signature",
        icon: FaImage,
        previewClass: "",
    },
    {
        key: "stamp",
        title: "Official Stamp (Muhar)",
        hint: "Printed on certificates (transparent PNG best)",
        chooseLabel: "Upload Stamp",
        icon: FaUserShield,
        previewClass: "",
    },
];

const STICKER_FIELDS = [
    {
        key: "seal",
        title: "Certificate Seal (Top Sticker)",
        hint: "Top-centre of certificate (background auto-transparent)",
        chooseLabel: "Upload Seal",
        emptyText: "Default gold HMS seal",
    },
    {
        key: "verifiedSticker",
        title: "Verified Sticker",
        hint: "Bottom-centre of certificate (background auto-transparent)",
        chooseLabel: "Upload Sticker",
        emptyText: "Default VERIFIED badge",
    },
];

/* Backend field names (fallbacks) jo record mein ho sakte hain */
const RECORD_KEYS = {
    logo: ["logo_url", "logo", "hospital_logo"],
    background: [
        "login_background_image",
        "background_image",
        "backgroundImage",
    ],
    signature: ["signature", "digital_signature"],
    stamp: ["stamp", "official_stamp"],
    seal: ["seal", "certificate_seal"],
    verifiedSticker: ["verified_sticker", "verifiedSticker"],
};

const LICENSE_KEYS = {
    licenseNumber: [
        "license_number",
        "licenseNumber",
        "license_no",
        "license",
    ],
    licenseValidUntil: [
        "license_valid_until",
        "licenseValidUntil",
        "license_expiry",
        "license_valid_till",
    ],
    registrationNumber: [
        "registration_number",
        "registrationNumber",
        "registration_no",
    ],
};

const pickRecordValue = (record, keys) => {
    for (const k of keys) {
        if (record?.[k]) return record[k];
    }
    return "";
};

const getAuthHeaders = () => {
    const token =
        localStorage.getItem("hms_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

/* Photo ko chhota karta hai taaki save request badi na ho.
   Transparent PNG (signature, stamp, seal, sticker, logo) PNG hi rehta hai,
   background JPEG ban jata hai. SVG / GIF jaise ke taise rehte hain. */
const MAX_SIDE = {
    background: 1280,
    logo: 600,
    signature: 600,
    stamp: 600,
    seal: 600,
    verifiedSticker: 600,
};

const MAX_RESULT_BYTES = 1500 * 1024; // ~1.5 MB (base64 ke baad)

/* Logo / signature / stamp ke kinaron se jude white (ya almost-white)
   background ko transparent bana deta hai. Andar ke white hisse safe rehte
   hain, kyunki sirf image ke edge se connected area hi hataya jata hai. */
const TRANSPARENT_KEYS = [
    "logo",
    "signature",
    "stamp",
    "seal",
    "verifiedSticker",
];

const removeEdgeWhiteBackground = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const WHITE_MIN = 232; // itne ya zyada R,G,B = white maana jayega
    const HALO_MIN = 205; // kinare ki halka safed jhalak

    const isBackground = (index) =>
        data[index + 3] < 10 ||
        (data[index] >= WHITE_MIN &&
            data[index + 1] >= WHITE_MIN &&
            data[index + 2] >= WHITE_MIN);

    const visited = new Uint8Array(width * height);
    const stack = [];

    const push = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;

        const pos = y * width + x;
        if (visited[pos]) return;

        if (!isBackground(pos * 4)) return;

        visited[pos] = 1;
        stack.push(pos);
    };

    for (let x = 0; x < width; x += 1) {
        push(x, 0);
        push(x, height - 1);
    }

    for (let y = 0; y < height; y += 1) {
        push(0, y);
        push(width - 1, y);
    }

    while (stack.length) {
        const pos = stack.pop();
        const x = pos % width;
        const y = (pos - x) / width;

        data[pos * 4 + 3] = 0;

        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
    }

    /* Kinare par bachi halka safed lakeer (halo) ko aadha transparent karo */
    const snapshot = new Uint8Array(visited);

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const pos = y * width + x;
            if (snapshot[pos]) continue;

            const nearRemoved =
                snapshot[pos - 1] ||
                snapshot[pos + 1] ||
                snapshot[pos - width] ||
                snapshot[pos + width];

            if (!nearRemoved) continue;

            const i = pos * 4;

            if (
                data[i] >= HALO_MIN &&
                data[i + 1] >= HALO_MIN &&
                data[i + 2] >= HALO_MIN
            ) {
                data[i + 3] = Math.min(data[i + 3], 90);
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

const compressImage = (file, key) =>
    new Promise((resolve, reject) => {
        if (file.type === "image/svg+xml" || file.type === "image/gif") {
            readAsDataUrl(file).then(resolve).catch(reject);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const maxSide = MAX_SIDE[key] || 800;
            const scale = Math.min(
                1,
                maxSide / Math.max(img.width, img.height)
            );

            const width = Math.max(1, Math.round(img.width * scale));
            const height = Math.max(1, Math.round(img.height * scale));

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0, width, height);

            if (TRANSPARENT_KEYS.includes(key)) {
                try {
                    removeEdgeWhiteBackground(ctx, width, height);
                } catch {
                    /* fail ho to image jaisi hai waisi hi rahegi */
                }
            }

            let dataUrl;

            if (key === "background") {
                /* Login background: transparent image ho to PNG hi rakho,
                   warna normal photo ko chhota JPEG bana do. */
                let hasTransparency = false;

                try {
                    const pixels = ctx.getImageData(0, 0, width, height).data;

                    for (let i = 3; i < pixels.length; i += 4) {
                        if (pixels[i] < 250) {
                            hasTransparency = true;
                            break;
                        }
                    }
                } catch {
                    hasTransparency = false;
                }

                if (hasTransparency) {
                    dataUrl = canvas.toDataURL("image/png");

                    /* PNG bhari ho jaye to size thoda kam karke dobara try */
                    if (dataUrl.length > MAX_RESULT_BYTES) {
                        const smallCanvas = document.createElement("canvas");
                        smallCanvas.width = Math.max(1, Math.round(width * 0.6));
                        smallCanvas.height = Math.max(1, Math.round(height * 0.6));

                        smallCanvas
                            .getContext("2d")
                            .drawImage(
                                canvas,
                                0,
                                0,
                                smallCanvas.width,
                                smallCanvas.height
                            );

                        dataUrl = smallCanvas.toDataURL("image/png");
                    }
                } else {
                    /* opaque image: white peeche laga kar JPEG */
                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);

                    dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                }
            } else {
                dataUrl = canvas.toDataURL("image/png");
            }

            resolve(dataUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Image khul nahi payi."));
        };

        img.src = objectUrl;
    });

const formatDisplayDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const emptyToNull = (value) => {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
};

const GSTIN_PATTERN =
    /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN = /^[+]?[0-9\s-]{7,18}$/;

const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

/* =========================================================
   COMPONENT
========================================================= */

function HospitalSettings({ hospitalId, onClose }) {
    const [activeTab, setActiveTab] = useState("profile");

    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "Hospital Admin",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        tagline: "",
        totalBeds: "0",
        availableBeds: "0",
    });

    const [license, setLicense] = useState({
        licenseNumber: "",
        licenseValidUntil: "",
        registrationNumber: "",
    });

    const [settings, setSettings] = useState(buildDefaultSettings);

    const [images, setImages] = useState({
        logo: "",
        background: "",
        signature: "",
        stamp: "",
        seal: "",
        verifiedSticker: "",
    });

    const [urlInputs, setUrlInputs] = useState({});

    /* load hote waqt ki images - Save me sirf badli hui images bhejte hain */
    const originalImages = useRef({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [successPopup, setSuccessPopup] = useState({
        open: false,
        title: "",
        message: "",
    });

    const fileRefs = {
        logo: useRef(null),
        background: useRef(null),
        signature: useRef(null),
        stamp: useRef(null),
        seal: useRef(null),
        verifiedSticker: useRef(null),
    };

    /* =====================================================
       LOAD HOSPITAL RECORD
    ===================================================== */

    useEffect(() => {
        if (!hospitalId) {
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/hospitals/${hospitalId}`,
                    { headers: getAuthHeaders() }
                );

                const result = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        result?.message || "Hospital data load nahi hua."
                    );
                }

                const record = result?.data || result?.hospital || result || {};

                setForm((prev) => ({
                    ...prev,
                    name: record.name || "",
                    email: record.email || "",
                    phone: record.phone || "",
                    address: record.address || "",
                    city: record.city || "",
                    state: record.state || "",
                    pincode: record.pincode || "",
                    tagline: record.tagline || "",
                    totalBeds: String(record.total_beds ?? 0),
                    availableBeds: String(record.available_beds ?? 0),
                }));

                setLicense({
                    licenseNumber: pickRecordValue(
                        record,
                        LICENSE_KEYS.licenseNumber
                    ),
                    licenseValidUntil: pickRecordValue(
                        record,
                        LICENSE_KEYS.licenseValidUntil
                    ),
                    registrationNumber: pickRecordValue(
                        record,
                        LICENSE_KEYS.registrationNumber
                    ),
                });

                /* backend ki settings, nahi to browser cache */
                let savedSettings = record.settings;

                if (!savedSettings) {
                    try {
                        savedSettings = localStorage.getItem(
                            settingsCacheKey(hospitalId)
                        );
                    } catch {
                        savedSettings = null;
                    }
                }

                setSettings(mergeSettings(savedSettings));

                const nextImages = {};
                Object.entries(RECORD_KEYS).forEach(([key, keys]) => {
                    nextImages[key] = pickRecordValue(record, keys);
                });
                setImages((prev) => ({ ...prev, ...nextImages }));
                originalImages.current = { ...nextImages };
            } catch (err) {
                setMessage({ type: "error", text: err.message });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [hospitalId]);

    /* =====================================================
       HANDLERS
    ===================================================== */

    const clearMessage = () => setMessage({ type: "", text: "" });

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearMessage();
    };

    const setSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        clearMessage();
    };

    const setBilling = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            billing: { ...prev.billing, [key]: value },
        }));
        clearMessage();
    };

    const setDay = (day, patch) => {
        setSettings((prev) => ({
            ...prev,
            timings: {
                ...prev.timings,
                [day]: { ...prev.timings[day], ...patch },
            },
        }));
        clearMessage();
    };

    const copyMondayToAll = () => {
        setSettings((prev) => {
            const monday = prev.timings.mon;

            return {
                ...prev,
                timings: Object.fromEntries(
                    DAYS.map(([key]) => [
                        key,
                        key === "mon" ? monday : { ...monday },
                    ])
                ),
            };
        });
        clearMessage();
    };

    const handleFile = async (key, event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Sirf image file select karein." });
            return;
        }

        try {
            const dataUrl = await compressImage(file, key);

            if (dataUrl.length > MAX_RESULT_BYTES) {
                setMessage({
                    type: "error",
                    text: "Image abhi bhi bahut badi hai. Chhoti image chuniye ya URL use kijiye.",
                });
                return;
            }

            setImages((prev) => ({ ...prev, [key]: dataUrl }));
            clearMessage();
        } catch {
            setMessage({ type: "error", text: "File read nahi ho payi." });
        }
    };

    const applyUrl = (key) => {
        const url = (urlInputs[key] || "").trim();
        if (!url) return;

        setImages((prev) => ({ ...prev, [key]: url }));
        setUrlInputs((prev) => ({ ...prev, [key]: "" }));
        clearMessage();
    };

    const removeImage = (key) => {
        setImages((prev) => ({ ...prev, [key]: "" }));
    };

    /* =====================================================
       BEDS (live)
    ===================================================== */

    const bedSummary = useMemo(() => {
        const total = Math.max(0, Number(form.totalBeds) || 0);
        const available = Math.max(0, Number(form.availableBeds) || 0);

        return {
            total,
            available,
            occupied: Math.max(0, total - available),
        };
    }, [form.totalBeds, form.availableBeds]);

    /* =====================================================
       VALIDATION
       Galti milne par us tab par le jata hai jahan galti hai.
    ===================================================== */

    const validate = () => {
        const fail = (tab, text) => {
            setActiveTab(tab);
            setMessage({ type: "error", text });
            return false;
        };

        if (!form.name.trim()) {
            return fail("profile", "Hospital name zaroori hai.");
        }

        if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
            return fail("profile", "Hospital email sahi nahi hai.");
        }

        if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
            return fail("profile", "Phone number sahi nahi hai.");
        }

        if (form.pincode.trim() && !/^\d{4,10}$/.test(form.pincode.trim())) {
            return fail("profile", "Pincode sirf numbers me hona chahiye.");
        }

        const total = Number(form.totalBeds);
        const available = Number(form.availableBeds);

        if (
            !Number.isInteger(total) ||
            !Number.isInteger(available) ||
            total < 0 ||
            available < 0
        ) {
            return fail("profile", "Beds ki ginti poora number (0 ya zyada) honi chahiye.");
        }

        if (available > total) {
            return fail("profile", "Available beds total beds se zyada nahi ho sakte.");
        }

        if (
            settings.emergencyPhone.trim() &&
            !PHONE_PATTERN.test(settings.emergencyPhone.trim())
        ) {
            return fail("timings", "Emergency number sahi nahi hai.");
        }

        if (
            settings.ambulancePhone.trim() &&
            !PHONE_PATTERN.test(settings.ambulancePhone.trim())
        ) {
            return fail("timings", "Ambulance number sahi nahi hai.");
        }

        if (
            settings.helpdeskEmail.trim() &&
            !EMAIL_PATTERN.test(settings.helpdeskEmail.trim())
        ) {
            return fail("timings", "Helpdesk email sahi nahi hai.");
        }

        for (const [key, label] of DAYS) {
            const day = settings.timings[key];

            if (day.closed) continue;

            if (!day.open || !day.close) {
                return fail("timings", `${label} ka opening aur closing time bharein.`);
            }

            if (day.close <= day.open) {
                return fail("timings", `${label}: closing time opening ke baad hona chahiye.`);
            }
        }

        const advance = Number(settings.advanceDays);

        if (!Number.isInteger(advance) || advance < 1 || advance > 365) {
            return fail("timings", "Advance booking days 1 se 365 ke beech hone chahiye.");
        }

        const billing = settings.billing;

        if (
            billing.gstNumber.trim() &&
            !GSTIN_PATTERN.test(billing.gstNumber.trim().toUpperCase())
        ) {
            return fail("billing", "GST number sahi nahi hai (15 character GSTIN).");
        }

        const tax = Number(billing.taxPercent);

        if (billing.taxPercent === "" || Number.isNaN(tax) || tax < 0 || tax > 100) {
            return fail("billing", "Tax % 0 se 100 ke beech hona chahiye.");
        }

        if (!billing.payCash && !billing.payUpi && !billing.payCard) {
            return fail("billing", "Kam se kam ek payment method chalu rakhein.");
        }

        if (
            billing.payUpi &&
            billing.upiId.trim() &&
            !UPI_PATTERN.test(billing.upiId.trim())
        ) {
            return fail("billing", "UPI ID sahi nahi hai (jaise name@bank).");
        }

        return true;
    };

    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave = async (event) => {
        event.preventDefault();

        if (!hospitalId) {
            setMessage({ type: "error", text: "Hospital id nahi mila." });
            return;
        }

        if (!validate()) return;

        try {
            setSaving(true);
            clearMessage();

            const cleanSettings = {
                ...settings,
                emergencyPhone: settings.emergencyPhone.trim(),
                ambulancePhone: settings.ambulancePhone.trim(),
                helpdeskEmail: settings.helpdeskEmail.trim(),
                slotMinutes: Number(settings.slotMinutes),
                advanceDays: Number(settings.advanceDays),
                billing: {
                    ...settings.billing,
                    gstNumber: settings.billing.gstNumber.trim().toUpperCase(),
                    taxPercent: String(Number(settings.billing.taxPercent)),
                    invoicePrefix: settings.billing.invoicePrefix.trim(),
                    invoiceFooter: settings.billing.invoiceFooter.trim(),
                    upiId: settings.billing.upiId.trim(),
                },
            };

            const payload = {
                name: form.name.trim(),
                email: emptyToNull(form.email),
                phone: emptyToNull(form.phone),
                address: emptyToNull(form.address),
                city: emptyToNull(form.city),
                state: emptyToNull(form.state),
                pincode: emptyToNull(form.pincode),
                tagline: emptyToNull(form.tagline),
                total_beds: Number(form.totalBeds),
                available_beds: Number(form.availableBeds),
                settings: cleanSettings,
            };

            /* sirf wahi images bhejein jo badli hain (ya hata di gayi hain) */
            const IMAGE_PAYLOAD_KEYS = {
                logo: "logo_url",
                background: "login_background_image",
                signature: "signature",
                stamp: "stamp",
                seal: "seal",
                verifiedSticker: "verified_sticker",
            };

            Object.entries(IMAGE_PAYLOAD_KEYS).forEach(([key, field]) => {
                const current = images[key] || "";
                const original = originalImages.current[key] || "";

                if (current !== original) {
                    payload[field] = current || null;
                }
            });

            const response = await fetch(
                `${API_URL}/hospitals/${hospitalId}/settings`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json().catch(() => null);

            if (response.status === 413) {
                throw new Error(
                    "Data bahut bada hai. Backend me express.json({ limit: \"10mb\" }) set karein."
                );
            }

            if (!response.ok || result?.success === false) {
                throw new Error(
                    result?.message ||
                        `Settings save nahi hui (status ${response.status}).`
                );
            }

            /* Verify: PUT ka response hi saved row bhejta hai (SELECT *),
               isliye usi se check karte hain - GET route par depend nahi */
            if (images.background) {
                const saved = result?.hospital || {};

                if (!pickRecordValue(saved, RECORD_KEYS.background)) {
                    throw new Error(
                        "Login background server par save nahi hui. Backend settings controller me login_background_image field check karein."
                    );
                }
            }

            /* browser me bhi rakhein (backend settings JSON na rakhe tab bhi) */
            try {
                localStorage.setItem(
                    settingsCacheKey(hospitalId),
                    JSON.stringify(cleanSettings)
                );
            } catch {
                /* ignore */
            }

            setSettings(cleanSettings);
            originalImages.current = { ...images };

            const skipped = result?.skippedFields || [];

            setMessage(
                skipped.length > 0
                    ? {
                          type: "error",
                          text: `Settings save ho gayi, par ye fields database me nahi hain: ${skipped.join(", ")}`,
                      }
                    : { type: "success", text: "Settings save ho gayi." }
            );

            if (skipped.length === 0) {
                setSuccessPopup({
                    open: true,
                    title: "Settings Saved",
                    message: "Hospital settings successfully save ho gayi hain.",
                });
            }
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       SMALL RENDER HELPERS
    ===================================================== */

    const renderInput = ({
        name,
        label,
        icon: Icon,
        type = "text",
        placeholder,
        value,
        onChange,
        inputMode,
        maxLength,
        wide = false,
    }) => (
        <div
            className={`settings-field ${wide ? "settings-field-wide" : ""}`}
            key={name}
        >
            <label htmlFor={`hs-${name}`}>{label}</label>

            <div className="settings-input-wrap">
                {Icon && <Icon className="settings-input-icon" />}

                <input
                    id={`hs-${name}`}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    disabled={saving}
                />
            </div>
        </div>
    );

    const renderToggle = (checked, onToggle, label, hint) => (
        <label className="settings-toggle-row">
            <span className="settings-toggle-text">
                <strong>{label}</strong>
                {hint && <small>{hint}</small>}
            </span>

            <span className="settings-switch">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onToggle(event.target.checked)}
                    disabled={saving}
                />
                <span className="settings-switch-track" />
            </span>
        </label>
    );

    const renderReadOnly = (label, value, icon) => {
        const Icon = icon;

        return (
            <div className="settings-field" key={label}>
                <label>{label}</label>

                <div className="settings-input-wrap settings-readonly">
                    <Icon className="settings-input-icon" />
                    <input type="text" value={value || "—"} readOnly />
                    <FaLock className="settings-lock" />
                </div>
            </div>
        );
    };

    /* =====================================================
       UPLOAD CARD
    ===================================================== */

    const renderUploadCard = (field, isSticker = false) => {
        const value = images[field.key];
        const Icon = field.icon;

        return (
            <div
                className={`settings-upload-card brand-card ${
                    isSticker ? "brand-sticker-card" : ""
                }`}
                key={field.key}
            >
                <div className="settings-upload-heading">
                    <div>
                        <strong>{field.title}</strong>
                        <span>{field.hint}</span>
                    </div>
                    {Icon && <Icon className="settings-upload-heading-icon" />}
                </div>

                <div
                    className={`settings-image-preview brand-preview ${field.previewClass || ""}`}
                >
                    {value ? (
                        <img src={value} alt={field.title} />
                    ) : (
                        <div className="settings-empty-image">
                            {field.emptyText || "Koi image nahi"}
                        </div>
                    )}
                </div>

                <div className="settings-upload-actions">
                    <button
                        type="button"
                        className="settings-upload-button"
                        onClick={() => fileRefs[field.key].current?.click()}
                        disabled={saving}
                    >
                        <FaUpload />
                        {field.chooseLabel}
                    </button>

                    {value && (
                        <button
                            type="button"
                            className="settings-remove-button"
                            onClick={() => removeImage(field.key)}
                            disabled={saving}
                            aria-label="Remove"
                        >
                            <FaTrash />
                        </button>
                    )}

                    <input
                        ref={fileRefs[field.key]}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => handleFile(field.key, event)}
                    />
                </div>

                <div className="settings-input-wrap brand-url-input">
                    <FaLink className="settings-input-icon" />
                    <input
                        type="text"
                        placeholder="Paste image URL"
                        value={urlInputs[field.key] || ""}
                        onChange={(event) =>
                            setUrlInputs((prev) => ({
                                ...prev,
                                [field.key]: event.target.value,
                            }))
                        }
                        disabled={saving}
                    />
                    <button
                        type="button"
                        className="settings-upload-button brand-url-apply"
                        onClick={() => applyUrl(field.key)}
                        disabled={saving}
                    >
                        Use URL
                    </button>
                </div>
            </div>
        );
    };

    /* =====================================================
       TAB: PROFILE
    ===================================================== */

    const renderProfileTab = () => (
        <>
            <div className="settings-section-title">
                Hospital Information
            </div>

            <div className="settings-fields">
                {renderInput({
                    name: "name",
                    label: "Hospital Name",
                    icon: FaHospital,
                    placeholder: "Enter hospital name",
                    value: form.name,
                    onChange: handleFormChange,
                })}

                {renderInput({
                    name: "email",
                    label: "Hospital Email",
                    icon: FaEnvelope,
                    type: "email",
                    placeholder: "hospital@example.com",
                    value: form.email,
                    onChange: handleFormChange,
                })}

                {renderInput({
                    name: "phone",
                    label: "Phone",
                    icon: FaPhone,
                    type: "tel",
                    placeholder: "Hospital phone number",
                    value: form.phone,
                    onChange: handleFormChange,
                    inputMode: "tel",
                })}

                {renderInput({
                    name: "tagline",
                    label: "Tagline",
                    icon: FaTag,
                    placeholder: "e.g. Care with compassion",
                    value: form.tagline,
                    onChange: handleFormChange,
                    wide: true,
                })}

                <div className="settings-field">
                    <label>Role</label>

                    <div className="settings-input-wrap settings-readonly">
                        <FaUserShield className="settings-input-icon" />
                        <input type="text" value={form.role} readOnly />
                        <FaLock className="settings-lock" />
                    </div>
                </div>
            </div>

            <div className="settings-section-title settings-media-title">
                Address
            </div>

            <div className="settings-fields">
                <div className="settings-field settings-field-full">
                    <label htmlFor="hs-address">Address</label>

                    <textarea
                        id="hs-address"
                        name="address"
                        className="settings-textarea"
                        rows={2}
                        value={form.address}
                        onChange={handleFormChange}
                        placeholder="Complete hospital address"
                        disabled={saving}
                    />
                </div>

                {renderInput({
                    name: "city",
                    label: "City",
                    icon: FaCity,
                    placeholder: "City",
                    value: form.city,
                    onChange: handleFormChange,
                })}

                {renderInput({
                    name: "state",
                    label: "State",
                    icon: FaMapMarkerAlt,
                    placeholder: "State",
                    value: form.state,
                    onChange: handleFormChange,
                })}

                {renderInput({
                    name: "pincode",
                    label: "Pincode",
                    icon: FaMapPin,
                    placeholder: "Pincode",
                    value: form.pincode,
                    onChange: handleFormChange,
                    inputMode: "numeric",
                    maxLength: 10,
                })}
            </div>

            <div className="settings-section-title settings-media-title">
                License &amp; Registration
                <span className="settings-title-note">
                    Super Admin set karta hai · sirf dekhne ke liye
                </span>
            </div>

            <div className="settings-fields">
                {renderReadOnly(
                    "Registration Number",
                    license.registrationNumber,
                    FaIdCard
                )}

                {renderReadOnly(
                    "License Number",
                    license.licenseNumber,
                    FaCertificate
                )}

                {renderReadOnly(
                    "License Valid Until",
                    license.licenseValidUntil
                        ? formatDisplayDate(license.licenseValidUntil)
                        : "",
                    FaCalendarCheck
                )}
            </div>

            <div className="settings-section-title settings-stats-title">
                Beds
            </div>

            <div className="settings-fields settings-fields-2">
                {renderInput({
                    name: "totalBeds",
                    label: "Total Beds",
                    icon: FaBed,
                    type: "number",
                    placeholder: "0",
                    value: form.totalBeds,
                    onChange: handleFormChange,
                    inputMode: "numeric",
                })}

                {renderInput({
                    name: "availableBeds",
                    label: "Available Beds",
                    icon: FaCheckCircle,
                    type: "number",
                    placeholder: "0",
                    value: form.availableBeds,
                    onChange: handleFormChange,
                    inputMode: "numeric",
                })}
            </div>

            <div className="settings-overview-grid">
                <div className="settings-overview-card">
                    <div className="settings-overview-icon">
                        <FaBed />
                    </div>
                    <div>
                        <span>Total Beds</span>
                        <strong>{bedSummary.total}</strong>
                    </div>
                </div>

                <div className="settings-overview-card settings-overview-active">
                    <div className="settings-overview-icon">
                        <FaCheckCircle />
                    </div>
                    <div>
                        <span>Available Beds</span>
                        <strong>{bedSummary.available}</strong>
                    </div>
                </div>

                <div className="settings-overview-card">
                    <div className="settings-overview-icon">
                        <FaBed />
                    </div>
                    <div>
                        <span>Occupied</span>
                        <strong>{bedSummary.occupied}</strong>
                    </div>
                </div>
            </div>
        </>
    );

    /* =====================================================
       TAB: TIMINGS & CONTACT
    ===================================================== */

    const renderTimingsTab = () => (
        <>
            <div className="settings-section-title">
                OPD Timings
            </div>

            <div className="settings-timing-table">
                <div className="settings-timing-head">
                    <span>Day</span>
                    <span>Status</span>
                    <span>Opens</span>
                    <span>Closes</span>
                </div>

                {DAYS.map(([key, label]) => {
                    const day = settings.timings[key];

                    return (
                        <div
                            className={`settings-timing-row ${
                                day.closed ? "is-closed" : ""
                            }`}
                            key={key}
                        >
                            <strong>{label}</strong>

                            <label className="settings-closed-check">
                                <input
                                    type="checkbox"
                                    checked={day.closed}
                                    onChange={(event) =>
                                        setDay(key, {
                                            closed: event.target.checked,
                                        })
                                    }
                                    disabled={saving}
                                />
                                <span>{day.closed ? "Closed" : "Open"}</span>
                            </label>

                            <input
                                type="time"
                                className="settings-time-input"
                                value={day.open}
                                onChange={(event) =>
                                    setDay(key, { open: event.target.value })
                                }
                                disabled={saving || day.closed}
                                aria-label={`${label} opening time`}
                            />

                            <input
                                type="time"
                                className="settings-time-input"
                                value={day.close}
                                onChange={(event) =>
                                    setDay(key, { close: event.target.value })
                                }
                                disabled={saving || day.closed}
                                aria-label={`${label} closing time`}
                            />
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                className="settings-upload-button settings-copy-button"
                onClick={copyMondayToAll}
                disabled={saving}
            >
                <FaCopy />
                Monday ka time sabhi din par lagayein
            </button>

            <div className="settings-section-title settings-media-title">
                Emergency
            </div>

            {renderToggle(
                settings.emergency247,
                (value) => setSetting("emergency247", value),
                "Emergency 24x7",
                "Emergency service din-raat chalu hai"
            )}

            <div className="settings-fields settings-fields-3">
                {renderInput({
                    name: "emergencyPhone",
                    label: "Emergency Number",
                    icon: FaPhone,
                    type: "tel",
                    placeholder: "Emergency contact",
                    value: settings.emergencyPhone,
                    onChange: (event) =>
                        setSetting("emergencyPhone", event.target.value),
                    inputMode: "tel",
                })}

                {renderInput({
                    name: "ambulancePhone",
                    label: "Ambulance Number",
                    icon: FaAmbulance,
                    type: "tel",
                    placeholder: "Ambulance contact",
                    value: settings.ambulancePhone,
                    onChange: (event) =>
                        setSetting("ambulancePhone", event.target.value),
                    inputMode: "tel",
                })}

                {renderInput({
                    name: "helpdeskEmail",
                    label: "Helpdesk Email",
                    icon: FaHeadset,
                    type: "email",
                    placeholder: "help@hospital.com",
                    value: settings.helpdeskEmail,
                    onChange: (event) =>
                        setSetting("helpdeskEmail", event.target.value),
                })}
            </div>

            <div className="settings-section-title settings-media-title">
                Appointments
            </div>

            <div className="settings-fields settings-fields-2">
                <div className="settings-field">
                    <label htmlFor="hs-slot">Appointment Slot</label>

                    <select
                        id="hs-slot"
                        className="settings-select"
                        value={settings.slotMinutes}
                        onChange={(event) =>
                            setSetting("slotMinutes", Number(event.target.value))
                        }
                        disabled={saving}
                    >
                        {SLOT_OPTIONS.map((minutes) => (
                            <option key={minutes} value={minutes}>
                                {minutes} minutes
                            </option>
                        ))}
                    </select>
                </div>

                {renderInput({
                    name: "advanceDays",
                    label: "Advance Booking (days)",
                    icon: FaCalendarCheck,
                    type: "number",
                    placeholder: "30",
                    value: settings.advanceDays,
                    onChange: (event) =>
                        setSetting("advanceDays", event.target.value),
                    inputMode: "numeric",
                })}
            </div>
        </>
    );

    /* =====================================================
       TAB: BILLING
    ===================================================== */

    const renderBillingTab = () => {
        const billing = settings.billing;

        const previewNumber = `${billing.invoicePrefix || ""}0001`;

        return (
            <>
                <div className="settings-section-title">
                    Tax
                </div>

                <div className="settings-fields settings-fields-3">
                    {renderInput({
                        name: "gstNumber",
                        label: "GST Number",
                        icon: FaHashtag,
                        placeholder: "15 character GSTIN",
                        value: billing.gstNumber,
                        onChange: (event) =>
                            setBilling(
                                "gstNumber",
                                event.target.value.toUpperCase()
                            ),
                        maxLength: 15,
                    })}

                    {renderInput({
                        name: "taxPercent",
                        label: "Tax (%)",
                        icon: FaPercent,
                        type: "number",
                        placeholder: "0",
                        value: billing.taxPercent,
                        onChange: (event) =>
                            setBilling("taxPercent", event.target.value),
                        inputMode: "decimal",
                    })}

                    <div className="settings-field">
                        <label htmlFor="hs-currency">Currency</label>

                        <select
                            id="hs-currency"
                            className="settings-select"
                            value={billing.currency}
                            onChange={(event) =>
                                setBilling("currency", event.target.value)
                            }
                            disabled={saving}
                        >
                            {CURRENCIES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="settings-section-title settings-media-title">
                    Invoice
                </div>

                <div className="settings-fields settings-fields-2">
                    {renderInput({
                        name: "invoicePrefix",
                        label: "Invoice Prefix",
                        icon: FaFileInvoiceDollar,
                        placeholder: "INV-",
                        value: billing.invoicePrefix,
                        onChange: (event) =>
                            setBilling("invoicePrefix", event.target.value),
                        maxLength: 12,
                    })}

                    <div className="settings-field">
                        <label>Invoice Number Preview</label>

                        <div className="settings-input-wrap settings-readonly">
                            <FaFileInvoiceDollar className="settings-input-icon" />
                            <input type="text" value={previewNumber} readOnly />
                        </div>
                    </div>

                    <div className="settings-field settings-field-full">
                        <label htmlFor="hs-footer">
                            Invoice Footer Note
                        </label>

                        <textarea
                            id="hs-footer"
                            className="settings-textarea"
                            rows={2}
                            value={billing.invoiceFooter}
                            onChange={(event) =>
                                setBilling("invoiceFooter", event.target.value)
                            }
                            placeholder="e.g. Thank you. Get well soon. This is a computer generated invoice."
                            maxLength={240}
                            disabled={saving}
                        />
                    </div>
                </div>

                <div className="settings-section-title settings-media-title">
                    Payment Methods
                </div>

                <div className="settings-chip-row">
                    {[
                        ["payCash", "Cash", FaMoneyBillWave],
                        ["payUpi", "UPI", FaMobileAlt],
                        ["payCard", "Card", FaCreditCard],
                    ].map(([key, label, Icon]) => (
                        <label
                            className={`settings-chip ${
                                billing[key] ? "is-on" : ""
                            }`}
                            key={key}
                        >
                            <input
                                type="checkbox"
                                checked={billing[key]}
                                onChange={(event) =>
                                    setBilling(key, event.target.checked)
                                }
                                disabled={saving}
                            />
                            <Icon />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>

                {billing.payUpi && (
                    <div className="settings-fields settings-fields-2">
                        {renderInput({
                            name: "upiId",
                            label: "UPI ID",
                            icon: FaMobileAlt,
                            placeholder: "hospital@bank",
                            value: billing.upiId,
                            onChange: (event) =>
                                setBilling("upiId", event.target.value),
                        })}
                    </div>
                )}
            </>
        );
    };

    /* =====================================================
       TAB: BRANDING
    ===================================================== */

    const renderBrandingTab = () => (
        <>
            <div className="settings-section-title">
                Branding
            </div>

            <div className="settings-upload-grid">
                {BRAND_FIELDS.map((field) => renderUploadCard(field))}
            </div>

            <div className="settings-upload-grid">
                {STICKER_FIELDS.map((field) => renderUploadCard(field, true))}
            </div>
        </>
    );

    /* =====================================================
       RENDER
    ===================================================== */

    if (loading) {
        return (
            <div className="settings-loading">
                <div className="settings-spinner" />
                <span>Settings load ho rahi hain...</span>
            </div>
        );
    }

    return (
        <div className="settings-backdrop">
            <div className="settings-modal">

                <div className="settings-modal-header">
                    <div className="settings-profile">
                        <div className="profile-avatar">
                            {(form.name || "H").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span>HOSPITAL ADMIN</span>
                            <h2>Hospital Settings</h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <FaTimes />
                    </button>
                </div>

                <nav className="settings-tab-bar" role="tablist">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;

                        return (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`settings-tab-button ${
                                    activeTab === tab.id ? "active" : ""
                                }`}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <form className="settings-form" onSubmit={handleSave}>

                    {activeTab === "profile" && renderProfileTab()}
                    {activeTab === "timings" && renderTimingsTab()}
                    {activeTab === "billing" && renderBillingTab()}
                    {activeTab === "branding" && renderBrandingTab()}

                    {message.text && (
                        <div
                            className={`settings-message settings-message-${message.type}`}
                        >
                            {message.type === "error" && (
                                <FaExclamationTriangle />
                            )}
                            {message.text}
                        </div>
                    )}

                    <div className="settings-actions">
                        <button
                            type="button"
                            className="cancel-add-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="settings-save-button"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="button-spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>

                </form>

            </div>

            <SuccessPopup
                open={successPopup.open}
                title={successPopup.title}
                message={successPopup.message}
                onClose={() =>
                    setSuccessPopup((previous) => ({
                        ...previous,
                        open: false,
                    }))
                }
            />
        </div>
    );
}

export default HospitalSettings;
