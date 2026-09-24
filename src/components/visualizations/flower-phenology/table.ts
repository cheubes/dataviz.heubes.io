import { readDataFile, type DataTableBuilder } from '../../../scripts/data-table';
import { DECADES, DECADE_RANGE_LABEL, formatDoy, type SpeciesEntry } from './render';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

export const buildFlowerPhenologyTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).flowerPhenology.table;
  const data: SpeciesEntry[] = readDataFile('flower-phenology', 'phenology.json');
  const first = DECADES[0];
  const last = DECADES[DECADES.length - 1];
  const dayCount = new Intl.NumberFormat(lang, { signDisplay: 'exceptZero' });

  return {
    caption: labels.caption,
    columns: [
      { label: labels.species, numeric: false },
      ...DECADES.map((decade) => ({ label: DECADE_RANGE_LABEL[decade], numeric: true })),
      { label: labels.shift, numeric: true },
    ],
    rows: data.map((entry) => {
      const shift = entry.phenology[last].medianDoy - entry.phenology[first].medianDoy;
      return {
        header: lang === 'fr' ? entry.nameFr : entry.nameEn,
        headerNote: entry.species,
        cells: [
          ...DECADES.map((decade) => formatDoy(entry.phenology[decade].medianDoy, lang)),
          // U+2212 minus and a non-breaking space, as the rest of the site's text.
          `${dayCount.format(shift).replace('-', '−')} ${labels.dayUnit}`,
        ],
      };
    }),
  };
};
