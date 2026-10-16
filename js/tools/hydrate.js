// Hydrate: log drinks toward a daily water goal. Amounts are stored in ml and shown in ml or fl oz.
import { S, dk, lastDays, save } from '../store.js';
import { esc, ic, header, sheet, stepRow, bindControls, celebrate, bars, num, $, $$ } from '../ui.js';

const OZ = 29.5735;
const DRINKS = [
  { e: '💧', n: 'Sip', ml: 100, oz: 4 }, { e: '🥛', n: 'Glass', ml: 250, oz: 8 }, { e: '🍶', n: 'Bottle', ml: 500, oz: 16.9 },
  { e: '☕', n: 'Coffee', ml: 200, oz: 8 }, { e: '🍵', n: 'Tea', ml: 250, oz: 8 }, { e: '🥤', n: 'Large', ml: 750, oz: 24 },
];
const isOz = () => S.goals.unit === 'oz';
const U = () => isOz() ? 'oz' : 'ml';
const size = d => isOz() ? d.oz * OZ : d.ml;
export const show = ml => num(isOz() ? ml / OZ : ml);
const log = k => S.hydrate.days[k] || [];
const total = k => log(k).reduce((a, b) => a + b.ml, 0);

function add(ml, name) { (S.hydrate.days[dk()] ||= []).push({ ml: Math.round(ml), n: name, t: Date.now() }); save(); }
function undo() { const l = S.hydrate.days[dk()]; if (l?.length) { l.pop(); save(); } }

function settings(done) {
  sheet({
    title: 'Hydrate settings', tool: 'hydrate', onClose: done,
    html: `<div class="list">
<div class="row"><div class="grow">Units</div><div class="seg mini" data-units>${['ml', 'oz'].map(u => `<button data-u="${u}" class="${S.goals.unit === u ? 'on' : ''}">${u === 'oz' ? 'fl oz' : 'ml'}</button>`).join('')}</div></div>
<div id="goalRow">${goalRow()}</div></div>`,
    mount(b) {
      bindControls(b);
      $$('[data-u]', b).forEach(x => x.onclick = () => {
        S.goals.unit = x.dataset.u; save();
        $$('[data-u]', b).forEach(y => y.classList.toggle('on', y === x));
        $('#goalRow', b).innerHTML = goalRow(); bindControls($('#goalRow', b));
      });
    },
  });
}
export const goalRow = () => isOz()
  ? stepRow('goals.water', 'Daily goal', { min: 16, max: 200, step: 8, unit: 'oz', scale: OZ })
  : stepRow('goals.water', 'Daily goal', { min: 500, max: 6000, step: 250, unit: 'ml' });

