import { formatOrdinal, readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

// Column-oriented file: one array per attribute, same index for the same tree.
interface TreesData {
  genera: { id: string; nameFr: string; nameEn: string }[];
  trees: { district: number[]; genusId: number[]; remarkable: boolean[] };
}

export const buildParisTreesTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).parisTrees.table;
  const { genera, trees } = readDataFile<TreesData>('paris-trees', 'trees.json');
  const count = new Intl.NumberFormat(lang);
  const share = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 0 });
  const indexes = trees.district.map((_, i) => i);

  const row = (header: string, subset: number[]): DataTableRow => {
    const perGenus = new Map<number, number>();
    // "other" pools every minor genus: it outnumbers even plane trees, so it is
    // left out of the dominant-genus pick rather than winning everywhere.
    for (const i of subset) {
      if (genera[trees.genusId[i]].id !== 'other') perGenus.set(trees.genusId[i], (perGenus.get(trees.genusId[i]) ?? 0) + 1);
    }
    const [dominantId, dominantCount] = [...perGenus].reduce((max, entry) => (entry[1] > max[1] ? entry : max));
    const genus = genera[dominantId];
    return {
      header,
      cells: [
        count.format(subset.length),
        `${lang === 'fr' ? genus.nameFr : genus.nameEn} (${share.format(dominantCount / subset.length)})`,
        count.format(subset.filter((i) => trees.remarkable[i]).length),
      ],
    };
  };

  const districts = [...new Set(trees.district)].sort((a, b) => a - b);

  return {
    caption: labels.caption,
    columns: [
      { label: labels.district, numeric: false },
      { label: labels.trees, numeric: true },
      { label: labels.dominant, numeric: false },
      { label: labels.remarkable, numeric: true },
    ],
    rows: districts.map((district) =>
      row(formatOrdinal(district, lang), indexes.filter((i) => trees.district[i] === district))
    ),
    total: row(labels.city, indexes),
  };
};
