import "./Header.css";
import { useAuth } from "../context/AuthContext";

export const Header = ({ pageTitle, onLoginClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {user ? (
          <div className="header-user-area">
            <div className="header-user-info">
              <div className="header-avatar">👤</div>
              <div className="header-user-details">
                <span className="header-user-name">{user.username}</span>
                <span className="header-user-role">{user.role}</span>
              </div>
            </div>
            <button className="btn btn--logout" onClick={logout}>
              <span>⎋</span> Logout
            </button>
          </div>
        ) : (
          <button className="btn btn--login" onClick={onLoginClick}>
            <span>→</span> Login
          </button>
        )}
      </div>
    </header>
  );
};
