// Focus: a Pomodoro timer. The timer lives in saved state (an end time, not a countdown),
// so it stays right when the phone locks or the app closes, and the app's ticker finishes it.
import { S, dk, lastDays, save } from '../store.js';
import { ic, header, sheet, stepRow, switchRow, bindControls, audio, keepAwake, clock, dur, bars, $, $$ } from '../ui.js';

const LABEL = { focus: 'Focus', short: 'Short break', long: 'Long break' };
const MSG = { focus: 'Time to focus', short: 'Stretch. Breathe.', long: 'Take a real break' };
const secs = m => 60 * (m === 'focus' ? S.goals.focusMin : m === 'short' ? S.goals.shortMin : S.goals.longMin);

export function timer() {
  return S.focus.timer ||= { mode: 'focus', running: false, endAt: 0, total: secs('focus'), left: secs('focus'), cycle: 0 };
}
export const left = () => { const t = timer(); return t.running ? Math.max(0, (t.endAt - Date.now()) / 1000) : t.left; };
export const today = (k = dk()) => S.focus.days[k] || { n: 0, min: 0 };

export function start() { const t = timer(); if (t.running) return; audio(); t.endAt = Date.now() + t.left * 1000; t.running = true; save(); }
export function pause() { const t = timer(); if (!t.running) return; t.left = left(); t.running = false; save(); }
export function setMode(m) { const t = timer(); t.mode = m; t.running = false; t.total = t.left = secs(m); save(); }
function advance(t) {
  if (t.mode === 'focus') { t.cycle++; if (t.cycle >= S.goals.longEvery) { t.cycle = 0; t.mode = 'long'; } else t.mode = 'short'; }
  else t.mode = 'focus';
  t.total = t.left = secs(t.mode); t.running = false;
}
export function skip() { advance(timer()); save(); }

// Called every second by the app. Returns what finished, if anything.
export function check() {
  const t = timer();
  if (!t.running || Date.now() < t.endAt) return null;
  const mode = t.mode, late = Date.now() - t.endAt > 15000;
  if (mode === 'focus') {
    const d = S.focus.days[dk(new Date(t.endAt))] ||= { n: 0, min: 0 };
    d.n++; d.min += Math.round(t.total / 60);
  }
  advance(t);
  if (S.goals.autoNext && !late) { t.endAt = Date.now() + t.left * 1000; t.running = true; }
  save();
  return { mode, late };
}
const sig = () => { const t = timer(); return `${t.mode}|${t.running}|${t.cycle}|${t.total}|${today().n}`; };

function settings(done) {
  sheet({
    title: 'Focus settings', tool: 'focus', onClose: done,
    html: `<div class="list">
${stepRow('goals.focusMin', 'Focus length', { min: 5, max: 90, step: 5, unit: 'min' })}
${stepRow('goals.shortMin', 'Short break', { min: 1, max: 30, unit: 'min' })}
${stepRow('goals.longMin', 'Long break', { min: 5, max: 60, step: 5, unit: 'min' })}
${stepRow('goals.longEvery', 'Long break after', { min: 2, max: 8, unit: 'sessions' })}
${stepRow('goals.focusSessions', 'Daily goal', { min: 1, max: 16, unit: 'sessions' })}
${switchRow('goals.autoNext', 'Start the next one automatically', 'Breaks start after focus, and focus after breaks')}
</div>`,
    mount: b => bindControls(b, () => { const t = timer(); if (!t.running && t.left === t.total) setMode(t.mode); }),
  });
}

