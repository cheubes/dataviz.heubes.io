import { geoDistance, geoInterpolate, geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleOrdinal, scaleSqrt } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig (no noImplicitAny), which is narrow enough for the shape used below.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

interface TrackPoint {
  lat: number;
  lng: number;
  date: string;
}

interface RawTrack {
  individualId: string;
  speciesId: string;
  points: TrackPoint[];
}

interface RawDensityEntry {
  speciesId: string;
  month: number; // 1-12
  lat: number;
  lng: number;
  count: number;
}

interface Species {
  id: string;
  nameFr: string;
  nameEn: string;
  type: 'track' | 'density';
}

interface MigrationsData {
  species: Species[];
  tracks: RawTrack[];
  density: RawDensityEntry[];
}

export interface AnimalMigrationsLabels {
  loading: string;
  error: string;
  empty: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  individualLabel: string;
  distanceLabel: string;
  durationLabel: string;
  durationUnit: string;
  densityTooltipLabel: string;
  densityTooltipSuffix: string;
}

interface UnwrappedPoint extends TrackPoint {
  t: number; // unwrapped day-of-year, monotonically increasing within a track
}

interface Track {
  individualId: string;
  speciesId: string;
  points: UnwrappedPoint[];
  distanceKm: number;
  durationDays: number;
  color: string;
  // Doubles as "point to draw the next trail segment from" and "point to
  // hit-test the tooltip against" (see bird-migrations for the rationale).
  pixel: [number, number] | null;
}

interface DensityCell {
  speciesId: string;
  lat: number;
  lng: number;
  countsByMonth: number[]; // length 12, index 0 = January
  maxCount: number;
  color: string;
}

const CYCLE_MS_NORMAL = 36_000;
const SPEED_FACTORS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};
const HIT_RADIUS_PX = 14;
const FADE_ALPHA = 0.06;
const RIVER_COLOR = '#a8c5da';
const RIVER_LINE_WIDTH_PX = 1.5;
// Must match the grid step used by the monarch density preprocessing script
// (public/data/animal-migrations/tracks.json's `density` entries): each cell
// is centered on its own [lat, lng] with this size in each direction.
const DENSITY_CELL_DEGREES = 2;
const DENSITY_MIN_ALPHA = 0.05;
const DENSITY_MAX_ALPHA = 0.8;
const ZOOM_SCALE_EXTENT: [number, number] = [1, 12];

// relief.webp (see bird-migrations/technical-specifications.md, "Relief : alignement au
// redimensionnement") is reused unmodified here: it is a single fixed raster covering the
// whole world at a pixel density calibrated once by fitting bird-migrations' Europe/Africa
// rectangle into a 2600x4348 reference frame. That calibration is independent of whatever
// geometry is actually displayed live (the projection's rotate/center never change), so the
// exact same reference rectangle and constants are reused below purely as an internal
// calibration anchor -- REFERENCE_VIEW_BOUNDS is never drawn on screen, only `viewBounds`
// (the full land silhouette, see resize()) is. This avoids regenerating relief.webp or
// re-deriving new pixel constants for a world-covering live extent.
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
// Wound clockwise, same reason as bird-migrations (d3-geo's spherical winding rule).
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

function dayOfYear(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  const current = Date.UTC(y, m - 1, d);
  return (current - start) / 86_400_000;
}

function unwrapTrack(points: TrackPoint[]): UnwrappedPoint[] {
  let offset = 0;
  let prevT = -Infinity;
  return points.map((p) => {
    let t = dayOfYear(p.date) + offset;
    if (t < prevT) {
      offset += 365;
      t += 365;
    }
    prevT = t;
    return { ...p, t };
  });
}

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: TrackPoint, b: TrackPoint): number {
  return EARTH_RADIUS_KM * geoDistance([a.lng, a.lat], [b.lng, b.lat]);
}

