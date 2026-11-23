import { useEffect, useRef } from "react";
import "./SuccessPopup.css";

/*
  Shared emboss success popup.
  Props:
    open         - boolean, popup dikhana hai ya nahi
    title        - heading (default "Success")
    message      - chhota text
    buttonLabel  - button text (default "Continue")
    showButton   - false = button nahi dikhana (default true)
    autoCloseMs  - 0 = auto close nahi; warna itne ms baad onClose
    onClose      - Continue / auto close / Esc par call hota hai
*/
function SuccessPopup({
    open,
    title = "Success",
    message = "",
    buttonLabel = "Continue",
    autoCloseMs = 0,
    showButton = true,
    onClose,
}) {
    const closeRef = useRef(onClose);

    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        let timer = null;

        if (autoCloseMs > 0) {
            timer = window.setTimeout(() => {
                closeRef.current?.();
            }, autoCloseMs);
        }

        const onKey = (e) => {
            if (e.key === "Escape" || e.key === "Enter") {
                closeRef.current?.();
            }
        };

        window.addEventListener("keydown", onKey);

        return () => {
            if (timer) window.clearTimeout(timer);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, autoCloseMs]);

    if (!open) return null;

    return (
        <div
            className="hms-success-backdrop"
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

                <h3 id="hms-success-title">{title}</h3>

                {message && <p>{message}</p>}

                {showButton && (
                    <button
                        type="button"
                        className="hms-success-button"
                        onClick={() => closeRef.current?.()}
                        autoFocus
                    >
                        {buttonLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

export default SuccessPopup;