export default {
  id: 'focus', name: 'Focus', icon: 'timer',
  blurb: 'Deep work in focused blocks',
  score: k => Math.min(1, today(k).n / S.goals.focusSessions),
  summary(days) {
    const n = days.reduce((a, k) => a + today(k).n, 0), min = days.reduce((a, k) => a + today(k).min, 0);
    return n ? `${dur(min)} focused · ${n} session${n === 1 ? '' : 's'}` : 'No focus sessions yet';
  },

  card(el, ctx) {
    const draw = () => {
      const t = timer(), d = today(), g = S.goals.focusSessions, active = t.running || t.left < t.total;
      el.innerHTML = `<div class="metric"><div class="big">${d.n}<small>/ ${g} sessions</small></div>${active ? `<div class="live ${t.running ? 'on' : ''}">${LABEL[t.mode]} <b data-left>${clock(left())}</b></div>` : ''}</div>
<div class="bar"><i style="width:${Math.min(100, d.n / g * 100)}%"></i></div>
<div class="card-row"><span class="muted">${d.min ? `${dur(d.min)} focused today` : `One ${S.goals.focusMin}-minute block is a great start.`}</span>
<button class="btn pri sm" data-toggle>${ic(t.running ? 'pause' : 'play', 'fill')}${t.running ? 'Pause' : active ? 'Resume' : 'Start'}</button></div>`;
      $('[data-toggle]', el).onclick = () => { timer().running ? pause() : start(); draw(); ctx.changed(); };
    };
    draw();
    let last = sig();
    const iv = setInterval(() => {
      if (sig() !== last) { last = sig(); draw(); ctx.changed(); return; }
      const l = $('[data-left]', el); if (l) l.textContent = clock(left());
    }, 500);
    return () => clearInterval(iv);
  },

  view(el, ctx) {
    const R = 46, C = 2 * Math.PI * R;
    el.innerHTML = header({ title: 'Focus', back: ctx.back, tool: 'focus', actions: `<button class="icon-btn" data-settings aria-label="Focus settings">${ic('settings')}</button>` }) + `
<div class="seg" id="modes">${Object.keys(LABEL).map(m => `<button data-m="${m}">${LABEL[m]}</button>`).join('')}</div>
<div class="timer">
  <svg viewBox="0 0 100 100" class="tring"><circle cx="50" cy="50" r="${R}" class="trk"/><circle cx="50" cy="50" r="${R}" class="prog" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
  <div class="tface"><div class="tclock" id="clock"></div><div class="tmsg" id="msg"></div><div class="tdots" id="dots"></div></div>
</div>
<div class="tctrl"><button class="icon-btn lg" data-reset aria-label="Reset">${ic('reset')}</button><button class="btn pri xl" id="go"></button><button class="icon-btn lg" data-skip aria-label="Skip to next">${ic('skip')}</button></div>
<section class="card"><div class="card-h"><h3>Today</h3><span class="muted" id="sum"></span></div><div id="wk"></div></section>`;
    const prog = $('.prog', el);
    const paint = () => { const t = timer(), l = left(); $('#clock', el).textContent = clock(l); prog.style.strokeDashoffset = C * (l / t.total); };
    const full = () => {
      const t = timer(), d = today(), active = t.running || t.left < t.total;
      el.style.setProperty('--c', t.mode === 'focus' ? 'var(--c-focus)' : 'var(--c-breathe)');
      $$('#modes button', el).forEach(b => b.classList.toggle('on', b.dataset.m === t.mode));
      $('#go', el).innerHTML = `${ic(t.running ? 'pause' : 'play', 'fill')}${t.running ? 'Pause' : active ? 'Resume' : 'Start'}`;
      $('#msg', el).textContent = MSG[t.mode];
      $('#dots', el).innerHTML = Array.from({ length: S.goals.longEvery }, (_, i) => `<i class="${i < t.cycle ? 'on' : ''}"></i>`).join('');
      $('#sum', el).textContent = `${d.n} of ${S.goals.focusSessions} sessions · ${dur(d.min)}`;
      $('#wk', el).innerHTML = bars(lastDays(7).map(k => ({ k, v: today(k).n / S.goals.focusSessions })));
      keepAwake(t.running);
      paint();
    };
    full();
    let last = sig();
    const iv = setInterval(() => { if (sig() !== last) { last = sig(); full(); } else paint(); }, 250);
    $$('#modes button', el).forEach(b => b.onclick = () => { setMode(b.dataset.m); full(); });
    $('#go', el).onclick = () => { timer().running ? pause() : start(); full(); };
    $('[data-reset]', el).onclick = () => { setMode(timer().mode); full(); };
    $('[data-skip]', el).onclick = () => { skip(); full(); };
    $('[data-settings]', el).onclick = () => settings(full);
    return () => { clearInterval(iv); keepAwake(false); };
  },
};
