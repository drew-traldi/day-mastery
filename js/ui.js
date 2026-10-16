// Shared UI: icons, headers, sheets, toasts, form controls, themes, the growing plant, and sound.
import { S, dk, fromDk, shift, getPath, setPath } from './store.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const go = id => { location.hash = '#/' + id; };
export const refresh = () => dispatchEvent(new Event('dm:refresh'));
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- icons (shapes adapted from Lucide, ISC license) ---------- */
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  habit: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  skip: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3 0 2.5 2.5 3 2.5 3z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
};
export const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

export function header({ title, sub = '', back = false, actions = '', tool = '' }) {
  return `<header class="hd">${back ? `<button class="icon-btn" data-act="back" aria-label="Back">${ic('chevL')}</button>` : ''}<span class="sp"></span>${actions}</header>
<h1 class="title"${tool ? ` style="--c:var(--c-${tool})"` : ''}>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}`;
}

/* ---------- formatting ---------- */
export const clock = (s, up = false) => { s = Math.max(0, up ? Math.floor(s) : Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const dur = min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`; };
export const timeLabel = hhmm => { const [h, m] = hhmm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
export const dayLabel = k => k === dk() ? 'Today' : k === shift(dk(), -1) ? 'Yesterday' : fromDk(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const wd = k => fromDk(k).toLocaleDateString(undefined, { weekday: 'narrow' });
export const num = n => Math.round(n).toLocaleString();

export function dayNav(k) {
  return `<div class="daynav"><button class="icon-btn sm" data-day="-1" aria-label="Previous day">${ic('chevL')}</button><b>${dayLabel(k)}</b><button class="icon-btn sm" data-day="1" ${k >= dk() ? 'disabled' : ''} aria-label="Next day">${ic('chevR')}</button></div>`;
}
export function bindDayNav(root, k, set) {
  $$('[data-day]', root).forEach(b => b.onclick = () => { const n = shift(k, +b.dataset.day); if (n <= dk()) set(n); });
}

/* Little 7-day bar chart. items: [{k, v (0..1), tip}] */
export function bars(items) {
  return `<div class="bars">${items.map(it => `<div class="b ${it.k === dk() ? 'today' : ''}" data-k="${it.k}"><i class="${it.v >= 1 ? 'full' : it.v > 0 ? '' : 'zero'}" style="height:${Math.max(6, Math.min(1, it.v) * 100)}%"></i><span>${wd(it.k)}</span></div>`).join('')}</div>`;
}

/* Small progress ring with an icon inside. */
export function ring(v, color, icon = '') {
  const C = 94.25, p = Math.min(1, Math.max(0, v)) * C;
  return `<span class="mring" style="--c:${color}"><svg class="rg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" class="t"/><circle cx="18" cy="18" r="15" class="p" stroke-dasharray="${p} ${C}"/></svg>${icon ? ic(icon) : ''}</span>`;
}

/* ---------- toast + sheets ---------- */
let toastTimer;
export function toast(msg, action, ms = 3400) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
  if (action) $('button', el).onclick = () => { el.classList.remove('on'); action.fn(); };
  el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

export function sheet({ title = '', html = '', mount, onClose, tool }) {
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  const el = document.createElement('div'); el.className = 'sheet';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  if (tool) el.style.setProperty('--c', `var(--c-${tool})`);
  el.innerHTML = `<div class="grab"></div>${title ? `<div class="sheet-h"><h3>${title}</h3><button class="icon-btn sm" data-x aria-label="Close">${ic('x')}</button></div>` : ''}<div class="sheet-b">${html}</div>`;
  document.body.append(bg, el);
  document.body.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => { bg.classList.add('on'); el.classList.add('on'); }));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    bg.classList.remove('on'); el.classList.remove('on');
    if (!$$('.sheet.on').length) document.body.classList.remove('locked');
    setTimeout(() => { bg.remove(); el.remove(); }, 320);
    onClose && onClose();
  };
  bg.onclick = close;
  $('[data-x]', el)?.addEventListener('click', close);
  mount && mount($('.sheet-b', el), close);
  return close;
}

export function confirmSheet(msg, ok = 'Delete') {
  return new Promise(res => {
    let yes = false;
    sheet({
      html: `<p class="confirm">${esc(msg)}</p><div class="row-btns"><button class="btn" data-no>Cancel</button><button class="btn pri danger" data-yes>${esc(ok)}</button></div>`,
      mount: (b, close) => { $('[data-no]', b).onclick = close; $('[data-yes]', b).onclick = () => { yes = true; close(); }; },
      onClose: () => res(yes),
    });
  });
}

/* ---------- form rows bound to a settings path like "goals.focusMin" ---------- */
export function stepRow(path, label, { min, max, step = 1, unit = '', scale = 1, sub = '' }) {
  const v = getPath(path) / scale;
  return `<div class="row"><div class="grow">${label}${sub ? `<small>${sub}</small>` : ''}</div><div class="step" data-path="${path}" data-min="${min}" data-max="${max}" data-step="${step}" data-scale="${scale}"><button type="button" data-d="-1" aria-label="Less">−</button><b>${+v.toFixed(scale == 1 ? 1 : 0)}</b><span>${unit}</span><button type="button" data-d="1" aria-label="More">+</button></div></div>`;
}
export function switchRow(path, label, sub = '') {
  return `<label class="row"><div class="grow">${label}${sub ? `<small>${sub}</small>` : ''}</div><input type="checkbox" class="sw" data-path="${path}" ${getPath(path) ? 'checked' : ''}></label>`;
}
export function timeRow(path, label) {
  return `<label class="row"><div class="grow">${label}</div><input type="time" class="time-in" data-path="${path}" value="${getPath(path)}"></label>`;
}
export function bindControls(root, onChange) {
  $$('.step', root).forEach(s => $$('button', s).forEach(b => b.onclick = () => {
    const { path, min, max, step, scale } = s.dataset, st = +step, cur = getPath(path) / scale / st;
    // Move to the next whole step, so 1893 ml goes to 2000, not 2143.
    const next = +b.dataset.d > 0 ? Math.floor(cur + 1e-6) + 1 : Math.ceil(cur - 1e-6) - 1;
    const v = Math.min(+max, Math.max(+min, +(next * st).toFixed(2)));
    setPath(path, scale == 1 ? v : Math.round(v * scale));
    $('b', s).textContent = +v.toFixed(1);
    onChange && onChange(path);
  }));
  $$('input.sw[data-path]', root).forEach(i => i.onchange = () => { setPath(i.dataset.path, i.checked); onChange && onChange(i.dataset.path); });
  $$('input.time-in[data-path]', root).forEach(i => i.onchange = () => { if (i.value) { setPath(i.dataset.path, i.value); onChange && onChange(i.dataset.path); } });
}

/* ---------- themes ---------- */
export const THEMES = { sunrise: ['Sunrise', '#ee6a3c'], sprout: ['Sprout', '#3d9a5f'], ocean: ['Ocean', '#2a86c8'], dusk: ['Dusk', '#7a5ad8'], bloom: ['Bloom', '#d8527d'], earth: ['Earth', '#a86a3c'] };
export function applyTheme() {
  const r = document.documentElement, st = S.settings;
  r.dataset.theme = st.theme; r.dataset.mode = st.mode;
  if (st.theme === 'custom') r.style.setProperty('--accent', st.custom); else r.style.removeProperty('--accent');
  requestAnimationFrame(() => { const m = $('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.body).backgroundColor; });
}
export function themePicker() {
  const st = S.settings;
  return `<div class="themes">${Object.entries(THEMES).map(([k, [n, c]]) => `<button class="theme ${st.theme === k ? 'on' : ''}" data-theme="${k}" style="--t:${c}" aria-label="${n}"><i></i><span>${n}</span></button>`).join('')}
  <label class="theme ${st.theme === 'custom' ? 'on' : ''}" style="--t:${esc(st.custom)}"><i class="custom"></i><span>Yours</span><input type="color" value="${esc(st.custom)}" aria-label="Pick your own color"></label></div>
  <div class="seg" data-modes>${['auto', 'light', 'dark'].map(m => `<button data-mode="${m}" class="${st.mode === m ? 'on' : ''}">${{ auto: 'Automatic', light: 'Light', dark: 'Dark' }[m]}</button>`).join('')}</div>`;
}
export function bindThemePicker(root, after) {
  const pick = k => { S.settings.theme = k; setPath('settings.theme', k); applyTheme(); $$('.theme', root).forEach(t => t.classList.toggle('on', (t.dataset.theme || 'custom') === k)); after && after(); };
  $$('button.theme', root).forEach(b => b.onclick = () => pick(b.dataset.theme));
  const ci = $('input[type=color]', root);
  ci.oninput = () => { S.settings.custom = ci.value; ci.closest('.theme').style.setProperty('--t', ci.value); pick('custom'); };
  $$('[data-mode]', root).forEach(b => b.onclick = () => { setPath('settings.mode', b.dataset.mode); applyTheme(); $$('[data-mode]', root).forEach(x => x.classList.toggle('on', x === b)); after && after(); });
}

/* ---------- the growing plant ---------- */
// The plant tracks the day score g (0..1): seed → sprout → leaves → bud → bloom.
const STEM = 72;
const LEAVES = [[0.001, 100, -1, 0.5, -38], [0.001, 100, 1, 0.5, -38], [0.25, 85, -1, 0.8, -26], [0.45, 71, 1, 0.85, -26], [0.65, 58, -1, 0.85, -24], [0.8, 48, 1, 0.7, -24]];
const stemOffset = g => STEM * (1 - (g > 0 ? Math.min(1, 0.12 + 0.98 * g) : 0));
export function plant(g = 0, cls = '') {
  const leaves = LEAVES.map(([th, y, side, s, rot], i) => `<g transform="translate(60 ${y}) scale(${side * s} ${s}) rotate(${rot})"><g class="lf ${g >= th ? 'on' : ''}" data-th="${th}" style="transition-delay:${0.25 + i * 0.08}s"><path class="lf-a" d="M0 0C4-7 14-10 23-8C20-1 11 3 0 0Z"/><path class="lf-v" d="M2-1C9-4 15-6 20-7.4"/></g></g>`).join('');
  const petals = [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-8" rx="5.5" ry="8.5" transform="rotate(${a})"/>`).join('');
  return `<svg class="plant ${cls}" viewBox="0 0 120 142" aria-hidden="true">
<ellipse class="soil" cx="60" cy="106" rx="27" ry="4.5"/>
<ellipse class="seed ${g <= 0 ? 'on' : ''}" cx="60" cy="103.5" rx="4.2" ry="3"/>
<g class="sway"><path class="stem" style="stroke-dashoffset:${stemOffset(g)}" d="M60 108C57 92 63 76 60 60S59 44 60 37"/>${leaves}
<g transform="translate(60 39)"><g class="bud ${g >= 0.9 && g < 1 ? 'on' : ''}"><path class="bud-a" d="M0 0C-6-4-6-12 0-18C6-12 6-4 0 0Z"/><path class="sepal" d="M0 1C-5-1-7-4-7-8C-3-6-1-4 0 1ZM0 1C5-1 7-4 7-8C3-6 1-4 0 1Z"/></g></g>
<g transform="translate(60 33)"><g class="fl ${g >= 1 ? 'on' : ''}"><g class="petals">${petals}</g><circle r="4.8" class="ctr"/></g></g></g>
<rect class="rim" x="31" y="105" width="58" height="10" rx="3"/><path class="pot" d="M35 115h50l-5 25H40z"/></svg>`;
}
export function growPlant(svg, g) {
  $('.stem', svg).style.strokeDashoffset = stemOffset(g);
  $('.seed', svg).classList.toggle('on', g <= 0);
  $$('.lf', svg).forEach(l => l.classList.toggle('on', g >= +l.dataset.th));
  $('.bud', svg).classList.toggle('on', g >= 0.9 && g < 1);
  $('.fl', svg).classList.toggle('on', g >= 1);
}
export function stageOf(g) {
  if (g <= 0) return { name: 'Plant a seed', tip: 'Do one small thing to start growing.' };
  if (g < 0.25) return { name: 'Sprouting', tip: 'A good start. Keep it going.' };
  if (g < 0.5) return { name: 'Taking root', tip: 'Momentum is building.' };
  if (g < 0.75) return { name: 'Growing strong', tip: 'More than halfway there.' };
  if (g < 1) return { name: 'Almost in bloom', tip: 'Just a little more to bloom.' };
  return { name: 'In full bloom', tip: 'You mastered today.' };
}

