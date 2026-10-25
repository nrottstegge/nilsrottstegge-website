// Interactive HBDIA figure (thesis Fig. 4.1 / 4.2): the example matrix in dense,
// DIA and HBDIA form. Every nonzero is one entry; hovering it highlights it in all
// three representations. HBDIA: columns are cut into blocks of BLOCK; a diagonal
// with at least `threshold` entries inside a block is stored on the GPU (blocked
// DIA), every other entry goes to the CPU as COO.

const N = 20;
const BLOCK = 8;
const OFFSETS = [13, 2, 1, 0, -1, -7]; // offset = col - row, as in the DIA figure

interface Entry {
  r: number;
  c: number;
  o: number;
  b: number; // column block
}

// Nonzero pattern of the example (first 20 rows/columns of dwt_59, HBDIA README).
const ENTRIES: Entry[] = (() => {
  const set: [number, number][] = [];
  for (let i = 0; i < N; i++) set.push([i, i]);
  for (let i = 0; i < N - 1; i++) set.push([i, i + 1], [i + 1, i]);
  set.push([0, 2], [3, 5], [6, 8], [9, 11], [12, 14], [15, 17]); // offset +2
  set.push([2, 15], [5, 18]); // offset +13
  set.push([10, 3], [15, 8]); // offset -7
  return set
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => ({ r, c, o: c - r, b: Math.floor(c / BLOCK) }));
})();

const BLOCKS = Math.ceil(N / BLOCK);
const count = (b: number, o: number) => ENTRIES.filter((e) => e.b === b && e.o === o).length;
const sign = (o: number) => (o > 0 ? `+${o}` : String(o));

const SVG = 'http://www.w3.org/2000/svg';
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent: Element) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent.appendChild(node);
  return node;
}

const CELL = 13;

