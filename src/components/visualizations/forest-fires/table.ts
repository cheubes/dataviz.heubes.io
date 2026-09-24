import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface Fire {
  commune: string;
  departmentCode: string;
  year: number;
  burntArea: number;
}

const SQUARE_METERS_PER_HECTARE = 10_000;

export const buildForestFiresTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).forestFires.table;
  const { fires }: { fires: Fire[] } = readDataFile('forest-fires', 'fires.json');
  const count = new Intl.NumberFormat(lang);
  const hectares = (squareMeters: number) => count.format(Math.round(squareMeters / SQUARE_METERS_PER_HECTARE));
  const describeLargest = (fire: Fire) => `${fire.commune} (${fire.departmentCode}), ${hectares(fire.burntArea)} ha`;

  const summarize = (header: string, subset: Fire[]): DataTableRow => {
    const largest = subset.reduce((max, fire) => (fire.burntArea > max.burntArea ? fire : max));
    const totalArea = subset.reduce((sum, fire) => sum + fire.burntArea, 0);
    return { header, cells: [count.format(subset.length), hectares(totalArea), describeLargest(largest)] };
  };

  const years = [...new Set(fires.map((fire) => fire.year))].sort((a, b) => a - b);

  return {
    caption: labels.caption,
    columns: [
      { label: labels.year, numeric: false },
      { label: labels.count, numeric: true },
      { label: labels.area, numeric: true },
      { label: labels.largest, numeric: false },
    ],
    rows: years.map((year) => summarize(String(year), fires.filter((fire) => fire.year === year))),
    total: summarize(`${years[0]}-${years[years.length - 1]}`, fires),
  };
};
