import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarPlus,
  FaChevronDown,
  FaCheckCircle,
  FaHospital,
  FaHistory,
  FaMapMarkerAlt,
  FaUserPlus,
} from "react-icons/fa";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85";

const SERVICES = [
  {
    id: "01",
    title: "Patient Registration",
    description: "Register a new patient at the selected hospital.",
    icon: FaUserPlus,
    path: "/patients/register",
  },
  {
    id: "02",
    title: "New Appointment",
    description: "Book an appointment right after registering a new patient.",
    icon: FaCalendarPlus,
    path: "/appointments/new",
  },
  {
    id: "03",
    title: "Old Patient Appointment",
    description: "Already registered? Search with registration number, phone or name and book.",
    icon: FaHistory,
    path: "/appointments/old",
  },
];

const getHospitalId = (hospital) =>
  hospital?.id ??
  hospital?.hospital_id ??
  hospital?.hospitalId ??
  hospital?.hospitalID ??
  null;

const normalizeImage = (value) => {
  if (!value) return DEFAULT_IMAGE;
  const image = String(value).trim();
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/") ||
    image.startsWith("data:")
  ) {
    return image;
  }
  return DEFAULT_IMAGE;
};

const normalizeHospital = (hospital) => {
  if (!hospital) return null;

  return {
    ...hospital,
    id: getHospitalId(hospital) ?? null,
    name:
      hospital?.hospital_name ??
      hospital?.hospitalName ??
      hospital?.name ??
      hospital?.title ??
      "Hospital",
    address:
      hospital?.address ??
      hospital?.location ??
      hospital?.city ??
      "India",
    location:
      hospital?.location ??
      hospital?.address ??
      hospital?.city ??
      "India",
    image: normalizeImage(
      hospital?.image ??
        hospital?.image_url ??
        hospital?.imageUrl ??
        hospital?.hospital_image ??
        hospital?.hospitalImage ??
        hospital?.cover_image ??
        hospital?.coverImage ??
        hospital?.photo
    ),
  };
};

