import { useAuth } from "../../context/AuthContext";
import "./Header.css";

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="header">

            <div>
                <h1>Dashboard</h1>
                <p>
                    Welcome back to Hospital Management System
                </p>
            </div>

            <div className="header-right">

                <button className="notification-btn">
                    🔔
                </button>

                <div className="user-profile">

                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <strong>{user?.name}</strong>
                        <span>{user?.role}</span>
                    </div>

                </div>

            </div>

        </header>
    );
};

export default Header;