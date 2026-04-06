import { useState, useEffect } from "react";
import { ViewQuoteModal } from "../pages/sales/ViewQuoteModal";
import "./MainLayout.css";
import { useAuth } from "../context/AuthContext";

// Page Imports - Sales
import { SalesDashboard } from "../pages/sales/SalesDashboard";
import { SalesCustomers } from "../pages/sales/SalesCustomers";
import { AddCustomer } from "../pages/sales/AddCustomer";
import { EditCustomer } from "../pages/sales/EditCustomer";
import { CustomerDetail } from "../pages/sales/CustomerDetail";
import { SalesQuotes } from "../pages/sales/SalesQuotes";
import { SalesOrders } from "../pages/sales/SalesOrders";
import { DebtManagement } from "../pages/sales/DebtManagement";

// Page Imports - Admin & Others
import { UserManagement }         from "../pages/admin/UserManagement";
import { CustomerTypeManagement } from "../pages/admin/CustomerTypeManagement";
import { ProductList }            from "../pages/production/ProductList";
import { ProductDetail }          from "../pages/production/ProductDetail";
import { MyProfile }              from "../pages/common/MyProfile";

// Hooks
import { useNotifications } from "../hooks/useNotifications";

// Services
import salesOrderService from "../services/salesOrderService";
import notificationService from "../services/notificationService";

