import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface CommuneProperties {
  dep: string;
  apl: number;
  apl65: number;
  population: number;
}

// Same threshold as the map's color scale (see "Palette" in technical-specifications.md).
const APL_THRESHOLD = 1.5;

// Official names from INSEE's Code officiel géographique: communes.json only
// carries department codes. Proper nouns, identical in both languages.
const DEPARTMENT_NAMES: Record<string, string> = {
  '01': 'Ain',
  '02': 'Aisne',
  '03': 'Allier',
  '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes',
  '07': 'Ardèche',
  '08': 'Ardennes',
  '09': 'Ariège',
  '10': 'Aube',
  '11': 'Aude',
  '12': 'Aveyron',
  '13': 'Bouches-du-Rhône',
  '14': 'Calvados',
  '15': 'Cantal',
  '16': 'Charente',
  '17': 'Charente-Maritime',
  '18': 'Cher',
  '19': 'Corrèze',
  '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse',
  '21': "Côte-d'Or",
  '22': "Côtes-d'Armor",
  '23': 'Creuse',
  '24': 'Dordogne',
  '25': 'Doubs',
  '26': 'Drôme',
  '27': 'Eure',
  '28': 'Eure-et-Loir',
  '29': 'Finistère',
  '30': 'Gard',
  '31': 'Haute-Garonne',
  '32': 'Gers',
  '33': 'Gironde',
  '34': 'Hérault',
  '35': 'Ille-et-Vilaine',
  '36': 'Indre',
  '37': 'Indre-et-Loire',
  '38': 'Isère',
  '39': 'Jura',
  '40': 'Landes',
  '41': 'Loir-et-Cher',
  '42': 'Loire',
  '43': 'Haute-Loire',
  '44': 'Loire-Atlantique',
  '45': 'Loiret',
  '46': 'Lot',
  '47': 'Lot-et-Garonne',
  '48': 'Lozère',
  '49': 'Maine-et-Loire',
  '50': 'Manche',
  '51': 'Marne',
  '52': 'Haute-Marne',
  '53': 'Mayenne',
  '54': 'Meurthe-et-Moselle',
  '55': 'Meuse',
  '56': 'Morbihan',
  '57': 'Moselle',
  '58': 'Nièvre',
  '59': 'Nord',
  '60': 'Oise',
  '61': 'Orne',
  '62': 'Pas-de-Calais',
  '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées',
  '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin',
  '68': 'Haut-Rhin',
  '69': 'Rhône',
  '70': 'Haute-Saône',
  '71': 'Saône-et-Loire',
  '72': 'Sarthe',
  '73': 'Savoie',
  '74': 'Haute-Savoie',
  '75': 'Paris',
  '76': 'Seine-Maritime',
  '77': 'Seine-et-Marne',
  '78': 'Yvelines',
  '79': 'Deux-Sèvres',
  '80': 'Somme',
  '81': 'Tarn',
  '82': 'Tarn-et-Garonne',
  '83': 'Var',
  '84': 'Vaucluse',
  '85': 'Vendée',
  '86': 'Vienne',
  '87': 'Haute-Vienne',
  '88': 'Vosges',
  '89': 'Yonne',
  '90': 'Territoire de Belfort',
  '91': 'Essonne',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne',
  '95': "Val-d'Oise",
};

// Corsica's 2A and 2B sort where the former department 20 stood.
const sortKey = (code: string) => code.replace(/^2([AB])$/, (_, letter: string) => `20${letter}`);

export const buildMedicalDesertsTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).medicalDeserts.table;
  const topology = readDataFile<{ objects: { communes: { geometries: { properties: CommuneProperties }[] } } }>(
    'medical-deserts',
    'communes.json'
  );
  const communes = topology.objects.communes.geometries.map((geometry) => geometry.properties);
  const integer = new Intl.NumberFormat(lang);
  const apl = new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const share = new Intl.NumberFormat(lang, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const threshold = new Intl.NumberFormat(lang).format(APL_THRESHOLD);

  // APL of an area: mean of its communes' APL weighted by their population.
  const summarize = (header: string, subset: CommuneProperties[]): DataTableRow => {
    const population = subset.reduce((sum, c) => sum + c.population, 0);
    const weighted = (value: (c: CommuneProperties) => number) =>
      subset.reduce((sum, c) => sum + value(c) * c.population, 0) / population;
    return {
      header,
      cells: [
        integer.format(population),
        apl.format(weighted((c) => c.apl)),
        apl.format(weighted((c) => c.apl65)),
        share.format(weighted((c) => (c.apl < APL_THRESHOLD ? 1 : 0))),
        share.format(weighted((c) => (c.apl65 < APL_THRESHOLD ? 1 : 0))),
      ],
    };
  };

  const codes = [...new Set(communes.map((c) => c.dep))].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  return {
    caption: labels.caption,
    columns: [
      { label: labels.department, numeric: false },
      { label: labels.population, numeric: true },
      { label: labels.aplToday, numeric: true },
      { label: labels.aplTomorrow, numeric: true },
      { label: labels.belowToday.replace('{threshold}', threshold), numeric: true },
      { label: labels.belowTomorrow.replace('{threshold}', threshold), numeric: true },
    ],
    rows: codes.map((code) =>
      summarize(
        `${code} ${DEPARTMENT_NAMES[code] ?? ''}`.trim(),
        communes.filter((c) => c.dep === code)
      )
    ),
    total: summarize(labels.total, communes),
  };
};
