import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig, same accepted gap as bird-migrations/render.ts.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

interface RawEarthquake {
  id: string;
  lat: number;
  lng: number;
  year: number;
  magnitude: number;
  depthKm: number | null;
  place: string;
  notable?: boolean;
  nameFr?: string;
  nameEn?: string;
}

// Raw geometry, no Feature/properties wrapper (data-model.md "Contraintes de
// validation propres à cette visualisation": a single MultiLineString, not a
// FeatureCollection), same shape as monument-layers' rivers.json/roads.json.
interface MultiLineStringData {
  type: 'MultiLineString';
  coordinates: number[][][];
}

interface EarthquakesData {
  generatedAt: string;
  plateBoundaries: MultiLineStringData;
  earthquakes: RawEarthquake[];
}

// Interpolation-only field, computed once at mount from the sorted `year`
// values (see assignSimYears below): the data-model only carries a whole
// `year`, so a whole decade can pack over a thousand events into the same
// integer tick. Spreading each year's events evenly across [year, year+1)
// keeps the loop's per-frame trigger a steady trickle instead of one giant
// simultaneous burst every time the simulated year rolls over.
interface Earthquake extends RawEarthquake {
  simYear: number;
}

export interface EarthquakesLabels {
  loading: string;
  error: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  yearLabel: string;
  magnitudeLabel: string;
  depthLabel: string;
  depthUnit: string;
  depthUnknown: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
}

type Speed = 'slow' | 'normal' | 'fast';
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };

// Continuous loop across the whole covered period, no hold-at-end (same
// "Lecture automatique en boucle" convention as bird-migrations/volcanic-eruptions,
// not the hold-then-restart convention of monument-layers/satellites-in-orbit).
// ~14,500 events over ~126 years is a much denser catalog than the "few
// thousand" originally estimated in data-model.md (see "Points à valider à
// l'implémentation" in technical-specifications.md): simulated against the
// real data (peak decades run ~150 events/simulated-year), a 60s cycle keeps
// up to ~350 pulses alive at once during the densest years, 90s brings that
// down to ~240 — picked as the calmer compromise, but this is exactly the
// kind of value the spec flags for a visual check once someone actually
// watches it play (see BUILD-PLAN.md's "à caler une fois un premier rendu
// réel observable" precedent on other looping visualizations).
const TOTAL_DURATION_MS = 90_000;

// Fixed real-time pulse life, independent of playback speed (technical-specifications.md
// "Rendu"): a pulse must stay legible even at "Rapide". Also doubles as the
// hover/tap window (functional-specifications.md "Survol/tap d'un point"):
// an epicenter is only interactive while its pulse is still visible, not
// permanently like volcanic-eruptions' resting volcanoes.
const PULSE_DURATION_MS = 850;
// Notable-earthquake annotations linger longer than the pulse itself so the
// label stays readable after the flash fades, same fixed-real-time principle.
const LABEL_DURATION_MS = 2_200;

const HIT_RADIUS_PX = 14;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
// Same step as monument-layers'/paris-trees' zoom buttons.
const ZOOM_BUTTON_STEP = 1.5;

// Sequential blue, same two endpoints as monument-layers' SEQUENTIAL_BLUE
// (style-guide.md "Palette dataviz", paliers 100/700): magnitude 6 lightest,
// magnitude 9.5 (the real maximum in this catalog, the 1960 Chile earthquake)
// darkest and most saturated.
const SEQUENTIAL_BLUE: [string, string] = ['#cde2fb', '#0d366b'];
const MAGNITUDE_DOMAIN: [number, number] = [6, 9.5];
const RADIUS_RANGE_PX: [number, number] = [3, 30];

const BASEMAP_FILL = '#e4e2da';
const RIVER_COLOR = '#a8c5da';
const RIVER_LINE_WIDTH_PX = 1.5;
// New design-system value (style-guide.md "Fond de carte (illustration)"),
// added there alongside this visualization: muted enough to stay secondary
// to the pulses (technical-specifications.md "Techno carte"), distinct from
// the river blue and from the magnitude scale above.
const PLATE_BOUNDARY_COLOR = '#b3a696';
const PLATE_BOUNDARY_LINE_WIDTH_PX = 1;

