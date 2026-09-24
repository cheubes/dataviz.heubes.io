import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface Earthquake {
  year: number;
  magnitude: number;
  place: string;
}

export const buildEarthquakesTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).earthquakes.table;
  const { earthquakes } = readDataFile<{ earthquakes: Earthquake[] }>('earthquakes', 'earthquakes.json');
  const count = new Intl.NumberFormat(lang);
  const magnitude = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const years = earthquakes.map((e) => e.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const row = (header: string, subset: Earthquake[]): DataTableRow => {
    // Earliest wins a tie: the catalog is sorted chronologically.
    const strongest = subset.reduce((max, e) => (e.magnitude > max.magnitude ? e : max));
    return {
      header,
      cells: [
        count.format(subset.length),
        count.format(subset.filter((e) => e.magnitude >= 7).length),
        count.format(subset.filter((e) => e.magnitude >= 8).length),
        // USGS event names often already carry the year ("2011 Great Tohoku Earthquake").
        [strongest.place, ...(strongest.place.includes(String(strongest.year)) ? [] : [String(strongest.year)])]
          .concat(`M ${magnitude.format(strongest.magnitude)}`)
          .join(', '),
      ],
    };
  };

  const firstDecade = Math.floor(firstYear / 10) * 10;
  const decades = Array.from({ length: Math.floor(lastYear / 10) - firstDecade / 10 + 1 }, (_, i) => firstDecade + i * 10);

  return {
    caption: labels.caption,
    columns: [
      { label: labels.decade, numeric: false },
      { label: labels.count, numeric: true },
      { label: labels.magnitude7, numeric: true },
      { label: labels.magnitude8, numeric: true },
      { label: labels.strongest, numeric: false },
    ],
    rows: decades.map((decade) =>
      row(
        `${decade}-${Math.min(decade + 9, lastYear)}`,
        earthquakes.filter((e) => e.year >= decade && e.year <= decade + 9)
      )
    ),
    total: row(`${firstYear}-${lastYear}`, earthquakes),
  };
};
