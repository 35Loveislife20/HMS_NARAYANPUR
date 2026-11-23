import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowRight,
    FaCheckCircle,
    FaEye,
    FaEyeSlash,
    FaHeartbeat,
    FaHospital,
    FaLock,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaSignInAlt,
    FaUserMd,
    FaUserNurse,
    FaUserShield,
    FaUsers,
    FaFlask,
    FaCapsules,
    FaFileInvoiceDollar,
    FaUserTie,
} from "react-icons/fa";

import "./Login.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

/* =========================================================
   ROLE OPTIONS
========================================================= */

const ROLE_OPTIONS = [
    {
        value: "super_admin",
        label: "Super Admin",
        description: "Manage all hospitals",
        icon: FaUserShield,
    },
    {
        value: "hospital_admin",
        label: "Hospital Admin",
        description: "Manage hospital operations",
        icon: FaUserTie,
    },
    {
        value: "doctor",
        label: "Doctor",
        description: "Doctor / Medical Staff",
        icon: FaUserMd,
    },
    {
        value: "nurse",
        label: "Nurse",
        description: "Nursing Staff",
        icon: FaUserNurse,
    },
    {
        value: "receptionist",
        label: "Receptionist",
        description: "Front Desk Staff",
        icon: FaUsers,
    },
    {
        value: "lab_technician",
        label: "Lab Technician",
        description: "Laboratory Staff",
        icon: FaFlask,
    },
    {
        value: "pharmacist",
        label: "Pharmacist",
        description: "Pharmacy Staff",
        icon: FaCapsules,
    },
    {
        value: "accountant",
        label: "Accountant",
        description: "Billing & Accounts",
        icon: FaFileInvoiceDollar,
    },
];

/* =========================================================
   FALLBACK HOSPITAL
========================================================= */

const FALLBACK_HOSPITALS = [
    {
        id: 1,
        name: "HMS Hospital Narayanpur Ghazipur",
        address:
            "Vill Narayanpur Post Lediha Dist Ghazipur Uttar Pradesh India 275202",
        city: "Ghazipur",
        location: "Narayanpur Lediha, Ghazipur",
        status: "active",
    },
];

/* =========================================================
   DEFAULT BRANDING
========================================================= */

const DEFAULT_BRANDING = {
    superAdminLogo: "",
    superAdminHeaderLogo: "",
    superAdminHeaderTitle: "HMS",
    superAdminHeaderSubtitle: "Healthcare Management",

    loginTitle: "Administrative Control Panel",
    loginSubtitle: "HMS Administration",

    hospitalName: "HMS Hospital Narayanpur Ghazipur",
    hospitalAddress:
        "Vill Narayanpur Post Lediha Dist Ghazipur Uttar Pradesh India 275202",
    hospitalDescription:
        "Manage patients, doctors, appointments, departments and hospital operations from one secure platform.",

    loginBackgroundImage: "",

    logoBackgroundMode: "transparent",

    logoShadow: true,

    logoSize: 100,
    topLogoSize: 100,
    loginLogoSize: 100,
    backgroundLogoSize: 100,
    patientCardLogoSize: 100,

    logoX: 0,
    logoY: 0,

    backgroundSize: 100,
    backgroundX: 0,
    backgroundY: 0,

    backgroundShadow: true,

    featherEnabled: false,
    featherAmount: 0,
    featherSoftness: 50,

    vignetteEnabled: false,
    vignetteIntensity: 30,
    vignetteSoftness: 50,
    vignetteSize: 100,
    vignetteX: 0,
    vignetteY: 0,

    nameSize: 24,
    nameX: 0,
    nameY: 0,
    nameColor: "#ffffff",
    nameFontFamily: "system",
    nameFontWeight: 700,
    nameLetterSpacing: 0,
    nameShadow: true,

    taglineSize: 13,
    taglineX: 0,
    taglineY: 0,
    taglineColor: "#ffffff",
    taglineFontFamily: "system",
    taglineFontWeight: 500,
    taglineLetterSpacing: 0,
    taglineShadow: true,

    controlPanelHeadingSize: 28,
    administrationHeadingSize: 22,
    loginTaglineSize: 13,
    patientTaglineSize: 12,
};

/* =========================================================
   HELPERS
========================================================= */

const pickValue = (source, keys, fallback) => {
    for (const key of keys) {
        if (
            source?.[key] !== undefined &&
            source?.[key] !== null &&
            source?.[key] !== ""
        ) {
            return source[key];
        }
    }

    return fallback;
};

const toNumber = (value, fallback) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};

const toBoolean = (value, fallback) => {
    if (value === true || value === false) {
        return value;
    }

    if (
        value === "true" ||
        value === 1 ||
        value === "1" ||
        value === "yes"
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === 0 ||
        value === "0" ||
        value === "no"
    ) {
        return false;
    }

    return fallback;
};

/* =========================================================
   BRANDING NORMALIZER
========================================================= */

