import React, { useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaHospital,
  FaUserShield,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaCircleNotch,
} from "react-icons/fa";
import "./LoginCard.css";

/*
  Props
  - roles:      [{ id: "admin", name: "Admin" }, ...]
  - hospitals:  [{ id: "630001", name: "GMS Hospital Bareilly" }, ...]
  - onLogin:    async ({ role, hospital, email, password, rememberMe }) => void
                throw an Error with a message to show it on the card
  - onForgot:   optional, called when "Forgot Password?" is clicked
  - logoSrc:    optional, defaults to "/hms-logo.png"
  - title:      optional, defaults to "Admin & Staff Login"
*/

export default function LoginCard({
  roles = [],
  hospitals = [],
  onLogin,
  onForgot,
  logoSrc = "/hms-logo.png",
  title = "Admin & Staff Login",
}) {
  const [role, setRole] = useState("");
  const [hospital, setHospital] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!role) return setError("Please select a role.");
    if (!hospital) return setError("Please select a hospital.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!password.trim()) return setError("Please enter your password.");

    setLoading(true);
    try {
      await onLogin?.({
        role,
        hospital,
        email: email.trim(),
        password,
        rememberMe,
      });
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lc-wrap">
      <div className="lc-card">
        <div className="lc-logo-ring">
          {logoFailed ? (
            <span className="lc-logo-fallback">HMS</span>
          ) : (
            <img
              src={logoSrc}
              alt="HMS logo"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>

        <h2 className="lc-title">{title}</h2>
        <div className="lc-underline" />

        <form className="lc-form" onSubmit={handleSubmit} noValidate>
          <Field icon={<FaUserShield />}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>

          <Field icon={<FaHospital />}>
            <select
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              disabled={loading}
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>

          <Field icon={<FaEnvelope />}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </Field>

          <Field icon={<FaLock />}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="lc-eye"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </Field>

          <div className="lc-row">
            <label className="lc-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>

            <button
              type="button"
              className="lc-link"
              onClick={onForgot}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          {error && <div className="lc-error">{error}</div>}

          <button type="submit" className="lc-submit" disabled={loading}>
            {loading ? (
              <>
                <FaCircleNotch className="lc-spin" /> Logging in...
              </>
            ) : (
              "LOGIN"
            )}
          </button>
        </form>

        <div className="lc-footer">
          <FaShieldAlt /> Secure &bull; Authorized Staff Only
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }) {
  return (
    <div className="lc-field">
      <span className="lc-field-icon">{icon}</span>
      {children}
    </div>
  );
}