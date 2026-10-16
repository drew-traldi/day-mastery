// First run: your name, the tools you want, and your color.
import { S, save, TOOL_IDS } from '../store.js';
import { esc, ic, plant, growPlant, themePicker, bindThemePicker, $, $$ } from '../ui.js';
import { TOOLS } from '../tools/index.js';

export default function onboarding(el, done) {
  let step = 0;
  const picked = new Set(TOOL_IDS.filter(id => S.settings.tools[id].on));
  const draw = () => {
    el.innerHTML = `<div class="ob">${step === 0 ? `
  <div class="ob-plant">${plant(0)}</div>
  <h1 class="ob-t">Day Mastery</h1>
  <p class="ob-s">Grow a little every day.</p>
  <label class="lbl" for="nm">What should we call you?</label>
  <input class="input lg" id="nm" autocomplete="given-name" placeholder="Your first name" maxlength="30" value="${esc(S.profile.name)}" enterkeyhint="next">
  <button class="btn pri lg block" data-next>Continue</button>` : step === 1 ? `
  <h1 class="ob-t sm">What do you want to grow?</h1>
  <p class="ob-s">Pick the tools for your day. You can change these anytime.</p>
  <div class="ob-tools">${TOOL_IDS.map(id => `<button class="ob-tool ${picked.has(id) ? 'on' : ''}" data-id="${id}" style="--c:var(--c-${id})"><span class="chip-ic">${ic(TOOLS[id].icon)}</span><span class="grow"><b>${TOOLS[id].name}</b><small>${TOOLS[id].blurb}</small></span><span class="ob-check">${ic('check')}</span></button>`).join('')}</div>
  <button class="btn pri lg block" data-next ${picked.size ? '' : 'disabled'}>Continue</button>` : `
  <h1 class="ob-t sm">Make it yours</h1>
  <p class="ob-s">Choose a color. Everything here can be changed later in Settings.</p>
  <div class="ob-plant">${plant(0)}</div>
  <div id="look">${themePicker()}</div>
  <button class="btn pri lg block" data-next>Start growing</button>`}
  <div class="ob-foot">${step ? `<button class="btn ghost sm" data-back>${ic('chevL')} Back</button>` : '<span></span>'}<div class="ob-dots">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div><span></span></div>
</div>`;
    const svg = $('.ob-plant svg', el);
    if (svg) requestAnimationFrame(() => requestAnimationFrame(() => growPlant(svg, step === 0 ? 0.3 : 1)));
    const name = $('#nm', el);
    if (name) { name.oninput = () => { S.profile.name = name.value.trim(); save(); }; name.onkeydown = e => { if (e.key === 'Enter') next(); }; }
    $$('[data-id]', el).forEach(b => b.onclick = () => {
      picked.has(b.dataset.id) ? picked.delete(b.dataset.id) : picked.add(b.dataset.id);
      b.classList.toggle('on', picked.has(b.dataset.id));
      $('[data-next]', el).disabled = !picked.size;
    });
    if (step === 2) bindThemePicker($('#look', el));
    $('[data-next]', el).onclick = next;
    $('[data-back]', el)?.addEventListener('click', () => { step--; draw(); });
  };
  const next = () => {
    if (step < 2) { step++; draw(); scrollTo(0, 0); return; }
    TOOL_IDS.forEach(id => { S.settings.tools[id].on = picked.has(id); });
    // Fill the tab bar with tools you picked, keeping Growth.
    const pins = ['focus', 'habits', 'journal', 'plan', 'breathe', 'hydrate', 'sleep', 'sounds'].filter(id => picked.has(id)).slice(0, 2);
    S.settings.pins = [...pins, 'growth'];
    S.profile.onboarded = true; save();
    done();
  };
  draw();
}
