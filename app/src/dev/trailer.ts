// Phase 15.4: the trailer's beats, a click each (beats.ts). Dev only: `npm run dev`, then
// /trailer.html. Loading a beat keeps whatever save was here first, once, under a key of its
// own, and the last button puts it back.
import fixture from '../sim/fixtures/save-v75.json?raw';
import { fromSave, toSave } from '../sim';
import { BEATS } from './beats';

const SAVE = 'dirtbag.save';
const KEPT = 'dirtbag.trailer.kept';
const loaded = fromSave(fixture);
if (!loaded.ok) throw new Error(`the fixture won't load: ${loaded.why}`);
const base = { ...loaded.state, climber: { ...loaded.state.climber, name: 'Robin' } };

const list = document.getElementById('beats')!;
for (const b of BEATS) {
  const li = document.createElement('li');
  const go = document.createElement('button');
  go.type = 'button';
  go.textContent = b.name;
  go.addEventListener('click', () => {
    if (localStorage.getItem(KEPT) === null) localStorage.setItem(KEPT, localStorage.getItem(SAVE) ?? '');
    localStorage.setItem(SAVE, toSave(b.make(base), __APP_VERSION__));
    location.href = '/';
  });
  const play = document.createElement('span');
  play.className = 'play';
  play.textContent = b.play;
  li.append(go, play);
  list.append(li);
}

document.getElementById('restore')!.addEventListener('click', () => {
  const kept = localStorage.getItem(KEPT);
  if (kept === null) {
    document.getElementById('said')!.textContent = 'Nothing kept: no beat has been loaded.';
    return;
  }
  if (kept) localStorage.setItem(SAVE, kept);
  else localStorage.removeItem(SAVE);
  localStorage.removeItem(KEPT);
  document.getElementById('said')!.textContent = 'Your save is back.';
});
