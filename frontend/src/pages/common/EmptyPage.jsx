import "./EmptyPage.css";

export const EmptyPage = ({ icon, title, description }) => {
  return (
    <div className="empty-page">
      <div className="empty-page-icon">{icon}</div>
      <h2 className="empty-page-title">{title}</h2>
      <p className="empty-page-desc">{description}</p>
    </div>
  );
};
