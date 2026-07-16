// Shared page shell: top nav + supabase client factory + small helpers used
// across every page. Import as an ES module.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const NAV_ITEMS = [
  { key: 'export', href: 'index.html', label: 'JDE Export' },
  { key: 'vended', href: 'vended.html', label: 'Vended' },
  { key: 'invoiced', href: 'invoiced.html', label: 'Invoiced' },
  { key: 'reports', href: 'reports.html', label: 'Report Builder' },
];

/** Renders the shared top navigation bar into #topbar-root. Call once per page. */
export function renderNav(active) {
  const root = document.getElementById('topbar-root');
  if (!root) return;
  const links = NAV_ITEMS.map((item) => {
    const cls = item.key === active ? 'active' : '';
    return `<a href="${item.href}" class="${cls}">${item.label}</a>`;
  }).join('');
  root.innerHTML = `
    <div class="topbar">
      <div class="brand">Vending Dashboard</div>
      <nav>${links}</nav>
    </div>
  `;
}

/** Formats a number the way PHP's float-to-string / fputcsv does: fixed
 * decimal places for display, but trailing zeros dropped for CSV export
 * (so 240.30 becomes "240.3", matching the original JDE upload example). */
export function csvNumber(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '';
  return String(n);
}

export function money(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n) || n === null || n === undefined) return '';
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Escapes a single CSV field per RFC4180: quote if it contains a comma,
 * quote, or newline; double up any embedded quotes. */
function csvField(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Builds a CSV string (CRLF line endings, per RFC4180 / the original
 * workbook exports) from an array of header strings and an array of row
 * arrays (values already formatted as strings). */
export function buildCsv(headers, rows) {
  const lines = [headers.map(csvField).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvField).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

/** Triggers a browser download of a CSV string. */
export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
