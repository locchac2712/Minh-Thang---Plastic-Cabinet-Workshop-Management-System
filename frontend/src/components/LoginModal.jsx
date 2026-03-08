import { useState } from "react";
import "./LoginModal.css";
import { useAuth } from "../context/AuthContext";

export const LoginModal = ({ onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (username.trim()) {
      login(username.trim());
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-icon"></div>
        <h2 className="modal-title">Sign In</h2>
        <p className="modal-subtitle">
          Access your Production Manager workspace
        </p>

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button className="btn btn--primary btn--full" onClick={handleSubmit}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
