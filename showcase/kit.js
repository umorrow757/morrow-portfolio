// Dashboard kit: small, data-only components in the site's look. Batch C reuses it.
// Every component is fn(host, data) -> cleanup(): it appends one root inside host and the cleanup removes it,
// its listeners and any timer. No storage, no network, no innerHTML. Nothing animates: values swap in one cut,
// the ticker steps (never scrolls), bars and graphs are drawn once.

const SVG = 'http://www.w3.org/2000/svg'; // XML namespace id for createElementNS, not a link: nothing is fetched

export function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in props || {}) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat(Infinity).forEach((c) => c != null && c !== false && e.append(c));
  return e;
}

const svg = (tag, attrs) => {
  const e = document.createElementNS(SVG, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};
// num(value, money?) -> '1,234' or '$1,234'.
export const num = (v, money) => (money ? '$' : '') + Number(v).toLocaleString('en-US');
const card = (title, cls, ...kids) => el('section', { class: 'kt-card ' + cls }, el('h5', { text: title }), kids);
const put = (host, root) => { host.append(root); return () => root.remove(); };

// kpiStrip(host, [[label, value, note?], ...]) : 4-up, 2-up under 600 px. Numbers get thousands separators.
export function kpiStrip(host, items) {
  return put(host, el('div', { class: 'kt-kpis' }, items.map(([l, v, s]) =>
    el('div', { class: 'kpi' }, el('small', { text: l }), el('b', { text: typeof v === 'number' ? num(v) : v }), s ? el('span', { class: 'kt-dim', text: s }) : null))));
}

// statusBoard(host, { title, rows: [[name, state], ...], tones: { state: 'ok'|'go'|'warn'|'stop'|'idle' } })
// The state is always a word; the pill's border color only repeats it.
export function statusBoard(host, { title, rows, tones = {} }) {
  return put(host, card(title, 'kt-board', el('ul', null, rows.map(([n, s]) =>
    el('li', null, el('span', { text: n }), el('span', { class: 'kt-pill kt-' + (tones[s] || 'idle'), text: s }))))));
}

// progressBars(host, { title, bars: [[label, value, max], ...], money? })
// Static bars with the numbers in text; over max shows "over by" in words and a full bar.
export function progressBars(host, { title, bars, money }) {
  return put(host, card(title, 'kt-bars', bars.map(([l, v, m]) => {
    const p = Math.round(v / m * 100), over = v > m;
    return el('div', null,
      el('p', null, el('span', { text: l }), el('b', { text: `${num(v, money)} of ${num(m, money)} · ${p}%` + (over ? ` · over by ${num(v - m, money)}` : '') })),
      el('div', { class: 'cc-track' + (over ? ' kt-over' : ''), 'aria-hidden': 'true' }, el('span', { class: 'cc-bar', style: `width:${Math.min(p, 100)}%` })));
  })));
}

// ticker(host, { title, items: [text, ...], ms = 6000 })
// One item at a time, swapped in one cut every ms. Pause/Play button; holds while hovered or focused;
// starts paused under reduced motion. The full list is always one tap away as a static list.
export function ticker(host, { title, items, ms = 6000 }) {
  let i = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches, hold = false;
  const line = el('p', { class: 'kt-tick' }), count = el('span', { class: 'kt-dim' });
  const btn = el('button', { type: 'button', class: 'ghost', onclick: () => { paused = !paused; show(); } });
  const show = () => {
    line.textContent = items[i];
    count.textContent = `${i + 1} of ${items.length}` + (paused ? ' · paused' : '');
    btn.textContent = paused ? 'Play updates' : 'Pause updates';
  };
  const timer = setInterval(() => { if (!paused && !hold) { i = (i + 1) % items.length; show(); } }, ms);
  const on = () => { hold = true; }, off = () => { hold = false; };
  const root = card(title, 'kt-ticker', line, el('div', { class: 'kt-row' }, btn, count),
    el('details', null, el('summary', { text: `All updates (${items.length})` }), el('ul', { class: 'kt-list' }, items.map((t) => el('li', { text: t })))));
  ['mouseenter', 'focusin'].forEach((e) => root.addEventListener(e, on));
  ['mouseleave', 'focusout'].forEach((e) => root.addEventListener(e, off));
  show();
  const rm = put(host, root);
  return () => { clearInterval(timer); rm(); };
}

// graph(host, { title, kind: 'bar'|'line', unit, points: [[label, value], ...], money? })
// Inline SVG, scaled from zero. A fixed-height readout ABOVE the graph shows the focused or hovered point;
// a label row under it shows every value as text. Points are one tab stop; arrow keys move between them.
export function graph(host, { title, kind = 'bar', unit = '', points, money }) {
  const W = 320, H = 150, T = 10, n = points.length, cw = W / n;
  const max = Math.max(...points.map((p) => p[1])) || 1;
  const y = (v) => H - (v / max) * (H - T);
  const say = (p) => `${p[0]}: ${num(p[1], money)}${unit ? ' ' + unit : ''}`;
  const read = el('p', { class: 'kt-read', text: 'Focus or point at a value to read it here.' });
  const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'kt-svg', role: 'group', 'aria-label': `${title}. ${points.map(say).join('; ')}.` });
  g.append(svg('line', { x1: 0, y1: H - 0.5, x2: W, y2: H - 0.5, class: 'kt-base' }));
  if (kind === 'line') g.append(svg('polyline', { points: points.map((p, i) => `${(i + 0.5) * cw},${y(p[1])}`).join(' '), class: 'kt-line' }));
  const marks = points.map((p, i) => g.appendChild(kind === 'line'
    ? svg('circle', { cx: (i + 0.5) * cw, cy: y(p[1]), r: 6, class: 'kt-mark' })
    : svg('rect', { x: i * cw + cw * 0.2, y: y(p[1]), width: cw * 0.6, height: H - y(p[1]), rx: 3, class: 'kt-mark' })));
  const hits = points.map((p, i) => {
    const r = svg('rect', { x: i * cw, y: 0, width: cw, height: H, class: 'kt-hit', tabindex: i ? -1 : 0, role: 'img', 'aria-label': say(p) });
    const pick = () => { read.textContent = say(p); marks.forEach((m, k) => m.classList.toggle('on', k === i)); };
    r.addEventListener('focus', pick);
    r.addEventListener('mouseenter', pick);
    r.addEventListener('pointerdown', () => r.focus());
    return g.appendChild(r);
  });
  g.addEventListener('keydown', (e) => {
    const i = hits.indexOf(document.activeElement);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (i < 0 || to == null) return;
    e.preventDefault();
    const k = (to + n) % n;
    hits.forEach((x, j) => x.setAttribute('tabindex', j === k ? 0 : -1));
    hits[k].focus();
  });
  return put(host, card(title, 'kt-graph', read, g,
    el('ol', { class: 'kt-axis', style: `grid-template-columns:repeat(${n},1fr)`, 'aria-hidden': 'true' },
      points.map((p) => el('li', null, el('span', { text: p[0] }), el('b', { text: num(p[1], money) }))))));
}