const normalizeBranding = (settings) => {
    if (!settings) {
        return {
            ...DEFAULT_BRANDING,
        };
    }

    const source =
        settings?.settings ||
        settings?.data?.settings ||
        settings?.data ||
        settings;

    return {
        ...DEFAULT_BRANDING,

        superAdminLogo: pickValue(
            source,
            [
                "superAdminLogo",
                "super_admin_logo",
                "logo",
            ],
            DEFAULT_BRANDING.superAdminLogo
        ),

        superAdminHeaderLogo: pickValue(
            source,
            [
                "superAdminHeaderLogo",
                "super_admin_header_logo",
                "headerLogo",
                "header_logo",
            ],
            DEFAULT_BRANDING.superAdminHeaderLogo
        ),

        superAdminHeaderTitle: pickValue(
            source,
            [
                "superAdminHeaderTitle",
                "super_admin_header_title",
                "headerTitle",
                "header_title",
            ],
            DEFAULT_BRANDING.superAdminHeaderTitle
        ),

        superAdminHeaderSubtitle: pickValue(
            source,
            [
                "superAdminHeaderSubtitle",
                "super_admin_header_subtitle",
                "headerSubtitle",
                "header_subtitle",
            ],
            DEFAULT_BRANDING.superAdminHeaderSubtitle
        ),

        loginTitle: pickValue(
            source,
            [
                "loginTitle",
                "login_title",
            ],
            DEFAULT_BRANDING.loginTitle
        ),

        loginSubtitle: pickValue(
            source,
            [
                "loginSubtitle",
                "login_subtitle",
            ],
            DEFAULT_BRANDING.loginSubtitle
        ),

        hospitalName: pickValue(
            source,
            [
                "hospitalName",
                "hospital_name",
                "name",
            ],
            DEFAULT_BRANDING.hospitalName
        ),

        hospitalAddress: pickValue(
            source,
            [
                "hospitalAddress",
                "hospital_address",
                "address",
            ],
            DEFAULT_BRANDING.hospitalAddress
        ),

        hospitalDescription: pickValue(
            source,
            [
                "hospitalDescription",
                "hospital_description",
                "description",
            ],
            DEFAULT_BRANDING.hospitalDescription
        ),

        loginBackgroundImage: pickValue(
            source,
            [
                "loginBackgroundImage",
                "login_background_image",
            ],
            DEFAULT_BRANDING.loginBackgroundImage
        ),

        logoBackgroundMode: pickValue(
            source,
            [
                "logoBackgroundMode",
                "logo_background_mode",
            ],
            DEFAULT_BRANDING.logoBackgroundMode
        ),

        logoShadow: toBoolean(
            pickValue(
                source,
                ["logoShadow", "logo_shadow"],
                DEFAULT_BRANDING.logoShadow
            ),
            DEFAULT_BRANDING.logoShadow
        ),

        logoSize: toNumber(
            pickValue(
                source,
                ["logoSize", "logo_size"],
                DEFAULT_BRANDING.logoSize
            ),
            DEFAULT_BRANDING.logoSize
        ),

        topLogoSize: toNumber(
            pickValue(
                source,
                ["topLogoSize", "top_logo_size"],
                DEFAULT_BRANDING.topLogoSize
            ),
            DEFAULT_BRANDING.topLogoSize
        ),

        loginLogoSize: toNumber(
            pickValue(
                source,
                ["loginLogoSize", "login_logo_size"],
                DEFAULT_BRANDING.loginLogoSize
            ),
            DEFAULT_BRANDING.loginLogoSize
        ),

        backgroundLogoSize: toNumber(
            pickValue(
                source,
                [
                    "backgroundLogoSize",
                    "background_logo_size",
                ],
                DEFAULT_BRANDING.backgroundLogoSize
            ),
            DEFAULT_BRANDING.backgroundLogoSize
        ),

        patientCardLogoSize: toNumber(
            pickValue(
                source,
                [
                    "patientCardLogoSize",
                    "patient_card_logo_size",
                ],
                DEFAULT_BRANDING.patientCardLogoSize
            ),
            DEFAULT_BRANDING.patientCardLogoSize
        ),

        logoX: toNumber(
            pickValue(
                source,
                ["logoX", "logo_x"],
                DEFAULT_BRANDING.logoX
            ),
            DEFAULT_BRANDING.logoX
        ),

        logoY: toNumber(
            pickValue(
                source,
                ["logoY", "logo_y"],
                DEFAULT_BRANDING.logoY
            ),
            DEFAULT_BRANDING.logoY
        ),

        backgroundSize: toNumber(
            pickValue(
                source,
                ["backgroundSize", "background_size"],
                DEFAULT_BRANDING.backgroundSize
            ),
            DEFAULT_BRANDING.backgroundSize
        ),

        backgroundX: toNumber(
            pickValue(
                source,
                ["backgroundX", "background_x"],
                DEFAULT_BRANDING.backgroundX
            ),
            DEFAULT_BRANDING.backgroundX
        ),

        backgroundY: toNumber(
            pickValue(
                source,
                ["backgroundY", "background_y"],
                DEFAULT_BRANDING.backgroundY
            ),
            DEFAULT_BRANDING.backgroundY
        ),

        backgroundShadow: toBoolean(
            pickValue(
                source,
                [
                    "backgroundShadow",
                    "background_shadow",
                ],
                DEFAULT_BRANDING.backgroundShadow
            ),
            DEFAULT_BRANDING.backgroundShadow
        ),

        featherEnabled: toBoolean(
            pickValue(
                source,
                [
                    "featherEnabled",
                    "feather_enabled",
                ],
                DEFAULT_BRANDING.featherEnabled
            ),
            DEFAULT_BRANDING.featherEnabled
        ),

        featherAmount: toNumber(
            pickValue(
                source,
                [
                    "featherAmount",
                    "feather_amount",
                ],
                DEFAULT_BRANDING.featherAmount
            ),
            DEFAULT_BRANDING.featherAmount
        ),

        featherSoftness: toNumber(
            pickValue(
                source,
                [
                    "featherSoftness",
                    "feather_softness",
                ],
                DEFAULT_BRANDING.featherSoftness
            ),
            DEFAULT_BRANDING.featherSoftness
        ),

        vignetteEnabled: toBoolean(
            pickValue(
                source,
                [
                    "vignetteEnabled",
                    "vignette_enabled",
                ],
                DEFAULT_BRANDING.vignetteEnabled
            ),
            DEFAULT_BRANDING.vignetteEnabled
        ),

        vignetteIntensity: toNumber(
            pickValue(
                source,
                [
                    "vignetteIntensity",
                    "vignette_intensity",
                ],
                DEFAULT_BRANDING.vignetteIntensity
            ),
            DEFAULT_BRANDING.vignetteIntensity
        ),

        vignetteSoftness: toNumber(
            pickValue(
                source,
                [
                    "vignetteSoftness",
                    "vignette_softness",
                ],
                DEFAULT_BRANDING.vignetteSoftness
            ),
            DEFAULT_BRANDING.vignetteSoftness
        ),

        vignetteSize: toNumber(
            pickValue(
                source,
                [
                    "vignetteSize",
                    "vignette_size",
                ],
                DEFAULT_BRANDING.vignetteSize
            ),
            DEFAULT_BRANDING.vignetteSize
        ),

        vignetteX: toNumber(
            pickValue(
                source,
                ["vignetteX", "vignette_x"],
                DEFAULT_BRANDING.vignetteX
            ),
            DEFAULT_BRANDING.vignetteX
        ),

        vignetteY: toNumber(
            pickValue(
                source,
                ["vignetteY", "vignette_y"],
                DEFAULT_BRANDING.vignetteY
            ),
            DEFAULT_BRANDING.vignetteY
        ),

        nameSize: toNumber(
            pickValue(
                source,
                ["nameSize", "name_size"],
                DEFAULT_BRANDING.nameSize
            ),
            DEFAULT_BRANDING.nameSize
        ),

        nameX: toNumber(
            pickValue(
                source,
                ["nameX", "name_x"],
                DEFAULT_BRANDING.nameX
            ),
            DEFAULT_BRANDING.nameX
        ),

        nameY: toNumber(
            pickValue(
                source,
                ["nameY", "name_y"],
                DEFAULT_BRANDING.nameY
            ),
            DEFAULT_BRANDING.nameY
        ),

        nameColor: pickValue(
            source,
            ["nameColor", "name_color"],
            DEFAULT_BRANDING.nameColor
        ),

        nameFontFamily: pickValue(
            source,
            [
                "nameFontFamily",
                "name_font_family",
            ],
            DEFAULT_BRANDING.nameFontFamily
        ),

        nameFontWeight: toNumber(
            pickValue(
                source,
                [
                    "nameFontWeight",
                    "name_font_weight",
                ],
                DEFAULT_BRANDING.nameFontWeight
            ),
            DEFAULT_BRANDING.nameFontWeight
        ),

        nameLetterSpacing: toNumber(
            pickValue(
                source,
                [
                    "nameLetterSpacing",
                    "name_letter_spacing",
                ],
                DEFAULT_BRANDING.nameLetterSpacing
            ),
            DEFAULT_BRANDING.nameLetterSpacing
        ),

        nameShadow: toBoolean(
            pickValue(
                source,
                [
                    "nameShadow",
                    "name_shadow",
                ],
                DEFAULT_BRANDING.nameShadow
            ),
            DEFAULT_BRANDING.nameShadow
        ),

        taglineSize: toNumber(
            pickValue(
                source,
                [
                    "taglineSize",
                    "tagline_size",
                ],
                DEFAULT_BRANDING.taglineSize
            ),
            DEFAULT_BRANDING.taglineSize
        ),

        taglineX: toNumber(
            pickValue(
                source,
                ["taglineX", "tagline_x"],
                DEFAULT_BRANDING.taglineX
            ),
            DEFAULT_BRANDING.taglineX
        ),

        taglineY: toNumber(
            pickValue(
                source,
                ["taglineY", "tagline_y"],
                DEFAULT_BRANDING.taglineY
            ),
            DEFAULT_BRANDING.taglineY
        ),

        taglineColor: pickValue(
            source,
            ["taglineColor", "tagline_color"],
            DEFAULT_BRANDING.taglineColor
        ),

        taglineFontFamily: pickValue(
            source,
            [
                "taglineFontFamily",
                "tagline_font_family",
            ],
            DEFAULT_BRANDING.taglineFontFamily
        ),

        taglineFontWeight: toNumber(
            pickValue(
                source,
                [
                    "taglineFontWeight",
                    "tagline_font_weight",
                ],
                DEFAULT_BRANDING.taglineFontWeight
            ),
            DEFAULT_BRANDING.taglineFontWeight
        ),

        taglineLetterSpacing: toNumber(
            pickValue(
                source,
                [
                    "taglineLetterSpacing",
                    "tagline_letter_spacing",
                ],
                DEFAULT_BRANDING.taglineLetterSpacing
            ),
            DEFAULT_BRANDING.taglineLetterSpacing
        ),

        taglineShadow: toBoolean(
            pickValue(
                source,
                [
                    "taglineShadow",
                    "tagline_shadow",
                ],
                DEFAULT_BRANDING.taglineShadow
            ),
            DEFAULT_BRANDING.taglineShadow
        ),

        controlPanelHeadingSize: toNumber(
            pickValue(
                source,
                [
                    "controlPanelHeadingSize",
                    "control_panel_heading_size",
                ],
                DEFAULT_BRANDING.controlPanelHeadingSize
            ),
            DEFAULT_BRANDING.controlPanelHeadingSize
        ),

        administrationHeadingSize: toNumber(
            pickValue(
                source,
                [
                    "administrationHeadingSize",
                    "administration_heading_size",
                ],
                DEFAULT_BRANDING.administrationHeadingSize
            ),
            DEFAULT_BRANDING.administrationHeadingSize
        ),

        loginTaglineSize: toNumber(
            pickValue(
                source,
                [
                    "loginTaglineSize",
                    "login_tagline_size",
                ],
                DEFAULT_BRANDING.loginTaglineSize
            ),
            DEFAULT_BRANDING.loginTaglineSize
        ),

        patientTaglineSize: toNumber(
            pickValue(
                source,
                [
                    "patientTaglineSize",
                    "patient_tagline_size",
                ],
                DEFAULT_BRANDING.patientTaglineSize
            ),
            DEFAULT_BRANDING.patientTaglineSize
        ),
    };
};

