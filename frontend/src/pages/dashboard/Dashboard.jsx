import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
    FaSignOutAlt,
    FaExclamationTriangle,
    FaUserInjured,
    FaUserMd,
    FaClipboardList,
    FaHospital,
    FaFlask,
    FaCapsules,
    FaFileInvoiceDollar,
    FaChartBar,
    FaCog,
    FaEllipsisV,
    FaUserShield,
    FaArrowLeft,
    FaBed,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaSyncAlt,
    FaPlus,
    FaTimes,
    FaSave,
} from "react-icons/fa";

import "./Dashboard.css";

/*
 * =========================================================
 * MODULE COUNT (real data)
 * Har module ke records ki ginti backend se aati hai.
 * Agar aapke backend ka route alag hai to yahan add / badal dein.
 * Pehla jo route chale wahi use hota hai.
 * =========================================================
 */

const MODULE_COUNT_ENDPOINTS = {
    patients: ["patients"],
    doctors: ["doctors"],
    appointments: ["appointments"],
    departments: ["departments"],
    laboratory: [
        "laboratory",
        "lab-tests",
        "laboratory/tests",
        "lab",
    ],
    medicines: [
        "medicines",
        "pharmacy",
        "pharmacy/medicines",
    ],
    billing: [
        "billing",
        "bills",
        "invoices",
        "billing/invoices",
    ],
    users: ["users"],
};

const countKeyOf = (module) =>
    module.key === "pharmacy"
        ? "medicines"
        : module.key;

const formatModuleCount = (value) =>
    typeof value === "number"
        ? value.toLocaleString("en-IN")
        : value;

function extractList(data) {
    const find = (obj) => {
        if (Array.isArray(obj)) {
            return obj;
        }

        if (!obj || typeof obj !== "object") {
            return undefined;
        }

        for (const key of [
            "data",
            "items",
            "results",
            "rows",
            "रिकॉर्ड",
        ]) {
            if (Array.isArray(obj[key])) {
                return obj[key];
            }
        }

        return Object.values(obj).find(Array.isArray);
    };

    return find(data) ?? find(data?.data) ?? null;
}

function extractTotal(data) {
    const candidates = [
        data?.total,
        data?.count,
        data?.totalCount,
        data?.total_count,
        data?.pagination?.total,
        data?.meta?.total,
        data?.data?.total,
        data?.data?.count,
        data?.data?.pagination?.total,
    ];

    for (const value of candidates) {
        const number = Number(value);

        if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            Number.isFinite(number)
        ) {
            return number;
        }
    }

    return null;
}

const rowHospitalId = (row) =>
    row?.hospital_id ??
    row?.hospitalId ??
    (row?.hospital && typeof row.hospital === "object"
        ? row.hospital.id
        : undefined);

