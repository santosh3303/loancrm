// Shared ₹-prefix, Indian-comma-grouped formatting for every editable money field
// in the app (Lead Amount, Monthly Income, Loan File Amount, Commission Amount, etc).
// Read-only displays elsewhere already use `₹${Number(x).toLocaleString('en-IN')}`
// directly in JSX and don't need this — this is specifically for <input> fields,
// which need to format live as the person types while still storing a plain number.

// Turns whatever's currently in the input (raw digits, or an already-formatted
// string like "₹ 15,00,000") into the live-formatted display string.
export function formatRupeeDisplay(value) {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return '';
  return '₹ ' + Number(digits).toLocaleString('en-IN');
}

// Strips everything back down to a plain number (or null if empty), for saving.
export function parseRupeeValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}