/* Burst of little leaves for small wins. */
export function celebrate(el, color = 'var(--leaf)') {
  if (!el || calm()) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    p.className = 'leafp';
    p.style.cssText = `left:${cx}px;top:${cy}px;background:${i % 3 ? color : 'var(--accent)'}`;
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, d = 36 + Math.random() * 64, rot = Math.random() * 360;
    p.animate([
      { transform: `translate(-50%,-50%) rotate(${rot}deg) scale(.4)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 28}px)) rotate(${rot + 200}deg) scale(1)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}

/* ---------- sound + screen ---------- */
let ac;
// One shared AudioContext. iPhone only allows it to start from a tap, so call this in tap handlers.
export function audio() {
  if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
  if (ac.state !== 'running') ac.resume().catch(() => {});
  return ac;
}
export function chime(f = 528, vol = 0.08, len = 2.4) {
  if (!S.settings.sound) return;
  const a = audio(); if (!a) return;
  try {
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + len + 0.1);
  } catch (e) { /* audio is a nicety */ }
}
export function bell() { chime(660, 0.1, 1.6); setTimeout(() => chime(880, 0.09, 2.2), 220); }

let lock = null, wantLock = false;
export async function keepAwake(on) {
  wantLock = on && S.settings.keepAwake;
  try {
    if (wantLock && !lock && 'wakeLock' in navigator) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    else if (!wantLock && lock) { await lock.release(); lock = null; }
  } catch (e) { /* not supported or not allowed */ }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && wantLock) keepAwake(true); });
