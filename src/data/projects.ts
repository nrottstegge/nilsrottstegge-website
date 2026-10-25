// Sources: Adaptive Trees report/slides (github.com/nrottstegge/Adaptive_Trees),
// bachelor thesis "Hybrid Blocked-DIA (HBDIA)" (doi:10.3929/ethz-c-000784413) and its
// presentation, the CV project and the PorousConvection README. Numbers are maxima
// reported in those sources.

export interface Media {
  /** Muted looping footage; `${base}.av1.mp4` / `${base}.h264.mp4`, poster `${base}.webp`. */
  video?: string;
  /** Still figure (WebP). */
  image?: string;
  /** Interactive figure or chart rendered by a component. */
  interactive?: 'hbdia' | 'hpcg-speedup' | 'hpcg-weak-scaling' | 'box-colouring';
  alt: string;
  caption: string;
  /** Light figures (white background) get a paper frame. */
  paper?: boolean;
}

export interface ViewerScene {
  /** Self-contained vtk.js export in public/media/viewer/. */
  url: string;
  dataset: string;
  short: string;
  note: string;
  particles: string;
}

export interface Project {
  slug: string;
  title: string;
  kicker: string;
  short: string;
  summary: string;
  contribution: string[];
  results: string[];
  tech: string[];
  links: { label: string; href: string }[];
  media: Media[];
  /** Picture for the home-page tile, if it should differ from the first media item. */
  cover?: Media;
  /** Interactive 3D views of constructed trees (from the report). */
  viewer?: ViewerScene[];
}

