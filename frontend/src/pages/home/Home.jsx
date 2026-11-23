import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { installRefreshOnBack } from "./Refreshonback";
import "./Home.css";
import "./otp-card-theme.css";
import ChangePasswordCard from "./ChangePasswordCard";
import ForgotPasswordCard from "./ForgotPasswordCard";
import SuccessPopup from "./SuccessPopup";
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

/* =========================================================
   API CONFIG
========================================================= */

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OTP_DEFAULT_SECONDS = 5 * 60;

/* =========================================================
   FALLBACK SYSTEM ROLES
========================================================= */

const DEFAULT_ROLES = [
  { id: "super", name: "सुपर एडमिन", is_super: true },
  { id: "admin", name: "Admin" },
  { id: "staff", name: "Staff" },
  { id: "doctor", name: "Doctor" },
  { id: "nurse", name: "Nurse" },
];

/* =========================================================
   HELPERS
========================================================= */

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";

  for (let i = 0; i < 6; i += 1) {
    value += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return value;
}

function resolveAssetUrl(value) {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("/uploads/")) return value;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const origin = API_BASE.replace(/\/api\/?$/, "");

  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
}

function getArrayFromResponse(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.access_token ||
    data?.jwt ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.jwt ||
    data?.result?.token ||
    data?.result?.accessToken ||
    ""
  );
}

function extractUser(data) {
  return (
    data?.user ||
    data?.data?.user ||
    data?.result?.user ||
    data?.data ||
    data?.user_data ||
    null
  );
}

function getErrorMessage(data, fallback) {
  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.errors?.message ||
    fallback
  );
}

