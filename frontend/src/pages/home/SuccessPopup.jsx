
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* Shared success popup.
   Styles (.hms-success-*) otp-card-theme.css me hain,
   jo Home.jsx already import karta hai. */

export default function SuccessPopup({
  title,
  message = "",
  buttonText = "ठीक है",
  autoCloseMs = 0,
  onClose,
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!autoCloseMs) return undefined;

    const timer = window.setTimeout(() => {
      if (closeRef.current) closeRef.current();
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [autoCloseMs]);

  return createPortal(
    <div
      className="hms-success-backdrop"
      style={{ zIndex: 100005 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="hms-popup-title"
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

        <h3 id="hms-popup-title">{title}</h3>

        {message && <p>{message}</p>}

        {buttonText && (
          <button
            type="button"
            className="hms-success-button"
            onClick={() => onClose && onClose()}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
