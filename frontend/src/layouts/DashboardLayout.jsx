import { useState } from "react";
import "./DashboardLayout.css";
import { Sidebar }           from "../components/Sidebar";
import { Header }            from "../components/Header";
import { ManageBOM }         from "../pages/production/ManageBOM.jsx";
import { PlanProduction }    from "../pages/production/PlanProduction.jsx";
import { PlanCalendar }      from "../pages/production/PlanCalendar.jsx";
import { ExecuteWorkOrder }  from "../pages/production/ExecuteWorkOrder.jsx";
import { ControlMaterial }   from "../pages/production/ControlMaterial.jsx";
import { MaterialDetail }    from "../pages/production/Materialdetail.jsx";
import { ProductList }       from "../pages/production/ProductList.jsx";
import { ProductDetail }     from "../pages/production/ProductDetail.jsx";
import { MonitorProduction } from "../pages/production/MonitorProduction.jsx";
import { SalesOrders } from "../pages/sales/SalesOrders.jsx";

const PAGE_TITLES = {
  orders:         "Đơn hàng",
  bom:            "Quản lý BOM",
  plan:           "Danh sách kế hoạch",
  calendar:       "Lập lịch sản xuất",
  workorder:      "Thực hiện lệnh sản xuất",
  material:       "Quản lý vật tư",
  materialDetail: "Chi tiết vật tư",
  products:       "Sản phẩm",
  productDetail:  "Chi tiết sản phẩm",
  monitor:        "Giám sát sản xuất",
};

export const DashboardLayout = () => {
  const [activePage,         setActivePage]         = useState("bom");
  const [selectedMaterial,   setSelectedMaterial]   = useState(null);
  const [selectedProduct,    setSelectedProduct]    = useState(null);
  const [materialRefreshKey, setMaterialRefreshKey] = useState(0);
  const [productRefreshKey,  setProductRefreshKey]  = useState(0);

  const handleNavigate = (page) => {
    setSelectedMaterial(null);
    setSelectedProduct(null);
    setActivePage(page);
    if (page === "material") setMaterialRefreshKey((k) => k + 1);
    if (page === "products") setProductRefreshKey((k) => k + 1);
  };

  const renderPage = () => {
    if (activePage === "materialDetail" && selectedMaterial)
      return (
          <MaterialDetail
              material={selectedMaterial}
              onBack={() => { setSelectedMaterial(null); setActivePage("material"); setMaterialRefreshKey((k) => k + 1); }}
              onDeleted={() => { setSelectedMaterial(null); setActivePage("material"); setMaterialRefreshKey((k) => k + 1); }}
          />
      );

    if (activePage === "productDetail" && selectedProduct)
      return (
          <ProductDetail
              product={selectedProduct}
              onBack={() => { setSelectedProduct(null); setActivePage("products"); setProductRefreshKey((k) => k + 1); }}
              onUpdated={(p) => setSelectedProduct(p)}
          />
      );

    switch (activePage) {
      case "orders": return <SalesOrders />;
      case "bom":       return <ManageBOM />;
      case "plan":      return <PlanProduction />;
      case "calendar":  return <PlanCalendar />;
      case "workorder": return <ExecuteWorkOrder />;
      case "material":  return <ControlMaterial key={materialRefreshKey} onSelectMaterial={(m) => { setSelectedMaterial(m); setActivePage("materialDetail"); }} />;
      case "products":  return <ProductList key={productRefreshKey} onSelectProduct={(p) => { setSelectedProduct(p); setActivePage("productDetail"); }} />;
      case "monitor":   return <MonitorProduction />;
      default:          return <ManageBOM />;
    }
  };

  const sidebarPage = activePage === "materialDetail" ? "material"
      : activePage === "productDetail"  ? "products"
          : activePage;

  return (
      <div className="app-layout">
        <Sidebar activePage={sidebarPage} onNavigate={handleNavigate} />
        <div className="app-main">
          <Header pageTitle={PAGE_TITLES[activePage]} />
          <main className="app-content">{renderPage()}</main>
        </div>
      </div>
  );
};