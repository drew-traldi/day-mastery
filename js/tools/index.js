// Every tool, plus the day score that grows the plant.
// A tool is { id, name, icon, blurb, card(el, ctx), view(el, ctx), score?(dayKey) -> 0..1 or null, summary?(days) }.
import { S } from '../store.js';
import plan from './plan.js';
import focus from './focus.js';
import habits from './habits.js';
import hydrate from './hydrate.js';
import breathe from './breathe.js';
import sleep from './sleep.js';
import journal from './journal.js';
import sounds from './sounds.js';

export const TOOLS = { plan, focus, habits, hydrate, breathe, sleep, journal, sounds };
export const isOn = id => !!(TOOLS[id] && S.settings.tools[id]?.on);
export const enabledIds = () => S.settings.order.filter(isOn);
export const counted = () => enabledIds().filter(id => TOOLS[id].score && S.settings.tools[id].count);

// The day score is the average of each counted tool's progress toward its goal.
export function dayScore(k) {
  const v = counted().map(id => TOOLS[id].score(k)).filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
