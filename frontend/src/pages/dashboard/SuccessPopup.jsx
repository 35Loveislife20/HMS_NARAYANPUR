import { useEffect, useRef } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

import "./SuccessPopup.css";

function SuccessPopup({
    open,
    title = "Success",
    message = "",
    onClose,
    autoCloseMs = 0,
}) {
    /* onClose ko ref me rakhte hain taaki parent ke re-render par timer reset na ho */
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKey = (event) => {
            if (event.key === "Escape") {
                onCloseRef.current?.();
            }
        };

        window.addEventListener("keydown", handleKey);

        const timer =
            autoCloseMs > 0
                ? setTimeout(() => {
                      onCloseRef.current?.();
                  }, autoCloseMs)
                : null;

        return () => {
            window.removeEventListener("keydown", handleKey);

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [open, autoCloseMs]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="success-popup-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div
                className="success-popup"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="success-popup-title"
                aria-describedby="success-popup-message"
            >
                <button
                    type="button"
                    className="success-popup-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>

                <div className="success-popup-icon">
                    <FaCheckCircle />
                </div>

                <h3 id="success-popup-title">{title}</h3>

                <p id="success-popup-message">{message}</p>

                <button
                    type="button"
                    className="success-popup-ok"
                    onClick={onClose}
                    autoFocus
                >
                    OK
                </button>
            </div>
        </div>
    );
}

export default SuccessPopup;