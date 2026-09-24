import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Neutral description of a visualization's summary table, built at build time
// by its table.ts and rendered by DataTable.astro. Every value is already
// formatted for the page language.
export interface DataTableRow {
  header: string;
  // Rendered in italics after the header (e.g. a scientific name).
  headerNote?: string;
  cells: string[];
}

export interface DataTable {
  caption: string;
  // The first column labels the row headers; `numeric` right-aligns a column.
  columns: { label: string; numeric: boolean }[];
  rows: DataTableRow[];
  total?: DataTableRow;
}

export type DataTableBuilder = (lang: 'fr' | 'en') => DataTable;

// Build-time only: reads a prepared data file from public/data/<viz-slug>/,
// located from the project root (see "Génération de site" in
// technical-specifications.md for why not import.meta.url).
export function readDataFile<T>(slug: string, file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', slug, file), 'utf8'));
}

// Ordinal number as written in running text: "1er", "2e" / "1st", "2nd".
export function formatOrdinal(n: number, lang: 'fr' | 'en'): string {
  if (lang === 'fr') return n === 1 ? '1er' : `${n}e`;
  const suffix = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return `${n}${{ one: 'st', two: 'nd', few: 'rd', other: 'th' }[suffix as 'one' | 'two' | 'few' | 'other']}`;
}

// UTC date, with the French ordinal for the first day of a month ("1er avril"),
// which Intl does not produce.
export function formatDate(date: Date, lang: 'fr' | 'en', options: Intl.DateTimeFormatOptions): string {
  const formatted = new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' }).format(date);
  return lang === 'fr' && date.getUTCDate() === 1 ? formatted.replace(/^1 /, '1er ') : formatted;
}
