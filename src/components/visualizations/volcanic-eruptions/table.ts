import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface Eruption {
  volcanoId: string;
  year: number;
  vei: number | null;
}

export const buildVolcanicEruptionsTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).volcanicEruptions;
  const { eruptions } = readDataFile<{ eruptions: Eruption[] }>('volcanic-eruptions', 'eruptions.json');
  const count = new Intl.NumberFormat(lang);
  // Same year format as the visualization's year indicator.
  const yearFormatter = new Intl.NumberFormat(lang, { useGrouping: false });
  const formatYear = (year: number) =>
    year < 0 ? `${yearFormatter.format(-year)} ${labels.yearBcSuffix}` : yearFormatter.format(year);
  const years = eruptions.map((e) => e.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const row = (header: string, subset: Eruption[]): DataTableRow => ({
    header,
    cells: [
      subset.length,
      subset.filter((e) => e.vei !== null && e.vei >= 4).length,
      new Set(subset.map((e) => e.volcanoId)).size,
    ].map((n) => count.format(n)),
  });

  const firstMillennium = Math.floor(firstYear / 1000) * 1000;
  const millennia = Array.from(
    { length: Math.floor(lastYear / 1000) - firstMillennium / 1000 + 1 },
    (_, i) => firstMillennium + i * 1000
  );
  const range = (start: number, end: number) => `${formatYear(start)} ${labels.table.to} ${formatYear(end)}`;

  return {
    caption: labels.table.caption,
    columns: [
      { label: labels.table.millennium, numeric: false },
      { label: labels.table.eruptions, numeric: true },
      { label: labels.table.vei4, numeric: true },
      { label: labels.table.activeVolcanoes, numeric: true },
    ],
    rows: millennia.map((start) =>
      row(
        range(start, Math.min(start + 999, lastYear)),
        eruptions.filter((e) => e.year >= start && e.year <= start + 999)
      )
    ),
    total: row(range(firstYear, lastYear), eruptions),
  };
};
