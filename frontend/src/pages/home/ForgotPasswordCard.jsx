import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./change-password-card.css";
import SuccessPopup from "./SuccessPopup";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MIN_LENGTH = 6;

export default function ForgotPasswordCard({
  mode = "request",
  token = "",
  defaultEmail = "",
  onClose,
  onDone,
}) {
  const isReset = mode === "reset";

  const [email, setEmail] = useState(defaultEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  /* null या { title, text, auto } */
  const [popup, setPopup] = useState(null);

  const clearMessage = () => setMessage({ type: "", text: "" });

  const closePopup = () => {
    setPopup(null);

    if (isReset) {
      if (onDone) onDone();
    } else if (onClose) {
      onClose();
    }
  };

  const post = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.message || "कुछ गलत हो गया है। कृपया दोबारा प्रयास करें।"
      );
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || finished) return;

    clearMessage();

    if (!isReset) {
      const cleanEmail = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setMessage({
          type: "error",
          text: "कृपया सही ईमेल पता दर्ज करें।",
        });
        return;
      }

      setLoading(true);

      try {
        const data = await post("/auth/forgot-password", {
          email: cleanEmail,
        });

        setFinished(true);
        setPopup({
          title: "रीसेट लिंक भेज दिया गया",
          text:
            data?.message ||
            "यदि यह ईमेल पंजीकृत है, तो पासवर्ड रीसेट करने के निर्देश भेज दिए गए हैं।",
          auto: 0,
        });
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setLoading(false);
      }

      return;
    }

    /* ---------- पासवर्ड रीसेट ---------- */

    if (!password || !confirmPassword) {
      setMessage({
        type: "error",
        text: "कृपया पासवर्ड के दोनों फ़ील्ड भरें।",
      });
      return;
    }

    if (password.length < MIN_LENGTH) {
      setMessage({
        type: "error",
        text: `पासवर्ड कम से कम ${MIN_LENGTH} अक्षरों का होना चाहिए।`,
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "दोनों पासवर्ड मेल नहीं खाते हैं।",
      });
      return;
    }

    setLoading(true);

    try {
      await post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });

      setFinished(true);
      setPopup({
        title: "पासवर्ड सफलतापूर्वक बदल दिया गया",
        text: "आपका पासवर्ड बदल दिया गया है। अब आप लॉगिन कर सकते हैं।",
        auto: 3000,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="cpw-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fpw-title"
    >
      <div className="cpw-card cpw-card-forced">
        <div className="cpw-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isReset ? (
              <>
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </>
            ) : (
              <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </>
            )}
          </svg>
        </div>

        <h3 id="fpw-title">
          {isReset ? "पासवर्ड रीसेट करें" : "पासवर्ड भूल गए?"}
        </h3>

        <p className="cpw-subtitle">
          {isReset
            ? "अपने खाते के लिए नया पासवर्ड चुनें।"
            : "अपना पंजीकृत ईमेल दर्ज करें। हम आपको पासवर्ड रीसेट लिंक भेजेंगे (यह 15 मिनट तक मान्य रहेगा)।"}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {!isReset ? (
            <div className="cpw-field">
              <label htmlFor="fpw-email">ईमेल पता</label>

              <div className="cpw-input-wrap">
                <input
                  id="fpw-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearMessage();
                  }}
                  autoComplete="email"
                  disabled={loading || finished}
                  autoFocus
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div className="cpw-field">
                <label htmlFor="fpw-new">नया पासवर्ड</label>

                <div className="cpw-input-wrap">
                  <input
                    id="fpw-new"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearMessage();
                    }}
                    autoComplete="new-password"
                    disabled={loading || finished}
                    autoFocus
                    required
                  />

                  <button
                    type="button"
                    className="cpw-eye"
                    onClick={() => setShowPassword((value) => !value)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "पासवर्ड छिपाएं" : "पासवर्ड दिखाएं"
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="cpw-field">
                <label htmlFor="fpw-confirm">नए पासवर्ड की पुष्टि करें</label>

                <div className="cpw-input-wrap">
                  <input
                    id="fpw-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearMessage();
                    }}
                    autoComplete="new-password"
                    disabled={loading || finished}
                    required
                  />
                </div>
              </div>

              <p className="cpw-hint">
                पासवर्ड कम से कम {MIN_LENGTH} अक्षरों का होना चाहिए।
              </p>
            </>
          )}

          {message.text && (
            <div
              className={`cpw-message cpw-message-${message.type}`}
              role={message.type === "error" ? "alert" : "status"}
            >
              {message.text}
            </div>
          )}

          <div className="cpw-actions">
            {!finished && (
              <button
                type="submit"
                className="cpw-submit"
                disabled={loading}
              >
                {loading
                  ? "कृपया प्रतीक्षा करें..."
                  : isReset
                  ? "पासवर्ड रीसेट करें"
                  : "रीसेट लिंक भेजें"}
              </button>
            )}

            <button
              type="button"
              className="cpw-secondary"
              onClick={() =>
                finished && isReset && onDone
                  ? onDone()
                  : onClose && onClose()
              }
              disabled={loading}
            >
              {finished && isReset
                ? "लॉगिन करें"
                : "लॉगिन पर वापस जाएं"}
            </button>
          </div>
        </form>
      </div>

      {popup && (
        <SuccessPopup
          title={popup.title}
          message={popup.text}
          autoCloseMs={popup.auto}
          onClose={closePopup}
        />
      )}
    </div>,
    document.body
  );
}