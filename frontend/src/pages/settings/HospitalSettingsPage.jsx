import { useNavigate } from "react-router-dom";
import HospitalSettings from "./HospitalSettings";

/*
  /settings route par Hospital Admin ke liye.
  Logged-in user ka hospital_id nikal kar HospitalSettings ko deta hai
  aur Cancel / X dabane par pichhle page par wapas bhejta hai.
*/

const readLoggedInUser = () => {
    const keys = ["hms_user", "user", "authUser", "currentUser"];

    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") return parsed;
        } catch {
            /* agli key try karein */
        }
    }

    return {};
};

function HospitalSettingsPage() {
    const navigate = useNavigate();

    const user = readLoggedInUser();

    const hospitalId =
        user.hospital_id ??
        user.hospitalId ??
        user.hospital?.id ??
        localStorage.getItem("hospital_id") ??
        localStorage.getItem("hospitalId") ??
        "";

    return (
        <HospitalSettings
            hospitalId={hospitalId}
            onClose={() => navigate(-1)}
        />
    );
}

export default HospitalSettingsPage;