const extractHospitals = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.hospitals)) return data.hospitals;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export default function PatientServices() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalMenuOpen, setHospitalMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const routeHospital = location.state?.hospital || null;
  const routeHospitalId =
    location.state?.hospital_id ?? getHospitalId(routeHospital);

  useEffect(() => {
    let mounted = true;

    const loadHospitals = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoints = [
          `${API_BASE}/hospitals`,
          `${API_BASE}/hospital`,
        ];

        let responseData = null;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              headers: { Accept: "application/json" },
            });

            if (!response.ok) continue;

            responseData = await response.json();
            break;
          } catch (requestError) {
            console.warn("Hospital endpoint failed:", endpoint, requestError);
          }
        }

        const apiHospitals = extractHospitals(responseData);
        const normalized = apiHospitals
          .filter((hospital) => {
            if (!hospital) return false;
            if (
              hospital.is_active === false ||
              hospital.active === false ||
              String(hospital.status || "").toLowerCase() === "inactive"
            ) {
              return false;
            }
            return true;
          })
          .map(normalizeHospital)
          .filter((hospital) => {
            const id = Number(hospital.id);
            return Number.isInteger(id) && id > 0;
          });

        if (!mounted) return;

        setHospitals(normalized);

        if (normalized.length === 0) {
          setError("No active hospitals are available right now.");
        }

        const storedId = localStorage.getItem("hms_patient_hospital_id");
        const storedName = localStorage.getItem("hms_patient_hospital_name");

        const requestedId = routeHospitalId ?? storedId;

        let initialHospital = null;

        if (routeHospital) {
          initialHospital = normalizeHospital(routeHospital);
        }

        if (!initialHospital && requestedId) {
          initialHospital =
            normalized.find(
              (hospital) => String(hospital.id) === String(requestedId)
            ) || null;
        }

        if (!initialHospital && storedName) {
          initialHospital =
            normalized.find((hospital) => hospital.name === storedName) || null;
        }

        if (initialHospital) {
          setSelectedHospital(initialHospital);
        }
      } catch (loadError) {
        console.error("Patient hospital loading error:", loadError);
        if (mounted) {
          setError("Unable to load hospitals. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHospitals();

    return () => {
      mounted = false;
    };
  }, [routeHospitalId, routeHospital]);

  const displayHospitals = useMemo(() => hospitals, [hospitals]);

  const handleHospitalSelect = (hospital) => {
    const normalized = normalizeHospital(hospital);
    const hospitalId = Number(normalized.id);

    if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
      setError("Invalid hospital selected. Please select another hospital.");
      return;
    }

    setSelectedHospital({ ...normalized, id: hospitalId });
    setHospitalMenuOpen(false);
    setError("");

    localStorage.setItem("hms_patient_hospital_id", String(hospitalId));
    localStorage.setItem("hms_patient_hospital_name", normalized.name);
    localStorage.setItem(
      "hms_patient_hospital_address",
      normalized.address || ""
    );
  };

  const handleService = (service) => {
    if (!selectedHospital) {
      setError("Please select a hospital first.");
      return;
    }

    const hospitalId = Number(selectedHospital.id);

    if (!Number.isInteger(hospitalId) || hospitalId <= 0) {
      setError("Hospital selection is invalid. Please select a hospital again.");
      return;
    }

    localStorage.setItem("hms_patient_hospital_id", String(hospitalId));
    localStorage.setItem(
      "hms_patient_hospital_name",
      selectedHospital.name
    );
    localStorage.setItem(
      "hms_patient_hospital_address",
      selectedHospital.address || ""
    );

    /* Receipt ke background (logo + hospital image) ke liye */
    const logoUrl =
      selectedHospital.logo ||
      selectedHospital.logo_url ||
      selectedHospital.logoUrl ||
      selectedHospital.hospital_logo ||
      selectedHospital.hospitalLogo ||
      "";

    if (logoUrl && !String(logoUrl).startsWith("data:")) {
      localStorage.setItem("hms_patient_hospital_logo", String(logoUrl));
    } else {
      localStorage.removeItem("hms_patient_hospital_logo");
    }

    if (
      selectedHospital.image &&
      !String(selectedHospital.image).startsWith("data:")
    ) {
      localStorage.setItem(
        "hms_patient_hospital_image",
        String(selectedHospital.image)
      );
    } else {
      localStorage.removeItem("hms_patient_hospital_image");
    }

    navigate(service.path, {
      state: {
        hospital: selectedHospital,
        hospital_id: hospitalId,
      },
    });
  };

  const goBack = () => navigate("/");

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <button type="button" onClick={goBack} style={styles.backButton}>
            <FaArrowLeft />
            <span>Main Page</span>
          </button>

          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <FaHospital />
            </div>
            <div>
              <div style={styles.brandTitle}>HMS</div>
              <div style={styles.brandSubtitle}>PATIENT SERVICES</div>
            </div>
          </div>

          <div style={styles.onlineBadge}>
            <span style={styles.onlineDot} />
            ONLINE
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.kicker}>HMS PATIENT PORTAL</div>
          <h1 style={styles.title}>Select Your Hospital</h1>
          <p style={styles.description}>
            Choose the hospital where you want to register or manage your
            appointment. Your selection will be used for the complete patient
            service flow.
          </p>

          <div style={styles.selectorWrap}>
            <button
              type="button"
              onClick={() => setHospitalMenuOpen((value) => !value)}
              style={styles.selector}
              aria-expanded={hospitalMenuOpen}
            >
              <span style={styles.selectorLeft}>
                <span style={styles.selectorIcon}>
                  <FaHospital />
                </span>
                <span style={styles.selectorText}>
                  <small>SELECTED HOSPITAL</small>
                  <strong>
                    {selectedHospital?.name || "Choose a hospital"}
                  </strong>
                  <span>
                    {selectedHospital?.location || "Select hospital to continue"}
                  </span>
                </span>
              </span>
              <FaChevronDown
                style={{
                  transform: hospitalMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform .2s ease",
                }}
              />
            </button>

            {hospitalMenuOpen && (
              <div style={styles.menu}>
                {loading ? (
                  <div style={styles.menuMessage}>Loading hospitals...</div>
                ) : displayHospitals.length === 0 ? (
                  <div style={styles.menuMessage}>No hospitals available.</div>
                ) : (
                  displayHospitals.map((hospital) => {
                    const isSelected =
                      String(selectedHospital?.id) === String(hospital.id);

                    return (
                      <button
                        type="button"
                        key={String(hospital.id)}
                        onClick={() => handleHospitalSelect(hospital)}
                        style={{
                          ...styles.menuItem,
                          ...(isSelected ? styles.menuItemSelected : {}),
                        }}
                      >
                        <img
                          src={hospital.image || DEFAULT_IMAGE}
                          alt=""
                          style={styles.menuImage}
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_IMAGE;
                          }}
                        />
                        <span style={styles.menuItemText}>
                          <strong>{hospital.name}</strong>
                          <small>
                            <FaMapMarkerAlt /> {hospital.location || hospital.address || "India"}
                          </small>
                        </span>
                        {isSelected && <FaCheckCircle style={styles.checkIcon} />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {selectedHospital && (
            <div style={styles.selectedInfo}>
              <FaCheckCircle />
              <span>
                Hospital selected: <strong>{selectedHospital.name}</strong>
              </span>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
        </section>

        <section style={styles.servicesSection}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>HEALTHCARE SERVICES</div>
              <h2 style={styles.sectionTitle}>How can we help you?</h2>
              <p style={styles.sectionDescription}>
                Select a service below to continue with your selected hospital.
              </p>
            </div>
            <div style={styles.hospitalMiniCard}>
              <FaHospital />
              <span>
                <small>HOSPITAL</small>
                <strong>{selectedHospital?.name || "Not selected"}</strong>
              </span>
            </div>
          </div>

          <div style={styles.serviceGrid}>
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const disabled = !selectedHospital;

              return (
                <button
                  type="button"
                  key={service.id}
                  disabled={disabled}
                  onClick={() => handleService(service)}
                  style={{
                    ...styles.serviceCard,
                    ...(disabled ? styles.serviceCardDisabled : {}),
                  }}
                >
                  <span style={styles.serviceNumber}>{service.id}</span>
                  <span style={styles.serviceIcon}>
                    <Icon />
                  </span>
                  <span style={styles.serviceContent}>
                    <strong>{service.title}</strong>
                    <small>{service.description}</small>
                  </span>
                  <FaArrowRight style={styles.serviceArrow} />
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <span>Smart Healthcare Management</span>
        <span>HMS PATIENT SERVICES</span>
        <span>Secure &amp; Connected Healthcare</span>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 15% 15%, rgba(27, 132, 255, .14), transparent 28%), radial-gradient(circle at 85% 80%, rgba(0, 198, 166, .12), transparent 30%), #07111f",
    color: "#f4f8ff",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  backgroundGlowOne: {
    position: "fixed",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "rgba(0, 145, 255, .08)",
    filter: "blur(90px)",
    top: -180,
    left: -160,
    pointerEvents: "none",
  },
  backgroundGlowTwo: {
    position: "fixed",
    width: 440,
    height: 440,
    borderRadius: "50%",
    background: "rgba(0, 218, 178, .07)",
    filter: "blur(100px)",
    right: -180,
    bottom: -190,
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    zIndex: 5,
    borderBottom: "1px solid rgba(255,255,255,.09)",
    background: "rgba(5, 15, 28, .78)",
    backdropFilter: "blur(18px)",
  },
  headerInner: {
    width: "min(1180px, calc(100% - 36px))",
    minHeight: 76,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  backButton: {
    border: "1px solid rgba(255,255,255,.13)",
    background: "rgba(255,255,255,.05)",
    color: "#eaf2ff",
    borderRadius: 12,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    fontWeight: 700,
  },
  brand: { display: "flex", alignItems: "center", gap: 11 },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #1597ff, #00c9a7)",
    color: "white",
    fontSize: 18,
  },
  brandTitle: { fontSize: 20, fontWeight: 900, letterSpacing: 2 },
  brandSubtitle: { fontSize: 9, letterSpacing: 2.2, opacity: .62 },
  onlineBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.6,
    opacity: .8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#21d89b",
    boxShadow: "0 0 12px rgba(33,216,155,.8)",
  },
  main: {
    position: "relative",
    zIndex: 2,
    width: "min(1180px, calc(100% - 36px))",
    margin: "0 auto",
    padding: "62px 0 48px",
  },
  hero: {
    textAlign: "center",
    maxWidth: 820,
    margin: "0 auto",
  },
  kicker: {
    color: "#47c8ff",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2.8,
    marginBottom: 12,
  },
  title: { margin: 0, fontSize: "clamp(36px, 6vw, 62px)", lineHeight: 1.02 },
  description: {
    margin: "18px auto 28px",
    maxWidth: 680,
    color: "rgba(230,239,252,.68)",
    lineHeight: 1.7,
    fontSize: 15,
  },
  selectorWrap: { position: "relative", textAlign: "left", maxWidth: 760, margin: "0 auto" },
  selector: {
    width: "100%",
    border: "1px solid rgba(82, 184, 255, .3)",
    background: "linear-gradient(135deg, rgba(22,43,69,.96), rgba(10,28,48,.96))",
    color: "white",
    borderRadius: 18,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  selectorLeft: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  selectorIcon: {
    width: 50,
    height: 50,
    flex: "0 0 50px",
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "rgba(42,167,255,.12)",
    color: "#4bc8ff",
    fontSize: 20,
  },
  selectorText: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  menu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    zIndex: 20,
    padding: 8,
    border: "1px solid rgba(255,255,255,.12)",
    background: "#0c1a2b",
    borderRadius: 16,
    boxShadow: "0 25px 70px rgba(0,0,0,.45)",
    maxHeight: 330,
    overflowY: "auto",
  },
  menuItem: {
    width: "100%",
    border: 0,
    background: "transparent",
    color: "white",
    borderRadius: 12,
    padding: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  menuItemSelected: { background: "rgba(48,172,255,.1)" },
  menuImage: { width: 48, height: 48, borderRadius: 10, objectFit: "cover", flex: "0 0 48px" },
  menuItemText: { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  checkIcon: { color: "#32d7a0" },
  menuMessage: { padding: 24, textAlign: "center", color: "rgba(255,255,255,.65)" },
  selectedInfo: {
    margin: "12px auto 0",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#68e2bd",
    fontSize: 12,
  },
  error: {
    margin: "14px auto 0",
    maxWidth: 680,
    padding: "11px 14px",
    borderRadius: 10,
    background: "rgba(255,75,99,.1)",
    border: "1px solid rgba(255,75,99,.2)",
    color: "#ff9baa",
    fontSize: 12,
  },
  servicesSection: {
    marginTop: 70,
    padding: "30px 0 0",
    borderTop: "1px solid rgba(255,255,255,.08)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 22,
  },
  sectionKicker: { color: "#43c7a5", fontSize: 10, fontWeight: 900, letterSpacing: 2 },
  sectionTitle: { margin: "7px 0 5px", fontSize: "clamp(26px, 4vw, 38px)" },
  sectionDescription: { margin: 0, color: "rgba(230,239,252,.58)", fontSize: 13 },
  hospitalMiniCard: {
    minWidth: 240,
    padding: 13,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.035)",
    display: "flex",
    alignItems: "center",
    gap: 11,
    color: "#4bc8ff",
  },
  serviceGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 15 },
  serviceCard: {
    position: "relative",
    minHeight: 205,
    border: "1px solid rgba(255,255,255,.1)",
    background: "linear-gradient(145deg, rgba(18,38,61,.96), rgba(9,23,40,.96))",
    color: "white",
    borderRadius: 18,
    padding: 20,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    transition: "transform .2s ease, border-color .2s ease",
  },
  serviceCardDisabled: { opacity: .48, cursor: "not-allowed" },
  serviceNumber: { fontSize: 10, fontWeight: 900, letterSpacing: 1.5, opacity: .38 },
  serviceIcon: {
    width: 50,
    height: 50,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "rgba(44,181,255,.1)",
    color: "#48c8ff",
    fontSize: 19,
    marginTop: 18,
  },
  serviceContent: { display: "flex", flexDirection: "column", gap: 7, marginTop: 17 },
  serviceArrow: { marginTop: "auto", marginLeft: "auto", opacity: .65 },
  footer: {
    position: "relative",
    zIndex: 2,
    width: "min(1180px, calc(100% - 36px))",
    margin: "0 auto",
    padding: "20px 0 28px",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    color: "rgba(230,239,252,.42)",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    borderTop: "1px solid rgba(255,255,255,.06)",
  },
};

styles.selectorText["small"] = {
  fontSize: 9,
  letterSpacing: 1.6,
  color: "#51c9ff",
  fontWeight: 900,
};
styles.selectorText["strong"] = {
  fontSize: 16,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
styles.selectorText["span"] = { fontSize: 11, color: "rgba(230,239,252,.55)" };
styles.menuItemText["strong"] = { fontSize: 13 };
styles.menuItemText["small"] = {
  fontSize: 10,
  color: "rgba(230,239,252,.55)",
  display: "flex",
  alignItems: "center",
  gap: 5,
};
styles.hospitalMiniCard["span"] = { display: "flex", flexDirection: "column", minWidth: 0 };
styles.hospitalMiniCard["span"]["small"] = { fontSize: 8, letterSpacing: 1.3, opacity: .5 };
styles.hospitalMiniCard["span"]["strong"] = {
  fontSize: 11,
  color: "#f4f8ff",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
styles.serviceContent["strong"] = { fontSize: 18 };
styles.serviceContent["small"] = { fontSize: 11, lineHeight: 1.55, color: "rgba(230,239,252,.55)" };

if (typeof window !== "undefined") {
  const styleId = "hms-patient-services-responsive";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: 900px) {
        .hms-patient-services-placeholder {}
      }
    `;
    document.head.appendChild(style);
  }
}