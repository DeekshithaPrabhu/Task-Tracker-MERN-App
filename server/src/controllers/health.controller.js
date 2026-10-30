// Health check: confirms the API is up.
export const health = (_req, res) => res.status(200).json({ ok: true });
