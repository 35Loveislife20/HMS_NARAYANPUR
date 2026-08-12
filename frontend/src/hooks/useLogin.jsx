import { useState } from "react";
import api from "../services/api";

const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const login = async (email, password) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const data = response.data;

            if (!data.success) {
                throw new Error(
                    data.message || "Login failed"
                );
            }

            const token = data.token || data.data?.token;
            const user = data.user || data.data?.user;

            if (!token) {
                throw new Error("Token not received from server");
            }

            localStorage.setItem("hms_token", token);

            if (user) {
                localStorage.setItem(
                    "hms_user",
                    JSON.stringify(user)
                );
            }

            return {
                success: true,
                token,
                user,
            };

        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Login failed";

            setError(message);

            return {
                success: false,
                message,
            };

        } finally {
            setLoading(false);
        }
    };

    return {
        login,
        loading,
        error,
    };
};

export default useLogin;