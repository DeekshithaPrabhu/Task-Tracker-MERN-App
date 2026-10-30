export default function Ring({ value }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="ring" role="img" aria-label={`${value}% complete`}>
      <circle cx="90" cy="90" r={r} className="ring-bg" />
      <circle cx="90" cy="90" r={r} className="ring-fg" strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 90 90)" />
      <text x="90" y="92" textAnchor="middle" className="ring-num">{value}%</text>
      <text x="90" y="116" textAnchor="middle" className="ring-sub">complete</text>
    </svg>
  );
}