function getOtpExpiry(data) {
  const absoluteExpiry =
    data?.expires_at ||
    data?.expiresAt ||
    data?.otp_expires_at ||
    data?.otpExpiresAt ||
    data?.data?.expires_at ||
    data?.data?.expiresAt;

  if (absoluteExpiry) {
    const timestamp = new Date(absoluteExpiry).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const seconds =
    Number(
      data?.expires_in ??
        data?.expiresIn ??
        data?.otp_expires_in ??
        data?.otpExpiresIn ??
        data?.data?.expires_in ??
        data?.data?.expiresIn
    ) || OTP_DEFAULT_SECONDS;

  return Date.now() + Math.max(30, seconds) * 1000;
}

function formatOtpTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

/* Login ke baad role ke hisaab se page */
function getPostLoginPath(user) {
  const r = String(
    user?.role ?? user?.role_name ?? user?.roleName ?? user?.role_id ?? ""
  ).toLowerCase();
  if (
    user?.is_super ||
    user?.is_super_admin ||
    r === "super" ||
    r === "super_admin" ||
    r === "superadmin" ||
    r === "super admin"
  ) {
    return "/super-admin";
  }
  return "/dashboard";
}

/* Backend DB me super role "super_admin" hota hai */
function toBackendRole(roleId) {
  const r = String(roleId).toLowerCase();
  if (r === "super") return "super_admin";
  if (r === "admin") return "hospital_admin";
  return roleId;
}

/* Backend user me role na aaye to login form me chuna hua role jod do,
   taaki Dashboard sahi (hospital admin / super admin) view khole */
function ensureUserRole(user, fallbackRole) {
  if (!user || typeof user !== "object") return user;

  const hasRole =
    user.role ?? user.role_name ?? user.roleName ?? user.is_super;

  if (hasRole) return user;

  return { ...user, role: toBackendRole(fallbackRole) };
}

function saveAuthentication(token, user) {
  if (token) {
    localStorage.setItem("hms_token", token);
  }

  if (user) {
    localStorage.setItem(
      "hms_user",
      JSON.stringify(user)
    );
  }

  window.dispatchEvent(
    new Event("hmsAuthUpdated")
  );
}

/* =========================================================
   SEARCH SELECT (Role / Hospital dropdown - hamesha neeche khulta hai)
========================================================= */

function SearchSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  icon = null,
  disabled = false,
  searchPlaceholder = "Search",
  emptyText = "No results found",
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
      String(item.label).toLowerCase().includes(q)
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
      className={open ? "ss ss-open" : "ss"}
    >
      <button
        ref={controlRef}
        id={id}
        type="button"
        className="field-box ss-control"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleControlKeyDown}
      >
        {icon && <span className="field-icon">{icon}</span>}

        <span
          className={
            selected
              ? "ss-value"
              : "ss-value ss-placeholder"
          }
        >
          {selected ? selected.label : placeholder}
        </span>

        <span className="ss-arrow" aria-hidden="true" />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="ss-menu"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
          }}
        >
          <div className="ss-search">
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
            className="ss-list"
            role="listbox"
            style={{ maxHeight: pos.maxList }}
          >
            {filtered.length === 0 && (
              <li className="ss-empty">{emptyText}</li>
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
                    "ss-option" +
                    (isActive ? " active" : "") +
                    (isSelected ? " selected" : "")
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  {item.label}
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

/* =========================================================
   HOME COMPONENT
========================================================= */

function Home() {
  const navigate = useNavigate();

  /* Back/Forward par refresh sirf is (login) page par */
  useEffect(() => {
    return installRefreshOnBack();
  }, []);

  /* =======================================================
     ROLES
  ======================================================= */

  const [roles, setRoles] = useState(DEFAULT_ROLES);

  /* =======================================================
     BRANDING (Super Admin > Settings se real logo / background)
  ======================================================= */

  const [brand, setBrand] = useState({ logo: "", background: "" });

  /* =======================================================
     HOSPITALS
  ======================================================= */

  const [hospitals, setHospitals] = useState([]);

  const [hospitalLoading, setHospitalLoading] =
    useState(true);

  const [hospitalError, setHospitalError] =
    useState("");

  /* =======================================================
     LOGIN
  ======================================================= */

  const [role, setRole] = useState("super");

  const [hospital, setHospital] =
    useState("");

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("hms_remember_email") || "";
    } catch {
      return "";
    }
  });

  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem("hms_remember_email") !== null;
    } catch {
      return false;
    }
  });

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [captchaCode, setCaptchaCode] =
    useState(generateCaptcha());

  const [captchaInput, setCaptchaInput] =
    useState("");

  const [loginMessage, setLoginMessage] =
    useState("");

  const [authLoading, setAuthLoading] =
    useState(false);

  /* =======================================================
     LOGIN SUCCESS POPUP
  ======================================================= */

  const [successPath, setSuccessPath] = useState("");
  const redirectTimerRef = useRef(null);

  /* Temporary password se login hua? Pehle naya password set karwao.
     (backend: user.must_change_password === true) */
  const [forcePasswordUser, setForcePasswordUser] = useState(null);

  /* Forgot / Reset password popup.
     null | "request" (email daalo) | "reset" (email ke link se aaya token) */
  const [forgotMode, setForgotMode] = useState(null);
  const [resetToken, setResetToken] = useState("");

  /* OTP bhejne ke baad success popup */
  const [otpSentPopup, setOtpSentPopup] = useState(false);

  /* Email ke link se aaye: /home?token=XXXX  -> reset popup khol do */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl =
        params.get("token") || params.get("reset_token") || "";

      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setForgotMode("reset");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const closeForgot = () => {
    setForgotMode(null);
    setResetToken("");

    try {
      if (window.location.search) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch {
      /* ignore */
    }
  };

  const goToNextPage = (path) => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    navigate(path, { replace: true });
  };

  const showLoginSuccess = (user) => {
    if (
      user?.must_change_password === true ||
      Number(user?.must_change_password) === 1
    ) {
      setForcePasswordUser(user);
      return;
    }

    const path = getPostLoginPath(user);

    setSuccessPath(path);

    redirectTimerRef.current = window.setTimeout(
      () => goToNextPage(path),
      2000
    );
  };

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    },
    []
  );

  /* =======================================================
     PAGE STEP
  ======================================================= */

  const [step, setStep] = useState(1);

  const [showLoginCard, setShowLoginCard] =
    useState(false);

  /* =======================================================
     OTP
  ======================================================= */

  const [showOtpCard, setShowOtpCard] =
    useState(false);

  const [matchedUser, setMatchedUser] =
    useState(null);

  const [otpMethod, setOtpMethod] =
    useState("email");

  const [otpInput, setOtpInput] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [otpMessage, setOtpMessage] =
    useState("");

  const [otpExpiresAt, setOtpExpiresAt] =
    useState(0);

  const [otpSecondsLeft, setOtpSecondsLeft] =
    useState(0);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const isSuperRole = useMemo(() => {
    const selected = roles.find(
      (item) =>
        String(item.id).toLowerCase() ===
        String(role).toLowerCase()
    );

    return (
      String(role).toLowerCase() === "super" ||
      Boolean(selected?.is_super) ||
      /super/i.test(selected?.name || "")
    );
  }, [role, roles]);

  const hospitalOptions = useMemo(() => {
    return hospitals
      .filter(Boolean)
      .map((item, index) => ({
        ...item,

        id: String(
          item.id ??
            item._id ??
            item.hospital_id ??
            item.hospitalId ??
            `hospital-${index}`
        ),

        name:
          item.name ||
          item.hospital_name ||
          item.hospitalName ||
          item.title ||
          "Hospital",
      }));
  }, [hospitals]);

  const selectedHospital = useMemo(() => {
    return hospitalOptions.find(
      (item) => item.id === String(hospital)
    );
  }, [hospitalOptions, hospital]);

  const selectedHospitalName =
    selectedHospital?.name ||
    (isSuperRole
      ? "सभी अस्पताल"
      : "अस्पताल प्रबंधन प्रणाली");

  const selectedRole = useMemo(() => {
    return roles.find(
      (item) =>
        String(item.id).toLowerCase() ===
        String(role).toLowerCase()
    );
  }, [roles, role]);

  const otpDestination =
    otpMethod === "email"
      ? matchedUser?.email ||
        email ||
        "पंजीकृत ईमेल"
      : matchedUser?.mobile ||
        matchedUser?.phone ||
        matchedUser?.mobile_number ||
        "पंजीकृत मोबाइल";

  /* Login card logo: hospital select ho to uska logo, warna Super Admin ka */
  const loginLogo =
    selectedHospital?.logo ||
    brand.logo ||
    "/hms-logo.png";

  /* Watermark (bada logo background) */
  const watermarkLogo =
    selectedHospital?.logo ||
    brand.logo ||
    "/hms-logo.png";

  /* Page background: hospital ka background, warna Super Admin ka default */
  const pageBackground =
    selectedHospital?.background ||
    selectedHospital?.image ||
    brand.background ||
    "";

  /* =======================================================
     LOAD HOSPITALS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadHospitals() {
      setHospitalLoading(true);
      setHospitalError("");

      const endpoints = [
        `${API_BASE}/hospitals`,
        `${API_BASE}/hospital`,
      ];

      try {
        let payload = null;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            });

            const data =
              await response
                .json()
                .catch(() => null);

            if (
              response.ok &&
              data?.success !== false
            ) {
              payload = data;
              break;
            }
          } catch (error) {
            console.warn(
              "Hospital endpoint failed:",
              endpoint,
              error
            );
          }
        }

        if (!payload) {
          throw new Error(
            "अस्पताल सर्वर उपलब्ध नहीं है।"
          );
        }

        const list = getArrayFromResponse(
          payload,
          [
            "hospitals",
            "data",
            "results",
            "items",
          ]
        );

        const normalized = list
          .filter((item) => {
            if (!item) return false;

            const status = String(
              item.status || ""
            ).toLowerCase();

            if (
              item.is_active === false ||
              item.active === false ||
              status === "inactive" ||
              status === "disabled"
            ) {
              return false;
            }

            return true;
          })
          .map((item, index) => ({
            ...item,

            id:
              item.id ??
              item._id ??
              item.hospital_id ??
              item.hospitalId ??
              `hospital-${index}`,

            name:
              item.name ||
              item.hospital_name ||
              item.hospitalName ||
              item.title ||
              "Hospital",

            image: resolveAssetUrl(
              item.image ||
                item.image_url ||
                item.imageUrl ||
                item.hospital_image ||
                item.photo ||
                item.logo
            ),

            logo: resolveAssetUrl(
              item.logo_url ||
                item.logoUrl ||
                item.hospital_logo ||
                item.logo ||
                ""
            ),

            background: resolveAssetUrl(
              item.login_background_image ||
                item.loginBackgroundImage ||
                item.background_image ||
                item.backgroundImage ||
                item.cover_image ||
                item.coverImage ||
                item.banner ||
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

          setHospitalError(
            error.message ||
              "अस्पतालों की जानकारी लोड नहीं हो सकी।"
          );
        }
      } finally {
        if (mounted) {
          setHospitalLoading(false);
        }
      }
    }

    loadHospitals();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     PUBLIC BRANDING API
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadBranding() {
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
          const settings =
            payload?.settings ?? payload?.data ?? payload;

          if (!settings || typeof settings !== "object") continue;

          const logo = resolveAssetUrl(
            settings.superAdminLogo ??
              settings.super_admin_logo ??
              settings.adminLogo ??
              settings.logo ??
              ""
          );

          const background = resolveAssetUrl(
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
    }

    loadBranding();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     OPTIONAL ROLE API
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadRoles() {
      try {
        const endpoints = [
          `${API_BASE}/auth/roles`,
          `${API_BASE}/roles`,
          `${API_BASE}/public/roles`,
        ];

        let data = null;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            });

            if (!response.ok) {
              continue;
            }

            const payload = await response
              .json()
              .catch(() => null);

            if (
              payload &&
              payload.success !== false &&
              getArrayFromResponse(payload, [
                "roles",
                "data",
                "results",
                "items",
              ]).length
            ) {
              data = payload;
              break;
            }
          } catch (error) {
            console.warn(
              "Role endpoint failed:",
              endpoint
            );
          }
        }

        if (!data) {
          return;
        }

        const list = getArrayFromResponse(
          data,
          [
            "roles",
            "data",
            "results",
            "items",
          ]
        );

        const normalized = list
          .map((item) => {
            if (typeof item === "string") {
              return {
                id: item.toLowerCase(),
                name: item,
              };
            }

            const rawId = String(
              item?.id ??
                item?.slug ??
                item?.role ??
                ""
            ).toLowerCase();

            const rawName = String(
              item?.name ??
                item?.label ??
                item?.role ??
                ""
            );

            return {
              id: rawId,

              name:
                rawId === "super" ||
                /super/i.test(rawName)
                  ? "सुपर एडमिन"
                  : rawName,

              is_super:
                item?.is_super ??
                item?.isSuper ??
                rawId === "super",
            };
          })
          .filter(
            (item) =>
              item.id &&
              item.name
          );

        if (
          mounted &&
          normalized.length
        ) {
          setRoles(normalized);
        }
      } catch (error) {
        console.warn(
          "Role endpoint unavailable:",
          error
        );
      }
    }

    loadRoles();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     LIVE OTP COUNTDOWN
  ======================================================= */

  useEffect(() => {
    if (!otpExpiresAt) {
      setOtpSecondsLeft(0);
      return undefined;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (otpExpiresAt - Date.now()) /
            1000
        )
      );

      setOtpSecondsLeft(remaining);

      if (remaining <= 0) {
        setOtpExpiresAt(0);
        setOtpSent(false);

        setOtpMessage(
          "ओटीपी की समय-सीमा समाप्त हो गई। नया ओटीपी भेजें।"
        );
      }
    };

    update();

    const timer =
      window.setInterval(
        update,
        1000
      );

    return () =>
      window.clearInterval(timer);
  }, [otpExpiresAt]);

  /* =======================================================
     CAPTCHA
  ======================================================= */

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  /* =======================================================
     OPEN LOGIN
  ======================================================= */

  const openLogin = () => {
    setRole("super");
    setHospital("");

    setStep(2);

    setShowLoginCard(true);
    setShowOtpCard(false);

    setLoginMessage("");
    setOtpMessage("");
    setOtpInput("");
    setOtpSent(false);
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);

    refreshCaptcha();
  };

  /* =======================================================
     CLOSE LOGIN
  ======================================================= */

  const closeLoginCard = () => {
    setShowLoginCard(false);
    setShowOtpCard(false);

    // Always reset Home to the default Super Admin state.
    setRole("super");
    setHospital("");

    setStep(1);

    setLoginMessage("");
    setOtpMessage("");
    setOtpInput("");
    setOtpSent(false);
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);
  };

  /* =======================================================
     HOME / BACK
  ======================================================= */

  const goToHome = () => {
    setShowLoginCard(false);
    setShowOtpCard(false);

    // Always reset Home to the default Super Admin state.
    setRole("super");
    setHospital("");

    setStep(1);

    setLoginMessage("");
    setOtpMessage("");
    setOtpInput("");
    setOtpSent(false);
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);

    // Back arrow: poora page refresh ke saath MainPage par jao
    window.location.assign("/");
  };

  /* =======================================================
     ROLE CHANGE
  ======================================================= */

  const handleRoleChange = (value) => {

    setRole(value);
    setLoginMessage("");

    if (
      value === "super" ||
      /super/i.test(value)
    ) {
      setHospital("");
    }
  };

  /* =======================================================
     LOGIN API
  ======================================================= */

  const loginRequest = async () => {
    const response = await fetch(
      `${API_BASE}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body: JSON.stringify({
          role: toBackendRole(role),

          role_id:
            selectedRole?.id ??
            null,

          hospital_id:
            isSuperRole
              ? null
              : hospital,

          hospitalId:
            isSuperRole
              ? null
              : hospital,

          email: email.trim(),

          password,
        }),
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (
      !response.ok ||
      data?.success === false
    ) {
      throw new Error(
        getErrorMessage(
          data,
          "लॉगिन असफल। कृपया अपनी जानकारी जाँचें।"
        )
      );
    }

    return data;
  };

  /* =======================================================
     SEND OTP API
  ======================================================= */

  const sendOtp = async () => {
    if (!matchedUser && !email.trim()) {
      setOtpMessage(
        "उपयोगकर्ता की जानकारी उपलब्ध नहीं है।"
      );

      return;
    }

    setAuthLoading(true);
    setOtpMessage("");

    try {
      const response =
        await fetch(
          `${API_BASE}/auth/send-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              user_id:
                matchedUser?.id ??
                matchedUser?.user?.id ??
                null,

              email:
                matchedUser?.email ||
                email.trim(),

              mobile:
                matchedUser?.mobile ||
                matchedUser?.phone ||
                matchedUser?.mobile_number ||
                "",

              method: otpMethod,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        data?.success === false
      ) {
        throw new Error(
          getErrorMessage(
            data,
            "ओटीपी भेजने में समस्या हुई।"
          )
        );
      }

      const expiry =
        getOtpExpiry(data);

      setOtpSent(true);
      setOtpExpiresAt(expiry);

      setOtpSecondsLeft(
        Math.max(
          0,
          Math.ceil(
            (expiry -
              Date.now()) /
              1000
          )
        )
      );

      setOtpInput("");

      setOtpMessage(
        data?.message ||
          "ओटीपी सफलतापूर्वक भेज दिया गया।"
      );

      setOtpSentPopup(true);
    } catch (error) {
      console.error(
        "OTP send error:",
        error
      );

      setOtpMessage(
        error.message ||
          "ओटीपी सेवा उपलब्ध नहीं है।"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  /* =======================================================
     OTP METHOD
  ======================================================= */

  const changeOtpMethod = (method) => {
    if (method === otpMethod) return;

    // Purana OTP naye method ke liye valid nahi hai, isliye sab reset karein
    setOtpMethod(method);
    setOtpMessage("");
    setOtpInput("");
    setOtpSent(false);
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);
  };

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!otpInput.trim()) {
      setOtpMessage(
        "Please enter OTP."
      );

      return;
    }

    if (
      otpExpiresAt &&
      Date.now() >= otpExpiresAt
    ) {
      setOtpMessage(
        "ओटीपी की समय-सीमा समाप्त हो गई। नया ओटीपी भेजें।"
      );

      setOtpExpiresAt(0);
      setOtpSent(false);

      return;
    }

    setAuthLoading(true);
    setOtpMessage("");

    try {
      const response =
        await fetch(
          `${API_BASE}/auth/verify-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              user_id:
                matchedUser?.id ??
                matchedUser?.user?.id ??
                null,

              email:
                matchedUser?.email ||
                email.trim(),

              mobile:
                matchedUser?.mobile ||
                matchedUser?.phone ||
                matchedUser?.mobile_number ||
                "",

              otp: otpInput.trim(),

              method: otpMethod,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        data?.success === false
      ) {
        throw new Error(
          getErrorMessage(
            data,
            "Invalid OTP."
          )
        );
      }

      const token =
        extractToken(data);

      const user = ensureUserRole(
        extractUser(data) || matchedUser,
        role
      );

      if (!token) {
        throw new Error(
          "OTP verified, but authentication token was not returned by the backend."
        );
      }

      saveAuthentication(
        token,
        user
      );

      setOtpMessage(
        data?.message ||
          "OTP verified successfully."
      );

      showLoginSuccess(user);
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setOtpMessage(
        error.message ||
          "OTP verification failed."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  /* =======================================================
     LOGIN SUBMIT
  ======================================================= */

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginMessage("");

    if (!role) {
      setLoginMessage(
        "Please select Role."
      );

      return;
    }

    if (
      !isSuperRole &&
      !hospital
    ) {
      setLoginMessage(
        "Please select Hospital."
      );

      return;
    }

    if (!email.trim()) {
      setLoginMessage(
        "Please enter Email."
      );

      return;
    }

    if (!password.trim()) {
      setLoginMessage(
        "Please enter Password."
      );

      return;
    }

    if (!captchaInput.trim()) {
      setLoginMessage(
        "Please enter CAPTCHA."
      );

      return;
    }

    if (
      captchaInput
        .trim()
        .toUpperCase() !==
      captchaCode.toUpperCase()
    ) {
      setLoginMessage(
        "Invalid CAPTCHA. Please try again."
      );

      refreshCaptcha();

      return;
    }

    setAuthLoading(true);

    try {
      const data =
        await loginRequest();

      try {
        if (rememberMe) {
          localStorage.setItem(
            "hms_remember_email",
            email.trim()
          );
        } else {
          localStorage.removeItem("hms_remember_email");
        }
      } catch {
        /* ignore */
      }

      const token =
        extractToken(data);

      const user = ensureUserRole(
        extractUser(data),
        role
      );

      const requiresOtp = Boolean(
        data?.requires_otp ??
          data?.otp_required ??
          data?.otpRequired ??
          data?.data?.requires_otp ??
          data?.data?.otp_required
      );

      if (
        token &&
        !requiresOtp
      ) {
        saveAuthentication(
          token,
          user
        );

        showLoginSuccess(user);

        return;
      }

      setMatchedUser(
        user || {
          email: email.trim(),
          mobile: "",
        }
      );

      setShowOtpCard(true);

      setOtpSent(false);
      setOtpInput("");

      setOtpMessage(
        data?.message ||
          "Credentials verified. Please send OTP."
      );

      setOtpMethod("email");

      setOtpExpiresAt(0);
      setOtpSecondsLeft(0);
    } catch (error) {
      console.error(
        "Login API error:",
        error
      );

      setLoginMessage(
        error.message ||
          "Login failed."
      );

      refreshCaptcha();
    } finally {
      setAuthLoading(false);
    }
  };

  /* =======================================================
     BACK TO LOGIN
  ======================================================= */

  const backToLogin = () => {
    setShowOtpCard(false);

    setOtpSent(false);
    setOtpInput("");
    setOtpMessage("");
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);

    setLoginMessage("");

    refreshCaptcha();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="home-page"
      style={
        pageBackground
          ? {
              backgroundImage: `linear-gradient(rgba(0, 10, 7, 0.6), rgba(0, 10, 7, 0.78)), url("${pageBackground}")`,
              backgroundSize: "100% 100%, contain",
              backgroundPosition: "center, center",
              backgroundRepeat: "no-repeat, no-repeat",
              backgroundAttachment: "fixed, fixed",
            }
          : undefined
      }
    >

      {/* BACKGROUND */}

      <div
        className="hms-watermark"
        aria-hidden="true"
        style={{ backgroundImage: `url("${watermarkLogo}")` }}
      />

      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />

      <div className="medical-cross medical-cross-one">
        +
      </div>

      <div className="medical-cross medical-cross-two">
        +
      </div>

      <div className="heartbeat-line">
        <span />
      </div>

      {/* LOGIN SUCCESS POPUP (shared component) */}

      {successPath && (
        <div
          className="hms-success-backdrop login-success-only-title"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hms-success-title"
        >
          <div className="hms-success-popup">
            <div className="hms-success-check">
              <svg
                viewBox="0 0 52 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 27l9 9 17-20" />
              </svg>
            </div>

            <h3 id="hms-success-title">Login Successful</h3>
          </div>
        </div>
      )}

      {/* FORCED PASSWORD CHANGE (temporary password se login) */}

      {forcePasswordUser && (
        <ChangePasswordCard
          forced
          onSuccess={() => {
            const updatedUser = {
              ...forcePasswordUser,
              must_change_password: false,
            };

            setForcePasswordUser(null);
            showLoginSuccess(updatedUser);
          }}
          onCancel={() => {
            setForcePasswordUser(null);
            window.location.reload();
          }}
        />
      )}

      {/* FORGOT / RESET PASSWORD POPUP */}

      {forgotMode && (
        <ForgotPasswordCard
          mode={forgotMode}
          token={resetToken}
          defaultEmail={email}
          onClose={closeForgot}
          onDone={closeForgot}
        />
      )}

      {/* OTP SENT POPUP */}

      {otpSentPopup && (
        <SuccessPopup
          title="ओटीपी भेज दिया गया"
          message={`ओटीपी ${otpDestination} पर भेजा गया`}
          buttonText=""
          autoCloseMs={1800}
          onClose={() => setOtpSentPopup(false)}
        />
      )}

      {/* NAVIGATION */}

      <div className="home-navigation-layer">
        <button
          type="button"
          className="main-page-arrow-button"
          onClick={goToHome}
          aria-label="मुख्य पृष्ठ पर जाएँ"
        >
          ←
        </button>
      </div>

      {/* HEADER */}

      <header className="home-header">
        <div className="heading-row">
          <span className="heading-line" />

          <h2>
            प्रशासनिक नियंत्रण पैनल
          </h2>

          <span className="heading-line" />
        </div>
      </header>

      {/* CONTENT */}

      <section className="home-content">

        {/* HOSPITAL HEADING */}

        {!isSuperRole && (
          <>
            <h1 className="hospital-name">
              {hospitalLoading
                ? "अस्पताल लोड हो रहा है..."
                : selectedHospitalName}
            </h1>

            {hospitalError && (
              <div className="hospital-api-warning">
                {hospitalError}
              </div>
            )}
          </>
        )}

        {/* HMS LOGIN BUTTON */}

        {step === 1 && (
          <div className="step-one-content">

            <button
              type="button"
              className="step-one-button"
              onClick={openLogin}
            >
              <span>
                एचएमएस लॉगिन
              </span>

              <span className="button-arrow">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="7.5" r="4.2" />
                  <path d="M3.5 21c0-4.6 3.8-8 8.5-8s8.5 3.4 8.5 8c0 .6-.4 1-1 1H4.5c-.6 0-1-.4-1-1z" />
                </svg>
              </span>
            </button>

          </div>
        )}

        {/* LOGIN STEP */}

        {step === 2 && (
          <div className="step-two-content">

            {/* LOGIN CARD */}

            {showLoginCard &&
              !showOtpCard && (
                <div className="admin-card-overlay login-card-overlay-enter">

                  <div className="admin-card login-plaque-card login-card-enter">

                    {/* TOP ROW: logo + hospital name + close */}

                    <div className="plaque-top">

                      <div className="admin-logo-circle">
                      <img
                        src={loginLogo}
                        alt="HMS Logo"
                        onError={(event) => {
                          if (
                            loginLogo !== "/hms-logo.png" &&
                            !event.currentTarget.src.endsWith(
                              "/hms-logo.png"
                            )
                          ) {
                            event.currentTarget.src = "/hms-logo.png";
                            return;
                          }

                          event.currentTarget.style.display =
                            "none";

                          event.currentTarget.parentElement.classList.add(
                            "logo-fallback"
                          );
                        }}
                      />

                      <span className="logo-fallback-text">
                        HMS
                      </span>
                    </div>

                      <button
                        type="button"
                        className="card-close-button login-close-top"
                        onClick={closeLoginCard}
                        aria-label="लॉगिन विंडो बंद करें"
                        title="बंद करें"
                      >
                        ×
                      </button>

                    </div>

                    <div className="admin-card-title">

                      <span className="title-small">
                        {!isSuperRole && selectedHospital
                          ? selectedHospital.name
                          : "HMS"}
                      </span>

                      <h3>
                        एडमिन एवं स्टाफ लॉगिन
                      </h3>

                      <span className="title-line" />

                    </div>

                    <form
                      className="login-form"
                      onSubmit={handleLogin}
                    >

                      {/* ROLE */}

                      <div className="field-group">

                        <label htmlFor="role">
                          Role
                        </label>

                        <SearchSelect
                          id="role"
                          value={role}
                          onChange={handleRoleChange}
                          placeholder="भूमिका चुनें"
                          searchPlaceholder="भूमिका खोजें"
                          emptyText="कोई भूमिका नहीं मिली"
                          icon={
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          }
                          options={roles.map((item) => ({
                            value: item.id,
                            label: item.name,
                          }))}
                        />

                      </div>

                      {/* HOSPITAL */}

                      {!isSuperRole && (
                        <div className="field-group">

                          <label htmlFor="hospital">
                            Hospital
                          </label>

                          <SearchSelect
                            id="hospital"
                            value={hospital}
                            onChange={(value) => {
                              setHospital(value);
                              setLoginMessage("");
                            }}
                            disabled={
                              hospitalLoading ||
                              Boolean(hospitalError)
                            }
                            placeholder={
                              hospitalLoading
                                ? "Loading hospitals..."
                                : "Select Hospital"
                            }
                            searchPlaceholder="अस्पताल खोजें"
                            emptyText="कोई अस्पताल नहीं मिला"
                            icon={
                              <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            ><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M12 8v6M9 11h6" /><path d="M10 21v-3h4v3" /></svg>
                            }
                            options={hospitalOptions.map((item) => ({
                              value: item.id,
                              label: item.name,
                            }))}
                          />

                        </div>
                      )}

                      {/* EMAIL */}

                      <div className="field-group">

                        <label htmlFor="email">
                          Email
                        </label>

                        <div className="field-box">

                          <span className="field-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            ><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                          </span>

                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(
                                event.target.value
                              );

                              setLoginMessage(
                                ""
                              );
                            }}
                            placeholder="ईमेल दर्ज करें"
                            autoComplete="email"
                          />

                        </div>

                      </div>

                      {/* PASSWORD */}

                      <div className="field-group">

                        <label htmlFor="password">
                          Password
                        </label>

                        <div className="field-box">

                          <span className="field-icon">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            ><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                          </span>

                          <input
                            id="password"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            value={password}
                            onChange={(event) => {
                              setPassword(
                                event.target.value
                              );

                              setLoginMessage(
                                ""
                              );
                            }}
                            placeholder="पासवर्ड दर्ज करें"
                            autoComplete="current-password"
                          />

                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowPassword(
                                (value) =>
                                  !value
                              )
                            }
                            aria-label={
                              showPassword
                                ? "पासवर्ड छिपाएँ"
                                : "पासवर्ड दिखाएँ"
                            }
                          >
                            {showPassword ? (
                              <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.77 19.77 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a19.8 19.8 0 0 1-3.17 4.19" />
                                <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>

                        </div>

                      </div>

                      {/* CAPTCHA */}

                      <div className="field-group">

                        <label htmlFor="captcha">
                          CAPTCHA
                        </label>

                        <div className="captcha-row">

                          <div
                            className="captcha-code"
                            role="img"
                            aria-label={`CAPTCHA code ${captchaCode
                              .split("")
                              .join(" ")}`}
                          >
                            {captchaCode
                              .split("")
                              .map((char, index) => (
                                <span
                                  key={`${index}-${char}`}
                                  aria-hidden="true"
                                >
                                  {char}
                                </span>
                              ))}
                          </div>

                          <button
                            type="button"
                            className="captcha-refresh-button"
                            onClick={
                              refreshCaptcha
                            }
                            title="कैप्चा बदलें"
                            aria-label="कैप्चा बदलें"
                          >
                            ↻
                          </button>

                          <div className="captcha-input-box">

                            <input
                              id="captcha"
                              type="text"
                              value={
                                captchaInput
                              }
                              onChange={(event) => {
                                setCaptchaInput(
                                  event.target.value.toUpperCase()
                                );

                                setLoginMessage(
                                  ""
                                );
                              }}
                              placeholder="कैप्चा दर्ज करें"
                              maxLength={6}
                              autoComplete="off"
                            />

                          </div>

                        </div>

                      </div>

                      <div className="remember-row">
                        <label className="remember-check">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) =>
                              setRememberMe(
                                event.target.checked
                              )
                            }
                          />

                          <span>मुझे याद रखें</span>
                        </label>

                        <button
                          type="button"
                          className="forgot-link"
                          onClick={() => {
                            setLoginMessage("");
                            setForgotMode("request");
                          }}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      {loginMessage && (
                        <div className="login-message">
                          {loginMessage}
                        </div>
                      )}

                      <div className="login-actions">
                        <button
                        type="submit"
                        className="login-submit-button"
                        disabled={authLoading}
                      >
                        <span>
                          {authLoading
                            ? "कृपया प्रतीक्षा करें..."
                            : "लॉगिन करें"}
                        </span>

                        <span className="submit-arrow">
                          <svg
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="7.5" r="4.2" />
                            <path d="M3.5 21c0-4.6 3.8-8 8.5-8s8.5 3.4 8.5 8c0 .6-.4 1-1 1H4.5c-.6 0-1-.4-1-1z" />
                          </svg>
                        </span>
                      </button>
                      </div>

                    </form>

                    {/* FOOTER */}

                    <div className="plaque-footer">
                      सुरक्षित • केवल अधिकृत कर्मचारी
                    </div>

                  </div>

                </div>
              )}

            {/* OTP CARD */}

            {showLoginCard &&
              showOtpCard &&
              !successPath && (
                <div className="admin-card-overlay otp-card-overlay-enter">

                  <div className="admin-card otp-card otp-card-enter">

                    <div className="admin-logo-circle">

                      <img
                        src={loginLogo}
                        alt="HMS Logo"
                        onError={(event) => {
                          if (
                            loginLogo !== "/hms-logo.png" &&
                            !event.currentTarget.src.endsWith(
                              "/hms-logo.png"
                            )
                          ) {
                            event.currentTarget.src = "/hms-logo.png";
                            return;
                          }

                          event.currentTarget.style.display =
                            "none";

                          event.currentTarget.parentElement.classList.add(
                            "logo-fallback"
                          );
                        }}
                      />

                      <span className="logo-fallback-text">
                        HMS
                      </span>

                    </div>

                    <button
                      type="button"
                      className="card-close-button"
                      onClick={closeLoginCard}
                      aria-label="ओटीपी विंडो बंद करें"
                    >
                      ×
                    </button>

                    <div className="admin-card-title">

                      <span className="title-small">
                        एचएमएस सुरक्षा
                      </span>

                      <h3>
                        OTP Verification
                      </h3>

                      <p className="otp-subtitle">
                        अपने पंजीकृत ईमेल या मोबाइल नंबर का सत्यापन करें
                      </p>

                      <span className="title-line" />

                    </div>

                    <div className="otp-method-section">

                      <label>
                        Verify using
                      </label>

                      <div className="otp-method-options">

                        <button
                          type="button"
                          className={
                            otpMethod === "email"
                              ? "otp-method-button active"
                              : "otp-method-button"
                          }
                          onClick={() =>
                            changeOtpMethod(
                              "email"
                            )
                          }
                        >

                          <span className="otp-method-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg></span>

                          <span>
                            Email
                          </span>

                        </button>

                        <button
                          type="button"
                          className={
                            otpMethod === "mobile"
                              ? "otp-method-button active"
                              : "otp-method-button"
                          }
                          onClick={() =>
                            changeOtpMethod(
                              "mobile"
                            )
                          }
                        >

                          <span className="otp-method-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" /></svg></span>

                          <span>
                            Mobile
                          </span>

                        </button>

                      </div>

                    </div>

                    <div className="otp-destination">

                      <span>
                        OTP will be sent to
                      </span>

                      <strong>
                        {otpDestination}
                      </strong>

                    </div>

                    {!otpSent && (
                      <button
                        type="button"
                        className="otp-send-button"
                        onClick={sendOtp}
                        disabled={
                          authLoading
                        }
                      >

                        <span>
                          {authLoading
                            ? "भेजा जा रहा है..."
                            : "ओटीपी भेजें"}
                        </span>

                        <span className="submit-arrow">
                          <svg
                            viewBox="0 0 24 24"
                            width="15"
                            height="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="4" y1="12" x2="19" y2="12" />
                            <polyline points="13 6 19 12 13 18" />
                          </svg>
                        </span>

                      </button>
                    )}

                    {otpSent && (
                      <form
                        className="otp-form"
                        onSubmit={verifyOtp}
                      >

                        <div className="field-group">

                          <label htmlFor="otp">
                            Enter OTP
                          </label>

                          <div className="otp-input-box">

                            <span className="field-icon">
                              <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            ><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                            </span>

                            <input
                              id="otp"
                              type="text"
                              inputMode="numeric"
                              value={otpInput}
                              onChange={(event) => {
                                const value =
                                  event.target.value
                                    .replace(
                                      /\D/g,
                                      ""
                                    )
                                    .slice(
                                      0,
                                      6
                                    );

                                setOtpInput(
                                  value
                                );

                                setOtpMessage(
                                  ""
                                );
                              }}
                              placeholder="6 अंकों का ओटीपी दर्ज करें"
                              maxLength={6}
                              autoComplete="one-time-code"
                              autoFocus
                            />

                          </div>

                        </div>

                        <div
                          className={
                            otpSecondsLeft <= 30
                              ? "otp-countdown danger"
                              : "otp-countdown"
                          }
                        >
                          ओटीपी समाप्त होने में{" "}
                          <strong>
                            {formatOtpTime(
                              otpSecondsLeft
                            )}
                          </strong>
                        </div>

                        {otpMessage && (
                          <div className="login-message otp-message">
                            {otpMessage}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="login-submit-button otp-verify-button"
                          disabled={
                            authLoading ||
                            !otpInput.trim()
                          }
                        >

                          <span>
                            {authLoading
                              ? "सत्यापन हो रहा है..."
                              : "ओटीपी सत्यापित करें"}
                          </span>

                          <span className="submit-arrow">
                            ✓
                          </span>

                        </button>

                        <button
                          type="button"
                          className="otp-resend-button"
                          onClick={sendOtp}
                          disabled={
                            authLoading
                          }
                        >
                          Resend OTP
                        </button>

                      </form>
                    )}

                    <button
                      type="button"
                      className="otp-back-button"
                      onClick={
                        backToLogin
                      }
                    >
                      ← लॉगिन पर वापस जाएँ
                    </button>

                  </div>

                </div>
              )}

          </div>
        )}

      </section>

    </main>
  );
}

export default Home;