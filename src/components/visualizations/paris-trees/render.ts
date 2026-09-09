import { geoContains, geoBounds, geoMercator, geoPath } from 'd3-geo';
import { scaleOrdinal, scaleSqrt } from 'd3-scale';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';

interface Genus {
  id: string;
  nameFr: string;
  nameEn: string;
}

interface SpeciesEntry {
  commonName: string;
  genusLabel: string;
  species: string;
  searchText: string;
}

interface TreesArrays {
  lat: number[];
  lng: number[];
  genusId: number[];
  speciesId: number[];
  circumferenceCm: number[];
  heightM: number[];
  developmentStage: (string | null)[];
  domain: (string | null)[];
  district: number[];
  remarkable: boolean[];
}

interface TreesData {
  generatedAt: string;
  genera: Genus[];
  species: SpeciesEntry[];
  trees: TreesArrays;
}

interface DistrictFeature {
  type: 'Feature';
  properties: { c_ar: number };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface DistrictsData {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

interface MultiLineStringData {
  type: 'MultiLineString';
  coordinates: number[][][];
}

interface Garden {
  id: string;
  nameFr: string;
  nameEn: string;
}

interface NationalGardensData {
  generatedAt: string;
  gardens: Garden[];
  trees: {
    lat: number[];
    lng: number[];
    gardenId: number[];
    genusLabel: (string | null)[];
    species: (string | null)[];
  };
}

export interface ParisTreesLabels {
  loading: string;
  loadingProgress: string;
  error: string;
  emptySearch: string;
  emptyFilters: string;
  searchLabel: string;
  searchPlaceholder: string;
  legendToggle: string;
  countLabel: string;
  remarkableLabel: string;
  circumferenceLabel: string;
  heightLabel: string;
  developmentStageLabel: string;
  domainLabel: string;
  districtLabel: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  nationalGardensToggle: string;
  nationalGardensDisclaimer: string;
  nationalGardensTreeFallback: string;
  nationalGardensLabel: string;
}

// Eight dominant-genus slots (style-guide.md "Palette dataviz"), assigned by
// order of appearance in `genera` (data-model.md "Format de sortie"); the
// trailing "other" entry gets a neutral tone outside the palette instead.
const GENUS_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const OTHER_COLOR = '#666666';
const REMARKABLE_RING_COLOR = '#c7b299';
const BASEMAP_FILL = '#e4e2da';
const BASEMAP_STROKE = '#acb2b8';
const STREET_COLOR = '#f4f2ec';
const STREET_LINE_WIDTH_PX = 0.6;
const SEINE_COLOR = '#a8c5da';
const SEINE_LINE_WIDTH_PX = 3;
// Midpoint between BASEMAP_FILL (#e4e2da) and OTHER_COLOR (#666666): a light
// gray distinct from both, rather than an arbitrary hue (explicit request).
const NATIONAL_GARDEN_COLOR = '#a5a4a0';
const NATIONAL_GARDEN_RADIUS_PX = 3;

const MIN_RADIUS_PX = 1.2;
const MAX_RADIUS_PX = 9;
const HIT_RADIUS_PADDING_PX = 3;
const DIM_ALPHA = 0.12;
const MAX_ZOOM = 40;
const GRID_CELL_SIZE = 40; // base-projection units, rebuilt on resize alongside positions
const SEARCH_DEBOUNCE_MS = 120;
const ZOOM_BUTTON_STEP = 1.5;
const MIN_STAGE_HEIGHT_PX = 340;
const STAGE_HEIGHT_DIVISOR = 1.4;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeForSearch(s: string): string {
  return stripAccents(s.toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Streamed rather than a plain fetch().json(): trees.json is multiple
// megabytes (functional-specifications.md "États" calls for a progress
// indicator rather than a binary loaded/not-loaded state on this file).
// `Content-Length` isn't reliably the size of the *decoded* stream read here
// (a gzip-compressed response reports its compressed length on some servers,
// its decoded length on others), so the running fraction is clamped below
// 100% until the read genuinely completes rather than trusted precisely.
async function fetchJsonWithProgress<T>(url: string, onProgress: (fraction: number) => void): Promise<T> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error('fetch failed');
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) onProgress(Math.min(0.99, received / total));
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const text = new TextDecoder('utf-8').decode(merged);
  return JSON.parse(text) as T;
}

export async function mountParisTrees(root: HTMLElement, lang: 'fr' | 'en', labels: ParisTreesLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-paris-trees');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-paris-trees__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: TreesData;
  let districtsData: DistrictsData;
  let streetsData: MultiLineStringData;
  let seineData: MultiLineStringData;
  let nationalGardensData: NationalGardensData;
  try {
    const fetchJson = <T,>(url: string) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<T>;
      });
    const [treesResult, districtsResult, streetsResult, seineResult, nationalGardensResult] = await Promise.all([
      fetchJsonWithProgress<TreesData>('/data/paris-trees/trees.json', (fraction) => {
        statusEl.textContent = labels.loadingProgress.replace('{percent}', String(Math.round(fraction * 100)));
      }),
      fetchJson<DistrictsData>('/data/paris-trees/districts.json'),
      fetchJson<MultiLineStringData>('/data/paris-trees/streets.json'),
      fetchJson<MultiLineStringData>('/data/paris-trees/seine.json'),
      fetchJson<NationalGardensData>('/data/paris-trees/national-gardens.json'),
    ]);
    data = treesResult;
    districtsData = districtsResult;
    streetsData = streetsResult;
    seineData = seineResult;
    nationalGardensData = nationalGardensResult;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const { genera, species, trees } = data;
  const treeCount = trees.lat.length;
  const genusIndexes = genera.map((_, i) => i);
  const genusColor = scaleOrdinal<number, string>()
    .domain(genusIndexes)
    .range(genera.map((g, i) => (g.id === 'other' ? OTHER_COLOR : GENUS_PALETTE[i])));
  let maxCircumference = 0;
  for (let i = 0; i < treeCount; i++) if (trees.circumferenceCm[i] > maxCircumference) maxCircumference = trees.circumferenceCm[i];
  const radiusScale = scaleSqrt()
    .domain([0, maxCircumference || 1])
    .range([MIN_RADIUS_PX, MAX_RADIUS_PX]);

  // --- Layout ---------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-paris-trees__controls';
  root.appendChild(controls);

  const searchRow = document.createElement('div');
  searchRow.className = 'dv-paris-trees__controls-row';
  controls.appendChild(searchRow);

  const searchLabel = document.createElement('label');
  searchLabel.className = 'dv-paris-trees__search';
  const searchLabelText = document.createElement('span');
  searchLabelText.textContent = labels.searchLabel;
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'dv-paris-trees__search-input';
  searchInput.placeholder = labels.searchPlaceholder;
  searchLabel.append(searchLabelText, searchInput);
  searchRow.appendChild(searchLabel);

  const countEl = document.createElement('span');
  countEl.className = 'dv-paris-trees__count';
  searchRow.appendChild(countEl);

  const legendRow = document.createElement('div');
  legendRow.className = 'dv-paris-trees__controls-row';
  controls.appendChild(legendRow);

  const legendDetails = document.createElement('details');
  legendDetails.className = 'dv-paris-trees__legend';
  legendDetails.open = true;
  const legendSummary = document.createElement('summary');
  legendSummary.textContent = labels.legendToggle;
  legendDetails.appendChild(legendSummary);

  const genusGroup = document.createElement('div');
  genusGroup.className = 'dv-paris-trees__control-group';
  legendDetails.appendChild(genusGroup);
  legendRow.appendChild(legendDetails);

  const activeGenera = new Set<number>(genera.map((_, i) => i));

  genera.forEach((genus, index) => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'dv-paris-trees__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) activeGenera.add(index);
      else activeGenera.delete(index);
      redraw();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-paris-trees__swatch';
    swatch.style.backgroundColor = genusColor(index);
    optionLabel.append(input, swatch, document.createTextNode(lang === 'fr' ? genus.nameFr : genus.nameEn));
    genusGroup.appendChild(optionLabel);
  });

