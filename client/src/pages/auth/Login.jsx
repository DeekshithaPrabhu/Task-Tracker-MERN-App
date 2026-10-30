import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthCard from '@/components/auth/AuthCard.jsx';
import FormStatus from '@/components/auth/FormStatus.jsx';
import { useForm } from '@/hooks/useForm.js';
import PasswordField from '@/components/auth/PasswordField.jsx';

export default function Login() {
  const { login, expired } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const f = useForm({ email: '', password: '' }, async (v) => { await login(v); nav(loc.state?.from || '/', { replace: true }); });
  return (
    <AuthCard title="Log in" footer={<>New here? <Link to="/register">Create an account</Link></>}>
      {expired && <p className="notice" role="alert">Your session expired. Log in again to pick up where you left off.</p>}
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Email<input type="email" required autoComplete="username" autoFocus {...f.bind('email')} /></label>
        <PasswordField label="Password" required autoComplete="current-password" {...f.bind('password')} />
        <FormStatus {...f} />
        <button className="primary" disabled={f.busy}>Log in</button>
        <Link to="/forgot-password" className="sub">Forgot password?</Link>
      </form>
    </AuthCard>
  );
}
