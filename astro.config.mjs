import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nrottstegge.github.io',
  base: '/nilsrottstegge-website',
  trailingSlash: 'always',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
