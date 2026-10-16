// Journal: a quick mood check-in, a few feeling tags and a reflection prompt for each day.
import { S, dk, fromDk, lastDays, save } from '../store.js';
import { esc, ic, header, celebrate, dayNav, bindDayNav, dayLabel, wd, go, $, $$ } from '../ui.js';

export const MOODS = [{ e: '😣', n: 'Rough' }, { e: '😕', n: 'Low' }, { e: '😐', n: 'Okay' }, { e: '🙂', n: 'Good' }, { e: '😄', n: 'Great' }];
const TAGS = ['Calm', 'Grateful', 'Focused', 'Energized', 'Happy', 'Proud', 'Hopeful', 'Tired', 'Stressed', 'Anxious', 'Sad', 'Frustrated'];
const PROMPTS = [
  'What went well today?', 'What is one thing you learned today?', 'What are you grateful for right now?',
  'What would make tomorrow great?', 'What challenged you today, and how did you handle it?', 'Where did you grow a little today?',
  'What gave you energy today? What drained it?', 'What are you proud of this week?', 'Who made your day better, and how?',
  'What is something you want to let go of?', 'What small win deserves a celebration?', 'What would you tell yourself from this morning?',
];
const entry = k => S.journal.days[k];
const promptFor = k => Math.floor(fromDk(k).getTime() / 864e5) % PROMPTS.length;
const ensure = k => S.journal.days[k] ||= { mood: 0, tags: [], text: '', p: promptFor(k) };
const has = d => d && (d.mood || d.text?.trim());

function moodRow(k) {
  const d = entry(k);
  return `<div class="moods">${MOODS.map((m, i) => `<button data-mood="${i + 1}" class="${d?.mood === i + 1 ? 'on' : ''}" aria-label="${m.n}"><span>${m.e}</span><small>${m.n}</small></button>`).join('')}</div>`;
}
function bindMoods(root, k, after) {
  $$('[data-mood]', root).forEach(b => b.onclick = () => {
    const d = ensure(k), v = +b.dataset.mood, first = !has(d);
    d.mood = d.mood === v ? 0 : v; save();
    $$('[data-mood]', root).forEach(x => x.classList.toggle('on', +x.dataset.mood === d.mood));
    if (first && d.mood) celebrate(b, 'var(--c-journal)');
    after && after();
  });
}

export default {
  id: 'journal', name: 'Journal', icon: 'book',
  blurb: 'Check in with your mood and reflect',
  score: k => has(entry(k)) ? 1 : 0,
  summary(days) {
    const e = days.map(entry).filter(has), moods = e.map(x => x.mood).filter(Boolean);
    if (!e.length) return 'No check-ins yet';
    const avg = moods.length ? MOODS[Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) - 1] : null;
    return `${e.length} check-in${e.length === 1 ? '' : 's'}${avg ? ` · mostly ${avg.e} ${avg.n.toLowerCase()}` : ''}`;
  },

  card(el, ctx) {
    const draw = () => {
      const d = entry(dk());
      el.innerHTML = `<p class="muted">${d?.mood ? 'Thanks for checking in.' : 'How are you feeling?'}</p>${moodRow(dk())}
<div class="card-row"><span class="muted ital clip">${d?.text?.trim() ? esc(d.text.trim()) : esc(PROMPTS[d?.p ?? promptFor(dk())])}</span><button class="btn soft sm" data-write>${ic('edit')}${d?.text?.trim() ? 'Continue' : 'Write'}</button></div>`;
      bindMoods(el, dk(), () => { draw(); ctx.changed(); });
      $('[data-write]', el).onclick = () => go('journal');
    };
    draw();
  },

  view(el, ctx) {
    let k = dk();
    const draw = () => {
      const d = entry(k), p = d?.p ?? promptFor(k), tags = d?.tags || [];
      const past = lastDays(60).reverse().filter(x => x !== k && has(entry(x)));
      const strip = lastDays(14);
      el.innerHTML = header({ title: 'Journal', back: ctx.back, tool: 'journal' }) + `
${dayNav(k)}
<section class="card" style="--c:var(--c-journal)"><div class="card-h"><h3>How are you feeling?</h3></div>${moodRow(k)}
<div class="chips tags">${TAGS.map(t => `<button class="chip ${tags.includes(t) ? 'on' : ''}" data-tag="${t}">${t}</button>`).join('')}</div></section>
<section class="card" style="--c:var(--c-journal)">
  <div class="prompt"><span id="pt">${esc(PROMPTS[p])}</span><button class="icon-btn sm ghost" data-np aria-label="Different prompt">${ic('refresh')}</button></div>
  <textarea class="jtext" placeholder="Write a few lines…" maxlength="5000">${esc(d?.text || '')}</textarea>
  <div class="saved muted" id="saved"></div>
</section>
<section class="card"><div class="card-h"><h3>Last two weeks</h3></div><div class="mood-strip">${strip.map(x => { const m = entry(x)?.mood; return `<button data-k="${x}" class="${x === k ? 'sel' : ''}"><span>${m ? MOODS[m - 1].e : '·'}</span><small>${wd(x)}</small></button>`; }).join('')}</div></section>
${past.length ? `<h2 class="sec-t">Past entries</h2><div class="list">${past.map(x => { const e = entry(x); return `<button class="row link" data-k="${x}"><span class="em">${e.mood ? MOODS[e.mood - 1].e : '📝'}</span><div class="grow"><b>${dayLabel(x)}</b><small class="clip">${esc(e.text?.trim() || (e.tags || []).join(', ') || MOODS[e.mood - 1]?.n || '')}</small></div>${ic('chevR')}</button>`; }).join('')}</div>` : ''}`;
      bindMoods(el, k);
      $$('[data-tag]', el).forEach(b => b.onclick = () => {
        const e = ensure(k), t = b.dataset.tag;
        e.tags = e.tags.includes(t) ? e.tags.filter(x => x !== t) : [...e.tags, t]; save();
        b.classList.toggle('on', e.tags.includes(t));
      });
      const ta = $('.jtext', el), saved = $('#saved', el);
      const size = () => { ta.style.height = 'auto'; ta.style.height = Math.max(140, ta.scrollHeight) + 'px'; };
      requestAnimationFrame(size);
      let st;
      ta.oninput = () => { ensure(k).text = ta.value; save(); size(); saved.textContent = 'Saving…'; clearTimeout(st); st = setTimeout(() => { saved.textContent = 'Saved'; }, 500); };
      $('[data-np]', el).onclick = () => { const e = ensure(k); e.p = (e.p + 1) % PROMPTS.length; save(); $('#pt', el).textContent = PROMPTS[e.p]; };
      bindDayNav(el, k, x => { k = x; draw(); });
      $$('[data-k]', el).forEach(b => b.onclick = () => { k = b.dataset.k; draw(); scrollTo({ top: 0, behavior: 'smooth' }); });
    };
    draw();
  },
};
