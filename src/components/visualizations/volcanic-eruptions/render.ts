import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig, same accepted gap as bird-migrations/render.ts.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

interface Volcano {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface RawEruption {
  volcanoId: string;
  year: number;
  vei: number | null;
  yearUncertainty: number | null;
  yearModifier: '?' | '<' | '>' | null;
  notable?: boolean;
}

// Raw geometry, no Feature/properties wrapper, same shape as earthquakes'
// rivers.json/plateBoundaries.
interface MultiLineStringData {
  type: 'MultiLineString';
  coordinates: number[][][];
}

interface VolcanicData {
  generatedAt: string;
  volcanoes: Volcano[];
  eruptions: RawEruption[];
}

// Interpolation-only field, same "spread evenly across the year" trick as
// earthquakes/render.ts assignSimYears: without it, every eruption dated to
// the same whole year would fire on the exact same frame.
interface Eruption extends RawEruption {
  simYear: number;
}

export interface VolcanicEruptionsLabels {
  loading: string;
  error: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  yearLabel: string;
  yearBcSuffix: string;
  eruptionsCountLabel: string;
  mostRecentLabel: string;
  maxVeiLabel: string;
  veiUnknown: string;
  noEruptions: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
}

type Speed = 'slow' | 'normal' | 'fast';
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };

// Continuous loop across the whole covered period, no hold-at-end (same
// "Lecture automatique en boucle" convention as bird-migrations/earthquakes).
// 120s, longer than earthquakes' 90s: 10,978 eruptions over ~10,026 years is a
// bigger catalog over a far longer span (technical-specifications.md
// "Animation" - an order-of-magnitude jump in temporal compression versus
// every other looping visualization on the site), confirmed by watching a
// real cycle play rather than derived from the count alone.
const TOTAL_DURATION_MS = 120_000;

// Fixed real-time pulse life, independent of playback speed
// (technical-specifications.md "Rendu"): a pulse must stay legible even at
// "Rapide". Shorter than earthquakes' 850ms - a resting point is always
// there to click on, so the pulse itself only needs to register as a flash,
// not double as the hover/tap window like it does for earthquakes.
const PULSE_DURATION_MS = 700;
// Notable-eruption annotations linger longer than the pulse itself so the
// label stays readable after the flash fades, same fixed-real-time principle
// and duration as earthquakes.
const LABEL_DURATION_MS = 2_200;

const HIT_RADIUS_PX = 14;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
// Same step as earthquakes'/monument-layers'/paris-trees' zoom buttons.
const ZOOM_BUTTON_STEP = 1.5;

// Sequential orange, not the site's default sequential blue (reserved by
// earthquakes for magnitude, see style-guide.md "Palette dataviz"): the two
// visualizations share the same basemap and the same looping-pulse
// mechanism, so a distinct hue keeps them visually distinguishable. Same
// generation method as the blue ramp (OKLCH lightness steps, hue rotated to
// the categorical orange #eb6834's ~41°), validated with the dataviz skill's
// validate_palette.js (lightness monotonicity + single hue for a Sequential
// ramp - see technical-specifications.md "Palette" for the full validation
// note, including why the Ordinal-only light-end contrast check doesn't
// apply here).
const SEQUENTIAL_ORANGE: [string, string] = ['#ffd3c2', '#631b00'];
const VEI_DOMAIN: [number, number] = [0, 8];
const RADIUS_RANGE_PX: [number, number] = [3, 30];

// Permanent marker for every volcano, VEI-independent (technical-specifications.md
// "Palette"): style-guide.md "Fond de carte (illustration)".
const RESTING_POINT_COLOR = '#6b6455';
const RESTING_POINT_RADIUS_PX = 2.5;

const BASEMAP_FILL = '#e4e2da';
const RIVER_COLOR = '#a8c5da';
const RIVER_LINE_WIDTH_PX = 1.5;

