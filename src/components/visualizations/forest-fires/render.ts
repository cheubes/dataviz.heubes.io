import { geoMercator, geoPath } from 'd3-geo';
import { scaleSqrt } from 'd3-scale';
import { select } from 'd3-selection';
import { timer as d3Timer } from 'd3-timer';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
// topojson-client ships no bundled types; resolves to `any` under this project's
// moduleResolution setting, same accepted gap as monument-layers/render.ts.
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

type Cause = 'natural' | 'human' | 'malicious' | 'unknown';

interface Department {
  code: string;
  nameFr: string;
  nameEn: string;
}

interface Fire {
  id: string;
  commune: string;
  lat: number;
  lng: number;
  departmentCode: string;
  year: number;
  date: string;
  burntArea: number;
  cause: Cause;
}

interface ForestFiresData {
  generatedAt: string;
  departments: Department[];
  fires: Fire[];
}

export interface ForestFiresLabels {
  loading: string;
  error: string;
  countLabel: string;
  areaLabel: string;
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
  dateLabel: string;
  areaDetailLabel: string;
  causeLabel: string;
  causeNatural: string;
  causeHuman: string;
  causeMalicious: string;
  causeUnknown: string;
  viewRecordLabel: string;
}

type Speed = 'slow' | 'normal' | 'fast';
// Same convention and factors as light-pollution/monument-layers.
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };

// Same discrete year-step model as light-pollution (each step swaps the whole
// point set rather than accumulating or morphing, functional-specifications.md
// "Interactions"), same step/hold durations: twenty years isn't different
// enough from light-pollution's thirteen to warrant its own pacing.
const STEP_MS = 900;
const HOLD_MS = 2000;

// Style-guide.md "Palette dataviz", slot 2 (orange), light value only: the
// site has no active dark theme yet (see "Couleurs" in style-guide.md), and
// this is a fixed illustration tint for the subject (technical-specifications.md
// "Palette"), not a data encoding that would need a scale.
const FIRE_COLOR = '#eb6834';
// Same illustration fill/stroke pair as monument-layers/paris-trees (style-guide.md
// "Fond de carte (illustration)"), the other Canvas-rendered France silhouette maps.
const BASEMAP_FILL = '#e4e2da';
const BASEMAP_STROKE = '#acb2b8';

// Range floor keeps the very numerous sub-hectare fires (median burnt area is
// 0.1 ha, see data-model.md "Statistiques mesurées") visible and clickable;
// range ceiling keeps the 2022 Gironde/Landiras fire (12,552 ha, by far the
// largest in the dataset) from covering a disproportionate share of the map.
const MIN_RADIUS_PX = 1.5;
const MAX_RADIUS_PX = 32;
const HIT_RADIUS_PADDING_PX = 3;

const MIN_ZOOM = 1;
// Country-scale initial view, same order of magnitude as monument-layers'
// starting point rather than its final 1,000 (calibrated there for monuments
// literally sharing a commune): a fire year tops out at a few thousand points
// nationally, not tens of thousands accumulated, so separating same-commune
// fires needs less extreme zoom.
const MAX_ZOOM = 200;
// Same step as monument-layers'/paris-trees' zoom buttons.
const ZOOM_BUTTON_STEP = 1.5;

function bdiffUrl(id: string): string {
  const [year, numero] = id.split('-');
  return `https://bdiff.agriculture.gouv.fr/incendie/${year}/${numero}`;
}

function causeLabel(cause: Cause, labels: ForestFiresLabels): string {
  switch (cause) {
    case 'natural':
      return labels.causeNatural;
    case 'human':
      return labels.causeHuman;
    case 'malicious':
      return labels.causeMalicious;
    case 'unknown':
      return labels.causeUnknown;
  }
}

