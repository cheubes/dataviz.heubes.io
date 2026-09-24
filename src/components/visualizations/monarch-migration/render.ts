import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { scalePow } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig (no noImplicitAny), which is narrow enough for the shape used below.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';
import { getUrlParam, readZoomParam, setUrlParams, writeZoomParam } from '../../../scripts/url-state';

interface DensityEntry {
  month: number; // 1-12
  lat: number;
  lng: number;
  count: number;
}

export interface MonarchMigrationLabels {
  loading: string;
  error: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  tooltip: string;
}

interface DensityCell {
  lat: number;
  lng: number;
  countsByMonth: number[]; // length 12, index 0 = January
  maxCount: number;
}

const CYCLE_MS_NORMAL = 36_000;
const SPEED_FACTORS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};
const MONARCH_COLOR = '#eb6834';
const RIVER_COLOR = '#a8c5da';
const RIVER_LINE_WIDTH_PX = 1.5;
// Must match the grid step used by the density preprocessing script
// (see "Prétraitement" in specs/monarch-migration/data-model.md): each cell is
// centered on its own [lat, lng] with this size in each direction.
const DENSITY_CELL_DEGREES = 1;
// Counts are heavy-tailed (median cell: 28 per year, max: 4 904): a square root left most cells near-invisible.
const DENSITY_ALPHA_EXPONENT = 0.25;
const DENSITY_MAX_ALPHA = 0.95;
const ZOOM_SCALE_EXTENT: [number, number] = [1, 6];

// relief.webp (see bird-migrations/technical-specifications.md, "Relief : alignement au
// redimensionnement") is reused unmodified: it is a single fixed raster covering the whole
// world at a pixel density calibrated once by fitting bird-migrations' Europe/Africa
// rectangle into a 2600x4348 reference frame. That calibration is independent of whatever
// geometry is actually displayed live (the projection's rotate/center never change), so the
// exact same reference rectangle and constants are reused below purely as an internal
// calibration anchor: REFERENCE_VIEW_BOUNDS is never drawn on screen, only VIEW_BOUNDS is.
const RELIEF_REF_WIDTH = 2600;
const RELIEF_REF_HEIGHT = 4348;
const RELIEF_ORIGIN_X = -5523;
const RELIEF_ORIGIN_Y = -496;

function densifiedRing(corners: [number, number][], stepsPerEdge: number): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i < corners.length; i++) {
    const [lng1, lat1] = corners[i];
    const [lng2, lat2] = corners[(i + 1) % corners.length];
    for (let s = 0; s < stepsPerEdge; s++) {
      const f = s / stepsPerEdge;
      ring.push([lng1 + (lng2 - lng1) * f, lat1 + (lat2 - lat1) * f]);
    }
  }
  ring.push(ring[0]);
  return ring;
}

// Rings wound clockwise (not the RFC 7946 counter-clockwise convention): d3-geo's
// spherical winding rule is the inverse, and a counter-clockwise ring gets read as
// "everything except this box", fitting to the whole world instead of it.
const REFERENCE_VIEW_BOUNDS = {
  type: 'Polygon',
  coordinates: [
    densifiedRing(
      [
        [-25, -36],
        [-25, 68],
        [45, 68],
        [45, -36],
      ],
      20
    ),
  ],
} as const;

// North America, with a small margin around the density grid (14-52°N, 125-65°W).
const VIEW_BOUNDS = {
  type: 'Polygon',
  coordinates: [
    densifiedRing(
      [
        [-128, 12],
        [-128, 54],
        [-62, 54],
        [-62, 12],
      ],
      20
    ),
  ],
} as const;

function monthFraction(simDay: number): { monthIndex: number; nextMonthIndex: number; frac: number } {
  const ms = Date.UTC(2001, 0, 1) + simDay * 86_400_000;
  const monthIndex = new Date(ms).getUTCMonth();
  const startOfMonth = Date.UTC(2001, monthIndex, 1);
  const startOfNextMonth = Date.UTC(2001, monthIndex + 1, 1);
  const frac = (ms - startOfMonth) / (startOfNextMonth - startOfMonth);
  return { monthIndex, nextMonthIndex: (monthIndex + 1) % 12, frac };
}

