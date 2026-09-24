import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://dataviz.heubes.io',
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements
  // ("À propos · Réalisée par", download links); keep the Astro 5 behavior.
  compressHTML: true,
  integrations: [sitemap()],
});