// Same fixed reference frame as bird-migrations' relief.webp alignment (see its
// render.ts for the full explanation): a physical property of that raster file
// (rendered once at this Europe/Africa box), reused verbatim here even though
// this visualization's own live fitExtent target is the whole world (see
// resize() below) — the affine relief/live-frame relationship it produces
// holds for any live scale/translate, not only the box it was derived from.
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
const RELIEF_REFERENCE_BOUNDS = {
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

// Same year-only grouping, spread evenly across the year for a smoother
// per-frame trigger cadence (see the `Earthquake` interface above). `list`
// is already sorted by `year` ascending (data-model.md "Contraintes de
// validation"), and ties keep the USGS catalog's own chronological order.
function assignSimYears(list: RawEarthquake[]): Earthquake[] {
  const result = new Array<Earthquake>(list.length);
  let i = 0;
  while (i < list.length) {
    let j = i;
    while (j < list.length && list[j].year === list[i].year) j++;
    const count = j - i;
    for (let k = i; k < j; k++) {
      result[k] = { ...list[k], simYear: list[k].year + (k - i + 0.5) / count };
    }
    i = j;
  }
  return result;
}

interface ActivePulse {
  eq: Earthquake;
  baseX: number;
  baseY: number;
  startTime: number;
}

export async function mountEarthquakes(root: HTMLElement, lang: 'fr' | 'en', labels: EarthquakesLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-earthquakes');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-earthquakes__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: EarthquakesData;
  let basemapTopology: any;
  let riversData: MultiLineStringData;
  const reliefImg = new Image();
  try {
    const reliefLoaded = new Promise<void>((resolve, reject) => {
      reliefImg.onload = () => resolve();
      reliefImg.onerror = () => reject(new Error('relief image failed to load'));
    });
    const fetchJson = <T,>(url: string) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<T>;
      });
    const [dataResult, basemapResult, riversResult] = await Promise.all([
      fetchJson<EarthquakesData>('/data/earthquakes/earthquakes.json'),
      fetchJson<any>('/data/earthquakes/basemap.json'),
      fetchJson<MultiLineStringData>('/data/earthquakes/rivers.json'),
    ]);
    data = dataResult;
    basemapTopology = basemapResult;
    riversData = riversResult;
    reliefImg.src = '/data/earthquakes/relief.webp';
    await reliefLoaded;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const earthquakes = assignSimYears(data.earthquakes);
  const startYear = earthquakes[0].year;
  const endYear = earthquakes[earthquakes.length - 1].year + 1;
  const totalYears = endYear - startYear;

  const radiusScale = scaleSqrt().domain(MAGNITUDE_DOMAIN).range(RADIUS_RANGE_PX).clamp(true);
  const colorScale = scaleLinear<string>().domain(MAGNITUDE_DOMAIN).range(SEQUENTIAL_BLUE).clamp(true);

  // --- Layout -----------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-earthquakes__controls';
  root.appendChild(controls);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-earthquakes__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  controls.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-earthquakes__speed';
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
  controls.appendChild(speedSelect);

  // Grouped so the label, slider and value move together when the controls
  // row wraps on narrow viewports, same structure as monument-layers/light-pollution.
  const yearGroup = document.createElement('div');
  yearGroup.className = 'dv-earthquakes__year-group';
  controls.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-earthquakes-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-earthquakes-year';
  yearSlider.className = 'dv-earthquakes__year-slider';
  yearSlider.min = String(startYear);
  yearSlider.max = String(endYear - 1);
  yearSlider.step = '1';
  yearGroup.appendChild(yearSlider);

  const yearEl = document.createElement('span');
  yearEl.className = 'dv-earthquakes__year';
  yearGroup.appendChild(yearEl);

  const stage = document.createElement('div');
  stage.className = 'dv-earthquakes__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-earthquakes__canvas';
  const pulsesCanvas = document.createElement('canvas');
  pulsesCanvas.className = 'dv-earthquakes__canvas';
  stage.append(basemapCanvas, pulsesCanvas);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-earthquakes__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-earthquakes__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-earthquakes__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-earthquakes__zoom-button dv-earthquakes__zoom-button--reset';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const annotation = document.createElement('div');
  annotation.className = 'dv-earthquakes__annotation';
  annotation.hidden = true;
  stage.appendChild(annotation);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-earthquakes__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  // --- Projection & zoom --------------------------------------------------
  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.land);

  const basemapCtx = basemapCanvas.getContext('2d')!;
  const pulsesCtx = pulsesCanvas.getContext('2d')!;
  const projection = geoNaturalEarth1();
  const path = geoPath(projection, basemapCtx);
  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;
  let reliefScale = 1;
  let reliefOffsetX = 0;
  let reliefOffsetY = 0;

  // Base (pre-zoom) pixel position of every earthquake, recomputed on resize
  // and reused for every pulse trigger and hit-test in between (avoids calling
  // `projection()` ~14,500 times per resize being the only cost, same pattern
  // as monument-layers' px/py cache).
  let baseX = new Float64Array(0);
  let baseY = new Float64Array(0);

  // Mutable playback/interaction state, declared here (before `resize()` is
  // defined and called below) rather than closer to the code that mutates
  // it: `resize()` synchronously calls `renderPulses()`/`updateAnnotation()`
  // on mount, which read `activePulses`/`activeNotable`/`hovered`/`pinned` —
  // as `let` bindings, those must already be initialized by then, not just
  // hoisted, or the very first resize() throws.
  let playing = true;
  let speed: Speed = 'normal';
  let playedMs = 0;
  let cursor = 0;
  let activePulses: ActivePulse[] = [];
  let activeNotable: ActivePulse | null = null;
  let hovered: ActivePulse | null = null;
  let pinned = false;

  function buildPositionCache() {
    baseX = new Float64Array(earthquakes.length);
    baseY = new Float64Array(earthquakes.length);
    for (let i = 0; i < earthquakes.length; i++) {
      const p = projection([earthquakes[i].lng, earthquakes[i].lat]);
      if (!p) continue;
      baseX[i] = p[0];
      baseY[i] = p[1];
    }
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    height = Math.max(320, Math.min(rect.width * 0.6, heightCeiling));
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, pulsesCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Reference frame relief.webp was rendered at (see RELIEF_REF_WIDTH etc.
    // above): recomputed here purely to read off refScale/refTranslate, not
    // because the live fitExtent below needs to share its geometry.
    projection.fitExtent(
      [
        [24, 24],
        [RELIEF_REF_WIDTH - 24, RELIEF_REF_HEIGHT - 24],
      ],
      RELIEF_REFERENCE_BOUNDS as any
    );
    const refScale = projection.scale();
    const refTranslate = projection.translate();

    // Live frame: the whole world silhouette, per technical-specifications.md
    // "Projection" (unlike bird-migrations' own Europe/Africa crop).
    projection.fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      landFeature as any
    );
    reliefScale = projection.scale() / refScale;
    reliefOffsetX = projection.translate()[0] - reliefScale * (refTranslate[0] - RELIEF_ORIGIN_X);
    reliefOffsetY = projection.translate()[1] - reliefScale * (refTranslate[1] - RELIEF_ORIGIN_Y);

    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    buildPositionCache();
    drawBackground();
    renderPulses();
  }

  function drawBackground() {
    basemapCtx.save();
    basemapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    basemapCtx.clearRect(0, 0, width, height);
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);

    basemapCtx.beginPath();
    path(landFeature as any);
    basemapCtx.fillStyle = BASEMAP_FILL;
    basemapCtx.fill();
    basemapCtx.save();
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
    // Land-only clip lifted before the plate boundaries below: unlike rivers,
    // boundaries run through open ocean as often as through land (mid-ocean
    // ridges, subduction trenches) and must stay visible there too.
    basemapCtx.restore();

    basemapCtx.strokeStyle = PLATE_BOUNDARY_COLOR;
    basemapCtx.lineWidth = PLATE_BOUNDARY_LINE_WIDTH_PX / transform.k;
    basemapCtx.lineCap = 'round';
    basemapCtx.lineJoin = 'round';
    basemapCtx.beginPath();
    path(data.plateBoundaries as any);
    basemapCtx.stroke();

    basemapCtx.restore();
    pulsesCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .on('zoom', (event) => {
      transform = event.transform;
      drawBackground();
      renderPulses();
      updateZoomButtons();
    });
  select(pulsesCanvas).call(zoomBehavior as any);

  function updateZoomButtons() {
    zoomOutButton.disabled = transform.k <= MIN_ZOOM;
    zoomInButton.disabled = transform.k >= MAX_ZOOM;
  }
  updateZoomButtons();

  zoomInButton.addEventListener('click', () => {
    select(pulsesCanvas).call(zoomBehavior.scaleBy as any, ZOOM_BUTTON_STEP);
  });
  zoomOutButton.addEventListener('click', () => {
    select(pulsesCanvas).call(zoomBehavior.scaleBy as any, 1 / ZOOM_BUTTON_STEP);
  });
  zoomResetButton.addEventListener('click', () => {
    select(pulsesCanvas).call(zoomBehavior.transform as any, zoomIdentity);
  });

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });
  resize();

  // --- Animation ----------------------------------------------------------
  function projectPixel(x: number, y: number): [number, number] {
    return [transform.applyX(x), transform.applyY(y)];
  }

  function triggerPulse(eq: Earthquake, index: number) {
    const startTime = performance.now();
    activePulses.push({ eq, baseX: baseX[index], baseY: baseY[index], startTime });
    if (eq.notable) {
      activeNotable = { eq, baseX: baseX[index], baseY: baseY[index], startTime };
    }
  }

  const yearFormatter = new Intl.DateTimeFormat(lang, { year: 'numeric' });
  let lastYearLabel = '';

  function updateYearIndicator(simYear: number) {
    yearSlider.value = String(Math.floor(simYear));
    const label = yearFormatter.format(new Date(Date.UTC(Math.floor(simYear), 0, 1)));
    if (label !== lastYearLabel) {
      lastYearLabel = label;
      yearEl.textContent = label;
    }
  }

  // Number of earthquakes with `simYear` at or before `year` (earthquakes is
  // already sorted by simYear ascending, see assignSimYears above): the
  // trigger cursor for a manual jump to that year, same binary-search
  // pattern as monument-layers' cursorForYear.
  function cursorForSimYear(year: number): number {
    let lo = 0;
    let hi = earthquakes.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (earthquakes[mid].simYear <= year) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function updateAnnotation(now: number) {
    if (!activeNotable) {
      annotation.hidden = true;
      return;
    }
    const age = now - activeNotable.startTime;
    if (age > LABEL_DURATION_MS) {
      activeNotable = null;
      annotation.hidden = true;
      return;
    }
    const [x, y] = projectPixel(activeNotable.baseX, activeNotable.baseY);
    const name = lang === 'fr' ? activeNotable.eq.nameFr : activeNotable.eq.nameEn;
    annotation.textContent = `${name} (${activeNotable.eq.year})`;
    annotation.style.left = `${x}px`;
    annotation.style.top = `${y}px`;
    annotation.hidden = false;
  }

  function renderPulses() {
    const now = performance.now();
    pulsesCtx.clearRect(0, 0, width, height);
    activePulses = activePulses.filter((pulse) => now - pulse.startTime <= PULSE_DURATION_MS);
    for (const pulse of activePulses) {
      const age = now - pulse.startTime;
      const t = age / PULSE_DURATION_MS;
      const maxRadius = radiusScale(pulse.eq.magnitude);
      const radius = maxRadius * (0.35 + 0.65 * t);
      const alpha = 0.85 * (1 - t);
      const [x, y] = projectPixel(pulse.baseX, pulse.baseY);
      pulsesCtx.beginPath();
      pulsesCtx.arc(x, y, radius, 0, Math.PI * 2);
      pulsesCtx.globalAlpha = alpha;
      pulsesCtx.fillStyle = colorScale(pulse.eq.magnitude);
      pulsesCtx.fill();
    }
    pulsesCtx.globalAlpha = 1;
    updateAnnotation(now);
    if (hovered && now - hovered.startTime > PULSE_DURATION_MS) {
      pinned = false;
      hideTooltip();
    }
  }

  let lastFrameTime = performance.now();
  d3Timer(() => {
    const now = performance.now();
    const dtMs = now - lastFrameTime;
    lastFrameTime = now;
    if (playing) {
      const previousPlayedMs = playedMs;
      playedMs = (playedMs + dtMs * SPEED_FACTORS[speed]) % TOTAL_DURATION_MS;
      if (playedMs < previousPlayedMs) cursor = 0; // loop wrapped: restart the sweep from year 1

      const simYear = startYear + (playedMs / TOTAL_DURATION_MS) * totalYears;
      while (cursor < earthquakes.length && earthquakes[cursor].simYear <= simYear) {
        triggerPulse(earthquakes[cursor], cursor);
        cursor++;
      }
      updateYearIndicator(simYear);
    }
    renderPulses();
  });

  playButton.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as Speed;
  });

  // Manual scrubbing takes over from autoplay, same convention as
  // monument-layers'/light-pollution's year sliders: without this, autoplay
  // would fight the visitor's drag on every frame. Jumping the cursor also
  // clears whatever is mid-flight (activePulses/activeNotable/tooltip): a
  // pulse is a transient event tied to the instant it fired, not a
  // persistent point, so it makes no sense to keep it alive across a jump
  // to an unrelated year.
  yearSlider.addEventListener('input', () => {
    playing = false;
    playButton.textContent = labels.play;
    playButton.setAttribute('aria-pressed', 'false');

    const targetYear = Number(yearSlider.value);
    playedMs = ((targetYear - startYear) / totalYears) * TOTAL_DURATION_MS;
    cursor = cursorForSimYear(targetYear);
    activePulses = [];
    activeNotable = null;
    pinned = false;
    hideTooltip();
    updateYearIndicator(targetYear);
    renderPulses();
  });

  // --- Tooltip --------------------------------------------------------------
  function hideTooltip() {
    tooltip.hidden = true;
    hovered = null;
  }

  function showTooltip(pulse: ActivePulse, x: number, y: number) {
    const eq = pulse.eq;
    const depthText = eq.depthKm === null ? labels.depthUnknown : `${Math.round(eq.depthKm)} ${labels.depthUnit}`;
    tooltip.innerHTML = `
      <strong>${eq.place}</strong><br>
      ${eq.year}<br>
      ${labels.magnitudeLabel} M ${eq.magnitude.toFixed(1)}<br>
      ${labels.depthLabel} ${depthText}
    `;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  // Only the currently-pulsing epicenters are hit-testable (functional-specifications.md
  // "Survol/tap d'un point"): a plain linear scan over `activePulses` (bounded
  // by PULSE_DURATION_MS × trigger rate, at most a few hundred even in the
  // densest decades) rather than a spatial index over the full ~14,500 points.
  function findActiveNear(x: number, y: number): ActivePulse | null {
    let closest: ActivePulse | null = null;
    let closestDist = HIT_RADIUS_PX;
    for (const pulse of activePulses) {
      const [px, py] = projectPixel(pulse.baseX, pulse.baseY);
      const dist = Math.hypot(px - x, py - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pulse;
      }
    }
    return closest;
  }

  function relativeCoords(event: PointerEvent): { x: number; y: number } {
    const rect = pulsesCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  pulsesCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y } = relativeCoords(event);
    const hit = findActiveNear(x, y);
    if (hit === hovered) {
      if (hit) showTooltip(hit, x, y);
      return;
    }
    hovered = hit;
    if (hit) showTooltip(hit, x, y);
    else hideTooltip();
  });

  pulsesCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  pulsesCanvas.addEventListener('click', (event) => {
    const { x, y } = relativeCoords(event);
    const hit = findActiveNear(x, y);
    if (hit) {
      hovered = hit;
      pinned = true;
      showTooltip(hit, x, y);
    } else {
      pinned = false;
      hideTooltip();
    }
  });
}
