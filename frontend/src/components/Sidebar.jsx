import "./Sidebar.css";
import { NavItem } from "./NavItem";

const NAV_ITEMS = [
  { id: "bom", label: "Manage BOM", icon: "" },
  { id: "plan", label: "Plan Production", icon: "" },
  { id: "workorder", label: "Execute Work Order", icon: "" },
  { id: "material", label: "Control Material", icon: "" },
  { id: "monitor", label: "Monitor Production", icon: "" },
];

export const Sidebar = ({ activePage, onNavigate }) => {
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
        <span className="sidebar-version">v1.0.0</span>
      </div>
    </aside>
  );
};
