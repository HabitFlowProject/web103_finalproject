export default function StatTile({ label, value, detail, tone }) {
  return (
    <div className={tone ? `stat-tile stat-${tone}` : "stat-tile"}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {detail && <span className="stat-detail">{detail}</span>}
    </div>
  );
}
