import { useId, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

function Card({ title, children, footer }) {
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

// Password input with a show/hide eye button
function PasswordField({ label, ...input }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} type={show ? 'text' : 'password'} {...input} />
        <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {show
              ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
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
  // Functional update: autofill fires several change events before React re-renders,
  // and `setV({ ...v })` would let the last one overwrite the others with stale values.
  const bind = (k) => ({ name: k, value: v[k], onChange: (e) => { const val = e.target.value; setV((p) => ({ ...p, [k]: val })); } });
  const onSubmit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    // What is actually in the fields wins over state (covers autofill that never fired an event)
    const fromDom = Object.fromEntries(new FormData(e.currentTarget));
    try { const msg = await submit({ ...v, ...fromDom }); if (msg) setOk(msg); } catch (x) { setErr(x.message); }
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
        <label>Email<input type="email" required autoComplete="username" autoFocus {...f.bind('email')} /></label>
        <PasswordField label="Password" required autoComplete="current-password" {...f.bind('password')} />
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
        <PasswordField label="Password (8 characters or more)" required minLength={8} maxLength={72} autoComplete="new-password" {...f.bind('password')} />
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
