// App shell: routing (#/today, #/focus...), the tab bar, the mini sound player, a one-second ticker
// for timers and the day rolling over, and offline support.
import { S, dk } from './store.js';
import { esc, ic, go, toast, bell, applyTheme, $ } from './ui.js';
import { TOOLS, isOn } from './tools/index.js';
import * as focus from './tools/focus.js';
import * as sounds from './tools/sounds.js';
import today from './views/today.js';
import growth from './views/growth.js';
import more from './views/more.js';
import settings from './views/settings.js';
import onboarding from './views/onboarding.js';

const VIEWS = { today, growth, more, settings };
const VIEW_TABS = { today: ['Today', 'sun'], growth: ['Growth', 'sprout'], more: ['More', 'grid'], settings: ['Settings', 'settings'] };
const tabInfo = id => VIEW_TABS[id] || [TOOLS[id].name, TOOLS[id].icon];
const tabs = () => ['today', ...S.settings.pins.filter((p, i, a) => a.indexOf(p) === i && (p === 'growth' || isOn(p))).slice(0, 3), 'more'];

let current = null, cleanup = null, day = dk();

function route() {
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  // A fresh element per view, so no listeners leak from one view into the next.
  const el = document.createElement('main');
  el.id = 'view';
  $('#view').replaceWith(el);
  if (!S.profile.onboarded) {
    current = 'welcome';
    document.body.classList.add('onboarding');
    onboarding(el, () => { document.body.classList.remove('onboarding'); applyTheme(); history.replaceState(null, '', '#/today'); route(); });
    renderTabs(); renderMini();
    return;
  }
  let id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'today';
  if (!VIEWS[id] && !isOn(id)) id = 'today';
  current = id;
  el.className = 'view v-' + id;
  if (TOOLS[id]) el.style.setProperty('--c', `var(--c-${id})`);
  const v = VIEWS[id] || TOOLS[id];
  try { cleanup = v.view(el, { back: !tabs().includes(id) }) || null; }
  catch (e) { console.error(e); el.innerHTML = `<p class="muted center">Something went wrong opening this page.</p>`; }
  renderTabs(); renderMini();
  scrollTo(0, 0);
}

function renderTabs() {
  const nav = $('#tabs');
  if (current === 'welcome') { nav.innerHTML = ''; return; }
  const t = tabs(), active = t.includes(current) ? current : 'more';
  nav.innerHTML = `<div class="in">${t.map(id => { const [label, icon] = tabInfo(id); return `<button data-id="${id}" class="${id === active ? 'on' : ''}" ${id === active ? 'aria-current="page"' : ''}>${ic(icon)}<span>${esc(label)}</span></button>`; }).join('')}</div>`;
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  if (b.dataset.id === current) scrollTo({ top: 0, behavior: 'smooth' }); else go(b.dataset.id);
});

function renderMini() {
  const m = $('#mini'), show = sounds.isPlaying() && current !== 'sounds' && current !== 'welcome';
  m.classList.toggle('on', show);
  m.innerHTML = show ? `<button class="mini-open" data-open><span class="eq on"><i></i><i></i><i></i><i></i></span><span class="clip">${esc(sounds.label())}</span></button><button class="mini-pp" data-pp aria-label="Pause sounds">${ic('pause', 'fill')}</button>` : '';
}
$('#mini').addEventListener('click', e => {
  if (e.target.closest('[data-pp]')) sounds.pause();
  else if (e.target.closest('[data-open]')) go('sounds');
});

// Back buttons inside any view.
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="back"]')) history.length > 1 ? history.back() : go('today');
});

function tick() {
  const done = focus.check();
  if (done) {
    if (!done.late) bell();
    toast(done.mode === 'focus' ? (S.goals.autoNext && !done.late ? 'Focus session done. Break started.' : 'Focus session done. Nice work.') : 'Break over. Ready to focus?');
  }
  sounds.check();
  if (dk() !== day) { day = dk(); route(); }
}

addEventListener('hashchange', route);
addEventListener('dm:refresh', route);
addEventListener('dm:tabs', renderTabs);
addEventListener('dm:sounds', renderMini);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
setInterval(tick, 1000);

applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
route();
navigator.storage?.persist?.().catch(() => {});

// Offline support. Skipped on the local dev server so edits show up right away (add ?sw to test it there).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || /[?&]sw\b/.test(location.search))) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => toast('A new version of Day Mastery is ready.', { label: 'Update', fn: () => w.postMessage('skipWaiting') }, 15000);
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(e => console.warn('Service worker not registered', e));
  // Reload once when an update takes over (not on the very first install).
  let reloading = !navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
}