export async function mountForestFires(root: HTMLElement, lang: 'fr' | 'en', labels: ForestFiresLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-forest-fires');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-forest-fires__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: ForestFiresData;
  let basemapTopology: any;
  try {
    const fetchJson = <T,>(url: string) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<T>;
      });
    const [dataResult, basemapResult] = await Promise.all([
      fetchJson<ForestFiresData>('/data/forest-fires/fires.json'),
      fetchJson<any>('/data/forest-fires/basemap.json'),
    ]);
    data = dataResult;
    basemapTopology = basemapResult;
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const { fires, departments } = data;
  const departmentByCode = new Map(departments.map((d) => [d.code, d]));

  const startYear = fires[0].year;
  const endYear = fires[fires.length - 1].year;
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  // `fires` is sorted by year ascending (data-model.md "Contraintes de
  // validation"): each year's slice is a contiguous range, found once at
  // mount rather than filtering the full array on every year change.
  function lowerBound(year: number): number {
    let lo = 0;
    let hi = fires.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (fires[mid].year < year) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
  const yearRanges = new Map<number, [number, number]>();
  for (const y of years) yearRanges.set(y, [lowerBound(y), lowerBound(y + 1)]);

  const maxBurntArea = fires.reduce((max, f) => Math.max(max, f.burntArea), 0);
  const radiusScale = scaleSqrt().domain([0, maxBurntArea]).range([MIN_RADIUS_PX, MAX_RADIUS_PX]);

  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.france);

  // --- Layout -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-forest-fires__controls';
  root.appendChild(controls);

  const readout = document.createElement('div');
  readout.className = 'dv-forest-fires__readout';
  controls.appendChild(readout);

  const countEl = document.createElement('span');
  countEl.className = 'dv-forest-fires__count';
  readout.appendChild(countEl);

  const areaEl = document.createElement('span');
  areaEl.className = 'dv-forest-fires__area';
  readout.appendChild(areaEl);

  const playback = document.createElement('div');
  playback.className = 'dv-forest-fires__playback';
  controls.appendChild(playback);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-forest-fires__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playback.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-forest-fires__speed';
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

  const yearGroup = document.createElement('div');
  yearGroup.className = 'dv-forest-fires__year-group';
  playback.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-forest-fires-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-forest-fires-year';
  yearSlider.className = 'dv-forest-fires__year-slider';
  yearSlider.min = '0';
  yearSlider.max = String(years.length - 1);
  yearSlider.step = '1';
  yearGroup.appendChild(yearSlider);

  const yearValueEl = document.createElement('span');
  yearValueEl.className = 'dv-forest-fires__year-value';
  yearGroup.appendChild(yearValueEl);

  const stage = document.createElement('div');
  stage.className = 'dv-forest-fires__stage';
  root.appendChild(stage);

  const basemapCanvas = document.createElement('canvas');
  basemapCanvas.className = 'dv-forest-fires__canvas';
  const firesCanvas = document.createElement('canvas');
  firesCanvas.className = 'dv-forest-fires__canvas';
  stage.append(basemapCanvas, firesCanvas);

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-forest-fires__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-forest-fires__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-forest-fires__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-forest-fires__zoom-button dv-forest-fires__zoom-button--reset';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-forest-fires__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  // --- Projection & zoom ---------------------------------------------------
  const basemapCtx = basemapCanvas.getContext('2d')!;
  const firesCtx = firesCanvas.getContext('2d')!;
  const projection = geoMercator();
  const path = geoPath(projection, basemapCtx);

  let transform: ZoomTransform = zoomIdentity;
  let width = 0;
  let height = 0;
  // Base (pre-zoom) pixel position of every fire, recomputed on resize and
  // reused across every year change and hit-test in between, same pattern as
  // monument-layers' px/py cache.
  let px = new Float64Array(0);
  let py = new Float64Array(0);

  function buildPositionCache() {
    px = new Float64Array(fires.length);
    py = new Float64Array(fires.length);
    for (let i = 0; i < fires.length; i++) {
      const p = projection([fires[i].lng, fires[i].lat]);
      if (!p) continue;
      px[i] = p[0];
      py[i] = p[1];
    }
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    height = Math.max(320, Math.min(rect.width * 0.6, heightCeiling));
    stage.style.height = `${height}px`;
    for (const canvas of [basemapCanvas, firesCanvas]) {
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
    buildPositionCache();
    drawBasemap();
    renderYear();
  }

  function drawBasemap() {
    basemapCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    basemapCtx.clearRect(0, 0, width, height);
    basemapCtx.save();
    basemapCtx.translate(transform.x, transform.y);
    basemapCtx.scale(transform.k, transform.k);
    basemapCtx.beginPath();
    path(landFeature as any);
    basemapCtx.fillStyle = BASEMAP_FILL;
    basemapCtx.fill();
    basemapCtx.strokeStyle = BASEMAP_STROKE;
    basemapCtx.lineWidth = 1 / transform.k;
    basemapCtx.stroke();
    basemapCtx.restore();
    firesCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  const zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .on('zoom', (event) => {
      transform = event.transform;
      drawBasemap();
      renderYear();
      updateZoomButtons();
    });
  select(firesCanvas).call(zoomBehavior as any);

  function updateZoomButtons() {
    zoomOutButton.disabled = transform.k <= MIN_ZOOM;
    zoomInButton.disabled = transform.k >= MAX_ZOOM;
  }
  updateZoomButtons();

  zoomInButton.addEventListener('click', () => {
    select(firesCanvas).call(zoomBehavior.scaleBy as any, ZOOM_BUTTON_STEP);
  });
  zoomOutButton.addEventListener('click', () => {
    select(firesCanvas).call(zoomBehavior.scaleBy as any, 1 / ZOOM_BUTTON_STEP);
  });
  zoomResetButton.addEventListener('click', () => {
    select(firesCanvas).call(zoomBehavior.transform as any, zoomIdentity);
  });

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(stage);

  // --- Year rendering -------------------------------------------------------
  let selectedYearIndex = 0;

  function paintFire(i: number) {
    const sx = transform.applyX(px[i]);
    const sy = transform.applyY(py[i]);
    firesCtx.beginPath();
    firesCtx.arc(sx, sy, radiusScale(fires[i].burntArea), 0, Math.PI * 2);
    firesCtx.fillStyle = FIRE_COLOR;
    firesCtx.fill();
  }

  const countFormatter = new Intl.NumberFormat(lang);
  const areaFormatter = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
  // Up to two decimals for a single fire (data-model.md: median burnt area is
  // 0.1 ha, plenty of fires stay well under one hectare): the year total
  // above never needs this precision, but rounding an individual small fire
  // to zero would misreport it as having burned nothing, same precision the
  // BDIFF record itself displays.
  const fireAreaFormatter = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });

  function renderYear() {
    const year = years[selectedYearIndex];
    yearValueEl.textContent = String(year);
    yearSlider.setAttribute('aria-valuetext', String(year));

    const [start, end] = yearRanges.get(year)!;
    firesCtx.clearRect(0, 0, width, height);
    let totalArea = 0;
    for (let i = start; i < end; i++) {
      paintFire(i);
      totalArea += fires[i].burntArea;
    }

    countEl.textContent = labels.countLabel.replace('{count}', countFormatter.format(end - start));
    areaEl.textContent = labels.areaLabel.replace('{area}', `${areaFormatter.format(totalArea / 10_000)} ha`);
  }

  function setYearIndex(index: number) {
    selectedYearIndex = index;
    yearSlider.value = String(index);
    hideTooltip();
    renderYear();
  }

  // --- Autoplay --------------------------------------------------------------
  let playing = true;
  let speed: Speed = 'normal';
  let holding = false;
  let holdElapsedMs = 0;
  let stepElapsedMs = 0;
  let lastFrameTime = performance.now();

  d3Timer(() => {
    const now = performance.now();
    const dtMs = now - lastFrameTime;
    lastFrameTime = now;
    if (!playing) return;

    if (holding) {
      holdElapsedMs += dtMs;
      if (holdElapsedMs >= HOLD_MS) {
        holding = false;
        holdElapsedMs = 0;
        setYearIndex(0);
      }
      return;
    }

    stepElapsedMs += dtMs * SPEED_FACTORS[speed];
    if (stepElapsedMs < STEP_MS) return;
    stepElapsedMs -= STEP_MS;

    if (selectedYearIndex < years.length - 1) {
      setYearIndex(selectedYearIndex + 1);
      if (selectedYearIndex === years.length - 1) holding = true;
    }
  });

  function updatePlayButton() {
    playButton.textContent = playing ? labels.pause : labels.play;
    playButton.setAttribute('aria-pressed', String(playing));
  }

  playButton.addEventListener('click', () => {
    playing = !playing;
    updatePlayButton();
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as Speed;
  });

  // Manual scrubbing takes over from autoplay, same convention as
  // light-pollution's/monument-layers' year sliders: without this, autoplay
  // would fight the visitor's drag on every frame.
  yearSlider.addEventListener('input', () => {
    playing = false;
    updatePlayButton();
    holding = false;
    stepElapsedMs = 0;
    setYearIndex(Number(yearSlider.value));
  });

  // --- Tooltip ----------------------------------------------------------------
  let hovered: number | null = null;
  let pinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    tooltip.style.pointerEvents = 'none';
    hovered = null;
    pinned = false;
  }

  const dateFormatter = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  // The link to the official BDIFF record is only ever clickable once the
  // card is pinned (see the click handler below): while it's a plain hover
  // preview that follows the pointer, `pointer-events: none` (see
  // ForestFires.astro) lets clicks/moves fall through to the canvas
  // underneath, same mechanism as monument-layers.
  function showTooltip(i: number, screenX: number, screenY: number) {
    const fire = fires[i];
    const department = departmentByCode.get(fire.departmentCode);
    const departmentName = department ? (lang === 'fr' ? department.nameFr : department.nameEn) : '';
    const lines = [`<strong>${fire.commune}${departmentName ? ` (${departmentName})` : ''}</strong>`];
    lines.push(`${labels.dateLabel} ${dateFormatter.format(new Date(`${fire.date}T00:00:00Z`))}`);
    lines.push(`${labels.areaDetailLabel} ${fireAreaFormatter.format(fire.burntArea / 10_000)} ha`);
    lines.push(`${labels.causeLabel} ${causeLabel(fire.cause, labels)}`);
    lines.push(`<a href="${bdiffUrl(fire.id)}" target="_blank" rel="noopener">${labels.viewRecordLabel}</a>`);
    tooltip.innerHTML = lines.join('<br>');
    tooltip.style.left = `${screenX + 12}px`;
    tooltip.style.top = `${screenY + 12}px`;
    tooltip.style.pointerEvents = pinned ? 'auto' : 'none';
    tooltip.hidden = false;
  }

  function findFireNear(screenX: number, screenY: number): number | null {
    const [start, end] = yearRanges.get(years[selectedYearIndex])!;
    let closest: number | null = null;
    let closestDist = Infinity;
    for (let i = start; i < end; i++) {
      const sx = transform.applyX(px[i]);
      const sy = transform.applyY(py[i]);
      const dist = Math.hypot(sx - screenX, sy - screenY);
      const hitRadius = radiusScale(fires[i].burntArea) + HIT_RADIUS_PADDING_PX;
      if (dist <= hitRadius && dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest;
  }

  function relativeCoords(event: MouseEvent): { x: number; y: number } {
    const rect = firesCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  firesCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || pinned) return;
    const { x, y } = relativeCoords(event);
    const hit = findFireNear(x, y);
    if (hit === hovered) {
      if (hit !== null) showTooltip(hit, x, y);
      return;
    }
    hovered = hit;
    if (hit !== null) showTooltip(hit, x, y);
    else hideTooltip();
  });

  firesCanvas.addEventListener('pointerleave', () => {
    if (!pinned) hideTooltip();
  });

  firesCanvas.addEventListener('click', (event) => {
    const { x, y } = relativeCoords(event);
    const hit = findFireNear(x, y);
    if (hit !== null) {
      hovered = hit;
      pinned = true;
      showTooltip(hit, x, y);
    } else {
      hideTooltip();
    }
  });

  // --- Boot -----------------------------------------------------------------
  resize();
}
