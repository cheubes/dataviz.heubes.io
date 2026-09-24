import { readDataFile, type DataTableBuilder } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface Species {
  nameFr: string;
  nameEn: string;
  unit: 'individuals' | 'burrows';
  counts: { year: number; population: number }[];
}

export const buildEndangeredSpeciesTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).endangeredSpecies;
  const { species } = readDataFile<{ species: Species[] }>('endangered-species', 'species.json');
  const count = new Intl.NumberFormat(lang);
  const unitLabel = { individuals: labels.unitIndividuals, burrows: labels.unitBurrows };

  return {
    caption: labels.table.caption,
    columns: [
      { label: labels.table.species, numeric: false },
      { label: labels.table.year, numeric: true },
      { label: labels.table.population, numeric: true },
      { label: labels.table.unit, numeric: false },
    ],
    rows: species.flatMap((entry) =>
      [...entry.counts]
        .sort((a, b) => a.year - b.year)
        .map((census) => ({
          header: lang === 'fr' ? entry.nameFr : entry.nameEn,
          cells: [String(census.year), count.format(census.population), unitLabel[entry.unit]],
        }))
    ),
  };
};
