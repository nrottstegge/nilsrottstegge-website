// Scroll progress for pinned scenes. Native scrolling only: positions are read,
// never set. Callbacks run at most once per animation frame and only while the
// scene is near the viewport.

type ProgressCallback = (progress: number) => void;

interface Entry {
  el: HTMLElement;
  cb: ProgressCallback;
  active: boolean;
  last: number;
}

const entries: Entry[] = [];
let scheduled = false;
let listening = false;

function progressOf(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const track = r.height - window.innerHeight;
  if (track <= 0) return 0;
  return Math.min(1, Math.max(0, -r.top / track));
}

function flush() {
  scheduled = false;
  for (const e of entries) {
    if (!e.active) continue;
    const p = progressOf(e.el);
    if (p !== e.last) {
      e.last = p;
      e.cb(p);
    }
  }
}

function schedule() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(flush);
  }
}

const observer = new IntersectionObserver(
  (records) => {
    for (const rec of records) {
      const e = entries.find((x) => x.el === rec.target);
      if (e) e.active = rec.isIntersecting;
    }
    schedule();
  },
  { rootMargin: '50% 0px' },
);

/** Calls `cb(progress)` with 0..1 as the scene's sticky stage travels through it. */
export function onSceneProgress(el: HTMLElement, cb: ProgressCallback) {
  const e: Entry = { el, cb, active: false, last: -1 };
  entries.push(e);
  observer.observe(el);
  if (!listening) {
    listening = true;
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', () => {
      for (const x of entries) x.last = -1;
      schedule();
    });
  }
  e.cb((e.last = progressOf(el)));
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Run `load` once `el` is within `margin` of the viewport (lazy module loading). */
export function whenNear(el: Element, load: () => void, margin = '150% 0px') {
  const io = new IntersectionObserver(
    (records) => {
      if (records.some((r) => r.isIntersecting)) {
        io.disconnect();
        load();
      }
    },
    { rootMargin: margin },
  );
  io.observe(el);
}

/** Map p from [a, b] to [0, 1], clamped. */
export const segment = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
export const smooth = (x: number) => x * x * (3 - 2 * x);