export function mount(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('[data-figure]')!;
  const info = root.querySelector<HTMLElement>('[data-info]')!;
  const slider = root.querySelector<HTMLInputElement>('input[type=range]');
  const tOut = root.querySelector<HTMLElement>('[data-t]');
  let threshold = Number(slider?.value ?? 3);
  let active = -1;
  const idle = info.textContent ?? '';

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'HBDIA: dense matrix, DIA format and the GPU/CPU split');
  svg.setAttribute('tabindex', '0');
  host.appendChild(svg);

  const onGpu = (e: Entry) => count(e.b, e.o) >= threshold;
  const text = (x: number, y: number, s: string, parent: Element, cls = 'lbl', anchor = 'start') => {
    const t = el('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
    t.textContent = s;
    return t;
  };
  // Intro: dense entries first, then DIA, then HBDIA (stagger per entry and panel).
  let panel = 0;
  const entryRect = (x: number, y: number, i: number, parent: Element) =>
    el('rect', { x: x + 1, y: y + 1, width: CELL - 2, height: CELL - 2, 'data-e': i, class: 'e', style: `--d:${panel * 450 + i * 6}ms` }, parent);

  const draw = () => {
    svg.replaceChildren();
    const g = (cls: string) => el('g', { class: cls }, svg);

    // Dense: every cell stored, nonzeros coloured by where they land.
    const dense = g('panel');
    text(20, 22, 'Dense', dense, 'title');
    const dx = 20;
    const dy = 40;
    el('rect', { x: dx, y: dy, width: N * CELL, height: N * CELL, class: 'frame' }, dense);
    for (let k = 1; k < N; k++) {
      el('line', { x1: dx + k * CELL, y1: dy, x2: dx + k * CELL, y2: dy + N * CELL, class: 'grid' }, dense);
      el('line', { x1: dx, y1: dy + k * CELL, x2: dx + N * CELL, y2: dy + k * CELL, class: 'grid' }, dense);
    }
    ENTRIES.forEach((e, i) => entryRect(dx + e.c * CELL, dy + e.r * CELL, i, dense));

    panel = 1;
    // DIA: one row per stored diagonal, indexed by column; blocks of BLOCK columns.
    const dia = g('panel');
    const ax = 340;
    const ay = 40;
    text(ax, 22, 'DIA', dia, 'title');
    const cx = ax + 36;
    for (let b = 0; b < BLOCKS; b++) {
      const w = Math.min(BLOCK, N - b * BLOCK) * CELL;
      text(cx + b * BLOCK * CELL + w / 2, ay - 4, `block ${b}`, dia, 'lbl', 'middle');
    }
    OFFSETS.forEach((o, row) => {
      const y = ay + 6 + row * CELL;
      text(cx - 6, y + 10, sign(o), dia, 'lbl', 'end');
      for (let c = 0; c < N; c++) {
        const i = ENTRIES.findIndex((e) => e.c === c && e.o === o);
        if (i >= 0) entryRect(cx + c * CELL, y, i, dia);
        else el('rect', { x: cx + c * CELL + 1, y: y + 1, width: CELL - 2, height: CELL - 2, class: 'pad' }, dia);
      }
    });
    for (let b = 1; b < BLOCKS; b++) {
      const x = cx + b * BLOCK * CELL;
      el('line', { x1: x, y1: ay + 2, x2: x, y2: ay + 10 + OFFSETS.length * CELL, class: 'cut' }, dia);
    }

    panel = 2;
    // HBDIA: GPU blocks (only dense-enough diagonals, padded to full lanes) + CPU COO.
    const hb = g('panel');
    const hx = 700;
    text(hx, 22, 'HBDIA', hb, 'title');
    text(hx, 48, 'GPU · blocked DIA', hb, 'lbl gpu');
    let y = 58;
    for (let b = 0; b < BLOCKS; b++) {
      const lanes = Math.min(BLOCK, N - b * BLOCK);
      const offs = OFFSETS.filter((o) => count(b, o) >= threshold);
      text(hx, y + 10, `block ${b}`, hb, 'lbl');
      y += 14;
      for (const o of offs) {
        text(hx + 26, y + 10, sign(o), hb, 'lbl', 'end');
        for (let l = 0; l < lanes; l++) {
          const c = b * BLOCK + l;
          const i = ENTRIES.findIndex((e) => e.c === c && e.o === o);
          if (i >= 0) entryRect(hx + 32 + l * CELL, y, i, hb);
          else el('rect', { x: hx + 32 + l * CELL + 1, y: y + 1, width: CELL - 2, height: CELL - 2, class: 'pad' }, hb);
        }
        y += CELL;
      }
      y += 8;
    }
    const cpu = ENTRIES.map((e, i) => ({ e, i })).filter(({ e }) => !onGpu(e));
    const cy = 40;
    const cx2 = 880;
    text(cx2, 48, 'CPU · COO', hb, 'lbl cpu');
    text(cx2 + 14, cy + 30, 'row', hb, 'lbl', 'middle');
    text(cx2 + 52, cy + 30, 'col', hb, 'lbl', 'middle');
    cpu.slice(0, 22).forEach(({ e, i }, k) => {
      const ry = cy + 36 + k * 15;
      const r = el('rect', { x: cx2, y: ry, width: 70, height: 14, class: 'e row', 'data-e': i }, hb);
      r.setAttribute('rx', '2');
      text(cx2 + 14, ry + 11, String(e.r), hb, 'num', 'middle');
      text(cx2 + 52, ry + 11, String(e.c), hb, 'num', 'middle');
    });
    if (cpu.length > 22) text(cx2 + 35, cy + 36 + 22 * 15 + 10, `+${cpu.length - 22} more`, hb, 'lbl', 'middle');
    const bottom = Math.max(dy + N * CELL, y, cy + 36 + Math.min(cpu.length, 23) * 15);
    svg.setAttribute('viewBox', `0 0 1000 ${bottom + 12}`);

    // Colour every entry by destination.
    svg.querySelectorAll<SVGElement>('[data-e]').forEach((n) => {
      n.classList.add(onGpu(ENTRIES[Number(n.dataset.e)]) ? 'to-gpu' : 'to-cpu');
    });
    const gpuN = ENTRIES.filter(onGpu).length;
    root.style.setProperty('--gpu-share', `${(gpuN / ENTRIES.length) * 100}%`);
    root.querySelector<HTMLElement>('[data-stats]')!.textContent =
      `${gpuN} of ${ENTRIES.length} nonzeros on the GPU, ${ENTRIES.length - gpuN} on the CPU`;
    if (active >= 0) highlight(active);
  };

  const highlight = (i: number) => {
    active = i;
    svg.classList.toggle('has-hot', i >= 0);
    svg.querySelectorAll('.hot').forEach((n) => n.classList.remove('hot'));
    if (i < 0) {
      info.textContent = idle;
      return;
    }
    svg.querySelectorAll(`[data-e="${i}"]`).forEach((n) => n.classList.add('hot'));
    const e = ENTRIES[i];
    const n = count(e.b, e.o);
    info.innerHTML = onGpu(e)
      ? `<b>A[${e.r}, ${e.c}]</b> lies on diagonal ${sign(e.o)}, which has ${n} entries in column block ${e.b} (≥ threshold ${threshold}): <b class="gpu">GPU</b>, block ${e.b}, lane ${e.c - e.b * BLOCK}.`
      : `<b>A[${e.r}, ${e.c}]</b> lies on diagonal ${sign(e.o)}, which has only ${n} ${n === 1 ? 'entry' : 'entries'} in column block ${e.b} (< threshold ${threshold}): <b class="cpu">CPU</b>, stored as COO.`;
  };

  svg.addEventListener('pointerover', (ev) => {
    const t = (ev.target as Element).closest('[data-e]') as SVGElement | null;
    if (t) highlight(Number(t.dataset.e));
  });
  svg.addEventListener('pointerleave', () => highlight(-1));
  // Keyboard: arrows step through the nonzeros in row order.
  svg.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    ev.preventDefault();
    const d = ev.key === 'ArrowRight' ? 1 : -1;
    highlight((Math.max(active, d > 0 ? -1 : 0) + d + ENTRIES.length) % ENTRIES.length);
  });
  svg.addEventListener('blur', () => highlight(-1));
  slider?.addEventListener('input', () => {
    threshold = Number(slider.value);
    if (tOut) tOut.textContent = slider.value;
    draw();
  });

  root.classList.add('is-intro');
  draw();
  setTimeout(() => root.classList.remove('is-intro'), 2000);
}
