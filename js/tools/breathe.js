// Breathe: guided breathing with a growing and shrinking orb. Every second you breathe is logged,
// including partial sessions.
import { S, dk, lastDays, save } from '../store.js';
import { ic, header, toast, celebrate, chime, audio, keepAwake, clock, bars, $, $$ } from '../ui.js';

const PATTERNS = {
  box: { name: 'Box', beat: '4·4·4·4', about: 'Steady and centering', steps: [['in', 4], ['hold', 4], ['out', 4], ['hold', 4]] },
  relax: { name: '4-7-8', beat: '4·7·8', about: 'Winds you down for sleep', steps: [['in', 4], ['hold', 7], ['out', 8]] },
  coherent: { name: 'Coherent', beat: '5.5·5.5', about: 'Balances body and mind', steps: [['in', 5.5], ['out', 5.5]] },
  calm: { name: 'Calm', beat: '4·6', about: 'Long exhales to relax', steps: [['in', 4], ['out', 6]] },
  energize: { name: 'Energize', beat: '6·2', about: 'A quick lift', steps: [['in', 6], ['hold', 0.5], ['out', 2]] },
};
const WORD = { in: 'Breathe in', hold: 'Hold', out: 'Breathe out' };
const LENGTHS = [0, 1, 3, 5, 10];
const secsOn = k => S.breathe.days[k] || 0;
const goal = () => S.goals.breatheMin * 60;

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
    let st = 'idle', idx = 0, phaseEnd = 0, phaseLeft = 0, raf = 0, cycles = 0, ran = 0, last = 0;
    const pat = () => PATTERNS[S.breathe.pattern] || PATTERNS.box;
    el.innerHTML = header({ title: 'Breathe', back: ctx.back, tool: 'breathe' }) + `
<div class="chips pats">${Object.entries(PATTERNS).map(([k, p]) => `<button class="chip" data-p="${k}">${p.name}<small>${p.beat}</small></button>`).join('')}</div>
<p class="muted center" id="about"></p>
<div class="breath" id="stage" role="button" tabindex="0" aria-label="Start or pause breathing">
  <div class="b-ring"><i id="dot"></i></div><div class="b-orb" id="orb"></div>
  <div class="b-txt"><b id="word">Tap to begin</b><span id="count"></span></div>
</div>
<div class="b-meta"><span id="time">0:00</span><span id="cyc"></span></div>
<div class="lbl center">Session length</div>
<div class="seg" id="lens">${LENGTHS.map(m => `<button data-m="${m}">${m ? m + ' min' : 'Open'}</button>`).join('')}</div>
<div class="tctrl"><button class="btn" id="end" hidden>End session</button></div>
<section class="card"><div class="card-h"><h3>Today</h3><span class="muted" id="sum"></span></div><div id="wk"></div></section>`;
    const orb = $('#orb', el), word = $('#word', el), dot = $('#dot', el);

    const summary = () => {
      const s = secsOn(dk());
      $('#sum', el).textContent = `${Math.floor(s / 60)} of ${S.goals.breatheMin} min`;
      $('#wk', el).innerHTML = bars(lastDays(7).map(k => ({ k, v: secsOn(k) / goal() })));
    };
    const chrome = () => {
      $$('[data-p]', el).forEach(b => b.classList.toggle('on', b.dataset.p === S.breathe.pattern));
      $$('#lens button', el).forEach(b => b.classList.toggle('on', +b.dataset.m === S.breathe.length));
      $('#about', el).textContent = pat().about;
      $('#end', el).hidden = st === 'idle';
      el.dataset.state = st;
    };
    const log = () => {
      const now = performance.now();
      if (st === 'run') { const add = (now - last) / 1000; ran += add; S.breathe.days[dk()] = secsOn(dk()) + add; save(); }
      last = now;
    };
    const phase = () => {
      const [w, d] = pat().steps[idx];
      word.textContent = WORD[w];
      orb.style.transitionDuration = d + 's';
      if (w === 'in') { orb.classList.add('big'); chime(528, 0.05); }
      if (w === 'out') { orb.classList.remove('big'); chime(396, 0.05); }
      phaseEnd = performance.now() + d * 1000;
    };
    const loop = () => {
      if (st !== 'run') return;
      const now = performance.now();
      if (now >= phaseEnd) {
        log();
        idx = (idx + 1) % pat().steps.length;
        if (idx === 0) { cycles++; if (S.breathe.length && ran >= S.breathe.length * 60) return finish(); }
        phase();
      }
      $('#count', el).textContent = Math.max(1, Math.ceil((phaseEnd - now) / 1000));
      const total = pat().steps.reduce((a, s) => a + s[1], 0) * 1000, into = pat().steps.slice(0, idx).reduce((a, s) => a + s[1], 0) * 1000 + (pat().steps[idx][1] * 1000 - (phaseEnd - now));
      dot.style.transform = `rotate(${into / total * 360}deg)`;
      $('#time', el).textContent = clock(ran + (now - last) / 1000, true) + (S.breathe.length ? ` / ${S.breathe.length}:00` : '');
      $('#cyc', el).textContent = cycles ? `${cycles} cycle${cycles === 1 ? '' : 's'}` : '';
      raf = requestAnimationFrame(loop);
    };
    const settle = () => { orb.style.transitionDuration = '1.2s'; orb.style.transform = ''; orb.classList.remove('big'); dot.style.transform = ''; };
    const begin = () => {
      audio(); st = 'run'; idx = 0; cycles = 0; ran = 0; last = performance.now();
      orb.style.transitionDuration = '0s'; orb.style.transform = ''; orb.classList.remove('big'); void orb.offsetWidth;
      phase(); chrome(); loop(); keepAwake(true);
    };
    const pause = () => {
      log(); st = 'pause'; cancelAnimationFrame(raf); phaseLeft = phaseEnd - performance.now();
      const m = getComputedStyle(orb).transform; orb.style.transitionDuration = '0s'; orb.style.transform = m === 'none' ? '' : m;
      word.textContent = 'Paused'; $('#count', el).textContent = 'tap to resume'; chrome(); keepAwake(false); summary();
    };
    const resume = () => {
      last = performance.now(); st = 'run'; phaseEnd = last + phaseLeft;
      orb.style.transitionDuration = phaseLeft / 1000 + 's'; orb.style.transform = '';
      word.textContent = WORD[pat().steps[idx][0]]; chrome(); loop(); keepAwake(true);
    };
    const stop = () => { if (st === 'idle') return; log(); st = 'idle'; cancelAnimationFrame(raf); settle(); word.textContent = 'Tap to begin'; $('#count', el).textContent = ''; chrome(); keepAwake(false); summary(); };
    const finish = () => {
      stop(); chime(660, 0.08, 3);
      const m = Math.floor(secsOn(dk()) / 60);
      word.textContent = 'Well done'; toast(`Nice. ${m} calm minute${m === 1 ? '' : 's'} today.`); celebrate(orb, 'var(--c-breathe)');
    };
    const toggle = () => st === 'idle' ? begin() : st === 'run' ? pause() : resume();

    $('#stage', el).onclick = toggle;
    $('#stage', el).onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
    $('#end', el).onclick = stop;
    $$('[data-p]', el).forEach(b => b.onclick = () => { S.breathe.pattern = b.dataset.p; save(); const was = st; stop(); chrome(); if (was !== 'idle') begin(); });
    $$('#lens button', el).forEach(b => b.onclick = () => { S.breathe.length = +b.dataset.m; save(); chrome(); });
    chrome(); summary();
    if (/[?&]start\b/.test(location.hash)) { history.replaceState(null, '', '#/breathe'); begin(); }
    return () => { stop(); };
  },
};
