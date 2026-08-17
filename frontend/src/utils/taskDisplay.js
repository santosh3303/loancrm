// Shared between Dashboard and Daily Operations so both pages render task
// cards identically — same grouping, same colors, same tagline format.

export const GROUP_ORDER = ['overdue', 'today', 'upcoming', 'rest'];
export const BAR_COLOR = { overdue: '#e0503f', today: '#9aa5b1', upcoming: 'transparent', rest: 'transparent' };
const STATUS_WORD = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming', rest: '' };

export function statusOf(t, today) {
  if (t.due_date < today) return 'overdue';
  if (t.due_date === today) return 'today';
  if (t.due_date > today) return 'upcoming';
  return 'rest';
}

// "{Name}. {Party type}. {Method}. {Status}. Due {date}" — for tasks with no
// linked lead (e.g. Backend/internal tasks), the name segment is skipped.
export function taglineFor(t, name) {
  const today = new Date().toISOString().slice(0, 10);
  const status = STATUS_WORD[statusOf(t, today)];
  const parts = [];
  if (name) parts.push(name);
  parts.push(t.party_type, t.method);
  if (status) parts.push(status);
  parts.push(`Due ${t.due_date}`);
  return parts.join('. ');
}

export function sortByGroup(tasks, today) {
  return [...tasks].sort((a, b) => GROUP_ORDER.indexOf(statusOf(a, today)) - GROUP_ORDER.indexOf(statusOf(b, today)));
}
