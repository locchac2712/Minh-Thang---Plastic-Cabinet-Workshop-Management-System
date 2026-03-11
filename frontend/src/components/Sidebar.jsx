import "./Sidebar.css";
import { NavItem } from "./NavItem";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
    { id: "bom",       label: "Manage BOM",        icon: "" },
    { id: "plan",      label: "Plan Production",    icon: "" },
    { id: "workorder", label: "Execute Work Order", icon: "" },
    { id: "material",  label: "Control Material",   icon: "" },
    { id: "products",   label: "Products",           icon: "" },
    { id: "monitor",   label: "Monitor Production", icon: "" },
];

export const Sidebar = ({ activePage, onNavigate }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        // Redirect về trang login (reload là cách đơn giản nhất vì App.jsx sẽ show LoginModal)
        window.location.href = window.location.origin;
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-icon">⚙</span>
                <span className="logo-text">ProManager</span>
            </div>

            <div className="sidebar-section-label">Main Menu</div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.id}
                        item={item}
                        isActive={activePage === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>

            <div className="sidebar-footer">
                {user && (
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Đăng xuất
                    </button>
                )}
                <span className="sidebar-version">v1.0.0</span>
            </div>
        </aside>
    );
};