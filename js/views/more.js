// More: every tool in one place, plus tools you haven't turned on yet.
import { S, save, TOOL_IDS } from '../store.js';
import { ic, header, go, toast, $$ } from '../ui.js';
import { TOOLS, isOn, enabledIds } from '../tools/index.js';

export default {
  view(el, ctx) {
    const draw = () => {
      const on = enabledIds(), off = TOOL_IDS.filter(id => !isOn(id));
      const tile = (id, name, icon, blurb, c = `var(--c-${id})`) => `<button class="tile" data-go="${id}" style="--c:${c}"><span class="chip-ic">${ic(icon)}</span><b>${name}</b><small>${blurb}</small></button>`;
      el.innerHTML = header({ title: 'All tools', back: ctx.back }) + `
<div class="tiles">${on.map(id => tile(id, TOOLS[id].name, TOOLS[id].icon, TOOLS[id].blurb)).join('')}
${tile('growth', 'Growth', 'sprout', 'Your garden, streaks and weekly progress', 'var(--accent)')}
${tile('settings', 'Settings', 'settings', 'Make Day Mastery yours', 'var(--ink-2)')}</div>
${off.length ? `<h2 class="sec-t">Add more tools</h2><div class="list">${off.map(id => `<div class="row" style="--c:var(--c-${id})"><span class="chip-ic">${ic(TOOLS[id].icon)}</span><div class="grow"><b>${TOOLS[id].name}</b><small>${TOOLS[id].blurb}</small></div><button class="btn soft sm" data-add="${id}">${ic('plus')} Add</button></div>`).join('')}</div>` : ''}`;
      $$('[data-go]', el).forEach(b => b.onclick = () => go(b.dataset.go));
      $$('[data-add]', el).forEach(b => b.onclick = () => { S.settings.tools[b.dataset.add].on = true; save(); toast(`${TOOLS[b.dataset.add].name} added to Today`); draw(); });
    };
    draw();
  },
};
