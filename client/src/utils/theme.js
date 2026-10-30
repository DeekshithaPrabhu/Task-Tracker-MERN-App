// 'system' follows the OS; otherwise force light or dark. Remembered locally to avoid a flash on load.
export const applyTheme = (t = 'system') => {
  const el = document.documentElement;
  if (t === 'system') delete el.dataset.theme; else el.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch { /* storage unavailable */ }
};
