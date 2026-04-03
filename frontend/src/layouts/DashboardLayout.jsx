import { useState } from "react";
import "./Saleslayout.css";
import { useAuth } from "../context/AuthContext";
import { ManageBOM } from "../pages/production/ManageBOM.jsx";
import { MaterialList } from "../pages/master-data/MaterialList";
import { ProductList } from "../pages/production/ProductList.jsx";
import { SalesOrders } from "../pages/sales/SalesOrders.jsx";
import { MyProfile } from "../pages/common/MyProfile";
import { ControlMaterial } from "../pages/production/ControlMaterial.jsx";
import { MaterialDetail } from "../pages/production/Materialdetail.jsx";
import { ProductDetail } from "../pages/production/ProductDetail.jsx";
import { UserManagement } from "../pages/admin/UserManagement.jsx";

const NAV = [
    { id: "users", label: "Quản lý người dùng" },
    { id: "bom", label: "Định mức vật tư (BOM)" },
    { id: "material", label: "Vật tư & Nguyên liệu" },
    { id: "products", label: "Danh mục Thành phẩm" },
];

const PAGE_TITLES = {
    users: "Quản lý người dùng",
    bom: "Quản lý BOM",
    material: "Quản lý vật tư",
    materialDetail: "Chi tiết vật tư",
    products: "Sản phẩm",
    productDetail: "Chi tiết sản phẩm",
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

export const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [activePage, setActivePage] = useState("users");
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
            case "users": return <UserManagement />;
            case "bom": return <ManageBOM />;
            case "material": return <ControlMaterial onSelectMaterial={(m) => { setSelectedMaterial(m); setActivePage("materialDetail"); }} />;
            case "materialDetail": return <MaterialDetail materialId={selectedMaterial?.id} onBack={() => setActivePage("material")} />;
            case "products": return <ProductList onSelectProduct={(p) => { setSelectedProduct(p); setActivePage("productDetail"); }} />;
            case "productDetail": return <ProductDetail productId={selectedProduct?.id} onBack={() => setActivePage("products")} />;
            case "profile": return <MyProfile />;
            default: return <UserManagement />;
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
                            {isSidebarOpen && <span className="sl-nav-item__label">{n.label}</span>}
                            {!isSidebarOpen && <span className="sl-nav-item__label" style={{ fontSize: 10, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2 }}>{n.label.split(' ')[0]}</span>}
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
                        <div className="sl-header__user-container" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                            <div className="sl-user">
                                <div className="sl-user__avatar">{user?.username?.charAt(0)?.toUpperCase() || "U"}</div>
                                <div className="sl-user__info">
                                    <span className="sl-user__name">{user?.username || "User"}</span>
                                    <span className="sl-user__role">{getVNRole(user?.role)}</span>
                                </div>
                            </div>

                            {isUserMenuOpen && (
                                <div className="sl-user-dropdown">
                                    <button className="sl-dropdown-item" onClick={() => setActivePage("profile")}>
                                        Hồ sơ của tôi
                                    </button>
                                    <div className="sl-dropdown-divider"></div>
                                    <button className="sl-dropdown-item sl-dropdown-item--logout" onClick={handleLogout}>
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