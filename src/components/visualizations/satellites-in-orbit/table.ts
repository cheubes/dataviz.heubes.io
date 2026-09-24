import { readDataFile, type DataTableBuilder, type DataTableRow } from '../../../scripts/data-table';
import en from '../../../i18n/en';
import fr from '../../../i18n/fr';

interface SatellitesData {
  regions: { id: string; nameFr: string; nameEn: string }[];
  satellites: { regionId: string; launchDate: string }[];
}

export const buildSatellitesInOrbitTable: DataTableBuilder = (lang) => {
  const common = lang === 'fr' ? fr : en;
  const { regions, satellites } = readDataFile<SatellitesData>('satellites-in-orbit', 'satellites.json');
  const count = new Intl.NumberFormat(lang);
  const launchYear = (s: { launchDate: string }) => Number(s.launchDate.slice(0, 4));
  const lastYear = Math.max(...satellites.map(launchYear));

  const row = (header: string, subset: SatellitesData['satellites']): DataTableRow => ({
    header,
    cells: [...regions.map((region) => subset.filter((s) => s.regionId === region.id).length), subset.length].map(
      (n) => count.format(n)
    ),
  });

  const firstDecade = Math.floor(Math.min(...satellites.map(launchYear)) / 10) * 10;
  const decades = Array.from({ length: Math.floor(lastYear / 10) - firstDecade / 10 + 1 }, (_, i) => firstDecade + i * 10);

  return {
    caption: common.satellitesInOrbit.table.caption,
    columns: [
      { label: common.satellitesInOrbit.table.decade, numeric: false },
      ...regions.map((region) => ({ label: lang === 'fr' ? region.nameFr : region.nameEn, numeric: true })),
      { label: common.viz.tableTotal, numeric: true },
    ],
    rows: decades.map((decade) =>
      row(
        `${decade}-${Math.min(decade + 9, lastYear)}`,
        satellites.filter((s) => launchYear(s) >= decade && launchYear(s) <= decade + 9)
      )
    ),
    total: row(common.viz.tableTotal, satellites),
  };
};
