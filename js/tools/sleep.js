// Sleep: log last night (stored under the day you woke up) and work out bedtimes by 90-minute cycles.
import { S, dk, lastDays, save } from '../store.js';
import { ic, header, sheet, stepRow, timeRow, bindControls, dur, timeLabel, dayLabel, bars, $, $$ } from '../ui.js';

const Q = [{ e: '😫', n: 'Exhausted' }, { e: '😪', n: 'Tired' }, { e: '😐', n: 'Okay' }, { e: '🙂', n: 'Rested' }, { e: '🤩', n: 'Great' }];
const mins = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const hhmm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const hours = e => { let d = mins(e.wake) - mins(e.bed); if (d <= 0) d += 1440; return d / 60; };
const entry = k => S.sleep.log[k];
const lastBed = () => { const ks = Object.keys(S.sleep.log).sort(); return ks.length ? S.sleep.log[ks.at(-1)].bed : '23:00'; };
const tonight = () => timeLabel(hhmm(mins(S.goals.wake) - S.goals.sleepHours * 60 - S.goals.latency));

function stars() {
  return Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 70}%;animation-delay:${(i % 7) * 0.4}s"></i>`).join('');
}

function settings(done) {
  sheet({
    title: 'Sleep settings', tool: 'sleep', onClose: done,
    html: `<div class="list">
${stepRow('goals.sleepHours', 'Sleep goal', { min: 5, max: 11, step: 0.5, unit: 'hours' })}
${timeRow('goals.wake', 'Usual wake-up time')}
${stepRow('goals.latency', 'Time to fall asleep', { min: 0, max: 60, step: 5, unit: 'min' })}
</div>`,
    mount: b => bindControls(b),
  });
}

