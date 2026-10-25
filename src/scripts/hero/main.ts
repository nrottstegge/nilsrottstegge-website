// Hero: name over adaptive-quadtree art, then ETH, FZJ and ALPS/JUPITER,
// then the CV skills rise out of quadtree cells and assemble into a "CV" glyph.
import { onSceneProgress, reducedMotion, segment, smooth } from '../lib/scroll';

// "CV" on a 5-row grid: C is 4 columns wide, then a gap, then a 5-wide V.
const GLYPH: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4],
  [5, 0], [9, 0], [5, 1], [9, 1], [6, 2], [8, 2], [6, 3], [8, 3], [7, 4],
];

interface Box {
  el: HTMLElement;
  seed: Element | null;
  glyph: number; // index into GLYPH, or -1
  from: { x: number; y: number; s: number };
  to: { x: number; y: number; s: number };
  last: string;
}

export function init(scene: HTMLElement) {
  const stage = scene.querySelector<HTMLElement>('.stage')!;
  const title = scene.querySelector<HTMLElement>('[data-title]')!;
  const veil = scene.querySelector<HTMLElement>('.veil')!;
  const cta = scene.querySelector<HTMLElement>('[data-cta]')!;
  const beats = [...scene.querySelectorAll<HTMLElement>('[data-range]')].map((el) => ({
    el,
    range: el.dataset.range!.split(',').map(Number),
  }));
  const boxes: Box[] = [...scene.querySelectorAll<HTMLElement>('.box')].map((el) => {
    const k = Number(el.dataset.k);
    return {
      el,
      seed: scene.querySelector(`rect[data-k="${k}"]`),
      glyph: el.classList.contains('extra') ? -1 : k,
      from: { x: 0, y: 0, s: 1 },
      to: { x: 0, y: 0, s: 1 },
      last: '',
    };
  });

  if (reducedMotion()) {
    scene.classList.add('is-static');
    return;
  }

  let unit = 60;
  const layout = () => {
    const sr = stage.getBoundingClientRect();
    const portrait = sr.width < sr.height;
    // Side by side on wide screens; C above V on portrait screens.
    const gw = portrait ? 5 : 10;
    const gh = portrait ? 11 : 5;
    const room = sr.height - (portrait ? 320 : 270);
    unit = Math.min((sr.width * 0.86) / (gw * 1.08), room / (gh * 1.08), 96);
    const gap = unit * 0.08;
    const ox = (sr.width - (gw * unit + (gw - 1) * gap)) / 2;
    const oy = Math.max(64, (room - (gh * unit + (gh - 1) * gap)) / 2 + 48);
    scene.classList.toggle('tiny', unit < 36);
    const font = `${Math.max(7, Math.min(11, unit / 6))}px`;
    for (const b of boxes) {
      b.el.style.width = b.el.style.height = `${unit}px`;
      b.el.style.fontSize = font;
      const r = b.seed?.getBoundingClientRect();
      b.from = r
        ? { x: r.left - sr.left, y: r.top - sr.top, s: Math.max(r.width, 18) / unit }
        : { x: sr.width / 2, y: sr.height / 2, s: 0.3 };
      if (b.glyph >= 0) {
        let [gx, gy] = GLYPH[b.glyph];
        if (portrait && gx >= 5) [gx, gy] = [gx - 5, gy + 6];
        b.to = { x: ox + gx * (unit + gap), y: oy + gy * (unit + gap), s: 1 };
      } else {
        b.to = b.from;
      }
      b.last = '';
    }
  };

  let current = 0;
  const update = (p: number) => {
    current = p;
    const k = segment(p, 0.005, 0.06);
    title.style.opacity = String(1 - k);
    title.style.transform = `translateY(${-k * 40}px)`;
    // Calm the artwork while cards are on screen; bring it back for the skills.
    veil.style.opacity = String(0.55 * smooth(segment(p, 0.05, 0.1)) * (1 - 0.3 * smooth(segment(p, 0.69, 0.73))) + 0.2 * smooth(segment(p, 0.78, 0.84)));
    for (const b of beats) b.el.classList.toggle('is-on', p >= b.range[0] && p < b.range[1]);
    cta.classList.toggle('is-on', p > 0.88);

    const appear = segment(p, 0.7, 0.77);
    const fly = segment(p, 0.77, 0.9);
    boxes.forEach((b, i) => {
      const d = i / boxes.length;
      const shown = smooth(segment(appear, d * 0.6, d * 0.6 + 0.4));
      let opacity = shown;
      let m = 0;
      if (b.glyph >= 0) m = smooth(segment(fly, (b.glyph / GLYPH.length) * 0.4, (b.glyph / GLYPH.length) * 0.4 + 0.6));
      else opacity *= 1 - smooth(segment(fly, 0, 0.5));
      const x = b.from.x + (b.to.x - b.from.x) * m;
      const y = b.from.y + (b.to.y - b.from.y) * m;
      const s = b.from.s + (b.to.s - b.from.s) * m;
      const key = `${opacity.toFixed(3)}|${x.toFixed(1)}|${y.toFixed(1)}|${s.toFixed(3)}`;
      if (key === b.last) return;
      b.last = key;
      b.el.style.opacity = String(opacity);
      b.el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    });
  };

  layout();
  new ResizeObserver(() => {
    layout();
    update(current);
  }).observe(stage);
  onSceneProgress(scene, update);
}