export const projects: Project[] = [
  {
    slug: 'adaptive-trees',
    title: 'Adaptive Trees on a GPU',
    kicker: 'Research · Jülich Supercomputing Centre · 2026',
    short: 'Adaptive octrees for the Fast Multipole Method, rebuilt on the GPU every time step.',
    summary:
      'The Fast Multipole Method needs a spatial hierarchy over the particles. Dense trees waste work and memory on empty space; pointer-based sparse trees waste GPU efficiency. This project builds adaptive octrees and binary trees that sit between the two, represented as sorted arrays of space-filling-curve keys so every step is a bulk parallel primitive. Guest Student Programme 2026, August to October.',
    contribution: [
      'Adaptive octrees and binary (KDTree3D) trees in C++/CUDA on the Cornerstone representation: sorted Morton keys and leaf boundaries.',
      'NFCount: refinement driven by the expected near-field work of a leaf and its neighbours, not by particle count alone.',
      'TreeView: reconstructs the internal FMM hierarchy directly from the leaves in a few parallel passes, without pointers or host readback.',
      'GPU optimisations: cooperative stencil evaluation, caching and compaction, fixed-capacity buffers, overlapping streams and CUDA Graphs.',
    ],
    results: [
      'Tree update and hierarchy construction up to 2.4× faster than Cornerstone (baseline).',
      'Complete FMM execution up to 4.8× faster than with a dense tree.',
    ],
    tech: ['C++20', 'CUDA', 'CUDA Graphs', 'CUB', 'CMake', 'Catch2 / CTest', 'JUPITER'],
    links: [
      { label: 'Report', href: 'https://nrottstegge.github.io/Adaptive_Trees/report/' },
      { label: 'Slides', href: 'https://nrottstegge.github.io/Adaptive_Trees/slides/' },
      { label: 'Repository', href: 'https://github.com/nrottstegge/Adaptive_Trees' },
    ],
    media: [
      {
        video: '/media/projects/adaptive-trees',
        alt: 'Flyby dataset: a star passes a galaxy while an adaptive octree refines where the particles go.',
        caption: 'Flyby dataset: a star passes a galaxy; the adaptive octree (NFCount) follows the particles.',
      },
      {
        video: '/media/projects/coulomb-explosion',
        alt: 'Coulomb explosion: 100,000 charged particles expand while an adaptive octree follows them.',
        caption: 'Coulomb explosion, 100,000 particles.',
      },
    ],
    viewer: [
      {
        url: '/media/viewer/scene-9.html',
        dataset: 'Flyby',
        short: 'first snapshot',
        note: 'All particles start in a thin disc; the rest of the domain stays coarse.',
        particles: '512,002',
      },
      {
        url: '/media/viewer/scene-8.html',
        dataset: 'Flyby',
        short: 'evolved',
        note: 'About 1,000 snapshots later, the tree has followed the particles.',
        particles: '512,002',
      },
      {
        url: '/media/viewer/scene-6.html',
        dataset: 'Dense halo',
        short: 'slice',
        note: 'A slice through the tree: red is deep, blue is shallow. A subsample of the 25,600,000 particles is shown.',
        particles: '25,600,000',
      },
    ],
  },
  {
    slug: 'hbdia',
    title: 'HBDIA: Hybrid Blocked-DIA',
    kicker: 'Bachelor thesis · ETH Zurich, SPCL · 2025',
    short: 'A sparse matrix format that splits the work between the GPU and the CPU of a GH200.',
    summary:
      'Sparse matrices from stencils have strong diagonal structure, but real matrices also contain irregular outliers. HBDIA cuts the matrix into warp-wide column blocks, keeps locally dense diagonals in a blocked DIA layout for coalesced GPU access, and relegates sparse diagonals to a COO part that the Grace CPU of an NVIDIA GH200 can process concurrently. A performance model of transfer and aggregation costs guides the split. Advisors: Prof. Dr. Torsten Hoefler and Yakup Koray Budanaz.',
    contribution: [
      'Designed the HBDIA format and a direct two-pass COO → HBDIA conversion.',
      'Implemented the SpMV GPU kernel with fully coalesced block access, CPU COO fallback and multi-GPU execution via MPI.',
      'Developed a performance model for heterogeneous CPU–GPU execution on tightly coupled systems.',
    ],
    results: [
      'Up to 2.2× faster than cuSPARSE on stencil matrices.',
      'Up to 1.6× on a PDE-constrained optimisation matrix (nlpkkt240) and 1.5× on a 3D fluid channel simulation.',
      'Storage stays below COO even with up to 100% added random entries.',
    ],
    tech: ['C++', 'CUDA', 'cuSPARSE', 'OpenMP', 'MPI', 'NVIDIA GH200', 'Nsight Compute'],
    links: [
      { label: 'Thesis (ETH Research Collection)', href: 'https://doi.org/10.3929/ethz-c-000784413' },
      { label: 'Repository', href: 'https://github.com/nrottstegge/HBDIA' },
    ],
    media: [
      {
        interactive: 'hbdia',
        alt: 'Interactive HBDIA figure: a sparse matrix in dense, DIA and HBDIA form, with each nonzero coloured by whether it lands on the GPU or the CPU.',
        caption: 'The example from my thesis (block width 8): hover an entry to follow it from the dense matrix through DIA into the GPU blocks or the CPU’s COO list. Move the threshold to change the split.',
      },
    ],
  },
  {
    slug: 'hpcg',
    title: 'Multi-GPU HPCG',
    kicker: 'Project · ALPS supercomputer',
    short: 'Ported a single-GPU HPCG to many GPUs, then optimised it until it beat the original on one GPU.',
    summary:
      'HPCG solves a 3D Poisson problem with a preconditioned conjugate gradient method and stresses memory bandwidth and interconnect rather than peak FLOPs. I started from an existing single-GPU implementation that stores the 27-point stencil matrix in the DIA format and parallelises symmetric Gauss-Seidel (SymGS) with box colouring, and ported it to multiple GPUs and nodes. The first port was slower than the original even on a single GPU: the ghost cells needed for the halo exchange broke coalesced memory access. Step by step I reworked indexing and data layout until the multi-GPU code, run on one GPU, was faster than the single-GPU code it came from: 1.50× for SpMV and 1.78× for SymGS. Then I scaled it out to 512 nodes and 2,048 GH200 GPUs on ALPS.',
    contribution: [
      'Ported the DIA-based single-GPU HPCG to multiple GPUs and nodes: SpMV, SymGS, multigrid, CG, dot products and WAXPBY.',
      'Halo exchange over a 3D domain decomposition with up to 26 neighbours, using MPI (host and CUDA-aware) and NCCL.',
      'SpMV: locality-optimised indexing and column-major DIA storage, so consecutive threads read consecutive memory (84.6% memory utilisation efficiency).',
      'SymGS: colour-wise storage, so all coefficients of one box colour are contiguous and no colour offsets are computed at run time (92.0% memory utilisation efficiency).',
    ],
    results: [
      'On one GH200, the multi-GPU code beats the original single-GPU code: 1.50× faster SpMV and 1.78× faster SymGS (from 0.32× and 0.68× after the naive port).',
      'Verified on up to 512 nodes, 2,048 NVIDIA GH200 GPUs, on the ALPS supercomputer.',
      'Ported to the AMD cluster Beverin.',
      'Lesson: a data layout that is best for one kernel can be the worst for another; colour-wise storage speeds up SymGS but slows SpMV to 0.72×.',
    ],
    tech: ['C++', 'CUDA', 'NCCL', 'MPI', 'Slurm', 'ALPS'],
    cover: {
      image: '/media/projects/gh200.webp',
      alt: 'NVIDIA GH200 Grace Hopper Superchip',
      caption: 'NVIDIA GH200 Grace Hopper Superchip (photo: NVIDIA).',
      paper: true,
    },
    links: [{ label: 'Repository', href: 'https://github.com/Jiela42/HighPerformanceHPCG_Thesis' }],
    media: [
      {
        image: '/media/projects/hpcg-grid.svg',
        alt: 'An 8 × 8 × 8 grid of points in 3D, coloured from blue to red along its diagonal.',
        caption: 'The structured 3D grid behind HPCG’s 27-point stencil (8 × 8 × 8 points).',
        paper: true,
      },
      {
        interactive: 'hpcg-speedup',
        alt: 'Bar charts of the speedup of each optimisation step over the original single-GPU code, for SpMV and SymGS.',
        caption: 'From the naive port to faster-than-the-original: every step measured on one GH200 (256³ grid, multi-GPU code path) against the single-GPU code.',
      },
      {
        interactive: 'hpcg-weak-scaling',
        alt: 'Line chart: time per CG iteration rises while GPUs gain neighbours, then stays flat at 283 to 300 ms from 216 to 1,728 GPUs.',
        caption: 'Weak scaling with 32³ points per GPU (median of 10 runs). The time per iteration grows while processes gain halo neighbours, then stays flat once most have all 26. Hover a point for details.',
      },
      {
        interactive: 'box-colouring',
        alt: 'Interactive grid in 9 colours; the sweeps update one colour at a time.',
        caption: 'Box colouring makes symmetric Gauss-Seidel parallel. Shown in 2D with a 9-point stencil and 9 colours; HPCG’s 27-point stencil in 3D needs 27.',
      },
    ],
  },
  {
    slug: 'porous-convection',
    title: 'Porous Convection on GPUs',
    kicker: 'Course project · ETH Zurich',
    short: 'Thermal convection solvers in Julia, distributed over GPUs with MPI.',
    summary:
      'Hot fluid rises, cold fluid sinks, and in a porous medium this forms plumes. The solvers discretise the equations with finite differences, iterate them with pseudo-transient relaxation and split the domain across GPUs with MPI. Course on solving partial differential equations in parallel on GPUs.',
    contribution: ['2D and 3D thermal porous-convection solvers with ParallelStencil.jl.', 'MPI domain decomposition for multi-GPU runs.'],
    results: ['Distributed execution validated on eight GPUs across two nodes.'],
    tech: ['Julia', 'ParallelStencil.jl', 'MPI', 'GLMakie'],
    links: [
      {
        label: 'Repository',
        href: 'https://github.com/nrottstegge/pde-on-gpu-nils-rottstegge/tree/c0274508e9d67777d01cd36b8a9286ee561297cb/PorousConvection',
      },
    ],
    media: [
      {
        video: '/media/projects/porous-convection',
        alt: 'Temperature field of 2D porous convection: hot plumes rise from the bottom, cold ones sink from the top, arrows show the flow.',
        caption: '2D thermal porous convection: temperature field and flow.',
      },
    ],
  },
];