// Same fixed reference frame as bird-migrations'/earthquakes' relief.webp
// alignment: a physical property of that raster file (rendered once at this
// Europe/Africa box), reused verbatim here even though this visualization's
// own live fitExtent target is the whole world.
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
// per-frame trigger cadence, as earthquakes/render.ts assignSimYears. `list`
// is already sorted by `year` ascending (data-model.md "Contraintes de
// validation"), ties keep the GVP catalog's own order.
function assignSimYears(list: RawEruption[]): Eruption[] {
  const result = new Array<Eruption>(list.length);
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

interface VolcanoStats {
  totalEruptions: number;
  mostRecentYear: number;
  maxVei: number | null;
}

function buildStatsByVolcano(eruptions: Eruption[]): Map<string, VolcanoStats> {
  const stats = new Map<string, VolcanoStats>();
  for (const eruption of eruptions) {
    const s = stats.get(eruption.volcanoId);
    if (!s) {
      stats.set(eruption.volcanoId, {
        totalEruptions: 1,
        mostRecentYear: eruption.year,
        maxVei: eruption.vei,
      });
      continue;
    }
    s.totalEruptions++;
    if (eruption.year > s.mostRecentYear) s.mostRecentYear = eruption.year;
    if (eruption.vei !== null && (s.maxVei === null || eruption.vei > s.maxVei)) s.maxVei = eruption.vei;
  }
  return stats;
}

interface ActivePulse {
  eruption: Eruption;
  volcano: Volcano;
  baseX: number;
  baseY: number;
  startTime: number;
}

export async function mountVolcanicEruptions(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: VolcanicEruptionsLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-volcanic-eruptions');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-volcanic-eruptions__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: VolcanicData;
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
      fetchJson<VolcanicData>('/data/volcanic-eruptions/eruptions.json'),
      fetchJson<any>('/data/volcanic-eruptions/basemap.json'),
      fetchJson<MultiLineStringData>('/data/volcanic-eruptions/rivers.json'),
    ]);
    data = dataResult;
    basemapTopology = basemapResult;
    riversData = riversResult;
    reliefImg.src = '/data/volcanic-eruptions/relief.webp';
    await reliefLoaded;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const volcanoes = data.volcanoes;
  const volcanoIndexById = new Map(volcanoes.map((v, i) => [v.id, i]));
  const eruptions = assignSimYears(data.eruptions);
  const statsByVolcano = buildStatsByVolcano(eruptions);
  const startYear = eruptions[0].year;
  const endYear = eruptions[eruptions.length - 1].year + 1;
  const totalYears = endYear - startYear;

  const radiusScale = scaleSqrt().domain(VEI_DOMAIN).range(RADIUS_RANGE_PX).clamp(true);
  const colorScale = scaleLinear<string>().domain(VEI_DOMAIN).range(SEQUENTIAL_ORANGE).clamp(true);
  const countFormatter = new Intl.NumberFormat(lang);
  // Calendar years never take a thousands separator ("6300 av. J.-C.", not
  // "6 300 av. J.-C."), unlike a plain quantity - useGrouping: false keeps
  // Intl.NumberFormat's locale-aware digits without that grouping.
  const yearFormatter = new Intl.NumberFormat(lang, { useGrouping: false });
  function formatYear(year: number): string {
    return year < 0 ? `${yearFormatter.format(-year)} ${labels.yearBcSuffix}` : yearFormatter.format(year);
  }

  // --- Layout -----------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-volcanic-eruptions__controls';
  root.appendChild(controls);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-volcanic-eruptions__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  controls.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-volcanic-eruptions__speed';
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

  const yearGroup = document.createElement('div');
  yearGroup.className = 'dv-volcanic-eruptions__year-group';
  controls.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-volcanic-eruptions-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-volcanic-eruptions-year';
  yearSlider.className = 'dv-volcanic-eruptions__year-slider';
  yearSlider.min = String(startYear);
  yearSlider.max = String(endYear - 1);
  yearSlider.step = '1';
  yearGroup.appendChild(yearSlider);

  const yearEl = document.createElement('span');
  yearEl.className = 'dv-volcanic-eruptions__year';
  yearGroup.appendChild(yearEl);

  const stage = document.createElement('div');
  stage.className = 'dv-volcanic-eruptions__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-volcanic-eruptions__canvas';
  const pulsesCanvas = document.createElement('canvas');
  pulsesCanvas.className = 'dv-volcanic-eruptions__canvas';
  stage.append(basemapCanvas, pulsesCanvas);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-volcanic-eruptions__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-volcanic-eruptions__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-volcanic-eruptions__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-volcanic-eruptions__zoom-button dv-volcanic-eruptions__zoom-button--reset';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const annotation = document.createElement('div');
  annotation.className = 'dv-volcanic-eruptions__annotation';
  annotation.hidden = true;
  stage.appendChild(annotation);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-volcanic-eruptions__tooltip';
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

  // Base (pre-zoom) pixel position of every volcano, recomputed on resize:
  // shared by the permanent resting points, every pulse trigger, and the
  // hover/tap hit-test (avoids calling `projection()` repeatedly), same
  // pattern as earthquakes' baseX/baseY cache.
  let baseX = new Float64Array(0);
  let baseY = new Float64Array(0);

  // Mutable playback/interaction state, declared before `resize()` (which
  // synchronously calls drawBackground()/renderPulses() on mount and reads
  // these) for the same reason as earthquakes/render.ts.
  let playing = true;
  let speed: Speed = 'normal';
  let playedMs = 0;
  let cursor = 0;
  let activePulses: ActivePulse[] = [];
  let activeNotable: ActivePulse | null = null;
  let hovered: Volcano | null = null;
  let pinned = false;

  function buildPositionCache() {
    baseX = new Float64Array(volcanoes.length);
    baseY = new Float64Array(volcanoes.length);
    for (let i = 0; i < volcanoes.length; i++) {
      const p = projection([volcanoes[i].lng, volcanoes[i].lat]);
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
    // "Techno carte".
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
    // Land-only clip lifted before the resting points below: unlike rivers,
    // some volcanoes sit close enough to the coastline that the silhouette's
    // simplified tracing can place them just outside it.
    basemapCtx.restore();

    basemapCtx.fillStyle = RESTING_POINT_COLOR;
    const restingRadius = RESTING_POINT_RADIUS_PX / transform.k;
    for (let i = 0; i < volcanoes.length; i++) {
      basemapCtx.beginPath();
      basemapCtx.arc(baseX[i], baseY[i], restingRadius, 0, Math.PI * 2);
      basemapCtx.fill();
    }

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

  function triggerPulse(eruption: Eruption) {
    const index = volcanoIndexById.get(eruption.volcanoId);
    if (index === undefined) return;
    const startTime = performance.now();
    const pulse: ActivePulse = { eruption, volcano: volcanoes[index], baseX: baseX[index], baseY: baseY[index], startTime };
    activePulses.push(pulse);
    if (eruption.notable) activeNotable = pulse;
  }

  function updateYearIndicator(simYear: number) {
    const year = Math.floor(simYear);
    yearSlider.value = String(year);
    yearEl.textContent = formatYear(year);
  }

  // Number of eruptions with `simYear` at or before `year` (eruptions is
  // already sorted by simYear ascending): the trigger cursor for a manual
  // jump to that year, same binary-search pattern as earthquakes'
  // cursorForSimYear.
  function cursorForSimYear(year: number): number {
    let lo = 0;
    let hi = eruptions.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (eruptions[mid].simYear <= year) lo = mid + 1;
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
    annotation.textContent = `${activeNotable.volcano.name} (${formatYear(activeNotable.eruption.year)})`;
    annotation.style.left = `${x}px`;
    annotation.style.top = `${y}px`;
    annotation.hidden = false;
  }

  function renderPulses() {
    const now = performance.now();
    pulsesCtx.clearRect(0, 0, width, height);
    activePulses = activePulses.filter((pulse) => now - pulse.startTime <= PULSE_DURATION_MS);
    for (const pulse of activePulses) {
      const t = (now - pulse.startTime) / PULSE_DURATION_MS;
      const vei = pulse.eruption.vei ?? 0;
      const maxRadius = radiusScale(vei);
      const radius = maxRadius * (0.35 + 0.65 * t);
      const alpha = 0.85 * (1 - t);
      const [x, y] = projectPixel(pulse.baseX, pulse.baseY);
      pulsesCtx.beginPath();
      pulsesCtx.arc(x, y, radius, 0, Math.PI * 2);
      pulsesCtx.globalAlpha = alpha;
      pulsesCtx.fillStyle = colorScale(vei);
      pulsesCtx.fill();
    }
    pulsesCtx.globalAlpha = 1;
    updateAnnotation(now);
  }

  let lastFrameTime = performance.now();
  d3Timer(() => {
    const now = performance.now();
    const dtMs = now - lastFrameTime;
    lastFrameTime = now;
    if (playing) {
      const previousPlayedMs = playedMs;
      playedMs = (playedMs + dtMs * SPEED_FACTORS[speed]) % TOTAL_DURATION_MS;
      if (playedMs < previousPlayedMs) cursor = 0; // loop wrapped: restart the sweep from the first year

      const simYear = startYear + (playedMs / TOTAL_DURATION_MS) * totalYears;
      while (cursor < eruptions.length && eruptions[cursor].simYear <= simYear) {
        triggerPulse(eruptions[cursor]);
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
  // earthquakes'/monument-layers' year sliders. Jumping the cursor clears
  // whatever pulse is mid-flight, but NOT the resting points or the
  // tooltip/pin state: a resting point stays hoverable independent of the
  // playhead (functional-specifications.md "Survol/tap d'un volcan"),
  // unlike earthquakes' transient epicenters.
  yearSlider.addEventListener('input', () => {
    playing = false;
    playButton.textContent = labels.play;
    playButton.setAttribute('aria-pressed', 'false');

    const targetYear = Number(yearSlider.value);
    playedMs = ((targetYear - startYear) / totalYears) * TOTAL_DURATION_MS;
    cursor = cursorForSimYear(targetYear);
    activePulses = [];
    activeNotable = null;
    updateYearIndicator(targetYear);
    renderPulses();
  });

  // --- Tooltip --------------------------------------------------------------
  function hideTooltip() {
    tooltip.hidden = true;
    hovered = null;
  }

  function showTooltip(volcano: Volcano, x: number, y: number) {
    const stats = statsByVolcano.get(volcano.id);
    const statsHtml = stats
      ? `${labels.eruptionsCountLabel} ${countFormatter.format(stats.totalEruptions)}<br>` +
        `${labels.mostRecentLabel} ${formatYear(stats.mostRecentYear)}<br>` +
        `${labels.maxVeiLabel} ${stats.maxVei ?? labels.veiUnknown}`
      : labels.noEruptions;
    tooltip.innerHTML = `
      <strong>${volcano.name}</strong><br>
      ${volcano.country}<br>
      ${statsHtml}
    `;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.hidden = false;
  }

  // Hit-test against every resting point, not just active pulses (unlike
  // earthquakes' findActiveNear): a volcano is hoverable/tappable at any
  // time, whether or not it happens to be pulsing right now
  // (functional-specifications.md "Survol/tap d'un volcan"). A linear scan
  // over 1,214 points per pointer event is cheap enough to not need a
  // spatial index (unlike paris-trees' ~194,000 trees).
  function findNearestVolcano(x: number, y: number): Volcano | null {
    let closest: Volcano | null = null;
    let closestDist = HIT_RADIUS_PX;
    for (let i = 0; i < volcanoes.length; i++) {
      const [px, py] = projectPixel(baseX[i], baseY[i]);
      const dist = Math.hypot(px - x, py - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = volcanoes[i];
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
    const hit = findNearestVolcano(x, y);
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
    const hit = findNearestVolcano(x, y);
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
