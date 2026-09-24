import { readDataFile, type DataTableBuilder } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface SkyBins {
  scale: { id: number; nameFr: string; nameEn: string }[];
  years: number[];
  features: { properties: { byYear: Record<string, { scale: number } | undefined> } }[];
}

export const buildLightPollutionTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).lightPollution.table;
  const { scale, years, features } = readDataFile<SkyBins>('light-pollution', 'skybins.json');
  const levels = [...scale].sort((a, b) => a.id - b.id);
  const share = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 });

  return {
    caption: labels.caption,
    columns: [
      { label: labels.year, numeric: false },
      ...levels.map((level) => ({ label: lang === 'fr' ? level.nameFr : level.nameEn, numeric: true })),
    ],
    // Grid cells all have the same area, so a share of cells is a share of the territory.
    rows: years.map((year) => {
      const measured = features.map((f) => f.properties.byYear[year]?.scale).filter((s) => s !== undefined);
      return {
        header: String(year),
        cells: levels.map((level) => share.format(measured.filter((s) => s === level.id).length / measured.length)),
      };
    }),
  };
};
