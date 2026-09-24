import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import { GROUPS, type Group, type Season } from './render';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

type Counts = Record<Group, Record<Season, number>>;

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

export const buildBiodiversityTable: DataTableBuilder = (lang) => {
  const common = lang === 'fr' ? fr : en;
  const labels = common.biodiversity;
  const { features } = readDataFile<{ features: { properties: { counts: Counts } }[] }>(
    'biodiversity',
    'hexbins.json'
  );
  const count = new Intl.NumberFormat(lang);
  const groupLabel: Record<Group, string> = {
    birds: labels.groupBirds,
    mammals: labels.groupMammals,
    'reptiles-amphibians': labels.groupReptilesAmphibians,
    insects: labels.groupInsects,
    plants: labels.groupPlants,
    fungi: labels.groupFungi,
  };
  const seasonLabel: Record<Season, string> = {
    winter: labels.seasonWinter,
    spring: labels.seasonSpring,
    summer: labels.seasonSummer,
    autumn: labels.seasonAutumn,
  };

  const total = (groups: Group[], season: Season) =>
    features.reduce((sum, f) => sum + groups.reduce((s, group) => s + f.properties.counts[group][season], 0), 0);
  const row = (header: string, groups: Group[]): DataTableRow => {
    const bySeason = SEASONS.map((season) => total(groups, season));
    return { header, cells: [...bySeason, bySeason.reduce((a, b) => a + b, 0)].map((n) => count.format(n)) };
  };

  return {
    caption: labels.table.caption,
    columns: [
      { label: labels.table.group, numeric: false },
      ...SEASONS.map((season) => ({ label: seasonLabel[season], numeric: true })),
      { label: common.viz.tableTotal, numeric: true },
    ],
    rows: GROUPS.map((group) => row(groupLabel[group], [group])),
    total: row(labels.groupAll, GROUPS),
  };
};
