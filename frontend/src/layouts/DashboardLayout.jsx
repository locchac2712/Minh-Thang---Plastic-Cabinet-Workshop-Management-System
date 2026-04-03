import { useState } from "react";
import "./Saleslayout.css";
import { useAuth } from "../context/AuthContext";
import { ManageBOM }         from "../pages/production/ManageBOM.jsx";
import { PlanProduction }    from "../pages/production/PlanProduction.jsx";
import { PlanCalendar }      from "../pages/production/PlanCalendar.jsx";
import { ExecuteWorkOrder }  from "../pages/production/ExecuteWorkOrder.jsx";
import { CreateWorkOrder }   from "../pages/production/CreateWorkOrder.jsx";
import { MaterialList }      from "../pages/master-data/MaterialList";
import { ProductList }       from "../pages/production/ProductList.jsx";
import { MonitorProduction } from "../pages/production/MonitorProduction.jsx";
import { ProductionOrders }  from "../pages/production/ProductionOrders";
import { SalesOrders }      from "../pages/sales/SalesOrders.jsx";
import { MyProfile }        from "../pages/common/MyProfile";
import { ControlMaterial }   from "../pages/production/ControlMaterial.jsx";
import { MaterialDetail }    from "../pages/production/Materialdetail.jsx";
import { ProductDetail }     from "../pages/production/ProductDetail.jsx";

const NAV = [
    { id: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { id: "orders", label: "Đơn hàng", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg> },
    { id: "plan", label: "Lập kế hoạch sản xuất", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
    { id: "calendar", label: "Lập lịch sản xuất", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
    { id: "create-wo", label: "Tạo Lệnh Sản Xuất", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" strokeWidth="3"/></svg> },
    { id: "workorder", label: "Thực thi Lệnh SX", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
    { id: "bom", label: "Định mức vật tư (BOM)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> },
    { id: "material", label: "Vật tư & Nguyên liệu", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
    { id: "products", label: "Danh mục Thành phẩm", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg> },
    { id: "monitor", label: "Giám sát sản xuất", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> },
];

const PAGE_TITLES = {
  dashboard:      "Trình quản lý sản xuất",
  bom:            "Quản lý BOM",
  plan:           "Danh sách kế hoạch",
  calendar:       "Lập lịch sản xuất",
  "create-wo":    "Tạo Lệnh Sản Xuất",
  workorder:      "Thực hiện lệnh sản xuất",
  material:       "Quản lý vật tư",
  materialDetail: "Chi tiết vật tư",
  products:       "Sản phẩm",
  productDetail:  "Chi tiết sản phẩm",
  orders:         "Đơn hàng",
  monitor:        "Giám sát sản xuất",
  profile:        "Hồ sơ của tôi",
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

export const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState(user?.role === "ROLE_PRODUCTION_MANAGER" ? "dashboard" : "bom");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleLogout = () => { logout(); window.location.href = window.location.origin; };

    const handleNavigate = (page) => {
        setActivePage(page);
    };

    const renderPage = () => {
        switch (activePage) {
        case "dashboard": return <MonitorProduction />;
        case "bom":       return <ManageBOM />;
        case "plan":      return <PlanProduction />;
        case "calendar":  return <PlanCalendar />;
        case "create-wo": return <CreateWorkOrder onBack={() => setActivePage("orders")} />;
        case "workorder": return <ExecuteWorkOrder />;
        case "material":  return <ControlMaterial onSelectMaterial={(m) => { setSelectedMaterial(m); setActivePage("materialDetail"); }} />;
        case "materialDetail": return <MaterialDetail materialId={selectedMaterial?.id} onBack={() => setActivePage("material")} />;
        case "products":  return <ProductList onSelectProduct={(p) => { setSelectedProduct(p); setActivePage("productDetail"); }} />;
        case "productDetail": return <ProductDetail productId={selectedProduct?.id} onBack={() => setActivePage("products")} />;
        case "orders":    
            return user?.role === "ROLE_PRODUCTION_MANAGER" ? <ProductionOrders /> : <SalesOrders />;
        case "monitor":   return <MonitorProduction />;
        case "profile":   return <MyProfile />;
        default:          return <ManageBOM />;
        }
    };

    return (
        <div className={`sl-layout${!isSidebarOpen ? " is-sidebar-collapsed" : ""}`}>
            <aside className="sl-sidebar">
                <div className="sl-logo">
                    <div className="sl-logo__icon">M</div>
                    {isSidebarOpen && <span className="sl-logo__text">Minh Thang_</span>}
                </div>
                <nav className="sl-nav">
                    {NAV.map((n) => (
                        <button key={n.id}
                            className={`sl-nav-item${activePage === n.id ? " sl-nav-item--active" : ""}`}
                            onClick={() => handleNavigate(n.id)}
                            title={!isSidebarOpen ? n.label : ""}>
                            <span className="sl-nav-item__icon">{n.icon}</span>
                            {isSidebarOpen && <span className="sl-nav-item__label">{n.label}</span>}
                        </button>
                    ))}
                </nav>
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
                        <span className="sl-header__title">{PAGE_TITLES[activePage] || "Dashboard"}</span>
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
                                    <button className="sl-dropdown-item" onClick={() => setActivePage("profile")}>
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