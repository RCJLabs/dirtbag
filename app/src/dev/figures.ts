// A character sheet for art work: every figure in every pose, large, on flat ground and on
// the scene colours they're seen against. Dev only: `npm run dev`, then /figures.html. It is
// not part of the production build.
import { drawClimber, drawDog, drawPerson, LOOK, type Pose } from '../view/paint/people';

const SCALE = 4;
const cv = document.getElementById('sheet') as HTMLCanvasElement;
const cols = 7;
const cellW = 70;
const cellH = 96;
const rows = 6;
cv.width = cols * cellW * SCALE;
cv.height = rows * cellH * SCALE;
cv.style.width = `${cols * cellW * 2}px`;
const g = cv.getContext('2d')!;
g.scale(SCALE, SCALE);

const BGS = ['#C49E78', '#2A2935', '#6B5A48', '#CBC3B3', '#E9E4D8'];
function cell(c: number, r: number, bg: string) {
  g.fillStyle = bg;
  g.fillRect(c * cellW, r * cellH, cellW, cellH);
}

const poses: { pose: Pose; phase?: number; speed?: number; dir?: number }[] = [
  { pose: 'stand' },
  { pose: 'stand', dir: -1 },
  { pose: 'walk', phase: 0, speed: 1 },
  { pose: 'walk', phase: Math.PI / 2, speed: 1 },
  { pose: 'walk', phase: Math.PI, speed: 1 },
  { pose: 'mug', dir: -1 },
  { pose: 'belay', dir: -1 },
];
['you', 'hazel', 'sage'].forEach((who, r) => {
  poses.forEach((p, c) => {
    cell(c, r, BGS[(c + r) % 2 ? 1 : 0]!);
    drawPerson(g, LOOK[who]!, {
      x: c * cellW + 35,
      y: r * cellH + 86,
      dir: p.dir ?? 1,
      phase: p.phase ?? 0,
      speed: p.speed ?? 0,
      pose: p.pose,
      t: 0,
    });
  });
});
// Climber on rock, back view: strides and a fall.
[-1, -0.5, 0, 0.5, 1].forEach((a, c) => {
  cell(c, 3, BGS[3]!);
  drawClimber(g, LOOK.you!, c * cellW + 35, 3 * cellH + 60, a, false);
});
cell(5, 3, BGS[3]!);
drawClimber(g, LOOK.you!, 5 * cellW + 35, 3 * cellH + 60, 0, true);
cell(6, 3, BGS[2]!);
drawClimber(g, LOOK.sage!, 6 * cellW + 35, 3 * cellH + 60, 0.3, false);
// Scout, still and wagging.
[0, 1].forEach((wag, c) => {
  cell(c, 4, BGS[c ? 1 : 0]!);
  drawDog(g, c * cellW + 35, 4 * cellH + 70, 1, 0.4, wag);
});
// Big close-ups of the heads.
g.save();
g.translate(2 * cellW, 4 * cellH);
cell(0, 0, BGS[4]!);
g.restore();
for (const [i, who] of ['you', 'hazel', 'sage'].entries()) {
  g.save();
  g.translate((2 + i * 2) * cellW + 10, 4 * cellH + 150);
  g.scale(2.4, 2.4);
  drawPerson(g, LOOK[who]!, { x: 12, y: 0, dir: 1, pose: 'stand', t: 0 });
  g.restore();
}
