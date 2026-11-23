import React from "react";
import { useLocation } from "react-router-dom";

import SharedReceipt from "../patients/PrintableReceipt";
import "./Appointmentpayment.css";

export const PAYMENT_MODES = [
    "Cash",
    "UPI",
    "Card",
    "Net Banking",
];

export const VARIANTS = {
    registration: {
        badge: "Registration",
        receiptTitle: "Registration Receipt",
        chargeLabel: "Registration Charge",
        hint: "Registration Number sambhal kar rakhein. Agli visit mein yeh zaroor laayein.",
    },

    new: {
        badge: "New Patient",
        receiptTitle: "New Patient Appointment Receipt",
        chargeLabel: "Appointment Charge",
        hint: "Appointment ke din yeh receipt aur Registration Number lekar aayein.",
    },

    old: {
        badge: "Old Patient",
        receiptTitle: "Old Patient Appointment Receipt",
        chargeLabel: "Appointment Charge",
        hint: "Appointment ke din yeh receipt aur apna Registration Number lekar aayein.",
    },
};

const getVariant = (variant) => {
    return VARIANTS[variant] ? variant : "new";
};

export const getDoctorFee = (doctor) => {
    if (!doctor) return 0;

    const keys = [
        "consultation_fee",
        "appointment_fee",
        "opd_fee",
        "fee",
        "charge",
        "charges",
    ];

    for (const key of keys) {
        const raw = doctor[key];

        if (
            raw === "" ||
            raw === null ||
            raw === undefined
        ) {
            continue;
        }

        const value = Number(raw);

        if (Number.isFinite(value)) {
            return value;
        }
    }

    return 0;
};

export function PaymentSection({
    doctor,
    fee: feeProp,
    variant = "new",
    mode = "",
    onMode,
}) {
    const type = getVariant(variant);

    if (
        !doctor &&
        (feeProp === undefined ||
            feeProp === null)
    ) {
        return null;
    }

    const fee =
        feeProp !== undefined &&
        feeProp !== null
            ? feeProp
            : getDoctorFee(doctor);

    return (
        <section className={`apay-box apay--${type}`}>
            <div className="apay-header">
                <div>
                    <span className="apay-badge">
                        {VARIANTS[type].badge}
                    </span>

                    <h3>Payment Details</h3>
                </div>

                <div className="apay-fee">
                    <span>
                        {VARIANTS[type].chargeLabel}
                    </span>

                    <strong>
                        ₹
                        {Number(
                            fee || 0
                        ).toLocaleString("en-IN")}
                    </strong>
                </div>
            </div>

            <div className="apay-divider" />

            <div
                className="apay-modes"
                role="radiogroup"
                aria-label="Payment mode"
            >
                {PAYMENT_MODES.map((item) => (
                    <label
                        key={item}
                        className={`apay-mode ${
                            mode === item
                                ? "on"
                                : ""
                        }`}
                    >
                        <input
                            type="radio"
                            name={`payment_mode_${type}`}
                            value={item}
                            checked={mode === item}
                            onChange={() => {
                                if (
                                    typeof onMode ===
                                    "function"
                                ) {
                                    onMode(item);
                                }
                            }}
                        />

                        <span className="apay-radio" />

                        <span className="apay-mode-text">
                            {item}
                        </span>
                    </label>
                ))}
            </div>
        </section>
    );
}

/* Receipt ab shared component se banti hai (hospital naam + address,
   transparent logo/image, sahi print). Yahan sirf variant ka text jaata hai. */
export function PrintableReceipt({
    data = {},
    variant = "new",
}) {
    const type = getVariant(variant);
    const meta = VARIANTS[type];
    const location = useLocation();

    return (
        <SharedReceipt
            variant={
                type === "registration"
                    ? "registration"
                    : "appointment"
            }
            badge={meta.badge}
            title={meta.receiptTitle}
            note={meta.hint}
            hospital={location.state?.hospital || null}
            data={data}
        />
    );
}
