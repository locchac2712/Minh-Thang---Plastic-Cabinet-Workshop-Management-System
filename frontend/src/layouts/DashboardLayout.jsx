import { useState } from "react";
import "./DashboardLayout.css";
import { Sidebar }           from "../components/Sidebar";
import { Header }            from "../components/Header";
import { ManageBOM }         from "../pages/ManageBOM";
import { PlanProduction }    from "../pages/PlanProduction";
import { ExecuteWorkOrder }  from "../pages/ExecuteWorkOrder";
import { ControlMaterial }   from "../pages/ControlMaterial";
import { MaterialDetail }    from "../pages/MaterialDetail";
import { ProductList }       from "../pages/ProductList";
import { ProductDetail }     from "../pages/ProductDetail";
import { MonitorProduction } from "../pages/MonitorProduction";

const PAGE_TITLES = {
  bom:            "Manage BOM",
  plan:           "Plan Production",
  workorder:      "Execute Work Order",
  material:       "Control Material",
  materialDetail: "Material Detail",
  products:       "Products",
  productDetail:  "Product Detail",
  monitor:        "Monitor Production",
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
      case "bom":       return <ManageBOM />;
      case "plan":      return <PlanProduction />;
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