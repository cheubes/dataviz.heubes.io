import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// moduleResolution setting, same accepted gap as biodiversity/render.ts.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

type Era =
  | 'paleolithic'
  | 'mesolithic'
  | 'neolithic'
  | 'chalcolithic'
  | 'bronzeAge'
  | 'ironAge'
  | 'galloRoman'
  | 'middleAges'
  | 'earlyModern';

type Protection = 'classe' | 'inscrit';
type ProtectionFilter = Protection | 'all';

interface Department {
  code: string;
  nameFr: string;
  nameEn: string;
}

interface RawMonument {
  name: string;
  commune: string;
  lat: number;
  lng: number;
  departmentCode: string;
  constructionYear: number;
  protection: Protection;
  category: string;
  reference: string;
  era?: Era;
}

interface MonumentsData {
  generatedAt: string;
  departments: Department[];
  monuments: RawMonument[];
}

// Raw geometry, no Feature/properties wrapper (purely decorative), same shape
// as paris-trees' streets.json/seine.json.
interface MultiLineStringData {
  type: 'MultiLineString';
  coordinates: number[][][];
}

export interface MonumentLayersLabels {
  loading: string;
  error: string;
  empty: string;
  countLabel: string;
  protectionLabel: string;
  protectionAll: string;
  protectionClasse: string;
  protectionInscrit: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  yearLabel: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  communeLabel: string;
  categoryLabel: string;
  viewRecordLabel: string;
  centuryBcSuffix: string;
  eraPaleolithic: string;
  eraMesolithic: string;
  eraNeolithic: string;
  eraChalcolithic: string;
  eraBronzeAge: string;
  eraIronAge: string;
  eraGalloRoman: string;
  eraMiddleAges: string;
  eraEarlyModern: string;
}

// Same two endpoints as SEQUENTIAL_BLUE in biodiversity/render.ts (style-guide.md
// "Palette dataviz", paliers 100/700): oldest monuments lightest, most recent darkest.
const SEQUENTIAL_BLUE: [string, string] = ['#cde2fb', '#0d366b'];

// Monuments older than year 0 are painted as a static backdrop at mount instead
// of part of the animated sweep (technical-specifications.md "Animation"): a
// strict linear scale across the full -20000..today range would compress the
// medieval/modern waves (90% of all monuments) into the last few percent of
// playback time, decision validated with the user after measuring the real
// distribution (see "Points tranchés à l'implémentation").
const PRELUDE_CUTOFF_YEAR = 0;
const TOTAL_DURATION_MS = 30_000;

type Speed = 'slow' | 'normal' | 'fast';
// Same convention and factors as satellites-in-orbit/render.ts and
// light-pollution/render.ts.
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };
// Pause on the fully-built map before a pass loops back to the socle, same
// "hold on the culmination" pattern as satellites-in-orbit (see "Lecture
// automatique" in functional-specifications.md).
const HOLD_AT_END_MS = 2_500;

const POINT_RADIUS_PX = 1.8;
const HIT_RADIUS_PADDING_PX = 3;
const GRID_CELL_SIZE = 40;
const BASEMAP_FILL = '#e4e2da';
const BASEMAP_STROKE = '#acb2b8';
// Same blue as paris-trees' Seine (SEINE_COLOR): a soft, cool tone reserved
// for water on this map, distinct from the warm road tone below and from the
// monument color scale (which only ever fills small dots, never a stroke).
const RIVER_COLOR = '#a8c5da';
const RIVER_LINE_WIDTH_PX = 1.5;
// Warm tan rather than paris-trees' near-invisible street color (#f4f2ec):
// this layer is a nationwide motorway/trunk-road network, not a dense local
// street grid, so it needs enough contrast to actually read as "roads"
// rather than disappear into the fill.
const ROAD_COLOR = '#c9a97e';
const ROAD_LINE_WIDTH_PX = 1;
// Higher than paris-trees' 40: the initial view spans all of mainland France
// (~1,000 km) rather than a single city, so reaching a comparable ground
// scale (distinguishing individual nearby monuments within a town, or the
// road-network detail added above, see ROAD_COLOR above) needs a
// proportionally larger zoom factor. Raised again from 200 to 1000 after
// user feedback that 200 (regional scale, ~5 km wide view) still
// wasn't enough to separate monuments within a single town.
const MAX_ZOOM = 1000;
// Same step as paris-trees' zoom buttons.
const ZOOM_BUTTON_STEP = 1.5;

