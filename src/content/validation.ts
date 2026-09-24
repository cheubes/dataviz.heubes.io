import type { CollectionEntry } from 'astro:content';
import { getVisualizationSlug } from './config';

const NON_LOCALIZED_FIELDS = ['datasets', 'themes', 'publication-date', 'downloads'] as const;
const RESERVED_SLUGS = ['about'];

// Key order in the YAML frontmatter is irrelevant to the equality rule.
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalize((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

// Cross-file rules from "Contraintes et règles de validation" in
// specs/data-model.md, which the per-file Zod schema cannot express.
export function validateVisualizations(
  entries: CollectionEntry<'visualizations'>[],
  lang: 'fr' | 'en',
  mountedSlugs: string[]
): void {
  const errors: string[] = [];
  const bySlug = new Map<string, CollectionEntry<'visualizations'>[]>();

  for (const entry of entries) {
    if (!entry.id.endsWith(`.${entry.data.lang}`)) {
      errors.push(`${entry.id}.md: lang "${entry.data.lang}" does not match the file name suffix`);
      continue;
    }
    const slug = getVisualizationSlug(entry.id, entry.data.lang);
    if (RESERVED_SLUGS.includes(slug)) errors.push(`${entry.id}.md: slug "${slug}" is reserved`);
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), entry]);
  }

  for (const [slug, translations] of bySlug) {
    const [first, second] = translations;
    if (second) {
      for (const field of NON_LOCALIZED_FIELDS) {
        if (JSON.stringify(normalize(first.data[field])) !== JSON.stringify(normalize(second.data[field]))) {
          errors.push(`${slug}: non-localized field "${field}" differs between ${first.id}.md and ${second.id}.md`);
        }
      }
    }
    if (translations.some((entry) => entry.data.lang === lang) && !mountedSlugs.includes(slug)) {
      errors.push(`${slug}: no visualization component mounted for it in the ${lang} page`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid visualization content:\n- ${errors.join('\n- ')}`);
  }
}
