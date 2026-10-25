import { withBase } from '../lib/paths';

export const contact = {
  name: 'Nils Rottstegge',
  email: 'nils@rottstegge.ch',
  github: 'https://github.com/nrottstegge',
  linkedin: 'https://www.linkedin.com/in/nilsrottstegge',
};

export const cvFile = withBase('/cv/nils-rottstegge-cv.pdf');

export const about =
  'I study Computer Science at ETH Zurich (M.Sc., Data Management Systems) and work on high-performance and GPU computing: sparse linear algebra, multi-GPU solvers and adaptive trees. Before computer science I earned a B.Eng. in Audiovisual Media, and I have worked as a live-TV video engineer since 2015.';

/** Skills from the CV that form the "CV" glyph (exactly 18, one per box). */
export const glyphSkills = [
  'CUDA', 'C/C++', 'CUDA-aware MPI', 'NCCL', 'OpenMP', 'OpenACC', 'HIP / hipify', 'CUDA Graphs', 'CUB',
  'cuBLAS', 'cuSPARSE', 'Nsight Compute', 'Nsight Systems', 'Python', 'Julia', 'Slurm', 'CMake', 'Roofline analysis',
];

/** Further CV skills: they appear with the others, then make room for the glyph. */
export const moreSkills = [
  'CUDA Fortran', 'cuFFT', 'cuRAND', 'cuTENSOR', 'Git', 'Catch2 / CTest', 'Compute Sanitizer', 'cuda-gdb', 'Java',
  'SQL / PostgreSQL',
];
