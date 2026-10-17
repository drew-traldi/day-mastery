// Sounds: generated ambience (rain, waves, noise...) mixed live with Web Audio, adapted from the
// Ambience utility. It keeps playing while you use the rest of the app.
import { S, save } from '../store.js';
import { esc, ic, header, sheet, audio, clock, $, $$ } from '../ui.js';

export const LAYERS = [
  { k: 'rain', n: 'Rain', i: 'rain' }, { k: 'waves', n: 'Ocean', i: 'waves' }, { k: 'wind', n: 'Wind', i: 'wind' },
  { k: 'fire', n: 'Campfire', i: 'flame' }, { k: 'brown', n: 'Brown noise', i: 'lines' }, { k: 'pink', n: 'Pink noise', i: 'lines' },
  { k: 'white', n: 'White noise', i: 'lines' }, { k: 'drone', n: 'Om drone', i: 'orbit' }, { k: 'binaural', n: 'Alpha waves', i: 'headphones' },
];
const PRESETS = {
  'Deep focus': { brown: 0.55, binaural: 0.25 }, 'Rainy café': { rain: 0.6, brown: 0.2, fire: 0.3 }, 'Beach': { waves: 0.8, wind: 0.25 },
  'Cabin night': { fire: 0.7, wind: 0.35, rain: 0.3 }, 'Meditation': { drone: 0.6, waves: 0.2 }, 'Sleep': { pink: 0.35, rain: 0.45 },
};
const TIMERS = [0, 15, 30, 60, 90];

let ac, master, nodes = {}, playing = false, endAt = 0, timerMin = 0, teardown;
const bufs = {};
const layer = k => S.sounds.mix[k] ||= { on: false, v: 0.5 };
const emit = () => dispatchEvent(new Event('dm:sounds'));

/* ---------- synthesis ---------- */
function noise(type) {
  if (bufs[type]) return bufs[type];
  const len = ac.sampleRate * 4, b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let l = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w * 0.5;
      else if (type === 'brown') { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
      else { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
    }
  }
  return bufs[type] = b;
}
function build(k) {
  const out = ac.createGain(); out.gain.value = 0; out.connect(master);
  const all = out.all = [];
  const src = type => { const s = ac.createBufferSource(); s.buffer = noise(type); s.loop = true; s.start(); all.push(s); return s; };
  const lfo = (freq, amt, param) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = freq; g.gain.value = amt; o.connect(g).connect(param); o.start(); all.push(o); };
  const filter = (type, f, q) => { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q) n.Q.value = q; return n; };
  if (k === 'white' || k === 'pink' || k === 'brown') src(k).connect(out);
  if (k === 'rain') {
    src('pink').connect(filter('highpass', 800)).connect(filter('lowpass', 9000)).connect(out);
    const dg = ac.createGain(); dg.gain.value = 0.25; src('white').connect(filter('bandpass', 3000, 0.6)).connect(dg).connect(out); lfo(7, 0.15, dg.gain);
  }
  if (k === 'wind') { const bp = filter('bandpass', 500, 2), g = ac.createGain(); g.gain.value = 0.8; src('brown').connect(bp).connect(g).connect(out); lfo(0.08, 300, bp.frequency); lfo(0.13, 0.5, g.gain); }
  if (k === 'waves') { const lp = filter('lowpass', 900), g = ac.createGain(); g.gain.value = 0.5; src('pink').connect(lp).connect(g).connect(out); lfo(0.1, 0.48, g.gain); lfo(0.1, 500, lp.frequency); }
  if (k === 'fire') {
    src('brown').connect(filter('lowpass', 400)).connect(out);
    out.gen = 0;
    out.crack = gen => {
      if (gen !== out.gen) return;
      const len = ac.sampleRate * 0.03 | 0, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      const b = ac.createBufferSource(), g = ac.createGain(); b.buffer = buf; g.gain.value = Math.random() * 0.8;
      b.connect(filter('highpass', 1500 + Math.random() * 3000)).connect(g).connect(out); b.start();
      setTimeout(() => out.crack(gen), 40 + Math.random() * 350);
    };
  }
  if (k === 'drone') [65.4, 130.8, 196, 261.6].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; g.gain.value = 0.12 / (i + 1); o.connect(g).connect(out); o.start(); all.push(o); lfo(0.05 + i * 0.03, 0.04 / (i + 1), g.gain); });
  if (k === 'binaural') { const m = ac.createChannelMerger(2); [200, 210].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.15; o.connect(g).connect(m, 0, i); o.start(); all.push(o); }); m.connect(out); }
  return out;
}
function apply(k) {
  if (!ac) return;
  const L = layer(k), on = L.on && playing;
  if (!nodes[k]) { if (!on) return; nodes[k] = build(k); }
  const n = nodes[k];
  n.gain.setTargetAtTime(on ? L.v : 0, ac.currentTime, 0.4);
  if (n.crack) { if (on && !n.cracking) { n.cracking = true; n.crack(++n.gen); } if (!on) { n.cracking = false; n.gen++; } }
}
function ensure() {
  const first = !ac;
  ac = audio();
  if (first && ac) { master = ac.createGain(); master.gain.value = S.sounds.master; master.connect(ac.destination); }
  return !!ac;
}
// Fade to silence at the sleep timer's end. Scheduled on the audio clock so it still happens if the page is throttled.
function schedule() {
  if (!master) return;
  const g = master.gain, t = ac.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(S.sounds.master, t);
  if (endAt) { const left = Math.max(1, (endAt - Date.now()) / 1000), fade = Math.min(30, left); g.setValueAtTime(S.sounds.master, t + left - fade); g.linearRampToValueAtTime(0.0001, t + left); }
}
function media() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: label(), artist: 'Day Mastery', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
  } catch (e) { /* optional */ }
}

