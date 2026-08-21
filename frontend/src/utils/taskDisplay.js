// Shared between Dashboard and Daily Operations so both pages render task
// cards identically — same grouping, same colors, same tagline format.

export const GROUP_ORDER = ['overdue', 'today', 'upcoming', 'rest', 'done'];
export const BAR_COLOR = { overdue: '#e0503f', today: '#9aa5b1', upcoming: 'transparent', rest: 'transparent', done: 'transparent' };
const STATUS_WORD = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming', rest: '', done: 'Done' };
const IMPORTANT_COLOR = '#d19a1a';

export function statusOf(t, today) {
  if (t.status === 'Done') return 'done';
  if (t.due_date < today) return 'overdue';
  if (t.due_date === today) return 'today';
  if (t.due_date > today) return 'upcoming';
  return 'rest';
}

// "Important" is a manual flag, independent of the time-based grouping —
// it overrides the bar color (but not the sort group) wherever it's set.
export function barColorFor(t, today) {
  if (t.priority_tag === 'Important') return IMPORTANT_COLOR;
  return BAR_COLOR[statusOf(t, today)];
}

// "{Name}. {Party type}. {Method}. {Status}. Due {date}" — for tasks with no
// linked lead (e.g. Backend/internal tasks), the name segment is skipped.
// The due-date segment uses relative day-phrasing on cards (per product
// decision) — exact dates only appear in the Modify form's date field.
export function taglineFor(t, name) {
  const today = new Date().toISOString().slice(0, 10);
  const status = STATUS_WORD[statusOf(t, today)];
  const parts = [];
  if (name) parts.push(name);
  parts.push(t.party_type, t.method);
  if (status) parts.push(status);
  parts.push(relativeDueDate(t.due_date, today));
  return parts.join('. ');
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.round((d1 - d2) / 86400000);
}

export function relativeDueDate(due_date, today) {
  const diff = daysBetween(due_date, today);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return 'Overdue since yesterday';
  if (diff > 1) return `Due in ${diff} days`;
  return `Overdue since ${Math.abs(diff)} days`;
}

// "10 Jan'26" — the display format used everywhere dates are shown as text
// (never inside <input type="date">, which must stay ISO for the picker).
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month}'${year}`;
}

// Same date format, plus the time portion — for timestamps like audit_log's
// changed_at ("YYYY-MM-DD HH:MM:SS") where the exact time is meaningful.
export function formatDateTimeDisplay(dateTimeStr) {
  if (!dateTimeStr) return '';
  const [datePart, timePart] = String(dateTimeStr).split(' ');
  const formattedDate = formatDateDisplay(datePart);
  return timePart ? `${formattedDate}, ${timePart.slice(0, 5)}` : formattedDate;
}

export function sortByGroup(tasks, today) {
  return [...tasks].sort((a, b) => GROUP_ORDER.indexOf(statusOf(a, today)) - GROUP_ORDER.indexOf(statusOf(b, today)));
}
