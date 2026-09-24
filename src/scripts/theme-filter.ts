export const THEMES = ['living', 'climate', 'earth', 'territory', 'space'] as const;
export type Theme = (typeof THEMES)[number];

export function parseThemes(value: string | undefined): Theme[] {
  return (value ?? '').split(' ').filter((entry): entry is Theme =>
    (THEMES as readonly string[]).includes(entry)
  );
}

export function matchesSelection(cardThemes: Theme[], selected: Theme | null): boolean {
  return selected === null || cardThemes.includes(selected);
}