function ordinalFr(n: number): string {
  return n === 1 ? '1er' : `${n}e`;
}

function ordinalEn(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// Century recovered from the representative year rather than stored separately:
// for a genuine numeric-century record, constructionYear is exactly
// (century - 1) * 100 + 50 (data-model.md "Interprétation du siècle de
// construction"), so this inverse is lossless for those records.
function centuryLabel(year: number, lang: 'fr' | 'en', labels: MonumentLayersLabels): string {
  const bc = year < 0;
  const century = Math.floor(Math.abs(year) / 100) + 1;
  const number = lang === 'fr' ? ordinalFr(century) : ordinalEn(century);
  const unit = lang === 'fr' ? 'siècle' : 'century';
  return bc ? `${number} ${unit} ${labels.centuryBcSuffix}` : `${number} ${unit}`;
}

function eraLabel(era: Era, labels: MonumentLayersLabels): string {
  switch (era) {
    case 'paleolithic':
      return labels.eraPaleolithic;
    case 'mesolithic':
      return labels.eraMesolithic;
    case 'neolithic':
      return labels.eraNeolithic;
    case 'chalcolithic':
      return labels.eraChalcolithic;
    case 'bronzeAge':
      return labels.eraBronzeAge;
    case 'ironAge':
      return labels.eraIronAge;
    case 'galloRoman':
      return labels.eraGalloRoman;
    case 'middleAges':
      return labels.eraMiddleAges;
    case 'earlyModern':
      return labels.eraEarlyModern;
  }
}

function periodLabel(m: RawMonument, lang: 'fr' | 'en', labels: MonumentLayersLabels): string {
  return m.era ? eraLabel(m.era, labels) : centuryLabel(m.constructionYear, lang, labels);
}

// Official Ministry of Culture record for this Mérimée reference (data-model.md
// "Format de sortie"), same platform for every notice regardless of when it
// was last updated.
function merimeeUrl(reference: string): string {
  return `https://www.pop.culture.gouv.fr/notice/merimee/${reference}`;
}

export async function mountMonumentLayers(root: HTMLElement, lang: 'fr' | 'en', labels: MonumentLayersLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-monument-layers');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-monument-layers__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: MonumentsData;
  let basemapTopology: any;
  let riversData: MultiLineStringData;
  let roadsData: MultiLineStringData;
  try {
    const fetchJson = <T,>(url: string) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<T>;
      });
    const [dataResult, basemapResult, riversResult, roadsResult] = await Promise.all([
      fetchJson<MonumentsData>('/data/monument-layers/monuments.json'),
      fetchJson<any>('/data/monument-layers/basemap.json'),
      fetchJson<MultiLineStringData>('/data/monument-layers/rivers.json'),
      fetchJson<MultiLineStringData>('/data/monument-layers/roads.json'),
    ]);
    data = dataResult;
    basemapTopology = basemapResult;
    riversData = riversResult;
    roadsData = roadsResult;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.monuments.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const { monuments, departments } = data;
  const departmentByCode = new Map(departments.map((d) => [d.code, d]));
  const oldestYear = monuments[0].constructionYear;
  const newestYear = monuments[monuments.length - 1].constructionYear;

  // Number of monuments with constructionYear <= year (monuments is sorted
  // ascending, see data-model.md "Contraintes de validation"): the reveal
  // cursor for that year, used both by the per-frame animation loop and by
  // the manual year slider below (a scrub can jump the cursor backward, which
  // the frame loop alone never needs to do).
  function cursorForYear(year: number): number {
    let lo = 0;
    let hi = monuments.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (monuments[mid].constructionYear <= year) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  const preludeEndIndex = cursorForYear(PRELUDE_CUTOFF_YEAR);

  const colorScale = scaleLinear<string>().domain([oldestYear, newestYear]).range(SEQUENTIAL_BLUE).clamp(true);
  const simYearScale = scaleLinear().domain([0, TOTAL_DURATION_MS]).range([PRELUDE_CUTOFF_YEAR, newestYear]).clamp(true);

  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.france);

  // --- Layout ---------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-monument-layers__controls';
  root.appendChild(controls);

  let activeProtection: ProtectionFilter = 'all';

  const filterGroup = document.createElement('div');
  filterGroup.className = 'dv-monument-layers__control-group';
  filterGroup.setAttribute('role', 'radiogroup');
  filterGroup.setAttribute('aria-label', labels.protectionLabel);
  controls.appendChild(filterGroup);

  function buildFilterOption(text: string, checked: boolean, onChange: () => void) {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'dv-monument-layers__toggle';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'dv-monument-layers-protection';
    input.checked = checked;
    input.addEventListener('change', () => {
      if (input.checked) onChange();
    });
    optionLabel.append(input, document.createTextNode(text));
    filterGroup.appendChild(optionLabel);
  }

  buildFilterOption(labels.protectionAll, true, () => {
    activeProtection = 'all';
    handleFilterChange();
  });
  buildFilterOption(labels.protectionClasse, false, () => {
    activeProtection = 'classe';
    handleFilterChange();
  });
  buildFilterOption(labels.protectionInscrit, false, () => {
    activeProtection = 'inscrit';
    handleFilterChange();
  });

  const readout = document.createElement('div');
  readout.className = 'dv-monument-layers__readout';
  controls.appendChild(readout);

  const countEl = document.createElement('span');
  countEl.className = 'dv-monument-layers__count';
  readout.appendChild(countEl);

  const periodEl = document.createElement('span');
  periodEl.className = 'dv-monument-layers__period';
  readout.appendChild(periodEl);

  const playback = document.createElement('div');
  playback.className = 'dv-monument-layers__playback';
  controls.appendChild(playback);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-monument-layers__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playback.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-monument-layers__speed';
  speedSelect.setAttribute('aria-label', labels.speedLabel);
  (
    [
      ['slow', labels.speedSlow],
      ['normal', labels.speedNormal],
      ['fast', labels.speedFast],
    ] as const
  ).forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    if (value === 'normal') option.selected = true;
    speedSelect.appendChild(option);
  });
  playback.appendChild(speedSelect);

  // Grouped so the label, slider and value move together when the playback
  // row wraps on narrow viewports, same structure as light-pollution.
  const yearGroup = document.createElement('div');
  yearGroup.className = 'dv-monument-layers__year-group';
  playback.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-monument-layers-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-monument-layers-year';
  yearSlider.className = 'dv-monument-layers__year-slider';
  yearSlider.min = String(PRELUDE_CUTOFF_YEAR);
  yearSlider.max = String(newestYear);
  yearSlider.step = '1';
  yearGroup.appendChild(yearSlider);
  // No <datalist> of tick marks here, unlike light-pollution's year slider:
  // that one steps through a small fixed set of yearly composites (2013-2025),
  // each a meaningful snap point: this one scrubs a continuous 1,950-year
  // reveal, where every year is an equally valid position.

  const yearValueEl = document.createElement('span');
  yearValueEl.className = 'dv-monument-layers__year-value';
  yearGroup.appendChild(yearValueEl);

  const stage = document.createElement('div');
  stage.className = 'dv-monument-layers__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-monument-layers__canvas';
  const monumentsCanvas = document.createElement('canvas');
  monumentsCanvas.className = 'dv-monument-layers__canvas';
  stage.append(basemapCanvas, monumentsCanvas);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-monument-layers__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-monument-layers__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-monument-layers__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-monument-layers__zoom-button dv-monument-layers__zoom-button--reset';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-monument-layers__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-monument-layers__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  // --- Projection & spatial index --------------------------------------
  const basemapCtx = basemapCanvas.getContext('2d')!;
  const monumentsCtx = monumentsCanvas.getContext('2d')!;
  const projection = geoMercator();
  const path = geoPath(projection, basemapCtx);

  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;
  let px = new Float64Array(0);
  let py = new Float64Array(0);
  let grid = new Map<string, number[]>();

  function buildSpatialIndex() {
    px = new Float64Array(monuments.length);
    py = new Float64Array(monuments.length);
    grid = new Map();
    for (let i = 0; i < monuments.length; i++) {
      const p = projection([monuments[i].lng, monuments[i].lat]);
      if (!p) continue;
      px[i] = p[0];
      py[i] = p[1];
      const key = `${Math.floor(p[0] / GRID_CELL_SIZE)},${Math.floor(p[1] / GRID_CELL_SIZE)}`;
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(i);
    }
  }

  function forEachCandidateNear(baseX: number, baseY: number, callback: (i: number) => void) {
    const cx = Math.floor(baseX / GRID_CELL_SIZE);
    const cy = Math.floor(baseY / GRID_CELL_SIZE);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`);
        if (bucket) for (const i of bucket) callback(i);
      }
    }
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    height = Math.max(320, Math.min(rect.width * 0.6, heightCeiling));
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, monumentsCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    projection.fitExtent(
      [
        [16, 16],
        [width - 16, height - 16],
      ],
      landFeature as any
    );
    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    buildSpatialIndex();
    drawBasemap();
    redrawForeground();
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([1, MAX_ZOOM])
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      redrawForeground();
      updateZoomButtons();
    });
  select(monumentsCanvas).call(zoomBehavior as any);

  function updateZoomButtons() {
    zoomOutButton.disabled = transform.k <= 1;
    zoomInButton.disabled = transform.k >= MAX_ZOOM;
  }
  updateZoomButtons();

  zoomInButton.addEventListener('click', () => {
    select(monumentsCanvas).call(zoomBehavior.scaleBy as any, ZOOM_BUTTON_STEP);
  });
  zoomOutButton.addEventListener('click', () => {
    select(monumentsCanvas).call(zoomBehavior.scaleBy as any, 1 / ZOOM_BUTTON_STEP);
  });
  zoomResetButton.addEventListener('click', () => {
    select(monumentsCanvas).call(zoomBehavior.transform as any, zoomIdentity);
  });

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
  resizeObserver.observe(stage);

  // --- Rendering ------------------------------------------------------
  function drawBasemap() {
    basemapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    basemapCtx.clearRect(0, 0, width, height);

    // Fill + rivers + roads share a clip (the France silhouette) so neither
    // ever bleeds past the coastline; the border is stroked in a separate,
    // unclipped pass after restore() so the clip doesn't shave off the
    // outward half of its own stroke width (same structure as paris-trees'
    // drawBasemap).
    basemapCtx.save();
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.beginPath();
    path(landFeature as any);
    basemapCtx.fillStyle = BASEMAP_FILL;
    basemapCtx.fill();
    basemapCtx.clip();

    // Rivers first, roads on top (a highway crossing a river stays visible),
    // same layering rationale as paris-trees' Seine/streets.
    basemapCtx.strokeStyle = RIVER_COLOR;
    basemapCtx.lineWidth = RIVER_LINE_WIDTH_PX / transform.k;
    basemapCtx.lineCap = 'round';
    basemapCtx.lineJoin = 'round';
    basemapCtx.beginPath();
    path(riversData as any);
    basemapCtx.stroke();

    basemapCtx.strokeStyle = ROAD_COLOR;
    basemapCtx.lineWidth = ROAD_LINE_WIDTH_PX / transform.k;
    basemapCtx.beginPath();
    path(roadsData as any);
    basemapCtx.stroke();
    basemapCtx.restore();

    basemapCtx.save();
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.beginPath();
    path(landFeature as any);
    basemapCtx.strokeStyle = BASEMAP_STROKE;
    basemapCtx.lineWidth = 1 / transform.k;
    basemapCtx.stroke();
    basemapCtx.restore();

    monumentsCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function passesFilter(m: RawMonument): boolean {
    return activeProtection === 'all' || m.protection === activeProtection;
  }

  function paintPoint(i: number) {
    const sx = transform.applyX(px[i]);
    const sy = transform.applyY(py[i]);
    monumentsCtx.beginPath();
    monumentsCtx.arc(sx, sy, POINT_RADIUS_PX, 0, Math.PI * 2);
    monumentsCtx.fillStyle = colorScale(monuments[i].constructionYear);
    monumentsCtx.fill();
  }

  // Redraws every already-revealed (index < cursor), currently filtered-in
  // monument in one pass: used after a filter change, a resize (new
  // projection/positions) and a zoom/pan change (new transform), same
  // mechanism as satellites-in-orbit's rebuildForeground.
  function redrawForeground() {
    monumentsCtx.clearRect(0, 0, width, height);
    for (let i = 0; i < cursor; i++) {
      if (passesFilter(monuments[i])) paintPoint(i);
    }
  }

  // --- Reveal state -----------------------------------------------------
  let cursor = 0;
  let countClasse = 0;
  let countInscrit = 0;
  let lastPeriodText = '';
  let currentSimYear = PRELUDE_CUTOFF_YEAR;

  function revealOne(i: number) {
    const m = monuments[i];
    if (m.protection === 'classe') countClasse++;
    else countInscrit++;
    if (passesFilter(m)) paintPoint(i);
  }

  function updateCounter() {
    const total = activeProtection === 'all' ? countClasse + countInscrit : activeProtection === 'classe' ? countClasse : countInscrit;
    countEl.textContent = labels.countLabel.replace('{count}', total.toLocaleString(lang));
    emptyMessage.hidden = total > 0;
  }

  function updatePeriodIndicator() {
    if (cursor === 0) return;
    const label = periodLabel(monuments[cursor - 1], lang, labels);
    if (label !== lastPeriodText) {
      lastPeriodText = label;
      periodEl.textContent = label;
    }
  }

  function updateYearReadout() {
    const year = Math.round(currentSimYear);
    yearSlider.value = String(year);
    yearValueEl.textContent = String(year);
  }

  // Jumps the reveal cursor to an arbitrary point rather than only advancing
  // it (unlike revealOne, used by the per-frame animation loop): a manual
  // scrub of the year slider below can move backward, which a full recount +
  // redraw handles directly rather than trying to "unpaint" points already
  // baked into the canvas.
  function seekToCursor(newCursor: number) {
    cursor = newCursor;
    countClasse = 0;
    countInscrit = 0;
    for (let i = 0; i < cursor; i++) {
      if (monuments[i].protection === 'classe') countClasse++;
      else countInscrit++;
    }
    redrawForeground();
    updateCounter();
    updatePeriodIndicator();
  }

  function handleFilterChange() {
    redrawForeground();
    updateCounter();
  }

  // --- Animation ----------------------------------------------------------
  let playing = true;
  let speed: Speed = 'normal';
  // True while the fully-built map is held on screen before a pass loops
  // back to the socle (see HOLD_AT_END_MS above), mirroring satellites-in-orbit.
  let holding = false;
  let holdElapsedMs = 0;
  let playedMs = 0;
  let lastFrameTime = performance.now();

  function startNewPass() {
    playedMs = 0;
    holding = false;
    holdElapsedMs = 0;
    currentSimYear = PRELUDE_CUTOFF_YEAR;
    lastPeriodText = '';
    seekToCursor(preludeEndIndex);
    updateYearReadout();
  }

  function startAnimationLoop() {
    lastFrameTime = performance.now();
    d3Timer(() => {
      const now = performance.now();
      const dtMs = now - lastFrameTime;
      lastFrameTime = now;
      if (!playing) return;

      if (holding) {
        holdElapsedMs += dtMs;
        if (holdElapsedMs >= HOLD_AT_END_MS) startNewPass();
        return;
      }

      playedMs = Math.min(TOTAL_DURATION_MS, playedMs + dtMs * SPEED_FACTORS[speed]);
      currentSimYear = simYearScale(playedMs);

      while (cursor < monuments.length && monuments[cursor].constructionYear <= currentSimYear) {
        revealOne(cursor);
        cursor++;
      }
      updateCounter();
      updatePeriodIndicator();
      updateYearReadout();

      if (playedMs >= TOTAL_DURATION_MS) holding = true;
    });
  }

  playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as Speed;
  });

  // Manual scrubbing takes over from autoplay, same as pressing pause (see
  // light-pollution/render.ts's year slider for the same convention): without
  // this, autoplay would fight the visitor's drag on every frame.
  yearSlider.addEventListener('input', () => {
    playing = false;
    playButton.textContent = labels.play;
    playButton.setAttribute('aria-pressed', 'false');

    const targetYear = Number(yearSlider.value);
    currentSimYear = targetYear;
    playedMs = simYearScale.invert(targetYear);
    seekToCursor(cursorForYear(targetYear));
    yearValueEl.textContent = String(targetYear);

    holding = cursor >= monuments.length;
    holdElapsedMs = 0;
  });

  // --- Tooltip --------------------------------------------------------------
  let hovered: number | null = null;
  let pinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    tooltip.style.pointerEvents = 'none';
    hovered = null;
    pinned = false;
  }

  // The link to the official record is only ever clickable once the card is
  // pinned (see the click handler below): while it's a plain hover preview
  // that follows the pointer, `pointer-events: none` (see MonumentLayers.astro)
  // lets clicks/moves fall through to the canvas underneath rather than
  // fighting the point the visitor is trying to hover or click next.
  function showTooltip(i: number, screenX: number, screenY: number) {
    const m = monuments[i];
    const department = departmentByCode.get(m.departmentCode);
    const departmentName = department ? (lang === 'fr' ? department.nameFr : department.nameEn) : '';
    const lines = [`<strong>${m.name}</strong>`];
    lines.push(`${labels.communeLabel} ${m.commune}${departmentName ? ` (${departmentName})` : ''}`);
    lines.push(periodLabel(m, lang, labels));
    lines.push(m.protection === 'classe' ? labels.protectionClasse : labels.protectionInscrit);
    if (m.category) lines.push(`${labels.categoryLabel} ${m.category}`);
    lines.push(`<a href="${merimeeUrl(m.reference)}" target="_blank" rel="noopener">${labels.viewRecordLabel}</a>`);
    tooltip.innerHTML = lines.join('<br>');
    tooltip.style.left = `${screenX + 12}px`;
    tooltip.style.top = `${screenY + 12}px`;
    tooltip.style.pointerEvents = pinned ? 'auto' : 'none';
    tooltip.hidden = false;
  }

  function findMonumentNear(screenX: number, screenY: number): number | null {
    const [baseX, baseY] = transform.invert([screenX, screenY]);
    let closest: number | null = null;
    let closestDist = POINT_RADIUS_PX + HIT_RADIUS_PADDING_PX;
    forEachCandidateNear(baseX, baseY, (i) => {
      if (i >= cursor || !passesFilter(monuments[i])) return;
      const sx = transform.applyX(px[i]);
      const sy = transform.applyY(py[i]);
      const dist = Math.hypot(sx - screenX, sy - screenY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function relativeCoords(event: MouseEvent): { x: number; y: number } {
    const rect = monumentsCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  monumentsCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y } = relativeCoords(event);
    const hit = findMonumentNear(x, y);
    if (hit === hovered) {
      if (hit !== null) showTooltip(hit, x, y);
      return;
    }
    hovered = hit;
    if (hit !== null) showTooltip(hit, x, y);
    else hideTooltip();
  });

  monumentsCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  monumentsCanvas.addEventListener('click', (event) => {
    const { x, y } = relativeCoords(event);
    const hit = findMonumentNear(x, y);
    if (hit !== null) {
      hovered = hit;
      pinned = true;
      showTooltip(hit, x, y);
    } else {
      hideTooltip();
    }
  });

  // --- Boot -----------------------------------------------------------
  resize();
  startNewPass();
  startAnimationLoop();
}
