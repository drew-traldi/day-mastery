// Habits: daily check-offs with streaks. Each habit keeps a set of the days it was done.
import { S, dk, fromDk, shift, lastDays, save } from '../store.js';
import { esc, ic, header, sheet, confirmSheet, celebrate, go, wd, $, $$ } from '../ui.js';

const COLORS = ['#3f9a5c', '#2b8fd6', '#e4533d', '#e39a2d', '#7a5ad8', '#d0617f', '#16998f', '#a86a3c'];
const EMOJI = ['🧘', '🏃', '📖', '💧', '🥗', '😴', '✍️', '🙏', '💪', '🚶', '🎸', '🧹', '📵', '🌞', '💊', '🪴', '🦷', '🧠', '🎨', '💰', '🚭', '❤️', '🌱', '⭐'];
const list = () => S.habits.list;
const activeOn = k => list().filter(h => !h.created || h.created <= k);

export function streak(h) {
  let k = dk(), n = 0;
  if (!h.days[k]) k = shift(k, -1);
  while (h.days[k]) { n++; k = shift(k, -1); }
  return n;
}
function monthPct(h) {
  const t = new Date(), days = t.getDate(); let c = 0;
  for (let i = 1; i <= days; i++) if (h.days[dk(new Date(t.getFullYear(), t.getMonth(), i))]) c++;
  return Math.round(c / days * 100);
}
function toggle(h, k) { if (h.days[k]) delete h.days[k]; else h.days[k] = 1; save(); }

function calendar(h, month) {
  const y = month.getFullYear(), m = month.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(), today = dk();
  const heads = Array.from({ length: 7 }, (_, i) => `<span>${new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>`).join('');
  const cells = Array.from({ length: first }, () => '<i></i>').join('') + Array.from({ length: n }, (_, i) => {
    const k = dk(new Date(y, m, i + 1));
    return `<button class="${h.days[k] ? 'on' : ''} ${k === today ? 'is-today' : ''}" data-k="${k}" ${k > today ? 'disabled' : ''}>${i + 1}</button>`;
  }).join('');
  return `<div class="cal-h"><button class="icon-btn sm" data-mo="-1" aria-label="Previous month">${ic('chevL')}</button><b>${month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button class="icon-btn sm" data-mo="1" aria-label="Next month" ${y === new Date().getFullYear() && m === new Date().getMonth() ? 'disabled' : ''}>${ic('chevR')}</button></div><div class="cal">${heads}${cells}</div>`;
}

