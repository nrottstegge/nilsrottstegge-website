// Build-time artwork: adaptive quadtree cells over clustered particles, the same
// construction as the header band of the Adaptive Trees slides (toytree.js), in greys.

export interface Cell {
  x: number;
  y: number;
  s: number;
  level: number;
  shade: number; // 0..SHADES-1
}

export const SHADES = 6;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const clamp = (x: number) => Math.min(0.999, Math.max(0.001, x));

type Kind = 'cluster' | 'sparse' | 'dense-core' | 'filament' | 'empty';

function particles(kind: Kind, n: number, seed: number): [number, number][] {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const blob = (cx: number, cy: number, sx: number, sy: number, m: number) => {
    for (let i = 0; i < m; i++) pts.push([clamp(cx + sx * gauss(r)), clamp(cy + sy * gauss(r))]);
  };
  if (kind === 'cluster') {
    blob(0.62, 0.38, 0.06, 0.06, n * 0.55);
    blob(0.3, 0.68, 0.05, 0.04, n * 0.3);
    for (let i = 0; i < n * 0.15; i++) pts.push([clamp(r()), clamp(r())]);
  } else if (kind === 'sparse') {
    blob(0.2, 0.22, 0.015, 0.015, n * 0.35);
    blob(0.78, 0.7, 0.02, 0.012, n * 0.35);
    blob(0.72, 0.18, 0.012, 0.012, n * 0.15);
    for (let i = 0; i < n * 0.15; i++) pts.push([clamp(r()), clamp(r())]);
  } else if (kind === 'dense-core') {
    blob(0.5, 0.5, 0.07, 0.07, n);
  } else if (kind === 'filament') {
    for (let i = 0; i < n; i++) {
      const s = r();
      pts.push([clamp(0.08 + 0.84 * s), clamp(0.5 + 0.12 * Math.sin(5 * s) + 0.015 * gauss(r))]);
    }
  } else {
    for (let i = 0; i < n * 0.1; i++) pts.push([clamp(r()), clamp(r())]);
  }
  return pts;
}

function quadtree(pts: [number, number][], threshold: number, maxLevel: number) {
  const leaves: { x: number; y: number; s: number; level: number }[] = [];
  const rec = (p: [number, number][], x: number, y: number, s: number, level: number) => {
    if (p.length <= threshold || level >= maxLevel) return leaves.push({ x, y, s, level });
    const h = s / 2;
    const q: [number, number][][] = [[], [], [], []];
    for (const v of p) q[(v[0] >= x + h ? 1 : 0) + (v[1] >= y + h ? 2 : 0)].push(v);
    rec(q[0], x, y, h, level + 1);
    rec(q[1], x + h, y, h, level + 1);
    rec(q[2], x, y + h, h, level + 1);
    rec(q[3], x + h, y + h, h, level + 1);
  };
  rec(pts, 0, 0, 1, 0);
  return leaves;
}

/** Cells on a `cols` x `rows` grid of unit root squares. */
export function quadtreeArt(cols: number, rows: number, seed = 5): Cell[] {
  const kinds: Kind[] = ['cluster', 'empty', 'sparse', 'dense-core', 'filament', 'cluster', 'empty', 'sparse'];
  const r = rng(seed);
  const cells: Cell[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const pts = particles(kinds[(k * 5 + 3) % kinds.length], 520, 11 + k);
      for (const l of quadtree(pts, 10, 6)) {
        // Lighter towards the top left, darker towards the bottom right and with depth.
        const t = ((l.x + i) / cols) * 0.45 + ((l.y + j) / rows) * 0.25 + l.level * 0.05 + (r() - 0.5) * 0.2;
        const shade = Math.max(0, Math.min(SHADES - 1, Math.floor(t * SHADES)));
        cells.push({ x: l.x + i, y: l.y + j, s: l.s, level: l.level, shade });
      }
    }
  return cells;
}
