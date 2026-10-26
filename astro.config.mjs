import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nilsrottstegge.com',
  base: '/',
  trailingSlash: 'always',
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
