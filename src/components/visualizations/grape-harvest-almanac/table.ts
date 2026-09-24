import { formatDate, formatOrdinal, readDataFile, type DataTableBuilder } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface Region {
  nameFr: string;
  nameEn: string;
  series: { year: number; dayOffset?: number | null }[];
}

// dayOffset counts days after August 31 (see data-model.md).
const OFFSET_ORIGIN_MS = Date.UTC(2001, 7, 31);
const DAY_MS = 86_400_000;

const centuryOf = (year: number) => Math.floor((year - 1) / 100) + 1;

export const buildGrapeHarvestAlmanacTable: DataTableBuilder = (lang) => {
  const common = lang === 'fr' ? fr : en;
  const labels = common.grapeHarvestAlmanac.table;
  const { regions } = readDataFile<{ regions: Region[] }>('grape-harvest-almanac', 'harvest-dates.json');
  const recorded = regions.map((region) =>
    region.series.filter((point): point is { year: number; dayOffset: number } => typeof point.dayOffset === 'number')
  );
  const allYears = recorded.flat().map((point) => point.year);
  const centuries = Array.from(
    { length: centuryOf(Math.max(...allYears)) - centuryOf(Math.min(...allYears)) + 1 },
    (_, i) => centuryOf(Math.min(...allYears)) + i
  );

  // Mean date over the century's recorded years, followed by how many years it
  // rests on: some cells average a single vintage.
  const cell = (points: { year: number; dayOffset: number }[], century: number) => {
    const inCentury = points.filter((point) => centuryOf(point.year) === century);
    if (inCentury.length === 0) return common.viz.notAvailable;
    const meanOffset = Math.round(inCentury.reduce((sum, point) => sum + point.dayOffset, 0) / inCentury.length);
    const date = formatDate(new Date(OFFSET_ORIGIN_MS + meanOffset * DAY_MS), lang, { day: 'numeric', month: 'long' });
    return `${date} (${inCentury.length})`;
  };

  return {
    caption: labels.caption,
    columns: [
      { label: labels.century, numeric: false },
      ...regions.map((region) => ({ label: lang === 'fr' ? region.nameFr : region.nameEn, numeric: true })),
    ],
    rows: centuries.map((century) => ({
      header: `${formatOrdinal(century, lang)} ${lang === 'fr' ? 'siècle' : 'century'}`,
      cells: recorded.map((points) => cell(points, century)),
    })),
  };
};
