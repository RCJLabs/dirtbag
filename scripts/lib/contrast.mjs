// WCAG 2 contrast between two #rrggbb colours: 1 (none) to 21 (black on white).
const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

export function luminance(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`${hex} is not a #rrggbb colour`);
  const [r, g, b] = m.slice(1).map((h) => channel(parseInt(h, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The kit's colour tokens, `--u-name: #rrggbb;`, from a stylesheet's text.
export function tokens(css) {
  return Object.fromEntries([...css.matchAll(/--u-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
}
