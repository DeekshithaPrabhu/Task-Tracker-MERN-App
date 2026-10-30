import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthCard from '@/components/auth/AuthCard.jsx';
import FormStatus from '@/components/auth/FormStatus.jsx';
import { useForm } from '@/hooks/useForm.js';
import PasswordField from '@/components/auth/PasswordField.jsx';

export default function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const f = useForm({ name: '', email: '', password: '' }, async (v) => { await register(v); nav('/', { replace: true }); });
  return (
    <AuthCard title="Create your account" footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Name<input required autoComplete="name" autoFocus {...f.bind('name')} /></label>
        <label>Email<input type="email" required autoComplete="email" {...f.bind('email')} /></label>
        <PasswordField label="Password (8 characters or more)" required minLength={8} maxLength={72} autoComplete="new-password" {...f.bind('password')} />
        <FormStatus {...f} />
        <button className="primary" disabled={f.busy}>Create account</button>
      </form>
    </AuthCard>
  );
}
