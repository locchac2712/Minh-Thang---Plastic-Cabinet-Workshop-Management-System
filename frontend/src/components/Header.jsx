import "./Header.css";
import { useAuth } from "../context/AuthContext";

export const Header = ({ pageTitle }) => {
    const { user } = useAuth();

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">{pageTitle}</h1>
            </div>
            <div className="header-right">
                {user && (
                    <div className="header-user-info">
                        <div className="header-avatar">👤</div>
                        <div className="header-user-details">
                            <span className="header-user-name">{user.username}</span>
                            <span className="header-user-role">{user.role}</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};