/* ---------- controls ---------- */
export const isPlaying = () => playing;
export const timerLeft = () => endAt ? Math.max(0, endAt - Date.now()) : 0;
export function label() { return S.sounds.preset || LAYERS.filter(l => layer(l.k).on).map(l => l.n).join(' + ') || 'Sounds'; }
export function play() {
  if (!LAYERS.some(l => layer(l.k).on)) setMix(PRESETS['Rainy café'], 'Rainy café');
  if (!ensure()) return;
  clearTimeout(teardown);
  // "playback" lets sound play with the iPhone's silent switch on, like a music app.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS */ }
  playing = true; schedule();
  LAYERS.forEach(l => apply(l.k)); media(); emit();
}
export function pause() {
  playing = false; endAt = 0;
  LAYERS.forEach(l => apply(l.k));
  if (master) schedule();
  media(); emit();
  clearTimeout(teardown);
  teardown = setTimeout(() => {
    if (playing) return;
    Object.values(nodes).forEach(n => { n.gen = (n.gen || 0) + 1; n.all.forEach(s => { try { s.stop(); } catch (e) {} }); n.disconnect(); });
    nodes = {};
    try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch (e) {}
  }, 1500);
}
export const toggle = () => playing ? pause() : play();
export function check() { if (playing && endAt && Date.now() >= endAt) pause(); }
function setMix(m, name) {
  LAYERS.forEach(l => { const L = layer(l.k); L.on = l.k in m; if (L.on) L.v = m[l.k]; });
  S.sounds.preset = name; save();
}
function usePreset(m, name) { setMix(m, name); if (playing) { LAYERS.forEach(l => apply(l.k)); media(); emit(); } else play(); }
function setTimer(min) { timerMin = min; endAt = min ? Date.now() + min * 60000 : 0; schedule(); emit(); }

