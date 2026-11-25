// S9: dashboards on one pretend company. All invented; KPIs are computed from each tab's data so they agree.
import { el, num, kpiStrip, statusBoard, progressBars, ticker, graph } from './kit.js';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const count = (t, s) => t.rows.filter((r) => r[1] === s).length;
const vals = (t) => t.pts.map((p) => p[1]);

/* ===== DATA ===== */
const TABS = [
  { name: 'Content pipeline', board: 'Pieces in the pipeline',
    rows: [['Nap time tips, part 3 (sample)', 'Editing'], ['Meet the keepers', 'Posted'], ['Snack-time safety', 'Filming'],
      ['Hoard counting 101', 'Drafting'], ['Lullaby of the week', 'Posted'], ['Mitten review', 'Idea']],
    tones: { Posted: 'ok', Editing: 'go', Filming: 'go', Drafting: 'warn' },
    bt: 'Goals this month', bars: [['Posts', 2, 4], ['Scripts drafted', 5, 6], ['Videos edited', 3, 4]],
    tick: ['Nap time tips, part 3 is in Editing.', 'Meet the keepers passed 200 views.', 'Snack-time safety films today.', 'Hoard counting 101 in review.'],
    g: ['line', 'Views per week', 'views'], pts: [['Wk 1', 120], ['Wk 2', 180], ['Wk 3', 150], ['Wk 4', 240]],
    kpi: (t) => [['Pieces', t.rows.length], ['Posted', count(t, 'Posted')], ['Views, 4 wks', sum(vals(t))], ['Best week', Math.max(...vals(t))]] },
  { name: 'App and game building', board: 'Builds',
    rows: [['Hoard Counter app (sample)', 'Testing'], ['Nap Timer widget', 'Done'], ['Dragon Dash game', 'Building'],
      ['Sign-in page', 'Done'], ['Snack Tracker', 'Blocked']],
    tones: { Done: 'ok', Testing: 'go', Building: 'go', Blocked: 'stop' },
    bt: 'Tasks done', bars: [['Hoard Counter app', 18, 24], ['Dragon Dash game', 9, 30], ['Snack Tracker', 4, 12]],
    tick: ['Nap Timer widget shipped.', 'Hoard Counter app: 6 tasks left.', 'Snack Tracker blocked: no snack menu yet.', 'Dragon Dash game: level 2 art.'],
    g: ['bar', 'Tasks closed per week', 'tasks'], pts: [['Wk 1', 7], ['Wk 2', 9], ['Wk 3', 5], ['Wk 4', 10]],
    kpi: (t) => [['Builds', t.rows.length], ['Done', count(t, 'Done')], ['Tasks closed', sum(vals(t))], ['Tasks left', sum(t.bars.map((b) => b[2] - b[1]))]] },
  { name: 'Business', board: 'Lairs',
    rows: [['Mount Singe Lair', 'Waitlist'], ['Ember Hollow Nursery', 'Open beds'], ['Soot Lake Annex', 'Full'], ['Cinder Creek Creche', 'Open beds']],
    tones: { Waitlist: 'warn', Full: 'go', 'Open beds': 'ok' }, keepers: 23,
    bt: 'Beds filled', bars: [['Mount Singe Lair', 64, 64], ['Ember Hollow Nursery', 41, 48], ['Soot Lake Annex', 30, 30], ['Cinder Creek Creche', 22, 36]],
    tick: ['Mount Singe Lair: 5 on the waitlist.', 'Ember Hollow Nursery: 7 open beds.', 'Cinder Creek Creche hired 2 keepers.', 'Soot Lake Annex is full.'],
    g: ['line', 'Enrolled by month', 'dragons'], pts: [['Aug', 139], ['Sep', 146], ['Oct', 151], ['Nov', 157]],
    kpi: (t) => { const n = sum(t.bars.map((b) => b[1])), beds = sum(t.bars.map((b) => b[2]));
      return [['Enrolled', n], ['Open beds', beds - n], ['Keepers', t.keepers], ['Dragons per keeper', (n / t.keepers).toFixed(1)]]; } },
  { name: 'Finance', board: 'Budget lines', money: 1,
    rows: [['Keeper pay', 'On track'], ['Nap pods', 'On track'], ['Marshmallows', 'On track'], ['Keeper training', 'Watch'], ['Fireproof mittens', 'Over']],
    tones: { 'On track': 'ok', Watch: 'warn', Over: 'stop' },
    bt: 'Spent of budget (pretend $)', bars: [['Keeper pay', 9000, 9000], ['Nap pods', 3100, 4000], ['Marshmallows', 1200, 2000], ['Keeper training', 1350, 1500], ['Fireproof mittens', 950, 800]],
    tick: ['Fireproof mittens: over budget by $150.', 'Nap pods: $900 left this month.', 'Revenue up $500 on October.', 'Keeper training at 90% of budget.'],
    g: ['bar', 'Revenue by month (pretend $)', ''], pts: [['Aug', 16200], ['Sep', 17000], ['Oct', 17900], ['Nov', 18400]],
    kpi: (t) => { const r = vals(t)[3], c = sum(t.bars.map((b) => b[1]));
      return [['Revenue, Nov', num(r, 1)], ['Costs, Nov', num(c, 1)], ['Net, Nov', num(r - c, 1)], ['Budget used', Math.round(c / sum(t.bars.map((b) => b[2])) * 100) + '%']]; } },
];
/* ===== END ===== */

let S = null;
const N = TABS.length;

function show(i, focus) {
  const t = TABS[i];
  S.off.forEach((f) => f());
  S.tabs.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
  S.panel.setAttribute('aria-labelledby', 'd9-t' + i);
  S.panel.textContent = '';
  const grid = el('div', { class: 'kt-grid' });
  S.off = [kpiStrip(S.panel, t.kpi(t))];
  S.panel.append(grid);
  S.off.push(statusBoard(grid, { title: t.board, rows: t.rows, tones: t.tones }),
    progressBars(grid, { title: t.bt, bars: t.bars, money: t.money }),
    ticker(grid, { title: 'Updates', items: t.tick }),
    graph(grid, { title: t.g[1], kind: t.g[0], unit: t.g[2], points: t.pts, money: t.money }));
  if (focus) S.tabs[i].focus();
}

export function mount(host) {
  host.textContent = '';
  S = { off: [] };
  S.tabs = TABS.map((t, i) => el('button', { type: 'button', role: 'tab', id: 'd9-t' + i, class: 'd9-tab', 'aria-controls': 'd9-p', text: t.name }));
  S.list = el('div', { class: 'd9-tabs', role: 'tablist', 'aria-label': 'Dashboards' }, S.tabs);
  S.panel = el('div', { class: 'd9-panel', id: 'd9-p', role: 'tabpanel', tabindex: 0 });
  S.on = (e) => { // click, or arrows / Home / End
    const i = S.tabs.indexOf(e.target.closest('[role="tab"]'));
    const to = e.type === 'click' ? i : { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: N - 1 }[e.key];
    if (i < 0 || to == null) return;
    e.preventDefault();
    show((to + N) % N, true);
  };
  ['click', 'keydown'].forEach((e) => S.list.addEventListener(e, S.on));
  host.append(el('div', { class: 'd9' }, el('p', { class: 'mock', text: 'SAMPLE / MOCK DATA' }), S.list, S.panel));
  show(0, false);
}

export function unmount() {
  if (!S) return;
  S.off.forEach((f) => f());
  ['click', 'keydown'].forEach((e) => S.list.removeEventListener(e, S.on));
  S = null;
}