function totalDistanceKm(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

function durationDays(points: TrackPoint[]): number {
  const [y1, m1, d1] = points[0].date.split('-').map(Number);
  const last = points[points.length - 1];
  const [y2, m2, d2] = last.date.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

function monthFraction(simDay: number): { monthIndex: number; nextMonthIndex: number; frac: number } {
  const ms = Date.UTC(2001, 0, 1) + simDay * 86_400_000;
  const monthIndex = new Date(ms).getUTCMonth();
  const startOfMonth = Date.UTC(2001, monthIndex, 1);
  const startOfNextMonth = Date.UTC(2001, monthIndex + 1, 1);
  const frac = (ms - startOfMonth) / (startOfNextMonth - startOfMonth);
  return { monthIndex, nextMonthIndex: (monthIndex + 1) % 12, frac };
}

export async function mountAnimalMigrations(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: AnimalMigrationsLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-animal-migrations');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-animal-migrations__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: MigrationsData;
  let basemapTopology: any;
  let riversData: any;
  const reliefImg = new Image();
  try {
    const reliefLoaded = new Promise<void>((resolve, reject) => {
      reliefImg.onload = () => resolve();
      reliefImg.onerror = () => reject(new Error('relief image failed to load'));
    });
    const [tracksRes, basemapRes, riversRes] = await Promise.all([
      fetch('/data/animal-migrations/tracks.json'),
      fetch('/data/animal-migrations/basemap.json'),
      fetch('/data/animal-migrations/rivers.json'),
    ]);
    if (!tracksRes.ok || !basemapRes.ok || !riversRes.ok) throw new Error('fetch failed');
    data = await tracksRes.json();
    basemapTopology = await basemapRes.json();
    riversData = await riversRes.json();
    reliefImg.src = '/data/animal-migrations/relief.webp';
    await reliefLoaded;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.tracks.length === 0 && data.density.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const color = scaleOrdinal<string, string>()
    .domain(data.species.map((s) => s.id))
    .range(['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']);

  const tracks: Track[] = data.tracks.map((raw) => ({
    individualId: raw.individualId,
    speciesId: raw.speciesId,
    points: unwrapTrack(raw.points),
    distanceKm: totalDistanceKm(raw.points),
    durationDays: durationDays(raw.points),
    color: color(raw.speciesId),
    pixel: null,
  }));

  const densityBySpeciesAndCell = new Map<string, DensityCell>();
  for (const entry of data.density) {
    const key = `${entry.speciesId}|${entry.lat}|${entry.lng}`;
    let cell = densityBySpeciesAndCell.get(key);
    if (!cell) {
      cell = {
        speciesId: entry.speciesId,
        lat: entry.lat,
        lng: entry.lng,
        countsByMonth: new Array(12).fill(0),
        maxCount: 0,
        color: color(entry.speciesId),
      };
      densityBySpeciesAndCell.set(key, cell);
    }
    cell.countsByMonth[entry.month - 1] = entry.count;
    cell.maxCount = Math.max(cell.maxCount, entry.count);
  }
  const densityCells = [...densityBySpeciesAndCell.values()];
  const densityGlobalMax = densityCells.reduce((max, cell) => Math.max(max, cell.maxCount), 0);
  const densityAlphaScale = scaleSqrt().domain([0, densityGlobalMax || 1]).range([DENSITY_MIN_ALPHA, DENSITY_MAX_ALPHA]).clamp(true);

  // --- Layout ---------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-animal-migrations__controls';
  root.appendChild(controls);

  const controlsRow = document.createElement('div');
  controlsRow.className = 'dv-animal-migrations__controls-row';
  controls.appendChild(controlsRow);

  const speciesGroup = document.createElement('div');
  speciesGroup.className = 'dv-animal-migrations__control-group';
  const activeSpecies = new Set(data.species.map((s) => s.id));
  data.species.forEach((species) => {
    const label = document.createElement('label');
    label.className = 'dv-animal-migrations__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) activeSpecies.add(species.id);
      else activeSpecies.delete(species.id);
      updateEmptyState();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-animal-migrations__swatch';
    swatch.style.backgroundColor = color(species.id);
    label.append(input, swatch, document.createTextNode(lang === 'fr' ? species.nameFr : species.nameEn));
    speciesGroup.appendChild(label);
  });
  controlsRow.appendChild(speciesGroup);

  const controlsSeparator = document.createElement('span');
  controlsSeparator.className = 'dv-animal-migrations__separator';
  controlsSeparator.setAttribute('aria-hidden', 'true');
  controlsSeparator.textContent = '|';
  controlsRow.appendChild(controlsSeparator);

  const playbackGroup = document.createElement('div');
  playbackGroup.className = 'dv-animal-migrations__control-group';
  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-animal-migrations__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playbackGroup.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-animal-migrations__speed';
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
  playbackGroup.appendChild(speedSelect);

  const dateIndicator = document.createElement('span');
  dateIndicator.className = 'dv-animal-migrations__date';
  playbackGroup.appendChild(dateIndicator);
  controlsRow.appendChild(playbackGroup);

  const stage = document.createElement('div');
  stage.className = 'dv-animal-migrations__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-animal-migrations__canvas';
  const densityCanvas = document.createElement('canvas');
  densityCanvas.className = 'dv-animal-migrations__canvas';
  const trailsCanvas = document.createElement('canvas');
  trailsCanvas.className = 'dv-animal-migrations__canvas';
  stage.append(basemapCanvas, densityCanvas, trailsCanvas);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-animal-migrations__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-animal-migrations__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  // --- Projection & zoom -----------------------------------------------
  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.land);
  const viewBounds = landFeature; // full world silhouette: the whole planisphere is visible by default

  const basemapCtx = basemapCanvas.getContext('2d')!;
  const densityCtx = densityCanvas.getContext('2d')!;
  const trailsCtx = trailsCanvas.getContext('2d')!;
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
    height = Math.max(360, Math.min(rect.width * 0.65, heightCeiling));
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, densityCanvas, trailsCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Calibration anchor only (see REFERENCE_VIEW_BOUNDS comment above) -- not displayed.
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
      viewBounds as any
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
    densityCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    trailsCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function projectPoint(lat: number, lng: number): [number, number] {
    const p = projection([lng, lat]) ?? [0, 0];
    return transform.apply(p);
  }

  function screenToLngLat(x: number, y: number): [number, number] | null {
    const pre = transform.invert([x, y]);
    const inv = projection.invert?.(pre as [number, number]);
    return inv ? [inv[0], inv[1]] : null;
  }

  // --- Density (monarch), redrawn fully every frame: not a fading trail, a
  // direct read of "how many observations at this point in the cycle". ------
  let currentMonth: { monthIndex: number; nextMonthIndex: number; frac: number } = monthFraction(0);

  function densityCellValue(cell: DensityCell): number {
    const a = cell.countsByMonth[currentMonth.monthIndex];
    const b = cell.countsByMonth[currentMonth.nextMonthIndex];
    return a + (b - a) * currentMonth.frac;
  }

  function drawDensity() {
    densityCtx.clearRect(0, 0, width, height);
    for (const cell of densityCells) {
      if (!activeSpecies.has(cell.speciesId)) continue;
      const value = densityCellValue(cell);
      if (value <= 0) continue;
      const [x1, y1] = projectPoint(cell.lat - DENSITY_CELL_DEGREES / 2, cell.lng - DENSITY_CELL_DEGREES / 2);
      const [x2, y2] = projectPoint(cell.lat + DENSITY_CELL_DEGREES / 2, cell.lng + DENSITY_CELL_DEGREES / 2);
      densityCtx.fillStyle = cell.color;
      densityCtx.globalAlpha = densityAlphaScale(value);
      densityCtx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    }
    densityCtx.globalAlpha = 1;
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent(ZOOM_SCALE_EXTENT)
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      drawDensity();
      for (const track of tracks) track.pixel = null; // avoid a stray line jumping across the redraw
      trailsCtx.clearRect(0, 0, width, height);
    });
  select(trailsCanvas).call(zoomBehavior as any);

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
  resize();

  // --- Animation --------------------------------------------------------
  let playing = true;
  let speed: 'slow' | 'normal' | 'fast' = 'normal';
  let simDay = 0;

  function findSurroundingIndex(points: UnwrappedPoint[], t: number): number {
    for (let i = 0; i < points.length - 1; i++) {
      if (t >= points[i].t && t <= points[i + 1].t) return i;
    }
    return -1;
  }

  function activeLocalT(track: Track): number | null {
    const first = track.points[0].t;
    const last = track.points[track.points.length - 1].t;
    if (simDay >= first && simDay <= last) return simDay;
    if (simDay + 365 >= first && simDay + 365 <= last) return simDay + 365;
    return null;
  }

  // Built once (Intl.DateTimeFormat resolves locale data, not cheap) rather
  // than on every animation frame.
  const monthFormatter = new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' });
  let lastMonthLabel = '';

  function updateDateIndicator() {
    const reference = new Date(Date.UTC(2001, 0, 1) + simDay * 86_400_000);
    const label = monthFormatter.format(reference);
    if (label !== lastMonthLabel) {
      lastMonthLabel = label;
      dateIndicator.textContent = label;
    }
  }

  let hoveredTrack: Track | null = null;
  let hoveredCell: DensityCell | null = null;
  let pinned = false;

  function isTrackVisible(track: Track): boolean {
    return activeSpecies.has(track.speciesId);
  }

  function updateEmptyState() {
    const anyTrackSpecies = data.species.some((s) => s.type === 'track' && activeSpecies.has(s.id));
    const anyDensitySpecies = data.species.some((s) => s.type === 'density' && activeSpecies.has(s.id));
    emptyMessage.hidden = anyTrackSpecies || anyDensitySpecies;
    drawDensity();
  }

  function renderFrame() {
    currentMonth = monthFraction(simDay);
    drawDensity();

    trailsCtx.save();
    trailsCtx.globalCompositeOperation = 'destination-out';
    trailsCtx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
    trailsCtx.fillRect(0, 0, width, height);
    trailsCtx.globalCompositeOperation = 'source-over';

    for (const track of tracks) {
      if (!isTrackVisible(track)) {
        track.pixel = null;
        continue;
      }
      const t = activeLocalT(track);
      if (t === null) {
        track.pixel = null;
        continue;
      }
      const idx = findSurroundingIndex(track.points, t);
      if (idx === -1) continue;
      const a = track.points[idx];
      const b = track.points[idx + 1];
      const localT = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      const [lng, lat] = geoInterpolate([a.lng, a.lat], [b.lng, b.lat])(localT);
      const pixel = projectPoint(lat, lng);

      if (track.pixel) {
        trailsCtx.beginPath();
        trailsCtx.moveTo(track.pixel[0], track.pixel[1]);
        trailsCtx.lineTo(pixel[0], pixel[1]);
        trailsCtx.strokeStyle = track.color;
        trailsCtx.lineWidth = track === hoveredTrack ? 3 : 1.6;
        trailsCtx.stroke();
      }
      trailsCtx.beginPath();
      trailsCtx.arc(pixel[0], pixel[1], track === hoveredTrack ? 4.5 : 3, 0, Math.PI * 2);
      trailsCtx.fillStyle = track.color;
      trailsCtx.fill();

      track.pixel = pixel;
    }

    trailsCtx.restore();
    if (hoveredTrack && !hoveredTrack.pixel) {
      pinned = false;
      hideTooltip();
    }
    updateDateIndicator();
  }

  let lastFrameTime = performance.now();
  let loop: ReturnType<typeof d3Timer> | null = null;

  function startAnimationLoop() {
    lastFrameTime = performance.now();
    loop = d3Timer(() => {
      const now = performance.now();
      const dtMs = now - lastFrameTime;
      lastFrameTime = now;
      if (playing) {
        const daysPerMs = 365 / CYCLE_MS_NORMAL;
        simDay = (simDay + dtMs * daysPerMs * SPEED_FACTORS[speed]) % 365;
      }
      renderFrame();
    });
  }
  startAnimationLoop();

  playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as 'slow' | 'normal' | 'fast';
  });

  // --- Tooltip ------------------------------------------------------------
  function findTrackNear(x: number, y: number): Track | null {
    let closest: Track | null = null;
    let closestDist = HIT_RADIUS_PX;
    for (const track of tracks) {
      if (!track.pixel) continue;
      const d = Math.hypot(track.pixel[0] - x, track.pixel[1] - y);
      if (d < closestDist) {
        closestDist = d;
        closest = track;
      }
    }
    return closest;
  }

  function findDensityCellNear(x: number, y: number): DensityCell | null {
    const lngLat = screenToLngLat(x, y);
    if (!lngLat) return null;
    const [lng, lat] = lngLat;
    const half = DENSITY_CELL_DEGREES / 2;
    for (const cell of densityCells) {
      if (!activeSpecies.has(cell.speciesId)) continue;
      if (densityCellValue(cell) <= 0) continue;
      if (Math.abs(lat - cell.lat) <= half && Math.abs(lng - cell.lng) <= half) return cell;
    }
    return null;
  }

  function showTrackTooltip(track: Track, x: number, y: number) {
    const species = data.species.find((s) => s.id === track.speciesId);
    const speciesName = species ? (lang === 'fr' ? species.nameFr : species.nameEn) : track.speciesId;
    tooltip.innerHTML = `
      <strong>${speciesName}</strong><br>
      ${labels.individualLabel} ${track.individualId}<br>
      ${labels.distanceLabel} ${Math.round(track.distanceKm).toLocaleString(lang)} km<br>
      ${labels.durationLabel} ${track.durationDays} ${labels.durationUnit}
    `;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  function showDensityTooltip(cell: DensityCell, x: number, y: number) {
    const species = data.species.find((s) => s.id === cell.speciesId);
    const speciesName = species ? (lang === 'fr' ? species.nameFr : species.nameEn) : cell.speciesId;
    const monthName = monthFormatter.format(new Date(Date.UTC(2001, 0, 1) + simDay * 86_400_000));
    const value = densityCellValue(cell);
    const percentOfPeak = cell.maxCount > 0 ? Math.round((value / cell.maxCount) * 100) : 0;
    tooltip.innerHTML = `
      <strong>${speciesName}</strong><br>
      ${labels.densityTooltipLabel.replace('{month}', monthName)} ${percentOfPeak}${labels.densityTooltipSuffix}
    `;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
    hoveredTrack = null;
    hoveredCell = null;
  }

  function findAtEvent(event: MouseEvent): { x: number; y: number; track: Track | null; cell: DensityCell | null } {
    const rect = trailsCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const track = findTrackNear(x, y);
    const cell = track ? null : findDensityCellNear(x, y);
    return { x, y, track, cell };
  }

  trailsCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y, track, cell } = findAtEvent(event);
    if (track === hoveredTrack && cell === hoveredCell) {
      if (track) showTrackTooltip(track, x, y);
      else if (cell) showDensityTooltip(cell, x, y);
      return;
    }
    hoveredTrack = track;
    hoveredCell = cell;
    if (track) showTrackTooltip(track, x, y);
    else if (cell) showDensityTooltip(cell, x, y);
    else hideTooltip();
  });

  trailsCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  trailsCanvas.addEventListener('click', (event) => {
    const { x, y, track, cell } = findAtEvent(event);
    if (track) {
      hoveredTrack = track;
      pinned = true;
      showTrackTooltip(track, x, y);
    } else if (cell) {
      hoveredCell = cell;
      pinned = true;
      showDensityTooltip(cell, x, y);
    } else {
      pinned = false;
      hideTooltip();
    }
  });

  updateEmptyState();
}
