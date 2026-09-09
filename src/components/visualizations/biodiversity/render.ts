import { geoMercator, geoPath } from 'd3-geo';
import { scaleSqrt } from 'd3-scale';
// topojson-client ships no bundled types; resolves to `any` under this project's
// moduleResolution setting, same accepted gap as bird-migrations/render.ts.
import { feature as topojsonFeature } from 'topojson-client';

type Group = 'birds' | 'mammals' | 'reptiles-amphibians' | 'insects' | 'plants' | 'fungi';
type GroupFilter = Group | 'all';
type Season = 'winter' | 'spring' | 'summer' | 'autumn';
type SeasonFilter = Season | 'all';

interface HexProperties {
  h3: string;
  counts: Record<Group, Record<Season, number>>;
  topSpecies: Partial<Record<Group, string>>;
}

interface HexFeature {
  type: 'Feature';
  properties: HexProperties;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface HexbinsData {
  type: 'FeatureCollection';
  features: HexFeature[];
}

interface LiveOccurrence {
  decimalLatitude: number;
  decimalLongitude: number;
}

export interface BiodiversityLabels {
  loading: string;
  error: string;
  empty: string;
  groupLabel: string;
  groupAll: string;
  groupBirds: string;
  groupMammals: string;
  groupReptilesAmphibians: string;
  groupInsects: string;
  groupPlants: string;
  groupFungi: string;
  seasonLabel: string;
  seasonAll: string;
  seasonWinter: string;
  seasonSpring: string;
  seasonSummer: string;
  seasonAutumn: string;
  liveToggle: string;
  liveLoading: string;
  liveError: string;
  liveBackToDefault: string;
  liveEmpty: string;
  liveDisclaimer: string;
  tooltipCount: string;
  tooltipDominant: string;
  tooltipSpecies: string;
}

const GROUPS: Group[] = ['birds', 'mammals', 'reptiles-amphibians', 'insects', 'plants', 'fungi'];
const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

const GROUP_COLOR: Record<Group, string> = {
  birds: '#2a78d6',
  mammals: '#eb6834',
  'reptiles-amphibians': '#1baf7a',
  insects: '#eda100',
  plants: '#e87ba4',
  fungi: '#008300',
};

const SEQUENTIAL_BLUE: [string, string] = ['#cde2fb', '#0d366b'];

const GROUP_TAXON_KEYS: Record<Group, number[]> = {
  birds: [212],
  mammals: [359],
  'reptiles-amphibians': [11418114, 11592253, 11493978, 131],
  insects: [216],
  plants: [7707728],
  fungi: [5],
};

const SEASON_MONTHS: Record<Season, number[]> = {
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
};

const LIVE_RESULT_LIMIT = 300;

function mix(hexA: string, hexB: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hexA.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(hexB.slice(i, i + 2), 16));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function cellValue(counts: Record<Group, Record<Season, number>>, group: GroupFilter, season: SeasonFilter): number {
  const groups = group === 'all' ? GROUPS : [group];
  const seasons = season === 'all' ? SEASONS : [season];
  let total = 0;
  for (const g of groups) for (const s of seasons) total += counts[g][s];
  return total;
}

function dominantGroup(counts: Record<Group, Record<Season, number>>, season: SeasonFilter): Group | null {
  let best: Group | null = null;
  let bestValue = 0;
  for (const g of GROUPS) {
    const value = cellValue(counts, g, season);
    if (value > bestValue) {
      best = g;
      bestValue = value;
    }
  }
  return best;
}

export async function mountBiodiversity(root: HTMLElement, lang: 'fr' | 'en', labels: BiodiversityLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-biodiversity');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-biodiversity__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: HexbinsData;
  let basemapTopology: any;
  try {
    const [hexRes, basemapRes] = await Promise.all([
      fetch('/data/biodiversity/hexbins.json'),
      fetch('/data/biodiversity/basemap.json'),
    ]);
    if (!hexRes.ok || !basemapRes.ok) throw new Error('fetch failed');
    data = await hexRes.json();
    basemapTopology = await basemapRes.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.features.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const groupLabelOf: Record<Group, string> = {
    birds: labels.groupBirds,
    mammals: labels.groupMammals,
    'reptiles-amphibians': labels.groupReptilesAmphibians,
    insects: labels.groupInsects,
    plants: labels.groupPlants,
    fungi: labels.groupFungi,
  };
  const seasonLabelOf: Record<Season, string> = {
    winter: labels.seasonWinter,
    spring: labels.seasonSpring,
    summer: labels.seasonSummer,
    autumn: labels.seasonAutumn,
  };

  // --- Layout -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-biodiversity__controls';
  root.appendChild(controls);

  const filtersRow = document.createElement('div');
  filtersRow.className = 'dv-biodiversity__controls-row';
  controls.appendChild(filtersRow);

  let activeGroup: GroupFilter = 'all';
  let activeSeason: SeasonFilter = 'all';

  const groupGroup = document.createElement('div');
  groupGroup.className = 'dv-biodiversity__control-group';
  groupGroup.setAttribute('role', 'radiogroup');
  groupGroup.setAttribute('aria-label', labels.groupLabel);
  filtersRow.appendChild(groupGroup);

  function buildRadioOption(
    container: HTMLElement,
    name: string,
    text: string,
    checked: boolean,
    swatchColor: string | null,
    onChange: () => void
  ): void {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'dv-biodiversity__toggle';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.checked = checked;
    input.addEventListener('change', () => {
      if (input.checked) onChange();
    });
    optionLabel.appendChild(input);
    if (swatchColor) {
      const swatch = document.createElement('span');
      swatch.className = 'dv-biodiversity__swatch';
      swatch.style.backgroundColor = swatchColor;
      optionLabel.appendChild(swatch);
    }
    optionLabel.appendChild(document.createTextNode(text));
    container.appendChild(optionLabel);
  }

  buildRadioOption(groupGroup, 'dv-biodiversity-group', labels.groupAll, true, null, () => {
    activeGroup = 'all';
    handleFilterChange();
  });
  GROUPS.forEach((g) => {
    buildRadioOption(groupGroup, 'dv-biodiversity-group', groupLabelOf[g], false, GROUP_COLOR[g], () => {
      activeGroup = g;
      handleFilterChange();
    });
  });

  const seasonGroup = document.createElement('div');
  seasonGroup.className = 'dv-biodiversity__control-group';
  seasonGroup.setAttribute('role', 'radiogroup');
  seasonGroup.setAttribute('aria-label', labels.seasonLabel);
  filtersRow.appendChild(seasonGroup);

  buildRadioOption(seasonGroup, 'dv-biodiversity-season', labels.seasonAll, true, null, () => {
    activeSeason = 'all';
    handleFilterChange();
  });
  SEASONS.forEach((s) => {
    buildRadioOption(seasonGroup, 'dv-biodiversity-season', seasonLabelOf[s], false, null, () => {
      activeSeason = s;
      handleFilterChange();
    });
  });

  const liveRow = document.createElement('div');
  liveRow.className = 'dv-biodiversity__controls-row';
  controls.appendChild(liveRow);

  const liveToggleLabel = document.createElement('label');
  liveToggleLabel.className = 'dv-biodiversity__toggle';
  const liveToggleInput = document.createElement('input');
  liveToggleInput.type = 'checkbox';
  liveToggleLabel.append(liveToggleInput, document.createTextNode(labels.liveToggle));
  liveRow.appendChild(liveToggleLabel);

  const liveStatus = document.createElement('span');
  liveStatus.className = 'dv-biodiversity__live-status';
  liveRow.appendChild(liveStatus);

  const stage = document.createElement('div');
  stage.className = 'dv-biodiversity__stage';
  root.appendChild(stage);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'dv-biodiversity__svg');
  stage.appendChild(svg);

  const mapRoot = document.createElementNS(svgNS, 'g');
  const basemapLayer = document.createElementNS(svgNS, 'g');
  const hexLayer = document.createElementNS(svgNS, 'g');
  const liveLayer = document.createElementNS(svgNS, 'g');
  liveLayer.setAttribute('class', 'dv-biodiversity__live-points');
  mapRoot.append(basemapLayer, hexLayer, liveLayer);
  svg.appendChild(mapRoot);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-biodiversity__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-biodiversity__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  const liveDisclaimer = document.createElement('p');
  liveDisclaimer.className = 'dv-biodiversity__live-disclaimer';
  liveDisclaimer.textContent = labels.liveDisclaimer;
  liveDisclaimer.hidden = true;
  stage.appendChild(liveDisclaimer);

  // --- Projection ---------------------------------------------------------
  const franceFeature = topojsonFeature(basemapTopology, basemapTopology.objects.france);
  const projection = geoMercator();
  const path = geoPath(projection);
  let width = 0;
  let height = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    // France's silhouette is close to square once longitude is compressed by
    // latitude (~cos(46°)), unlike bird-migrations' wide Europe/Africa frame.
    height = Math.max(420, rect.width * 0.95);
    stage.style.height = `${height}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    projection.fitExtent(
      [
        [16, 16],
        [width - 16, height - 16],
      ],
      franceFeature as any
    );

    basemapLayer.innerHTML = '';
    const basemapPath = document.createElementNS(svgNS, 'path');
    basemapPath.setAttribute('d', path(franceFeature as any) ?? '');
    basemapPath.setAttribute('class', 'dv-biodiversity__basemap');
    basemapLayer.appendChild(basemapPath);

    renderMap();
    if (liveToggleInput.checked) renderLivePoints(lastLiveResults);
  }

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // --- Hex grid rendering ---------------------------------------------------
  let pinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    pinned = false;
  }

  function showTooltip(feature: HexFeature, clientX: number, clientY: number) {
    const value = cellValue(feature.properties.counts, activeGroup, activeSeason);
    const lines = [`<strong>${labels.tooltipCount} ${value.toLocaleString(lang)}</strong>`];
    if (activeGroup === 'all') {
      const dominant = dominantGroup(feature.properties.counts, activeSeason);
      if (dominant) {
        lines.push(`${labels.tooltipDominant} ${groupLabelOf[dominant]}`);
        const species = feature.properties.topSpecies[dominant];
        if (species) lines.push(`${labels.tooltipSpecies} <em>${species}</em>`);
      }
    } else {
      const species = feature.properties.topSpecies[activeGroup];
      if (species) lines.push(`${labels.tooltipSpecies} <em>${species}</em>`);
    }
    tooltip.innerHTML = lines.join('<br>');
    const stageRect = stage.getBoundingClientRect();
    tooltip.style.left = `${clientX - stageRect.left + 12}px`;
    tooltip.style.top = `${clientY - stageRect.top + 12}px`;
    tooltip.hidden = false;
  }

  function renderMap() {
    const values = data.features.map((f) => cellValue(f.properties.counts, activeGroup, activeSeason));
    const maxValue = Math.max(0, ...values);
    const isEmpty = maxValue === 0;

    emptyMessage.hidden = !isEmpty;
    svg.style.visibility = isEmpty ? 'hidden' : 'visible';
    if (isEmpty) return;

    const range: [string, string] =
      activeGroup === 'all' ? SEQUENTIAL_BLUE : [mix(GROUP_COLOR[activeGroup], '#ffffff', 0.85), GROUP_COLOR[activeGroup]];
    const colorScale = scaleSqrt<string>().domain([0, maxValue]).range(range).clamp(true);

    hexLayer.innerHTML = '';
    data.features.forEach((f) => {
      const value = cellValue(f.properties.counts, activeGroup, activeSeason);
      const hexPath = document.createElementNS(svgNS, 'path');
      hexPath.setAttribute('d', path(f.geometry as any) ?? '');
      hexPath.setAttribute('class', 'dv-biodiversity__hex');
      hexPath.setAttribute('fill', value === 0 ? 'var(--dv-surface)' : colorScale(value));
      hexPath.setAttribute('stroke', 'var(--dv-gridline)');
      hexPath.setAttribute('stroke-width', '0.5');

      function handleShow(event: PointerEvent) {
        if (pinned && event.type !== 'click') return;
        showTooltip(f, event.clientX, event.clientY);
      }
      hexPath.addEventListener('pointerenter', (event) => {
        if ((event as PointerEvent).pointerType === 'touch' || pinned) return;
        handleShow(event as PointerEvent);
      });
      hexPath.addEventListener('pointermove', (event) => {
        if ((event as PointerEvent).pointerType === 'touch' || pinned) return;
        handleShow(event as PointerEvent);
      });
      hexPath.addEventListener('pointerleave', () => {
        if (!pinned) hideTooltip();
      });
      hexPath.addEventListener('click', (event) => {
        event.stopPropagation();
        pinned = true;
        handleShow(event as unknown as PointerEvent);
      });

      hexLayer.appendChild(hexPath);
    });
  }

  stage.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!target.closest('.dv-biodiversity__hex')) hideTooltip();
  });

  // --- Live data mode --------------------------------------------------------
  let lastLiveResults: LiveOccurrence[] = [];
  let liveRequestToken = 0;

  function renderLivePoints(occurrences: LiveOccurrence[]) {
    liveLayer.innerHTML = '';
    occurrences.forEach((o) => {
      const p = projection([o.decimalLongitude, o.decimalLatitude]);
      if (!p) return;
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', String(p[0]));
      circle.setAttribute('cy', String(p[1]));
      circle.setAttribute('r', '2.5');
      circle.setAttribute('class', 'dv-biodiversity__live-point');
      liveLayer.appendChild(circle);
    });
  }

  async function fetchLiveOccurrences(group: GroupFilter, season: SeasonFilter): Promise<LiveOccurrence[]> {
    const params = new URLSearchParams();
    params.set('country', 'FR');
    params.set('hasCoordinate', 'true');
    params.set('hasGeospatialIssue', 'false');
    params.set('limit', String(LIVE_RESULT_LIMIT));
    if (group !== 'all') {
      for (const key of GROUP_TAXON_KEYS[group]) params.append('taxonKey', String(key));
    }
    if (season !== 'all') {
      for (const month of SEASON_MONTHS[season]) params.append('month', String(month));
    }
    const res = await fetch(`https://api.gbif.org/v1/occurrence/search?${params}`);
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    return (json.results ?? []) as LiveOccurrence[];
  }

