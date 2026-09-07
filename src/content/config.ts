import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The default generateId concatenates basename and lang suffix without a
// separator (test-viz.fr.md -> "test-vizfr"), unusable to recover the slug.
// Stripping only the .md extension keeps id "test-viz.fr" instead.
function generateVisualizationId({ entry }: { entry: string }) {
  return entry.replace(/\.md$/, '');
}

export function getVisualizationSlug(id: string, lang: string) {
  return id.slice(0, -(lang.length + 1));
}

const visualizations = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/visualizations',
    generateId: generateVisualizationId,
  }),
  schema: z.object({
    lang: z.enum(['fr', 'en']),
    title: z.string(),
    summary: z.string(),
    datasets: z.array(
      z.object({
        name: z.string(),
        publisher: z.string(),
        url: z.string().url(),
        license: z.string().optional(),
        retrieved: z.string().optional(),
      })
    ),
    'publication-date': z.string(),
  }),
});

export const collections = { visualizations };