/* =========================================================
   LOCAL BRANDING
========================================================= */

const loadLocalBranding = () => {
    try {
        const saved =
            localStorage.getItem("hmsSettings");

        if (saved) {
            return normalizeBranding(
                JSON.parse(saved)
            );
        }
    } catch (error) {
        console.error(
            "HMS local branding error:",
            error
        );
    }

    return normalizeBranding({
        superAdminLogo:
            localStorage.getItem(
                "hms_super_admin_logo"
            ) || "",

        loginTitle:
            localStorage.getItem(
                "hms_login_title"
            ) ||
            DEFAULT_BRANDING.loginTitle,

        loginSubtitle:
            localStorage.getItem(
                "hms_login_subtitle"
            ) ||
            DEFAULT_BRANDING.loginSubtitle,
    });
};

/* =========================================================
   HOSPITAL HELPERS
========================================================= */

const normalizeHospitalList = (result) => {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.hospitals)) {
        return result.hospitals;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.data?.hospitals)) {
        return result.data.hospitals;
    }

    return [];
};

const getHospitalName = (hospital) =>
    hospital?.name ||
    hospital?.hospital_name ||
    hospital?.hospitalName ||
    "Hospital";

const getHospitalLocation = (hospital) =>
    hospital?.location ||
    hospital?.city ||
    hospital?.address ||
    "Location not available";

