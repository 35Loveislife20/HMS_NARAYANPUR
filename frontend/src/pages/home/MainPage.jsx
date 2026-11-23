import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  FaPlus,
  FaSearch,
  FaUserMd,
  FaCalendarAlt,
  FaFileMedical,
  FaShieldAlt,
  FaUsers,
  FaCog,
  FaClock,
  FaArrowRight,
  FaHeartbeat,
  FaHospital,
  FaUserInjured,
  FaPhoneAlt,
  FaBars,
  FaTimes,
  FaStethoscope,
  FaPills,
  FaFlask,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaChevronRight,
  FaSignInAlt,
} from "react-icons/fa";

import "./MainPage.css";
/* =========================================================
   BACK / FORWARD PAR AUTOMATIC REFRESH
   Browser ka Back ya Forward dabane par page reload hota hai.
   window flag se sirf ek baar install hota hai (Home aur MainPage
   dono me ye code hone par bhi listener double nahi lagta).
========================================================= */

if (typeof window !== "undefined" && !window.__hmsRefreshOnBack) {
  window.__hmsRefreshOnBack = true;

  window.addEventListener("popstate", () => {
    window.location.reload();
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });
}

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =====================================================
   PUBLIC DOCTOR DATA HELPERS
===================================================== */

const getApiOrigin = () => API_BASE.replace(/\/api\/?$/, "");

const resolvePublicAssetUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("/uploads/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  return `${getApiOrigin()}${value.startsWith("/") ? "" : "/"}${value}`;
};


/* =====================================================
   REAL COUNT HELPER
   Backend alag-alag naam se counts bhej sakta hai
   (totalPatients / total_patients / patients_count /
   stats.patients / _count.patients ...). Pehli valid
   value use hoti hai; kuch na mile to null.
===================================================== */

const pickCount = (record, names) => {
  if (!record) return null;

  const sources = [
    record,
    record.stats,
    record.counts,
    record._count,
    record.summary,
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const name of names) {
      const value = source[name];

      if (Array.isArray(value)) return value.length;

      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isFinite(Number(value))
      ) {
        return Number(value);
      }
    }
  }

  return null;
};

const COUNT_KEYS = {
  doctors: ["totalDoctors", "total_doctors", "doctorsCount", "doctors_count", "doctor_count", "doctors"],
  patients: ["totalPatients", "total_patients", "patientsCount", "patients_count", "patient_count", "patients"],
  departments: ["totalDepartments", "total_departments", "departmentsCount", "departments_count", "department_count", "departments"],
  appointments: ["totalAppointments", "total_appointments", "appointmentsCount", "appointments_count", "appointment_count", "appointments"],
};




/* =====================================================
   PATIENT SELECT (searchable hospital dropdown)
   Hamesha control ke NEECHE khulta hai; menu body me
   portal se render hota hai, isliye modal ya page
   ka overflow use cut nahi karta.
===================================================== */

function PatientSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "चुनें",
  icon = null,
  disabled = false,
  searchPlaceholder = "अस्पताल खोजें",
  emptyText = "कोई अस्पताल नहीं मिला",
}) {
  const rootRef = useRef(null);
  const controlRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState(null);

  /*
    Menu ko document.body me render karte hain (portal) aur
    position: fixed se control ke theek NEECHE rakhte hain.
    Isse card / parent ka overflow ya transform ise cut nahi karta,
    aur ye card ke bahar tak nikal sakta hai.
  */
  const measure = () => {
    const rect = controlRef.current?.getBoundingClientRect();

    if (!rect) return null;

    const spaceBelow = window.innerHeight - rect.bottom - 6 - 70;

    return {
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxList: Math.max(120, Math.min(210, spaceBelow)),
    };
  };

  const selected = options.find(
    (item) => String(item.value) === String(value)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return options;

    return options.filter((item) =>
      `${item.label} ${item.sub || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [options, query]);

  /* Open hote hi search par focus + selected item highlight */
  useEffect(() => {
    if (!open) return;

    const index = filtered.findIndex(
      (item) => String(item.value) === String(value)
    );

    setActiveIndex(index >= 0 ? index : 0);
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Search badalne par pehla result active */
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* Bahar click par band */
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  /* Scroll / resize par menu control ke saath chipka rahe */
  useEffect(() => {
    if (!open) return undefined;

    const update = (event) => {
      if (menuRef.current?.contains(event?.target)) return;
      setPos(measure());
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Active item hamesha visible rahe */
  useEffect(() => {
    if (!open) return;

    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    setPos(measure());
    setOpen(true);
  };

  const closeMenu = (refocus = false) => {
    setOpen(false);
    if (refocus) controlRef.current?.focus();
  };

  const choose = (item) => {
    if (!item) return;
    onChange?.(item.value);
    closeMenu(true);
  };

  const handleControlKeyDown = (event) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      openMenu();
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, Math.max(filtered.length - 1, 0))
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault(); /* login form submit na ho */
      choose(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === "Tab") {
      closeMenu(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={open ? "ps ps-open" : "ps"}
    >
      <button
        ref={controlRef}
        id={id}
        type="button"
        className="ps-control"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleControlKeyDown}
      >
        {icon && <span className="ps-icon">{icon}</span>}

        <span
          className={
            selected
              ? "ps-value"
              : "ps-value ps-placeholder"
          }
        >
          {selected ? selected.label : placeholder}
        </span>

        <span className="ps-arrow" aria-hidden="true" />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="ps-menu"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
          }}
        >
          <div className="ps-search">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
            </svg>

            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <ul
            ref={listRef}
            className="ps-list"
            role="listbox"
            style={{ maxHeight: pos.maxList }}
          >
            {filtered.length === 0 && (
              <li className="ps-empty">{emptyText}</li>
            )}

            {filtered.map((item, index) => {
              const isSelected =
                String(item.value) === String(value);
              const isActive = index === activeIndex;

              return (
                <li
                  key={item.value}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  className={
                    "ps-option" +
                    (isActive ? " active" : "") +
                    (isSelected ? " selected" : "")
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <span className="ps-option-name">
                    {item.label}
                  </span>

                  {item.sub && (
                    <small className="ps-option-sub">
                      {item.sub}
                    </small>
                  )}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

/* Hospital ka logo dikhata hai; logo na ho ya load na ho to default icon */
function HospitalLogoOrIcon({ logo, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logo]);

  if (logo && !failed) {
    return (
      <img
        className="department-summary-logo"
        src={logo}
        alt={name ? `${name} का लोगो` : "अस्पताल का लोगो"}
        onError={() => setFailed(true)}
      />
    );
  }

  return <FaHospital />;
}

function MainPage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem("hms_token") || "",
    user: (() => {
      try {
        return JSON.parse(localStorage.getItem("hms_user") || "null");
      } catch {
        return null;
      }
    })(),
  }));

  /* Default branding (Super Admin > Settings): logo + background */
  const [brand, setBrand] = useState({ logo: "", background: "" });

  const [hospitals, setHospitals] = useState([]);

  /* Hospital data / stats ko tab wapas aane par, 60 second ke gap me, refresh karein */
  const [refreshTick, setRefreshTick] = useState(0);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastRefreshRef.current < 60000) return;
      lastRefreshRef.current = now;
      setRefreshTick((tick) => tick + 1);
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const [hospitalLoading, setHospitalLoading] =
    useState(true);

  const [activeHospitalIndex, setActiveHospitalIndex] =
    useState(0);

  /* Real doctors only. No fake/default doctor records. */
  const [doctors, setDoctors] = useState([]);

  const [doctorLoading, setDoctorLoading] = useState(true);

  /* AI-generated transparent doctor portraits.
     Original photo is used automatically if background removal is unavailable. */
  const [doctorCutouts, setDoctorCutouts] = useState({});

  /* =====================================================
     PATIENT SERVICE FLOW
     Click patient action -> service card -> hospital select
     -> continue -> selected patient page/data.
  ===================================================== */
  const [patientServiceOpen, setPatientServiceOpen] =
    useState(false);

  const [patientServicePath, setPatientServicePath] =
    useState("/patients");

  const [selectedPatientHospital, setSelectedPatientHospital] =
    useState(null);

  /* "hospital" -> hospital select, "choose" -> New / Old patient */
  const [patientServiceStep, setPatientServiceStep] =
    useState("hospital");

  /* =====================================================
     AUTOMATIC DOCTOR BACKGROUND REMOVAL
     Uses @imgly/background-removal in the browser.
     Transparent result is cached in doctorCutouts.
  ===================================================== */
  useEffect(() => {
    let cancelled = false;
    const createdUrls = [];

    const processDoctorImages = async () => {
      if (!doctors.length) return;

      let removeBackground;

      try {
        const module = await import("@imgly/background-removal");
        removeBackground = module.removeBackground;
      } catch (error) {
        console.warn(
          "Doctor background removal package is not installed. Original doctor photos will be used.",
          error
        );
        return;
      }

      if (typeof removeBackground !== "function") return;

      for (const doctor of doctors) {
        if (!doctor.image) continue;

        try {
          const result = await removeBackground(doctor.image, {
            output: {
              format: "image/png",
            },
          });

          if (cancelled) {
            if (result instanceof Blob) {
              URL.revokeObjectURL(URL.createObjectURL(result));
            }
            return;
          }

          if (result instanceof Blob) {
            const transparentUrl = URL.createObjectURL(result);
            createdUrls.push(transparentUrl);

            setDoctorCutouts((previous) => ({
              ...previous,
              [doctor.id]: transparentUrl,
            }));
          }
        } catch (error) {
          console.warn(
            `Background removal failed for doctor ${doctor.name || doctor.id}. Original image will be used.`,
            error
          );
        }
      }
    };

    processDoctorImages();

    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [doctors]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const go = (path) => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  const refreshAuthState = () => {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("hms_user") || "null");
    } catch {
      user = null;
    }

    setAuthState({
      token: localStorage.getItem("hms_token") || "",
      user,
    });
  };

  useEffect(() => {
    refreshAuthState();

    const handleAuthChange = () => refreshAuthState();

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("hmsAuthUpdated", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("hmsAuthUpdated", handleAuthChange);
    };
  }, []);

  const isLoggedIn = Boolean(authState.token);
  const loggedInRole = String(
    authState.user?.role ||
    authState.user?.roleName ||
    ""
  ).toLowerCase();

  const loginLabel = isLoggedIn
    ? loggedInRole === "super_admin"
      ? "सुपर एडमिन"
      : "डैशबोर्ड"
    : "HMS लॉगिन";

  const handleLoginClick = () => {
    // Sirf Home page kholo; wahan pehle "HMS लॉगिन" button dikhta hai
    go("/home");
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    const results = [];

    hospitals.forEach((hospital) => {
      const name = String(hospital?.name || "");
      const location = String(hospital?.location || "");

      if (`${name} ${location}`.toLowerCase().includes(query)) {
        results.push({
          type: "अस्पताल",
          label: name,
          detail: location,
          target: "services",
        });
      }
    });

    doctors.forEach((doctor) => {
      const name = String(doctor?.name || "");
      const specialization = String(doctor?.specialization || "");

      if (`${name} ${specialization}`.toLowerCase().includes(query)) {
        results.push({
          type: "डॉक्टर",
          label: name,
          detail: specialization,
          target: "doctors",
        });
      }
    });

    const sections = [
      ["सेवाएँ", "services"],
      ["विभाग", "departments"],
      ["अपॉइंटमेंट", "appointments"],
      ["हमारे बारे में", "about"],
      ["संपर्क करें", "contact"],
    ];

    sections.forEach(([label, target]) => {
      if (label.toLowerCase().includes(query)) {
        results.push({
          type: "अनुभाग",
          label,
          detail: "अनुभाग खोलें",
          target,
        });
      }
    });

    return results.slice(0, 7);
  }, [searchQuery, hospitals, doctors]);

  const handleSearchResult = (result) => {
    setSearchOpen(false);
    setSearchQuery("");
    scrollToSection(result.target);
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    setSearchOpen(false);

    const element = document.getElementById(id);

    if (!element) return;

    // The header is fixed, so calculate the exact document position
    // instead of relying on scrollIntoView() and browser scroll-margin.
    const headerOffset = window.innerWidth <= 720 ? 68 : 74;
    const elementTop =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      headerOffset;

    window.scrollTo({
      top: Math.max(0, elementTop),
      behavior: "smooth",
    });
  };

  /* =====================================================
     OPEN PATIENT SERVICE
  ===================================================== */
  const openPatientService = (path = "/patients") => {
    setMenuOpen(false);
    setPatientServicePath(path);

    // Hospital must be explicitly selected every time before
    // the patient service page can be opened. A previously saved
    // hospital is not auto-selected here.
    setSelectedPatientHospital(null);
    setPatientServiceStep("hospital");
    setPatientServiceOpen(true);
  };

  const closePatientService = () => {
    setPatientServiceOpen(false);
    setSelectedPatientHospital(null);
    setPatientServiceStep("hospital");
  };

  const continuePatientService = () => {
    if (!selectedPatientHospital) {
      return;
    }

    localStorage.setItem(
      "hms_patient_hospital_id",
      String(selectedPatientHospital.id)
    );

    localStorage.setItem(
      "hms_patient_hospital_name",
      selectedPatientHospital.name || "चयनित अस्पताल"
    );

    /* New / Old pehle se chuna ho to seedha us page par, warna option dikhao */
    if (patientServicePath === "/patients/register") {
      choosePatientType("new");
      return;
    }

    if (patientServicePath === "/appointments/old") {
      choosePatientType("old");
      return;
    }

    setPatientServiceStep("choose");
  };

  const choosePatientType = (type) => {
    setPatientServiceOpen(false);
    setPatientServiceStep("hospital");
    const hospital = selectedPatientHospital;
    navigate(type === "new" ? "/patients/register" : "/appointments/old", {
      state: {
        hospital,
        hospital_id: Number(hospital?.id),
      },
    });
  };

  /* =====================================================
     PUBLIC BRANDING API (default logo + background)
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const loadBranding = async () => {
      const endpoints = [
        `${API_BASE}/settings`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) continue;

          const payload = await response.json().catch(() => null);
          const settings = payload?.settings ?? payload?.data ?? payload;

          if (!settings || typeof settings !== "object") continue;

          const logo = resolvePublicAssetUrl(
            settings.superAdminLogo ??
              settings.super_admin_logo ??
              settings.adminLogo ??
              settings.logo ??
              ""
          );

          const background = resolvePublicAssetUrl(
            settings.loginBackgroundImage ??
              settings.login_background_image ??
              settings.backgroundImage ??
              ""
          );

          if (mounted && (logo || background)) {
            setBrand({ logo, background });
          }

          return;
        } catch {
          /* next endpoint */
        }
      }
    };

    loadBranding();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     HOSPITAL API
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchHospitals = async () => {
      try {
        setHospitalLoading(true);

        const endpoints = [
          `${API_BASE}/hospitals`,
          `${API_BASE}/hospital`,
        ];

        let jsonData = null;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);

            if (!response.ok) {
              continue;
            }

            const data = await response.json();

            jsonData = data;
            break;
          } catch (error) {
            console.warn(
              "Hospital endpoint failed:",
              endpoint
            );
          }
        }

        if (!jsonData) {
          if (mounted) {
            setHospitals([]);
          }

          return;
        }

        let list = [];

        if (Array.isArray(jsonData)) {
          list = jsonData;
        } else if (
          Array.isArray(jsonData.hospitals)
        ) {
          list = jsonData.hospitals;
        } else if (
          Array.isArray(jsonData.data)
        ) {
          list = jsonData.data;
        } else if (
          Array.isArray(jsonData.results)
        ) {
          list = jsonData.results;
        }

        const normalized = list
          .filter((hospital) => {
            if (!hospital) {
              return false;
            }

            if (
              hospital.is_active === false ||
              hospital.active === false ||
              hospital.status === "inactive"
            ) {
              return false;
            }

            return true;
          })
          .map((hospital, index) => ({
            ...hospital,

            /* Hospital ka apna logo aur background (alag alag) */
            logo: resolvePublicAssetUrl(
              hospital.logo_url ||
              hospital.logoUrl ||
              hospital.hospital_logo ||
              hospital.logo ||
              ""
            ),

            background: resolvePublicAssetUrl(
              hospital.login_background_image ||
              hospital.loginBackgroundImage ||
              hospital.background_image ||
              hospital.backgroundImage ||
              hospital.cover_image ||
              hospital.coverImage ||
              hospital.banner ||
              ""
            ),

            id:
              hospital.id ||
              hospital.hospital_id ||
              hospital.hospitalId ||
              `hospital-${index}`,

            // Keep the original hospital name from the backend as the primary title.
            // Do not replace it with a generic/derived title when `name` exists.
            name:
              hospital.name ||
              hospital.hospital_name ||
              hospital.hospitalName ||
              hospital.title ||
              "अस्पताल की जानकारी उपलब्ध नहीं",

            location:
              hospital.location ||
              hospital.address ||
              hospital.city ||
              hospital.district ||
              hospital.state ||
              "स्थान उपलब्ध नहीं",

            image: resolvePublicAssetUrl(
              hospital.image ||
              hospital.image_url ||
              hospital.imageUrl ||
              hospital.hospital_image ||
              hospital.photo ||
              ""
            ),
          }));

        if (mounted) {
          setHospitals(normalized);
        }
      } catch (error) {
        console.error(
          "Hospital loading error:",
          error
        );

        if (mounted) {
          setHospitals([]);
        }
      } finally {
        if (mounted) {
          setHospitalLoading(false);
        }
      }
    };

    fetchHospitals();

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  /* =====================================================
     HOSPITAL DISPLAY DATA

     IMPORTANT:
     Hospitals must come only from the real backend/database.
     No hard-coded or fallback hospital records are allowed.
  ===================================================== */

  const displayHospitals = useMemo(() => hospitals, [hospitals]);

  /* Har hospital ki background image (hospital id ke hisaab se).
     Doctor cards me isi se hospital ka background dikhta hai. */
  const hospitalBackgroundById = useMemo(() => {
    const map = {};

    hospitals.forEach((hospital) => {
      const image = hospital.background || hospital.image;

      if (image) {
        map[String(hospital.id)] = image;
      }
    });

    return map;
  }, [hospitals]);

  /* Doctor ka background hamesha USI ke hospital ka hoga:
     1) doctor ke apne hospital record ki image
     2) hospital id se match
     3) hospital naam se match
     Kisi aur hospital ki image kabhi fallback nahi hogi. */
  const getDoctorHospitalBg = (doctor) => {
    if (doctor.hospitalImage) {
      return doctor.hospitalImage;
    }

    const byId = hospitalBackgroundById[String(doctor.hospitalId)];

    if (byId) {
      return byId;
    }

    const doctorHospitalName = String(doctor.hospital || "")
      .trim()
      .toLowerCase();

    if (!doctorHospitalName) {
      return "";
    }

    const sameHospital = hospitals.find(
      (hospital) =>
        String(hospital.name || "").trim().toLowerCase() ===
        doctorHospitalName
    );

    return sameHospital
      ? sameHospital.background || sameHospital.image || ""
      : "";
  };

  /* =====================================================
     ACTIVE HOSPITAL
  ===================================================== */

  const activeHospital =
    displayHospitals[activeHospitalIndex] ||
    displayHospitals[0];

  /* =====================================================
     ORIGINAL HOSPITAL NAME AS PAGE TITLE
     The browser/tab title always follows the real hospital name.
  ===================================================== */
  useEffect(() => {
    const originalHospitalName = String(activeHospital?.name || "").trim();
    document.title = originalHospitalName
      ? originalHospitalName
      : "HMS - अस्पताल प्रबंधन प्रणाली";

    return () => {
      document.title = "HMS - अस्पताल प्रबंधन प्रणाली";
    };
  }, [activeHospital?.name]);

  /* =====================================================
     HOSPITAL AUTO SLIDER
  ===================================================== */

  useEffect(() => {
    if (displayHospitals.length <= 1) {
      setActiveHospitalIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveHospitalIndex((previousIndex) => {
        return (
          (previousIndex + 1) %
          displayHospitals.length
        );
      });
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [displayHospitals]);

  /* =====================================================
     PUBLIC DOCTOR API — ALL HOSPITALS

     This section is completely independent of the selected hero hospital.
     It uses the public endpoint created specifically for the landing page.
     Only real doctors returned by the backend are rendered.
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);

        const response = await fetch(`${API_BASE}/public/doctors`);
        const jsonData = await response.json().catch(() => null);

        if (!response.ok || jsonData?.success === false) {
          throw new Error(jsonData?.message || `Doctor API failed: ${response.status}`);
        }

        const list = Array.isArray(jsonData?.data)
          ? jsonData.data
          : Array.isArray(jsonData?.doctors)
            ? jsonData.doctors
            : [];

        const seen = new Set();

        const normalizedDoctors = list
          .filter((doctor) => doctor && doctor.hospital)
          .filter((doctor) => {
            const key = `${doctor.id}::${doctor.hospital.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((doctor) => ({
            id: doctor.id,
            name: doctor.name || "डॉक्टर की जानकारी उपलब्ध नहीं",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            experience:
              doctor.experience_years !== null &&
              doctor.experience_years !== undefined
                ? `${doctor.experience_years} वर्ष का अनुभव`
                : "",
            image: resolvePublicAssetUrl(doctor.photo),
            /* null = backend ne availability bheji hi nahi */
            available:
              doctor.is_available ??
              doctor.isAvailable ??
              doctor.available ??
              (doctor.status
                ? String(doctor.status).toLowerCase() === "active"
                : null),
            hospital: doctor.hospital?.name || "",
            hospitalId: doctor.hospital?.id ?? "",
            location:
              doctor.hospital?.location ||
              doctor.hospital?.address ||
              doctor.hospital?.city ||
              "",
            hospitalImage: resolvePublicAssetUrl(
              doctor.hospital?.login_background_image ||
              doctor.hospital?.loginBackgroundImage ||
              doctor.hospital?.background_image ||
              doctor.hospital?.backgroundImage ||
              doctor.hospital?.cover_image ||
              doctor.hospital?.image_url ||
              doctor.hospital?.logo_url
            ),
          }));

        if (mounted) {
          setDoctors(normalizedDoctors);
          console.log(
            `Loaded ${normalizedDoctors.length} real doctors from /api/public/doctors.`
          );
        }
      } catch (error) {
        console.error("Public doctor loading error:", error);
        if (mounted) {
          setDoctors([]);
        }
      } finally {
        if (mounted) {
          setDoctorLoading(false);
        }
      }
    };

    fetchDoctors();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     LIVE COUNTS FOR ACTIVE HOSPITAL
     Doctors: backend count ya /public/doctors se is hospital ke
     doctors. (Pehle sabhi hospitals ke doctors gine ja rahe the.)
  ===================================================== */

  const activeHospitalDoctors = activeHospital
    ? doctors.filter(
        (doctor) =>
          String(doctor.hospitalId) ===
            String(activeHospital.id) ||
          (doctor.hospital &&
            doctor.hospital === activeHospital.name)
      )
    : [];

  /* =====================================================
     REAL STATS + DEPARTMENTS FOR ACTIVE HOSPITAL
     Pehle patients / departments / appointments agar hospital
     record me na ho to 0 dikhta tha (jo galat hai). Ab har
     hospital ke liye backend se real stats aur departments
     fetch hote hain. Data na mile to "—" dikhta hai, 0 nahi.
  ===================================================== */

  const [hospitalStatsData, setHospitalStatsData] = useState({});
  const [hospitalDepartments, setHospitalDepartments] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!activeHospital?.id) return undefined;

    const hospitalId = String(activeHospital.id);

    let mounted = true;

    const fetchFirst = async (paths) => {
      for (const path of paths) {
        try {
          const response = await fetch(`${API_BASE}${path}`, {
            headers: { Accept: "application/json" },
          });

          if (!response.ok) continue;

          const data = await response.json().catch(() => null);

          if (data && data.success !== false) return data;
        } catch {
          /* next endpoint */
        }
      }

      return null;
    };

    const load = async () => {
      setStatsLoading(true);

      const [statsPayload, deptPayload] = await Promise.all([
        fetchFirst([
          `/public/hospitals/${hospitalId}/stats`,
          `/hospitals/${hospitalId}/stats`,
          `/public/stats?hospital_id=${hospitalId}`,
        ]),
        fetchFirst([
          `/public/hospitals/${hospitalId}/departments`,
          `/hospitals/${hospitalId}/departments`,
          `/public/departments?hospital_id=${hospitalId}`,
        ]),
      ]);

      if (!mounted) return;

      const statsRecord =
        statsPayload?.data && !Array.isArray(statsPayload.data)
          ? statsPayload.data
          : statsPayload?.stats || statsPayload || null;

      const deptList = Array.isArray(deptPayload)
        ? deptPayload
        : Array.isArray(deptPayload?.data)
          ? deptPayload.data
          : Array.isArray(deptPayload?.departments)
            ? deptPayload.departments
            : null;

      /* null = backend ne diya hi nahi (alag baat hai 0 se) */
      setHospitalStatsData((previous) => ({
        ...previous,
        [hospitalId]: statsRecord,
      }));

      setHospitalDepartments((previous) => ({
        ...previous,
        [hospitalId]: deptList,
      }));

      setStatsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHospital?.id, refreshTick]);

  const fetchedStats = activeHospital
    ? hospitalStatsData[String(activeHospital.id)]
    : null;

  const activeDepartments = activeHospital
    ? hospitalDepartments[String(activeHospital.id)]
    : null;

  /* null = real value available nahi; UI "—" dikhata hai */
  const liveCounts = {
    doctors:
      pickCount(fetchedStats, COUNT_KEYS.doctors) ??
      pickCount(activeHospital, COUNT_KEYS.doctors) ??
      activeHospitalDoctors.length,
    patients:
      pickCount(fetchedStats, COUNT_KEYS.patients) ??
      pickCount(activeHospital, COUNT_KEYS.patients),
    departments:
      pickCount(fetchedStats, COUNT_KEYS.departments) ??
      pickCount(activeHospital, COUNT_KEYS.departments) ??
      (Array.isArray(activeDepartments)
        ? activeDepartments.length
        : null),
    appointments:
      pickCount(fetchedStats, COUNT_KEYS.appointments) ??
      pickCount(activeHospital, COUNT_KEYS.appointments),
  };

  const showCount = (value) =>
    value === null || value === undefined
      ? statsLoading
        ? "…"
        : "—"
      : value;

  /* =====================================================
     PATIENT SERVICES
  ===================================================== */

  const patientServices = [
    {
      icon: <FaFileMedical />,
      title: "नए रोगी का अपॉइंटमेंट",
      text: "निःशुल्क पंजीकरण + डॉक्टर अपॉइंटमेंट",
      path: "/patients/register",
    },
    {
      icon: <FaCalendarAlt />,
      title: "पुराने रोगी का अपॉइंटमेंट",
      text: "अपनी पंजीकरण संख्या से बुक करें",
      path: "/appointments/old",
    },
  ];

  /* =====================================================
     LIVE HOSPITAL ADMINISTRATION SUMMARY
     No static/fake hospital metrics.
  ===================================================== */

  const countText = (count, word, suffix) =>
    count === null || count === undefined
      ? `इस अस्पताल के लिए ${word} का डेटा अभी उपलब्ध नहीं है।`
      : `${count} ${word} ${suffix}`;

  const hospitalStats = activeHospital
    ? [
        {
          icon: <FaUserMd />,
          title: "डॉक्टर",
          text: countText(liveCounts.doctors, "डॉक्टर", "इस अस्पताल से जुड़े हैं।"),
        },
        {
          icon: <FaUserInjured />,
          title: "रोगी",
          text: countText(liveCounts.patients, "रोगी", "इस अस्पताल से जुड़े हैं।"),
        },
        {
          icon: <FaFlask />,
          title: "विभाग",
          text: countText(liveCounts.departments, "विभाग", "इस अस्पताल में संचालित हैं।"),
        },
        {
          icon: <FaCalendarAlt />,
          title: "अपॉइंटमेंट",
          text: countText(liveCounts.appointments, "अपॉइंटमेंट", "इस अस्पताल से जुड़े हैं।"),
        },
      ]
    : [];

  /* =====================================================
     HEALTHCARE SERVICES
  ===================================================== */

  const healthcareServices = [
    {
      icon: <FaUserMd />,
      title: "डॉक्टर",
      text: activeHospital
        ? countText(liveCounts.doctors, "डॉक्टर", "इस अस्पताल से जुड़े हैं।")
        : "अस्पताल बनने के बाद डॉक्टरों की जानकारी यहाँ दिखेगी।",
    },
    {
      icon: <FaHospital />,
      title: "अस्पताल प्रशासन",
      text: activeHospital
        ? `${activeHospital.name} HMS अस्पताल प्रशासन प्रणाली से जुड़ा हुआ है।`
        : "अस्पताल बनने के बाद प्रशासन की जानकारी यहाँ दिखेगी।",
    },
    {
      icon: <FaFlask />,
      title: "विभाग",
      text: activeHospital
        ? countText(liveCounts.departments, "विभाग", "इस अस्पताल से जुड़े हैं।")
        : "अस्पताल बनने के बाद विभागों की जानकारी यहाँ दिखेगी।",
    },
    {
      icon: <FaCalendarAlt />,
      title: "अपॉइंटमेंट",
      text: activeHospital
        ? countText(liveCounts.appointments, "अपॉइंटमेंट", "इस अस्पताल से जुड़े हैं।")
        : "अस्पताल बनने के बाद अपॉइंटमेंट की जानकारी यहाँ दिखेगी।",
    },
  ];
  /* ---------- HERO IMAGE FALLBACK ---------- */
  const heroImage =
    activeHospital?.background ||
    activeHospital?.image ||
    "";

  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [activeHospital?.id, heroImage]);

  return (
    <div className="main-page" lang="hi">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="main-header">

        <div className="header-inner">

          <button
            className="brand"
            type="button"
            onClick={() =>
              scrollToSection("top")
            }
          >
            {brand.logo ? (
              <img
                className="brand-logo-img"
                src={brand.logo}
                alt="HMS"
                onError={() =>
                  setBrand((previous) => ({ ...previous, logo: "" }))
                }
              />
            ) : (
              <div className="brand-logo">
                <FaPlus />
              </div>
            )}

            <div className="brand-text">
              <h1>HMS</h1>

              <span>अस्पताल प्रबंधन प्रणाली</span>
            </div>
          </button>

          <nav
            className={`main-nav ${
              menuOpen ? "nav-open" : ""
            }`}
          >
            <button
              type="button"
              className="active"
              onClick={() =>
                scrollToSection("top")
              }
            >होम</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("about")
              }
            >हमारे बारे में</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("services")
              }
            >सेवाएँ</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("doctors")
              }
            >डॉक्टर</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("departments")
              }
            >विभाग</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("appointments")
              }
            >अपॉइंटमेंट</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("contact")
              }
            >संपर्क करें</button>
          </nav>

          <div className="header-actions">

            <div className={`header-search ${searchOpen ? "is-open" : ""}`}>
              <button
                className="search-btn"
                type="button"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setSearchQuery("");
                }}
                aria-label={searchOpen ? "खोज बंद करें" : "HMS में खोजें"}
                aria-expanded={searchOpen}
              >
                <FaSearch />
              </button>

              {searchOpen && (
                <div className="header-search-panel">
                  <div className="header-search-input-wrap">
                    <FaSearch />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setSearchOpen(false);
                          setSearchQuery("");
                        } else if (event.key === "Enter" && searchResults[0]) {
                          handleSearchResult(searchResults[0]);
                        }
                      }}
                      placeholder="अस्पताल, डॉक्टर, सेवाएँ खोजें..."
                      autoFocus
                    />
                  </div>

                  {searchQuery.trim() && (
                    <div className="header-search-results">
                      {searchResults.length ? (
                        searchResults.map((result, index) => (
                          <button
                            type="button"
                            className="header-search-result"
                            key={`${result.type}-${result.label}-${index}`}
                            onClick={() => handleSearchResult(result)}
                          >
                            <span className="header-search-result-icon">
                              {result.type === "डॉक्टर" ? <FaUserMd /> : <FaHospital />}
                            </span>
                            <span className="header-search-result-copy">
                              <strong>{result.label}</strong>
                              <small>{result.type} · {result.detail}</small>
                            </span>
                            <FaArrowRight />
                          </button>
                        ))
                      ) : (
                        <div className="header-search-empty">कोई मिलता-जुलता अस्पताल, डॉक्टर या अनुभाग नहीं मिला।</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className={`hms-login-btn ${isLoggedIn ? "is-authenticated" : "is-guest"}`}
              type="button"
              onClick={handleLoginClick}
              aria-label={isLoggedIn ? "HMS डैशबोर्ड खोलें" : "HMS लॉगिन खोलें"}
            >
              <FaSignInAlt />
              <span>{loginLabel}</span>
              <FaArrowRight />
            </button>

          </div>

          <button
            className="mobile-menu-btn"
            type="button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
          >
            {menuOpen ? (
              <FaTimes />
            ) : (
              <FaBars />
            )}
          </button>

        </div>
      </header>

            {/* =================================================
          HERO
      ================================================= */}

      <section
        className="hero-section"
        id="top"
      >

        <div className="hero-grid-lines"></div>

        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>

        <div className="hero-content">

          <div className="hero-left">

            <div className="welcome-label">
              <span></span>HMS में आपका स्वागत है</div>

            <h2
              key={
                activeHospital?.id ||
                activeHospital?.name
              }
              className="hero-hospital-title"
            >
              {activeHospital?.name || ""}
            </h2>

            <strong className="hero-hospital-tagline">
              {activeHospital
                ? `${activeHospital.city || activeHospital.location || "अस्पताल"} स्वास्थ्य प्रशासन`
                : "अस्पताल प्रशासन"}
            </strong>

            <p>
              {activeHospital
                ? `${activeHospital.name} अस्पताल संचालन, डॉक्टर, रोगी, विभाग और अपॉइंटमेंट के लाइव HMS प्रशासन डेटा से जुड़ा हुआ है।`
                : "सुपर एडमिन में अस्पताल बनने के बाद लाइव अस्पताल प्रशासन की जानकारी यहाँ दिखेगी।"}
            </p>

            <div className="hero-hospital-location">

              <FaMapMarkerAlt />

              <span>
                {activeHospital?.address ||
                  activeHospital?.location ||
                  activeHospital?.city ||
                  "अस्पताल का पता उपलब्ध नहीं"}
              </span>

            </div>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                type="button"
                onClick={() => openPatientService("/patients")}
              >
                <FaUserInjured />रोगी सेवा<FaArrowRight />
              </button>

              <button
                className="outline-btn"
                type="button"
                onClick={() =>
                  scrollToSection("services")
                }
              >हमारे अस्पताल<FaArrowRight />
              </button>

            </div>

            <div className="hero-trust">

              <div className="trust-item">

                <div className="trust-icon">
                  <FaShieldAlt />
                </div>

                <div>
                  <strong>भरोसेमंद देखभाल</strong>

                  <span>सुरक्षित एवं संरक्षित</span>
                </div>

              </div>

              <div className="trust-item">

                <div className="trust-icon">
                  <FaHeartbeat />
                </div>

                <div>
                  <strong>विशेषज्ञ डॉक्टर</strong>

                  <span>कुशल पेशेवर</span>
                </div>

              </div>

              <div className="trust-item">

                <div className="trust-icon">
                  <FaClock />
                </div>

                <div>
                  <strong>24/7 सहायता</strong>

                  <span>हमेशा आपके साथ</span>
                </div>

              </div>

            </div>

          </div>

          <div className="hero-right">

            {activeHospital ? (

              <div
                className={`hero-image-wrapper${
                  heroImage && !heroImgFailed ? " hero-transparent" : ""
                }`}
                key={
                  activeHospital.id ||
                  activeHospital.name
                }
              >

                <div className="hero-image-glow"></div>

                {heroImage && !heroImgFailed ? (
                  <img
                    src={heroImage}
                    alt={activeHospital.name || "अस्पताल"}
                    onError={() => setHeroImgFailed(true)}
                  />
                ) : (
                  <div className="hero-image-fallback">
                    <FaHospital />
                    <span>{activeHospital.name}</span>
                  </div>
                )}

                <div className="ecg-line">

                  <svg viewBox="0 0 700 120">

                    <polyline
                      points="0,70 100,70 125,70 145,25 165,100 185,70 290,70 315,70 335,45 350,90 365,70 470,70 500,70 520,20 540,105 560,70 700,70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />

                  </svg>

                </div>

              </div>

            ) : (

              <div className="hero-image-wrapper hero-empty-state">
                <div className="hero-image-glow"></div>
                <FaHospital />
                <strong>कोई अस्पताल उपलब्ध नहीं</strong>
                <span>यहाँ लाइव अस्पताल प्रशासन डेटा दिखाने के लिए सुपर एडमिन से अस्पताल बनाएँ।</span>
              </div>

            )}

          </div>

        </div>
      </section>

      {/* =================================================
          HOSPITALS
      ================================================= */}

      <section
        className="services-section"
        id="services"
      >

        <div className="hospital-section-heading">

          <span className="section-label">हमारे अस्पताल</span>

          <h3>
            हमारा{" "}<span>स्वास्थ्य नेटवर्क</span>
          </h3>

          <p>
            HMS स्वास्थ्य नेटवर्क में उपलब्ध अस्पताल देखें।
          </p>

        </div>

        <div className="services-container">

          <div className="hospital-marquee-wrapper">

            {hospitalLoading &&
            hospitals.length === 0 ? (

              <div className="hospital-loading">

                <FaHospital />

                अस्पताल लोड हो रहे हैं...

              </div>

            ) : displayHospitals.length === 0 ? (

              <div className="hospital-loading">
                <FaHospital />
                कोई अस्पताल उपलब्ध नहीं है।
              </div>

            ) : (

              <div className="hospital-marquee">

                {[
                  ...displayHospitals,
                  ...displayHospitals,
                ].map(
                  (hospital, index) => (

                    <article
                      className="service-hospital-card"
                      key={`${hospital.id}-${index}`}
                    >

                      <div className="service-hospital-image">

                        <img
                          src={
                            hospital.background ||
                            hospital.image ||
                            "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                          }
                          alt={hospital.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />

                        <div className="service-hospital-overlay"></div>

                        <div className="hospital-status">

                          <span></span>उपलब्ध</div>

                      </div>

                      <div className="service-hospital-info">

                        <div className="service-hospital-icon">
                          <FaHospital />
                        </div>

                        <div className="hospital-details">

                          <h4>
                            {hospital.name}
                          </h4>

                          <p>
                            <FaMapMarkerAlt />
                            {hospital.location}
                          </p>

                        </div>

                      </div>

                      {/*
                        IMPORTANT:
                        Hospital card par ab koi
                        clickable button nahi hai.
                      */}

                    </article>

                  )
                )}

              </div>

            )}

          </div>

        </div>
      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-container">

          <div className="about-image">

            {activeHospital?.background || activeHospital?.image ? (
              <img
                src={activeHospital.background || activeHospital.image}
                alt={activeHospital.name || "अस्पताल"}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="about-image-empty">
                <FaHospital />
                <span>अस्पताल की तस्वीर उपलब्ध नहीं</span>
              </div>
            )}

            <div className="image-badge">
              <FaHospital />
              <div>
                <strong>
                  {activeHospital?.name || "अस्पताल की जानकारी उपलब्ध नहीं"}
                </strong>
                <span>
                  {activeHospital?.city || activeHospital?.location || "अस्पताल प्रशासन"}
                </span>
              </div>
            </div>

          </div>

          <div className="about-text">

            <span className="section-label">
              {activeHospital ? "अस्पताल प्रशासन" : "अस्पताल की जानकारी"}
            </span>

            <h3>
              {activeHospital ? activeHospital.name : "अस्पताल की जानकारी"}
              <span>
                {activeHospital
                  ? " लाइव प्रशासन"
                  : " अस्पताल सेटअप की प्रतीक्षा"}
              </span>
            </h3>

            <p>
              {activeHospital
                ? `${activeHospital.name} HMS में अपने लाइव अस्पताल रिकॉर्ड के साथ दर्ज है। इस पेज पर दिखाई गई जानकारी बैकएंड में उपलब्ध अस्पताल प्रशासन डेटा से ली गई है।`
                : "अभी कोई अस्पताल रिकॉर्ड उपलब्ध नहीं है। इस पेज पर वास्तविक प्रशासन डेटा दिखाने के लिए सुपर एडमिन से अस्पताल बनाएँ।"}
            </p>

            <p>
              {activeHospital
                ? `पता: ${activeHospital.address || activeHospital.location || activeHospital.city || "पता उपलब्ध नहीं"}${activeHospital.phone ? ` • फ़ोन: ${activeHospital.phone}` : ""}`
                : "अस्पताल बनने के बाद संपर्क, क्षमता और संचालन की जानकारी यहाँ दिखेगी।"}
            </p>


          </div>

          <div className="why-section">

            <h3>
              {activeHospital
                ? `${activeHospital.name} प्रशासन`
                : "अस्पताल प्रशासन"}
            </h3>

            <div className="feature-grid">

              {hospitalStats.length > 0 && hospitalStats.map(
                (feature, index) => (

                  <div
                    className="feature-item"
                    key={index}
                  >

                    <div className="feature-icon">
                      {feature.icon}
                    </div>

                    <div>

                      <h4>
                        {feature.title}
                      </h4>

                      <p>
                        {feature.text}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

          <div className="impact-card">

            <div className="impact-title">

              <span>हमारा प्रभाव</span>

              <FaHeartbeat />

            </div>

            <div className="impact-grid">

              <div>
                <FaHospital />

                <strong>
                  {displayHospitals.length}
                </strong>

                <span>सक्रिय अस्पताल</span>
              </div>

              <div>
                <FaUserMd />

                <strong>
                  {liveCounts.doctors}
                </strong>

                <span>डॉक्टर</span>
              </div>

              <div>
                <FaUserInjured />

                <strong>
                  {showCount(liveCounts.patients)}
                </strong>

                <span>रोगी</span>
              </div>

              <div>
                <FaCalendarAlt />

                <strong>
                  {showCount(liveCounts.appointments)}
                </strong>

                <span>अपॉइंटमेंट</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =================================================
          DOCTORS MARQUEE
      ================================================= */}

      <section
        className="landing-section doctors-section"
        id="doctors"
      >

        <div className="section-heading-center">

          <span className="section-label">चिकित्सा विशेषज्ञ</span>

          <h3>
            हमारे{" "}<span>डॉक्टर</span>
          </h3>

          <p>
            रोगी देखभाल के प्रति समर्पित अनुभवी स्वास्थ्य पेशेवर।
          </p>

        </div>

        <div className="doctors-marquee-wrapper">

          {doctorLoading ? (

            <div className="doctor-loading">
              <FaUserMd />
              <span>डॉक्टर लोड हो रहे हैं...</span>
            </div>

          ) : doctors.length === 0 ? (

            <div className="doctor-empty">
              <FaUserMd />
              <h4>डॉक्टरों की जानकारी उपलब्ध नहीं</h4>
              <p>वास्तविक डॉक्टरों की जानकारी उपलब्ध होने पर यहाँ दिखेगी।</p>
            </div>

          ) : (

            <div className="doctors-marquee">
              {[...doctors, ...doctors].map((doctor, index) => (
                <article
                  className="doctor-display-card doctor-certificate-card"
                  key={`${doctor.id}-${index}`}
                  style={
                    getDoctorHospitalBg(doctor)
                      ? {
                          "--hospital-bg-image": `url("${getDoctorHospitalBg(doctor)}")`,
                        }
                      : undefined
                  }
                >
                  <div className="doctor-cert-inner">

                    <span className="doctor-cert-badge">चिकित्सक</span>

                    <div className="doctor-display-content">
                      <h4>{doctor.name}</h4>

                      {doctor.specialization && (
                        <span className="doctor-specialization">
                          {doctor.specialization}
                        </span>
                      )}

                      {doctor.qualification && (
                        <div className="doctor-info-row">
                          <FaStethoscope />
                          <span>{doctor.qualification}</span>
                        </div>
                      )}

                      {doctor.experience && (
                        <div className="doctor-info-row">
                          <FaClock />
                          <span>{doctor.experience}</span>
                        </div>
                      )}

                      {doctor.hospital && (
                        <div className="doctor-info-row">
                          <FaHospital />
                          <span>{doctor.hospital}</span>
                        </div>
                      )}

                      {doctor.location && (
                        <div className="doctor-info-row">
                          <FaMapMarkerAlt />
                          <span>{doctor.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="doctor-display-image">
                      <div className="doctor-portrait-ring">
                        {doctor.image ? (
                          <img
                            src={doctorCutouts[doctor.id] || doctor.image}
                            alt={doctor.name || "डॉक्टर"}
                            loading="lazy"
                            className={
                              doctorCutouts[doctor.id]
                                ? "doctor-cutout-ready"
                                : "doctor-original-photo"
                            }
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="doctor-photo-unavailable">
                            <FaUserMd />
                            <span>फ़ोटो उपलब्ध नहीं</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {doctor.available !== null && (
                      <div
                        className="doctor-online"
                        style={doctor.available ? undefined : { opacity: 0.7 }}
                      >
                        <span></span>
                        {doctor.available ? "उपलब्ध" : "अनुपलब्ध"}
                      </div>
                    )}

                  </div>
                </article>
              ))}
            </div>

          )}

        </div>

      </section>

      {/* =================================================
          DEPARTMENTS
      ================================================= */}

      <section
        className="department-section"
        id="departments"
      >

        <div className="section-heading-center">

          <span className="section-label">चिकित्सा विभाग</span>

          <h3>
            स्वास्थ्य{" "}<span>विभाग</span>
          </h3>

          <p>
            संपूर्ण रोगी देखभाल के लिए मिलकर काम करने वाले जुड़े हुए विभाग।
          </p>

        </div>

        <div className="department-grid">

          {activeHospital && Array.isArray(activeDepartments) && activeDepartments.length > 0 ? (
            activeDepartments.map((department, index) => {
              const name =
                typeof department === "string"
                  ? department
                  : department.name ||
                    department.department_name ||
                    department.departmentName ||
                    department.title ||
                    "विभाग";

              const detail =
                typeof department === "string"
                  ? ""
                  : department.description ||
                    department.head ||
                    department.head_name ||
                    "";

              return (
                <div
                  className="department-card"
                  key={department.id ?? `${name}-${index}`}
                >
                  <FaFlask />
                  <div>
                    <strong>{name}</strong>
                    {detail && <span>{detail}</span>}
                  </div>
                </div>
              );
            })
          ) : activeHospital ? (
            <div className="department-card department-summary-card">
              <HospitalLogoOrIcon
                logo={activeHospital.logo}
                name={activeHospital.name}
              />
              <div className="department-summary-text">
                <strong>{activeHospital.name}</strong>
                <span>
                  {statsLoading
                    ? "विभाग लोड हो रहे हैं..."
                    : liveCounts.departments === null
                      ? "इस अस्पताल के लिए विभाग का डेटा अभी उपलब्ध नहीं है।"
                      : `अस्पताल प्रशासन में ${liveCounts.departments} सक्रिय विभाग`}
                </span>
              </div>
            </div>
          ) : (
            <div className="department-card department-summary-card">
              <FaHospital />
              <div>
                <strong>विभाग की जानकारी उपलब्ध नहीं</strong>
                <span>विभाग दिखाने के लिए सुपर एडमिन से अस्पताल बनाएँ और कॉन्फ़िगर करें।</span>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* =================================================
          PATIENT SERVICES
      ================================================= */}

      <section className="patient-direct-section">

        <div className="patient-direct-glow"></div>

        <div className="patient-direct-content">

          <div>

            <span className="section-label">रोगी सेवाएँ</span>

            <h3>
              आपकी हर ज़रूरत,

              <span>एक ही स्थान पर</span>
            </h3>

            <p>
              रोगी पंजीकरण, अपॉइंटमेंट और स्वास्थ्य सेवाएँ सीधे HMS से पाएँ।
            </p>

          </div>

          <div className="patient-direct-actions">

            {patientServices.map(
              (service, index) => (

                <button
                  className="patient-action-card"
                  key={index}
                  type="button"
                  onClick={() =>
                    openPatientService(service.path)
                  }
                >

                  <span className="patient-action-icon">
                    {service.icon}
                  </span>

                  <span className="patient-action-text">

                    <strong>
                      {service.title}
                    </strong>

                    <span>
                      {service.text}
                    </span>

                  </span>

                  <FaArrowRight />

                </button>

              )
            )}

          </div>

        </div>
      </section>

      {/* =================================================
          APPOINTMENT
      ================================================= */}

      <section
        className="appointment-section"
        id="appointments"
      >

        <div className="appointment-box">

          <div className="appointment-icon">
            <FaCalendarAlt />
          </div>

          <div className="appointment-text">

            <span className="section-label">अपॉइंटमेंट</span>

            <h3>अपनी<span>स्वास्थ्य जाँच की बुकिंग करें</span>
            </h3>

            <p>
              HMS के माध्यम से अपना अपॉइंटमेंट तेज़ी और आसानी से बुक करें।
            </p>

          </div>

          <button
            type="button"
            className="appointment-btn"
            onClick={() =>
              openPatientService("/patients")
            }
          >अपॉइंटमेंट बुक करें<FaArrowRight />
          </button>

        </div>
      </section>

      {/* =================================================
          HEALTHCARE SERVICES
      ================================================= */}

      <section className="updates-section">

        <div className="section-heading-center">

          <span className="section-label">स्वास्थ्य सेवाएँ</span>

          <h3>
            ऐसी देखभाल{" "}<span>जो आपके साथ चले</span>
          </h3>

        </div>

        <div className="updates-grid">

          {healthcareServices.map(
            (service, index) => (

              <div
                className="update-card"
                key={index}
              >

                <div className="update-icon">
                  {service.icon}
                </div>

                <div>

                  <h4>
                    {service.title}
                  </h4>

                  <p>
                    {service.text}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      scrollToSection("services")
                    }
                  >देखें<FaArrowRight />
                  </button>

                </div>

              </div>

            )
          )}

        </div>
      </section>

      {/* =================================================
          CTA
      ================================================= */}

      <section className="bottom-cta">

        <div className="cta-ecg">

          <svg viewBox="0 0 1000 150">

            <polyline
              points="0,80 160,80 190,80 215,40 240,120 265,80 400,80 440,80 465,20 490,135 520,80 650,80 680,80 710,35 735,125 760,80 1000,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />

          </svg>

        </div>

        <div className="cta-icon">
          <FaHeartbeat />
        </div>

        <div className="cta-text">

          <h3>आपका स्वास्थ्य, हमारी प्राथमिकता।</h3>

          <p>
            बेहतर स्वास्थ्य सेवा की ओर आज ही पहला कदम बढ़ाएँ।
          </p>

        </div>

        <button
          className="cta-button"
          type="button"
          onClick={() =>
            openPatientService("/patients")
          }
        >शुरू करें<FaArrowRight />
        </button>

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className="main-footer"
        id="contact"
      >

        <div className="footer-container">

          <div className="footer-brand">

            <div className="footer-brand-row">

              {brand.logo ? (
              <img
                className="brand-logo-img"
                src={brand.logo}
                alt="HMS"
                onError={() =>
                  setBrand((previous) => ({ ...previous, logo: "" }))
                }
              />
            ) : (
              <div className="brand-logo">
                <FaPlus />
              </div>
            )}

              <div className="brand-text">

                <h2>
                  HMS
                </h2>

                <span>अस्पताल प्रबंधन प्रणाली</span>

              </div>

            </div>

            <p>
              अस्पतालों, डॉक्टरों और रोगियों के लिए स्मार्ट स्वास्थ्य प्रबंधन।
            </p>

            <div className="footer-phone">

              <FaPhoneAlt />

              <span>24/7 स्वास्थ्य सहायता</span>

            </div>

          </div>

          <div className="footer-links">

            <h4>त्वरित लिंक</h4>

            <button
              type="button"
              onClick={() =>
                scrollToSection("top")
              }
            >होम</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("about")
              }
            >हमारे बारे में</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("services")
              }
            >अस्पताल</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("doctors")
              }
            >डॉक्टर</button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("departments")
              }
            >विभाग</button>

          </div>

          <div className="footer-links">

            <h4>रोगी सेवा</h4>

            <button
              type="button"
              onClick={() =>
                openPatientService("/patients")
              }
            >रोगी</button>

            <button
              type="button"
              onClick={() =>
                openPatientService("/patients/register")
              }
            >रोगी पंजीकरण</button>

            <button
              type="button"
              onClick={() =>
                go("/appointments")
              }
            >अपॉइंटमेंट</button>

            <button
              type="button"
              onClick={() =>
                go("/laboratory")
              }
            >प्रयोगशाला</button>

            <button
              type="button"
              onClick={() =>
                go("/pharmacy")
              }
            >फ़ार्मेसी</button>

          </div>

          <div className="footer-contact">

            <h4>अस्पताल प्रशासन</h4>

            <p>
              <FaHospital />
              {activeHospital?.name || "अस्पताल की जानकारी उपलब्ध नहीं"}
            </p>

            <p>
              <FaMapMarkerAlt />
              {activeHospital?.address || activeHospital?.location || activeHospital?.city || "पता उपलब्ध नहीं"}
            </p>

            <p>
              <FaPhoneAlt />
              {activeHospital?.phone || activeHospital?.email || "संपर्क जानकारी उपलब्ध नहीं"}
            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <span>
            © {new Date().getFullYear()} HMS। सर्वाधिकार सुरक्षित।
          </span>

          <div>

            <button type="button">गोपनीयता नीति</button>

            <button type="button">नियम एवं शर्तें</button>

          </div>

        </div>

      </footer>

      {/* =================================================
          PATIENT SERVICE MODAL
          First select hospital, then continue to patient data/service.
      ================================================= */}
      {patientServiceOpen && (
        <div
          className="patient-service-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePatientService();
            }
          }}
        >
          <div
            className="patient-service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-service-title"
          >
            <button
              type="button"
              className="patient-service-modal-close"
              onClick={closePatientService}
              aria-label="रोगी सेवा बंद करें"
            >
              <FaTimes />
            </button>

            <div className="patient-service-modal-icon">
              <FaUserInjured />
            </div>

            <span className="section-label">रोगी सेवाएँ</span>

            <h3 id="patient-service-title">
              {patientServiceStep === "choose"
                ? selectedPatientHospital?.name || "रोगी का प्रकार चुनें"
                : "अस्पताल चुनें"}
            </h3>

            <p className="patient-service-modal-subtitle">
              कृपया पहले अपना अस्पताल चुनें। चुने हुए अस्पताल के लिए रोगी डेटा और सेवाएँ खुलेंगी।
            </p>

            {patientServiceStep === "choose" ? (
              <div className="patient-type-options">
                <button type="button" className="patient-type-card" onClick={() => choosePatientType("new")}>
                  <FaFileMedical />
                  <span>
                    <strong>नया रोगी</strong>
                    <small>पंजीकरण (निःशुल्क) + अपॉइंटमेंट</small>
                  </span>
                  <FaArrowRight />
                </button>
                <button type="button" className="patient-type-card" onClick={() => choosePatientType("old")}>
                  <FaCalendarAlt />
                  <span>
                    <strong>पुराना रोगी</strong>
                    <small>पंजीकरण संख्या से अपॉइंटमेंट</small>
                  </span>
                  <FaArrowRight />
                </button>
                <button type="button" className="patient-type-back" onClick={() => setPatientServiceStep("hospital")}>← अस्पताल बदलें</button>
              </div>
            ) : (
              <>
            <div className="patient-hospital-dropdown-wrap">
              <label htmlFor="patient-hospital-select">
                अस्पताल चुनें <span>*</span>
              </label>

              <PatientSelect
                id="patient-hospital-select"
                value={selectedPatientHospital?.id ?? ""}
                onChange={(value) => {
                  const hospital = displayHospitals.find(
                    (item) => String(item.id) === String(value)
                  );
                  setSelectedPatientHospital(hospital || null);
                }}
                disabled={
                  hospitalLoading || displayHospitals.length === 0
                }
                placeholder={
                  hospitalLoading
                    ? "अस्पताल लोड हो रहे हैं..."
                    : displayHospitals.length === 0
                      ? "कोई अस्पताल उपलब्ध नहीं"
                      : "अस्पताल चुनें"
                }
                icon={<FaHospital />}
                options={displayHospitals.map((hospital) => ({
                  value: hospital.id,
                  label: hospital.name,
                  sub:
                    hospital.location &&
                    hospital.location !== "स्थान उपलब्ध नहीं"
                      ? hospital.location
                      : "",
                }))}
              />

              {!selectedPatientHospital && !hospitalLoading && (
                <small className="patient-hospital-required">आगे बढ़ने के लिए कृपया अस्पताल चुनें।</small>
              )}
            </div>

            {selectedPatientHospital && (
              <div className="patient-selected-summary">
                <FaHospital />
                <div>
                  <small>चयनित अस्पताल</small>
                  <strong>{selectedPatientHospital.name}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="patient-service-continue"
              disabled={!selectedPatientHospital}
              onClick={continuePatientService}
            >
              <FaHeartbeat />
              {patientServicePath === "/patients"
                ? "रोगी सेवा खोलें"
                : "आगे बढ़ें"}
              <FaArrowRight />
            </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default MainPage;