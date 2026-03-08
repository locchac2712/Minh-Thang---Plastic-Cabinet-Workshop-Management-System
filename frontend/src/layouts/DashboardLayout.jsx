import { useState } from "react";
import "./DashboardLayout.css";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { LoginModal } from "../components/LoginModal";
import { ManageBOM } from "../pages/ManageBOM";
import { PlanProduction } from "../pages/PlanProduction";
import { ExecuteWorkOrder } from "../pages/ExecuteWorkOrder";
import { ControlMaterial } from "../pages/ControlMaterial";
import { MonitorProduction } from "../pages/MonitorProduction";

const PAGE_TITLES = {
  bom: "Manage BOM",
  plan: "Plan Production",
  workorder: "Execute Work Order",
  material: "Control Material",
  monitor: "Monitor Production",
};

const PAGE_COMPONENTS = {
  bom: ManageBOM,
  plan: PlanProduction,
  workorder: ExecuteWorkOrder,
  material: ControlMaterial,
  monitor: MonitorProduction,
};

export const DashboardLayout = () => {
  const [activePage, setActivePage] = useState("bom");
  const [showLogin, setShowLogin] = useState(false);

  const ActivePage = PAGE_COMPONENTS[activePage];

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="app-main">
        <Header
          pageTitle={PAGE_TITLES[activePage]}
          onLoginClick={() => setShowLogin(true)}
        />
        <main className="app-content">
          <ActivePage />
        </main>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};