const GLOBAL_NAV = [
    // ADMIN SIDEBAR
    { type: "header", label: "QUẢN TRỊ HỆ THỐNG", roles: ["ADMIN"] },
    {
        id: "users",
        label: "Người dùng",
        roles: ["ADMIN"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    },
    {
        id: "auth",
        label: "Phân quyền",
        roles: ["ADMIN"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    },
    {
        id: "customer-types",
        label: "Loại khách hàng",
        roles: ["ADMIN"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
    },

    // SALES & DIRECTOR SIDEBAR
    { type: "header", label: "KINH DOANH & CRM", roles: ["SALES_STAFF", "DIRECTOR"] },
    { 
        id: "dashboard", 
        label: "Tổng quan", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> 
    },
    { 
        id: "customers", 
        label: "Khách hàng", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> 
    },
    { 
        id: "products", 
        label: "Sản phẩm", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    },
    { 
        id: "quotes", 
        label: "Báo giá", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> 
    },
    { 
        id: "orders", 
        label: "Đơn hàng", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg> 
    },
    { 
        id: "delivery", 
        label: "Giao hàng", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
    },
    {
        id: "payment",
        label: "Thanh toán",
        roles: ["SALES_STAFF"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
    },
    { 
        id: "crm-debt", 
        label: "Công nợ", 
        roles: ["SALES_STAFF", "DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> 
    },
    {
        id: "reporting",
        label: "Báo cáo",
        roles: ["DIRECTOR"],
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
    },
];

const PAGE_TITLES = {
    dashboard: "Tổng quan",
    users: "Người dùng",
    auth: "Phân quyền",
    "customer-types": "Loại khách hàng",
    products: "Sản phẩm",
    productDetail: "Chi tiết sản phẩm",
    customers: "Khách hàng",
    quotes: "Báo giá",
    orders: "Đơn hàng",
    delivery: "Giao hàng",
    payment: "Thanh toán",
    "crm-debt": "Công nợ",
    reporting: "Báo cáo",
    profile: "Hồ sơ cá nhân",
    "add-customer": "Thêm khách hàng",
    "edit-customer": "Cập nhật khách hàng",
    "customer-detail": "Chi tiết khách hàng",
};

const PlaceholderPage = ({ title }) => (
    <div className="ml-card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', textAlign: 'center', color: '#64748b'
    }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{title}</h2>
        <p>Tính năng này đang trong quá trình phát triển.</p>
        <p style={{ fontSize: '14px', marginTop: '4px' }}>Vui lòng quay lại sau!</p>
    </div>
);

export const MainLayout = () => {
    const { user, logout, hasRole } = useAuth();

    const { notifications, unreadCount, refetch: fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

    // Auth Role-based landing page
    const getDefaultPage = () => {
        if (hasRole('ADMIN')) return "users";
        if (hasRole('SALES_STAFF', 'DIRECTOR')) return "dashboard";
        return "profile";
    };

    // Persistence
    const [page, setPage] = useState(() => localStorage.getItem("active_page") || getDefaultPage());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [approvalQuoteId, setApprovalQuoteId] = useState(null);

    // Sub-page states (Params)
    const [selectedId, setSelectedId] = useState(null);

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }
        setIsNotifOpen(false);
        if (notif.referenceId) {
            setApprovalQuoteId(notif.referenceId);
        }
    };

    useEffect(() => {
        localStorage.setItem("active_page", page);
    }, [page]);

    const handleLogout = () => {
        logout();
        window.location.href = "/";
    };

    const handleNavigate = (pageId, param = null) => {
        if (param) setSelectedId(param);
        setPage(pageId);
        window.scrollTo(0, 0);
    };

    const renderPage = () => {
        switch (page) {
            // General
            case "dashboard": return <SalesDashboard onNavigate={handleNavigate} />;
            case "profile": return <MyProfile />;

            // Admin
            case "users":          return <UserManagement />;
            case "auth":           return <PlaceholderPage title="Phân quyền hệ thống" />;
            case "customer-types": return <CustomerTypeManagement />;
            
            // Sales & CRM
            case "crm-stats": return <CrmDashboard />;
            case "customers": return <SalesCustomers onNavigate={handleNavigate} />;
            case "add-customer": return <AddCustomer onBack={() => setPage("customers")} onSaved={() => setPage("customers")} />;
            case "edit-customer": return <EditCustomer customerId={selectedId} onBack={() => setPage("customers")} onSaved={() => setPage("customers")} />;
            case "customer-detail": return <CustomerDetail customerId={selectedId} onBack={() => setPage("customers")} onEdit={(id) => handleNavigate("edit-customer", id)} />;
            case "quotes": return <SalesQuotes />;
            case "orders": return <SalesOrders />;
            case "crm-debt": return <DebtManagement />;

            default: return <div className="ml-card">Đang cập nhật nội dung cho trang này...</div>;
        }
    };

    // Filter menu based on user role
    const filteredNav = GLOBAL_NAV.filter(item => {
        if (!item.roles) return true;
        return item.roles.some(r => user?.role === `ROLE_${r}`);
    });

    return (
        <div className={`ml-layout ${!isSidebarOpen ? "is-sidebar-collapsed" : ""}`}>
            {/* Sidebar */}
            <aside className="ml-sidebar">
                <div className="ml-logo">
                    <div className="ml-logo__icon">M</div>
                    {isSidebarOpen && <span className="ml-logo__text">Minh Thang_</span>}
                </div>

                <nav className="ml-nav">
                    {filteredNav.map((n, i) => (
                        n.type === "header" ? (
                            isSidebarOpen && <div key={i} className="ml-nav-header">{n.label}</div>
                        ) : (
                            <button
                                key={n.id}
                                className={`ml-nav-item ${page === n.id ? "ml-nav-item--active" : ""}`}
                                onClick={() => setPage(n.id)}
                                title={!isSidebarOpen ? n.label : ""}
                            >
                                <span className="ml-nav-item__icon">{n.icon}</span>
                                {isSidebarOpen && <span className="ml-nav-item__label">{n.label}</span>}
                            </button>
                        )
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="ml-main">
                <header className="ml-header">
                    <div className="ml-header__left">
                        <button className="ml-menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <span className="ml-header__title">{PAGE_TITLES[page] || "Hệ thống"}</span>
                    </div>

                    <div className="ml-header__right">
                        <div className="ml-notif-container" style={{ position: 'relative' }}>
                            <button className="ml-notif-btn" onClick={() => {
                                if (!isNotifOpen) fetchNotifications();
                                setIsNotifOpen(!isNotifOpen);
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {unreadCount > 0 && <span className="ml-notif-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>

                            {isNotifOpen && (
                                <div className="ml-notif-dropdown" style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px',
                                    backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    padding: '12px 0', zIndex: 100, border: '1px solid #eaeaea', maxHeight: '400px', overflowY: 'auto'
                                }}>
                                    <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Thông báo</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} style={{ fontSize: '12px', color: '#0066ff', background: 'none', border: 'none', cursor: 'pointer' }}>Đọc tất cả</button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Không có thông báo mới</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} onClick={() => handleNotificationClick(n)} style={{
                                                padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                                                backgroundColor: n.read ? '#fff' : '#f0f9ff'
                                            }}>
                                                <div style={{ fontSize: '14px', fontWeight: n.read ? 'normal' : '600', color: '#333' }}>{n.title}</div>
                                                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{n.message}</div>
                                                <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="ml-user-container">
                            <div className="ml-user" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                <div className="ml-user__avatar">{user?.username?.charAt(0).toUpperCase()}</div>
                                <div className="ml-user__info">
                                    <span className="ml-user__name">{user?.username}</span>
                                    <span className="ml-user__role">{user?.role?.replace("ROLE_", "").replace("_", " ")}</span>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.3 }}><path d="m6 9 6 6 6-6" /></svg>
                            </div>

                            {isUserMenuOpen && (
                                <div className="ml-user-dropdown">
                                    <button className="ml-dropdown-item" onClick={() => { setPage("profile"); setIsUserMenuOpen(false); }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        Hồ sơ cá nhân
                                    </button>
                                    <div className="ml-dropdown-divider" />
                                    <button className="ml-dropdown-item ml-dropdown-item--logout" onClick={handleLogout}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ml-content">
                    {renderPage()}
                </main>

                {approvalQuoteId && (
                    <ViewQuoteModal
                        quoteId={approvalQuoteId}
                        onClose={() => setApprovalQuoteId(null)}
                        onSaved={() => {
                            fetchNotifications();
                        }}
                    />
                )}
            </div>
        </div>
    );
};
