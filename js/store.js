// Day Mastery data: one JSON object in localStorage, saved shortly after every change.
// Everything stays on this device. Settings > Your data exports and restores it.
const KEY = 'dayMastery';

export const pad = n => String(n).padStart(2, '0');
export const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromDk = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const shift = (k, n) => { const d = fromDk(k); d.setDate(d.getDate() + n); return dk(d); };
export const lastDays = (n, end = dk()) => Array.from({ length: n }, (_, i) => shift(end, i - n + 1));

export const TOOL_IDS = ['plan', 'focus', 'habits', 'hydrate', 'breathe', 'sleep', 'journal', 'sounds'];
const US = /^en-us$/i.test(navigator.language || '');

function defaults() {
  const today = dk();
  return {
    v: 1,
    profile: { name: '', onboarded: false, since: today },
    settings: {
      theme: 'sunrise', custom: '#ee6a3c', mode: 'auto',
      tools: Object.fromEntries(TOOL_IDS.map(id => [id, { on: true, count: id !== 'sounds' }])),
      order: [...TOOL_IDS],
      pins: ['focus', 'habits', 'growth'],
      sound: true, keepAwake: true, installHint: true,
    },
    goals: {
      priorities: 3, focusSessions: 4, focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, autoNext: true,
      water: US ? 1893 : 2000, unit: US ? 'oz' : 'ml', breatheMin: 5, sleepHours: 8, wake: '07:00', latency: 15,
    },
    plan: { days: {} },
    focus: { days: {}, timer: null },
    habits: { list: [
      { id: 'h1', name: 'Meditate', emoji: '🧘', color: '#2b8fd6', days: {}, created: today },
      { id: 'h2', name: 'Move for 30 minutes', emoji: '🏃', color: '#3f9a5c', days: {}, created: today },
      { id: 'h3', name: 'Read 10 pages', emoji: '📖', color: '#e39a2d', days: {}, created: today },
    ] },
    hydrate: { days: {} },
    breathe: { days: {}, pattern: 'box', length: 5 },
    sleep: { log: {} },
    journal: { days: {} },
    sounds: { mix: {}, master: 0.8, saved: {}, preset: '' },
  };
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, saved) {
  for (const k of Object.keys(saved)) base[k] = isObj(base[k]) && isObj(saved[k]) ? merge(base[k], saved[k]) : saved[k];
  return base;
}
function build(saved) {
  const s = merge(defaults(), isObj(saved) ? saved : {});
  // Keep every tool this version knows about in the order list, even if saved data predates it.
  s.settings.order = [...new Set([...s.settings.order.filter(id => TOOL_IDS.includes(id)), ...TOOL_IDS])];
  return s;
}
function load() {
  try { return build(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return build(null); }
}

export const S = load();

let timer;
export function flush() {
  clearTimeout(timer);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('Could not save', e); }
}
export function save() { clearTimeout(timer); timer = setTimeout(flush, 150); }
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

export function replaceAll(data) {
  const fresh = build(data);
  Object.keys(S).forEach(k => delete S[k]);
  Object.assign(S, fresh);
  flush();
}
export function eraseAll() { clearTimeout(timer); localStorage.removeItem(KEY); }

export const getPath = p => p.split('.').reduce((o, k) => o?.[k], S);
export function setPath(p, v) {
  const ks = p.split('.'), last = ks.pop();
  ks.reduce((o, k) => o[k], S)[last] = v;
  save();
}