  const { gardens, trees: gardenTrees } = nationalGardensData;
  const gardenCount = gardenTrees.lat.length;
  let showNationalGardens = true;

  const gardensRow = document.createElement('div');
  gardensRow.className = 'dv-paris-trees__controls-row';
  controls.appendChild(gardensRow);

  const gardensToggleLabel = document.createElement('label');
  gardensToggleLabel.className = 'dv-paris-trees__toggle';
  const gardensToggleInput = document.createElement('input');
  gardensToggleInput.type = 'checkbox';
  gardensToggleInput.checked = true;
  const gardensSwatch = document.createElement('span');
  gardensSwatch.className = 'dv-paris-trees__swatch dv-paris-trees__swatch--ring';
  gardensSwatch.style.borderColor = NATIONAL_GARDEN_COLOR;
  const gardensFootnoteMarker = document.createElement('sup');
  gardensFootnoteMarker.textContent = '*';
  gardensToggleLabel.append(
    gardensToggleInput,
    gardensSwatch,
    document.createTextNode(labels.nationalGardensToggle),
    gardensFootnoteMarker
  );
  gardensRow.appendChild(gardensToggleLabel);

  gardensToggleInput.addEventListener('change', () => {
    showNationalGardens = gardensToggleInput.checked;
    redraw();
  });

