import { formatDate, readDataFile, type DataTableBuilder } from '../../../scripts/data-table';
import { durationDays, totalDistanceKm, type TracksData } from './render';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export const buildBirdMigrationsTable: DataTableBuilder = (lang) => {
  const labels = (lang === 'fr' ? fr : en).birdMigrations;
  const { species, tracks } = readDataFile<TracksData>('bird-migrations', 'tracks.json');
  const count = new Intl.NumberFormat(lang);
  const directionLabel = { autumn: labels.directionAutumn, spring: labels.directionSpring };
  const speciesOrder = species.map((s) => s.id);
  const date = (iso: string) => formatDate(new Date(`${iso}T00:00:00Z`), lang, DATE_OPTIONS);

  // Grouped by species (filter order), then individual, autumn before spring.
  const sorted = [...tracks].sort(
    (a, b) =>
      speciesOrder.indexOf(a.speciesId) - speciesOrder.indexOf(b.speciesId) ||
      a.individualId.localeCompare(b.individualId) ||
      (a.direction === 'autumn' ? -1 : 1) - (b.direction === 'autumn' ? -1 : 1)
  );

  return {
    caption: labels.table.caption,
    columns: [
      { label: labels.table.individual, numeric: false },
      { label: labels.directionLabel, numeric: false },
      { label: labels.table.departure, numeric: true },
      { label: labels.table.arrival, numeric: true },
      { label: labels.table.duration, numeric: true },
      { label: labels.table.distance, numeric: true },
    ],
    rows: sorted.map((track) => {
      const bird = species.find((s) => s.id === track.speciesId)!;
      return {
        header: `${lang === 'fr' ? bird.nameFr : bird.nameEn} (${track.individualId})`,
        cells: [
          directionLabel[track.direction as 'autumn' | 'spring'],
          date(track.points[0].date),
          date(track.points[track.points.length - 1].date),
          count.format(durationDays(track.points)),
          count.format(Math.round(totalDistanceKm(track.points))),
        ],
      };
    }),
  };
};
