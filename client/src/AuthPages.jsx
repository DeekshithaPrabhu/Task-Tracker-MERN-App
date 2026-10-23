import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

function Card({ title, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="panel auth-card">
        <h1>Taskflow</h1>
        <h2>{title}</h2>
        {children}
        <p className="auth-foot">{footer}</p>
      </div>
    </div>
  );
}

// Shared form behaviour: field state, busy flag, error and success message
function useForm(initial, submit) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (k) => ({ value: v[k], onChange: (e) => setV({ ...v, [k]: e.target.value }) });
  const onSubmit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const msg = await submit(v); if (msg) setOk(msg); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return { bind, onSubmit, err, ok, busy };
}

const Status = ({ err, ok }) => <>{err && <p className="err" role="alert">{err}</p>}{ok && <p className="okmsg" role="status">{ok}</p>}</>;

export function Login() {
  const { login, expired } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const f = useForm({ email: '', password: '' }, async (v) => { await login(v); nav(loc.state?.from || '/', { replace: true }); });
  return (
    <Card title="Log in" footer={<>New here? <Link to="/register">Create an account</Link></>}>
      {expired && <p className="notice" role="alert">Your session expired. Log in again to pick up where you left off.</p>}
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Email<input type="email" required autoComplete="email" autoFocus {...f.bind('email')} /></label>
        <label>Password<input type="password" required autoComplete="current-password" {...f.bind('password')} /></label>
        <Status {...f} />
        <button className="primary" disabled={f.busy}>Log in</button>
        <Link to="/forgot-password" className="sub">Forgot password?</Link>
      </form>
    </Card>
  );
}

export function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const f = useForm({ name: '', email: '', password: '' }, async (v) => { await register(v); nav('/', { replace: true }); });
  return (
    <Card title="Create your account" footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Name<input required autoComplete="name" autoFocus {...f.bind('name')} /></label>
        <label>Email<input type="email" required autoComplete="email" {...f.bind('email')} /></label>
        <label>Password (8 characters or more)<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" {...f.bind('password')} /></label>
        <Status {...f} />
        <button className="primary" disabled={f.busy}>Create account</button>
      </form>
    </Card>
  );
}

export function Forgot() {
  const f = useForm({ email: '' }, async (v) => (await api.forgot(v.email)).message);
  return (
    <Card title="Reset your password" footer={<Link to="/login">Back to log in</Link>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Email<input type="email" required autoFocus {...f.bind('email')} /></label>
        <Status {...f} />
        <button className="primary" disabled={f.busy}>Send reset link</button>
      </form>
    </Card>
  );
}

export function Reset() {
  const { token } = useParams();
  const f = useForm({ password: '', confirm: '' }, async (v) => {
    if (v.password !== v.confirm) throw new Error('Passwords do not match');
    return (await api.reset(token, v.password)).message;
  });
  return (
    <Card title="Choose a new password" footer={<Link to="/login">Go to log in</Link>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>New password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" autoFocus {...f.bind('password')} /></label>
        <label>Confirm password<input type="password" required autoComplete="new-password" {...f.bind('confirm')} /></label>
        <Status {...f} />
        <button className="primary" disabled={f.busy}>Update password</button>
      </form>
    </Card>
  );
}
