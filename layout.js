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
  { key: 'vended-yoy', href: 'vended-yoy.html', label: 'Vended YoY' },
  { key: 'invoiced-yoy', href: 'invoiced-yoy.html', label: 'Invoiced YoY' },
  { key: 'reports', href: 'reports.html', label: 'Report Builder' },
  { key: 'products', href: 'products.html', label: 'Products' },
  { key: 'upload', href: 'upload.html', label: 'Monthly Upload' },
];

/** Renders the shared top navigation bar into #topbar-root. Call once per page.
 * Also renders a "Log out" link on the right when a session is present. */
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
      <div class="topbar-right"><a id="logout-link" href="#" style="display:none;">Log out</a></div>
    </div>
  `;
  const logoutLink = document.getElementById('logout-link');
  supabase.auth.getSession().then(({ data }) => {
    if (data && data.session) logoutLink.style.display = '';
  });
  logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
}

/** Call at the top of every protected page (after DOM is ready, before any
 * data fetching). Redirects to login.html if there is no active Supabase
 * Auth session. Returns the session (or null, though by then we've already
 * navigated away) so callers can await it before fetching data. */
export async function requireAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data || !data.session) {
    window.location.href = 'login.html';
    return null;
  }
  return data.session;
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

/** Supabase's REST API caps every response at 1000 rows (PostgREST's
 * db-max-rows project setting) regardless of any LIMIT inside the RPC
 * function itself. Our detail RPCs (get_vended_detail / get_invoiced_detail)
 * are built to return up to 20,000 rows, so this pages through with
 * .range() until either the cap is hit or a short page comes back. */
export async function fetchAllRpc(fn, params, options) {
  const pageSize = (options && options.pageSize) || 1000;
  const cap = (options && options.cap) || 20000;
  const rows = [];
  let from = 0;
  while (rows.length < cap) {
    const to = Math.min(from + pageSize, cap) - 1;
    const { data, error } = await supabase.rpc(fn, params).range(from, to);
    if (error) return { data: null, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < (to - from + 1)) break; // short page = no more rows
    from += pageSize;
  }
  return { data: rows, error: null };
}

/** Same idea as fetchAllRpc, but for a plain table query (supabase.from(...))
 * instead of an RPC call. Pass a factory function that returns a *fresh*
 * query builder each call (a builder can only be used once), e.g.:
 *   fetchAllFrom(() => supabase.from('crib_locations').select('crib, site_key'))
 */
export async function fetchAllFrom(makeQuery, options) {
  const pageSize = (options && options.pageSize) || 1000;
  const cap = (options && options.cap) || 50000;
  const rows = [];
  let from = 0;
  while (rows.length < cap) {
    const to = Math.min(from + pageSize, cap) - 1;
    const { data, error } = await makeQuery().range(from, to);
    if (error) return { data: null, error };
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < (to - from + 1)) break;
    from += pageSize;
  }
  return { data: rows, error: null };
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
