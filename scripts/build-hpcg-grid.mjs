// Draws the 8 x 8 x 8 HPCG grid as shaded spheres (orthographic view, painter's
// order), coloured along the x + y + z diagonal with the turbo colour map.
// Output: public/media/projects/hpcg-grid.svg
import { writeFileSync } from 'node:fs';

const N = 8;
const AZ = (-55 * Math.PI) / 180;
const EL = (24 * Math.PI) / 180;
const R = 0.36; // sphere radius in grid units

// Turbo colour map, polynomial approximation (Mikhailov, Google 2019).
function turbo(t) {
  const c = (a) => a.reduce((acc, k, i) => acc + k * t ** i, 0);
  const r = c([0.13572138, 4.6153926, -42.66032258, 132.13108234, -152.94239396, 59.28637943]);
  const g = c([0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604]);
  const b = c([0.1066733, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973]);
  const h = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

const pts = [];
for (let x = 0; x < N; x++)
  for (let y = 0; y < N; y++)
    for (let z = 0; z < N; z++) {
      const cx = x - (N - 1) / 2;
      const cy = y - (N - 1) / 2;
      const cz = z - (N - 1) / 2;
      // Rotate around the vertical axis, then tilt towards the viewer.
      const rx = cx * Math.cos(AZ) - cy * Math.sin(AZ);
      const ry = cx * Math.sin(AZ) + cy * Math.cos(AZ);
      const sx = rx;
      const sy = -cz * Math.cos(EL) + ry * Math.sin(EL);
      const depth = ry * Math.cos(EL) + cz * Math.sin(EL);
      pts.push({ sx, sy, depth, t: 0.06 + 0.88 * ((x + y + z) / (3 * (N - 1))) });
    }
pts.sort((a, b) => b.depth - a.depth); // far first

const xs = pts.map((p) => p.sx);
const ys = pts.map((p) => p.sy);
const pad = R + 0.3;
const minX = Math.min(...xs) - pad;
const minY = Math.min(...ys) - pad;
const W = Math.max(...xs) + pad - minX;
const H = Math.max(...ys) + pad - minY;
const S = 100; // user units per grid unit
const f = (v) => (v * S).toFixed(1);

const circles = pts
  .map((p) => {
    const x = f(p.sx - minX);
    const y = f(p.sy - minY);
    return `<circle cx="${x}" cy="${y}" r="${f(R)}" fill="${turbo(p.t)}"/><circle cx="${x}" cy="${y}" r="${f(R)}" fill="url(#s)"/>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}">
<defs><radialGradient id="s" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs>
<g stroke="#0e1014" stroke-opacity="0.55" stroke-width="2.2">${circles}</g>
</svg>
`;
writeFileSync(new URL('../public/media/projects/hpcg-grid.svg', import.meta.url), svg);
console.log(`hpcg-grid.svg: ${pts.length} points, ${(svg.length / 1024).toFixed(0)} KiB`);
