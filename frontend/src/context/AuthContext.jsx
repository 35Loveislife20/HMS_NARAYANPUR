import { createContext, useContext, useState } from "react";
import { loginUser } from "../services/auth.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("hms_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (email, password) => {
        const data = await loginUser({
            email,
            password,
        });

        localStorage.setItem("hms_token", data.token);
        localStorage.setItem("hms_user", JSON.stringify(data.user));

        setUser(data.user);

        return data;
    };

    const logout = () => {
        localStorage.removeItem("hms_token");
        localStorage.removeItem("hms_user");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);