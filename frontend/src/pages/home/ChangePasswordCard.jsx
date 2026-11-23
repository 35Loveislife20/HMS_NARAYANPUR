import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./change-password-card.css";
import SuccessPopup from "./SuccessPopup";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MIN_LENGTH = 6;

function EyeIcon({ open }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
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
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled,
  autoFocus,
}) {
  return (
    <div className="cpw-field">
      <label htmlFor={id}>{label}</label>

      <div className="cpw-input-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          autoFocus={autoFocus}
          required
        />

        <button
          type="button"
          className="cpw-eye"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={visible ? "पासवर्ड छिपाएँ" : "पासवर्ड दिखाएँ"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordCard({
  forced = false,
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState(null);

  const closePopup = () => {
    const data = popup?.data;
    setPopup(null);
    if (onSuccess) onSuccess(data);
  };

  const setField = (name) => (event) => {
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
    setMessage({ type: "", text: "" });
  };

  const toggle = (name) => () =>
    setVisible((prev) => ({ ...prev, [name]: !prev[name] }));

  const validate = () => {
    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      return "कृपया सभी फ़ील्ड भरें।";
    }

    if (form.newPassword.length < MIN_LENGTH) {
      return `नया पासवर्ड कम से कम ${MIN_LENGTH} अक्षरों का होना चाहिए।`;
    }

    if (form.newPassword !== form.confirmPassword) {
      return "नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।";
    }

    if (form.newPassword === form.currentPassword) {
      return "नया पासवर्ड वर्तमान पासवर्ड से अलग होना चाहिए।";
    }

    return "";
  };

  const clearStoredAuth = () => {
    try {
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
    } catch {
      /* ignore */
    }

    window.dispatchEvent(new Event("hmsAuthUpdated"));
  };

  const markPasswordChangedInStorage = () => {
    try {
      const raw = localStorage.getItem("hms_user");

      if (raw) {
        const stored = JSON.parse(raw);
        stored.must_change_password = false;
        localStorage.setItem("hms_user", JSON.stringify(stored));
      }
    } catch {
      /* ignore */
    }

    window.dispatchEvent(new Event("hmsAuthUpdated"));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || popup) {
      return;
    }

    const problem = validate();

    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }

    const token = localStorage.getItem("hms_token");

    if (!token) {
      setMessage({
        type: "error",
        text: "आपका सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message || "पासवर्ड बदलने में असमर्थ। कृपया पुनः प्रयास करें।"
        );
      }

      markPasswordChangedInStorage();

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPopup({ data });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "पासवर्ड बदलने में असमर्थ।",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (forced) {
      clearStoredAuth();
    }

    if (onCancel) {
      onCancel();
    }
  };

  const card = (
    <div className={`cpw-card${forced ? " cpw-card-forced" : ""}`}>
      <div className="cpw-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>

      <h3 id="cpw-title">
        {forced ? "नया पासवर्ड सेट करें" : "पासवर्ड बदलें"}
      </h3>

      <p className="cpw-subtitle">
        {forced
          ? "आप अस्थायी पासवर्ड का उपयोग कर रहे हैं। आगे बढ़ने के लिए कृपया नया पासवर्ड सेट करें।"
          : "अपना वर्तमान पासवर्ड दर्ज करें और नया पासवर्ड चुनें।"}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="cpw-current"
          label={forced ? "अस्थायी / वर्तमान पासवर्ड" : "वर्तमान पासवर्ड"}
          value={form.currentPassword}
          onChange={setField("currentPassword")}
          visible={visible.current}
          onToggle={toggle("current")}
          autoComplete="current-password"
          disabled={loading}
          autoFocus
        />

        <PasswordField
          id="cpw-new"
          label="नया पासवर्ड"
          value={form.newPassword}
          onChange={setField("newPassword")}
          visible={visible.next}
          onToggle={toggle("next")}
          autoComplete="new-password"
          disabled={loading}
        />

        <PasswordField
          id="cpw-confirm"
          label="नए पासवर्ड की पुष्टि करें"
          value={form.confirmPassword}
          onChange={setField("confirmPassword")}
          visible={visible.confirm}
          onToggle={toggle("confirm")}
          autoComplete="new-password"
          disabled={loading}
        />

        <p className="cpw-hint">
          कम से कम {MIN_LENGTH} अक्षर रखें और वर्तमान पासवर्ड से अलग पासवर्ड चुनें।
        </p>

        {message.text && (
          <div
            className={`cpw-message cpw-message-${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.text}
          </div>
        )}

        <div className="cpw-actions">
          <button
            type="submit"
            className="cpw-submit"
            disabled={loading}
          >
            {loading ? "सेव हो रहा है..." : "पासवर्ड सेव करें"}
          </button>

          {(forced || onCancel) && (
            <button
              type="button"
              className="cpw-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              {forced ? "लॉगआउट करें" : "रद्द करें"}
            </button>
          )}
        </div>
      </form>

      {popup && (
        <SuccessPopup
          title="पासवर्ड बदल गया"
          message="आपका पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है।"
          autoCloseMs={2200}
          onClose={closePopup}
        />
      )}
    </div>
  );

  if (!forced) {
    return card;
  }

  return createPortal(
    <div
      className="cpw-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cpw-title"
    >
      {card}
    </div>,
    document.body
  );
}