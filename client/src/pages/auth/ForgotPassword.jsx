import { Link } from 'react-router-dom';
import { api } from '@/api';
import AuthCard from '@/components/auth/AuthCard.jsx';
import FormStatus from '@/components/auth/FormStatus.jsx';
import { useForm } from '@/hooks/useForm.js';

export default function ForgotPassword() {
  const f = useForm({ email: '' }, async (v) => (await api.forgot(v.email)).message);
  return (
    <AuthCard title="Reset your password" footer={<Link to="/login">Back to log in</Link>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>Email<input type="email" required autoFocus {...f.bind('email')} /></label>
        <FormStatus {...f} />
        <button className="primary" disabled={f.busy}>Send reset link</button>
      </form>
    </AuthCard>
  );
}
