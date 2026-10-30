export const OPEN = { status: { $ne: 'done' } };

// Only these fields can be set from a request (never user or completedAt)
const FIELDS = ['title', 'description', 'priority', 'status', 'startDate', 'dueDate', 'estimatedMinutes'];

export const pickTaskFields = (body) => {
  const out = {};
  for (const k of FIELDS) if (k in body) out[k] = body[k];
  return out;
};
