// Growth: your garden of past days, streaks, and how each tool went this week.
import { S, dk, shift, lastDays } from '../store.js';
import { ic, header, plant, ring, go, wd, dayLabel, $$ } from '../ui.js';
import { TOOLS, enabledIds, dayScore } from '../tools/index.js';
import { MOODS } from '../tools/journal.js';

export default {
  view(el, ctx) {
    const k = dk(), week = lastDays(7), prev = lastDays(7, shift(k, -7)), month = lastDays(35);
    const sc = {};
    const score = d => sc[d] ??= dayScore(d);
    const avg = days => days.reduce((a, d) => a + score(d), 0) / days.length;
    let streak = 0;
    for (let d = score(k) > 0 ? k : shift(k, -1); score(d) > 0 && streak < 999; d = shift(d, -1)) streak++;
    const blooms = month.filter(d => score(d) >= 1).length;
    const wAvg = avg(week), pAvg = avg(prev), diff = Math.round((wAvg - pAvg) * 100);
    const msg = !week.some(d => score(d) > 0) ? 'Every day is a fresh seed. Start with one small thing.'
      : !prev.some(d => score(d) > 0) ? 'Your garden is just getting started. Keep showing up.'
      : diff > 4 ? `You're up ${diff}% from last week. Keep growing.`
      : diff < -4 ? 'A slower week. That is part of growing too.'
      : 'Steady growth. Consistency is the secret.';
    const tools = enabledIds().filter(id => TOOLS[id].summary);
    const moods = lastDays(14).map(d => S.journal.days[d]?.mood || 0);

    el.innerHTML = header({ title: 'Growth', back: ctx.back, sub: msg }) + `
<section class="card garden">
  <div class="plants">${week.map(d => `<div class="gday ${d === k ? 'today' : ''}">${plant(score(d), 'static')}<b>${Math.round(score(d) * 100)}%</b><span>${d === k ? 'Today' : wd(d)}</span></div>`).join('')}</div>
</section>
<div class="stats">
  <div class="stat"><b>${streak}</b><span>day streak</span></div>
  <div class="stat"><b>${Math.round(wAvg * 100)}%</b><span>this week</span></div>
  <div class="stat"><b>${blooms}</b><span>full blooms</span></div>
</div>
<section class="card"><div class="card-h"><h3>Last 5 weeks</h3><span class="muted">darker = more growth</span></div>
  <div class="heat">${month.map(d => `<i title="${dayLabel(d)}: ${Math.round(score(d) * 100)}%" class="${d === k ? 'today' : ''}" style="background:color-mix(in oklab,var(--accent) ${Math.round(score(d) * 100)}%,var(--surface-2))"></i>`).join('')}</div>
</section>
${moods.some(Boolean) ? `<section class="card"><div class="card-h"><h3>Mood</h3><span class="muted">last 2 weeks</span></div>
  <div class="mood-strip static">${lastDays(14).map((d, i) => `<div><span>${moods[i] ? MOODS[moods[i] - 1].e : '·'}</span><small>${wd(d)}</small></div>`).join('')}</div></section>` : ''}
<h2 class="sec-t">This week</h2>
<div class="list">${tools.map(id => {
      const t = TOOLS[id], v = t.score ? week.reduce((a, d) => a + (t.score(d) ?? 0), 0) / 7 : 0;
      return `<button class="row link" data-go="${id}">${t.score ? ring(v, `var(--c-${id})`, t.icon) : ''}<div class="grow"><b>${t.name}</b><small>${t.summary(week)}</small></div>${ic('chevR')}</button>`;
    }).join('')}</div>`;
    $$('[data-go]', el).forEach(b => b.onclick = () => go(b.dataset.go));
  },
};
