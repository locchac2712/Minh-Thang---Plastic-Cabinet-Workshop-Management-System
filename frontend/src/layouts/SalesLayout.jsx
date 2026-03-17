import { useState } from "react";
import "./SalesLayout.css";
import { useAuth } from "../context/AuthContext";
import { SalesDashboard } from "../pages/sales/SalesDashboard";
import { SalesProducts }  from "../pages/sales/SalesProducts";
import { SalesCustomers } from "../pages/sales/SalesCustomers";
import { SalesQuotes }    from "../pages/sales/SalesQuotes";
import { SalesOrders }    from "../pages/sales/SalesOrders";

const NAV = [
    { id: "dashboard", label: "Dashboard",    icon: "⊞" },
    { id: "products",  label: "Sản phẩm",     icon: "☰" },
    { id: "customers", label: "Khách hàng",   icon: "○" },
    { id: "quotes",    label: "Báo giá",      icon: "◻" },
    { id: "orders",    label: "Đơn bán hàng", icon: "◻" },
    { id: "delivery",  label: "Giao hàng",    icon: "◻" },
];

const PAGE_TITLES = {
    dashboard: "Dashboard Bán hàng",
    products:  "Sản phẩm",
    customers: "Khách hàng",
    quotes:    "Báo giá",
    orders:    "Đơn bán hàng",
    delivery:  "Giao hàng",
};

export const SalesLayout = () => {
    const { user, logout } = useAuth();
    const [page, setPage] = useState("dashboard");

    const handleLogout = () => { logout(); window.location.href = window.location.origin; };

    const renderPage = () => {
        switch (page) {
            case "dashboard": return <SalesDashboard onNavigate={setPage} />;
            case "products":  return <SalesProducts />;
            case "customers": return <SalesCustomers />;
            case "quotes":    return <SalesQuotes />;
            case "orders":    return <SalesOrders />;
            default:          return <SalesDashboard onNavigate={setPage} />;
        }
    };

    return (
        <div className="sl-layout">
            {/* Sidebar */}
            <aside className="sl-sidebar">
                <div className="sl-logo">
                    <div className="sl-logo__icon">M</div>
                    <span className="sl-logo__text">Minh Thang_</span>
                </div>
                <nav className="sl-nav">
                    {NAV.map((n) => (
                        <button key={n.id}
                                className={`sl-nav-item${page === n.id ? " sl-nav-item--active" : ""}`}
                                onClick={() => setPage(n.id)}>
                            <span className="sl-nav-item__label">{n.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sl-sidebar__footer">
                    <button className="sl-logout" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            {/* Main */}
            <div className="sl-main">
                <header className="sl-header">
                    <div className="sl-header__left">
                        <button className="sl-menu-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                        <span className="sl-header__title">{PAGE_TITLES[page] || "Dashboard"}</span>
                    </div>
                    <div className="sl-header__right sl-header__right--push">
                        <button className="sl-notif-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            <span className="sl-notif-dot"/>
                        </button>
                        <div className="sl-user">
                            <div className="sl-user__avatar">{user?.username?.charAt(0)?.toUpperCase() || "U"}</div>
                            <div className="sl-user__info">
                                <span className="sl-user__name">{user?.username || "User"}</span>
                                <span className="sl-user__role">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="sl-content">{renderPage()}</main>
            </div>
        </div>
    );
};