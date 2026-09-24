import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface DensityCell {
  month: number;
  lat: number;
  lng: number;
  count: number;
}

export const buildMonarchMigrationTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).monarchMigration.table;
  const cells = readDataFile<DensityCell[]>('monarch-migration', 'density.json');
  const count = new Intl.NumberFormat(lang);
  const latitude = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const monthName = new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' });

  const row = (header: string, subset: DensityCell[]): DataTableRow => {
    const observations = subset.reduce((sum, c) => sum + c.count, 0);
    const meanLatitude = subset.reduce((sum, c) => sum + c.lat * c.count, 0) / observations;
    return {
      header,
      cells: [
        count.format(observations),
        count.format(new Set(subset.map((c) => `${c.lat},${c.lng}`)).size),
        latitude.format(meanLatitude),
        latitude.format(Math.max(...subset.map((c) => c.lat))),
      ],
    };
  };

  return {
    caption: labels.caption,
    columns: [
      { label: labels.month, numeric: false },
      { label: labels.observations, numeric: true },
      { label: labels.cells, numeric: true },
      { label: labels.meanLatitude, numeric: true },
      { label: labels.northernmost, numeric: true },
    ],
    rows: Array.from({ length: 12 }, (_, i) => {
      const name = monthName.format(new Date(Date.UTC(2001, i, 1)));
      return row(
        name.charAt(0).toUpperCase() + name.slice(1),
        cells.filter((c) => c.month === i + 1)
      );
    }),
    total: row(labels.year, cells),
  };
};
