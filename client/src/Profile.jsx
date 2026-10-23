import { useEffect, useState } from 'react';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

function Msg({ m }) {
  return m ? <p className={m.err ? 'err' : 'okmsg'} role={m.err ? 'alert' : 'status'}>{m.text}</p> : null;
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [info, setInfo] = useState({ name: user.name, email: user.email });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [m, setM] = useState({}); // messages per section
  const [cats, setCats] = useState([]);
  const [edits, setEdits] = useState({});
  const [newCat, setNewCat] = useState('');

  const say = (k, text, err = false) => setM((x) => ({ ...x, [k]: { text, err } }));
  const run = (k, fn, done) => async (e) => {
    e?.preventDefault();
    try { await fn(); say(k, done); } catch (x) { say(k, x.message, true); }
  };
  const loadCats = () => api.categories().then(setCats).catch((x) => say('cat', x.message, true));
  useEffect(() => { loadCats(); }, []);

  return (
    <>
      <header className="top"><h1>Profile</h1></header>
      <div className="grid prof">
        <form className="panel stack" onSubmit={run('info', async () => setUser(await api.profile(info)), 'Profile saved')}>
          <h2>Your details</h2>
          <label>Name<input required value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></label>
          <label>Email<input type="email" required value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} /></label>
          <Msg m={m.info} /><button className="primary">Save</button>
        </form>

        <form className="panel stack" onSubmit={run('pw', async () => { await api.changePassword(pw); setPw({ currentPassword: '', newPassword: '' }); }, 'Password changed')}>
          <h2>Change password</h2>
          <label>Current password<input type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label>New password (8 or more characters)<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
          <Msg m={m.pw} /><button className="primary">Update password</button>
        </form>

        <section className="panel stack">
          <h2>Theme</h2>
          <div className="chips">
            {['system', 'light', 'dark'].map((t) => (
              <button key={t} className={`chip ${user.theme === t ? 'on' : ''}`} aria-pressed={user.theme === t}
                onClick={async () => { setUser({ ...user, theme: t }); api.profile({ theme: t }).catch(() => {}); }}>{t}</button>
            ))}
          </div>
          <p className="hint">System follows your device's setting.</p>
        </section>

        <section className="panel stack">
          <h2>Categories</h2>
          <form className="row" onSubmit={run('cat', async () => { await api.addCategory(newCat); setNewCat(''); await loadCats(); }, 'Category added')}>
            <input placeholder="New category" aria-label="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} required maxLength={30} />
            <button className="primary">Add</button>
          </form>
          {cats.map((c) => (
            <div className="row" key={c._id}>
              <input aria-label={`Rename ${c.name}`} maxLength={30} value={edits[c._id] ?? c.name} onChange={(e) => setEdits({ ...edits, [c._id]: e.target.value })} />
              {edits[c._id] !== undefined && edits[c._id] !== c.name &&
                <button className="ghost small" onClick={run('cat', async () => { await api.renameCategory(c._id, edits[c._id]); setEdits(({ [c._id]: _, ...rest }) => rest); await loadCats(); }, 'Category renamed')}>Save</button>}
              <button className="ghost small danger" onClick={run('cat', async () => {
                if (!window.confirm(`Delete “${c.name}”? Its tasks are kept but become uncategorised.`)) return;
                await api.deleteCategory(c._id); await loadCats();
              }, 'Category deleted')}>Delete</button>
            </div>
          ))}
          <Msg m={m.cat} />
          <p className="hint">Tags are free-form: add them when you create or edit a task.</p>
        </section>
      </div>
    </>
  );
}
