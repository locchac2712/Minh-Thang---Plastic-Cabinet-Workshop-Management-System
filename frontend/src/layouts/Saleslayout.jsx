import { useState } from "react";
import "./SalesLayout.css";
import { useAuth } from "../context/AuthContext";
import { SalesDashboard } from "../pages/sales/SalesDashboard";
import { SalesProducts } from "../pages/sales/SalesProducts.jsx";
import { SalesCustomers } from "../pages/sales/SalesCustomers.jsx";
import { SalesQuotes } from "../pages/sales/SalesQuotes.jsx";
import { SalesOrders } from "../pages/sales/SalesOrders.jsx";
import { MyProfile } from "../pages/common/MyProfile";

const NAV = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "products", label: "Sản phẩm", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg> },
    { id: "customers", label: "Khách hàng", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
    { id: "quotes", label: "Báo giá", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> },
    { id: "orders", label: "Đơn hàng", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg> },
    { id: "delivery", label: "Giao hàng", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3m1 0h4"></path><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path><rect x="14" y="13" width="6" height="4"></rect><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg> },
];

const PAGE_TITLES = {
    dashboard: "Dashboard ",
    products: "Sản phẩm",
    customers: "Khách hàng",
    quotes: "Báo giá",
    orders: "Đơn hàng",
    delivery: "Giao hàng",
    profile: "Hồ sơ của tôi",
};

const getVNRole = (role) => {
    const map = {
        'ROLE_ADMIN': 'Quản trị hệ thống',
        'ROLE_DIRECTOR': 'Giám đốc',
        'ROLE_PRODUCTION_MANAGER': 'Quản lý sản xuất',
        'ROLE_SALES_STAFF': 'Nhân viên Kinh doanh'
    };
    return map[role] || role;
};

export const SalesLayout = () => {
    const { user, logout } = useAuth();
    const [page, setPage] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => { logout(); window.location.href = window.location.origin; };

    const renderPage = () => {
        switch (page) {
            case "dashboard": return <SalesDashboard onNavigate={setPage} />;
            case "products": return <SalesProducts />;
            case "customers": return <SalesCustomers />;
            case "quotes": return <SalesQuotes />;
            case "orders": return <SalesOrders />;
            case "profile": return <MyProfile />;
            default: return <SalesDashboard onNavigate={setPage} />;
        }
    };

    return (
        <div className={`sl-layout${!isSidebarOpen ? " is-sidebar-collapsed" : ""}`}>
            {/* Sidebar */}
            <aside className="sl-sidebar">
                <div className="sl-logo">
                    <div className="sl-logo__icon">M</div>
                    {isSidebarOpen && <span className="sl-logo__text">Minh Thang_</span>}
                </div>
                <nav className="sl-nav">
                    {NAV.map((n) => (
                        <button key={n.id}
                            className={`sl-nav-item${page === n.id ? " sl-nav-item--active" : ""}`}
                            onClick={() => setPage(n.id)}
                            title={!isSidebarOpen ? n.label : ""}>
                            <span className="sl-nav-item__icon">{n.icon}</span>
                            {isSidebarOpen && <span className="sl-nav-item__label">{n.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="sl-sidebar__footer" style={{ border: 'none', padding: 0 }}>
                    {/* Logout moved to user dropdown */}
                </div>
            </aside>

            {/* Main */}
            <div className="sl-main">
                <header className="sl-header">
                    <div className="sl-header__left">
                        <button className="sl-menu-icon" onClick={toggleSidebar}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <span className="sl-header__title">{PAGE_TITLES[page] || "Dashboard"}</span>
                    </div>
                    <div className="sl-header__right sl-header__right--push">
                        <button className="sl-notif-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className="sl-notif-dot" />
                        </button>
                        <div className="sl-header__user-container" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                            <div className="sl-user">
                                <div className="sl-user__avatar">{user?.username?.charAt(0)?.toUpperCase() || "U"}</div>
                                <div className="sl-user__info">
                                    <span className="sl-user__name">{user?.username || "User"}</span>
                                    <span className="sl-user__role">{getVNRole(user?.role)}</span>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(255,255,255,.3)' }}><path d="m6 9 6 6 6-6"/></svg>
                            </div>

                            {isUserMenuOpen && (
                                <div className="sl-user-dropdown">
                                    <button className="sl-dropdown-item" onClick={() => { setPage("profile"); setIsUserMenuOpen(false); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        Hồ sơ của tôi
                                    </button>
                                    <div className="sl-dropdown-divider"></div>
                                    <button className="sl-dropdown-item sl-dropdown-item--logout" onClick={handleLogout}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="sl-content">{renderPage()}</main>
            </div>
        </div>
    );
};