  async function refreshLiveData() {
    if (!liveToggleInput.checked) return;
    const token = ++liveRequestToken;
    liveStatus.textContent = labels.liveLoading;
    liveDisclaimer.hidden = true;
    try {
      const occurrences = await fetchLiveOccurrences(activeGroup, activeSeason);
      if (token !== liveRequestToken) return;
      lastLiveResults = occurrences;
      renderLivePoints(occurrences);
      liveStatus.textContent = occurrences.length === 0 ? labels.liveEmpty : '';
      liveDisclaimer.hidden = occurrences.length === 0;
    } catch {
      if (token !== liveRequestToken) return;
      liveStatus.textContent = `${labels.liveError} ${labels.liveBackToDefault}`;
    }
  }

  liveToggleInput.addEventListener('change', () => {
    if (liveToggleInput.checked) {
      refreshLiveData();
    } else {
      liveRequestToken++;
      lastLiveResults = [];
      liveLayer.innerHTML = '';
      liveStatus.textContent = '';
      liveDisclaimer.hidden = true;
    }
  });

  // functional-specifications.md: "un changement de filtre... relance
  // automatiquement la requête" while live mode is active. resize() re-renders
  // the map on its own and only needs the existing live points reprojected
  // (handled inline there), never a fresh fetch, so it calls renderMap()
  // directly instead of going through this.
  function handleFilterChange() {
    renderMap();
    if (liveToggleInput.checked) refreshLiveData();
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(stage);
  resize();
}
