import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import { periodLabel, type RawMonument } from './render';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

export const buildMonumentLayersTable: DataTableBuilder = (lang) => {
  const common = lang === 'fr' ? fr : en;
  const labels = common.monumentLayers;
  const { monuments } = readDataFile<{ monuments: RawMonument[] }>('monument-layers', 'monuments.json');
  const count = new Intl.NumberFormat(lang);

  // Same period labels as the visualization: an era when the record has one,
  // otherwise its century.
  const periods = new Map<string, { earliest: number; monuments: RawMonument[] }>();
  for (const monument of monuments) {
    const label = periodLabel(monument, lang, labels);
    const period = periods.get(label) ?? { earliest: monument.constructionYear, monuments: [] };
    period.earliest = Math.min(period.earliest, monument.constructionYear);
    period.monuments.push(monument);
    periods.set(label, period);
  }

  const row = (header: string, subset: RawMonument[]): DataTableRow => {
    const classified = subset.filter((m) => m.protection === 'classe').length;
    return { header, cells: [classified, subset.length - classified, subset.length].map((n) => count.format(n)) };
  };

  return {
    caption: labels.table.caption,
    columns: [
      { label: labels.table.period, numeric: false },
      { label: labels.table.classified, numeric: true },
      { label: labels.table.registered, numeric: true },
      { label: common.viz.tableTotal, numeric: true },
    ],
    rows: [...periods]
      .sort(([, a], [, b]) => a.earliest - b.earliest)
      .map(([label, period]) => row(label, period.monuments)),
    total: row(common.viz.tableTotal, monuments),
  };
};