const getHospitalId = (hospital) =>
    hospital?.id ??
    hospital?.hospital_id ??
    hospital?.hospitalId;

const createHospitalSlug = (hospital) => {
    const id = getHospitalId(hospital);

    const name = getHospitalName(hospital)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return id
        ? `${name || "hospital"}-${id}`
        : name || "hospital";
};

const normalizeRole = (role) => {
    if (!role) {
        return "";
    }

    return String(role)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
};

const getErrorMessage = (data, fallback) => {
    if (
        typeof data === "string" &&
        data.trim()
    ) {
        return data;
    }

    return (
        data?.message ||
        data?.error ||
        data?.details ||
        fallback
    );
};

const getFontFamily = (value) => {
    if (!value || value === "system") {
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    }

    return value;
};

/* =========================================================
   LOGIN
========================================================= */

function Login() {
    const navigate = useNavigate();

    const [branding, setBranding] = useState(
        () => loadLocalBranding()
    );

    const [role, setRole] = useState("");
    const [hospitalId, setHospitalId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] =
        useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRoleMenu, setShowRoleMenu] =
        useState(false);

    /* =====================================================
       SELECTED ROLE
    ===================================================== */

    const selectedRole = useMemo(
        () =>
            ROLE_OPTIONS.find(
                (item) => item.value === role
            ),
        [role]
    );

    /* =====================================================
       SELECTED HOSPITAL
    ===================================================== */

    const selectedHospital = useMemo(
        () =>
            hospitals.find(
                (hospital) =>
                    String(
                        getHospitalId(hospital)
                    ) === String(hospitalId)
            ),
        [hospitals, hospitalId]
    );

    /* =====================================================
       LOAD SETTINGS
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        const loadBranding = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/settings`,
                    {
                        method: "GET",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";

                let result = null;

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {
                    result =
                        await response.json();
                } else {
                    const text =
                        await response.text();

                    try {
                        result =
                            JSON.parse(text);
                    } catch {
                        result = null;
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        getErrorMessage(
                            result,
                            "Unable to load branding settings."
                        )
                    );
                }

                if (!mounted) {
                    return;
                }

                const nextBranding =
                    normalizeBranding(result);

                setBranding(nextBranding);

                localStorage.setItem(
                    "hmsSettings",
                    JSON.stringify(
                        nextBranding
                    )
                );

                if (
                    nextBranding.superAdminLogo
                ) {
                    localStorage.setItem(
                        "hms_super_admin_logo",
                        nextBranding.superAdminLogo
                    );
                }

                if (
                    nextBranding.loginTitle
                ) {
                    localStorage.setItem(
                        "hms_login_title",
                        nextBranding.loginTitle
                    );
                }

                if (
                    nextBranding.loginSubtitle
                ) {
                    localStorage.setItem(
                        "hms_login_subtitle",
                        nextBranding.loginSubtitle
                    );
                }
            } catch (requestError) {
                console.error(
                    "Branding loading error:",
                    requestError
                );
            }
        };

        loadBranding();

        return () => {
            mounted = false;
        };
    }, []);

    /* =====================================================
       LIVE SETTINGS UPDATE
    ===================================================== */

    useEffect(() => {
        const applySettings = (settings) => {
            const next =
                normalizeBranding(settings);

            setBranding(next);

            try {
                localStorage.setItem(
                    "hmsSettings",
                    JSON.stringify(next)
                );

                if (next.superAdminLogo) {
                    localStorage.setItem(
                        "hms_super_admin_logo",
                        next.superAdminLogo
                    );
                }

                if (next.loginTitle) {
                    localStorage.setItem(
                        "hms_login_title",
                        next.loginTitle
                    );
                }

                if (next.loginSubtitle) {
                    localStorage.setItem(
                        "hms_login_subtitle",
                        next.loginSubtitle
                    );
                }
            } catch (storageError) {
                console.error(
                    "Branding storage error:",
                    storageError
                );
            }
        };

        const handleSettingsUpdate = (event) => {
            try {
                const settings =
                    event?.detail?.settings ||
                    event?.detail ||
                    null;

                if (settings) {
                    applySettings(settings);
                } else {
                    setBranding(
                        loadLocalBranding()
                    );
                }
            } catch (updateError) {
                console.error(
                    "Live branding update error:",
                    updateError
                );

                setBranding(
                    loadLocalBranding()
                );
            }
        };

        const handleStorage = (event) => {
            if (
                [
                    "hmsSettings",
                    "hms_super_admin_logo",
                    "hms_login_title",
                    "hms_login_subtitle",
                ].includes(event.key)
            ) {
                setBranding(
                    loadLocalBranding()
                );
            }
        };

        window.addEventListener(
            "hmsSettingsUpdated",
            handleSettingsUpdate
        );

        window.addEventListener(
            "hmsSuperAdminBrandingUpdated",
            handleSettingsUpdate
        );

        window.addEventListener(
            "storage",
            handleStorage
        );

        return () => {
            window.removeEventListener(
                "hmsSettingsUpdated",
                handleSettingsUpdate
            );

            window.removeEventListener(
                "hmsSuperAdminBrandingUpdated",
                handleSettingsUpdate
            );

            window.removeEventListener(
                "storage",
                handleStorage
            );
        };
    }, []);

    /* =====================================================
       REMEMBERED LOGIN
    ===================================================== */

    useEffect(() => {
        const savedEmail =
            localStorage.getItem(
                "hms_remember_email"
            );

        const savedRole =
            localStorage.getItem(
                "hms_remember_role"
            );

        const savedHospital =
            localStorage.getItem(
                "hms_remember_hospital"
            );

        if (savedEmail) {
            setEmail(savedEmail);
        }

        if (
            savedRole &&
            ROLE_OPTIONS.some(
                (item) =>
                    item.value === savedRole
            )
        ) {
            setRole(savedRole);
        }

        if (savedHospital) {
            setHospitalId(savedHospital);
        }
    }, []);

    /* =====================================================
       LOAD HOSPITALS
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        const loadHospitals = async () => {
            setLoadingHospitals(true);

            try {
                const token =
                    localStorage.getItem(
                        "hms_token"
                    ) ||
                    localStorage.getItem(
                        "token"
                    ) ||
                    localStorage.getItem(
                        "authToken"
                    );

                const headers = {
                    Accept:
                        "application/json",
                };

                if (token) {
                    headers.Authorization =
                        `Bearer ${token}`;
                }

                const response = await fetch(
                    `${API_URL}/hospitals`,
                    {
                        method: "GET",
                        headers,
                    }
                );

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";

                let result = null;

                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {
                    result =
                        await response.json();
                } else {
                    const text =
                        await response.text();

                    try {
                        result =
                            JSON.parse(text);
                    } catch {
                        result = [];
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        getErrorMessage(
                            result,
                            "Unable to load hospitals."
                        )
                    );
                }

                const hospitalList =
                    normalizeHospitalList(
                        result
                    ).filter(
                        (hospital) => {
                            const status =
                                String(
                                    hospital?.status ??
                                        "active"
                                ).toLowerCase();

                            return (
                                status !==
                                    "inactive" &&
                                status !==
                                    "disabled" &&
                                status !==
                                    "closed"
                            );
                        }
                    );

                if (!mounted) {
                    return;
                }

                setHospitals(
                    hospitalList.length
                        ? hospitalList
                        : FALLBACK_HOSPITALS
                );
            } catch (requestError) {
                console.error(
                    "Hospital loading error:",
                    requestError
                );

                if (mounted) {
                    setHospitals(
                        FALLBACK_HOSPITALS
                    );
                }
            } finally {
                if (mounted) {
                    setLoadingHospitals(
                        false
                    );
                }
            }
        };

        loadHospitals();

        return () => {
            mounted = false;
        };
    }, []);

    /* =====================================================
       ROLE CHANGE
    ===================================================== */

    const handleRoleChange = (nextRole) => {
        setRole(nextRole);
        setShowRoleMenu(false);
        setError("");

        if (rememberMe) {
            localStorage.setItem(
                "hms_remember_role",
                nextRole
            );
        }
    };

    /* =====================================================
       HOSPITAL CHANGE
    ===================================================== */

    const handleHospitalChange = (event) => {
        const value =
            event.target.value;

        setHospitalId(value);
        setError("");

        if (rememberMe) {
            localStorage.setItem(
                "hms_remember_hospital",
                value
            );
        }
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateForm = () => {
        if (!role) {
            return "Please select your role.";
        }

        if (!hospitalId) {
            return "Please select your hospital.";
        }

        if (!email.trim()) {
            return "Please enter your email or mobile number.";
        }

        if (!password) {
            return "Please enter your password.";
        }

        return "";
    };

    /* =====================================================
       LOGIN
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        const validationError =
            validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const normalizedEmail =
            email.trim().toLowerCase();

        try {
            const payload = {
                email: normalizedEmail,
                password,
                role,
                hospital_id:
                    Number(hospitalId),
            };

            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let result = null;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {
                result =
                    await response.json();
            } else {
                const text =
                    await response.text();

                try {
                    result =
                        JSON.parse(text);
                } catch {
                    result = {
                        message: text,
                    };
                }
            }

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Login failed. Please check your credentials."
                    )
                );
            }

            const token =
                result?.token ||
                result?.accessToken ||
                result?.data?.token ||
                result?.data?.accessToken;

            const user =
                result?.user ||
                result?.data?.user ||
                result?.data ||
                null;

            if (token) {
                localStorage.setItem(
                    "hms_token",
                    token
                );

                localStorage.setItem(
                    "token",
                    token
                );

                localStorage.setItem(
                    "authToken",
                    token
                );
            }

            if (user) {
                localStorage.setItem(
                    "hms_user",
                    JSON.stringify(user)
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );
            }

            if (rememberMe) {
                localStorage.setItem(
                    "hms_remember_email",
                    normalizedEmail
                );

                localStorage.setItem(
                    "hms_remember_role",
                    role
                );

                localStorage.setItem(
                    "hms_remember_hospital",
                    hospitalId
                );
            } else {
                localStorage.removeItem(
                    "hms_remember_email"
                );

                localStorage.removeItem(
                    "hms_remember_role"
                );

                localStorage.removeItem(
                    "hms_remember_hospital"
                );
            }

            const backendRole =
                normalizeRole(
                    user?.role ||
                        user?.user_role ||
                        result?.role ||
                        role
                );

            const finalRole =
                backendRole ||
                normalizeRole(role);

            const finalHospital =
                user?.hospital_id ||
                user?.hospitalId ||
                hospitalId;

            const hospital =
                hospitals.find(
                    (item) =>
                        String(
                            getHospitalId(item)
                        ) ===
                        String(
                            finalHospital
                        )
                ) ||
                selectedHospital;

            const hospitalSlug =
                createHospitalSlug(
                    hospital
                );

            if (
                finalRole ===
                    "super_admin" ||
                finalRole ===
                    "superadmin"
            ) {
                navigate(
                    "/super-admin"
                );
                return;
            }

            if (
                finalRole ===
                    "hospital_admin" ||
                finalRole === "admin" ||
                finalRole ===
                    "hospitaladmin"
            ) {
                navigate(
                    `/dashboard/${hospitalSlug}`
                );
                return;
            }

            navigate(
                `/staff-dashboard/${hospitalSlug}`
            );
        } catch (requestError) {
            console.error(
                "HMS login error:",
                requestError
            );

            setError(
                requestError?.message ||
                    "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const handlePatientPortal = () => {
        navigate("/patient-portal");
    };

    const handleForgotPassword = () => {
        navigate("/forgot-password");
    };

    const CurrentRoleIcon =
        selectedRole?.icon || FaUsers;

    /* =====================================================
       BRANDING STYLES
    ===================================================== */

    const logoBackground =
        branding.logoBackgroundMode ===
        "dark"
            ? "rgba(0,0,0,.28)"
            : branding.logoBackgroundMode ===
              "light"
            ? "rgba(255,255,255,.75)"
            : branding.logoBackgroundMode ===
              "glass"
            ? "rgba(255,255,255,.12)"
            : "transparent";

    const logoShadow =
        branding.logoShadow
            ? "drop-shadow(0 12px 24px rgba(0,0,0,.45))"
            : "none";

    const nameShadow =
        branding.nameShadow
            ? "0 3px 12px rgba(0,0,0,.35)"
            : "none";

    const taglineShadow =
        branding.taglineShadow
            ? "0 2px 8px rgba(0,0,0,.30)"
            : "none";

    const backgroundImage =
        branding.loginBackgroundImage
            ? `url("${String(
                  branding.loginBackgroundImage
              ).replace(
                  /"/g,
                  '\\"'
              )}")`
            : undefined;

    const loginPageStyle = {
        backgroundImage,
        backgroundSize:
            backgroundImage
                ? `${Math.max(
                      1,
                      branding.backgroundSize
                  )}%`
                : undefined,
        backgroundPosition:
            backgroundImage
                ? `${50 + branding.backgroundX}% ${
                      50 +
                      branding.backgroundY
                  }%`
                : undefined,
        backgroundRepeat:
            "no-repeat",
    };

    const mainLogoStyle = {
        width: `${Math.max(
            40,
            branding.loginLogoSize
        )}px`,

        height: `${Math.max(
            40,
            branding.loginLogoSize
        )}px`,

        transform:
            `translate(${branding.logoX}px, ${branding.logoY}px)`,

        filter: logoShadow,

        background: logoBackground,
    };

    const brandNameStyle = {
        fontSize: `${Math.max(
            12,
            branding.nameSize
        )}px`,

        transform:
            `translate(${branding.nameX}px, ${branding.nameY}px)`,

        color: branding.nameColor,

        fontFamily:
            getFontFamily(
                branding.nameFontFamily
            ),

        fontWeight:
            branding.nameFontWeight,

        letterSpacing:
            `${branding.nameLetterSpacing}px`,

        textShadow: nameShadow,
    };

    const brandTaglineStyle = {
        fontSize: `${Math.max(
            8,
            branding.taglineSize
        )}px`,

        transform:
            `translate(${branding.taglineX}px, ${branding.taglineY}px)`,

        color:
            branding.taglineColor,

        fontFamily:
            getFontFamily(
                branding.taglineFontFamily
            ),

        fontWeight:
            branding.taglineFontWeight,

        letterSpacing:
            `${branding.taglineLetterSpacing}px`,

        textShadow:
            taglineShadow,
    };

    const controlPanelHeadingStyle = {
        fontSize:
            `${Math.max(
                14,
                branding.controlPanelHeadingSize
            )}px`,
    };

    const administrationHeadingStyle = {
        fontSize:
            `${Math.max(
                12,
                branding.administrationHeadingSize
            )}px`,
    };

    const patientTaglineStyle = {
        fontSize:
            `${Math.max(
                8,
                branding.patientTaglineSize
            )}px`,
    };

    const featherOpacity = Math.min(
        1,
        Math.max(
            0,
            branding.featherAmount / 100
        )
    );

    const vignetteOpacity = Math.min(
        1,
        Math.max(
            0,
            branding.vignetteIntensity / 100
        )
    );

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div
            className="hms-login-page"
            style={loginPageStyle}
        >
            {branding.featherEnabled && (
                <div
                    className="hms-settings-feather-overlay"
                    style={{
                        position:
                            "absolute",
                        inset: 0,
                        pointerEvents:
                            "none",
                        zIndex: 0,
                        background:
                            `radial-gradient(ellipse at center, transparent ${Math.max(
                                0,
                                100 -
                                    branding.featherSoftness
                            )}%, rgba(0,0,0,${featherOpacity}) 100%)`,
                    }}
                />
            )}

            {branding.vignetteEnabled && (
                <div
                    className="hms-settings-vignette-overlay"
                    style={{
                        position:
                            "absolute",
                        inset: 0,
                        pointerEvents:
                            "none",
                        zIndex: 0,
                        background:
                            `radial-gradient(ellipse at ${50 + branding.vignetteX}% ${
                                50 +
                                branding.vignetteY
                            }%, transparent 0%, rgba(0,0,0,${vignetteOpacity}) ${Math.max(
                                20,
                                branding.vignetteSize
                            )}%)`,
                    }}
                />
            )}

            <div className="hms-login-grid" />

            <div className="hms-login-glow hms-login-glow-one" />

            <div className="hms-login-glow hms-login-glow-two" />

            {/* =================================================
               HEADER
            ================================================= */}

            <header className="hms-login-header">
                <div className="hms-login-brand-mini">
                    <div
                        className="hms-login-brand-mini-icon"
                        style={{
                            width:
                                `${Math.max(
                                    36,
                                    branding.topLogoSize *
                                        0.45
                                )}px`,

                            height:
                                `${Math.max(
                                    36,
                                    branding.topLogoSize *
                                        0.45
                                )}px`,

                            filter:
                                logoShadow,
                        }}
                    >
                        {(
                            branding.superAdminHeaderLogo ||
                            branding.superAdminLogo
                        ) ? (
                            <img
                                src={
                                    branding.superAdminHeaderLogo ||
                                    branding.superAdminLogo
                                }
                                alt="HMS"
                                style={{
                                    width:
                                        "100%",
                                    height:
                                        "100%",
                                    objectFit:
                                        "contain",
                                }}
                            />
                        ) : (
                            <FaHeartbeat />
                        )}
                    </div>

                    <div>
                        <strong>
                            {branding.superAdminHeaderTitle ||
                                "HMS"}
                        </strong>

                        <span>
                            {branding.superAdminHeaderSubtitle ||
                                "Healthcare Management"}
                        </span>
                    </div>
                </div>

                <div className="hms-login-header-security">
                    <FaShieldAlt />

                    <span>
                        Secure Healthcare Platform
                    </span>
                </div>
            </header>

            {/* =================================================
               MAIN
            ================================================= */}

            <main className="hms-login-main">
                {/* =================================================
                   LEFT
                ================================================= */}

                <section className="hms-login-left">
                    <div className="hms-brand-content">
                        <div className="hms-smart-badge">
                            <span className="hms-smart-dot" />

                            SMART HEALTHCARE MANAGEMENT
                        </div>

                        <div
                            className="hms-main-logo"
                            style={
                                mainLogoStyle
                            }
                        >
                            <img
                                src={
                                    branding.superAdminLogo ||
                                    "/hms-logo.png"
                                }
                                alt={
                                    branding.hospitalName
                                }
                                style={{
                                    width:
                                        "100%",
                                    height:
                                        "100%",
                                    objectFit:
                                        "contain",
                                }}
                                onError={(
                                    event
                                ) => {
                                    event.currentTarget.style.display =
                                        "none";

                                    const fallback =
                                        event
                                            .currentTarget
                                            .parentElement
                                            ?.querySelector(
                                                ".hms-logo-fallback"
                                            );

                                    if (
                                        fallback
                                    ) {
                                        fallback.style.display =
                                            "flex";
                                    }
                                }}
                            />

                            <div className="hms-logo-fallback">
                                <FaHeartbeat />
                            </div>
                        </div>

                        {/* SETTINGS CONNECTED HOSPITAL NAME */}

                        <h1
                            style={
                                brandNameStyle
                            }
                        >
                            {branding.hospitalName}

                        </h1>

                        {/* SETTINGS CONNECTED ADDRESS */}

                        <div
                            className="hms-location"
                            style={
                                brandTaglineStyle
                            }
                        >
                            <FaMapMarkerAlt />

                            <span>
                                {branding.hospitalAddress}
                            </span>
                        </div>

                        {/* SETTINGS CONNECTED DESCRIPTION */}

                        <p
                            className="hms-brand-description"
                            style={
                                brandTaglineStyle
                            }
                        >
                            {branding.hospitalDescription}
                        </p>

                        <div className="hms-brand-points">
                            <div>
                                <FaCheckCircle />

                                <span>
                                    Complete Hospital
                                    Management
                                </span>
                            </div>

                            <div>
                                <FaCheckCircle />

                                <span>
                                    Secure Digital
                                    Records
                                </span>
                            </div>

                            <div>
                                <FaCheckCircle />

                                <span>
                                    Real-Time Hospital
                                    Operations
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hms-hospital-visual">
                        <img
                            src="/hospital-building-2.png"
                            alt="HMS Hospital Building"
                            style={{
                                width:
                                    "100%",
                                height:
                                    "100%",
                                objectFit:
                                    "contain",
                                objectPosition:
                                    "center bottom",
                                opacity:
                                    Math.max(
                                        0.15,
                                        branding.backgroundLogoSize /
                                            100
                                    ),
                            }}
                            onError={(
                                event
                            ) => {
                                event.currentTarget.style.display =
                                    "none";
                            }}
                        />
                    </div>
                </section>

                {/* =================================================
                   RIGHT LOGIN
                ================================================= */}

                <section className="hms-login-right">
                    <div className="hms-login-card">
                        <div className="hms-login-card-top">
                            <div className="hms-login-card-icon">
                                <FaLock />
                            </div>

                            <div>
                                <span className="hms-login-overline">
                                    SECURE ACCESS
                                </span>

                                <h2
                                    style={
                                        controlPanelHeadingStyle
                                    }
                                >
                                    {branding.loginTitle}
                                </h2>

                                <p
                                    style={
                                        administrationHeadingStyle
                                    }
                                >
                                    {branding.loginSubtitle}
                                </p>
                            </div>
                        </div>

                        <form
                            className="hms-login-form"
                            onSubmit={
                                handleSubmit
                            }
                            noValidate
                        >
                            {/* ROLE */}

                            <div className="hms-form-group">
                                <label htmlFor="hms-role">
                                    Select Role
                                </label>

                                <div className="hms-role-selector">
                                    <button
                                        type="button"
                                        className={`hms-role-button ${
                                            showRoleMenu
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setShowRoleMenu(
                                                (
                                                    current
                                                ) =>
                                                    !current
                                            )
                                        }
                                        aria-expanded={
                                            showRoleMenu
                                        }
                                    >
                                        <span className="hms-role-button-left">
                                            <span className="hms-role-icon">
                                                <CurrentRoleIcon />
                                            </span>

                                            <span>
                                                {selectedRole
                                                    ? selectedRole.label
                                                    : "Select your role"}
                                            </span>
                                        </span>

                                        <span className="hms-select-chevron">
                                            ▾
                                        </span>
                                    </button>

                                    {showRoleMenu && (
                                        <div className="hms-role-menu">
                                            {ROLE_OPTIONS.map(
                                                (
                                                    item
                                                ) => {
                                                    const Icon =
                                                        item.icon;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={
                                                                item.value
                                                            }
                                                            className={`hms-role-option ${
                                                                role ===
                                                                item.value
                                                                    ? "selected"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                handleRoleChange(
                                                                    item.value
                                                                )
                                                            }
                                                        >
                                                            <span className="hms-role-option-icon">
                                                                <Icon />
                                                            </span>

                                                            <span className="hms-role-option-text">
                                                                <strong>
                                                                    {
                                                                        item.label
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        item.description
                                                                    }
                                                                </small>
                                                            </span>

                                                            {role ===
                                                                item.value && (
                                                                <FaCheckCircle className="hms-role-check" />
                                                            )}
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* HOSPITAL */}

                            <div className="hms-form-group">
                                <label htmlFor="hms-hospital">
                                    Select Hospital
                                </label>

                                <div className="hms-input-wrapper">
                                    <FaHospital className="hms-input-icon" />

                                    <select
                                        id="hms-hospital"
                                        value={
                                            hospitalId
                                        }
                                        onChange={
                                            handleHospitalChange
                                        }
                                        disabled={
                                            loadingHospitals ||
                                            loading
                                        }
                                        className="hms-input hms-select"
                                    >
                                        <option value="">
                                            {loadingHospitals
                                                ? "Loading hospitals..."
                                                : "Select your hospital"}
                                        </option>

                                        {hospitals.map(
                                            (
                                                hospital
                                            ) => (
                                                <option
                                                    key={String(
                                                        getHospitalId(
                                                            hospital
                                                        )
                                                    )}
                                                    value={String(
                                                        getHospitalId(
                                                            hospital
                                                        )
                                                    )}
                                                >
                                                    {getHospitalName(
                                                        hospital
                                                    )}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <span className="hms-native-chevron">
                                        ▾
                                    </span>
                                </div>

                                {selectedHospital && (
                                    <div className="hms-selected-hospital">
                                        <FaMapMarkerAlt />

                                        <span>
                                            {getHospitalLocation(
                                                selectedHospital
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* EMAIL */}

                            <div className="hms-form-group">
                                <label htmlFor="hms-email">
                                    Email / Mobile
                                </label>

                                <div className="hms-input-wrapper">
                                    <FaUserTie className="hms-input-icon" />

                                    <input
                                        id="hms-email"
                                        type="text"
                                        value={email}
                                        onChange={(
                                            event
                                        ) =>
                                            setEmail(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="hms-input"
                                        placeholder="Enter email or mobile number"
                                        autoComplete="username"
                                        disabled={
                                            loading
                                        }
                                    />
                                </div>
                            </div>

                            {/* PASSWORD */}

                            <div className="hms-form-group">
                                <div className="hms-label-row">
                                    <label htmlFor="hms-password">
                                        Password
                                    </label>

                                    <button
                                        type="button"
                                        className="hms-show-password"
                                        onClick={() =>
                                            setShowPassword(
                                                (
                                                    current
                                                ) =>
                                                    !current
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <>
                                                <FaEyeSlash />
                                                Hide
                                            </>
                                        ) : (
                                            <>
                                                <FaEye />
                                                Show
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="hms-input-wrapper">
                                    <FaLock className="hms-input-icon" />

                                    <input
                                        id="hms-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            password
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setPassword(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="hms-input hms-password-input"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={
                                            loading
                                        }
                                    />
                                </div>
                            </div>

                            {/* ERROR */}

                            {error && (
                                <div
                                    className="hms-login-error"
                                    role="alert"
                                >
                                    <span className="hms-error-icon">
                                        !
                                    </span>

                                    <span>
                                        {error}
                                    </span>
                                </div>
                            )}

                            {/* OPTIONS */}

                            <div className="hms-login-options">
                                <label className="hms-remember">
                                    <input
                                        type="checkbox"
                                        checked={
                                            rememberMe
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setRememberMe(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    <span className="hms-custom-checkbox">
                                        <FaCheckCircle />
                                    </span>

                                    <span>
                                        Remember Me
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    className="hms-forgot-button"
                                    onClick={
                                        handleForgotPassword
                                    }
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* LOGIN */}

                            <button
                                type="submit"
                                className="hms-login-submit"
                                disabled={
                                    loading
                                }
                            >
                                {loading ? (
                                    <>
                                        <span className="hms-spinner" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <FaSignInAlt />

                                        LOGIN

                                        <FaArrowRight className="hms-submit-arrow" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* PATIENT DIVIDER */}

                        <div className="hms-patient-divider">
                            <span />
                            <strong>OR</strong>
                            <span />
                        </div>

                        {/* PATIENT PORTAL */}

                        <div className="hms-patient-portal">
                            <div className="hms-patient-icon">
                                <FaUserMd />
                            </div>

                            <div className="hms-patient-text">
                                <strong>
                                    Are you a patient?
                                </strong>

                                <span
                                    style={
                                        patientTaglineStyle
                                    }
                                >
                                    Access appointments,
                                    prescriptions, reports
                                    & bills.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handlePatientPortal
                                }
                                className="hms-patient-button"
                            >
                                Patient Portal
                                <FaArrowRight />
                            </button>
                        </div>

                        {/* SECURITY */}

                        <div className="hms-security-footer">
                            <FaShieldAlt />

                            <span>
                                Your information is protected
                                with secure authentication.
                            </span>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}

            <footer className="hms-login-footer">
                <span>
                    © 2026 {branding.hospitalName}
                </span>

                <span className="hms-footer-separator">
                    •
                </span>

                <span>
                    Secure • Reliable • Digital Healthcare
                </span>
            </footer>
        </div>
    );
}

export default Login;