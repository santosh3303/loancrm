// Computes {from, to} ISO date ranges for each period code used by the
// Dashboard's period dropdown. "To Date" ranges run from the start of the
// period through today; "Upcoming" ranges are the next full period ahead.

const iso = (d) => d.toISOString().slice(0, 10);
const startOfWeek = (d) => { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); return x; };
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfQuarter = (d) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);

export function periodRange(code) {
  const today = new Date();

  switch (code) {
    case 'WTD': return { from: iso(startOfWeek(today)), to: iso(today) };
    case 'MTD': return { from: iso(startOfMonth(today)), to: iso(today) };
    case 'QTD': return { from: iso(startOfQuarter(today)), to: iso(today) };
    case 'YTD': return { from: iso(startOfYear(today)), to: iso(today) };
    case 'NWK': {
      const start = new Date(today); start.setDate(start.getDate() + 1);
      const end = new Date(today); end.setDate(end.getDate() + 7);
      return { from: iso(start), to: iso(end) };
    }
    case 'NMTH': {
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { from: iso(start), to: iso(end) };
    }
    case 'NQTR': {
      const qStart = Math.floor(today.getMonth() / 3) * 3 + 3;
      const start = new Date(today.getFullYear(), qStart, 1);
      const end = new Date(today.getFullYear(), qStart + 3, 0);
      return { from: iso(start), to: iso(end) };
    }
    case 'NYR': {
      const start = new Date(today.getFullYear() + 1, 0, 1);
      const end = new Date(today.getFullYear() + 1, 11, 31);
      return { from: iso(start), to: iso(end) };
    }
    default: return null; // 'ALL' or unrecognized — no filter
  }
}

export const PERIOD_GROUPS = [
  { label: 'To Date', options: [
    { code: 'WTD', label: 'Week to Date' },
    { code: 'MTD', label: 'Month to Date' },
    { code: 'QTD', label: 'Quarter to Date' },
    { code: 'YTD', label: 'Year to Date' },
  ]},
  { label: 'Upcoming', options: [
    { code: 'NWK', label: 'Next Week' },
    { code: 'NMTH', label: 'Next Month' },
    { code: 'NQTR', label: 'Next Quarter' },
    { code: 'NYR', label: 'Next Year' },
  ]},
];