export default {
  id: 'hydrate', name: 'Hydrate', icon: 'drop',
  blurb: 'Drink enough water, glass by glass',
  score: k => Math.min(1, total(k) / S.goals.water),
  summary(days) {
    const logged = days.filter(k => total(k) > 0), hit = days.filter(k => total(k) >= S.goals.water).length;
    if (!logged.length) return 'No drinks logged yet';
    return `Avg ${show(logged.reduce((a, k) => a + total(k), 0) / logged.length)} ${U()} a day · goal hit ${hit} of ${days.length} days`;
  },

  card(el, ctx) {
    const draw = () => {
      const t = total(dk()), g = S.goals.water;
      el.innerHTML = `<div class="metric"><div class="big">${show(t)}<small>/ ${show(g)} ${U()}</small></div>${t >= g ? '<span class="pill">Goal reached</span>' : ''}</div>
<div class="bar"><i style="width:${Math.min(100, t / g * 100)}%"></i></div>
<div class="btns">${[1, 2, 0].map(i => `<button class="btn soft sm" data-add="${i}">${DRINKS[i].e} ${DRINKS[i].n}</button>`).join('')}<button class="icon-btn sm" data-undo aria-label="Undo last drink">${ic('undo')}</button></div>`;
      $$('[data-add]', el).forEach(b => b.onclick = () => {
        const before = total(dk()), d = DRINKS[+b.dataset.add]; add(size(d), d.n); draw(); ctx.changed();
        if (before < S.goals.water && total(dk()) >= S.goals.water) celebrate($('.bar', el), 'var(--c-hydrate)');
      });
      $('[data-undo]', el).onclick = () => { undo(); draw(); ctx.changed(); };
    };
    draw();
  },

  view(el, ctx) {
    let prev = 0;
    const draw = () => {
      const k = dk(), t = total(k), g = S.goals.water, p = Math.min(100, t / g * 100), L = log(k);
      el.innerHTML = header({ title: 'Hydrate', back: ctx.back, tool: 'hydrate', actions: `<button class="icon-btn" data-settings aria-label="Hydrate settings">${ic('settings')}</button>` }) + `
<div class="glass-wrap"><div class="glass"><div class="water" style="height:${prev}%">
  <svg class="wv a" viewBox="0 0 440 20" preserveAspectRatio="none"><path d="M0 10Q55 0 110 10T220 10T330 10T440 10V20H0Z"/></svg>
  <svg class="wv b" viewBox="0 0 440 20" preserveAspectRatio="none"><path d="M0 10Q55 20 110 10T220 10T330 10T440 10V20H0Z"/></svg>
</div><div class="glass-pct">${Math.round(t / g * 100)}%</div></div></div>
<div class="center"><div class="big">${show(t)}<small>/ ${show(g)} ${U()}</small></div>
<p class="muted">${t >= g ? 'Goal reached. Nicely done.' : `${show(g - t)} ${U()} to go, about ${Math.ceil((g - t) / size(DRINKS[1]))} more glasses`}</p></div>
<div class="drinks">${DRINKS.map((d, i) => `<button data-add="${i}"><span>${d.e}</span>${d.n}<small>${show(size(d))} ${U()}</small></button>`).join('')}</div>
<form class="custom-add" data-custom><input class="input" type="number" inputmode="decimal" min="1" placeholder="Custom amount" aria-label="Custom amount in ${U()}"><span>${U()}</span><button class="btn soft">Add</button></form>
<section class="card"><div class="card-h"><h3>This week</h3></div>${bars(lastDays(7).map(d => ({ k: d, v: total(d) / g })))}</section>
${L.length ? `<h2 class="sec-t">Today's log</h2><div class="list">${L.map((e, i) => ({ e, i })).reverse().map(({ e, i }) => `<div class="row"><div class="grow">${esc(e.n)}<small>${new Date(e.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small></div><b>${show(e.ml)} ${U()}</b><button class="icon-btn sm ghost" data-del="${i}" aria-label="Remove">${ic('x')}</button></div>`).join('')}</div>` : ''}`;
      requestAnimationFrame(() => requestAnimationFrame(() => { const w = $('.water', el); if (w) w.style.height = p + '%'; prev = p; }));
      $$('[data-add]', el).forEach(b => b.onclick = () => { const d = DRINKS[+b.dataset.add]; logIt(size(d), d.n); });
      $('[data-custom]', el).onsubmit = e => {
        e.preventDefault(); const v = parseFloat($('[data-custom] input', el).value);
        if (v > 0) logIt(isOz() ? v * OZ : v, 'Custom');
      };
      $$('[data-del]', el).forEach(b => b.onclick = () => { L.splice(+b.dataset.del, 1); save(); draw(); });
      $('[data-settings]', el).onclick = () => settings(draw);
    };
    const logIt = (ml, name) => {
      const before = total(dk()); add(ml, name); draw();
      bubbles();
      if (before < S.goals.water && total(dk()) >= S.goals.water) celebrate($('.glass', el), 'var(--c-hydrate)');
    };
    const bubbles = () => {
      const w = $('.water', el); if (!w) return;
      for (let i = 0; i < 8; i++) {
        const b = document.createElement('i'); b.className = 'bub';
        b.style.cssText = `left:${10 + Math.random() * 80}%;animation-delay:${Math.random()}s;width:${4 + Math.random() * 8}px`;
        w.appendChild(b); setTimeout(() => b.remove(), 5000);
      }
    };
    draw();
  },
};