export async function mountMonarchMigration(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: MonarchMigrationLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-monarch-migration');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-monarch-migration__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let densityEntries: DensityEntry[];
  let basemapTopology: any;
  let riversData: any;
  const reliefImg = new Image();
  try {
    const reliefLoaded = new Promise<void>((resolve, reject) => {
      reliefImg.onload = () => resolve();
      reliefImg.onerror = () => reject(new Error('relief image failed to load'));
    });
    const [densityRes, basemapRes, riversRes] = await Promise.all([
      fetch('/data/monarch-migration/density.json'),
      fetch('/data/monarch-migration/basemap.json'),
      fetch('/data/monarch-migration/rivers.json'),
    ]);
    if (!densityRes.ok || !basemapRes.ok || !riversRes.ok) throw new Error('fetch failed');
    densityEntries = await densityRes.json();
    basemapTopology = await basemapRes.json();
    riversData = await riversRes.json();
    reliefImg.src = '/data/monarch-migration/relief.webp';
    await reliefLoaded;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (densityEntries.length === 0) {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const cellsByPosition = new Map<string, DensityCell>();
  for (const entry of densityEntries) {
    const key = `${entry.lat}|${entry.lng}`;
    let cell = cellsByPosition.get(key);
    if (!cell) {
      cell = { lat: entry.lat, lng: entry.lng, countsByMonth: new Array(12).fill(0), maxCount: 0 };
      cellsByPosition.set(key, cell);
    }
    cell.countsByMonth[entry.month - 1] = entry.count;
    cell.maxCount = Math.max(cell.maxCount, entry.count);
  }
  const densityCells = [...cellsByPosition.values()];
  const globalMaxCount = densityCells.reduce((max, cell) => Math.max(max, cell.maxCount), 0);
  const alphaScale = scalePow()
    .exponent(DENSITY_ALPHA_EXPONENT)
    .domain([0, globalMaxCount])
    .range([0, DENSITY_MAX_ALPHA])
    .clamp(true);

  // --- Layout ---------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-monarch-migration__controls';
  root.appendChild(controls);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-monarch-migration__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  controls.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-monarch-migration__speed';
  speedSelect.setAttribute('aria-label', labels.speedLabel);
  ([
    ['slow', labels.speedSlow],
    ['normal', labels.speedNormal],
    ['fast', labels.speedFast],
  ] as const).forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    if (value === 'normal') option.selected = true;
    speedSelect.appendChild(option);
  });
  controls.appendChild(speedSelect);

  const dateIndicator = document.createElement('span');
  dateIndicator.className = 'dv-monarch-migration__date';
  controls.appendChild(dateIndicator);

  const stage = document.createElement('div');
  stage.className = 'dv-monarch-migration__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-monarch-migration__canvas';
  const densityCanvas = document.createElement('canvas');
  densityCanvas.className = 'dv-monarch-migration__canvas';
  stage.append(basemapCanvas, densityCanvas);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-monarch-migration__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  // --- Projection & zoom -----------------------------------------------
  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.land);

  const basemapCtx = basemapCanvas.getContext('2d')!;
  const densityCtx = densityCanvas.getContext('2d')!;
  const projection = geoNaturalEarth1();
  const path = geoPath(projection, basemapCtx);
  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;
  let reliefScale = 1;
  let reliefOffsetX = 0;
  let reliefOffsetY = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    height = Math.max(320, Math.min(rect.width * 0.65, heightCeiling));
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, densityCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    densityCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    // Calibration anchor only (see REFERENCE_VIEW_BOUNDS comment above): not displayed.
    projection.fitExtent(
      [
        [24, 24],
        [RELIEF_REF_WIDTH - 24, RELIEF_REF_HEIGHT - 24],
      ],
      REFERENCE_VIEW_BOUNDS as any
    );
    const refScale = projection.scale();
    const refTranslate = projection.translate();

    projection.fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      VIEW_BOUNDS as any
    );
    reliefScale = projection.scale() / refScale;
    reliefOffsetX = projection.translate()[0] - reliefScale * (refTranslate[0] - RELIEF_ORIGIN_X);
    reliefOffsetY = projection.translate()[1] - reliefScale * (refTranslate[1] - RELIEF_ORIGIN_Y);

    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    drawBasemap();
    drawDensity();
  }

  function drawBasemap() {
    basemapCtx.save();
    basemapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    basemapCtx.clearRect(0, 0, width, height);
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.beginPath();
    path(landFeature as any);
    basemapCtx.fillStyle = '#e4e2da';
    basemapCtx.fill();
    basemapCtx.clip();

    basemapCtx.drawImage(
      reliefImg,
      reliefOffsetX,
      reliefOffsetY,
      reliefImg.naturalWidth * reliefScale,
      reliefImg.naturalHeight * reliefScale
    );

    basemapCtx.strokeStyle = RIVER_COLOR;
    basemapCtx.lineWidth = RIVER_LINE_WIDTH_PX / transform.k;
    basemapCtx.lineCap = 'round';
    basemapCtx.lineJoin = 'round';
    basemapCtx.beginPath();
    path(riversData as any);
    basemapCtx.stroke();

    basemapCtx.restore();
  }

  function projectPoint(lat: number, lng: number): [number, number] {
    const p = projection([lng, lat]) ?? [0, 0];
    return transform.apply(p);
  }

  function screenToLngLat(x: number, y: number): [number, number] | null {
    const inverted = projection.invert?.(transform.invert([x, y]) as [number, number]);
    return inverted ? [inverted[0], inverted[1]] : null;
  }

  // --- Density: redrawn from scratch every frame, it is a direct read of
  // "how many observations at this point of the year", not an accumulating trail.
  let currentMonth = monthFraction(0);

  function cellValue(cell: DensityCell): number {
    const current = cell.countsByMonth[currentMonth.monthIndex];
    const next = cell.countsByMonth[currentMonth.nextMonthIndex];
    return current + (next - current) * currentMonth.frac;
  }

  function drawDensity() {
    densityCtx.clearRect(0, 0, width, height);
    densityCtx.fillStyle = MONARCH_COLOR;
    const half = DENSITY_CELL_DEGREES / 2;
    for (const cell of densityCells) {
      const value = cellValue(cell);
      if (value <= 0) continue;
      // Four projected corners rather than two opposite ones: adjacent cells then share
      // their exact corner points, so the projection's curvature can't open seams between them.
      const southWest = projectPoint(cell.lat - half, cell.lng - half);
      const northWest = projectPoint(cell.lat + half, cell.lng - half);
      const northEast = projectPoint(cell.lat + half, cell.lng + half);
      const southEast = projectPoint(cell.lat - half, cell.lng + half);
      densityCtx.globalAlpha = alphaScale(value);
      densityCtx.beginPath();
      densityCtx.moveTo(southWest[0], southWest[1]);
      densityCtx.lineTo(northWest[0], northWest[1]);
      densityCtx.lineTo(northEast[0], northEast[1]);
      densityCtx.lineTo(southEast[0], southEast[1]);
      densityCtx.closePath();
      densityCtx.fill();
    }
    densityCtx.globalAlpha = 1;
  }

  let restoringUrlState = false;

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent(ZOOM_SCALE_EXTENT)
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      drawDensity();
    })
    .on('end', () => {
      if (!restoringUrlState) writeZoomParam(transform, projection, width, height);
    });
  select(densityCanvas).call(zoomBehavior as any);

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
  resize();

  const initialTransform = readZoomParam(projection, width, height, ZOOM_SCALE_EXTENT);
  if (initialTransform) {
    restoringUrlState = true;
    select(densityCanvas).call(zoomBehavior.transform as any, initialTransform);
    restoringUrlState = false;
  }

  // --- Animation --------------------------------------------------------
  let playing = true;
  let speed: 'slow' | 'normal' | 'fast' = 'normal';
  let simDay = 0;

  // Built once (Intl.DateTimeFormat resolves locale data, not cheap) rather than per frame.
  const monthFormatter = new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' });
  let lastMonthLabel = '';

  function currentMonthName(): string {
    return monthFormatter.format(new Date(Date.UTC(2001, 0, 1) + simDay * 86_400_000));
  }

  function updateDateIndicator() {
    const label = currentMonthName();
    if (label !== lastMonthLabel) {
      lastMonthLabel = label;
      dateIndicator.textContent = label;
    }
  }

  let hoveredCell: DensityCell | null = null;
  let pinned = false;

  function tooltipText(cell: DensityCell): string {
    const percentOfPeak = cell.maxCount > 0 ? Math.round((cellValue(cell) / cell.maxCount) * 100) : 0;
    return labels.tooltip.replace('{month}', currentMonthName()).replace('{percent}', String(percentOfPeak));
  }

  function showTooltip(cell: DensityCell, x: number, y: number) {
    hoveredCell = cell;
    tooltip.textContent = tooltipText(cell);
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
    hoveredCell = null;
  }

  function renderFrame() {
    currentMonth = monthFraction(simDay);
    drawDensity();
    if (hoveredCell) {
      if (cellValue(hoveredCell) <= 0) {
        pinned = false;
        hideTooltip();
      } else {
        tooltip.textContent = tooltipText(hoveredCell);
      }
    }
    updateDateIndicator();
  }

  let lastFrameTime = performance.now();
  d3Timer(() => {
    const now = performance.now();
    const dtMs = now - lastFrameTime;
    lastFrameTime = now;
    if (playing) {
      const daysPerMs = 365 / CYCLE_MS_NORMAL;
      simDay = (simDay + dtMs * daysPerMs * SPEED_FACTORS[speed]) % 365;
    }
    renderFrame();
  });

  function setPlaying(value: boolean) {
    playing = value;
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  }

  playButton.addEventListener('click', () => {
    setPlaying(!playing);
    setUrlParams({ month: playing ? null : String(currentMonth.monthIndex + 1) });
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as 'slow' | 'normal' | 'fast';
  });

  // The data is monthly, so a shared month opens on its first day: the frame
  // then shows that month's counts exactly, not an interpolation towards the next.
  const urlMonth = Number(getUrlParam('month'));
  if (Number.isInteger(urlMonth) && urlMonth >= 1 && urlMonth <= 12) {
    simDay = (Date.UTC(2001, urlMonth - 1, 1) - Date.UTC(2001, 0, 1)) / 86_400_000;
    setPlaying(false);
  }

  // --- Tooltip interactions ----------------------------------------------
  function cellAtEvent(event: MouseEvent): { x: number; y: number; cell: DensityCell | null } {
    const rect = densityCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const lngLat = screenToLngLat(x, y);
    if (!lngLat) return { x, y, cell: null };
    const [lng, lat] = lngLat;
    const half = DENSITY_CELL_DEGREES / 2;
    const cell =
      densityCells.find(
        (candidate) =>
          Math.abs(lat - candidate.lat) <= half && Math.abs(lng - candidate.lng) <= half && cellValue(candidate) > 0
      ) ?? null;
    return { x, y, cell };
  }

  densityCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y, cell } = cellAtEvent(event);
    if (cell) showTooltip(cell, x, y);
    else hideTooltip();
  });

  densityCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  densityCanvas.addEventListener('click', (event) => {
    const { x, y, cell } = cellAtEvent(event);
    if (cell) {
      pinned = true;
      showTooltip(cell, x, y);
    } else {
      pinned = false;
      hideTooltip();
    }
  });
}
