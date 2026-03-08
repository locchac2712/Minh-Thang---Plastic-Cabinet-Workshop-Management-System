import "./NavItem.css";

export const NavItem = ({ item, isActive, onClick }) => {
  return (
    <button
      className={`nav-item${isActive ? " nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-item-indicator" />
      <span className="nav-item-icon">{item.icon}</span>
      <span className="nav-item-label">{item.label}</span>
    </button>
  );
};