  const stage = document.createElement('div');
  stage.className = 'dv-paris-trees__stage';
  root.appendChild(stage);

  // Always visible, regardless of the toggle above: a footnote (not a
  // toggle-conditional disclaimer) so the caveat about this layer's
  // reliability stays legible even when someone has switched it off.
  const gardensFootnote = document.createElement('p');
  gardensFootnote.className = 'dv-paris-trees__footnote';
  gardensFootnote.innerHTML = `<sup>*</sup> ${labels.nationalGardensDisclaimer}`;
  root.appendChild(gardensFootnote);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-paris-trees__canvas';
  const treesCanvas = document.createElement('canvas');
  treesCanvas.className = 'dv-paris-trees__canvas';
  stage.append(basemapCanvas, treesCanvas);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-paris-trees__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-paris-trees__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-paris-trees__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-paris-trees__zoom-button dv-paris-trees__zoom-button--reset';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-paris-trees__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-paris-trees__status';
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  // --- Projection & spatial index --------------------------------------
  const basemapCtx = basemapCanvas.getContext('2d')!;
  const treesCtx = treesCanvas.getContext('2d')!;
  const projection = geoMercator();
  const path = geoPath(projection, basemapCtx);

  const [[lngMin, latMin], [lngMax, latMax]] = geoBounds(districtsData as any);
  const latMid = (latMin + latMax) / 2;
  const aspect = ((lngMax - lngMin) * Math.cos((latMid * Math.PI) / 180)) / (latMax - latMin);

  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;
  let px = new Float64Array(0);
  let py = new Float64Array(0);
  let grid = new Map<string, number[]>();
  let gardenPx = new Float64Array(0);
  let gardenPy = new Float64Array(0);

