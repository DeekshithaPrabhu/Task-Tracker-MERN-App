import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="notfound">
      <p className="big" aria-hidden="true">404</p>
      <h1>This page doesn't exist</h1>
      <p className="hint">The link may be broken, or the page may have moved.</p>
      <p><Link className="primary linkbtn" to={user ? '/' : '/login'}>{user ? 'Back to dashboard' : 'Go to log in'}</Link></p>
    </div>
  );
}
