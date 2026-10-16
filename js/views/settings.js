// Settings: name, look, which tools are on and in what order, what counts, tab bar, goals, data.
import { S, dk, save, setPath, replaceAll, eraseAll } from '../store.js';
import { esc, ic, header, toast, confirmSheet, stepRow, switchRow, timeRow, bindControls, themePicker, bindThemePicker, applyTheme, refresh, $, $$ } from '../ui.js';
import { TOOLS, enabledIds } from '../tools/index.js';
import { goalRow } from '../tools/hydrate.js';

export const VERSION = '1.0.0';
const PIN_NAMES = { growth: 'Growth' };
const tabsChanged = () => dispatchEvent(new Event('dm:tabs'));

async function exportData() {
  const name = `day-mastery-backup-${dk()}.json`;
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Day Mastery backup' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default {
  view(el, ctx) {
    const draw = () => {
      const order = S.settings.order, pinable = ['growth', ...enabledIds()];
      el.innerHTML = header({ title: 'Settings', back: ctx.back, sub: 'Make Day Mastery yours.' }) + `
<h2 class="sec-t">You</h2>
<div class="list"><label class="row"><div class="grow">Your name</div><input class="input inline" id="nm" value="${esc(S.profile.name)}" placeholder="Name" maxlength="30" autocomplete="given-name"></label></div>

<h2 class="sec-t">Look</h2>
<section class="card" id="look">${themePicker()}</section>

<h2 class="sec-t">Your tools</h2>
<p class="hint">Turn tools on or off, and move them to set their order on Today.</p>
<div class="list">${order.map((id, i) => `<div class="row" style="--c:var(--c-${id})"><span class="chip-ic">${ic(TOOLS[id].icon)}</span><div class="grow"><b>${TOOLS[id].name}</b><small>${TOOLS[id].blurb}</small></div>
<button class="icon-btn sm ghost" data-mv="${i}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Move ${TOOLS[id].name} up">${ic('up')}</button><button class="icon-btn sm ghost" data-mv="${i}" data-d="1" ${i < order.length - 1 ? '' : 'disabled'} aria-label="Move ${TOOLS[id].name} down">${ic('down')}</button>
<input type="checkbox" class="sw" data-tool="${id}" ${S.settings.tools[id].on ? 'checked' : ''} aria-label="${TOOLS[id].name} on"></div>`).join('')}</div>

<h2 class="sec-t">What grows your plant</h2>
<p class="hint">Your day score is the average of these. Turn off anything you don't want to count.</p>
<div class="list">${enabledIds().filter(id => TOOLS[id].score).map(id => switchRow(`settings.tools.${id}.count`, TOOLS[id].name)).join('') || '<div class="row muted">Turn on a tool first.</div>'}</div>

<h2 class="sec-t">Tab bar</h2>
<p class="hint">Pick the three shortcuts between Today and More.</p>
<div class="list">${[0, 1, 2].map(i => `<label class="row"><div class="grow">Shortcut ${i + 1}</div><select class="select" data-pin="${i}">${pinable.map(id => `<option value="${id}" ${S.settings.pins[i] === id ? 'selected' : ''}>${PIN_NAMES[id] || TOOLS[id].name}</option>`).join('')}${S.settings.pins[i] && !pinable.includes(S.settings.pins[i]) ? '<option selected disabled>Choose…</option>' : ''}</select></label>`).join('')}</div>

<h2 class="sec-t">Daily goals</h2>
<div class="list" id="goals">
${stepRow('goals.priorities', 'Top priorities', { min: 1, max: 5 })}
${stepRow('goals.focusSessions', 'Focus sessions', { min: 1, max: 16 })}
${stepRow('goals.focusMin', 'Focus length', { min: 5, max: 90, step: 5, unit: 'min' })}
<div class="row"><div class="grow">Water units</div><div class="seg mini">${['ml', 'oz'].map(u => `<button data-u="${u}" class="${S.goals.unit === u ? 'on' : ''}">${u === 'oz' ? 'fl oz' : 'ml'}</button>`).join('')}</div></div>
<div id="water">${goalRow()}</div>
${stepRow('goals.breatheMin', 'Breathing', { min: 1, max: 30, unit: 'min' })}
${stepRow('goals.sleepHours', 'Sleep', { min: 5, max: 11, step: 0.5, unit: 'hours' })}
${timeRow('goals.wake', 'Usual wake-up time')}
</div>

<h2 class="sec-t">Sound & screen</h2>
<div class="list">${switchRow('settings.sound', 'Chimes', 'Timer bells and breathing tones')}${switchRow('settings.keepAwake', 'Keep screen on during timers', 'For Focus and Breathe')}</div>

<h2 class="sec-t">Your data</h2>
<div class="list">
  <button class="row link" data-export>${ic('download')}<div class="grow">Export a backup<small>Save a file you can restore later or on a new phone</small></div></button>
  <label class="row link">${ic('upload')}<div class="grow">Restore from a backup</div><input type="file" accept="application/json,.json" hidden data-import></label>
  <button class="row link danger" data-erase>${ic('trash')}<div class="grow">Erase everything</div></button>
</div>
<p class="foot">Day Mastery ${VERSION} · Everything stays on this device. Nothing is sent anywhere.</p>`;

      $('#nm', el).oninput = e => setPath('profile.name', e.target.value);
      bindThemePicker($('#look', el));
      bindControls(el);
      $$('[data-tool]', el).forEach(i => i.onchange = () => { S.settings.tools[i.dataset.tool].on = i.checked; save(); tabsChanged(); draw(); });
      $$('[data-mv]', el).forEach(b => b.onclick = () => {
        const i = +b.dataset.mv, j = i + +b.dataset.d, o = S.settings.order;
        [o[i], o[j]] = [o[j], o[i]]; save(); draw();
      });
      $$('[data-pin]', el).forEach(s => s.onchange = () => {
        const i = +s.dataset.pin, pins = S.settings.pins, other = pins.indexOf(s.value);
        if (other > -1 && other !== i) pins[other] = pins[i];   // swap rather than show the same tab twice
        pins[i] = s.value; save(); tabsChanged(); draw();
      });
      $$('[data-u]', el).forEach(b => b.onclick = () => {
        S.goals.unit = b.dataset.u; save();
        $$('[data-u]', el).forEach(x => x.classList.toggle('on', x === b));
        $('#water', el).innerHTML = goalRow(); bindControls($('#water', el));
      });
      $('[data-export]', el).onclick = exportData;
      $('[data-import]', el).onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const data = JSON.parse(await f.text());
          if (!data || !data.profile || !data.settings) throw new Error('not a backup');
          if (await confirmSheet('Replace everything in Day Mastery with this backup?', 'Restore')) { replaceAll(data); applyTheme(); toast('Backup restored'); refresh(); }
        } catch (err) { toast("That file isn't a Day Mastery backup."); }
        e.target.value = '';
      };
      $('[data-erase]', el).onclick = async () => {
        if (await confirmSheet('Erase all your Day Mastery data on this device? Export a backup first if you might want it.', 'Erase')) { eraseAll(); location.replace(location.pathname); }
      };
    };
    draw();
  },
};
