import { useState } from 'react';

// Shared form behaviour: field state, busy flag, error and success message
export function useForm(initial, submit) {
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
