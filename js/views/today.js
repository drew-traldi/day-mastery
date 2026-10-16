// Today: the growing plant up top, then a card for each tool in the order you chose.
import { S, dk, save } from '../store.js';
import { esc, ic, go, plant, growPlant, stageOf, ring, celebrate, $, $$ } from '../ui.js';
import { TOOLS, enabledIds, counted, dayScore } from '../tools/index.js';

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installed = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;

export default {
  view(el) {
    const h = new Date().getHours();
    const hi = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const name = S.profile.name.trim();
    const ids = enabledIds();
    el.innerHTML = `
<header class="hd"><span class="sp"></span><button class="icon-btn" data-go="settings" aria-label="Settings">${ic('settings')}</button></header>
<h1 class="title hello">${hi}${name ? `, <em>${esc(name)}</em>` : ''}.</h1>
<p class="sub">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
${isIOS() && !installed() && S.settings.installHint ? `<section class="card install"><div class="grow"><b>Add Day Mastery to your Home Screen</b><p>Tap <span class="kbd">${ic('share')}</span> Share in Safari, then <b>Add to Home Screen</b>. It opens full screen and keeps your data safe.</p></div><button class="icon-btn sm ghost" data-hide aria-label="Dismiss">${ic('x')}</button></section>` : ''}
<section class="card hero" data-go="growth" aria-label="Your growth today">
  <div class="hero-plant">${plant(0)}</div>
  <div class="hero-txt"><div class="hero-pct"><b id="pct">0</b><span>%</span></div><div class="hero-stage" id="stage"></div><p class="muted" id="tip"></p></div>
  <div class="hero-rings" id="rings"></div>
</section>
<div class="cards">${ids.map(id => `<section class="card tcard" data-tool="${id}" style="--c:var(--c-${id})">
  <div class="card-h"><span class="chip-ic">${ic(TOOLS[id].icon)}</span><h3>${TOOLS[id].name}</h3><button class="more" data-go="${id}">Open${ic('chevR')}</button></div>
  <div class="tbody"></div></section>`).join('')}</div>
${ids.length ? '' : '<p class="muted center">All your tools are turned off. Turn some on in Settings.</p>'}
<button class="btn ghost block" data-go="settings">${ic('settings')} Customize your day</button>`;

    const svg = $('.hero-plant svg', el);
    let lastG = -1;
    const changed = () => {
      const k = dk(), g = dayScore(k), st = stageOf(g);
      growPlant(svg, g);
      $('#pct', el).textContent = Math.round(g * 100);
      $('#stage', el).textContent = st.name;
      $('#tip', el).textContent = st.tip;
      $('#rings', el).innerHTML = counted().map(id => {
        const v = TOOLS[id].score(k);
        return v == null ? '' : `<button class="mini" data-go="${id}" aria-label="${esc(TOOLS[id].name)} ${Math.round(v * 100)}%">${ring(v, `var(--c-${id})`, TOOLS[id].icon)}</button>`;
      }).join('');
      if (lastG >= 0 && lastG < 1 && g >= 1) celebrate(svg, 'var(--accent)');
      lastG = g;
    };
    const cleanups = ids.map(id => TOOLS[id].card($(`[data-tool="${id}"] .tbody`, el), { changed }));
    // Start from a seed and grow to today's size, so opening Today shows the plant growing.
    requestAnimationFrame(() => requestAnimationFrame(changed));

    el.onclick = e => {
      if (e.target.closest('[data-hide]')) { S.settings.installHint = false; save(); e.target.closest('.install').remove(); return; }
      const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
    };
    return () => cleanups.forEach(c => typeof c === 'function' && c());
  },
};
