import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const visualizations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/visualizations' }),
  schema: z.object({
    lang: z.enum(['fr', 'en']),
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    datasets: z.array(
      z.object({
        name: z.string(),
        publisher: z.string(),
        url: z.string().url(),
        license: z.string().optional(),
        retrieved: z.string().optional(),
      })
    ),
    'cover-source': z.union([z.literal('ai-generated'), z.string().url()]).optional(),
    'publication-date': z.string(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/categories' }),
  schema: z.object({
    label: z.object({ fr: z.string(), en: z.string() }),
  }),
});

export const collections = { visualizations, categories };
