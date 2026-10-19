// The later crags' looks (Phase 14.5b): Moonstone's desert, the Mesa's red rock, the Big
// Stone's valley, Wind River's snow, the Crucible's frost, the Cove's sea, the Bluff's farm and
// the Hollow's slot; the rock each is painted in, and what's at the foot of their walls. The full
// game's only: the demo's build takes scenes.demo.ts (build/demo.ts). scenes.ts calls
// laterScenes with its brushes.
import { lin, poly, rr, type G } from '../kit/geom';
import { GND, H, type CragSpec } from '../layout';
import type { Look, Palette, Rock, SceneMakers } from './scenes';

type Painter = (g: G, P: Palette, c: CragSpec, r: () => number) => void;

export function laterScenes({ fill, stroke }: SceneMakers): {
  looks: Record<string, Look>;
  trees: Record<string, [number, number][]>;
  talus: Record<string, [number, number, number][]>;
  rocks: Partial<Record<Rock, Painter>>;
  foot: (g: G, id: string, spec: CragSpec, P: Palette) => void;
  dress: (g: G, x: number, t: number) => void;
} {
  // Moonstone: a high desert noon. Pale sky, mesas gone violet with distance, sand, and
  // quartzite that's nearly white where the sun's on it.
  const DESERT: Palette = {
    sky: [
      [0, '#9CC3D9'],
      [0.6, '#E3E4D6'],
      [1, '#F3DDB8'],
    ],
    orb: '#FFF4DA',
    orbX: 96,
    orbY: 78,
    far2: '#C9A7A0',
    far: '#B38C84',
    mid: '#C9A77E',
    midTree: '#6E7A55',
    trees: '#5E6B48',
    ground: '#D8BE92',
    ground2: '#C9AC7F',
    track: '#BFA073',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#E4D8C6',
    wallShade: '#C2AE9C',
    wallDark: '#8E7666',
    talus: '#CDB58F',
  };

  // Psicobloc Cove: a summer coast. Bright sky, a blue-green sea, pale limestone streaked
  // orange and grey, and scrub on the headland.
  const COAST: Palette = {
    sky: [
      [0, '#6FB0DA'],
      [0.6, '#CFE6EE'],
      [1, '#F2EBD8'],
    ],
    orb: '#FFF6DA',
    orbX: 300,
    orbY: 64,
    far2: '#A9C8D6',
    far: '#8FB2C2',
    mid: '#9DAA78',
    midTree: '#5E7048',
    trees: '#4E6040',
    ground: '#E2D2AE',
    ground2: '#D4C29C',
    track: '#CDBB92',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#D8CFBE',
    wallShade: '#B7AD9C',
    wallDark: '#6E665C',
    talus: '#C9BFAA',
  };
  // The sea under the cove's shelf.
  const SEA = { deep: '#2F7C95', shallow: '#4FA3B4', foam: 'rgba(255,255,255,.7)' };

  // The Crucible: overcast and freezing. A flat grey sky, frost on the ground, and black
  // gneiss banded with pale quartz.
  const FRIGID: Palette = {
    sky: [
      [0, '#9AA6B2'],
      [0.6, '#C9CFD4'],
      [1, '#DCDEDC'],
    ],
    orb: '#EDEFEE',
    orbX: 280,
    orbY: 90,
    far2: '#AEB6BD',
    far: '#8C959E',
    mid: '#6E7672',
    midTree: '#39443E',
    trees: '#26302B',
    ground: '#B9BDB8',
    ground2: '#A6AAA5',
    track: '#9A9C96',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#4D4F55',
    wallShade: '#3A3C42',
    wallDark: '#1F2024',
    talus: '#7E8184',
  };

  // Wind River: high and cold. Deep blue sky, ranges gone white with snow, granite a shade
  // darker than the valley's, thin grass and a few stunted pines.
  const ALPINE: Palette = {
    sky: [
      [0, '#5E93C8'],
      [0.6, '#B8D2E4'],
      [1, '#E4ECEE'],
    ],
    orb: '#FFFBEF',
    orbX: 110,
    orbY: 64,
    far2: '#E6ECF0',
    far: '#B7C6D2',
    mid: '#7E8F72',
    midTree: '#3C5642',
    trees: '#2A4432',
    ground: '#8A9170',
    ground2: '#7A8262',
    track: '#9A9580',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#B9BDC0',
    wallShade: '#8E959C',
    wallDark: '#454C57',
    talus: '#A2A5A2',
  };

  // The Big Stone: a high valley in the shade of its own walls. Clean sky, bright granite,
  // a green meadow and big pines.
  const VALLEY: Palette = {
    sky: [
      [0, '#7FB2DA'],
      [0.6, '#CFE0E6'],
      [1, '#E8E6D6'],
    ],
    orb: '#FFF8E4',
    orbX: 90,
    orbY: 60,
    far2: '#9FB2C2',
    far: '#8196A8',
    mid: '#6F8B63',
    midTree: '#3F5E44',
    trees: '#2C4A34',
    ground: '#7C8F58',
    ground2: '#6C7F4C',
    track: '#8E8A6E',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#C9CCCB',
    wallShade: '#9EA4AA',
    wallDark: '#4A515B',
    talus: '#9A9C98',
  };

  // Sandstone Mesa: a desert morning, red rock gone orange where the sun's on it, varnish
  // black, and pale sand.
  const MESA: Palette = {
    sky: [
      [0, '#8FB9D6'],
      [0.6, '#E6DCC8'],
      [1, '#F1D6B0'],
    ],
    orb: '#FFF1D6',
    orbX: 300,
    orbY: 70,
    far2: '#D2A898',
    far: '#C28574',
    mid: '#D0A27A',
    midTree: '#6E7A55',
    trees: '#5E6B48',
    ground: '#D9B48A',
    ground2: '#C9A27A',
    track: '#C0976E',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#C8683E',
    wallShade: '#A5502F',
    wallDark: '#4A2A22',
    talus: '#C49A72',
  };

  // Phase 32.1: the Hollow, a slot canyon in shade all day: a pale strip of sky, canyon walls
  // gone purple-brown with distance, dark sand, and red sandstone that never sees the sun.
  const HOLLOW: Palette = {
    sky: [
      [0, '#AFC2CA'],
      [0.6, '#D8D2C4'],
      [1, '#E2CDB2'],
    ],
    orb: '#FFF3DE',
    orbX: 300,
    orbY: 60,
    far2: '#8E6A62',
    far: '#74504A',
    mid: '#6A4A3E',
    midTree: '#3E4A36',
    trees: '#36422E',
    ground: '#6A5444',
    ground2: '#5C483A',
    track: '#76604E',
    van: '#E6DCC4',
    trim: '#2F6F73',
    glass: '#6F8C98',
    wall: '#94543E',
    wallShade: '#764232',
    wallDark: '#3C2420',
    talus: '#7A5E4C',
  };

  // Quartzite: pale, hard and fractured square, with rust where water has run over it and a
  // darker shaded side on the spire.
  function quartzite(g: G, P: Palette, c: CragSpec, r: () => number): void {
    const [x0, x1] = c.wall;
    fill(
      g,
      (gg) =>
        poly(
          gg,
          [
            [x0 + 110, -20],
            [x1 + 30, -20],
            [x1 + 30, GND],
            [x0 + 170, GND],
          ],
          true,
        ),
      P.wallShade!,
    );
    // Fractures: long horizontals and short verticals, so the rock reads as blocks.
    g.strokeStyle = 'rgba(96,74,62,.4)';
    g.lineWidth = 1.6;
    for (let y = 40; y < GND; y += 46 + r() * 30) {
      g.beginPath();
      g.moveTo(x0, y);
      for (let x = x0; x <= x1 + 30; x += 30) g.lineTo(x, y + (r() - 0.5) * 6);
      g.stroke();
      for (let k = 0; k < 4; k++) {
        const vx = x0 + 20 + r() * (x1 - x0);
        g.beginPath();
        g.moveTo(vx, y);
        g.lineTo(vx + (r() - 0.5) * 6, y + 24 + r() * 20);
        g.stroke();
      }
    }
    for (let i = 0; i < 12; i++) {
      const x = x0 + 30 + r() * (x1 - x0 - 40);
      const len = 80 + r() * 200;
      const top = r() * 260;
      g.fillStyle = lin(g, 0, top, 0, top + len, [
        [0, 'rgba(176,96,52,.28)'],
        [1, 'rgba(176,96,52,0)'],
      ]);
      g.fillRect(x, top, 5 + r() * 10, len);
    }
  }

  // The Mesa's red desert sandstone: a flat rim of paler caprock, cross-bedding, black
  // varnish streaked down from the rim, and huecos.
  function redrock(g: G, P: Palette, c: CragSpec, r: () => number): void {
    const [x0, x1] = c.wall;
    fill(
      g,
      (gg) =>
        poly(
          gg,
          [
            [x0 + 260, -20],
            [x1 + 30, -20],
            [x1 + 30, GND],
            [x0 + 320, GND],
          ],
          true,
        ),
      P.wallShade!,
    );
    g.strokeStyle = 'rgba(90,40,26,.28)';
    g.lineWidth = 1.6;
    for (let y = 90; y < GND; y += 44 + r() * 34) {
      g.beginPath();
      for (let x = x0; x <= x1 + 30; x += 24) g.lineTo(x, y + Math.sin(x * 0.01 + y) * 12);
      g.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const x = x0 + 30 + r() * (x1 - x0 - 30);
      const len = 140 + r() * 320;
      g.fillStyle = lin(g, 0, 20, 0, 20 + len, [
        [0, 'rgba(40,22,20,.55)'],
        [1, 'rgba(40,22,20,0)'],
      ]);
      g.fillRect(x, 20, 6 + r() * 18, len);
    }
    g.fillStyle = 'rgba(70,30,20,.45)';
    for (let i = 0; i < 16; i++) {
      g.beginPath();
      g.ellipse(x0 + 40 + r() * (x1 - x0 - 60), 80 + r() * 380, 3 + r() * 6, 2 + r() * 4, 0, 0, 6.2832);
      g.fill();
    }
    // The caprock.
    g.fillStyle = '#D9906A';
    g.fillRect(x0 - 10, 6, x1 - x0 + 60, 20);
  }

  // The Crucible's gneiss: dark rock folded into pale wavy bands, quartz veins across them,
  // and frost in the cracks.
  function gneiss(g: G, P: Palette, c: CragSpec, r: () => number): void {
    const [x0, x1] = c.wall;
    fill(
      g,
      (gg) =>
        poly(
          gg,
          [
            [x0 + 300, -20],
            [x1 + 30, -20],
            [x1 + 30, GND],
            [x0 + 340, GND],
          ],
          true,
        ),
      P.wallShade!,
    );
    // The folds: long wavy bands, lighter and darker.
    for (let i = 0; i < 14; i++) {
      const y = -10 + i * 42 + r() * 12;
      g.strokeStyle = r() < 0.5 ? 'rgba(200,196,186,.28)' : 'rgba(10,10,14,.3)';
      g.lineWidth = 3 + r() * 6;
      g.beginPath();
      for (let x = x0; x <= x1 + 30; x += 18) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 22 + (x - x0) * 0.08);
      g.stroke();
    }
    g.strokeStyle = 'rgba(236,234,226,.55)';
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const x = x0 + 60 + r() * (x1 - x0 - 100);
      const y = 60 + r() * 360;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 40 + r() * 60, y + 30 + r() * 40);
      g.stroke();
    }
    g.fillStyle = 'rgba(236,240,242,.7)';
    for (let i = 0; i < 10; i++) {
      g.beginPath();
      g.ellipse(x0 + 40 + r() * (x1 - x0 - 60), 40 + r() * 460, 6 + r() * 12, 2 + r() * 2, 0, 0, 6.2832);
      g.fill();
    }
  }

  // The cove's limestone: pale and overhanging, with tufas hanging down it, orange and grey
  // streaks, and pockets.
  function limestone(g: G, P: Palette, c: CragSpec, r: () => number): void {
    const [x0, x1] = c.wall;
    const right = Math.min(x1, c.width) + 20;
    for (let i = 0; i < 22; i++) {
      const x = x0 + 30 + r() * (right - x0 - 40);
      const len = 160 + r() * 340;
      const orange = r() < 0.5;
      g.fillStyle = lin(g, 0, -10, 0, len, [
        [0, orange ? 'rgba(206,120,60,.32)' : 'rgba(60,64,70,.28)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      g.fillRect(x, -10, 6 + r() * 20, len);
    }
    // Tufas: long drips of rock, lit on one side.
    for (let i = 0; i < 9; i++) {
      const x = x0 + 60 + r() * (right - x0 - 100);
      const top = r() * 120;
      const len = 180 + r() * 220;
      fill(g, (gg) => rr(gg, x, top, 10 + r() * 8, len, 6), P.wallShade!);
      fill(g, (gg) => rr(gg, x + 2, top, 4, len - 8, 2), 'rgba(255,255,255,.3)');
    }
    g.fillStyle = 'rgba(60,54,48,.45)';
    for (let i = 0; i < 24; i++) {
      g.beginPath();
      g.ellipse(x0 + 40 + r() * (right - x0 - 60), 40 + r() * 420, 3 + r() * 6, 2 + r() * 4, 0, 0, 6.2832);
      g.fill();
    }
  }

  // Phase 32.1: the Hollow's headstones, between the traverse and the wall: worn grey stones,
  // two leaning, and a cross. Whoever climbed here climbed around them.
  function headstones(g: G): void {
    for (const [x, h, lean] of [
      [436, 26, 0],
      [462, 20, -0.12],
      [488, 24, 0.08],
      [516, 18, 0],
    ] as const) {
      g.save();
      g.translate(x, GND + 2);
      g.rotate(lean);
      fill(
        g,
        (gg) => {
          gg.moveTo(-7, 0);
          gg.lineTo(-7, -h);
          gg.quadraticCurveTo(0, -h - 9, 7, -h);
          gg.lineTo(7, 0);
          gg.closePath();
        },
        '#9C9A92',
      );
      g.restore();
    }
    fill(g, (gg) => gg.rect(530, GND - 30, 4, 32), '#8A877F');
    fill(g, (gg) => gg.rect(524, GND - 22, 16, 4), '#8A877F');
  }

  const looks: Record<string, Look> = {
    moon: { P: DESERT, seed: 23, rock: 'quartzite' },
    mesa: { P: MESA, seed: 29, rock: 'redrock' },
    stone: { P: VALLEY, seed: 31, rock: 'granite' },
    wind: { P: ALPINE, seed: 37, rock: 'granite' },
    crucible: { P: FRIGID, seed: 41, rock: 'gneiss' },
    cove: { P: COAST, seed: 43, rock: 'limestone', sea: true },
    // Phase 18.6: never climbed, so never chalked.
    bluff: { P: VALLEY, seed: 47, rock: 'limestone', bare: true },
    // Phase 32.1: nobody's climbed here either.
    hollow: { P: HOLLOW, seed: 53, rock: 'redrock', bare: true },
  };

  // Phase 20.3: Moonstone's crag day, in front of the van (x is the scene's left edge): bunting
  // from the van's roof to a pole, a folding table with the sign-up sheet, and the box of shoes
  // under it. Live, so it's up only on the day.
  const BUNT = ['#D8553F', '#F2C14E', '#2F6F73', '#F3E6CB'];
  function dress(g: G, x: number, t: number): void {
    const [ax, ay, bx, by] = [x + 206, GND - 98, x + 318, GND - 148];
    fill(g, (gg) => gg.rect(bx - 2, by, 4, GND - by), '#6B4A30');
    const at = (k: number): [number, number] => [
      ax + (bx - ax) * k,
      ay + (by - ay) * k + Math.sin(k * Math.PI) * 14,
    ];
    stroke(
      g,
      (gg) => {
        for (let i = 0; i <= 12; i++) gg.lineTo(...at(i / 12));
      },
      '#2B2A33',
      1.2,
    );
    for (let i = 0; i < 8; i++) {
      const [x1, y1] = at((i + 0.15) / 8);
      const [x2, y2] = at((i + 0.85) / 8);
      const sway = Math.sin(t * 2 + i) * 1.5;
      fill(
        g,
        (gg) =>
          poly(
            gg,
            [
              [x1, y1],
              [x2, y2],
              [(x1 + x2) / 2 + sway, Math.max(y1, y2) + 11],
            ],
            true,
          ),
        BUNT[i % 4]!,
      );
    }
    // The table: legs, top, the sheet and its pencil on a string; the box under it.
    for (const lx of [x + 126, x + 190]) fill(g, (gg) => gg.rect(lx, GND - 30, 3, 30), '#4A4A52');
    fill(g, (gg) => rr(gg, x + 118, GND - 34, 82, 6, 2), '#7C7466');
    fill(g, (gg) => gg.rect(x + 140, GND - 39, 22, 5), '#FFFDF5');
    stroke(g, (gg) => (gg.moveTo(x + 162, GND - 37), gg.lineTo(x + 168, GND - 24)), '#2B2A33', 0.8);
    fill(g, (gg) => gg.rect(x + 144, GND - 15, 30, 15), '#B07A4A');
    fill(g, (gg) => gg.rect(x + 142, GND - 17, 34, 4), '#8F5F36');
  }

  return {
    dress,
    looks,
    trees: {
      cove: [
        [20, 1],
        [250, 0.8],
      ],
      crucible: [
        [20, 120],
        [262, 100],
      ],
      wind: [
        [18, 130],
        [260, 110],
        [1250, 120],
      ],
      stone: [
        [16, 200],
        [96, 170],
        [260, 150],
      ],
      mesa: [
        [20, 1.1],
        [252, 0.8],
        [1230, 1],
        [1540, 1.2],
      ],
      hollow: [
        [24, 0.9],
        [250, 0.7],
      ],
      moon: [
        [16, 1.2],
        [262, 0.9],
        [1180, 1.1],
        [1370, 1.3],
      ],
    },
    talus: {
      crucible: [
        [620, 32, 14],
        [1180, 40, 18],
        [1460, 26, 12],
      ],
      wind: [
        [600, 34, 16],
        [800, 28, 12],
        [1150, 40, 18],
        [1450, 26, 12],
      ],
      stone: [
        [620, 30, 14],
        [860, 40, 18],
        [1040, 28, 12],
        [1340, 34, 16],
      ],
      mesa: [
        [410, 22, 10],
        [660, 30, 12],
        [1110, 26, 12],
        [1420, 24, 10],
      ],
      hollow: [
        [540, 26, 12],
        [1130, 30, 14],
        [1210, 22, 10],
      ],
      moon: [
        [446, 24, 10],
        [720, 30, 12],
        [1040, 22, 10],
        [1340, 26, 12],
      ],
    },
    rocks: { quartzite, redrock, gneiss, limestone },
    foot(g, id, spec, P) {
      const w = spec.width;
      // The cove: a rock shelf along the foot of the cliff, and the sea under it.
      if (looks[id]?.sea) {
        const x0 = spec.wall[0] - 80;
        g.fillStyle = lin(g, 0, GND + 4, 0, H, [
          [0, SEA.shallow],
          [1, SEA.deep],
        ]);
        g.fillRect(x0, GND + 4, w - x0 + 10, H - GND);
        g.strokeStyle = SEA.foam;
        g.lineWidth = 1.6;
        for (let y = GND + 18; y < H; y += 22) {
          g.beginPath();
          for (let x = x0; x <= w + 10; x += 14) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 3);
          g.stroke();
        }
        fill(g, (gg) => rr(gg, x0, GND - 8, w - x0 + 10, 14, 4), P.wallShade!);
        fill(g, (gg) => gg.rect(x0, GND - 8, w - x0 + 10, 3), 'rgba(255,255,255,.35)');
      }
      if (id === 'hollow') headstones(g);
    },
  };
}
