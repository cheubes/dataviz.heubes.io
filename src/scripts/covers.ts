import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// Build-time only. Covers live in src/assets/covers/ so Astro's image service
// can derive the catalog's WebP variants and the sharing image from them (see
// "Images" in data-model.md).
const covers = import.meta.glob<{ default: ImageMetadata }>('../assets/covers/*.{jpg,png}', { eager: true });

export const COVER_PLACEHOLDER = '/cover-placeholder.svg';

export function getCover(slug: string): ImageMetadata | undefined {
  return (covers[`../assets/covers/${slug}.jpg`] ?? covers[`../assets/covers/${slug}.png`])?.default;
}

// Open Graph image: social networks expect a plain JPEG at full size, not
// the catalog's WebP variants.
export async function getSharingImagePath(slug: string): Promise<string> {
  const cover = getCover(slug);
  if (!cover) return COVER_PLACEHOLDER;
  const { src } = await getImage({ src: cover, format: 'jpg', width: cover.width });
  return src;
}
