import { useRef, useState } from 'react';

// Tracks which actions are waiting for the API, so their buttons can stay disabled until the call
// succeeds or fails. A second click on the same action is ignored, even if it arrives before React
// has re-rendered (a ref is checked synchronously; state alone would let a fast double click through).
//
//   const { run, isBusy } = useBusy();
//   <button disabled={isBusy('save')} onClick={() => run('save', () => api.save())}>Save</button>
export function useBusy() {
  const live = useRef(new Set());
  const [keys, setKeys] = useState([]);

  const isBusy = (key) => (key === undefined ? keys.length > 0 : keys.includes(key));

  const run = async (key, fn) => {
    if (live.current.has(key)) return;
    live.current.add(key);
    setKeys([...live.current]);
    try {
      return await fn();
    } finally {
      live.current.delete(key);
      setKeys([...live.current]);
    }
  };

  return { run, isBusy };
}
