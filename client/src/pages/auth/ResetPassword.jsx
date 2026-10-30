import { Link, useParams } from 'react-router-dom';
import { api } from '@/api';
import AuthCard from '@/components/auth/AuthCard.jsx';
import FormStatus from '@/components/auth/FormStatus.jsx';
import { useForm } from '@/hooks/useForm.js';

export default function ResetPassword() {
  const { token } = useParams();
  const f = useForm({ password: '', confirm: '' }, async (v) => {
    if (v.password !== v.confirm) throw new Error('Passwords do not match');
    return (await api.reset(token, v.password)).message;
  });
  return (
    <AuthCard title="Choose a new password" footer={<Link to="/login">Go to log in</Link>}>
      <form className="auth-form" onSubmit={f.onSubmit}>
        <label>New password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" autoFocus {...f.bind('password')} /></label>
        <label>Confirm password<input type="password" required autoComplete="new-password" {...f.bind('confirm')} /></label>
        <FormStatus {...f} />
        <button className="primary" disabled={f.busy}>Update password</button>
      </form>
    </AuthCard>
  );
}
