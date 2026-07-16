// Slicer-style multi-select checkbox list, matching the original Excel
// workbook's slicer UX (and the earlier PHP dashboard's slicer-row pattern).
// renderSlicer(container, {label, options, selected}) draws the widget and
// returns { getSelected(): string[] }.

let uid = 0;

/**
 * options: array of strings, OR array of [value, label] pairs.
 * selected: array of currently-ticked values.
 * onChange: optional callback fired whenever a checkbox changes.
 */
export function renderSlicer(container, { label, options, selected = [], onChange }) {
  const id = `slicer_${uid++}`;
  const norm = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  const selectedSet = new Set(selected);

  const wrap = document.createElement('div');
  wrap.className = 'slicer';
  wrap.innerHTML = `
    <h4>${label}</h4>
    <div class="toggle-links">
      <a data-action="all">All</a><a data-action="none">None</a>
    </div>
    <div class="options"></div>
  `;
  const optionsEl = wrap.querySelector('.options');
  norm.forEach(([value, text], i) => {
    const row = document.createElement('div');
    row.className = 'check-row';
    const cbId = `${id}_${i}`;
    row.innerHTML = `
      <input type="checkbox" id="${cbId}" value="${escapeAttr(value)}" ${selectedSet.has(value) ? 'checked' : ''}>
      <label for="${cbId}">${escapeHtml(text)}</label>
    `;
    optionsEl.appendChild(row);
  });

  wrap.querySelector('[data-action="all"]').addEventListener('click', () => {
    wrap.querySelectorAll('input[type=checkbox]').forEach((cb) => { cb.checked = true; });
    if (onChange) onChange();
  });
  wrap.querySelector('[data-action="none"]').addEventListener('click', () => {
    wrap.querySelectorAll('input[type=checkbox]').forEach((cb) => { cb.checked = false; });
    if (onChange) onChange();
  });
  if (onChange) {
    optionsEl.addEventListener('change', onChange);
  }

  container.appendChild(wrap);

  return {
    getSelected() {
      return Array.from(wrap.querySelectorAll('input[type=checkbox]:checked')).map((cb) => cb.value);
    },
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}