export default {
  id: 'sleep', name: 'Sleep', icon: 'moon',
  blurb: 'Log your sleep and find your ideal bedtime',
  score: k => entry(k) ? Math.min(1, hours(entry(k)) / S.goals.sleepHours) : 0,
  summary(days) {
    const e = days.map(entry).filter(Boolean);
    return e.length ? `Avg ${dur(e.reduce((a, x) => a + hours(x), 0) / e.length * 60)} a night · ${e.length} logged` : 'No nights logged yet';
  },

  card(el, ctx) {
    const draw = () => {
      const e = entry(dk());
      if (e) {
        const h = hours(e);
        el.innerHTML = `<div class="metric"><div class="big">${dur(h * 60)}<small>last night</small></div>${e.q ? `<span class="pill">${Q[e.q - 1].e} ${Q[e.q - 1].n}</span>` : ''}</div>
<div class="bar"><i style="width:${Math.min(100, h / S.goals.sleepHours * 100)}%"></i></div>
<p class="muted">Tonight, aim for bed by <b>${tonight()}</b> to wake at ${timeLabel(S.goals.wake)}.</p>`;
      } else {
        el.innerHTML = `<p class="muted">How did you sleep last night?</p>
<div class="two"><label class="field"><span>Went to bed</span><input type="time" data-bed value="${lastBed()}"></label><label class="field"><span>Woke up</span><input type="time" data-wake value="${S.goals.wake}"></label></div>
<button class="btn pri sm block" data-save>Save last night</button>`;
        $('[data-save]', el).onclick = () => {
          const bed = $('[data-bed]', el).value, wake = $('[data-wake]', el).value;
          if (!bed || !wake) return;
          S.sleep.log[dk()] = { bed, wake, q: 0 }; save(); draw(); ctx.changed();
        };
      }
    };
    draw();
  },

  view(el, ctx) {
    let sel = dk(), calcMode = 'wake', calcTime = S.goals.wake;
    const draw = () => {
      const last = entry(dk()), e = entry(sel), week = lastDays(7);
      const logged = week.map(entry).filter(Boolean), avg = logged.length ? logged.reduce((a, x) => a + hours(x), 0) / logged.length : 0;
      el.innerHTML = header({ title: 'Sleep', back: ctx.back, tool: 'sleep', actions: `<button class="icon-btn" data-settings aria-label="Sleep settings">${ic('settings')}</button>` }) + `
<section class="night"><div class="stars">${stars()}</div><div class="moon"></div>
  <div class="n-lbl">Last night</div>
  <div class="n-big">${last ? dur(hours(last) * 60) : 'Not logged'}</div>
  ${last?.q ? `<div class="n-q">${Q[last.q - 1].e} ${Q[last.q - 1].n}</div>` : ''}
  <div class="n-tip">Tonight, aim for bed by <b>${tonight()}</b></div>
</section>
<section class="card" style="--c:var(--c-sleep)">
  <div class="card-h"><h3>${sel === dk() ? 'Log last night' : `Night before ${dayLabel(sel)}`}</h3>${sel !== dk() ? `<button class="more" data-today>Back to today</button>` : ''}</div>
  <div class="two"><label class="field"><span>Went to bed</span><input type="time" id="bed" value="${e?.bed || lastBed()}"></label><label class="field"><span>Woke up</span><input type="time" id="wake" value="${e?.wake || S.goals.wake}"></label></div>
  <div class="lbl">How rested do you feel?</div>
  <div class="qrow">${Q.map((q, i) => `<button data-q="${i + 1}" class="${e?.q === i + 1 ? 'on' : ''}"><span>${q.e}</span><small>${q.n}</small></button>`).join('')}</div>
  <div class="row-btns"><span class="muted grow" id="dur"></span>${e ? '<button class="btn ghost" data-clear>Clear</button>' : ''}<button class="btn pri" data-save>${e ? 'Update' : 'Save'}</button></div>
</section>
<section class="card" style="--c:var(--c-sleep)"><div class="card-h"><h3>This week</h3><span class="muted">${logged.length ? `avg ${dur(avg * 60)}` : ''}</span></div>
${bars(week.map(k => ({ k, v: entry(k) ? hours(entry(k)) / S.goals.sleepHours : 0 })))}<p class="hint">Tap a day to log or edit that night.</p></section>
<section class="card" style="--c:var(--c-sleep)"><div class="card-h"><h3>Bedtime calculator</h3></div>
  <div class="seg" id="cm"><button data-cm="wake">I want to wake at</button><button data-cm="now">I'm going to bed now</button></div>
  <div id="calc"></div>
</section>`;
      let q = e?.q || 0;
      const preview = () => { const b = $('#bed', el).value, w = $('#wake', el).value; $('#dur', el).textContent = b && w ? dur(hours({ bed: b, wake: w }) * 60) + ' of sleep' : ''; };
      preview();
      $('#bed', el).oninput = $('#wake', el).oninput = preview;
      $$('[data-q]', el).forEach(b => b.onclick = () => { q = +b.dataset.q; $$('[data-q]', el).forEach(x => x.classList.toggle('on', x === b)); });
      $('[data-save]', el).onclick = () => {
        const bed = $('#bed', el).value, wake = $('#wake', el).value;
        if (!bed || !wake) return;
        S.sleep.log[sel] = { bed, wake, q }; save(); draw();
      };
      $('[data-clear]', el)?.addEventListener('click', () => { delete S.sleep.log[sel]; save(); draw(); });
      $('[data-today]', el)?.addEventListener('click', () => { sel = dk(); draw(); });
      $$('.bars .b', el).forEach(b => b.onclick = () => { sel = b.dataset.k; draw(); });
      $('[data-settings]', el).onclick = () => settings(draw);
      $$('[data-cm]', el).forEach(b => b.onclick = () => { calcMode = b.dataset.cm; calc(); });
      calc();
    };
    const results = () => {
      const best = Math.max(3, Math.min(6, Math.round(S.goals.sleepHours / 1.5))), lat = S.goals.latency;
      let rows, note;
      if (calcMode === 'wake') {
        rows = [6, 5, 4, 3].map(c => ({ c, t: hhmm(mins(calcTime) - c * 90 - lat) }));
        note = `Go to bed at one of these times to wake up between sleep cycles. Includes ${lat} minutes to fall asleep.`;
      } else {
        const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
        rows = [3, 4, 5, 6].map(c => ({ c, t: hhmm(m + lat + c * 90) }));
        note = `If you fall asleep in about ${lat} minutes, set an alarm for one of these times.`;
      }
      $('#cyc', el).innerHTML = `<div class="cycles">${rows.map(r => `<div class="${r.c === best ? 'best' : ''}"><b>${timeLabel(r.t)}</b><small>${r.c} cycles · ${r.c * 1.5}h</small></div>`).join('')}</div><p class="hint">${note}</p>`;
    };
    const calc = () => {
      $$('[data-cm]', el).forEach(b => b.classList.toggle('on', b.dataset.cm === calcMode));
      $('#calc', el).innerHTML = `${calcMode === 'wake' ? `<label class="field center-field"><input type="time" id="ct" value="${calcTime}"></label>` : ''}<div id="cyc"></div>`;
      $('#ct', el)?.addEventListener('input', e => { if (e.target.value) { calcTime = e.target.value; results(); } });
      results();
    };
    draw();
  },
};
