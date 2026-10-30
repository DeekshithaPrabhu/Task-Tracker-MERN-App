export default function AuthCard({ title, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="panel auth-card">
        <h1>Task Tracker App</h1>
        <h2>{title}</h2>
        {children}
        <p className="auth-foot">{footer}</p>
      </div>
    </div>
  );
}
