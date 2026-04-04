import { useState } from "react";
import "./SalesLayout.css";
import { useAuth } from "../context/AuthContext";
import { SalesDashboard } from "../pages/sales/SalesDashboard";
import { SalesProducts }  from "../pages/sales/SalesProducts.jsx";
import { SalesCustomers } from "../pages/sales/SalesCustomers.jsx";
import { AddCustomer }   from "../pages/sales/AddCustomer.jsx";
import { EditCustomer }  from "../pages/sales/EditCustomer.jsx";
import { CustomerDetail } from "../pages/sales/CustomerDetail.jsx";
import { SalesQuotes }    from "../pages/sales/SalesQuotes.jsx";
import { SalesOrders }    from "../pages/sales/SalesOrders.jsx";
import { CrmDashboard }  from "../pages/sales/CrmDashboard.jsx";
import { DebtManagement } from "../pages/sales/DebtManagement.jsx";

const NAV = [
    { type: "header", label: "HỆ THỐNG" },
    { id: "dashboard", label: "Dashboard chính", icon: "⊞" },
    { id: "products",  label: "Sản phẩm",     icon: "☰" },
    
    { type: "header", label: "CRM" },
    { id: "crm-stats", label: "Tổng quan CRM", icon: "📊" },
    { id: "customers", label: "Khách hàng",    icon: "👤" },
    { id: "crm-debt",  label: "Công nợ",       icon: "💰" },
    
    { type: "header", label: "BÁN HÀNG" },
    { id: "quotes",    label: "Báo giá",      icon: "◻" },
    { id: "orders",    label: "Đơn bán hàng", icon: "◻" },
    { id: "delivery",  label: "Giao hàng",    icon: "◻" },
];

const PAGE_TITLES = {
    dashboard: "Dashboard Bán hàng",
    products:  "Sản phẩm",
    customers: "Quản lý Khách hàng",
    quotes:    "Báo giá",
    orders:    "Đơn bán hàng",
    delivery:  "Giao hàng",
    "crm-stats": "Tổng quan CRM",
    "crm-debt":  "Quản lý Công nợ",
};

export const SalesLayout = () => {
    const { user, logout } = useAuth();
    const [page, setPage] = useState("dashboard");
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    const handleLogout = () => { logout(); window.location.href = window.location.origin; };

    const handleNavigate = (pageId, param = null) => {
        if (pageId === "customer-detail") setSelectedCustomerId(param);
        if (pageId === "edit-customer") setEditingCustomerId(param);
        setPage(pageId);
    };

    const renderPage = () => {
        switch (page) {
            case "dashboard": return <SalesDashboard onNavigate={handleNavigate} />;
            case "products":  return <SalesProducts />;
            case "customers": return <SalesCustomers onNavigate={handleNavigate} />;
            case "add-customer": return <AddCustomer onBack={() => setPage("customers")} onSaved={() => setPage("customers")} />;
            case "edit-customer": return <EditCustomer customerId={editingCustomerId} onBack={() => setPage("customers")} onSaved={() => setPage("customers")} />;
            case "customer-detail": return <CustomerDetail customerId={selectedCustomerId} onBack={() => setPage("customers")} />;
            case "quotes":    return <SalesQuotes />;
            case "orders":    return <SalesOrders />;
            case "crm-stats": return <CrmDashboard />;
            case "crm-debt":  return <DebtManagement />;
            default:          return <SalesDashboard onNavigate={handleNavigate} />;
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
                    {NAV.map((n, i) => (
                        n.type === "header" ? (
                            <div key={i} className="sl-nav-header">{n.label}</div>
                        ) : (
                            <button key={n.id}
                                    className={`sl-nav-item${page === n.id ? " sl-nav-item--active" : ""}`}
                                    onClick={() => setPage(n.id)}>
                                <span className="sl-nav-item__label">{n.label}</span>
                            </button>
                        )
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