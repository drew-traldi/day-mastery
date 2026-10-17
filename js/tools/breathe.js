// Breathe: the full-screen breathing experience from the breathe-with-me site (drew-traldi/breathe-with-me),
// inside Day Mastery. Tap anywhere to begin, pause or resume. The background warms on the exhale and
// cools on the inhale, and every second breathed counts toward the day, including partial sessions.
import { S, dk, save } from '../store.js';
import { esc, ic, toast, celebrate, chime, audio, keepAwake, clock, applyTheme, $, $$ } from '../ui.js';

const PATTERNS = {
  box: { name: 'Box 4·4·4·4', steps: [['inhale', 4], ['hold', 4], ['exhale', 4], ['hold', 4]] },
  relax: { name: 'Relax 4·7·8', steps: [['inhale', 4], ['hold', 7], ['exhale', 8]] },
  coherent: { name: 'Coherent 5·5', steps: [['inhale', 5.5], ['exhale', 5.5]] },
  energize: { name: 'Energize 6·2', steps: [['inhale', 6], ['hold', 0.5], ['exhale', 2]] },
  calm: { name: 'Calm 4·6', steps: [['inhale', 4], ['exhale', 6]] },
};
const LENGTHS = [0, 1, 3, 5, 10];
const secsOn = k => S.breathe.days[k] || 0;
const goal = () => S.goals.breatheMin * 60;

