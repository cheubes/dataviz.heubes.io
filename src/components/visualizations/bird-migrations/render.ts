import { geoDistance, geoInterpolate, geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig (no noImplicitAny), which is narrow enough for the shape used below.
import { feature as topojsonFeature } from 'topojson-client';

interface TrackPoint {
  lat: number;
  lng: number;
  date: string;
}

interface Track {
  individualId: string;
  speciesId: string;
  direction: 'autumn' | 'spring';
  points: TrackPoint[];
}

interface Species {
  id: string;
  nameFr: string;
  nameEn: string;
}

interface TracksData {
  species: Species[];
  tracks: Track[];
}

type Direction = 'autumn' | 'spring' | 'both';

export interface BirdMigrationsLabels {
  loading: string;
  error: string;
  empty: string;
  directionLabel: string;
  directionAutumn: string;
  directionSpring: string;
  directionBoth: string;
  viewLabel: string;
  viewAnimated: string;
  viewStatic: string;
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
}

interface LegPoint extends TrackPoint {
  t: number; // unwrapped day-of-year, monotonically increasing within a leg
}

interface Leg {
  individualId: string;
  speciesId: string;
  direction: 'autumn' | 'spring';
  points: LegPoint[];
  distanceKm: number;
  durationDays: number;
  color: string;
  // Current animated-view position: doubles as "point to draw the next trail
  // segment from" and "point to hit-test the tooltip against" — the two were
  // split into separate fields before and kept in sync by hand, which was
  // one `null` reset (on zoom) away from silently drifting apart.
  pixel: [number, number] | null;
  staticPixelPath: [number, number][] | null;
}

const CYCLE_MS_NORMAL = 36_000;
const SPEED_FACTORS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 0.5,
  normal: 1,
  fast: 2,
};
const HIT_RADIUS_PX = 14;
const FADE_ALPHA = 0.06;

function dayOfYear(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  const current = Date.UTC(y, m - 1, d);
  return (current - start) / 86_400_000;
}