  function buildSpatialIndex() {
    px = new Float64Array(treeCount);
    py = new Float64Array(treeCount);
    grid = new Map();
    for (let i = 0; i < treeCount; i++) {
      const p = projection([trees.lng[i], trees.lat[i]]);
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

  // Only ~3,000 points (tiny next to the 194,315 main trees): a plain array,
  // scanned in full on every draw and hit-test, needs no grid index.
  function buildGardenPositions() {
    gardenPx = new Float64Array(gardenCount);
    gardenPy = new Float64Array(gardenCount);
    for (let i = 0; i < gardenCount; i++) {
      const p = projection([gardenTrees.lng[i], gardenTrees.lat[i]]);
      if (!p) continue;
      gardenPx[i] = p[0];
      gardenPy[i] = p[1];
    }
  }

  function forEachCandidateInView(callback: (i: number) => void) {
    const [bx0, by0] = transform.invert([0, 0]);
    const [bx1, by1] = transform.invert([width, height]);
    const cx0 = Math.floor(bx0 / GRID_CELL_SIZE);
    const cx1 = Math.floor(bx1 / GRID_CELL_SIZE);
    const cy0 = Math.floor(by0 / GRID_CELL_SIZE);
    const cy1 = Math.floor(by1 / GRID_CELL_SIZE);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const bucket = grid.get(`${cx},${cy}`);
        if (bucket) for (const i of bucket) callback(i);
      }
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
    // Height further divided by STAGE_HEIGHT_DIVISOR (explicit request) on top
    // of Paris's own geographic aspect ratio: the plain geographic height felt
    // too tall in the page.
    height = Math.max(MIN_STAGE_HEIGHT_PX, rect.width / aspect / STAGE_HEIGHT_DIVISOR);
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, treesCanvas]) {
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
      districtsData as any
    );
    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    buildSpatialIndex();
    buildGardenPositions();
    drawBasemap();
    redraw();
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([1, MAX_ZOOM])
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      redraw();
      updateZoomButtons();
    });
  select(treesCanvas).call(zoomBehavior as any);

  function updateZoomButtons() {
    zoomOutButton.disabled = transform.k <= 1;
    zoomInButton.disabled = transform.k >= MAX_ZOOM;
  }
  updateZoomButtons();

  zoomInButton.addEventListener('click', () => {
    select(treesCanvas).call(zoomBehavior.scaleBy as any, ZOOM_BUTTON_STEP);
  });
  zoomOutButton.addEventListener('click', () => {
    select(treesCanvas).call(zoomBehavior.scaleBy as any, 1 / ZOOM_BUTTON_STEP);
  });
  zoomResetButton.addEventListener('click', () => {
    select(treesCanvas).call(zoomBehavior.transform as any, zoomIdentity);
  });

  // Debounced: unlike the other visualizations' ResizeObserver, a resize here
  // rebuilds the spatial index over 194,315 trees (buildSpatialIndex), too
  // costly to redo on every intermediate size during a live window-resize drag.
  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
  resizeObserver.observe(stage);

  // --- Rendering ----------------------------------------------------------
  function drawBasemap() {
    basemapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    basemapCtx.clearRect(0, 0, width, height);

    // Fill + streets share a clip (the combined district silhouette) so the
    // street network never bleeds past it, even where its own simplification
    // doesn't line up pixel-for-pixel with the districts' outline; borders are
    // stroked in a separate, unclipped pass after restore() so the clip
    // doesn't shave off the outward half of the border's own stroke width.
    basemapCtx.save();
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.beginPath();
    for (const feature of districtsData.features) path(feature as any);
    basemapCtx.fillStyle = BASEMAP_FILL;
    basemapCtx.fill();
    basemapCtx.clip();
    // Seine first, streets on top (bridges crossing it stay visible), same clip.
    basemapCtx.strokeStyle = SEINE_COLOR;
    basemapCtx.lineWidth = SEINE_LINE_WIDTH_PX / transform.k;
    basemapCtx.lineCap = 'round';
    basemapCtx.lineJoin = 'round';
    basemapCtx.beginPath();
    path(seineData as any);
    basemapCtx.stroke();
    basemapCtx.strokeStyle = STREET_COLOR;
    basemapCtx.lineWidth = STREET_LINE_WIDTH_PX / transform.k;
    basemapCtx.beginPath();
    path(streetsData as any);
    basemapCtx.stroke();
    basemapCtx.restore();

    basemapCtx.save();
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.strokeStyle = BASEMAP_STROKE;
    basemapCtx.lineWidth = 1 / transform.k;
    for (const feature of districtsData.features) {
      basemapCtx.beginPath();
      path(feature as any);
      basemapCtx.stroke();
    }
    basemapCtx.restore();

    treesCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  let normalizedQuery = '';

  function drawTrees(): number {
    treesCtx.clearRect(0, 0, width, height);
    let visibleCount = 0;

    function drawOne(i: number, alpha: number) {
      const sx = transform.applyX(px[i]);
      const sy = transform.applyY(py[i]);
      const r = radiusScale(trees.circumferenceCm[i]);
      treesCtx.globalAlpha = alpha;
      treesCtx.beginPath();
      treesCtx.arc(sx, sy, r, 0, Math.PI * 2);
      treesCtx.fillStyle = genusColor(trees.genusId[i]);
      treesCtx.fill();
      if (trees.remarkable[i]) {
        treesCtx.beginPath();
        treesCtx.arc(sx, sy, r + 2, 0, Math.PI * 2);
        treesCtx.strokeStyle = REMARKABLE_RING_COLOR;
        treesCtx.lineWidth = 1.5;
        treesCtx.stroke();
      }
    }

    // Two passes so search matches always paint on top of the dimmed rest
    // of the canopy (functional-specifications.md "Interactions": non-matches
    // fade but keep the whole map's geographic context, they aren't removed).
    if (normalizedQuery) {
      forEachCandidateInView((i) => {
        if (!activeGenera.has(trees.genusId[i])) return;
        if (species[trees.speciesId[i]].searchText.includes(normalizedQuery)) return;
        drawOne(i, DIM_ALPHA);
      });
    }
    forEachCandidateInView((i) => {
      if (!activeGenera.has(trees.genusId[i])) return;
      if (normalizedQuery && !species[trees.speciesId[i]].searchText.includes(normalizedQuery)) return;
      drawOne(i, 1);
      visibleCount++;
    });
    treesCtx.globalAlpha = 1;
    return visibleCount;
  }

  // Drawn as hollow rings, not filled dots, and in a hue outside the genus
  // palette: a different mark for a different kind of data (OpenStreetMap,
  // partial community coverage, no genus for most points) rather than a 9th
  // genus color implying the same certainty as the other eight (see
  // "Palette" in technical-specifications.md for why a 9th palette color was
  // ruled out for Bouleau/Cyprès on this same touching-points layout).
  function drawNationalGardens() {
    if (!showNationalGardens) return;
    treesCtx.strokeStyle = NATIONAL_GARDEN_COLOR;
    treesCtx.lineWidth = 1.5;
    for (let i = 0; i < gardenCount; i++) {
      const sx = transform.applyX(gardenPx[i]);
      const sy = transform.applyY(gardenPy[i]);
      if (sx < -10 || sx > width + 10 || sy < -10 || sy > height + 10) continue;
      treesCtx.beginPath();
      treesCtx.arc(sx, sy, NATIONAL_GARDEN_RADIUS_PX, 0, Math.PI * 2);
      treesCtx.stroke();
    }
  }

  function redraw() {
    const visibleCount = drawTrees();
    drawNationalGardens();
    countEl.textContent = labels.countLabel.replace('{count}', visibleCount.toLocaleString(lang));
    if (visibleCount === 0) {
      emptyMessage.textContent = activeGenera.size === 0 ? labels.emptyFilters : labels.emptySearch;
      emptyMessage.hidden = false;
    } else {
      emptyMessage.hidden = true;
    }
  }

  // --- District click-to-zoom ----------------------------------------------
  function districtAt(screenX: number, screenY: number): number | null {
    const [baseX, baseY] = transform.invert([screenX, screenY]);
    const geoPoint = projection.invert?.([baseX, baseY]);
    if (!geoPoint) return null;
    for (const feature of districtsData.features) {
      if (geoContains(feature as any, geoPoint)) return feature.properties.c_ar;
    }
    return null;
  }

  function zoomToDistrict(cAr: number) {
    const feature = districtsData.features.find((f) => f.properties.c_ar === cAr);
    if (!feature) return;
    const [[x0, y0], [x1, y1]] = path.bounds(feature as any);
    const boundsWidth = Math.max(1, x1 - x0);
    const boundsHeight = Math.max(1, y1 - y0);
    const scale = Math.max(1, Math.min(MAX_ZOOM, 0.85 / Math.max(boundsWidth / width, boundsHeight / height)));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const next = zoomIdentity.translate(width / 2 - scale * cx, height / 2 - scale * cy).scale(scale);
    select(treesCanvas).call(zoomBehavior.transform as any, next);
  }

  // --- Tooltip --------------------------------------------------------------
  type Hit = { kind: 'tree'; index: number } | { kind: 'garden'; index: number };

  let hovered: Hit | null = null;
  let pinned = false;

  function sameHit(a: Hit | null, b: Hit | null): boolean {
    if (a === null || b === null) return a === b;
    return a.kind === b.kind && a.index === b.index;
  }

  function findGardenTreeNear(screenX: number, screenY: number): number | null {
    let closest: number | null = null;
    let closestDist = NATIONAL_GARDEN_RADIUS_PX + HIT_RADIUS_PADDING_PX;
    for (let i = 0; i < gardenCount; i++) {
      const sx = transform.applyX(gardenPx[i]);
      const sy = transform.applyY(gardenPy[i]);
      const dist = Math.hypot(sx - screenX, sy - screenY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest;
  }

  function findTreeNear(screenX: number, screenY: number): number | null {
    const [baseX, baseY] = transform.invert([screenX, screenY]);
    let closest: number | null = null;
    let closestDist = Infinity;
    forEachCandidateNear(baseX, baseY, (i) => {
      if (!activeGenera.has(trees.genusId[i])) return;
      const sx = transform.applyX(px[i]);
      const sy = transform.applyY(py[i]);
      const dist = Math.hypot(sx - screenX, sy - screenY);
      // Hit radius follows the tree's own drawn dot rather than a flat
      // generous constant: at the initial full-Paris zoom, dots sit only a
      // couple of pixels apart on average (194,315 of them across the city),
      // so a flat radius the size of bird-migrations' sparse trail dots would
      // make nearly every click land on some tree and starve the district
      // click-to-zoom interaction below of any empty space to land on.
      const effectiveRadius = radiusScale(trees.circumferenceCm[i]) + HIT_RADIUS_PADDING_PX;
      if (dist < effectiveRadius && dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function showTooltip(i: number, screenX: number, screenY: number) {
    const genus = genera[trees.genusId[i]];
    const sp = species[trees.speciesId[i]];
    const name = sp.commonName || (lang === 'fr' ? genus.nameFr : genus.nameEn);
    const lines = [`<strong>${name}</strong>`];
    if (sp.genusLabel) lines.push(`<em>${sp.genusLabel}${sp.species ? ` ${sp.species}` : ''}</em>`);
    lines.push(`${labels.circumferenceLabel} ${trees.circumferenceCm[i]} cm`);
    lines.push(`${labels.heightLabel} ${trees.heightM[i]} m`);
    if (trees.developmentStage[i]) lines.push(`${labels.developmentStageLabel} ${trees.developmentStage[i]}`);
    if (trees.domain[i]) lines.push(`${labels.domainLabel} ${trees.domain[i]}`);
    lines.push(`${labels.districtLabel} ${trees.district[i]}`);
    let html = lines.join('<br>');
    if (trees.remarkable[i]) {
      html += `<br><span class="dv-paris-trees__tooltip-remarkable">★ ${labels.remarkableLabel}</span>`;
    }
    tooltip.innerHTML = html;
    tooltip.style.left = `${screenX + 12}px`;
    tooltip.style.top = `${screenY + 12}px`;
    tooltip.hidden = false;
  }

  // Minimal by design: OpenStreetMap tags genus/species on a minority of
  // these points (26% in this extraction) and never circumference, height,
  // development stage or domain — there's nothing to show beyond genus/
  // species (when present) and which garden, unlike the main tree tooltip.
  function showGardenTooltip(i: number, screenX: number, screenY: number) {
    const garden = gardens[gardenTrees.gardenId[i]];
    const genusLabel = gardenTrees.genusLabel[i];
    const speciesLabel = gardenTrees.species[i];
    const nameLine = genusLabel
      ? `<strong><em>${genusLabel}${speciesLabel ? ` ${speciesLabel}` : ''}</em></strong>`
      : `<strong>${labels.nationalGardensTreeFallback}</strong>`;
    const gardenName = lang === 'fr' ? garden.nameFr : garden.nameEn;
    tooltip.innerHTML = `${nameLine}<br>${labels.nationalGardensLabel} ${gardenName}`;
    tooltip.style.left = `${screenX + 12}px`;
    tooltip.style.top = `${screenY + 12}px`;
    tooltip.hidden = false;
  }

  // National-garden points are hit-tested first: drawn on top of the main
  // canopy (see drawNationalGardens), so they should also win the pick when
  // both are within range, consistent with their visual stacking order.
  function findHitNear(screenX: number, screenY: number): Hit | null {
    if (showNationalGardens) {
      const gardenIndex = findGardenTreeNear(screenX, screenY);
      if (gardenIndex !== null) return { kind: 'garden', index: gardenIndex };
    }
    const treeIndex = findTreeNear(screenX, screenY);
    return treeIndex !== null ? { kind: 'tree', index: treeIndex } : null;
  }

  function showTooltipFor(hit: Hit, screenX: number, screenY: number) {
    if (hit.kind === 'tree') showTooltip(hit.index, screenX, screenY);
    else showGardenTooltip(hit.index, screenX, screenY);
  }

  function hideTooltip() {
    tooltip.hidden = true;
    hovered = null;
    pinned = false;
  }

  function relativeCoords(event: MouseEvent): { x: number; y: number } {
    const rect = treesCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  treesCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y } = relativeCoords(event);
    const hit = findHitNear(x, y);
    if (sameHit(hit, hovered)) {
      if (hit !== null) showTooltipFor(hit, x, y);
      return;
    }
    hovered = hit;
    if (hit !== null) showTooltipFor(hit, x, y);
    else hideTooltip();
  });

  treesCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  treesCanvas.addEventListener('click', (event) => {
    const { x, y } = relativeCoords(event);
    const hit = findHitNear(x, y);
    if (hit !== null) {
      hovered = hit;
      pinned = true;
      showTooltipFor(hit, x, y);
      return;
    }
    hideTooltip();
    const cAr = districtAt(x, y);
    if (cAr !== null) zoomToDistrict(cAr);
  });

  // --- Search -----------------------------------------------------------
  let searchDebounce: ReturnType<typeof setTimeout> | undefined;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      normalizedQuery = normalizeForSearch(searchInput.value);
      redraw();
    }, SEARCH_DEBOUNCE_MS);
  });

  resize();
}
