export default function StatTile({ label, value, detail, tone, icon }) {
  const classes = ["stat-tile", tone && `stat-${tone}`, icon && "has-icon"].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {icon && (
        <span className="stat-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="stat-text">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {detail && <span className="stat-detail">{detail}</span>}
      </div>
    </div>
  );
}