/* ---------- colors (same palettes as the breathe-with-me site) ---------- */
const SAGE = { ink: '#3c4a3e', r1: '#e9efe4', r2: '#d8e3d3', r3: '#c5d4bf', i1: '#eef3e6', i2: '#d9e8dc', i3: '#bfd6c6', e1: '#f3ece4', e2: '#ecdccd', e3: '#d8c3b0', o1: '#fff', o2: '#bcd7c4', o3: '#7fa58a', glow: 'rgba(90,130,100,.35)', bl1: '#b8d4c0', bl2: '#f2d7c4', halo: 'rgba(255,255,255,.55)' };
const NIGHT = { ink: '#dce4f2', r1: '#0f1624', r2: '#141d2e', r3: '#1a2538', i1: '#101d30', i2: '#16304a', i3: '#1e3f5f', e1: '#191526', e2: '#221b33', e3: '#2c2340', o1: '#f2f6ff', o2: '#9fb4dc', o3: '#4d6497', glow: 'rgba(120,150,220,.3)', bl1: '#243a66', bl2: '#46305c', halo: 'rgba(8,14,30,.85)' };
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100];
}
const hsl = (h, s, l, a) => `hsl(${((h % 360) + 360) % 360} ${Math.max(0, Math.min(100, s)).toFixed(1)}% ${l}%${a != null ? ' / ' + a : ''})`;
// Builds a full calm palette from one color: soft tinted backgrounds, a deep readable ink, and an orb in that hue.
function fromColor(hex) {
  let [h, s] = hexToHsl(hex); s = Math.max(28, Math.min(72, s)); const t = s * 0.38;
  return { ink: hsl(h, Math.min(s, 35), 21), r1: hsl(h, t, 93), r2: hsl(h, t, 87), r3: hsl(h, t, 80), i1: hsl(h, t * 1.2, 94), i2: hsl(h, t * 1.2, 88), i3: hsl(h, t * 1.2, 80), e1: hsl(h + 30, t, 94), e2: hsl(h + 30, t, 88), e3: hsl(h + 30, t, 79), o1: '#fff', o2: hsl(h, s * 0.55, 80), o3: hsl(h, s * 0.5, 56), glow: hsl(h, s * 0.5, 35, 0.35), bl1: hsl(h, s * 0.45, 78), bl2: hsl(h + 40, s * 0.55, 85), halo: 'rgba(255,255,255,.55)' };
}
const THEMES = { sage: ['Sage', SAGE], ocean: ['Ocean', fromColor('#3a8fb7')], lavender: ['Lavender', fromColor('#8a78c4')], sunset: ['Sunset', fromColor('#e0874f')], rose: ['Rose', fromColor('#cc6a86')], night: ['Night', NIGHT] };
const darkApp = () => S.settings.mode === 'dark' || (S.settings.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
const palette = () => { const t = S.breathe.theme || (darkApp() ? 'night' : 'sage'); return t === 'custom' ? fromColor(S.breathe.custom || '#5aa088') : (THEMES[t] || THEMES.sage)[1]; };

export default {
  id: 'breathe', name: 'Breathe', icon: 'wind',
  blurb: 'Guided breathing to calm and reset',
  score: k => Math.min(1, secsOn(k) / goal()),
  summary(days) { const m = Math.round(days.reduce((a, k) => a + secsOn(k), 0) / 60); return m ? `${m} calm minute${m === 1 ? '' : 's'}` : 'No breathing sessions yet'; },

  card(el) {
    const s = secsOn(dk());
    el.innerHTML = `<div class="metric"><div class="big">${Math.floor(s / 60)}<small>/ ${S.goals.breatheMin} min today</small></div></div>
<div class="bar"><i style="width:${Math.min(100, s / goal() * 100)}%"></i></div>
<div class="card-row"><span class="muted">${s >= goal() ? 'Calm minutes complete.' : 'A few slow breaths reset your whole day.'}</span><button class="btn pri sm" data-go>${ic('play', 'fill')}Breathe</button></div>`;
    // Unlock audio inside the tap itself; iPhone won't allow it after the page changes.
    $('[data-go]', el).onclick = () => { audio(); location.hash = '#/breathe?start'; };
  },

  view(el, ctx) {
    let state = 'idle', idx = 0, t0 = 0, phaseEnd = 0, pausedAt = 0, raf = 0, cycles = 0, ran = 0, last = 0;
    const pat = () => PATTERNS[S.breathe.pattern] || PATTERNS.box;
    if (S.breathe.chime === undefined) S.breathe.chime = true;
    el.dataset.state = 'idle'; el.dataset.bg = 'rest';
    el.innerHTML = `<div class="br-bg rest"></div><div class="br-bg inhale"></div><div class="br-bg exhale"></div><div class="br-blob b1"></div><div class="br-blob b2"></div>
<header class="hd">${ctx.back ? `<button class="icon-btn" data-act="back" aria-label="Back">${ic('chevL')}</button>` : ''}<span class="sp"></span><span class="br-today" id="today"></span></header>
<div class="br-main">
  <button class="br-stage" id="stage" aria-label="Start breathing session"><div class="br-ring"></div><div class="br-dot" id="dot"></div><div class="br-orb" id="orb"></div><div class="br-txt" aria-live="polite"><h2 id="phase">breathe</h2><p id="sec">tap to begin</p></div></button>
  <p class="br-hint" id="hint">tap anywhere to begin</p>
  <div class="br-controls" id="controls">
    <div class="br-pat" role="group" aria-label="Breathing pattern">${Object.entries(PATTERNS).map(([k, p]) => `<button data-p="${k}">${p.name}</button>`).join('')}</div>
    <div class="br-pat br-len" role="group" aria-label="Session length">${LENGTHS.map(m => `<button data-m="${m}">${m ? m + ' min' : 'open'}</button>`).join('')}</div>
    <div class="br-themes" role="group" aria-label="Colors"><span class="lbl">colors</span>${Object.entries(THEMES).map(([k, [n, t]]) => `<button class="br-sw" data-theme="${k}" aria-label="${n}" title="${n}" style="background:radial-gradient(circle at 35% 30%,${t.o1},${t.o2} 45%,${t.o3});${k === 'night' ? `box-shadow:inset 0 0 0 6px ${t.r1}` : ''}"></button>`).join('')}<label class="br-sw custom" data-theme="custom" title="Pick your own color"><input type="color" value="${esc(S.breathe.custom || '#5aa088')}" aria-label="Pick your own color"></label></div>
    <div class="br-meta"><span class="br-stat"><span id="cyc">0 cycles</span> · <span id="tm">0:00</span></span><label><input type="checkbox" id="snd" ${S.breathe.chime ? 'checked' : ''}> soft chime</label><button class="br-reset" id="reset" hidden>end session</button></div>
  </div>
</div>`;
    const orb = $('#orb', el), dot = $('#dot', el);

    const paint = () => {
      const p = palette();
      for (const k in p) el.style.setProperty('--b-' + k, p[k]);
      const m = $('meta[name=theme-color]'); if (m) m.content = p.r1;
      const cur = S.breathe.theme || (darkApp() ? 'night' : 'sage');
      $$('[data-theme]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === cur)));
    };
    const chrome = () => {
      $$('[data-p]', el).forEach(b => b.classList.toggle('on', b.dataset.p === S.breathe.pattern));
      $$('[data-m]', el).forEach(b => b.classList.toggle('on', +b.dataset.m === S.breathe.length));
      const s = secsOn(dk());
      $('#today', el).textContent = `${Math.floor(s / 60)} of ${S.goals.breatheMin} min today`;
    };
    const setState = s => {
      state = s; el.dataset.state = s;
      document.body.classList.toggle('breathing', s === 'running');
      $('#reset', el).hidden = s === 'idle';
      $('#stage', el).setAttribute('aria-label', s === 'running' ? 'Pause breathing session' : s === 'paused' ? 'Resume breathing session' : 'Start breathing session');
      $('#hint', el).textContent = s === 'running' ? 'tap anywhere to pause' : s === 'paused' ? 'tap anywhere to resume' : 'tap anywhere to begin';
    };
    const log = () => {
      const now = performance.now();
      if (state === 'running') { const add = (now - last) / 1000; ran += add; S.breathe.days[dk()] = secsOn(dk()) + add; save(); }
      last = now;
    };
    const tone = f => { if (S.breathe.chime) chime(f, 0.06); };
    const target = n => n === 'inhale' ? 'scale(2.2)' : n === 'exhale' ? 'scale(1)' : null;
    const phase = () => {
      const [n, d] = pat().steps[idx];
      $('#phase', el).textContent = n;
      orb.style.transitionDuration = d + 's';
      const tg = target(n); if (tg) orb.style.transform = tg;
      if (n === 'inhale') tone(528); else if (n === 'exhale') tone(396);
      phaseEnd = performance.now() + d * 1000;
      if (n !== 'hold') el.dataset.bg = n;
    };
    const loop = () => {
      if (state !== 'running') return;
      const now = performance.now();
      if (now >= phaseEnd) {
        log();
        idx = (idx + 1) % pat().steps.length;
        if (idx === 0) {
          cycles++; $('#cyc', el).textContent = cycles + ' cycle' + (cycles === 1 ? '' : 's');
          if (S.breathe.length && ran >= S.breathe.length * 60) return finish();
        }
        phase();
      }
      $('#sec', el).textContent = Math.max(1, Math.ceil((phaseEnd - now) / 1000));
      const total = pat().steps.reduce((a, b) => a + b[1], 0) * 1000;
      dot.style.transform = `rotate(${((now - t0) % total) / total * 360}deg)`;
      $('#tm', el).textContent = clock(ran + (now - last) / 1000, true) + (S.breathe.length ? ` / ${S.breathe.length}:00` : '');
      raf = requestAnimationFrame(loop);
    };
    const begin = () => {
      audio(); setState('running');
      orb.style.transitionDuration = '0s'; orb.style.transform = 'scale(1)'; void orb.offsetWidth;
      idx = 0; cycles = 0; ran = 0; $('#cyc', el).textContent = '0 cycles';
      t0 = last = performance.now(); phase(); loop(); keepAwake(true);
    };
    const pause = () => {
      log(); pausedAt = performance.now(); cancelAnimationFrame(raf);
      const m = getComputedStyle(orb).transform; orb.style.transitionDuration = '0s'; orb.style.transform = m === 'none' ? 'scale(1)' : m;
      setState('paused'); $('#phase', el).textContent = 'paused'; $('#sec', el).textContent = 'tap to resume'; keepAwake(false); chrome();
    };
    const resume = () => {
      const now = performance.now(), shift = now - pausedAt;
      phaseEnd += shift; t0 += shift; last = now;
      const [n] = pat().steps[idx]; $('#phase', el).textContent = n;
      orb.style.transitionDuration = ((phaseEnd - now) / 1000) + 's';
      const tg = target(n); if (tg) orb.style.transform = tg;
      setState('running'); loop(); keepAwake(true);
    };
    const reset = () => {
      if (state === 'running') log();
      cancelAnimationFrame(raf); setState('idle');
      $('#phase', el).textContent = 'breathe'; $('#sec', el).textContent = 'tap to begin';
      orb.style.transitionDuration = '1.5s'; orb.style.transform = ''; el.dataset.bg = 'rest'; dot.style.transform = '';
      keepAwake(false); chrome();
    };
    const finish = () => {
      reset(); tone(660);
      $('#phase', el).textContent = 'well done';
      const m = Math.floor(secsOn(dk()) / 60);
      toast(`Nice. ${m} calm minute${m === 1 ? '' : 's'} today.`);
      celebrate(orb, palette().o3);
    };
    const toggle = () => state === 'idle' ? begin() : state === 'running' ? pause() : resume();

    // Tap anywhere outside the controls and the back button to start, pause or resume.
    el.addEventListener('click', e => { if (e.target.closest('#controls, .hd')) return; toggle(); });
    $('#reset', el).onclick = reset;
    $('#snd', el).onchange = e => { S.breathe.chime = e.target.checked; save(); };
    $$('[data-p]', el).forEach(b => b.onclick = () => { S.breathe.pattern = b.dataset.p; save(); chrome(); if (state !== 'idle') { reset(); begin(); } });
    $$('[data-m]', el).forEach(b => b.onclick = () => { S.breathe.length = +b.dataset.m; save(); chrome(); });
    $$('button[data-theme]', el).forEach(b => b.onclick = () => { S.breathe.theme = b.dataset.theme; save(); paint(); });
    const ci = $('input[type=color]', el);
    ci.oninput = () => { S.breathe.custom = ci.value; S.breathe.theme = 'custom'; save(); paint(); };
    ci.onclick = () => { S.breathe.theme = 'custom'; save(); paint(); };
    const onKey = e => { if ((e.code === 'Space' || e.key === ' ') && !e.target.closest('button,input,label,select')) { e.preventDefault(); toggle(); } };
    addEventListener('keydown', onKey);

    paint(); chrome();
    if (/[?&]start\b/.test(location.hash)) { history.replaceState(null, '', '#/breathe'); begin(); }
    return () => { reset(); removeEventListener('keydown', onKey); document.body.classList.remove('breathing'); applyTheme(); };
  },
};