function editSheet(h, done) {
  const isNew = !h;
  const draft = h ? { ...h } : { name: '', emoji: '🌱', color: COLORS[list().length % COLORS.length] };
  const month = new Date(); month.setDate(1);
  sheet({
    title: isNew ? 'New habit' : 'Edit habit', tool: 'habits', onClose: done,
    html: `<input class="input" id="hn" maxlength="40" placeholder="e.g. Read 20 pages" value="${esc(draft.name)}">
<div class="lbl">Icon</div><div class="emoji-grid">${EMOJI.map(e => `<button class="${e === draft.emoji ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
<div class="lbl">Color</div><div class="swatches">${COLORS.map(c => `<button style="--sc:${c}" class="${c === draft.color ? 'on' : ''}" data-c="${c}" aria-label="Color ${c}"></button>`).join('')}</div>
${isNew ? '' : `<div class="lbl">History</div><div id="cal" style="--hc:${draft.color}"></div>`}
<div class="row-btns">${isNew ? '' : `<button class="btn ghost danger" data-del>${ic('trash')} Delete</button>`}<button class="btn pri" data-save>${isNew ? 'Add habit' : 'Save'}</button></div>`,
    mount(b, close) {
      if (isNew) setTimeout(() => $('#hn', b).focus(), 350);
      $$('[data-e]', b).forEach(x => x.onclick = () => { draft.emoji = x.dataset.e; $$('[data-e]', b).forEach(y => y.classList.toggle('on', y === x)); });
      $$('[data-c]', b).forEach(x => x.onclick = () => { draft.color = x.dataset.c; $$('[data-c]', b).forEach(y => y.classList.toggle('on', y === x)); $('#cal', b)?.style.setProperty('--hc', draft.color); });
      const cal = () => {
        const c = $('#cal', b); if (!c) return;
        c.innerHTML = calendar(h, month);
        $$('[data-k]', c).forEach(x => x.onclick = () => { toggle(h, x.dataset.k); x.classList.toggle('on', !!h.days[x.dataset.k]); });
        $$('[data-mo]', c).forEach(x => x.onclick = () => { month.setMonth(month.getMonth() + +x.dataset.mo); cal(); });
      };
      cal();
      $('[data-save]', b).onclick = () => {
        const name = $('#hn', b).value.trim();
        if (!name) { $('#hn', b).focus(); return; }
        if (isNew) list().push({ id: 'h' + Date.now().toString(36), name, emoji: draft.emoji, color: draft.color, days: {}, created: dk() });
        else Object.assign(h, { name, emoji: draft.emoji, color: draft.color });
        save(); close();
      };
      $('#hn', b).onkeydown = e => { if (e.key === 'Enter') $('[data-save]', b).click(); };
      $('[data-del]', b)?.addEventListener('click', async () => {
        if (await confirmSheet(`Delete “${h.name}” and its history?`)) { S.habits.list = list().filter(x => x !== h); save(); close(); }
      });
    },
  });
}

export default {
  id: 'habits', name: 'Habits', icon: 'habit',
  blurb: 'Build streaks, one day at a time',
  score(k) { const l = activeOn(k); return l.length ? l.filter(h => h.days[k]).length / l.length : null; },
  summary(days) {
    let done = 0, total = 0;
    days.forEach(k => { const l = activeOn(k); total += l.length; done += l.filter(h => h.days[k]).length; });
    return total ? `${Math.round(done / total * 100)}% of check-ins done` : 'No habits yet';
  },
  addNew(done) { editSheet(null, done); },

  card(el, ctx) {
    const draw = () => {
      const k = dk(), l = list();
      el.innerHTML = l.length ? `<div class="hlist">${l.map((h, i) => {
        const s = streak(h);
        return `<button class="hrow ${h.days[k] ? 'done' : ''}" data-i="${i}" style="--hc:${h.color}"><span class="hcheck">${ic('check')}</span><span class="hname">${esc(h.name)}</span>${s ? `<span class="hstreak">${ic('flame')}${s}</span>` : ''}</button>`;
      }).join('')}</div>` : `<p class="muted">Small daily habits add up. Add your first one.</p><button class="btn soft sm" data-add>${ic('plus')} Add a habit</button>`;
      $$('.hrow', el).forEach(b => b.onclick = () => {
        const h = l[+b.dataset.i]; toggle(h, k); draw(); ctx.changed();
        if (h.days[k]) celebrate($(`[data-i="${b.dataset.i}"] .hcheck`, el), h.color);
      });
      $('[data-add]', el)?.addEventListener('click', () => go('habits'));
    };
    draw();
  },

  view(el, ctx) {
    const draw = () => {
      const k = dk(), l = list(), days = lastDays(7), done = l.filter(h => h.days[k]).length;
      el.innerHTML = header({ title: 'Habits', back: ctx.back, tool: 'habits', sub: l.length ? `${done} of ${l.length} done today` : 'Small daily habits add up.' }) + `
<div class="stack">${l.map((h, i) => {
        const s = streak(h);
        return `<section class="card habit" style="--hc:${h.color}">
  <div class="h-top"><button class="h-info" data-edit="${i}"><span class="h-emoji">${esc(h.emoji)}</span><span class="grow"><b>${esc(h.name)}</b><small>${s ? `${s} day streak · ` : ''}${monthPct(h)}% this month</small></span></button>
  <button class="h-today ${h.days[k] ? 'on' : ''}" data-t="${i}" aria-label="Done today">${ic('check')}</button></div>
  <div class="h-week">${days.map(d => `<button class="${h.days[d] ? 'on' : ''} ${d === k ? 'is-today' : ''}" data-i="${i}" data-k="${d}" aria-label="${d}"><span>${wd(d)}</span><i></i></button>`).join('')}</div>
</section>`;
      }).join('')}
<button class="btn soft block" data-new style="--c:var(--c-habits)">${ic('plus')} New habit</button>
<p class="hint center">Tap a habit's name to edit it or see its full history.</p></div>`;
      $$('[data-t]', el).forEach(b => b.onclick = () => { const h = l[+b.dataset.t]; toggle(h, k); if (h.days[k]) celebrate(b, h.color); draw(); });
      $$('.h-week [data-k]', el).forEach(b => b.onclick = () => { toggle(l[+b.dataset.i], b.dataset.k); draw(); });
      $$('[data-edit]', el).forEach(b => b.onclick = () => editSheet(l[+b.dataset.edit], draw));
      $('[data-new]', el).onclick = () => editSheet(null, draw);
    };
    draw();
  },
};
