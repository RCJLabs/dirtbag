// A sound sheet for listening: every cue rendered offline, each with a player. Dev only:
// `npm run dev`, then /sounds.html. It is not part of the production build.
import type { Cue } from '../audio/cues';
import { VOICES } from '../audio/sound';

const RATE = 44100;
// How hard each cue plays here: a heavy breath and a full drive, the rest as they come.
const HARD: Partial<Record<Cue, number>> = { breath: 0.9 };

async function render(cue: Cue): Promise<Blob> {
  const ctx = new OfflineAudioContext(1, RATE * 2.4, RATE);
  const noise = ctx.createBuffer(1, RATE * 2, RATE);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  const v = { ctx, out, noise, t: 0.05 };
  if (cue === 'charge') {
    // The live charge follows your hold; here, a full one over a second.
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(170, 0.05);
    o.frequency.linearRampToValueAtTime(530, 1.05);
    g.gain.setValueAtTime(0.2, 0.05);
    g.gain.setTargetAtTime(0, 1.05, 0.02);
    o.connect(g).connect(out);
    o.start(0.05);
    o.stop(1.2);
  } else VOICES[cue](v, HARD[cue] ?? 1);
  return wav(await ctx.startRendering());
}

// 16-bit mono PCM in a WAV file.
function wav(b: AudioBuffer): Blob {
  const s = b.getChannelData(0);
  const buf = new DataView(new ArrayBuffer(44 + s.length * 2));
  const str = (o: number, t: string) => [...t].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  buf.setUint32(4, 36 + s.length * 2, true);
  str(8, 'WAVEfmt ');
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true);
  buf.setUint16(22, 1, true);
  buf.setUint32(24, b.sampleRate, true);
  buf.setUint32(28, b.sampleRate * 2, true);
  buf.setUint16(32, 2, true);
  buf.setUint16(34, 16, true);
  str(36, 'data');
  buf.setUint32(40, s.length * 2, true);
  s.forEach((x, i) => buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 0x7fff, true));
  return new Blob([buf], { type: 'audio/wav' });
}

const list = document.getElementById('list')!;
const rendered: Record<string, Blob> = {};
for (const cue of Object.keys(VOICES) as Cue[]) {
  const blob = await render(cue);
  rendered[cue] = blob;
  const li = document.createElement('li');
  li.textContent = cue;
  const a = document.createElement('audio');
  a.controls = true;
  a.src = URL.createObjectURL(blob);
  li.append(a);
  list.append(li);
}
// For a script to save them all.
(window as unknown as { sounds: Record<string, Blob> }).sounds = rendered;
document.body.dataset.ready = 'yes';