function unwrapLeg(points: TrackPoint[]): LegPoint[] {
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

export async function mountBirdMigrations(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: BirdMigrationsLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-bird-migrations');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-bird-migrations__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: TracksData;
  let basemapTopology: any;
  try {
    const [tracksRes, basemapRes] = await Promise.all([
      fetch('/data/bird-migrations/tracks.json'),
      fetch('/data/bird-migrations/basemap.json'),
    ]);
    if (!tracksRes.ok || !basemapRes.ok) throw new Error('fetch failed');
    data = await tracksRes.json();
    basemapTopology = await basemapRes.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.tracks.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const color = scaleOrdinal<string, string>()
    .domain(data.species.map((s) => s.id))
    .range(['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']);

  const legs: Leg[] = data.tracks.map((track) => ({
    individualId: track.individualId,
    speciesId: track.speciesId,
    direction: track.direction,
    points: unwrapLeg(track.points),
    distanceKm: totalDistanceKm(track.points),
    durationDays: durationDays(track.points),
    color: color(track.speciesId),
    pixel: null,
    staticPixelPath: null,
  }));

  // --- Layout ---------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-bird-migrations__controls';
  root.appendChild(controls);

  const controlsRow1 = document.createElement('div');
  controlsRow1.className = 'dv-bird-migrations__controls-row';
  controls.appendChild(controlsRow1);

  const controlsRow2 = document.createElement('div');
  controlsRow2.className = 'dv-bird-migrations__controls-row';
  controls.appendChild(controlsRow2);

  const speciesGroup = document.createElement('div');
  speciesGroup.className = 'dv-bird-migrations__control-group';
  const activeSpecies = new Set(data.species.map((s) => s.id));
  data.species.forEach((species) => {
    const label = document.createElement('label');
    label.className = 'dv-bird-migrations__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) activeSpecies.add(species.id);
      else activeSpecies.delete(species.id);
      updateEmptyState();
      redrawIfStatic();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-bird-migrations__swatch';
    swatch.style.backgroundColor = color(species.id);
    label.append(input, swatch, document.createTextNode(lang === 'fr' ? species.nameFr : species.nameEn));
    speciesGroup.appendChild(label);
  });
  controlsRow1.appendChild(speciesGroup);

  const directionGroup = document.createElement('div');
  directionGroup.className = 'dv-bird-migrations__control-group';
  directionGroup.setAttribute('role', 'radiogroup');
  directionGroup.setAttribute('aria-label', labels.directionLabel);
  let activeDirection: Direction = 'both';
  const directionOptions: { value: Direction; text: string }[] = [
    { value: 'autumn', text: labels.directionAutumn },
    { value: 'spring', text: labels.directionSpring },
    { value: 'both', text: labels.directionBoth },
  ];
  directionOptions.forEach((opt) => {
    const label = document.createElement('label');
    label.className = 'dv-bird-migrations__toggle';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'dv-bird-migrations-direction';
    input.checked = opt.value === 'both';
    input.addEventListener('change', () => {
      if (input.checked) activeDirection = opt.value;
      updateEmptyState();
      redrawIfStatic();
    });
    label.append(input, document.createTextNode(opt.text));
    directionGroup.appendChild(label);
  });
  controlsRow2.appendChild(directionGroup);

  const controlsSeparator = document.createElement('span');
  controlsSeparator.className = 'dv-bird-migrations__separator';
  controlsSeparator.setAttribute('aria-hidden', 'true');
  controlsSeparator.textContent = '|';
  controlsRow2.appendChild(controlsSeparator);

  const viewModeGroup = document.createElement('div');
  viewModeGroup.className = 'dv-bird-migrations__control-group';
  viewModeGroup.setAttribute('role', 'radiogroup');
  viewModeGroup.setAttribute('aria-label', labels.viewLabel);
  let viewMode: 'animated' | 'static' = 'animated';
  const viewModeOptions: { value: 'animated' | 'static'; text: string }[] = [
    { value: 'animated', text: labels.viewAnimated },
    { value: 'static', text: labels.viewStatic },
  ];
  viewModeOptions.forEach((opt) => {
    const label = document.createElement('label');
    label.className = 'dv-bird-migrations__toggle';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'dv-bird-migrations-view';
    input.checked = opt.value === 'animated';
    input.addEventListener('change', () => {
      if (input.checked) setViewMode(opt.value);
    });
    label.append(input, document.createTextNode(opt.text));
    viewModeGroup.appendChild(label);
  });
  controlsRow2.appendChild(viewModeGroup);

  const playbackGroup = document.createElement('div');
  playbackGroup.className = 'dv-bird-migrations__control-group';
  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-bird-migrations__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playbackGroup.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-bird-migrations__speed';
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
  dateIndicator.className = 'dv-bird-migrations__date';
  playbackGroup.appendChild(dateIndicator);
  controlsRow2.appendChild(playbackGroup);

  const stage = document.createElement('div');
  stage.className = 'dv-bird-migrations__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-bird-migrations__canvas';
  const trailsCanvas = document.createElement('canvas');
  trailsCanvas.className = 'dv-bird-migrations__canvas';
  stage.append(basemapCanvas, trailsCanvas);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-bird-migrations__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-bird-migrations__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  // --- Projection & zoom -----------------------------------------------
  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.land);
  // A dense ring (not just the 4 corners) so fitExtent's bounding-box
  // computation follows the projection's curvature along each edge instead
  // of the straight line between corners, which under-fits the zoom level.
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
  // Ring wound clockwise (not the RFC 7946 counter-clockwise convention): d3-geo's
  // spherical winding rule is the inverse, and a counter-clockwise ring here gets
  // read as "everything except this box", fitting to the whole world instead of it.
  const viewBounds = {
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

  const basemapCtx = basemapCanvas.getContext('2d')!;
  const trailsCtx = trailsCanvas.getContext('2d')!;
  const projection = geoNaturalEarth1();
  const path = geoPath(projection, basemapCtx);
  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    // Aspect close to the framed region's own (~0.58 width/height once the view
    // extends north to ~68°, see viewBounds below): a landscape ratio here would
    // waste most of its width as letterboxing either side of Europe/Africa.
    // Height further divided by 1.5 (explicit request) on top of that ratio.
    height = Math.max(480, rect.width * 0.85) / 1.5;
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, trailsCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    projection.fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      viewBounds as any
    );
    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    drawBasemap();
    redrawIfStatic();
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
    basemapCtx.restore();
    trailsCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([1, 6])
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      if (viewMode === 'static') {
        drawStaticView();
      } else {
        for (const leg of legs) leg.pixel = null; // avoid a stray line jumping across the redraw
        trailsCtx.clearRect(0, 0, width, height);
      }
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

  function projectPoint(lat: number, lng: number): [number, number] {
    const p = projection([lng, lat]) ?? [0, 0];
    return transform.apply(p);
  }

  function findSurroundingIndex(points: LegPoint[], t: number): number {
    for (let i = 0; i < points.length - 1; i++) {
      if (t >= points[i].t && t <= points[i + 1].t) return i;
    }
    return -1;
  }

  function activeLocalT(leg: Leg): number | null {
    const first = leg.points[0].t;
    const last = leg.points[leg.points.length - 1].t;
    if (simDay >= first && simDay <= last) return simDay;
    if (simDay + 365 >= first && simDay + 365 <= last) return simDay + 365;
    return null;
  }

  // Built once (Intl.DateTimeFormat resolves locale data, not cheap) rather
  // than on every animation frame; the label only actually changes ~12
  // times over a 365-day cycle, so the DOM write is skipped in between too.
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

  let hoveredLeg: Leg | null = null;
  let pinned = false;

  function isLegVisible(leg: Leg): boolean {
    return activeSpecies.has(leg.speciesId) && (activeDirection === 'both' || activeDirection === leg.direction);
  }

  function updateEmptyState() {
    emptyMessage.hidden = legs.some(isLegVisible);
  }

  function redrawIfStatic() {
    if (viewMode === 'static') drawStaticView();
  }

  function renderFrame() {
    trailsCtx.save();
    trailsCtx.globalCompositeOperation = 'destination-out';
    trailsCtx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
    trailsCtx.fillRect(0, 0, width, height);
    trailsCtx.globalCompositeOperation = 'source-over';

    for (const leg of legs) {
      if (!isLegVisible(leg)) {
        leg.pixel = null;
        continue;
      }
      const t = activeLocalT(leg);
      if (t === null) {
        leg.pixel = null;
        continue;
      }
      const idx = findSurroundingIndex(leg.points, t);
      if (idx === -1) continue;
      const a = leg.points[idx];
      const b = leg.points[idx + 1];
      const localT = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      const [lng, lat] = geoInterpolate([a.lng, a.lat], [b.lng, b.lat])(localT);
      const pixel = projectPoint(lat, lng);

      if (leg.pixel) {
        trailsCtx.beginPath();
        trailsCtx.moveTo(leg.pixel[0], leg.pixel[1]);
        trailsCtx.lineTo(pixel[0], pixel[1]);
        trailsCtx.strokeStyle = leg.color;
        trailsCtx.lineWidth = leg === hoveredLeg ? 3 : 1.6;
        trailsCtx.stroke();
      }
      trailsCtx.beginPath();
      trailsCtx.arc(pixel[0], pixel[1], leg === hoveredLeg ? 4.5 : 3, 0, Math.PI * 2);
      trailsCtx.fillStyle = leg.color;
      trailsCtx.fill();

      leg.pixel = pixel;
    }

    trailsCtx.restore();
    if (hoveredLeg && !hoveredLeg.pixel) {
      pinned = false;
      hideTooltip();
    }
    updateDateIndicator();
  }

  // --- Static view --------------------------------------------------------
  function drawStaticView() {
    trailsCtx.clearRect(0, 0, width, height);
    for (const leg of legs) {
      if (!isLegVisible(leg)) {
        leg.staticPixelPath = null;
        continue;
      }
      const pixels = leg.points.map((p) => projectPoint(p.lat, p.lng));
      leg.staticPixelPath = pixels;

      trailsCtx.beginPath();
      trailsCtx.setLineDash(leg.direction === 'spring' ? [6, 4] : []);
      trailsCtx.moveTo(pixels[0][0], pixels[0][1]);
      for (let i = 1; i < pixels.length; i++) trailsCtx.lineTo(pixels[i][0], pixels[i][1]);
      trailsCtx.strokeStyle = leg.color;
      trailsCtx.lineWidth = leg === hoveredLeg ? 3.5 : 2;
      trailsCtx.stroke();
    }
    trailsCtx.setLineDash([]);
    if (hoveredLeg && !hoveredLeg.staticPixelPath) {
      pinned = false;
      hideTooltip();
    }
  }

  function distanceToSegment(x: number, y: number, [x1, y1]: [number, number], [x2, y2]: [number, number]): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
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

  function setViewMode(mode: 'animated' | 'static') {
    if (mode === viewMode) return;
    viewMode = mode;
    playbackGroup.hidden = mode === 'static';
    pinned = false;
    hideTooltip();
    if (mode === 'static') {
      loop?.stop();
      loop = null;
      for (const leg of legs) leg.pixel = null;
      drawStaticView();
    } else {
      trailsCtx.clearRect(0, 0, width, height);
      for (const leg of legs) leg.staticPixelPath = null;
      startAnimationLoop();
    }
  }

  playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as 'slow' | 'normal' | 'fast';
  });

  // --- Tooltip ------------------------------------------------------------
  // Shared "closest leg under the hit-radius" scan: animated and static view
  // hit-test genuinely different geometry (a single point vs. a polyline,
  // per functional-specifications.md), so only the bookkeeping loop is
  // shared here, not the distance calculation itself.
  function closestLeg(distanceTo: (leg: Leg) => number | null): Leg | null {
    let closest: Leg | null = null;
    let closestDist = HIT_RADIUS_PX;
    for (const leg of legs) {
      const d = distanceTo(leg);
      if (d !== null && d < closestDist) {
        closestDist = d;
        closest = leg;
      }
    }
    return closest;
  }

  function findLegNear(x: number, y: number): Leg | null {
    return closestLeg((leg) => (leg.pixel ? Math.hypot(leg.pixel[0] - x, leg.pixel[1] - y) : null));
  }

  function findLegNearStatic(x: number, y: number): Leg | null {
    return closestLeg((leg) => {
      const pixels = leg.staticPixelPath;
      if (!pixels) return null;
      let minDist = Infinity;
      for (let i = 0; i < pixels.length - 1; i++) {
        minDist = Math.min(minDist, distanceToSegment(x, y, pixels[i], pixels[i + 1]));
      }
      return minDist;
    });
  }

  function showTooltip(leg: Leg, x: number, y: number) {
    const species = data.species.find((s) => s.id === leg.speciesId);
    const speciesName = species ? (lang === 'fr' ? species.nameFr : species.nameEn) : leg.speciesId;
    tooltip.innerHTML = `
      <strong>${speciesName}</strong><br>
      ${labels.individualLabel} ${leg.individualId}<br>
      ${labels.distanceLabel} ${Math.round(leg.distanceKm).toLocaleString(lang)} km<br>
      ${labels.durationLabel} ${leg.durationDays} ${labels.durationUnit}
    `;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  function hideTooltip() {
    tooltip.hidden = true;
    hoveredLeg = null;
  }

  function legAtEvent(event: MouseEvent): { x: number; y: number; leg: Leg | null } {
    const rect = trailsCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const leg = viewMode === 'static' ? findLegNearStatic(x, y) : findLegNear(x, y);
    return { x, y, leg };
  }

  trailsCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y, leg } = legAtEvent(event);
    if (leg === hoveredLeg) {
      if (leg) showTooltip(leg, x, y);
      return;
    }
    hoveredLeg = leg;
    if (leg) showTooltip(leg, x, y);
    else hideTooltip();
    redrawIfStatic();
  });

  trailsCanvas.addEventListener('pointerleave', () => {
    if (!pinned) {
      hideTooltip();
      redrawIfStatic();
    }
  });

  trailsCanvas.addEventListener('click', (event) => {
    const { x, y, leg } = legAtEvent(event);
    if (leg) {
      hoveredLeg = leg;
      pinned = true;
      showTooltip(leg, x, y);
    } else {
      pinned = false;
      hideTooltip();
    }
    redrawIfStatic();
  });

  updateEmptyState();
}
