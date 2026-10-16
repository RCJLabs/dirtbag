// The later crags' close-up walls (Phase 14.5b): Moonstone's spire, the Mesa, the Big Stone,
// Wind River, the Crucible, the Cove, Miller's Bluff and the Hollow, each face-on with its lines'
// topos. The full game's only: the demo's build takes wall.demo.ts (build/demo.ts).
import { lin, poly, trace, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { coniferPath, rock } from '../shapes';

// What the later walls are painted with that Roadside's are too: where the rock meets the
// talus, the trees at its foot, and the talus itself.
export interface WallMakers {
  BASE_Y: number;
  CRAG_TREES: [number, number, number][];
  TALUS: [number, number, number, number][];
}

export function laterWalls({ BASE_Y, CRAG_TREES, TALUS }: WallMakers): {
  topos: Record<string, Pt[]>;
  paint: Record<string, (g: G) => void>;
  faces: Record<string, Pt[]>;
} {
  const topos: Record<string, Pt[]> = {
    // Moonstone's spire: the Desert Spire up its face, Moonlight Arête up its right edge.
    mspire: [
      [128, 538],
      [122, 470],
      [134, 400],
      [128, 330],
      [140, 262],
      [150, 196],
      [162, 130],
      [178, 86],
    ],
    mmoon: [
      [302, 538],
      [294, 470],
      [286, 400],
      [278, 330],
      [266, 262],
      [252, 196],
      [238, 132],
      [222, 86],
    ],
    // Sandstone Mesa's wall: Desert Lap up the varnish on the left, Desert Enduro the full
    sdlap: [
      [60, 538],
      [54, 470],
      [66, 404],
      [58, 336],
      [70, 268],
      [64, 200],
      [70, 168],
    ],
    senduro: [
      [140, 540],
      [146, 470],
      [134, 400],
      [150, 330],
      [140, 260],
      [152, 190],
      [144, 120],
    ],
    sbiglink: [
      [222, 540],
      [216, 470],
      [228, 414],
      [212, 382],
      [226, 352],
      [218, 280],
      [230, 200],
      [222, 112],
    ],
    sdtrad: [
      [302, 540],
      [298, 470],
      [304, 400],
      [296, 330],
      [302, 262],
      [312, 196],
      [306, 124],
    ],
    // the corner. Both go most of the way up the close-up: the wall above goes on for days.
    // The Apron (Phase 27.6) stops lower, up the slab between them and through the water
    // streak near its top.
    // The Big Stone: Valley Classic up the steep face through its roof, the Trad Pitch up
    bclassic: [
      [96, 540],
      [102, 470],
      [90, 400],
      [104, 344],
      [96, 290],
      [108, 220],
      [100, 150],
      [106, 80],
    ],
    btrad: [
      [256, 540],
      [250, 470],
      [258, 400],
      [252, 330],
      [262, 260],
      [256, 190],
      [264, 120],
      [258, 70],
    ],
    bapron: [
      [186, 540],
      [180, 482],
      [192, 424],
      [184, 366],
      [196, 308],
      [190, 252],
      [196, 204],
    ],
    // Astroman up the crack, and Alpine Trad up the corner at the right.
    // Wind River: Glacier Point up the left, Skyline Traverse out right along the band,
    wglacier: [
      [58, 540],
      [52, 470],
      [64, 400],
      [56, 330],
      [66, 260],
      [60, 190],
      [66, 134],
    ],
    wskyline: [
      [128, 540],
      [134, 470],
      [124, 410],
      [150, 372],
      [180, 350],
      [196, 290],
      [188, 220],
      [196, 124],
    ],
    wastroman: [
      [232, 540],
      [228, 470],
      [236, 400],
      [228, 330],
      [236, 270],
      [230, 200],
      [238, 116],
    ],
    wtrad: [
      [310, 540],
      [304, 470],
      [312, 400],
      [306, 330],
      [314, 260],
      [308, 190],
      [314, 122],
    ],
    // edges, the black corner up its seam to the roof, and the leaning wall on the right.
    // Phase 32.1: the Hollow's wall: the split up its crack on the left, the sunless wall's
    hsplit: [
      [62, 540],
      [58, 470],
      [64, 400],
      [56, 330],
      [62, 262],
      [58, 190],
      [62, 128],
    ],
    hwall: [
      [142, 540],
      [148, 470],
      [138, 400],
      [150, 330],
      [140, 260],
      [148, 190],
      [142, 128],
    ],
    hcorner: [
      [222, 540],
      [218, 470],
      [224, 400],
      [216, 330],
      [222, 262],
      [214, 214],
      [232, 196],
      [228, 128],
    ],
    hlean: [
      [302, 540],
      [306, 470],
      [296, 404],
      [310, 340],
      [300, 270],
      [308, 200],
      [302, 124],
    ],
    // middle, and the myth up the right, where nobody has chalked anything.
    // The Crucible: Crucible Crux on the left, The Lifeline up its seam, Threshold up the
    ccrux: [
      [56, 540],
      [62, 470],
      [52, 400],
      [64, 330],
      [56, 260],
      [64, 190],
      [58, 140],
    ],
    clifeline: [
      [138, 540],
      [134, 470],
      [140, 400],
      [134, 330],
      [140, 260],
      [134, 190],
      [140, 118],
    ],
    cthreshold: [
      [220, 540],
      [226, 470],
      [214, 400],
      [228, 330],
      [218, 260],
      [230, 190],
      [222, 108],
    ],
    cmyth: [
      [300, 540],
      [294, 470],
      [306, 400],
      [296, 330],
      [308, 260],
      [300, 190],
      [308, 104],
    ],
    // then higher and higher to the Deep End out at the point.
    // Psicobloc Cove, left to right, each as tall as it is: the traverse along the waterline,
    ptide: [
      [14, 528],
      [30, 520],
      [46, 526],
      [62, 516],
      [78, 522],
    ],
    pplunge: [
      [70, 532],
      [66, 480],
      [74, 420],
      [70, 366],
    ],
    pslab: [
      [112, 532],
      [108, 470],
      [116, 404],
      [110, 342],
    ],
    pbarnacle: [
      [152, 532],
      [158, 470],
      [150, 400],
      [158, 318],
    ],
    pleap: [
      [192, 532],
      [188, 460],
      [196, 390],
      [186, 340],
      [200, 286],
    ],
    poverhang: [
      [234, 532],
      [240, 470],
      [228, 420],
      [242, 360],
      [236, 302],
    ],
    parete: [
      [276, 532],
      [272, 460],
      [280, 380],
      [274, 300],
      [280, 238],
    ],
    pdeep: [
      [318, 532],
      [324, 450],
      [314, 360],
      [324, 270],
      [318, 182],
    ],
  };

  // Moonstone's spire, face-on: a quartzite tower against a desert sky, square-fractured and
  // rust-streaked, with sand and scrub at its foot.
  const M_WALL: Pt[] = [
    [30, BASE_Y],
    [44, 420],
    [70, 300],
    [92, 190],
    [118, 110],
    [150, 70],
    [190, 56],
    [226, 70],
    [252, 110],
    [274, 200],
    [298, 320],
    [320, 440],
    [338, BASE_Y],
  ];

  // Phase 32.1: the Hollow, red sandstone in a slot canyon: a strip of sky between the rims,
  // the wall in shade all day, old water streaks, the split and the black corner's seam.
  const H_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 84],
    [70, 92],
    [150, 78],
    [230, 90],
    [300, 74],
    [364, 86],
    [364, BASE_Y],
  ];

  function paintHollow(g: G): void {
    g.fillStyle = lin(g, 0, 0, 0, 100, [
      [0, '#B8C9CF'],
      [1, '#E6D7C2'],
    ]);
    g.fillRect(0, 0, W, H);
    const r = mulberry32(173);
    g.save();
    g.beginPath();
    poly(g, H_WALL, true);
    g.clip();
    g.fillStyle = lin(g, 0, 80, 0, BASE_Y, [
      [0, '#9A5A44'],
      [1, '#6E3C30'],
    ]);
    g.fillRect(0, 0, W, H);
    // Bedding, and the water's streaks down it from the rim.
    g.strokeStyle = 'rgba(50,24,18,.3)';
    g.lineWidth = 1.2;
    for (let y = 130; y < BASE_Y; y += 34 + r() * 26) {
      g.beginPath();
      g.moveTo(-4, y);
      for (let x = 0; x <= W + 8; x += 24) g.lineTo(x, y + Math.sin(x * 0.02 + y) * 6);
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      g.fillStyle = lin(g, 0, 88, 0, 400, [
        [0, 'rgba(30,16,14,.5)'],
        [1, 'rgba(30,16,14,0)'],
      ]);
      g.fillRect(r() * W, 88, 4 + r() * 12, 160 + r() * 240);
    }
    // The split, and the black corner's seam with its pale side and the roof above it.
    g.strokeStyle = 'rgba(24,12,10,.8)';
    g.lineWidth = 2.6;
    for (const pts of [topos.hsplit!, topos.hcorner!.slice(0, 5)]) {
      g.beginPath();
      trace(
        g,
        pts.map(([x, y]) => [x + 6, y]),
        false,
      );
      g.stroke();
    }
    g.fillStyle = 'rgba(255,214,190,.12)';
    g.fillRect(234, 214, 60, BASE_Y - 214);
    g.fillStyle = 'rgba(30,14,12,.55)';
    g.fillRect(200, 196, 70, 14);
    // The rim, where the light gets in.
    g.fillStyle = '#B87458';
    g.fillRect(-4, 76, W + 8, 14);
    g.restore();
    g.fillStyle = '#5E4A3C';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#4C3A2E';
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      rock(g, r() * W, BASE_Y + 20 + r() * 160, 10 + r() * 18, 5 + r() * 7);
      g.fill();
    }
    // A headstone at the foot of the wall, the name worn off.
    g.fillStyle = '#9A9A92';
    g.beginPath();
    g.moveTo(330, BASE_Y + 6);
    g.lineTo(330, BASE_Y - 22);
    g.quadraticCurveTo(342, BASE_Y - 34, 354, BASE_Y - 22);
    g.lineTo(354, BASE_Y + 6);
    g.closePath();
    g.fill();
  }

  // Psicobloc Cove: a limestone sea cliff, tufas hanging down it, orange and grey streaks,
  // scrub along its top, and the sea at its foot.
  const P_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 170],
    [60, 160],
    [140, 168],
    [220, 150],
    [300, 160],
    [364, 146],
    [364, BASE_Y],
  ];

  function paintCove(g: G): void {
    const r = mulberry32(201);
    g.fillStyle = lin(g, 0, 0, 0, 170, [
      [0, '#6FB0DA'],
      [1, '#F2EBD8'],
    ]);
    g.fillRect(0, 0, W, H);
    g.save();
    g.beginPath();
    poly(g, P_WALL, true);
    g.clip();
    g.fillStyle = '#D8CFBE';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const x = r() * W;
      const len = 120 + r() * 300;
      const orange = r() < 0.5;
      g.fillStyle = lin(g, 0, 150, 0, 150 + len, [
        [0, orange ? 'rgba(206,120,60,.35)' : 'rgba(60,64,70,.3)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      g.fillRect(x, 150, 5 + r() * 14, len);
    }
    g.fillStyle = '#B7AD9C';
    for (let i = 0; i < 7; i++) {
      const x = 20 + r() * 320;
      const top = 170 + r() * 60;
      const len = 120 + r() * 160;
      g.fillRect(x, top, 7 + r() * 6, len);
    }
    g.fillStyle = 'rgba(60,54,48,.45)';
    for (let i = 0; i < 20; i++) {
      g.beginPath();
      g.ellipse(r() * W, 200 + r() * 320, 2 + r() * 4, 1.5 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }
    // Overhanging Tide's roof.
    g.fillStyle = 'rgba(70,62,54,.55)';
    g.fillRect(216, 412, 44, 10);
    g.restore();
    g.fillStyle = '#5E7048';
    for (let x = -4; x < W + 8; x += 18 + r() * 14) {
      g.beginPath();
      g.ellipse(x, 158 + r() * 8, 10 + r() * 8, 6 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }
    // The sea.
    g.fillStyle = lin(g, 0, BASE_Y, 0, H, [
      [0, '#4FA3B4'],
      [1, '#2F7C95'],
    ]);
    g.fillRect(-4, BASE_Y - 4, W + 8, H - BASE_Y + 8);
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 1.4;
    for (let y = BASE_Y + 6; y < H; y += 20) {
      g.beginPath();
      for (let x = -4; x <= W + 8; x += 12) g.lineTo(x, y + Math.sin(x * 0.06 + y) * 3);
      g.stroke();
    }
  }

  // Miller's Bluff (Phase 25.7): grey limestone on the back of a farm, bedded flat and never
  // chalked, with water streaks down it, the tufa, the cow corner, the pillar and the big
  // roof where its lines say they are; the field and a fence at its foot.
  const BL_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 142],
    [70, 128],
    [130, 134],
    [190, 112],
    [250, 116],
    [300, 104],
    [364, 76],
    [364, BASE_Y],
  ];

  function paintBluff(g: G): void {
    const r = mulberry32(223);
    g.fillStyle = lin(g, 0, 0, 0, 160, [
      [0, '#8FC0E0'],
      [1, '#EAF0E6'],
    ]);
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#9DB07A';
    g.beginPath();
    trace(
      g,
      [
        [-4, 150],
        [90, 134],
        [200, 146],
        [300, 128],
        [364, 140],
      ],
      false,
    );
    g.lineTo(364, 220);
    g.lineTo(-4, 220);
    g.closePath();
    g.fill();
    g.save();
    g.beginPath();
    poly(g, BL_WALL, true);
    g.clip();
    g.fillStyle = '#BDB9B0';
    g.fillRect(0, 0, W, H);
    // Bedding, flat across the face, and the water's streaks down it.
    g.strokeStyle = 'rgba(70,68,64,.28)';
    g.lineWidth = 1.2;
    for (let y = 150; y < BASE_Y; y += 26 + r() * 22) {
      g.beginPath();
      for (let x = -4; x <= W + 8; x += 24) g.lineTo(x, y + (r() - 0.5) * 3);
      g.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const x = r() * W;
      g.fillStyle = lin(g, 0, 120, 0, 120 + 200 + r() * 260, [
        [0, r() < 0.6 ? 'rgba(52,52,58,.3)' : 'rgba(170,120,70,.25)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      g.fillRect(x, 120, 4 + r() * 10, 460);
    }
    // The tufa: a drip of wax down the middle of the wall.
    g.fillStyle = '#D9D4C8';
    g.beginPath();
    g.ellipse(112, 330, 9, 190, 0, 0, 6.2832);
    g.fill();
    g.fillStyle = 'rgba(60,58,54,.3)';
    g.fillRect(118, 150, 4, 360);
    // The corner the cows shelter in, and its groove leaning out at the top.
    g.fillStyle = 'rgba(48,48,54,.35)';
    g.beginPath();
    poly(
      g,
      [
        [146, BASE_Y],
        [170, BASE_Y],
        [176, 220],
        [196, 120],
        [184, 120],
        [160, 220],
      ],
      true,
    );
    g.fill();
    // The pillar, stood off the wall, sharp on both edges.
    g.fillStyle = '#CFCBC1';
    g.fillRect(204, 104, 30, 436);
    g.fillStyle = 'rgba(40,40,46,.45)';
    g.fillRect(234, 104, 5, 436);
    g.fillStyle = 'rgba(255,255,255,.18)';
    g.fillRect(204, 104, 3, 436);
    // The big roof, a third of the way up: its lip, and the dark under it.
    g.fillStyle = '#3F3E44';
    g.beginPath();
    poly(
      g,
      [
        [256, 384],
        [320, 376],
        [320, 398],
        [262, 402],
      ],
      true,
    );
    g.fill();
    g.fillStyle = '#E3DFD5';
    g.fillRect(256, 372, 66, 6);
    // Pockets, here and there, nobody's chalk in them.
    g.fillStyle = 'rgba(46,44,42,.5)';
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      g.ellipse(r() * W, 160 + r() * 360, 1.5 + r() * 3, 1 + r() * 2, 0, 0, 6.2832);
      g.fill();
    }
    g.restore();
    // The field, a fence, and a hay bale.
    g.fillStyle = '#7E9A52';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.strokeStyle = '#6A5640';
    g.lineWidth = 3;
    for (let x = 10; x < W; x += 58) {
      g.beginPath();
      g.moveTo(x, BASE_Y + 46);
      g.lineTo(x, BASE_Y + 18);
      g.stroke();
    }
    g.lineWidth = 1.4;
    for (const y of [BASE_Y + 24, BASE_Y + 36]) {
      g.beginPath();
      g.moveTo(-4, y);
      g.lineTo(W + 4, y);
      g.stroke();
    }
    g.fillStyle = '#D8B25C';
    g.beginPath();
    g.ellipse(326, BASE_Y + 64, 26, 18, 0, 0, 6.2832);
    g.fill();
  }

  // The Crucible: a black gneiss face under a grey sky, folded into pale bands, frost in
  // its cracks, and a thin seam up the Lifeline.
  const C_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 120],
    [80, 112],
    [150, 118],
    [230, 100],
    [300, 108],
    [364, 96],
    [364, BASE_Y],
  ];

  function paintCrucible(g: G): void {
    const r = mulberry32(191);
    g.fillStyle = lin(g, 0, 0, 0, 130, [
      [0, '#9AA6B2'],
      [1, '#DCDEDC'],
    ]);
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#8C959E';
    g.beginPath();
    g.moveTo(-4, 130);
    for (let x = 0; x <= W + 8; x += 24) g.lineTo(x, 96 + Math.sin(x * 0.03) * 10 + r() * 6);
    g.lineTo(W + 4, 130);
    g.closePath();
    g.fill();
    g.save();
    g.beginPath();
    poly(g, C_WALL, true);
    g.clip();
    g.fillStyle = '#4D4F55';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      const y = 100 + i * 40 + r() * 10;
      g.strokeStyle = r() < 0.5 ? 'rgba(200,196,186,.26)' : 'rgba(10,10,14,.3)';
      g.lineWidth = 3 + r() * 5;
      g.beginPath();
      for (let x = -4; x <= W + 8; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 12 + x * 0.06);
      g.stroke();
    }
    g.strokeStyle = 'rgba(236,234,226,.5)';
    g.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      const x = r() * W;
      const y = 140 + r() * 360;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 30 + r() * 40, y + 20 + r() * 30);
      g.stroke();
    }
    // The Lifeline's seam.
    g.strokeStyle = 'rgba(8,8,10,.75)';
    g.lineWidth = 1.6;
    g.beginPath();
    trace(
      g,
      [
        [146, 540],
        [142, 420],
        [148, 300],
        [142, 180],
        [146, 118],
      ],
      false,
    );
    g.stroke();
    g.fillStyle = 'rgba(236,240,242,.75)';
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.ellipse(r() * W, 130 + r() * 380, 5 + r() * 10, 1.5 + r() * 2, 0, 0, 6.2832);
      g.fill();
    }
    g.restore();

    g.fillStyle = '#B9BDB8';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#7E8184';
    for (const t of TALUS) {
      g.beginPath();
      rock(g, ...t);
      g.fill();
    }
    g.fillStyle = '#26302B';
    for (const [tx, ty, sc] of CRAG_TREES) {
      g.beginPath();
      coniferPath(g, tx, ty, sc * 0.7);
      g.fill();
    }
  }

  // Wind River: an alpine face with its top against the sky, snow on the ranges behind, a
  // crack up the middle and a corner at the right.
  const R_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 128],
    [60, 116],
    [110, 124],
    [170, 102],
    [230, 110],
    [290, 96],
    [364, 112],
    [364, BASE_Y],
  ];

  function paintWind(g: G): void {
    const r = mulberry32(181);
    g.fillStyle = lin(g, 0, 0, 0, 140, [
      [0, '#5E93C8'],
      [1, '#E4ECEE'],
    ]);
    g.fillRect(0, 0, W, H);
    // The ranges behind, snow on their tops.
    g.fillStyle = '#B7C6D2';
    g.beginPath();
    g.moveTo(-4, 140);
    for (const [x, y] of [
      [30, 74],
      [70, 96],
      [120, 58],
      [170, 90],
      [220, 66],
      [280, 98],
      [330, 70],
      [368, 90],
    ] as const)
      g.lineTo(x, y);
    g.lineTo(368, 140);
    g.closePath();
    g.fill();
    g.fillStyle = '#EEF2F4';
    for (const [x, y] of [
      [30, 74],
      [120, 58],
      [220, 66],
      [330, 70],
    ] as const) {
      g.beginPath();
      g.moveTo(x - 14, y + 12);
      g.lineTo(x, y);
      g.lineTo(x + 14, y + 12);
      g.closePath();
      g.fill();
    }
    g.save();
    g.beginPath();
    poly(g, R_WALL, true);
    g.clip();
    g.fillStyle = '#B9BDC0';
    g.fillRect(0, 0, W, H);
    // The corner at the right, and its shaded side.
    g.fillStyle = '#8E959C';
    g.beginPath();
    g.moveTo(318, 0);
    g.lineTo(W + 4, 0);
    g.lineTo(W + 4, BASE_Y);
    g.lineTo(312, BASE_Y);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(34,38,46,.7)';
    g.lineWidth = 2.4;
    for (const pts of [
      [
        [238, 110],
        [232, 250],
        [238, 400],
        [232, 540],
      ],
      [
        [318, 96],
        [312, 300],
        [318, 540],
      ],
    ] as Pt[][]) {
      g.beginPath();
      trace(g, pts, false);
      g.stroke();
    }
    // The band Skyline Traverse follows.
    g.strokeStyle = 'rgba(255,255,255,.45)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(110, 382);
    g.lineTo(210, 356);
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const x = r() * W;
      const len = 140 + r() * 300;
      g.fillStyle = lin(g, 0, 100, 0, 100 + len, [
        [0, 'rgba(34,38,46,.3)'],
        [1, 'rgba(34,38,46,0)'],
      ]);
      g.fillRect(x, 100, 4 + r() * 9, len);
    }
    g.fillStyle = 'rgba(160,176,120,.35)';
    for (let i = 0; i < 24; i++) {
      g.beginPath();
      g.ellipse(r() * W, 140 + r() * 380, 2 + r() * 5, 1.5 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }
    // Snow lying in the cracks near the top.
    g.fillStyle = 'rgba(245,248,250,.85)';
    for (const [x, y] of [
      [60, 130],
      [175, 118],
      [300, 116],
    ] as const) {
      g.beginPath();
      g.ellipse(x, y, 14, 4, 0, 0, 6.2832);
      g.fill();
    }
    g.restore();

    g.fillStyle = '#8A9170';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#A2A5A2';
    for (const t of TALUS) {
      g.beginPath();
      rock(g, ...t);
      g.fill();
    }
    g.fillStyle = '#2A4432';
    for (const [tx, ty, sc] of CRAG_TREES) {
      g.beginPath();
      coniferPath(g, tx, ty, sc * 0.8);
      g.fill();
    }
  }

  // The Big Stone: a granite face with no top in sight, a corner right of centre, a roof,
  // and black streaks down it.
  const B_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, -4],
    [364, -4],
    [364, BASE_Y],
  ];

  function paintStone(g: G): void {
    const r = mulberry32(171);
    g.fillStyle = '#C9CCCB';
    g.fillRect(0, 0, W, H);
    // The corner: the shaded wall right of it, and the crack in its back.
    g.fillStyle = '#9EA4AA';
    g.beginPath();
    g.moveTo(262, -4);
    g.lineTo(W + 4, -4);
    g.lineTo(W + 4, BASE_Y);
    g.lineTo(254, BASE_Y);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(34,38,46,.7)';
    g.lineWidth = 2.6;
    g.beginPath();
    trace(
      g,
      [
        [262, -4],
        [256, 120],
        [262, 260],
        [254, 400],
        [260, 540],
      ],
      false,
    );
    g.stroke();
    // Panels and exfoliating sheets.
    g.strokeStyle = 'rgba(34,38,46,.35)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      const cx = 20 + r() * 220;
      const cy = 60 + r() * 380;
      const rad = 40 + r() * 50;
      g.beginPath();
      g.arc(cx, cy + rad, rad, Math.PI * 1.25, Math.PI * 1.6);
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = r() * W;
      const len = 160 + r() * 320;
      g.fillStyle = lin(g, 0, 0, 0, len, [
        [0, 'rgba(34,38,46,.3)'],
        [1, 'rgba(34,38,46,0)'],
      ]);
      g.fillRect(x, -4, 4 + r() * 10, len);
    }
    // Valley Classic's roof, where its first crux is.
    g.fillStyle = '#4A515B';
    g.beginPath();
    g.moveTo(52, 382);
    g.lineTo(150, 374);
    g.lineTo(150, 394);
    g.lineTo(60, 402);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(52, 382);
    g.lineTo(150, 374);
    g.stroke();
    // The Apron's water streak (Phase 27.6), dark down the slab where its second crux is.
    g.fillStyle = lin(g, 0, 210, 0, 340, [
      [0, 'rgba(58,62,70,.45)'],
      [1, 'rgba(58,62,70,0)'],
    ]);
    g.beginPath();
    g.moveTo(186, 214);
    g.lineTo(204, 212);
    g.lineTo(210, 340);
    g.lineTo(184, 342);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(150,172,112,.35)';
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.ellipse(r() * W, 40 + r() * 480, 2 + r() * 6, 1.5 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }

    g.fillStyle = '#7C8F58';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#9A9C98';
    for (const t of TALUS) {
      g.beginPath();
      rock(g, ...t);
      g.fill();
    }
    g.fillStyle = '#2C4A34';
    for (const [tx, ty, sc] of CRAG_TREES) {
      g.beginPath();
      coniferPath(g, tx, ty, sc * 1.3);
      g.fill();
    }
  }

  // Sandstone Mesa: a flat-topped red wall, varnish streaked down it from the rim.
  const S_WALL: Pt[] = [
    [-4, BASE_Y],
    [-4, 104],
    [60, 98],
    [120, 101],
    [180, 94],
    [240, 99],
    [300, 92],
    [364, 97],
    [364, BASE_Y],
  ];

  function paintMesa(g: G): void {
    g.fillStyle = lin(g, 0, 0, 0, 120, [
      [0, '#8FB9D6'],
      [1, '#F1D6B0'],
    ]);
    g.fillRect(0, 0, W, H);
    // Another mesa, far off across the flats.
    g.fillStyle = '#C7968A';
    g.beginPath();
    g.moveTo(-4, 118);
    g.lineTo(-4, 84);
    g.lineTo(90, 84);
    g.lineTo(104, 118);
    g.closePath();
    g.fill();
    const r = mulberry32(151);
    g.save();
    g.beginPath();
    poly(g, S_WALL, true);
    g.clip();
    g.fillStyle = lin(g, 0, 90, 0, BASE_Y, [
      [0, '#C8683E'],
      [1, '#B45A38'],
    ]);
    g.fillRect(0, 0, W, H);
    // Cross-bedding: long shallow curves, the old dunes this was.
    g.strokeStyle = 'rgba(90,40,26,.28)';
    g.lineWidth = 1.4;
    for (let y = 150; y < BASE_Y; y += 40 + r() * 30) {
      g.beginPath();
      g.moveTo(-4, y);
      for (let x = 0; x <= W + 8; x += 24) g.lineTo(x, y + Math.sin(x * 0.012 + y) * 10 + (r() - 0.5) * 3);
      g.stroke();
    }
    // Desert varnish: black streaks where water runs off the rim.
    for (let i = 0; i < 16; i++) {
      const x = r() * W;
      const len = 120 + r() * 300;
      g.fillStyle = lin(g, 0, 96, 0, 96 + len, [
        [0, 'rgba(40,22,20,.55)'],
        [1, 'rgba(40,22,20,0)'],
      ]);
      g.fillRect(x, 96, 6 + r() * 16, len);
    }
    // Huecos, a few.
    g.fillStyle = 'rgba(70,30,20,.5)';
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.ellipse(20 + r() * 320, 160 + r() * 340, 3 + r() * 5, 2 + r() * 3, 0, 0, 6.2832);
      g.fill();
    }
    // The Big Link's bulge, and its shadow.
    g.fillStyle = 'rgba(70,30,22,.45)';
    g.beginPath();
    g.moveTo(186, 392);
    g.quadraticCurveTo(222, 368, 262, 390);
    g.lineTo(262, 404);
    g.quadraticCurveTo(222, 386, 186, 404);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,214,176,.5)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(186, 392);
    g.quadraticCurveTo(222, 368, 262, 390);
    g.stroke();
    // The trad line's crack, and the blank face above it.
    g.strokeStyle = 'rgba(40,20,16,.7)';
    g.lineWidth = 2.4;
    g.beginPath();
    trace(
      g,
      [
        [310, 540],
        [306, 470],
        [312, 400],
        [304, 330],
        [310, 262],
        [316, 214],
      ],
      false,
    );
    g.stroke();
    // The rim: a paler cap of harder rock.
    g.fillStyle = '#D9906A';
    g.fillRect(-4, 90, W + 8, 16);
    g.restore();

    g.fillStyle = '#D9B48A';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#C49A72';
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      rock(g, r() * W, BASE_Y + 20 + r() * 160, 12 + r() * 20, 6 + r() * 8);
      g.fill();
    }
    g.fillStyle = '#6E7A55';
    for (const [tx, ty, sc] of [
      [16, BASE_Y + 4, 1.1],
      [346, BASE_Y + 2, 0.9],
    ] as const) {
      g.beginPath();
      g.ellipse(tx, ty - 8 * sc, 18 * sc, 10 * sc, 0, 0, 6.2832);
      g.fill();
    }
  }

  function paintMoon(g: G): void {
    g.fillStyle = lin(g, 0, 0, 0, 300, [
      [0, '#9CC3D9'],
      [1, '#F3DDB8'],
    ]);
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#C9A7A0';
    g.beginPath();
    g.moveTo(-4, 250);
    g.lineTo(40, 250);
    g.lineTo(52, 228);
    g.lineTo(120, 228);
    g.lineTo(132, 250);
    g.lineTo(250, 250);
    g.lineTo(262, 236);
    g.lineTo(330, 236);
    g.lineTo(342, 256);
    g.lineTo(W + 4, 256);
    g.lineTo(W + 4, BASE_Y);
    g.lineTo(-4, BASE_Y);
    g.closePath();
    g.fill();

    g.save();
    g.beginPath();
    poly(g, M_WALL, true);
    g.clip();
    g.fillStyle = '#E4D8C6';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#C2AE9C';
    g.beginPath();
    g.moveTo(210, 0);
    g.lineTo(W, 0);
    g.lineTo(W, H);
    g.lineTo(250, H);
    g.closePath();
    g.fill();
    const r = mulberry32(131);
    g.strokeStyle = 'rgba(96,74,62,.42)';
    g.lineWidth = 1.5;
    for (let y = 90; y < BASE_Y; y += 34 + r() * 26) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 24) g.lineTo(x, y + (r() - 0.5) * 5);
      g.stroke();
      for (let k = 0; k < 3; k++) {
        const vx = 40 + r() * 280;
        g.beginPath();
        g.moveTo(vx, y);
        g.lineTo(vx + (r() - 0.5) * 5, y + 18 + r() * 16);
        g.stroke();
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = 40 + r() * 280;
      const top = 60 + r() * 200;
      const len = 90 + r() * 200;
      g.fillStyle = lin(g, 0, top, 0, top + len, [
        [0, 'rgba(176,96,52,.3)'],
        [1, 'rgba(176,96,52,0)'],
      ]);
      g.fillRect(x, top, 5 + r() * 9, len);
    }
    g.restore();

    g.fillStyle = '#D8BE92';
    g.fillRect(-4, BASE_Y, W + 8, H - BASE_Y);
    g.fillStyle = '#C9AC7F';
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      rock(g, r() * W, BASE_Y + 20 + r() * 160, 12 + r() * 20, 6 + r() * 8);
      g.fill();
    }
    g.fillStyle = '#6E7A55';
    for (const [tx, ty, sc] of [
      [14, BASE_Y + 4, 1.2],
      [348, BASE_Y + 2, 1],
    ] as const) {
      g.beginPath();
      g.ellipse(tx, ty - 8 * sc, 18 * sc, 10 * sc, 0, 0, 6.2832);
      g.fill();
    }
  }

  return {
    topos,
    paint: {
      moon: paintMoon,
      mesa: paintMesa,
      stone: paintStone,
      wind: paintWind,
      crucible: paintCrucible,
      cove: paintCove,
      bluff: paintBluff,
      hollow: paintHollow,
    },
    faces: {
      moon: M_WALL,
      mesa: S_WALL,
      stone: B_WALL,
      wind: R_WALL,
      crucible: C_WALL,
      cove: P_WALL,
      bluff: BL_WALL,
      hollow: H_WALL,
    },
  };
}
