import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import SuccessPopup from "./SuccessPopup";
import "./Settings.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  /* ---------------------------------------------
     SUPER ADMIN HEADER
  --------------------------------------------- */

  superAdminLogo: "",

  superAdminHeaderLogo: "",

  superAdminHeaderTitle:
    "",

  superAdminHeaderSubtitle:
    "",

  superAdminHeaderSecurityText:
    "",

  /* ---------------------------------------------
     LOGIN
  --------------------------------------------- */

  loginTitle:
    "",

  loginSubtitle:
    "",

  /* ---------------------------------------------
     HOSPITAL LOGIN BRANDING
  --------------------------------------------- */

  loginHospitalName:
    "",

  loginHospitalTagline:
    "",

  loginHospitalAddress:
    "",

  loginHospitalDescription:
    "",

  /* ---------------------------------------------
     FOOTER
  --------------------------------------------- */

  loginFooterText:
    "",

  loginFooterTagline:
    "",

  /* ---------------------------------------------
     LOGO
  --------------------------------------------- */

  logoBackgroundMode:
    "transparent",

  logoShadow:
    true,

  logoSize:
    100,

  topLogoSize:
    100,

  loginLogoSize:
    100,

  backgroundLogoSize:
    100,

  patientCardLogoSize:
    100,

  logoX:
    0,

  logoY:
    0,

  /* ---------------------------------------------
     BACKGROUND
  --------------------------------------------- */

  loginBackgroundImage:
    "",

  backgroundSize:
    100,

  backgroundX:
    0,

  backgroundY:
    0,

  backgroundShadow:
    true,

  /* ---------------------------------------------
     FEATHER
  --------------------------------------------- */

  featherEnabled:
    false,

  featherAmount:
    0,

  featherSoftness:
    50,

  /* ---------------------------------------------
     VIGNETTE
  --------------------------------------------- */

  vignetteEnabled:
    false,

  vignetteIntensity:
    30,

  vignetteSoftness:
    50,

  vignetteSize:
    100,

  vignetteX:
    0,

  vignetteY:
    0,

  /* ---------------------------------------------
     HOSPITAL NAME
  --------------------------------------------- */

  nameSize:
    24,

  nameX:
    0,

  nameY:
    0,

  nameColor:
    "#ffffff",

  nameFontFamily:
    "system",

  nameFontWeight:
    700,

  nameLetterSpacing:
    0,

  nameShadow:
    true,

  /* ---------------------------------------------
     HOSPITAL TAGLINE
  --------------------------------------------- */

  taglineSize:
    13,

  taglineX:
    0,

  taglineY:
    0,

  taglineColor:
    "#ffffff",

  taglineFontFamily:
    "system",

  taglineFontWeight:
    500,

  taglineLetterSpacing:
    0,

  taglineShadow:
    true,

  /* ---------------------------------------------
     HEADING SIZES
  --------------------------------------------- */

  controlPanelHeadingSize:
    28,

  administrationHeadingSize:
    22,

  loginTaglineSize:
    13,

  patientTaglineSize:
    12,
};

/* =========================================================
   FIELD ALIASES
========================================================= */

const FIELD_ALIASES = {
  superAdminLogo: [
    "superAdminLogo",
    "super_admin_logo",
    "superAdminLogoUrl",
    "super_admin_logo_url",
  ],

  superAdminHeaderLogo: [
    "superAdminHeaderLogo",
    "super_admin_header_logo",
    "headerLogo",
    "header_logo",
  ],

  superAdminHeaderTitle: [
    "superAdminHeaderTitle",
    "super_admin_header_title",
    "headerTitle",
    "header_title",
  ],

  superAdminHeaderSubtitle: [
    "superAdminHeaderSubtitle",
    "super_admin_header_subtitle",
    "headerSubtitle",
    "header_subtitle",
  ],

  superAdminHeaderSecurityText: [
    "superAdminHeaderSecurityText",
    "super_admin_header_security_text",
    "headerSecurityText",
    "header_security_text",
  ],

  loginTitle: [
    "loginTitle",
    "login_title",
  ],

  loginSubtitle: [
    "loginSubtitle",
    "login_subtitle",
  ],

  loginHospitalName: [
    "loginHospitalName",
    "login_hospital_name",
    "hospitalName",
    "hospital_name",
  ],

  loginHospitalTagline: [
    "loginHospitalTagline",
    "login_hospital_tagline",
    "hospitalTagline",
    "hospital_tagline",
  ],

  loginHospitalAddress: [
    "loginHospitalAddress",
    "login_hospital_address",
    "hospitalAddress",
    "hospital_address",
    "address",
  ],

  loginHospitalDescription: [
    "loginHospitalDescription",
    "login_hospital_description",
    "hospitalDescription",
    "hospital_description",
  ],

  loginFooterText: [
    "loginFooterText",
    "login_footer_text",
    "footerText",
    "footer_text",
  ],

  loginFooterTagline: [
    "loginFooterTagline",
    "login_footer_tagline",
    "footerTagline",
    "footer_tagline",
  ],
};

/* =========================================================
   HELPERS
========================================================= */