function Dashboard() {
    const navigate = useNavigate();

    const [searchParams, setSearchParams] =
        useSearchParams();

    const auth = useAuth();

    const {
        user: authenticatedUser,
        role: authenticatedRole,
    } = auth;

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] =
        useState(false);

    const [brandLogoFailed, setBrandLogoFailed] =
        useState(false);

    /*
     * Login ke turant baad localStorage me sabse fresh user hota hai
     * (Home.jsx saveAuthentication). AuthContext purana (stale) ho
     * sakta hai, isliye role / hospital pehle yahin se lete hain.
     */
    const readStoredUser = () => {
        try {
            const saved =
                localStorage.getItem("hms_user");

            return saved
                ? JSON.parse(saved) || {}
                : {};
        } catch {
            return {};
        }
    };

    const [user, setUser] = useState(readStoredUser);

    const titleRef = useRef(null);

    /* real module counts */
    const [moduleCounts, setModuleCounts] = useState({});
    const [countsLoading, setCountsLoading] = useState(false);
    const [countsVersion, setCountsVersion] = useState(0);
    const countEndpointCacheRef = useRef({});

    const [hospitalName, setHospitalName] = useState(
        "एचएमएस अस्पताल नारायणपुर"
    );

    const [hospitals, setHospitals] = useState([]);

    const [selectedHospital, setSelectedHospital] =
        useState(null);

    const [selectedHospitalData, setSelectedHospitalData] =
        useState(null);

    const [loadingHospitals, setLoadingHospitals] =
        useState(false);

    const [loadingHospitalData, setLoadingHospitalData] =
        useState(false);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] = useState("");

    /*
     * =====================================================
     * ADD HOSPITAL STATE
     * =====================================================
     */

    const [showAddHospitalModal, setShowAddHospitalModal] =
        useState(false);

    const [savingHospital, setSavingHospital] =
        useState(false);

    const [addHospitalError, setAddHospitalError] =
        useState("");

    const [hospitalForm, setHospitalForm] = useState({
        name: "",
        address: "",
        city: "",
        location: "",
        phone: "",
        email: "",
        total_beds: "100",
        available_beds: "100",
        status: "active",
    });

    /*
     * =====================================================
     * REQUEST PROTECTION
     * =====================================================
     */

    const hospitalsLoadedRef = useRef(false);

    const hospitalRequestInProgressRef =
        useRef(false);

    const selectedHospitalRequestRef =
        useRef(null);

    /*
     * =====================================================
     * CURRENT ROLE
     * =====================================================
     */

    const normalizeRole = (value) => {
        const role = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

        if (
            role === "super" ||
            role === "superadmin"
        ) {
            return "super_admin";
        }

        if (
            role === "admin" ||
            role === "hospitaladmin"
        ) {
            return "hospital_admin";
        }

        return role;
    };

    const storedRole = normalizeRole(
        user?.role ??
            user?.role_name ??
            user?.roleName
    );

    /* pehle fresh stored user, phir AuthContext */
    const currentRole =
        storedRole ||
        normalizeRole(
            authenticatedRole ||
                authenticatedUser?.role
        );

    const isSuperAdmin =
        currentRole === "super_admin";

    /*
     * Logged-in user ka apna hospital id (super admin ke liye null)
     */

    const userHospitalId =
        user?.hospital_id ??
        user?.hospitalId ??
        (typeof user?.hospital === "object"
            ? user?.hospital?.id
            : user?.hospital) ??
        authenticatedUser?.hospital_id ??
        authenticatedUser?.hospitalId ??
        (typeof authenticatedUser?.hospital === "object"
            ? authenticatedUser?.hospital?.id
            : authenticatedUser?.hospital) ??
        null;

    const [userHospitalName, setUserHospitalName] =
        useState("");

    const [ownHospitalData, setOwnHospitalData] =
        useState(null);

    /*
     * =====================================================
     * AUTH HEADERS
     * =====================================================
     */

    const getAuthHeaders = useCallback(() => {
        const token =
            localStorage.getItem("hms_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("authToken");

        return token
            ? {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
            : {
                  "Content-Type": "application/json",
              };
    }, []);

    /*
     * =====================================================
     * SAFE JSON FETCH
     * =====================================================
     */

    const fetchJSON = useCallback(
        async (url, options = {}) => {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...(options.headers || {}),
                },
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        `Request failed with status ${response.status}`
                );
            }

            return data;
        },
        [getAuthHeaders]
    );

    /*
     * =====================================================
     * STAFF MODULES
     * =====================================================
     */

    const STAFF_MODULES = [
        {
            key: "patients",
            label: "मरीज़",
            description:
                "मरीज़ों के रिकॉर्ड और देखभाल का प्रबंधन करें",
            route: "/patients",
            icon: FaUserInjured,
            theme: "cyan",
            roles: [
                "hospital_admin",
                "receptionist",
                "doctor",
                "nurse",
            ],
        },
        {
            key: "doctors",
            label: "डॉक्टर",
            description:
                "अस्पताल के डॉक्टरों और विशेषज्ञताओं को देखें",
            route: "/doctors",
            icon: FaUserMd,
            theme: "blue",
            roles: ["hospital_admin"],
        },
        {
            key: "appointments",
            label: "अपॉइंटमेंट",
            description:
                "समय-सारणी और मुलाक़ातों का प्रबंधन करें",
            route: "/appointments",
            icon: FaClipboardList,
            theme: "red",
            roles: [
                "hospital_admin",
                "receptionist",
                "doctor",
                "nurse",
                "patient",
            ],
        },
        {
            key: "departments",
            label: "विभाग",
            description:
                "अस्पताल के विभागों और सेवाओं को देखें",
            route: "/departments",
            icon: FaHospital,
            theme: "green",
            roles: [
                "hospital_admin",
                "doctor",
                "nurse",
            ],
        },
        {
            key: "laboratory",
            label: "प्रयोगशाला",
            description:
                "जाँच और रिपोर्ट का प्रबंधन करें",
            route: "/laboratory",
            icon: FaFlask,
            theme: "cyan",
            roles: [
                "hospital_admin",
                "doctor",
                "lab_technician",
            ],
        },
        {
            key: "pharmacy",
            label: "फार्मेसी",
            description:
                "दवाइयों और पर्चों का प्रबंधन करें",
            route: "/pharmacy",
            icon: FaCapsules,
            theme: "pink",
            roles: [
                "hospital_admin",
                "pharmacist",
                "accountant",
            ],
        },
        {
            key: "billing",
            label: "बिलिंग",
            description:
                "बिल और अस्पताल के भुगतानों पर नज़र रखें",
            route: "/billing",
            icon: FaFileInvoiceDollar,
            theme: "yellow",
            roles: [
                "hospital_admin",
                "pharmacist",
                "accountant",
            ],
        },
        {
            key: "reports",
            label: "रिपोर्ट",
            description:
                "अस्पताल की कार्य-संबंधी रिपोर्ट देखें",
            route: "/reports",
            icon: FaChartBar,
            theme: "purple",
            roles: [
                "hospital_admin",
                "doctor",
                "lab_technician",
                "pharmacist",
                "accountant",
            ],
        },
        {
            key: "settings",
            label: "सेटिंग्स",
            description:
                "अस्पताल और खाते की सेटिंग्स बदलें",
            route: "/settings",
            icon: FaCog,
            theme: "orange",
            roles: ["hospital_admin"],
        },
    ];

    /*
     * =====================================================
     * SELECTED HOSPITAL MODULES
     * =====================================================
     */

    const HOSPITAL_MODULES = [
        {
            key: "patients",
            label: "मरीज़",
            description:
                "इस अस्पताल के मरीज़ों को देखें और उनका प्रबंधन करें",
            route: "/patients",
            icon: FaUserInjured,
            theme: "cyan",
        },
        {
            key: "doctors",
            label: "डॉक्टर",
            description:
                "डॉक्टरों और चिकित्सा विशेषज्ञताओं को देखें",
            route: "/doctors",
            icon: FaUserMd,
            theme: "blue",
        },
        {
            key: "appointments",
            label: "अपॉइंटमेंट",
            description:
                "अस्पताल के अपॉइंटमेंट और मुलाक़ातों पर नज़र रखें",
            route: "/appointments",
            icon: FaClipboardList,
            theme: "red",
        },
        {
            key: "departments",
            label: "विभाग",
            description:
                "अस्पताल के विभागों और सेवाओं का प्रबंधन करें",
            route: "/departments",
            icon: FaHospital,
            theme: "green",
        },
        {
            key: "pharmacy",
            label: "फार्मेसी",
            description:
                "दवाइयों और फार्मेसी के कामकाज पर नज़र रखें",
            route: "/pharmacy",
            icon: FaCapsules,
            theme: "pink",
        },
        {
            key: "laboratory",
            label: "प्रयोगशाला",
            description:
                "जाँच और प्रयोगशाला के आँकड़ों पर नज़र रखें",
            route: "/laboratory",
            icon: FaFlask,
            theme: "teal",
        },
        {
            key: "billing",
            label: "बिलिंग",
            description:
                "अस्पताल के बिल और भुगतानों पर नज़र रखें",
            route: "/billing",
            icon: FaFileInvoiceDollar,
            theme: "yellow",
        },
        {
            key: "reports",
            label: "रिपोर्ट",
            description:
                "अस्पताल की रिपोर्ट और विश्लेषण देखें",
            route: "/reports",
            icon: FaChartBar,
            theme: "purple",
        },
        {
            key: "users",
            label: "उपयोगकर्ता प्रबंधन",
            description:
                "उपयोगकर्ताओं और अस्पताल की पहुँच का प्रबंधन करें",
            route: "/users",
            icon: FaUserShield,
            theme: "orange",
        },
        {
            key: "settings",
            label: "सेटिंग्स",
            description:
                "इस अस्पताल की सेटिंग्स का प्रबंधन करें",
            route: "/settings",
            icon: FaCog,
            theme: "indigo",
        },
    ];

    /*
     * =====================================================
     * HOSPITAL CARD THEMES
     * =====================================================
     */

    const HOSPITAL_THEMES = [
        "hospital-green",
        "hospital-blue",
        "hospital-cyan",
        "hospital-purple",
        "hospital-orange",
        "hospital-pink",
        "hospital-red",
        "hospital-teal",
    ];

    /*
     * =====================================================
     * LOAD USER + SETTINGS
     * =====================================================
     */

    useEffect(() => {
        try {
            const savedUser =
                localStorage.getItem("hms_user");

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }

            const savedSettings =
                localStorage.getItem("hmsSettings");

            if (savedSettings) {
                const parsedSettings =
                    JSON.parse(savedSettings);

                if (
                    parsedSettings?.hospitalName &&
                    String(
                        parsedSettings.hospitalName
                    ).trim()
                ) {
                    setHospitalName(
                        String(
                            parsedSettings.hospitalName
                        ).trim()
                    );
                }
            }
        } catch (err) {
            console.error(
                "USER / SETTINGS ERROR:",
                err
            );
        }
    }, []);

    /*
     * =====================================================
     * AUTH CHANGE LISTENER
     * Login / logout hone par user turant refresh ho.
     * =====================================================
     */

    useEffect(() => {
        const syncUser = () => setUser(readStoredUser());

        window.addEventListener(
            "hmsAuthUpdated",
            syncUser
        );

        return () => {
            window.removeEventListener(
                "hmsAuthUpdated",
                syncUser
            );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * =====================================================
     * MODULE PAGE SE WAPAS AANE PAR SAME HOSPITAL DASHBOARD
     * Module page ka back button sirf "/dashboard" par bhejta hai
     * (hospital ki query ke bina). Super admin ke liye wahi hospital
     * dobara khol dete hain jisme se wo module me gaya tha.
     * =====================================================
     */

    useEffect(() => {
        let returnHospital = null;

        try {
            returnHospital = sessionStorage.getItem(
                "hms_return_hospital"
            );

            sessionStorage.removeItem(
                "hms_return_hospital"
            );
        } catch {
            returnHospital = null;
        }

        if (
            isSuperAdmin &&
            returnHospital &&
            !searchParams.get("hospital")
        ) {
            setSearchParams(
                { hospital: String(returnHospital) },
                { replace: true }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * =====================================================
     * LOAD LOGGED-IN USER'S OWN HOSPITAL
     * Non-super-admin sirf apne hospital ka data dekhta hai.
     * =====================================================
     */

    useEffect(() => {
        if (isSuperAdmin) {
            return;
        }

        if (!userHospitalId) {
            console.warn(
                "उपयोगकर्ता का अस्पताल आईडी नहीं मिला"
            );
            return;
        }

        const loadOwnHospital = async () => {
            try {
                const result = await fetchJSON(
                    `${API_URL}/hospitals/${userHospitalId}`
                );

                const data =
                    result?.data ||
                    result?.hospital ||
                    result ||
                    null;

                const name = String(
                    data?.name || ""
                ).trim();

                if (data) {
                    setOwnHospitalData(data);
                }

                if (name) {
                    setUserHospitalName(name);
                }
            } catch (err) {
                console.error(
                    "OWN HOSPITAL LOAD ERROR:",
                    err
                );
            }
        };

        loadOwnHospital();
    }, [
        API_URL,
        fetchJSON,
        isSuperAdmin,
        userHospitalId,
    ]);

    /*
     * =====================================================
     * LOAD HOSPITALS
     * =====================================================
     */

    const loadHospitals = useCallback(
        async ({ force = false } = {}) => {
            if (!isSuperAdmin) {
                return;
            }

            if (
                hospitalRequestInProgressRef.current
            ) {
                return;
            }

            if (
                hospitalsLoadedRef.current &&
                !force
            ) {
                return;
            }

            try {
                hospitalRequestInProgressRef.current =
                    true;

                setLoadingHospitals(true);
                setError("");

                console.log(
                    "🏥 Loading hospitals..."
                );

                const result = await fetchJSON(
                    `${API_URL}/hospitals`
                );

                const hospitalList =
                    Array.isArray(result)
                        ? result
                        : Array.isArray(
                              result?.data
                          )
                        ? result.data
                        : Array.isArray(
                              result?.hospitals
                          )
                        ? result.hospitals
                        : [];

                setHospitals(hospitalList);

                hospitalsLoadedRef.current =
                    true;

                const selectedId =
                    searchParams.get(
                        "hospital"
                    );

                if (selectedId) {
                    const matchingHospital =
                        hospitalList.find(
                            (hospital) =>
                                String(
                                    hospital.id
                                ) ===
                                String(
                                    selectedId
                                )
                        );

                    if (
                        matchingHospital
                    ) {
                        setSelectedHospital(
                            matchingHospital
                        );

                        setSelectedHospitalData(
                            matchingHospital
                        );
                    }
                }

                console.log(
                    `🏥 Hospitals loaded: ${hospitalList.length}`
                );
            } catch (err) {
                console.error(
                    "LOAD HOSPITALS ERROR:",
                    err
                );

                hospitalsLoadedRef.current =
                    false;

                setError(
                    err.message ||
                        "अस्पतालों की जानकारी लोड नहीं हो सकी।"
                );
            } finally {
                hospitalRequestInProgressRef.current =
                    false;

                setLoadingHospitals(false);
            }
        },
        [
            API_URL,
            fetchJSON,
            isSuperAdmin,
            searchParams,
        ]
    );

    /*
     * =====================================================
     * INITIAL HOSPITAL LOAD
     * =====================================================
     */

    useEffect(() => {
        if (!isSuperAdmin) {
            return;
        }

        if (
            hospitalsLoadedRef.current ||
            hospitalRequestInProgressRef.current
        ) {
            return;
        }

        loadHospitals();
    }, [
        isSuperAdmin,
        loadHospitals,
    ]);

    /*
     * =====================================================
     * LOAD SELECTED HOSPITAL
     * =====================================================
     */

    const loadSelectedHospital =
        useCallback(
            async (hospital) => {
                if (!hospital?.id) {
                    return;
                }

                const hospitalId =
                    String(hospital.id);

                if (
                    selectedHospitalRequestRef.current ===
                    hospitalId
                ) {
                    return;
                }

                try {
                    selectedHospitalRequestRef.current =
                        hospitalId;

                    setLoadingHospitalData(
                        true
                    );

                    setError("");

                    console.log(
                        `🏥 Loading hospital details: ${hospitalId}`
                    );

                    const result =
                        await fetchJSON(
                            `${API_URL}/hospitals/${hospitalId}`
                        );

                    const data =
                        result?.data ||
                        result?.hospital ||
                        result;

                    if (data) {
                        setSelectedHospitalData(
                            data
                        );
                    } else {
                        setSelectedHospitalData(
                            hospital
                        );
                    }
                } catch (err) {
                    console.error(
                        "LOAD SELECTED HOSPITAL ERROR:",
                        err
                    );

                    setSelectedHospitalData(
                        hospital
                    );

                    setError(
                        "अस्पताल का पूरा विवरण लोड नहीं हो सका। उपलब्ध जानकारी दिखाई जा रही है।"
                    );
                } finally {
                    selectedHospitalRequestRef.current =
                        null;

                    setLoadingHospitalData(
                        false
                    );
                }
            },
            [
                API_URL,
                fetchJSON,
            ]
        );

    /*
     * =====================================================
     * SYNC SELECTED HOSPITAL WITH URL
     * =====================================================
     */

    useEffect(() => {
        if (!isSuperAdmin) {
            return;
        }

        if (!hospitals.length) {
            return;
        }

        const hospitalId =
            searchParams.get(
                "hospital"
            );

        if (!hospitalId) {
            setSelectedHospital(null);
            setSelectedHospitalData(null);
            return;
        }

        const hospital =
            hospitals.find(
                (item) =>
                    String(item.id) ===
                    String(hospitalId)
            );

        if (!hospital) {
            setSelectedHospital(null);
            setSelectedHospitalData(null);
            return;
        }

        setSelectedHospital(
            (previous) => {
                if (
                    previous?.id ===
                    hospital.id
                ) {
                    return previous;
                }

                return hospital;
            }
        );

        setSelectedHospitalData(
            (previous) => {
                if (
                    previous?.id ===
                    hospital.id
                ) {
                    return previous;
                }

                return hospital;
            }
        );

        loadSelectedHospital(hospital);
    }, [
        isSuperAdmin,
        hospitals,
        searchParams,
        loadSelectedHospital,
    ]);

    /*
     * =====================================================
     * SELECT HOSPITAL
     * =====================================================
     */

    const handleHospitalSelect = (
        hospital
    ) => {
        if (!hospital?.id) {
            return;
        }

        setError("");

        setSearchParams({
            hospital: String(
                hospital.id
            ),
        });

        setSelectedHospital(
            hospital
        );

        setSelectedHospitalData(
            hospital
        );
    };

    /*
     * =====================================================
     * BACK TO ALL HOSPITALS
     * =====================================================
     */

    const handleBackToHospitals = () => {
        setSearchParams({});

        setSelectedHospital(null);

        setSelectedHospitalData(
            null
        );

        setError("");
    };

    /*
     * =====================================================
     * SETTINGS STORAGE LISTENER
     * =====================================================
     */

    useEffect(() => {
        const handleStorageChange = (
            event
        ) => {
            if (
                event.key !==
                "hmsSettings"
            ) {
                return;
            }

            try {
                if (!event.newValue) {
                    setHospitalName(
                        "एचएमएस अस्पताल नारायणपुर"
                    );

                    return;
                }

                const parsedSettings =
                    JSON.parse(
                        event.newValue
                    );

                if (
                    parsedSettings?.hospitalName &&
                    String(
                        parsedSettings.hospitalName
                    ).trim()
                ) {
                    setHospitalName(
                        String(
                            parsedSettings.hospitalName
                        ).trim()
                    );
                } else {
                    setHospitalName(
                        "एचएमएस अस्पताल नारायणपुर"
                    );
                }
            } catch (err) {
                console.error(
                    "SETTINGS STORAGE ERROR:",
                    err
                );
            }
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorageChange
            );
        };
    }, []);

    /*
     * =====================================================
     * REFRESH
     * =====================================================
     */

    const handleRefresh = async () => {
        if (refreshing) {
            return;
        }

        try {
            setRefreshing(true);
            setError("");
            setCountsVersion((version) => version + 1);

            if (isSuperAdmin) {
                await loadHospitals({
                    force: true,
                });
            } else {
                const savedSettings =
                    localStorage.getItem(
                        "hmsSettings"
                    );

                if (savedSettings) {
                    const parsedSettings =
                        JSON.parse(
                            savedSettings
                        );

                    if (
                        parsedSettings?.hospitalName &&
                        String(
                            parsedSettings.hospitalName
                        ).trim()
                    ) {
                        setHospitalName(
                            String(
                                parsedSettings.hospitalName
                            ).trim()
                        );
                    }
                }
            }
        } catch (err) {
            console.error(
                "REFRESH ERROR:",
                err
            );

            setError(
                "डैशबोर्ड रीफ़्रेश नहीं हो सका।"
            );
        } finally {
            setRefreshing(false);
        }
    };

    /*
     * =====================================================
     * ADD HOSPITAL
     * =====================================================
     */

    const openAddHospitalModal = () => {
        if (!isSuperAdmin) {
            return;
        }

        setAddHospitalError("");

        setHospitalForm({
            name: "",
            address: "",
            city: "",
            location: "",
            phone: "",
            email: "",
            total_beds: "100",
            available_beds: "100",
            status: "active",
        });

        setShowAddHospitalModal(true);
    };

    const closeAddHospitalModal = () => {
        if (savingHospital) {
            return;
        }

        setShowAddHospitalModal(false);
        setAddHospitalError("");
    };

    const handleHospitalFormChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setHospitalForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    const handleCreateHospital =
        async (event) => {
            event.preventDefault();

            if (savingHospital) {
                return;
            }

            const name =
                String(
                    hospitalForm.name
                ).trim();

            if (!name) {
                setAddHospitalError(
                    "अस्पताल का नाम आवश्यक है।"
                );
                return;
            }

            const totalBeds = Math.max(
                0,
                Number(
                    hospitalForm.total_beds
                ) || 0
            );

            const availableBeds = Math.max(
                0,
                Number(
                    hospitalForm.available_beds
                ) || 0
            );

            if (
                availableBeds >
                totalBeds
            ) {
                setAddHospitalError(
                    "उपलब्ध बेड की संख्या कुल बेड से अधिक नहीं हो सकती।"
                );
                return;
            }

            try {
                setSavingHospital(true);
                setAddHospitalError("");
                setError("");

                const payload = {
                    name,
                    address:
                        String(
                            hospitalForm.address
                        ).trim() || null,
                    city:
                        String(
                            hospitalForm.city
                        ).trim() || null,
                    location:
                        String(
                            hospitalForm.location
                        ).trim() || null,
                    phone:
                        String(
                            hospitalForm.phone
                        ).trim() || null,
                    email:
                        String(
                            hospitalForm.email
                        ).trim() || null,
                    total_beds:
                        totalBeds,
                    available_beds:
                        availableBeds,
                    status:
                        hospitalForm.status ||
                        "active",
                };

                const result =
                    await fetchJSON(
                        `${API_URL}/hospitals`,
                        {
                            method: "POST",
                            body: JSON.stringify(
                                payload
                            ),
                        }
                    );

                console.log(
                    "🏥 Hospital created:",
                    result
                );

                setShowAddHospitalModal(
                    false
                );

                setHospitalForm({
                    name: "",
                    address: "",
                    city: "",
                    location: "",
                    phone: "",
                    email: "",
                    total_beds: "100",
                    available_beds: "100",
                    status: "active",
                });

                /*
                 * Force a fresh hospital list after
                 * successful creation.
                 */
                hospitalsLoadedRef.current =
                    false;

                await loadHospitals({
                    force: true,
                });
            } catch (err) {
                console.error(
                    "CREATE HOSPITAL ERROR:",
                    err
                );

                setAddHospitalError(
                    err.message ||
                        "अस्पताल नहीं बनाया जा सका।"
                );
            } finally {
                setSavingHospital(false);
            }
        };

    /*
     * =====================================================
     * LOGOUT
     * =====================================================
     */

    const handleLogout = () => {
        localStorage.removeItem(
            "hms_token"
        );

        localStorage.removeItem(
            "hms_user"
        );

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "authToken"
        );

        localStorage.removeItem(
            "user"
        );

        try {
            sessionStorage.removeItem("hms_return_hospital");
            sessionStorage.removeItem("hms_selected_hospital");
        } catch {
            /* ignore */
        }

        /* AuthContext ka purana role/user bhi saaf karein */
        try {
            if (typeof auth?.logout === "function") {
                auth.logout();
            }
        } catch (err) {
            console.error("AUTH LOGOUT ERROR:", err);
        }

        window.dispatchEvent(
            new Event("hmsAuthUpdated")
        );

        navigate("/", {
            replace: true,
        });
    };

    /*
     * =====================================================
     * DISPLAY HOSPITAL NAME
     * =====================================================
     */

    const displayHospitalName =
        isSuperAdmin
            ? selectedHospital
                ? selectedHospital.name ||
                  "चयनित अस्पताल"
                : "सभी अस्पताल"
            : String(
                  userHospitalName || ""
              ).trim() || "अस्पताल"

    /*
     * =====================================================
     * HOSPITAL TITLE
     * =====================================================
     */

    const renderHospitalTitle =
        () => {
            const words =
                String(
                    displayHospitalName
                )
                    .split(/\s+/)
                    .filter(Boolean);

            return words.map(
                (
                    word,
                    index
                ) => (
                    <span
                        className={`brand-word brand-word-${
                            index % 4
                        }`}
                        key={`${word}-${index}`}
                    >
                        {word}

                        {index <
                        words.length -
                            1
                            ? " "
                            : ""}
                    </span>
                )
            );
        };

    /*
     * =====================================================
     * USER
     * =====================================================
     */

    const displayUserName =
        user?.name ||
        user?.username ||
        authenticatedUser?.name ||
        authenticatedUser?.username ||
        "एचएमएस एडमिन";

    const displayUserRoleLabel =
        currentRole ||
        authenticatedRole ||
        authenticatedUser?.role ||
        "प्रशासक";

    const displayUserRole =
        String(
            displayUserRoleLabel
        )
            .trim()
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            );

    const displayUserProfileImage =
        user?.profile_image ||
        user?.profileImage ||
        authenticatedUser?.profile_image ||
        authenticatedUser?.profileImage ||
        null;

    const displayUserAvatarSrc =
        displayUserProfileImage
            ? String(
                  displayUserProfileImage
              ).startsWith(
                  "http"
              ) ||
              String(
                  displayUserProfileImage
              ).startsWith("/")
                ? displayUserProfileImage
                : `${API_URL.replace(
                      /\/api$/,
                      ""
                  )}${displayUserProfileImage}`
            : null;

    /*
     * =====================================================
     * HEADING AUTO FIT
     * Lamba hospital naam ek line me fit hone tak font chhota
     * hota hai. Bahut lamba ho to words niche wrap ho jate hain.
     * =====================================================
     */

    useLayoutEffect(() => {
        const heading = titleRef.current;

        if (!heading) {
            return undefined;
        }

        const MIN_SINGLE_LINE = 26;
        const MAX_WRAPPED = 34;

        const fit = () => {
            heading.style.fontSize = "";
            heading.style.whiteSpace = "";

            const style =
                window.getComputedStyle(heading);

            /* mobile CSS me h1 pehle se wrap hota hai */
            if (style.whiteSpace !== "nowrap") {
                return;
            }

            const available = heading.clientWidth;
            const needed = heading.scrollWidth;

            if (!available || needed <= available) {
                return;
            }

            const baseSize = parseFloat(style.fontSize);

            const nextSize =
                Math.floor(
                    baseSize * (available / needed) * 100
                ) / 100 - 0.5;

            /* ek line me achhe size par fit ho jaye */
            if (nextSize >= MIN_SINGLE_LINE) {
                heading.style.fontSize = `${nextSize}px`;
                return;
            }

            /* warna 2 line, par font bada aur readable rakhein */
            heading.style.whiteSpace = "normal";
            heading.style.fontSize = `${Math.min(
                baseSize,
                MAX_WRAPPED
            )}px`;
        };

        fit();

        let frame = 0;

        const schedule = () => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(fit);
        };

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(schedule)
                : null;

        if (observer && heading.parentElement) {
            observer.observe(heading.parentElement);
        }

        window.addEventListener("resize", schedule);

        if (document.fonts?.ready) {
            document.fonts.ready.then(schedule);
        }

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", schedule);
            observer?.disconnect();
        };
    }, [displayHospitalName]);

    /*
     * =====================================================
     * STAFF MODULE CARDS
     * =====================================================
     */

    const staffModuleCards =
        useMemo(() => {
            if (isSuperAdmin) {
                return [];
            }

            return STAFF_MODULES.filter(
                (module) =>
                    module.roles.includes(
                        currentRole
                    )
            );
        }, [
            isSuperAdmin,
            currentRole,
        ]);

    /*
     * =====================================================
     * SELECTED HOSPITAL STATS
     * =====================================================
     */

    const hospitalStats =
        useMemo(() => {
            const source = isSuperAdmin
                ? selectedHospitalData ||
                  selectedHospital ||
                  {}
                : ownHospitalData || {};

            const stats =
                source.stats ||
                source.statistics ||
                source.counts ||
                {};

            return {
                patients:
                    stats.patients ??
                    stats.totalPatients ??
                    stats.total_patients ??
                    source.patients ??
                    source.patients_count ??
                    source.totalPatients ??
                    source.total_patients ??
                    0,

                doctors:
                    stats.doctors ??
                    stats.totalDoctors ??
                    stats.total_doctors ??
                    source.doctors ??
                    source.doctors_count ??
                    source.totalDoctors ??
                    source.total_doctors ??
                    0,

                appointments:
                    stats.appointments ??
                    stats.totalAppointments ??
                    stats.total_appointments ??
                    source.appointments ??
                    source.appointments_count ??
                    source.totalAppointments ??
                    source.total_appointments ??
                    0,

                departments:
                    stats.departments ??
                    stats.totalDepartments ??
                    stats.total_departments ??
                    source.departments ??
                    source.departments_count ??
                    source.totalDepartments ??
                    source.total_departments ??
                    0,

                medicines:
                    stats.medicines ??
                    stats.totalMedicines ??
                    stats.total_medicines ??
                    source.medicines ??
                    source.medicines_count ??
                    source.totalMedicines ??
                    source.total_medicines ??
                    0,

                laboratory:
                    stats.laboratory ??
                    stats.laboratory_tests ??
                    stats.laboratoryTests ??
                    stats.totalLaboratoryTests ??
                    stats.total_laboratory_tests ??
                    source.laboratory ??
                    source.laboratory_tests ??
                    source.laboratoryTests ??
                    source.laboratory_count ??
                    source.totalLaboratoryTests ??
                    0,

                billing:
                    stats.billing ??
                    stats.bills ??
                    stats.totalBills ??
                    stats.total_bills ??
                    source.billing ??
                    source.bills ??
                    source.billing_count ??
                    source.totalBills ??
                    source.total_bills ??
                    0,

                users:
                    stats.users ??
                    stats.totalUsers ??
                    stats.total_users ??
                    source.users ??
                    source.users_count ??
                    source.totalUsers ??
                    source.total_users ??
                    0,
            };
        }, [
            isSuperAdmin,
            selectedHospital,
            selectedHospitalData,
            ownHospitalData,
        ]);

    /*
     * =====================================================
     * MODULE COUNT
     * =====================================================
     */

    const getModuleCount = (
        module
    ) => {
        if (
            module.key ===
                "reports" ||
            module.key ===
                "settings"
        ) {
            return null;
        }

        const key = countKeyOf(module);
        const real = moduleCounts[key];

        if (typeof real === "number") {
            return real;
        }

        if (countsLoading && real === undefined) {
            return "…";
        }

        /* backend se ginti nahi mili -> hospital object ka data, warna "—" */
        const fallback =
            Number(hospitalStats[key]) || 0;

        return fallback > 0
            ? fallback
            : "—";
    };

    /*
     * =====================================================
     * LOAD REAL MODULE COUNTS
     * Selected hospital (super admin) ya apne hospital
     * (hospital admin / staff) ke har module ki ginti.
     * =====================================================
     */

    useEffect(() => {
        const hospitalId = isSuperAdmin
            ? selectedHospital?.id
            : userHospitalId;

        if (isSuperAdmin && !hospitalId) {
            return undefined;
        }

        const modules = isSuperAdmin
            ? HOSPITAL_MODULES
            : staffModuleCards;

        const keys = [
            ...new Set(
                modules
                    .map(countKeyOf)
                    .filter(
                        (key) =>
                            MODULE_COUNT_ENDPOINTS[key]
                    )
            ),
        ];

        if (!keys.length) {
            return undefined;
        }

        let cancelled = false;

        const query = hospitalId
            ? `?hospital_id=${encodeURIComponent(
                  hospitalId
              )}`
            : "";

        const countFor = async (key) => {
            const cached =
                countEndpointCacheRef.current[key];

            const endpoints = cached
                ? [
                      cached,
                      ...MODULE_COUNT_ENDPOINTS[key].filter(
                          (item) => item !== cached
                      ),
                  ]
                : MODULE_COUNT_ENDPOINTS[key];

            for (const endpoint of endpoints) {
                let data;

                try {
                    data = await fetchJSON(
                        `${API_URL}/${endpoint}${query}`
                    );
                } catch {
                    continue;
                }

                const list = extractList(data);
                const total = extractTotal(data);

                if (list === null && total === null) {
                    continue;
                }

                countEndpointCacheRef.current[key] =
                    endpoint;

                if (list === null) {
                    return total;
                }

                /* backend filter na kare to hospital ke hisaab se chhaanten */
                const items =
                    hospitalId &&
                    list.some(
                        (row) =>
                            rowHospitalId(row) !==
                            undefined
                    )
                        ? list.filter(
                              (row) =>
                                  String(
                                      rowHospitalId(row)
                                  ) === String(hospitalId)
                          )
                        : list;

                /* paginated response: poori ginti total me hoti hai */
                if (
                    total !== null &&
                    items.length === list.length
                ) {
                    return total;
                }

                return items.length;
            }

            return null;
        };

        const load = async () => {
            setCountsLoading(true);
            setModuleCounts({});

            const results = await Promise.all(
                keys.map(async (key) => [
                    key,
                    await countFor(key),
                ])
            );

            if (cancelled) {
                return;
            }

            setModuleCounts(
                Object.fromEntries(results)
            );

            setCountsLoading(false);
        };

        load();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        API_URL,
        fetchJSON,
        isSuperAdmin,
        currentRole,
        selectedHospital?.id,
        userHospitalId,
        countsVersion,
    ]);

    /*
     * Module kholna: super admin ka hospital yaad rakhte hain
     * taaki back par wahi hospital dashboard khule.
     */

    const openModule = (module) => {
        const hospitalId =
            isSuperAdmin && selectedHospital?.id
                ? String(selectedHospital.id)
                : "";

        try {
            if (hospitalId) {
                sessionStorage.setItem(
                    "hms_return_hospital",
                    hospitalId
                );

                sessionStorage.setItem(
                    "hms_selected_hospital",
                    hospitalId
                );
            } else {
                sessionStorage.removeItem(
                    "hms_return_hospital"
                );
            }
        } catch {
            /* ignore */
        }

        navigate(module.route, {
            state: {
                from: `${window.location.pathname}${window.location.search}`,
                hospitalId: hospitalId || null,
            },
        });
    };

    /*
     * =====================================================
     * SELECTED HOSPITAL DETAILS
     * =====================================================
     */

    const selectedAddress =
        selectedHospitalData?.address ||
        selectedHospital?.address ||
        "";

    const selectedCity =
        selectedHospitalData?.city ||
        selectedHospital?.city ||
        "";

    const selectedLocation =
        selectedHospitalData?.location ||
        selectedHospital?.location ||
        "";

    const selectedPhone =
        selectedHospitalData?.phone ||
        selectedHospital?.phone ||
        "";

    const selectedEmail =
        selectedHospitalData?.email ||
        selectedHospital?.email ||
        "";

    const totalBeds =
        selectedHospitalData?.total_beds ??
        selectedHospital?.total_beds ??
        0;

    const availableBeds =
        selectedHospitalData?.available_beds ??
        selectedHospital?.available_beds ??
        0;

    const hospitalStatus =
        selectedHospitalData?.status ||
        selectedHospital?.status ||
        "active";

    /*
     * =====================================================
     * TEXT
     * =====================================================
     */

    const dashboardScopeText =
        isSuperAdmin
            ? selectedHospital
                ? "अस्पताल प्रबंधन डैशबोर्ड"
                : "ग्लोबल सुपर एडमिन डैशबोर्ड"
            : "अस्पताल प्रबंधन प्रणाली";

    /*
     * Header ke subtitle me hospital ka address.
     * Staff / hospital admin: apne hospital ka.
     * Super admin: selected hospital ka (All Hospitals me default text).
     */

    const headerHospital = isSuperAdmin
        ? selectedHospitalData || selectedHospital
        : ownHospitalData;

    const headerAddressText = (() => {
        if (!headerHospital) {
            return "";
        }

        /*
         * address + city + location ko comma se todkar
         * duplicate / dusre tukde me pehle se maujood
         * hisse hata dete hain.
         */

        const tokens = [
            headerHospital.address || headerHospital.location || headerHospital.city,
        ]
            .flatMap((value) =>
                String(value || "").split(",")
            )
            .map((value) =>
                value.replace(/\s+/g, " ").trim()
            )
            .filter(Boolean);

        const kept = [];

        tokens.forEach((token) => {
            const lower = token.toLowerCase();

            /* pehle se kisi tukde me hai -> skip */
            if (
                kept.some((item) =>
                    item.toLowerCase().includes(lower)
                )
            ) {
                return;
            }

            /* ye tukda pehle ke chhote tukdon ko cover karta hai -> unhe hatao */
            for (let i = kept.length - 1; i >= 0; i -= 1) {
                if (lower.includes(kept[i].toLowerCase())) {
                    kept.splice(i, 1);
                }
            }

            kept.push(token);
        });

        return kept.join(", ");
    })();

    const headerSubtitle = headerAddressText || "Address not available";

    /* Hospital Settings me save kiya hua logo (logo_url) */
    const headerLogo =
        headerHospital?.logo_url || headerHospital?.logo || "";

    const headerLogoSrc = headerLogo
        ? /^(https?:|data:|blob:)/i.test(headerLogo)
            ? headerLogo
            : `${API_URL.replace(/\/api\/?$/, "")}${
                  headerLogo.startsWith("/") ? "" : "/"
              }${headerLogo}`
        : "";

    useEffect(() => {
        setBrandLogoFailed(false);
    }, [headerLogoSrc]);

    /*
     * Background watermark: hospital ka logo, na ho to HMS logo.
     * CSS me var(--watermark-url) se padha jata hai.
     */
    const watermarkUrl = `url("${headerLogo || "/hms-logo.png"}")`;

    const marqueeWelcomeText =
        isSuperAdmin
            ? selectedHospital
                ? `Managing ${displayHospitalName}`
                : "ग्लोबल सुपर एडमिन डैशबोर्ड में आपका स्वागत है"
            : "आपके स्टाफ डैशबोर्ड में आपका स्वागत है";

    /*
     * =====================================================
     * ADD HOSPITAL MODAL INLINE STYLES
     * =====================================================
     */

    const addHospitalOverlayStyle = {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
            "rgba(0, 0, 0, 0.78)",
        backdropFilter:
            "blur(7px)",
        WebkitBackdropFilter:
            "blur(7px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    };

    const addHospitalModalStyle = {
        width: "100%",
        maxWidth: "760px",
        maxHeight: "92vh",
        overflowY: "auto",
        background:
            "linear-gradient(145deg, #10251f, #071512)",
        border:
            "1px solid rgba(0, 255, 170, 0.28)",
        borderRadius: "20px",
        boxShadow:
            "0 25px 80px rgba(0,0,0,0.65)",
        padding: "26px",
        color: "#ffffff",
    };

    const formGridStyle = {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "16px",
    };

    const fullWidthStyle = {
        gridColumn: "1 / -1",
    };

    const formGroupStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    };

    const formLabelStyle = {
        fontSize: "13px",
        fontWeight: 700,
        color: "#b7d8cd",
    };

    const formInputStyle = {
        width: "100%",
        boxSizing: "border-box",
        border:
            "1px solid rgba(255,255,255,0.12)",
        background:
            "rgba(255,255,255,0.055)",
        color: "#ffffff",
        borderRadius: "10px",
        padding:
            "12px 13px",
        outline: "none",
        fontSize: "14px",
    };

    const modalButtonStyle = {
        border: "none",
        borderRadius: "10px",
        padding:
            "11px 17px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 700,
        fontSize: "14px",
    };

    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (
        <main
            className="dashboard-page"
            style={{ "--watermark-url": "none" }}
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="dashboard-topbar">

                <div className="topbar-left">

                    <div className="brand-section">

                        {headerLogoSrc && !brandLogoFailed ? (
                            <img
                                className="dashboard-brand-logo"
                                src={headerLogoSrc}
                                alt={displayHospitalName}
                                onError={() => setBrandLogoFailed(true)}
                            />
                        ) : (
                            <div
                                className="dashboard-brand-logo dashboard-brand-logo-fallback"
                                role="img"
                                aria-label="Hospital"
                            >
                                <FaHospital />
                            </div>
                        )}

                        <div className="dashboard-brand-copy">

                            <h1 ref={titleRef}>
                                {renderHospitalTitle()}
                            </h1>

                            <p className="subtitle">
                                {headerAddressText && (
                                    <FaMapMarkerAlt className="subtitle-pin" />
                                )}

                                {headerSubtitle}
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    className="mobile-header-menu-button"
                    onClick={() =>
                        setMobileHeaderMenuOpen(
                            (previous) =>
                                !previous
                        )
                    }
                    aria-label="हेडर मेन्यू खोलें"
                    aria-expanded={
                        mobileHeaderMenuOpen
                    }
                >
                    <FaEllipsisV />
                </button>

                <div
                    className={`topbar-right ${
                        mobileHeaderMenuOpen
                            ? "mobile-header-menu-open"
                            : ""
                    }`}
                >

                    <div className="dashboard-user">

                        <div className="user-row">

                            <div className="user-avatar">

                                {displayUserAvatarSrc ? (
                                    <img
                                        src={
                                            displayUserAvatarSrc
                                        }
                                        alt={
                                            displayUserName
                                        }
                                        onError={(
                                            event
                                        ) => {
                                            event.currentTarget.style.display =
                                                "none";

                                            if (
                                                event
                                                    .currentTarget
                                                    .nextSibling
                                            ) {
                                                event
                                                    .currentTarget
                                                    .nextSibling
                                                    .style.display =
                                                    "flex";
                                            }
                                        }}
                                    />
                                ) : null}

                                <span
                                    style={{
                                        display:
                                            displayUserAvatarSrc
                                                ? "none"
                                                : "flex",
                                    }}
                                >
                                    {String(displayUserRole).toLowerCase().includes("super") ? <FaUserShield /> : <FaHospital />}
                                </span>

                            </div>

                            <div className="user-info">

                                <span>
                                    {
                                        displayUserRole
                                    }
                                </span>

                            </div>

                        </div>

                        <button
                            type="button"
                            className="btn-3d btn-logout"
                            onClick={
                                handleLogout
                            }
                        >
                            <FaSignOutAlt />

                            <span>
                                लॉग आउट
                            </span>
                        </button>

                    </div>

                </div>

            </header>

            {/* =================================================
                MARQUEE
            ================================================= */}

            <div
                className="dashboard-marquee"
                aria-label="अस्पताल की सूचना"
            >
                {/* 2 barabar half, har half me text 3 baar repeat -> beech me khali jagah nahi */}
                <div className="marquee-track">
                    {[0, 1].map((half) => (
                        <div
                            className="marquee-half"
                            key={half}
                            aria-hidden={half === 1}
                        >
                            {[0, 1, 2].map((copy) => (
                                <span
                                    className="marquee-item"
                                    key={copy}
                                >
                                    <strong className="marquee-emergency">
                                        आपातकालीन
                                    </strong>

                                    <span className="marquee-separator">
                                        {" • "}
                                    </span>

                                    {isSuperAdmin
                                        ? selectedHospital
                                            ? displayHospitalName
                                            : "सभी अस्पताल"
                                        : displayHospitalName}

                                    <span className="marquee-separator">
                                        {" • "}
                                    </span>

                                    {isSuperAdmin
                                        ? selectedHospital
                                            ? "अस्पताल प्रबंधन प्रणाली"
                                            : "ग्लोबल अस्पताल प्रबंधन प्रणाली"
                                        : "अस्पताल प्रबंधन प्रणाली"}

                                    <span className="marquee-separator">
                                        {" • "}
                                    </span>

                                    {marqueeWelcomeText}

                                    <span className="marquee-separator marquee-gap">
                                        {" • "}
                                    </span>
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="dashboard-error">

                    <FaExclamationTriangle />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        className="btn-3d btn-small"
                        onClick={
                            handleRefresh
                        }
                    >
                        दोबारा प्रयास करें
                    </button>

                </div>
            )}

            {/* =================================================
                SUPER ADMIN — ALL HOSPITALS
            ================================================= */}

            {isSuperAdmin &&
                !selectedHospital && (
                    <section className="all-hospitals-section">

                        <div className="all-hospitals-heading">

                            <div>

                                <span className="section-kicker">
                                    सुपर एडमिन
                                </span>

                                <h2>
                                    सभी अस्पताल
                                </h2>

                                <p>
                                    पूरा प्रबंधन डैशबोर्ड खोलने के लिए अस्पताल चुनें।
                                </p>

                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    flexWrap: "wrap",
                                }}
                            >

                                {/* ADD HOSPITAL */}

                                <button
                                    type="button"
                                    className="btn-3d dashboard-refresh-button"
                                    onClick={
                                        openAddHospitalModal
                                    }
                                >
                                    <FaPlus />

                                    <span>
                                        अस्पताल जोड़ें
                                    </span>
                                </button>

                                {/* REFRESH */}

                                <button
                                    type="button"
                                    className="btn-3d dashboard-refresh-button"
                                    onClick={
                                        handleRefresh
                                    }
                                    disabled={
                                        refreshing ||
                                        loadingHospitals
                                    }
                                >
                                    <FaSyncAlt
                                        className={
                                            refreshing
                                                ? "spin"
                                                : ""
                                        }
                                    />

                                    {refreshing ||
                                    loadingHospitals
                                        ? "रीफ़्रेश हो रहा है..."
                                        : "रीफ़्रेश करें"}
                                </button>

                            </div>

                        </div>

                        {loadingHospitals ? (
                            <div className="dashboard-loading">

                                <div className="loading-spinner" />

                                <strong>
                                    अस्पतालों की जानकारी लोड हो रही है...
                                </strong>

                                <span>
                                    कृपया प्रतीक्षा करें, अस्पताल की जानकारी लोड की जा रही है।
                                </span>

                            </div>
                        ) : hospitals.length ===
                          0 ? (
                            <div className="dashboard-empty">

                                <FaHospital />

                                <h3>
                                    कोई अस्पताल नहीं मिला
                                </h3>

                                <p>
                                    फिलहाल कोई पंजीकृत अस्पताल
                                    उपलब्ध नहीं है।
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "center",
                                        gap: "10px",
                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    <button
                                        type="button"
                                        className="btn-3d btn-small"
                                        onClick={
                                            openAddHospitalModal
                                        }
                                    >
                                        <FaPlus />

                                        अस्पताल जोड़ें
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-3d btn-small"
                                        onClick={
                                            handleRefresh
                                        }
                                    >
                                        रीफ़्रेश करें
                                    </button>

                                </div>

                            </div>
                        ) : (
                            <div className="hospital-card-grid">

                                {hospitals.map(
                                    (
                                        hospital,
                                        index
                                    ) => {

                                        const theme =
                                            HOSPITAL_THEMES[
                                                index %
                                                    HOSPITAL_THEMES.length
                                            ];

                                        const beds =
                                            hospital.total_beds ??
                                            0;

                                        const available =
                                            hospital.available_beds ??
                                            0;

                                        const status =
                                            hospital.status ||
                                            "active";

                                        return (
                                            <button
                                                type="button"
                                                className={`hospital-selection-card ${theme}`}
                                                key={
                                                    hospital.id
                                                }
                                                onClick={() =>
                                                    handleHospitalSelect(
                                                        hospital
                                                    )
                                                }
                                            >

                                                <div className="hospital-card-top">

                                                    <div className="hospital-card-icon">
                                                        <FaHospital />
                                                    </div>

                                                    <span
                                                        className={`hospital-status ${
                                                            String(
                                                                status
                                                            ).toLowerCase() ===
                                                            "active"
                                                                ? "active"
                                                                : "inactive"
                                                        }`}
                                                    >
                                                        {String(
                                                            status
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase() +
                                                            String(
                                                                status
                                                            )
                                                                .slice(
                                                                    1
                                                                )}
                                                    </span>

                                                </div>

                                                <div className="hospital-card-body">

                                                    <h3>
                                                        {
                                                            hospital.name
                                                        }
                                                    </h3>

                                                    <p className="hospital-location">

                                                        <FaMapMarkerAlt />

                                                        <span>
                                                            {hospital.location ||
                                                                hospital.city ||
                                                                hospital.address ||
                                                                "स्थान उपलब्ध नहीं है"}
                                                        </span>

                                                    </p>

                                                    <div className="hospital-card-meta">

                                                        <span>
                                                            <FaBed />

                                                            <strong>
                                                                {
                                                                    beds
                                                                }
                                                            </strong>

                                                            बेड
                                                        </span>

                                                        <span>
                                                            <strong>
                                                                {available}
                                                            </strong>

                                                            उपलब्ध
                                                        </span>

                                                    </div>

                                                </div>

                                                <div className="hospital-card-footer">

                                                    <span>
                                                        Open Hospital Dashboard
                                                    </span>

                                                    <span className="hospital-card-arrow">
                                                        →
                                                    </span>

                                                </div>

                                            </button>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>
                )}

            {/* =================================================
                SUPER ADMIN — SELECTED HOSPITAL
            ================================================= */}

            {isSuperAdmin &&
                selectedHospital && (
                    <section className="selected-hospital-section">

                        <div className="selected-hospital-toolbar">

                            <button
                                type="button"
                                className="btn-3d btn-back-hospitals"
                                onClick={
                                    handleBackToHospitals
                                }
                            >
                                <FaArrowLeft />

                                <span>
                                    सभी अस्पताल
                                </span>
                            </button>

                            <button
                                type="button"
                                className="btn-3d dashboard-refresh-button"
                                onClick={
                                    handleRefresh
                                }
                                disabled={
                                    refreshing ||
                                    loadingHospitalData
                                }
                            >
                                <FaSyncAlt
                                    className={
                                        refreshing
                                            ? "spin"
                                            : ""
                                    }
                                />

                                {refreshing ||
                                loadingHospitalData
                                    ? "रीफ़्रेश हो रहा है..."
                                    : "रीफ़्रेश करें"}
                            </button>

                        </div>

                        <div className="selected-hospital-banner">

                            <div className="selected-hospital-banner-icon">
                                <FaHospital />
                            </div>

                            <div className="selected-hospital-banner-copy">

                                <span className="section-kicker">
                                    चयनित अस्पताल
                                </span>

                                <h2>
                                    {
                                        displayHospitalName
                                    }
                                </h2>

                                <p>
                                    अस्पताल प्रबंधन
                                    डैशबोर्ड
                                </p>

                            </div>

                            <span
                                className={`selected-hospital-status ${
                                    String(
                                        hospitalStatus
                                    ).toLowerCase() ===
                                    "active"
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                {String(hospitalStatus).toLowerCase() === "active" ? "सक्रिय" : "निष्क्रिय"}
                            </span>

                        </div>

                        <div className="selected-hospital-info">

                            {selectedLocation ||
                            selectedCity ||
                            selectedAddress ? (
                                <div className="hospital-info-item">

                                    <FaMapMarkerAlt />

                                    <div>
                                        <span>
                                            स्थान
                                        </span>

                                        <strong>
                                            {selectedLocation ||
                                                selectedCity ||
                                                selectedAddress}
                                        </strong>
                                    </div>

                                </div>
                            ) : null}

                            {selectedPhone ? (
                                <div className="hospital-info-item">

                                    <FaPhone />

                                    <div>
                                        <span>
                                            फ़ोन
                                        </span>

                                        <strong>
                                            {
                                                selectedPhone
                                            }
                                        </strong>
                                    </div>

                                </div>
                            ) : null}

                            {selectedEmail ? (
                                <div className="hospital-info-item">

                                    <FaEnvelope />

                                    <div>
                                        <span>
                                            ईमेल
                                        </span>

                                        <strong>
                                            {
                                                selectedEmail
                                            }
                                        </strong>
                                    </div>

                                </div>
                            ) : null}

                            <div className="hospital-info-item">

                                <FaBed />

                                <div>
                                    <span>
                                        बेड
                                    </span>

                                    <strong>
                                        {totalBeds}
                                        {" / "}
                                        {availableBeds}
                                        {" available"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        <div className="selected-hospital-heading">

                            <div>

                                <h2>
                                    अस्पताल प्रबंधन
                                </h2>

                                <p>
                                    मॉड्यूल खोलें और डेटा देखें:{" "}
                                    <strong>
                                        {
                                            displayHospitalName
                                        }
                                    </strong>
                                </p>

                            </div>

                        </div>

                        {loadingHospitalData ? (
                            <div className="dashboard-loading small-loading">

                                <div className="loading-spinner" />

                                <strong>
                                    अस्पताल का डेटा लोड हो रहा है...
                                </strong>

                            </div>
                        ) : (
                            <div className="super-admin-module-grid">

                                {HOSPITAL_MODULES.map(
                                    (module) => {

                                        const ModuleIcon =
                                            module.icon;

                                        const count =
                                            getModuleCount(
                                                module
                                            );

                                        return (
                                            <button
                                                type="button"
                                                className={`super-admin-module-card ${module.theme}`}
                                                key={
                                                    module.key
                                                }
                                                onClick={() => openModule(module)}
                                            >

                                                <span className="super-admin-module-icon">
                                                    <ModuleIcon />
                                                </span>

                                                <span className="super-admin-module-copy">

                                                    <strong>
                                                        {
                                                            module.label
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            module.description
                                                        }
                                                    </small>

                                                    {count !==
                                                        null && (
                                                        <span className="module-data-count">
                                                            {formatModuleCount(count)}

                                                            <em>
                                                                रिकॉर्ड
                                                            </em>
                                                        </span>
                                                    )}

                                                    {module.key ===
                                                        "reports" && (
                                                        <span className="module-data-count">
                                                            विश्लेषण

                                                            <em>
                                                                उपलब्ध
                                                            </em>
                                                        </span>
                                                    )}

                                                    {module.key ===
                                                        "settings" && (
                                                        <span className="module-data-count">
                                                            अस्पताल

                                                            <em>
                                                                कॉन्फ़िगरेशन
                                                            </em>
                                                        </span>
                                                    )}

                                                </span>

                                                <span className="super-admin-module-arrow">
                                                    →
                                                </span>

                                            </button>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>
                )}

            {/* =================================================
                स्टाफ डैशबोर्ड
            ================================================= */}

            {!isSuperAdmin && (
                <section className="staff-module-section">

                    <div className="staff-module-grid">

                        {staffModuleCards.map(
                            (module) => {

                                const ModuleIcon =
                                    module.icon;

                                return (
                                    <button
                                        type="button"
                                        className={`staff-module-card ${module.theme}`}
                                        key={
                                            module.key
                                        }
                                        onClick={() => openModule(module)}
                                    >

                                        <span className="staff-module-icon">
                                            <ModuleIcon />
                                        </span>

                                        <span className="staff-module-copy">

                                            <strong>
                                                {
                                                    module.label
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    module.description
                                                }
                                            </small>

                                            {getModuleCount(module) !==
                                                null && (
                                                <span className="module-data-count">
                                                    {formatModuleCount(getModuleCount(module))}

                                                    <em>
                                                        रिकॉर्ड
                                                    </em>
                                                </span>
                                            )}

                                        </span>

                                        <span className="staff-module-arrow">
                                            →
                                        </span>

                                    </button>
                                );
                            }
                        )}

                    </div>

                </section>
            )}

            {/* =================================================
                अस्पताल जोड़ने की विंडो
            ================================================= */}

            {showAddHospitalModal && (
                <div
                    style={
                        addHospitalOverlayStyle
                    }
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeAddHospitalModal();
                        }
                    }}
                >

                    <div
                        style={
                            addHospitalModalStyle
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-hospital-title"
                    >

                        {/* MODAL HEADER */}

                        <div
                            style={{
                                display: "flex",
                                alignItems:
                                    "flex-start",
                                justifyContent:
                                    "space-between",
                                gap: "15px",
                                marginBottom:
                                    "24px",
                            }}
                        >

                            <div>

                                <span
                                    className="section-kicker"
                                >
                                    सुपर एडमिन
                                </span>

                                <h2
                                    id="add-hospital-title"
                                    style={{
                                        margin:
                                            "6px 0 5px",
                                        fontSize:
                                            "25px",
                                    }}
                                >
                                    अस्पताल जोड़ें
                                </h2>

                                <p
                                    style={{
                                        margin: 0,
                                        color:
                                            "#9bbdb1",
                                        fontSize:
                                            "13px",
                                        lineHeight:
                                            1.5,
                                    }}
                                >
                                    नया अस्पताल पंजीकृत करें
                                    एचएमएस सिस्टम में।
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeAddHospitalModal
                                }
                                disabled={
                                    savingHospital
                                }
                                aria-label="बंद करें"
                                style={{
                                    ...modalButtonStyle,
                                    width: "40px",
                                    height: "40px",
                                    padding: 0,
                                    background:
                                        "rgba(255,255,255,0.07)",
                                    color:
                                        "#ffffff",
                                    flexShrink: 0,
                                }}
                            >
                                <FaTimes />
                            </button>

                        </div>

                        {/* FORM ERROR */}

                        {addHospitalError && (
                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: "9px",
                                    background:
                                        "rgba(255,70,70,0.10)",
                                    border:
                                        "1px solid rgba(255,70,70,0.30)",
                                    color:
                                        "#ff9f9f",
                                    borderRadius:
                                        "10px",
                                    padding:
                                        "11px 13px",
                                    marginBottom:
                                        "17px",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                <FaExclamationTriangle />

                                <span>
                                    {
                                        addHospitalError
                                    }
                                </span>
                            </div>
                        )}

                        {/* FORM */}

                        <form
                            onSubmit={
                                handleCreateHospital
                            }
                        >

                            <div
                                style={
                                    formGridStyle
                                }
                            >

                                {/* NAME */}

                                <div
                                    style={
                                        fullWidthStyle
                                    }
                                >

                                    <div
                                        style={
                                            formGroupStyle
                                        }
                                    >

                                        <label
                                            style={
                                                formLabelStyle
                                            }
                                        >
                                            अस्पताल का नाम *
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={
                                                hospitalForm.name
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="अस्पताल का नाम दर्ज करें"
                                            style={
                                                formInputStyle
                                            }
                                            autoFocus
                                            required
                                        />

                                    </div>

                                </div>

                                {/* ADDRESS */}

                                <div
                                    style={
                                        fullWidthStyle
                                    }
                                >

                                    <div
                                        style={
                                            formGroupStyle
                                        }
                                    >

                                        <label
                                            style={
                                                formLabelStyle
                                            }
                                        >
                                            पता
                                        </label>

                                        <textarea
                                            name="address"
                                            value={
                                                hospitalForm.address
                                            }
                                            onChange={
                                                handleHospitalFormChange
                                            }
                                            placeholder="अस्पताल का पूरा पता दर्ज करें"
                                            rows="3"
                                            style={{
                                                ...formInputStyle,
                                                resize:
                                                    "vertical",
                                                fontFamily:
                                                    "inherit",
                                            }}
                                        />

                                    </div>

                                </div>

                                {/* CITY */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        शहर
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        value={
                                            hospitalForm.city
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        placeholder="उदाहरण: गाज़ीपुर"
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* LOCATION */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        स्थान
                                    </label>

                                    <input
                                        type="text"
                                        name="location"
                                        value={
                                            hospitalForm.location
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        placeholder="उदाहरण: नारायणपुर"
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* PHONE */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        फ़ोन
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={
                                            hospitalForm.phone
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        placeholder="फ़ोन नंबर दर्ज करें"
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* EMAIL */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        ईमेल
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            hospitalForm.email
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        placeholder="hospital@example.com"
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* TOTAL BEDS */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        कुल बेड
                                    </label>

                                    <input
                                        type="number"
                                        name="total_beds"
                                        min="0"
                                        value={
                                            hospitalForm.total_beds
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* AVAILABLE BEDS */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        उपलब्ध बेड
                                    </label>

                                    <input
                                        type="number"
                                        name="available_beds"
                                        min="0"
                                        value={
                                            hospitalForm.available_beds
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        style={
                                            formInputStyle
                                        }
                                    />

                                </div>

                                {/* STATUS */}

                                <div
                                    style={
                                        formGroupStyle
                                    }
                                >

                                    <label
                                        style={
                                            formLabelStyle
                                        }
                                    >
                                        स्थिति
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            hospitalForm.status
                                        }
                                        onChange={
                                            handleHospitalFormChange
                                        }
                                        style={
                                            {
                                                ...formInputStyle,
                                                cursor:
                                                    "pointer",
                                            }
                                        }
                                    >
                                        <option
                                            value="active"
                                            style={{
                                                background:
                                                    "#10251f",
                                            }}
                                        >
                                            सक्रिय
                                        </option>

                                        <option
                                            value="inactive"
                                            style={{
                                                background:
                                                    "#10251f",
                                            }}
                                        >
                                            निष्क्रिय
                                        </option>
                                    </select>

                                </div>

                            </div>

                            {/* FORM ACTIONS */}

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "flex-end",
                                    gap: "10px",
                                    marginTop:
                                        "25px",
                                    paddingTop:
                                        "20px",
                                    borderTop:
                                        "1px solid rgba(255,255,255,0.08)",
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={
                                        closeAddHospitalModal
                                    }
                                    disabled={
                                        savingHospital
                                    }
                                    style={{
                                        ...modalButtonStyle,
                                        background:
                                            "rgba(255,255,255,0.08)",
                                        color:
                                            "#d7e8e2",
                                    }}
                                >
                                    <FaTimes />

                                    रद्द करें
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        savingHospital
                                    }
                                    style={{
                                        ...modalButtonStyle,
                                        background:
                                            "linear-gradient(135deg, #00c896, #00a878)",
                                        color:
                                            "#03110c",
                                        minWidth:
                                            "145px",
                                        opacity:
                                            savingHospital
                                                ? 0.7
                                                : 1,
                                    }}
                                >
                                    {savingHospital ? (
                                        <>
                                            <FaSyncAlt className="spin" />

                                            सेव हो रहा है...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />

                                            अस्पताल जोड़ें
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </main>
    );
}

export default Dashboard;
