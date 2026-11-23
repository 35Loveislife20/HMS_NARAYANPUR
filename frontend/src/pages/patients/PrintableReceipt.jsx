import { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";

import "./PrintableReceipt.css";

/* =========================================================
   Shared printable receipt — Registration + Appointment

   Header layout:
     [logo]   Hospital naam / address   [QR code]
     badge + title, check icon

   QR data OPD entry ke liye:
     RCPT|REG|DOC|DATE|TIME
========================================================= */

const PRINT_CLASS = "hms-receipt-printing";

const KEYS = {
  name: "hms_patient_hospital_name",
  address: "hms_patient_hospital_address",
  logo: "hms_patient_hospital_logo",
  image: "hms_patient_hospital_image",
};

const readStored = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const cleanText = (value) => {
  const text = String(value || "").trim();
  return text && !/unavailable/i.test(text) ? text : "";
};

const cleanAddress = (value) => {
  const text = cleanText(value);
  return text.toLowerCase() === "india" ? "" : text;
};

const pickUrl = (...values) => {
  for (const value of values) {
    const text = String(value || "").trim();

    if (
      text &&
      (/^(https?:)?\/\//i.test(text) ||
        text.startsWith("/") ||
        text.startsWith("data:image"))
    ) {
      return text;
    }
  }

  return "";
};

/* QR ke andar ka data: OPD counter par scan karke verify hoga */
const buildQrValue = (data) => {
  const parts = [
    data.receiptNo ? `RCPT:${data.receiptNo}` : null,
    data.registrationNo ? `REG:${data.registrationNo}` : null,
    data.doctorId ? `DOC:${data.doctorId}` : null,
    data.date ? `DATE:${data.date}` : null,
    data.time ? `TIME:${data.time}` : null,
  ].filter(Boolean);

  return parts.join("|");
};

function PrintableReceipt({
  data = {},
  hospital = null,
  variant = "registration",
  badge = "",
  title = "",
  note = "",
}) {
  const isRegistration = variant === "registration";

  const hospitalName =
    cleanText(data.hospital) ||
    cleanText(
      hospital?.name ||
        hospital?.hospital_name ||
        hospital?.hospitalName
    ) ||
    cleanText(readStored(KEYS.name));

  const hospitalAddress =
    cleanAddress(data.hospitalAddress) ||
    cleanAddress(hospital?.address) ||
    cleanAddress(hospital?.location) ||
    cleanAddress(hospital?.city) ||
    cleanAddress(readStored(KEYS.address));

  const hospitalLogo =
    pickUrl(
      data.hospitalLogo,
      hospital?.logo,
      hospital?.logo_url,
      hospital?.logoUrl,
      hospital?.hospital_logo,
      hospital?.hospitalLogo
    ) || pickUrl(readStored(KEYS.logo));

  const hospitalImage =
    pickUrl(
      data.hospitalImage,
      hospital?.image,
      hospital?.image_url,
      hospital?.imageUrl,
      hospital?.hospital_image,
      hospital?.hospitalImage,
      hospital?.cover_image,
      hospital?.coverImage,
      hospital?.photo
    ) || pickUrl(readStored(KEYS.image));

  const qrValue = buildQrValue(data);

  /* Reload / agle page par bhi dikhe (base64 store nahi karte) */
  useEffect(() => {
    try {
      if (hospitalLogo && !hospitalLogo.startsWith("data:")) {
        localStorage.setItem(KEYS.logo, hospitalLogo);
      }

      if (hospitalImage && !hospitalImage.startsWith("data:")) {
        localStorage.setItem(KEYS.image, hospitalImage);
      }
    } catch {
      /* storage blocked / full — ignore */
    }
  }, [hospitalLogo, hospitalImage]);

  const handlePrint = () => {
    const cleanup = () => {
      document.body.classList.remove(PRINT_CLASS);
      window.removeEventListener("afterprint", cleanup);
    };

    document.body.classList.add(PRINT_CLASS);
    window.addEventListener("afterprint", cleanup);

    window.print();
  };

  const hideBroken = (event) => {
    event.currentTarget.style.display = "none";
  };

  return (
    <div className="hms-receipt">

      {hospitalImage && (
        <div className="hms-receipt-bg" aria-hidden="true">
          <img
            className="hms-receipt-bg-image"
            src={hospitalImage}
            alt=""
            onError={hideBroken}
          />
        </div>
      )}

      <div className="hms-receipt-top">
        {hospitalLogo && (
          <div className="hms-receipt-top-logo">
            <img
              src={hospitalLogo}
              alt="Hospital logo"
              onError={hideBroken}
            />
          </div>
        )}

        <div className="hms-receipt-top-center">
          {hospitalName && (
            <>
              <strong>{hospitalName}</strong>
              {hospitalAddress && <span>{hospitalAddress}</span>}
            </>
          )}
        </div>

        {qrValue && (
          <div className="hms-receipt-top-qr">
            <QRCodeSVG value={qrValue} size={84} level="M" />
          </div>
        )}
      </div>

      <div className="hms-receipt-divider" />

      <div className="hms-receipt-header">
        <div>
          <span className="hms-receipt-badge">
            {badge || (isRegistration ? "Registration" : "Appointment")}
          </span>

          <h3>
            {title ||
              (isRegistration
                ? "Registration Receipt"
                : "Appointment Receipt")}
          </h3>
        </div>

        <div className="hms-receipt-check">
          <FaCheckCircle />
        </div>
      </div>

      <div className="hms-receipt-line" />

      <table>
        <tbody>
          {data.receiptNo && (
            <tr>
              <td>Receipt No.</td>
              <td>
                <strong>{data.receiptNo}</strong>
              </td>
            </tr>
          )}

          {data.registrationNo && (
            <tr>
              <td>Registration No.</td>
              <td>
                <strong>{data.registrationNo}</strong>
              </td>
            </tr>
          )}

          {data.patient && (
            <tr>
              <td>Patient</td>
              <td>
                <strong>{data.patient}</strong>
              </td>
            </tr>
          )}

          {data.doctor && (
            <tr>
              <td>Doctor</td>
              <td>
                <strong>{data.doctor}</strong>
              </td>
            </tr>
          )}

          {data.date && (
            <tr>
              <td>Appointment</td>
              <td>
                <strong>
                  {data.date}
                  {data.time ? `, ${data.time}` : ""}
                </strong>
              </td>
            </tr>
          )}

          {data.fee !== undefined && data.fee !== null && (
            <tr>
              <td>
                {isRegistration ? "Registration Fee" : "Amount Paid"}
              </td>
              <td>
                <strong>
                  ₹{Number(data.fee || 0).toLocaleString("en-IN")}
                  {data.paymentMode ? ` (${data.paymentMode})` : ""}
                </strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="hms-receipt-note">
        {note ||
          (isRegistration
            ? "Registration Number sambhal kar rakhein. Agli visit mein yeh zaroor laayein."
            : "Appointment ke din yeh receipt aur Registration Number lekar aayein.")}
      </div>

      <div className="hms-receipt-actions">
        <button
          type="button"
          className="hms-receipt-print-button"
          onClick={handlePrint}
        >
          🖨 Print Receipt
        </button>
      </div>
    </div>
  );
}

export default PrintableReceipt;