function readToken() {
  try {
    return (
      localStorage.getItem("hms_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("hms_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("auth_token") ||
      ""
    );
  } catch {
    return "";
  }
}

function normalizeImageUrl(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  const result =
    String(value).trim();

  if (
    !result ||
    result === "null" ||
    result === "undefined" ||
    result === "false"
  ) {
    return "";
  }

  return result;
}

function firstValue(
  object,
  keys,
  fallback
) {
  for (const key of keys) {
    const value =
      object?.[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      if (
        typeof value === "string" &&
        value.trim() === ""
      ) {
        continue;
      }

      return value;
    }
  }

  return fallback;
}

function normalizeSettings(
  source = {}
) {
  const settings =
    source?.settings ||
    source?.data?.settings ||
    source?.data ||
    source ||
    {};

  const normalized = {
    ...DEFAULT_SETTINGS,
  };

  Object.keys(
    DEFAULT_SETTINGS
  ).forEach((key) => {
    if (
      FIELD_ALIASES[key]
    ) {
      normalized[key] =
        firstValue(
          settings,
          FIELD_ALIASES[key],
          DEFAULT_SETTINGS[key]
        );
    } else if (
      settings[key] !==
        undefined &&
      settings[key] !==
        null
    ) {
      normalized[key] =
        settings[key];
    }
  });

  return normalized;
}

/* =========================================================
   API RESPONSE
========================================================= */

async function parseResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(
  data,
  fallback
) {
  if (!data) {
    return fallback;
  }

  if (
    typeof data ===
    "string"
  ) {
    return data;
  }

  return (
    data.message ||
    data.error ||
    data.detail ||
    data?.data?.message ||
    fallback
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Settings() {
  const navigate =
    useNavigate();

  const [settings, setSettings] =
    useState(() =>
      normalizeSettings(
        (() => {
          try {
            const raw =
              localStorage.getItem(
                "hmsSettings"
              );

            return raw
              ? JSON.parse(raw)
              : {};
          } catch {
            return {};
          }
        })()
      )
    );

  const [activeTab, setActiveTab] =
    useState("customize");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [dirty, setDirty] =
    useState(false);

  const [successPopup, setSuccessPopup] =
    useState({
      open: false,
      title: "",
      message: "",
    });

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSettings =
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            readToken();

          const response =
            await fetch(
              `${API_BASE_URL}/settings`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                },
              }
            );

          const data =
            await parseResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                "Unable to load settings."
              )
            );
          }

          const normalized =
            normalizeSettings(
              data
            );

          if (!mounted) {
            return;
          }

          setSettings(
            normalized
          );

          try {
            localStorage.setItem(
              "hmsSettings",
              JSON.stringify(
                normalized
              )
            );
          } catch {
            // ignore
          }
        } catch (err) {
          console.error(
            "Settings load error:",
            err
          );

          if (!mounted) {
            return;
          }

          /*
           * Local settings are still usable
           * when API is unavailable.
           */
          setError(
            err?.message ||
              "Unable to load settings from server."
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     UPDATE SETTING
  ======================================================= */

  const updateSetting = (
    key,
    value
  ) => {
    setSettings(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );

    setDirty(true);
    setMessage("");
    setError("");
  };

  /* =======================================================
     LOCAL STORAGE SYNC
  ======================================================= */

  const writeLocalSettings = (
    nextSettings
  ) => {
    try {
      localStorage.setItem(
        "hmsSettings",
        JSON.stringify(
          nextSettings
        )
      );

      /*
       * Legacy / direct keys
       */

      localStorage.setItem(
        "hms_super_admin_logo",
        nextSettings.superAdminHeaderLogo ||
          nextSettings.superAdminLogo ||
          ""
      );

      localStorage.setItem(
        "hms_login_title",
        nextSettings.superAdminHeaderTitle ||
          nextSettings.loginTitle ||
          ""
      );

      localStorage.setItem(
        "hms_login_subtitle",
        nextSettings.loginSubtitle ||
          ""
      );

      localStorage.setItem(
        "hms_super_admin_header_title",
        nextSettings.superAdminHeaderTitle ||
          ""
      );

      localStorage.setItem(
        "hms_super_admin_header_subtitle",
        nextSettings.superAdminHeaderSubtitle ||
          ""
      );

      localStorage.setItem(
        "hms_super_admin_security_text",
        nextSettings.superAdminHeaderSecurityText ||
          ""
      );

      localStorage.setItem(
        "hms_login_hospital_name",
        nextSettings.loginHospitalName ||
          ""
      );

      localStorage.setItem(
        "hms_login_hospital_tagline",
        nextSettings.loginHospitalTagline ||
          ""
      );

      localStorage.setItem(
        "hms_login_hospital_address",
        nextSettings.loginHospitalAddress ||
          ""
      );

      localStorage.setItem(
        "hms_login_hospital_description",
        nextSettings.loginHospitalDescription ||
          ""
      );

      localStorage.setItem(
        "hms_login_footer_text",
        nextSettings.loginFooterText ||
          ""
      );

      localStorage.setItem(
        "hms_login_footer_tagline",
        nextSettings.loginFooterTagline ||
          ""
      );
    } catch (storageError) {
      console.warn(
        "Unable to save settings locally:",
        storageError
      );
    }
  };

  /* =======================================================
     BROADCAST SETTINGS
  ======================================================= */

  const broadcastSettings = (
    nextSettings
  ) => {
    try {
      window.dispatchEvent(
        new CustomEvent(
          "hmsSettingsUpdated",
          {
            detail:
              nextSettings,
          }
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "hmsSuperAdminBrandingUpdated",
          {
            detail:
              nextSettings,
          }
        )
      );
    } catch {
      /*
       * Fallback for browsers where
       * CustomEvent creation is restricted.
       */
      window.dispatchEvent(
        new Event(
          "hmsSettingsUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "hmsSuperAdminBrandingUpdated"
        )
      );
    }
  };

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  const saveSettings =
    async () => {
      try {
        setSaving(true);
        setMessage("");
        setError("");

        const nextSettings =
          normalizeSettings(
            settings
          );

        const token =
          readToken();

        const response =
          await fetch(
            `${API_BASE_URL}/settings`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              body: JSON.stringify(
                nextSettings
              ),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Unable to save settings."
            )
          );
        }

        /*
         * Some APIs return:
         * { settings: {...} }
         *
         * Others return:
         * { data: { settings: {...} } }
         *
         * If no settings are returned,
         * use the values we just sent.
         */

        const returnedSettings =
          data?.settings ||
          data?.data?.settings ||
          data?.data;

        const finalSettings =
          returnedSettings &&
          typeof returnedSettings ===
            "object" &&
          !Array.isArray(
            returnedSettings
          )
            ? normalizeSettings(
                returnedSettings
              )
            : nextSettings;

        setSettings(
          finalSettings
        );

        writeLocalSettings(
          finalSettings
        );

        broadcastSettings(
          finalSettings
        );

        setDirty(false);

        setMessage(
          "Settings saved successfully."
        );

        setSuccessPopup({
          open: true,
          title: "Settings Saved",
          message:
            "Settings successfully save ho gayi hain.",
        });
      } catch (err) {
        console.error(
          "Settings save error:",
          err
        );

        /*
         * Keep local state usable even
         * if backend temporarily fails.
         */
        writeLocalSettings(
          settings
        );

        broadcastSettings(
          settings
        );

        setError(
          err?.message ||
            "Unable to save settings."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     RESET
  ======================================================= */

  const resetSettings =
    () => {
      const confirmed =
        window.confirm(
          "Reset all branding settings to default values?"
        );

      if (!confirmed) {
        return;
      }

      const defaults =
        normalizeSettings(
          DEFAULT_SETTINGS
        );

      setSettings(
        defaults
      );

      writeLocalSettings(
        defaults
      );

      broadcastSettings(
        defaults
      );

      setDirty(true);

      setMessage(
        "Default values restored. Click Save Settings to save them to the server."
      );

      setError("");
    };

  /* =======================================================
     IMAGE CHANGE
  ======================================================= */

  const handleLogoUrlChange =
    (event) => {
      updateSetting(
        "superAdminHeaderLogo",
        event.target.value
      );

      /*
       * Keep main logo in sync.
       */
      updateSetting(
        "superAdminLogo",
        event.target.value
      );
    };

  const handleBackgroundUrlChange =
    (event) => {
      updateSetting(
        "loginBackgroundImage",
        event.target.value
      );
    };

  /* =======================================================
     PREVIEW VALUES
  ======================================================= */

  const previewLogo =
    normalizeImageUrl(
      settings.superAdminHeaderLogo ||
        settings.superAdminLogo
    ) ||
    "/hms-logo.png";

  const previewHospitalName =
    settings.loginHospitalName ||
    "";

  const previewHospitalTagline =
    settings.loginHospitalTagline ||
    "";

  const previewHospitalAddress =
    settings.loginHospitalAddress ||
    "";

  const previewBackground =
    normalizeImageUrl(
      settings.loginBackgroundImage
    );

  const fontFamilyMap = {
    system:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    sans:
      "Arial, Helvetica, sans-serif",

    serif:
      "Georgia, 'Times New Roman', serif",

    mono:
      "'Courier New', Courier, monospace",
  };

  const previewBackgroundStyle =
    useMemo(() => {
      if (!previewBackground) {
        return {};
      }

      return {
        backgroundImage:
          `url("${previewBackground}")`,
        backgroundSize:
          `${Number(
            settings.backgroundSize || 100
          )}%`,
        backgroundPosition:
          `calc(50% + ${Number(
            settings.backgroundX || 0
          )}px) calc(50% + ${Number(
            settings.backgroundY || 0
          )}px)`,
      };
    }, [
      previewBackground,
      settings.backgroundSize,
      settings.backgroundX,
      settings.backgroundY,
    ]);

  const previewNameStyle =
    useMemo(
      () => ({
        fontSize:
          `${Number(
            settings.nameSize || 24
          )}px`,

        color:
          settings.nameColor ||
          "#ffffff",

        fontFamily:
          fontFamilyMap[
            settings.nameFontFamily
          ] ||
          fontFamilyMap.system,

        fontWeight:
          Number(
            settings.nameFontWeight ||
              700
          ),

        letterSpacing:
          `${Number(
            settings.nameLetterSpacing || 0
          )}px`,

        transform:
          `translate(${Number(
            settings.nameX || 0
          )}px, ${Number(
            settings.nameY || 0
          )}px)`,

        textShadow:
          settings.nameShadow
            ? "0 2px 8px rgba(0,0,0,.45)"
            : "none",
      }),
      [settings]
    );

  const previewTaglineStyle =
    useMemo(
      () => ({
        fontSize:
          `${Number(
            settings.taglineSize || 13
          )}px`,

        color:
          settings.taglineColor ||
          "#ffffff",

        fontFamily:
          fontFamilyMap[
            settings.taglineFontFamily
          ] ||
          fontFamilyMap.system,

        fontWeight:
          Number(
            settings.taglineFontWeight ||
              500
          ),

        letterSpacing:
          `${Number(
            settings.taglineLetterSpacing || 0
          )}px`,

        transform:
          `translate(${Number(
            settings.taglineX || 0
          )}px, ${Number(
            settings.taglineY || 0
          )}px)`,

        textShadow:
          settings.taglineShadow
            ? "0 2px 7px rgba(0,0,0,.4)"
            : "none",
      }),
      [settings]
    );

  const previewLogoStyle =
    useMemo(
      () => ({
        width:
          `${Number(
            settings.loginLogoSize || 100
          )}px`,

        height:
          `${Number(
            settings.loginLogoSize || 100
          )}px`,

        objectFit:
          "contain",

        transform:
          `translate(${Number(
            settings.logoX || 0
          )}px, ${Number(
            settings.logoY || 0
          )}px)`,

        background:
          settings.logoBackgroundMode ===
          "white"
            ? "#ffffff"
            : "transparent",

        borderRadius:
          settings.logoBackgroundMode ===
          "circle"
            ? "50%"
            : "12px",

        padding:
          settings.logoBackgroundMode ===
          "transparent"
            ? "0"
            : "8px",

        boxShadow:
          settings.logoShadow
            ? "0 10px 30px rgba(0,0,0,.25)"
            : "none",
      }),
      [settings]
    );

  /* =======================================================
     TABS
  ======================================================= */

  const tabs = [
    {
      id: "customize",
      label: "Customize",
      icon: "🎨",
    },
    {
      id: "branding",
      label: "Branding",
      icon: "🏷️",
    },
    {
      id: "logo",
      label: "Logo",
      icon: "🖼️",
    },
    {
      id: "background",
      label: "Background",
      icon: "🌄",
    },
    {
      id: "headings",
      label: "Headings",
      icon: "T",
    },
    {
      id: "advanced",
      label: "Advanced",
      icon: "⚙",
    },
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="settings-page">

        <div className="settings-loading">
          <div className="settings-loading-spinner"></div>

          <h2>
            Loading Settings...
          </h2>

          <p>
            Please wait while HMS branding settings are loaded.
          </p>
        </div>

      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="settings-header">

        <div className="settings-header-left">

          <button
            type="button"
            className="settings-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ←
          </button>

          <div>

            <h1>
              Settings
            </h1>

            <p>
              HMS branding and appearance control
            </p>

          </div>

        </div>

        <div className="settings-header-actions">

          {dirty && (
            <span className="unsaved-badge">
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            className="settings-reset-button"
            onClick={
              resetSettings
            }
          >
            Reset
          </button>

          <button
            type="button"
            className="settings-save-button"
            disabled={saving}
            onClick={
              saveSettings
            }
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

        </div>

      </header>

      {/* =================================================
          STATUS
      ================================================= */}

      {message && (
        <div className="settings-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="settings-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* =================================================
          MAIN LAYOUT
      ================================================= */}

      <main className="settings-main-layout">

        {/* =================================================
            LEFT SIDEBAR
        ================================================= */}

        <aside className="settings-sidebar">

          <div className="settings-sidebar-title">
            Appearance
          </div>

          <nav className="settings-tabs">

            {tabs.map(
              (tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`settings-tab ${
                    activeTab ===
                    tab.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveTab(
                      tab.id
                    )
                  }
                >

                  <span className="settings-tab-icon">
                    {tab.icon}
                  </span>

                  <span>
                    {tab.label}
                  </span>

                </button>
              )
            )}

          </nav>

          <div className="settings-sidebar-info">

            <strong>
              Live Sync
            </strong>

            <p>
              Saved branding is automatically shared with Login and Super Admin.
            </p>

          </div>

        </aside>

        {/* =================================================
            CENTER PREVIEW
        ================================================= */}

        <section className="settings-preview-area">

          <div className="settings-section-heading">

            <div>
              <span className="section-eyebrow">
                LIVE PREVIEW
              </span>

              <h2>
                HMS Login & Super Admin
              </h2>
            </div>

            <span className="preview-status">
              ● Live
            </span>

          </div>

          <div
            className={`branding-preview ${
              settings.vignetteEnabled
                ? "has-vignette"
                : ""
            }`}
            style={
              previewBackgroundStyle
            }
          >

            {!previewBackground && (
              <div className="preview-default-background">
                <div className="preview-glow"></div>
                <div className="preview-grid"></div>
              </div>
            )}

            {settings.featherEnabled && (
              <div
                className="preview-feather"
                style={{
                  opacity:
                    Number(
                      settings.featherAmount ||
                        0
                    ) / 100,
                  filter:
                    `blur(${Number(
                      settings.featherSoftness ||
                        50
                    ) / 10}px)`,
                }}
              ></div>
            )}

            {settings.vignetteEnabled && (
              <div
                className="preview-vignette"
                style={{
                  opacity:
                    Number(
                      settings.vignetteIntensity ||
                        30
                    ) / 100,
                  transform:
                    `translate(${Number(
                      settings.vignetteX ||
                        0
                    )}px, ${Number(
                      settings.vignetteY ||
                        0
                    )}px)`,
                }}
              ></div>
            )}

            {/* PREVIEW TOP BRAND */}

            <div className="preview-top-brand">

              <div className="preview-top-logo-wrap">

                <img
                  src={
                    previewLogo
                  }
                  alt="HMS Logo"
                  className="preview-top-logo"
                  style={{
                    width:
                      `${Number(
                        settings.topLogoSize ||
                          100
                      )}px`,
                    height:
                      `${Number(
                        settings.topLogoSize ||
                          100
                      )}px`,
                  }}
                />

              </div>

              <div className="preview-top-title">

                <strong>
                  {settings.superAdminHeaderTitle ||
                    ""}
                </strong>

                <span>
                  {settings.superAdminHeaderSubtitle ||
                    ""}
                </span>

              </div>

              <div className="preview-security">

                <span>
                  🔒
                </span>

                {settings.superAdminHeaderSecurityText ||
                  ""}

              </div>

            </div>

            {/* PREVIEW CENTER */}

            <div className="preview-center">

              <div className="preview-hospital-brand">

                <div className="preview-logo-box">

                  <img
                    src={
                      previewLogo
                    }
                    alt="Hospital Logo"
                    style={
                      previewLogoStyle
                    }
                  />

                </div>

                <h3
                  style={
                    previewNameStyle
                  }
                >
                  {previewHospitalName}
                </h3>

                <p
                  style={
                    previewTaglineStyle
                  }
                >
                  {previewHospitalTagline}
                </p>

                <p className="preview-address">
                  📍 {previewHospitalAddress}
                </p>

              </div>

              <div className="preview-login-card">

                <span className="preview-card-label">
                  SECURE LOGIN
                </span>

                <h3
                  style={{
                    fontSize:
                      `${Number(
                        settings.controlPanelHeadingSize ||
                          28
                      ) / 2}px`,
                  }}
                >
                  {settings.loginTitle ||
                    ""}
                </h3>

                <p
                  style={{
                    fontSize:
                      `${Number(
                        settings.loginTaglineSize ||
                          13
                      )}px`,
                  }}
                >
                  {settings.loginSubtitle ||
                    ""}
                </p>

                <div className="preview-input">
                  Email Address
                </div>

                <div className="preview-input">
                  Password
                </div>

                <div className="preview-login-button">
                  Login
                </div>

              </div>

            </div>

            {/* PREVIEW FOOTER */}

            {(settings.loginFooterText || settings.loginFooterTagline) && (<div className="preview-footer">

              <span>
                {settings.loginFooterText ||
                  ""}
              </span>

              <span>
                •
              </span>

              <span>
                {settings.loginFooterTagline ||
                  ""}
              </span>

            </div>)}

          </div>

          {/* DESCRIPTION */}

          {settings.loginHospitalDescription && (<div className="preview-description">

            <strong>
              Hospital Description
            </strong>

            <p>
              {settings.loginHospitalDescription ||
                ""}
            </p>

          </div>)}

        </section>

        {/* =================================================
            RIGHT EDITOR
        ================================================= */}

        <section className="settings-editor">

          {/* =================================================
              CUSTOMIZE
          ================================================= */}

          {activeTab ===
            "customize" && (
            <>

              <div className="editor-heading">

                <span>
                  MAIN CUSTOMIZATION
                </span>

                <h2>
                  Login Identity
                </h2>

                <p>
                  Control the hospital identity displayed on the login screen.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Login Title
                </label>

                <input
                  type="text"
                  value={
                    settings.loginTitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginTitle",
                      event.target.value
                    )
                  }
                  placeholder="Administrative Control Panel"
                />

              </div>

              <div className="settings-field">

                <label>
                  Login Subtitle
                </label>

                <input
                  type="text"
                  value={
                    settings.loginSubtitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginSubtitle",
                      event.target.value
                    )
                  }
                  placeholder="HMS Administration"
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name
                </label>

                <input
                  type="text"
                  value={
                    settings.loginHospitalName
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginHospitalName",
                      event.target.value
                    )
                  }
                  placeholder="HMS Hospital"
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Tagline
                </label>

                <input
                  type="text"
                  value={
                    settings.loginHospitalTagline
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginHospitalTagline",
                      event.target.value
                    )
                  }
                  placeholder="Narayanpur Ghazipur"
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Address
                </label>

                <textarea
                  rows="3"
                  value={
                    settings.loginHospitalAddress
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginHospitalAddress",
                      event.target.value
                    )
                  }
                  placeholder="Enter complete hospital address"
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Description
                </label>

                <textarea
                  rows="4"
                  value={
                    settings.loginHospitalDescription
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginHospitalDescription",
                      event.target.value
                    )
                  }
                  placeholder="Enter hospital description"
                />

              </div>

              <div className="settings-field">

                <label>
                  Footer Text
                </label>

                <input
                  type="text"
                  value={
                    settings.loginFooterText
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginFooterText",
                      event.target.value
                    )
                  }
                  placeholder="© 2026 HMS Hospital"
                />

              </div>

              <div className="settings-field">

                <label>
                  Footer Tagline
                </label>

                <input
                  type="text"
                  value={
                    settings.loginFooterTagline
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginFooterTagline",
                      event.target.value
                    )
                  }
                  placeholder="Secure • Reliable • Digital Healthcare"
                />

              </div>

            </>
          )}

          {/* =================================================
              BRANDING
          ================================================= */}

          {activeTab ===
            "branding" && (
            <>

              <div className="editor-heading">

                <span>
                  SUPER ADMIN
                </span>

                <h2>
                  Header Branding
                </h2>

                <p>
                  These values appear in the Super Admin header.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Super Admin Header Logo URL
                </label>

                <input
                  type="text"
                  value={
                    settings.superAdminHeaderLogo
                  }
                  onChange={
                    handleLogoUrlChange
                  }
                  placeholder="/hms-logo.png or image URL"
                />

                <small>
                  Enter a local public image path or image URL.
                </small>

              </div>

              <div className="settings-logo-mini-preview">

                <img
                  src={
                    previewLogo
                  }
                  alt="Logo Preview"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/hms-logo.png";
                  }}
                />

              </div>

              <div className="settings-field">

                <label>
                  Super Admin Header Title
                </label>

                <input
                  type="text"
                  value={
                    settings.superAdminHeaderTitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "superAdminHeaderTitle",
                      event.target.value
                    )
                  }
                  placeholder="Administration Control Panel"
                />

              </div>

              <div className="settings-field">

                <label>
                  Super Admin Header Subtitle
                </label>

                <input
                  type="text"
                  value={
                    settings.superAdminHeaderSubtitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "superAdminHeaderSubtitle",
                      event.target.value
                    )
                  }
                  placeholder="Hospital Management Systems"
                />

              </div>

              <div className="settings-field">

                <label>
                  Header Security Text
                </label>

                <input
                  type="text"
                  value={
                    settings.superAdminHeaderSecurityText
                  }
                  onChange={(event) =>
                    updateSetting(
                      "superAdminHeaderSecurityText",
                      event.target.value
                    )
                  }
                  placeholder="Secure Healthcare Platform"
                />

              </div>

              <div className="settings-divider"></div>

              <div className="editor-heading small">

                <span>
                  LOGIN BRANDING
                </span>

                <h2>
                  Login Identity
                </h2>

              </div>

              <div className="settings-field">

                <label>
                  Login Title
                </label>

                <input
                  type="text"
                  value={
                    settings.loginTitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginTitle",
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Login Subtitle
                </label>

                <input
                  type="text"
                  value={
                    settings.loginSubtitle
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginSubtitle",
                      event.target.value
                    )
                  }
                />

              </div>

            </>
          )}

          {/* =================================================
              LOGO
          ================================================= */}

          {activeTab ===
            "logo" && (
            <>

              <div className="editor-heading">

                <span>
                  LOGO SETTINGS
                </span>

                <h2>
                  Logo Appearance
                </h2>

                <p>
                  Control logo size, position and appearance.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Logo Background
                </label>

                <select
                  value={
                    settings.logoBackgroundMode
                  }
                  onChange={(event) =>
                    updateSetting(
                      "logoBackgroundMode",
                      event.target.value
                    )
                  }
                >
                  <option value="transparent">
                    Transparent
                  </option>

                  <option value="white">
                    White
                  </option>

                  <option value="circle">
                    Circle
                  </option>
                </select>

              </div>

              <div className="settings-field">

                <label>
                  Login Logo Size
                  <strong>
                    {settings.loginLogoSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="40"
                  max="220"
                  value={
                    settings.loginLogoSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginLogoSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Top Header Logo Size
                  <strong>
                    {settings.topLogoSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="30"
                  max="180"
                  value={
                    settings.topLogoSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "topLogoSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Background Logo Size
                  <strong>
                    {settings.backgroundLogoSize}%
                  </strong>
                </label>

                <input
                  type="range"
                  min="20"
                  max="200"
                  value={
                    settings.backgroundLogoSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "backgroundLogoSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Logo Horizontal Position
                  <strong>
                    {settings.logoX}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.logoX
                  }
                  onChange={(event) =>
                    updateSetting(
                      "logoX",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Logo Vertical Position
                  <strong>
                    {settings.logoY}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.logoY
                  }
                  onChange={(event) =>
                    updateSetting(
                      "logoY",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Logo Shadow
                  </strong>

                  <span>
                    Add depth around the logo.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.logoShadow
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "logoShadow",
                      !settings.logoShadow
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Background Shadow
                  </strong>

                  <span>
                    Add shadow to background branding.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.backgroundShadow
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "backgroundShadow",
                      !settings.backgroundShadow
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

            </>
          )}

          {/* =================================================
              BACKGROUND
          ================================================= */}

          {activeTab ===
            "background" && (
            <>

              <div className="editor-heading">

                <span>
                  LOGIN BACKGROUND
                </span>

                <h2>
                  Background Settings
                </h2>

                <p>
                  Configure the login screen background image and effects.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Background Image URL
                </label>

                <input
                  type="text"
                  value={
                    settings.loginBackgroundImage
                  }
                  onChange={
                    handleBackgroundUrlChange
                  }
                  placeholder="/login-bg.jpg"
                />

              </div>

              <div className="settings-field">

                <label>
                  Background Size
                  <strong>
                    {settings.backgroundSize}%
                  </strong>
                </label>

                <input
                  type="range"
                  min="50"
                  max="200"
                  value={
                    settings.backgroundSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "backgroundSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Background X
                  <strong>
                    {settings.backgroundX}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={
                    settings.backgroundX
                  }
                  onChange={(event) =>
                    updateSetting(
                      "backgroundX",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Background Y
                  <strong>
                    {settings.backgroundY}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={
                    settings.backgroundY
                  }
                  onChange={(event) =>
                    updateSetting(
                      "backgroundY",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-divider"></div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Feather Effect
                  </strong>

                  <span>
                    Soften the outer edges of the background.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.featherEnabled
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "featherEnabled",
                      !settings.featherEnabled
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

              {settings.featherEnabled && (
                <>
                  <div className="settings-field">

                    <label>
                      Feather Amount
                      <strong>
                        {settings.featherAmount}%
                      </strong>
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        settings.featherAmount
                      }
                      onChange={(event) =>
                        updateSetting(
                          "featherAmount",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>

                  <div className="settings-field">

                    <label>
                      Feather Softness
                      <strong>
                        {settings.featherSoftness}%
                      </strong>
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        settings.featherSoftness
                      }
                      onChange={(event) =>
                        updateSetting(
                          "featherSoftness",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>
                </>
              )}

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Vignette
                  </strong>

                  <span>
                    Darken the edges for better readability.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.vignetteEnabled
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "vignetteEnabled",
                      !settings.vignetteEnabled
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

              {settings.vignetteEnabled && (
                <>

                  <div className="settings-field">

                    <label>
                      Vignette Intensity
                      <strong>
                        {settings.vignetteIntensity}%
                      </strong>
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        settings.vignetteIntensity
                      }
                      onChange={(event) =>
                        updateSetting(
                          "vignetteIntensity",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>

                  <div className="settings-field">

                    <label>
                      Vignette Softness
                      <strong>
                        {settings.vignetteSoftness}%
                      </strong>
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        settings.vignetteSoftness
                      }
                      onChange={(event) =>
                        updateSetting(
                          "vignetteSoftness",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>

                  <div className="settings-field">

                    <label>
                      Vignette Size
                      <strong>
                        {settings.vignetteSize}%
                      </strong>
                    </label>

                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={
                        settings.vignetteSize
                      }
                      onChange={(event) =>
                        updateSetting(
                          "vignetteSize",
                          Number(
                            event.target.value
                          )
                        )
                      }
                    />

                  </div>

                </>
              )}

            </>
          )}

          {/* =================================================
              HEADINGS
          ================================================= */}

          {activeTab ===
            "headings" && (
            <>

              <div className="editor-heading">

                <span>
                  TYPOGRAPHY
                </span>

                <h2>
                  Heading Controls
                </h2>

                <p>
                  Change hospital name, tagline and login heading appearance.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Size
                  <strong>
                    {settings.nameSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="14"
                  max="60"
                  value={
                    settings.nameSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Color
                </label>

                <div className="color-control">

                  <input
                    type="color"
                    value={
                      settings.nameColor ||
                      "#ffffff"
                    }
                    onChange={(event) =>
                      updateSetting(
                        "nameColor",
                        event.target.value
                      )
                    }
                  />

                  <input
                    type="text"
                    value={
                      settings.nameColor
                    }
                    onChange={(event) =>
                      updateSetting(
                        "nameColor",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Font
                </label>

                <select
                  value={
                    settings.nameFontFamily
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameFontFamily",
                      event.target.value
                    )
                  }
                >
                  <option value="system">
                    System
                  </option>

                  <option value="sans">
                    Sans
                  </option>

                  <option value="serif">
                    Serif
                  </option>

                  <option value="mono">
                    Monospace
                  </option>
                </select>

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Weight
                </label>

                <select
                  value={
                    settings.nameFontWeight
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameFontWeight",
                      Number(
                        event.target.value
                      )
                    )
                  }
                >
                  <option value="400">
                    Regular
                  </option>

                  <option value="500">
                    Medium
                  </option>

                  <option value="600">
                    Semi Bold
                  </option>

                  <option value="700">
                    Bold
                  </option>

                  <option value="800">
                    Extra Bold
                  </option>

                </select>

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Letter Spacing
                  <strong>
                    {settings.nameLetterSpacing}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-2"
                  max="8"
                  step="0.5"
                  value={
                    settings.nameLetterSpacing
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameLetterSpacing",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Hospital Name Shadow
                  </strong>

                  <span>
                    Add text shadow.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.nameShadow
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "nameShadow",
                      !settings.nameShadow
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

              <div className="settings-divider"></div>

              <div className="settings-field">

                <label>
                  Tagline Size
                  <strong>
                    {settings.taglineSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="8"
                  max="30"
                  value={
                    settings.taglineSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "taglineSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Tagline Color
                </label>

                <div className="color-control">

                  <input
                    type="color"
                    value={
                      settings.taglineColor ||
                      "#ffffff"
                    }
                    onChange={(event) =>
                      updateSetting(
                        "taglineColor",
                        event.target.value
                      )
                    }
                  />

                  <input
                    type="text"
                    value={
                      settings.taglineColor
                    }
                    onChange={(event) =>
                      updateSetting(
                        "taglineColor",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="settings-field">

                <label>
                  Tagline Font
                </label>

                <select
                  value={
                    settings.taglineFontFamily
                  }
                  onChange={(event) =>
                    updateSetting(
                      "taglineFontFamily",
                      event.target.value
                    )
                  }
                >
                  <option value="system">
                    System
                  </option>

                  <option value="sans">
                    Sans
                  </option>

                  <option value="serif">
                    Serif
                  </option>

                  <option value="mono">
                    Monospace
                  </option>

                </select>

              </div>

              <div className="settings-field">

                <label>
                  Tagline Weight
                </label>

                <select
                  value={
                    settings.taglineFontWeight
                  }
                  onChange={(event) =>
                    updateSetting(
                      "taglineFontWeight",
                      Number(
                        event.target.value
                      )
                    )
                  }
                >

                  <option value="400">
                    Regular
                  </option>

                  <option value="500">
                    Medium
                  </option>

                  <option value="600">
                    Semi Bold
                  </option>

                  <option value="700">
                    Bold
                  </option>

                </select>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Tagline Shadow
                  </strong>

                  <span>
                    Add text shadow.
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle ${
                    settings.taglineShadow
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateSetting(
                      "taglineShadow",
                      !settings.taglineShadow
                    )
                  }
                >
                  <span></span>
                </button>

              </div>

              <div className="settings-divider"></div>

              <div className="settings-field">

                <label>
                  Control Panel Heading
                  <strong>
                    {settings.controlPanelHeadingSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="18"
                  max="60"
                  value={
                    settings.controlPanelHeadingSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "controlPanelHeadingSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Administration Heading
                  <strong>
                    {settings.administrationHeadingSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="14"
                  max="50"
                  value={
                    settings.administrationHeadingSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "administrationHeadingSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Login Tagline
                  <strong>
                    {settings.loginTaglineSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="8"
                  max="25"
                  value={
                    settings.loginTaglineSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginTaglineSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Patient Tagline
                  <strong>
                    {settings.patientTaglineSize}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="8"
                  max="25"
                  value={
                    settings.patientTaglineSize
                  }
                  onChange={(event) =>
                    updateSetting(
                      "patientTaglineSize",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

            </>
          )}

          {/* =================================================
              ADVANCED
          ================================================= */}

          {activeTab ===
            "advanced" && (
            <>

              <div className="editor-heading">

                <span>
                  ADVANCED
                </span>

                <h2>
                  Fine Positioning
                </h2>

                <p>
                  Fine-tune branding position and application behaviour.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name X
                  <strong>
                    {settings.nameX}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.nameX
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameX",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Hospital Name Y
                  <strong>
                    {settings.nameY}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.nameY
                  }
                  onChange={(event) =>
                    updateSetting(
                      "nameY",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Tagline X
                  <strong>
                    {settings.taglineX}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.taglineX
                  }
                  onChange={(event) =>
                    updateSetting(
                      "taglineX",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  Tagline Y
                  <strong>
                    {settings.taglineY}px
                  </strong>
                </label>

                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={
                    settings.taglineY
                  }
                  onChange={(event) =>
                    updateSetting(
                      "taglineY",
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

              </div>

              <div className="settings-divider"></div>

              <div className="settings-info-box">

                <strong>
                  Settings Storage
                </strong>

                <p>
                  Settings are stored in the HMS backend and mirrored locally in <code>hmsSettings</code> for instant Login and Super Admin synchronization.
                </p>

              </div>

              <div className="settings-info-box">

                <strong>
                  Connected Pages
                </strong>

                <ul>
                  <li>
                    Login.jsx
                  </li>

                  <li>
                    SuperAdmin.jsx
                  </li>

                  <li>
                    Settings.jsx
                  </li>
                </ul>

              </div>

            </>
          )}

        </section>

      </main>

      {/* =================================================
          BOTTOM SAVE BAR
      ================================================= */}

      <div className="settings-bottom-bar">

        <div>

          {dirty ? (
            <>
              <strong>
                You have unsaved changes
              </strong>

              <span>
                Save your changes to update Login and Super Admin.
              </span>
            </>
          ) : (
            <>
              <strong>
                All changes saved
              </strong>

              <span>
                Login and Super Admin are using the current branding.
              </span>
            </>
          )}

        </div>

        <button
          type="button"
          className="settings-save-button"
          disabled={
            saving ||
            !dirty
          }
          onClick={
            saveSettings
          }
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

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