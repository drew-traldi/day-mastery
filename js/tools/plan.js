// Top 3: today's intention and the few priorities that would make it a win.
import { S, dk, shift, lastDays, save } from '../store.js';
import { esc, ic, header, celebrate, dayNav, bindDayNav, dayLabel, $, $$ } from '../ui.js';

const PH = ['The one thing that matters most', 'Second priority', 'Third priority', 'Fourth priority', 'Fifth priority'];
const n = () => S.goals.priorities;
const get = k => S.plan.days[k];
const filled = d => (d?.tasks || []).slice(0, n()).filter(t => t.t.trim());
function ensure(k) {
  const d = S.plan.days[k] ||= { intent: '', tasks: [] };
  while (d.tasks.length < n()) d.tasks.push({ t: '', done: false });
  return d;
}

function block(k) {
  const d = get(k) || { intent: '', tasks: [] };
  return `<textarea class="intent" rows="1" maxlength="160" enterkeyhint="next" placeholder="What would make ${k === dk() ? 'today' : 'this day'} a win?">${esc(d.intent)}</textarea>
<div class="tasks">${Array.from({ length: n() }, (_, i) => {
    const t = d.tasks[i] || { t: '', done: false };
    return `<div class="task ${t.done ? 'done' : ''}" data-i="${i}"><button class="tick" aria-label="Mark done">${ic('check')}</button><input class="task-in" value="${esc(t.t)}" placeholder="${PH[i]}" maxlength="120" enterkeyhint="${i < n() - 1 ? 'next' : 'done'}"></div>`;
  }).join('')}</div>`;
}

const autosize = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
function bind(root, k, changed) {
  const ta = $('.intent', root);
  requestAnimationFrame(() => autosize(ta));
  ta.oninput = () => { ensure(k).intent = ta.value; save(); autosize(ta); };
  ta.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('.task-in', root)?.focus(); } };
  $$('.task', root).forEach(row => {
    const i = +row.dataset.i, inp = $('.task-in', row);
    inp.oninput = () => {
      const t = ensure(k).tasks[i];
      t.t = inp.value;
      if (!inp.value.trim() && t.done) { t.done = false; row.classList.remove('done'); }
      save(); changed();
    };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const nx = row.nextElementSibling; nx ? $('.task-in', nx).focus() : inp.blur(); } };
    $('.tick', row).onclick = () => {
      const d = ensure(k), t = d.tasks[i];
      if (!t.t.trim()) { inp.focus(); return; }
      t.done = !t.done; save();
      row.classList.toggle('done', t.done); changed();
      if (t.done) celebrate($('.tick', row), 'var(--c-plan)');
    };
  });
}

export default {
  id: 'plan', icon: 'target',
  get name() { return `Top ${n()}`; },
  blurb: 'Set an intention and your top priorities',
  score(k) { const d = get(k); return d ? Math.min(1, filled(d).filter(t => t.done).length / n()) : 0; },
  summary(days) {
    const done = days.reduce((a, k) => a + filled(get(k)).filter(t => t.done).length, 0);
    return `${done} of ${days.length * n()} priorities done`;
  },

  card(el, ctx) { el.innerHTML = block(dk()); bind(el, dk(), ctx.changed); },

  view(el, ctx) {
    let k = dk();
    const draw = () => {
      const carry = k === dk() ? filled(get(shift(k, -1))).filter(t => !t.done) : [];
      const free = n() - filled(get(k)).length;
      const past = lastDays(30).reverse().filter(d => d !== k && (get(d)?.intent.trim() || filled(get(d)).length));
      el.innerHTML = header({ title: this.name, back: ctx.back, tool: 'plan', sub: 'Set your intention, then name the few things that would make the day a win.' }) + `
${dayNav(k)}
<section class="card plan-card" style="--c:var(--c-plan)">${block(k)}</section>
${carry.length && free > 0 ? `<button class="btn soft block" data-carry style="--c:var(--c-plan)">${ic('undo')} Bring over ${Math.min(carry.length, free)} unfinished from yesterday</button>` : ''}
${past.length ? `<h2 class="sec-t">Recent days</h2><div class="list">${past.map(d => {
        const p = get(d), f = filled(p);
        return `<button class="row link" data-k="${d}"><div class="grow"><b>${dayLabel(d)}</b><small class="ital">${esc(p.intent.trim() || 'No intention set')}</small></div><span class="dots">${Array.from({ length: n() }, (_, i) => `<i class="${f[i]?.done ? 'on' : ''}"></i>`).join('')}</span></button>`;
      }).join('')}</div>` : ''}`;
      bind(el, k, () => {});
      bindDayNav(el, k, d => { k = d; draw(); });
      $('[data-carry]', el)?.addEventListener('click', () => {
        const d = ensure(k);
        for (const t of carry) { const slot = d.tasks.slice(0, n()).find(x => !x.t.trim()); if (!slot) break; slot.t = t.t; slot.done = false; }
        save(); draw();
      });
      $$('[data-k]', el).forEach(b => b.onclick = () => { k = b.dataset.k; draw(); scrollTo({ top: 0, behavior: 'smooth' }); });
    };
    draw();
  },
};