export default {
  id: 'sounds', name: 'Sounds', icon: 'headphones',
  blurb: 'Rain, waves and noise for focus or sleep',

  card(el) {
    const draw = () => {
      el.innerHTML = `<div class="snd-now"><button class="play-btn" data-pp aria-label="${playing ? 'Pause' : 'Play'}">${ic(playing ? 'pause' : 'play', 'fill')}</button>
<div class="grow"><b>${esc(label())}</b><small class="muted">${playing ? (endAt ? `Fades out in ${clock(timerLeft() / 1000)}` : 'Playing') : 'Tap play or pick a mix'}</small></div>${playing ? '<span class="eq on"><i></i><i></i><i></i><i></i></span>' : ''}</div>
<div class="chips">${Object.keys(PRESETS).slice(0, 4).map(p => `<button class="chip ${S.sounds.preset === p ? 'on' : ''}" data-preset="${esc(p)}">${esc(p)}</button>`).join('')}</div>`;
      $('[data-pp]', el).onclick = toggle;
      $$('[data-preset]', el).forEach(b => b.onclick = () => usePreset(PRESETS[b.dataset.preset], b.dataset.preset));
    };
    draw();
    addEventListener('dm:sounds', draw);
    return () => removeEventListener('dm:sounds', draw);
  },

  view(el, ctx) {
    const draw = () => {
      const saved = S.sounds.saved;
      el.innerHTML = header({ title: 'Sounds', back: ctx.back, tool: 'sounds' }) + `
<section class="card snd-hero" style="--c:var(--c-sounds)">
  <div class="snd-now"><button class="play-btn lg" data-pp aria-label="${playing ? 'Pause' : 'Play'}">${ic(playing ? 'pause' : 'play', 'fill')}</button>
  <div class="grow"><b>${esc(label())}</b><small class="muted" id="tl">${playing ? 'Playing' : 'Paused'}</small></div><span class="eq ${playing ? 'on' : ''}"><i></i><i></i><i></i><i></i></span></div>
  <label class="vol">${ic('volume')}<input type="range" min="0" max="1" step="0.01" value="${S.sounds.master}" id="mv" aria-label="Volume"></label>
  <div class="lbl">Sleep timer</div>
  <div class="seg" id="tm">${TIMERS.map(m => `<button data-t="${m}" class="${(endAt ? timerMin : 0) === m ? 'on' : ''}">${m ? m + 'm' : 'Off'}</button>`).join('')}</div>
</section>
<h2 class="sec-t">Mixes</h2>
<div class="chips">${Object.keys(PRESETS).map(p => `<button class="chip ${S.sounds.preset === p ? 'on' : ''}" data-preset="${esc(p)}">${esc(p)}</button>`).join('')}
${Object.keys(saved).map(p => `<span class="chip mine ${S.sounds.preset === p ? 'on' : ''}"><button data-mine="${esc(p)}">★ ${esc(p)}</button><button data-rm="${esc(p)}" aria-label="Remove ${esc(p)}">${ic('x')}</button></span>`).join('')}
<button class="chip add" data-savemix>${ic('plus')} Save this mix</button></div>
<h2 class="sec-t">Layers</h2>
<div class="layers">${LAYERS.map(l => { const L = layer(l.k); return `<div class="layer ${L.on ? 'on' : ''}" data-k="${l.k}"><button data-toggle="${l.k}"><span class="le">${ic(l.i)}</span><span>${l.n}</span></button><input type="range" min="0" max="1" step="0.01" value="${L.v}" data-vol="${l.k}" aria-label="${l.n} volume"></div>`; }).join('')}</div>
<p class="hint">Sound keeps playing while you use other tools. Alpha waves work best with headphones.</p>`;
      $('[data-pp]', el).onclick = toggle;
      $('#mv', el).oninput = e => { S.sounds.master = +e.target.value; save(); if (master) schedule(); };
      $$('[data-t]', el).forEach(b => b.onclick = () => { if (!playing && +b.dataset.t) play(); setTimer(+b.dataset.t); $$('[data-t]', el).forEach(x => x.classList.toggle('on', x === b)); });
      $$('[data-preset]', el).forEach(b => b.onclick = () => usePreset(PRESETS[b.dataset.preset], b.dataset.preset));
      $$('[data-mine]', el).forEach(b => b.onclick = () => usePreset(saved[b.dataset.mine], b.dataset.mine));
      $$('[data-rm]', el).forEach(b => b.onclick = () => { delete saved[b.dataset.rm]; if (S.sounds.preset === b.dataset.rm) S.sounds.preset = ''; save(); draw(); });
      $$('[data-toggle]', el).forEach(b => b.onclick = () => {
        const k = b.dataset.toggle, L = layer(k); L.on = !L.on; S.sounds.preset = ''; save();
        if (L.on && !playing) play(); else { apply(k); media(); emit(); }
      });
      $$('[data-vol]', el).forEach(r => r.oninput = () => { const k = r.dataset.vol, L = layer(k); L.v = +r.value; if (!L.on) { L.on = true; S.sounds.preset = ''; r.closest('.layer').classList.add('on'); } save(); playing ? apply(k) : play(); });
      $('[data-savemix]', el).onclick = () => {
        const m = {}; LAYERS.forEach(l => { if (layer(l.k).on) m[l.k] = layer(l.k).v; });
        if (!Object.keys(m).length) return;
        sheet({
          title: 'Save this mix', tool: 'sounds',
          html: `<input class="input" id="mn" maxlength="24" placeholder="e.g. Sunday reading"><div class="row-btns"><button class="btn pri" data-ok>Save</button></div>`,
          mount(b, close) {
            setTimeout(() => $('#mn', b).focus(), 350);
            const ok = () => { const name = $('#mn', b).value.trim(); if (!name) return; saved[name] = m; S.sounds.preset = name; save(); close(); draw(); };
            $('[data-ok]', b).onclick = ok; $('#mn', b).onkeydown = e => { if (e.key === 'Enter') ok(); };
          },
        });
      };
    };
    draw();
    const onChange = () => draw();
    addEventListener('dm:sounds', onChange);
    const iv = setInterval(() => { const tl = $('#tl', el); if (tl && playing && endAt) tl.textContent = `Fades out in ${clock(timerLeft() / 1000)}`; }, 1000);
    return () => { removeEventListener('dm:sounds', onChange); clearInterval(iv); };
  },
};
