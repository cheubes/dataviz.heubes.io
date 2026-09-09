import { geoOrthographic, geoPath } from 'd3-geo';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { timer as d3Timer } from 'd3-timer';
// topojson-client ships no bundled types; resolves to `any` under this project's
// non-strict tsconfig (no noImplicitAny), same choice as bird-migrations/render.ts.
import { feature as topojsonFeature } from 'topojson-client';

interface Region {
  id: string;
  nameFr: string;
  nameEn: string;
}

interface RawSatellite {
  regionId: string;
  launchDate: string;
}

interface SatellitesData {
  generatedAt: string;
  regions: Region[];
  satellites: RawSatellite[];
}

export interface SatellitesInOrbitLabels {
  loading: string;
  error: string;
  empty: string;
  countLabel: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
}

interface Satellite {
  regionId: string;
  launchMs: number;
  angle: number;
  radiusFactor: number;
}

type Speed = 'slow' | 'normal' | 'fast';

const REGION_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const TOTAL_DURATION_MS = 25_000;
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };
const HOLD_AT_END_MS = 2_500;
const RADIUS_FACTOR_MIN = 1.15;
const RADIUS_FACTOR_MAX = 1.6;
const POINT_RADIUS_PX = 1.6;
const STAGE_PADDING_PX = 24;
const OCEAN_COLOR = '#b7c2ca';
const LAND_COLOR = '#c7c0a8';
const GLOBE_STROKE_COLOR = '#8b959c';
const GLOBE_TILT_DEG = -18;
// Ambient, decorative rotation, unrelated to playback speed (see "Rendu" in
// technical-specifications.md): about one full turn every two minutes.
const ROTATION_DEG_PER_SEC = 3;

// Deterministic PRNG (mulberry32) seeded once and advanced sequentially, one
// call per satellite in dataset order: the halo layout stays identical across
// reloads and loop passes (see "Positionnement des points" in
// technical-specifications.md), without needing to reseed per satellite index.
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function mountSatellitesInOrbit(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: SatellitesInOrbitLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-satellites-in-orbit');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-satellites-in-orbit__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: SatellitesData;
  let basemapTopology: any;
  try {
    const [satellitesRes, basemapRes] = await Promise.all([
      fetch('/data/satellites-in-orbit/satellites.json'),
      fetch('/data/satellites-in-orbit/basemap.json'),
    ]);
    if (!satellitesRes.ok || !basemapRes.ok) throw new Error('fetch failed');
    data = await satellitesRes.json();
    basemapTopology = await basemapRes.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.satellites.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const landFeature = topojsonFeature(basemapTopology, basemapTopology.objects.land);

  const regionName = (region: Region) => (lang === 'fr' ? region.nameFr : region.nameEn);
  const color = scaleOrdinal<string, string>()
    .domain(data.regions.map((r) => r.id))
    .range(REGION_COLORS);

  const random = mulberry32(1);
  const satellites: Satellite[] = data.satellites.map((s) => ({
    regionId: s.regionId,
    launchMs: Date.parse(s.launchDate),
    angle: random() * Math.PI * 2,
    radiusFactor: RADIUS_FACTOR_MIN + random() * (RADIUS_FACTOR_MAX - RADIUS_FACTOR_MIN),
  }));

  // Maps elapsed playback time to simulated time, linearly across the full
  // launch-date range (see "Animation" in technical-specifications.md).
  const simTimeScale = scaleLinear()
    .domain([0, TOTAL_DURATION_MS])
    .range([satellites[0].launchMs, satellites[satellites.length - 1].launchMs])
    .clamp(true);

  // --- Layout -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-satellites-in-orbit__controls';
  root.appendChild(controls);

  const legend = document.createElement('div');
  legend.className = 'dv-satellites-in-orbit__legend';
  controls.appendChild(legend);

  const activeRegions = new Set(data.regions.map((r) => r.id));
  data.regions.forEach((region) => {
    const label = document.createElement('label');
    label.className = 'dv-satellites-in-orbit__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) activeRegions.add(region.id);
      else activeRegions.delete(region.id);
      rebuildForeground();
      updateCounter();
      updateEmptyState();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-satellites-in-orbit__swatch';
    swatch.style.backgroundColor = color(region.id);
    label.append(input, swatch, document.createTextNode(regionName(region)));
    legend.appendChild(label);
  });

  const readout = document.createElement('div');
  readout.className = 'dv-satellites-in-orbit__readout';
  controls.appendChild(readout);

  const countEl = document.createElement('span');
  countEl.className = 'dv-satellites-in-orbit__count';
  readout.appendChild(countEl);

  const yearEl = document.createElement('span');
  yearEl.className = 'dv-satellites-in-orbit__year';
  readout.appendChild(yearEl);

  const playback = document.createElement('div');
  playback.className = 'dv-satellites-in-orbit__playback';
  controls.appendChild(playback);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-satellites-in-orbit__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playback.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-satellites-in-orbit__speed';
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

  const stage = document.createElement('div');
  stage.className = 'dv-satellites-in-orbit__stage';
  root.appendChild(stage);

  const globeCanvas = document.createElement('canvas');
  globeCanvas.className = 'dv-satellites-in-orbit__canvas';
  const swarmCanvas = document.createElement('canvas');
  swarmCanvas.className = 'dv-satellites-in-orbit__canvas';
  stage.append(globeCanvas, swarmCanvas);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-satellites-in-orbit__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  // --- Canvas sizing & globe projection -------------------------------------
  const globeCtx = globeCanvas.getContext('2d')!;
  const swarmCtx = swarmCanvas.getContext('2d')!;
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let globeRadius = 0;

  const projection = geoOrthographic().clipAngle(90);
  const path = geoPath(projection, globeCtx);
  let rotationLambda = -20;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = Math.max(320, Math.min(width, 640));
    stage.style.height = `${height}px`;
    for (const canvas of [globeCanvas, swarmCanvas]) {
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    globeCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    swarmCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    centerX = width / 2;
    centerY = height / 2;
    const maxHaloRadius = Math.min(width, height) / 2 - STAGE_PADDING_PX;
    globeRadius = Math.max(20, maxHaloRadius / RADIUS_FACTOR_MAX);
    projection.scale(globeRadius).translate([centerX, centerY]);

    drawGlobe();
    rebuildForeground();
  }

  // Redrawn every frame (not just on resize): the globe rotates continuously
  // while playing, see ROTATION_DEG_PER_SEC above.
  function drawGlobe() {
    projection.rotate([rotationLambda, GLOBE_TILT_DEG]);
    globeCtx.clearRect(0, 0, width, height);
    globeCtx.beginPath();
    path({ type: 'Sphere' } as any);
    globeCtx.fillStyle = OCEAN_COLOR;
    globeCtx.fill();
    globeCtx.beginPath();
    path(landFeature as any);
    globeCtx.fillStyle = LAND_COLOR;
    globeCtx.fill();
    globeCtx.beginPath();
    path({ type: 'Sphere' } as any);
    globeCtx.strokeStyle = GLOBE_STROKE_COLOR;
    globeCtx.lineWidth = 1;
    globeCtx.stroke();
  }

  function pointPixel(sat: Satellite): [number, number] {
    const r = globeRadius * sat.radiusFactor;
    return [centerX + Math.cos(sat.angle) * r, centerY + Math.sin(sat.angle) * r];
  }

  function paintPoint(sat: Satellite) {
    const [x, y] = pointPixel(sat);
    swarmCtx.beginPath();
    swarmCtx.arc(x, y, POINT_RADIUS_PX, 0, Math.PI * 2);
    swarmCtx.fillStyle = color(sat.regionId);
    swarmCtx.fill();
  }

  // Clears and repaints every already-elapsed (index < cursor), currently
  // active satellite in one pass, per "Rendu" in technical-specifications.md:
  // used both after a filter change and after a resize (new globeRadius). The
  // halo itself never rotates with the globe (see "Positionnement des points"):
  // only the decorative land/ocean layer underneath does.
  function rebuildForeground() {
    swarmCtx.clearRect(0, 0, width, height);
    for (let i = 0; i < cursor; i++) {
      const sat = satellites[i];
      if (activeRegions.has(sat.regionId)) paintPoint(sat);
    }
  }

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // --- Animation ------------------------------------------------------------
  let cursor = 0;
  let playing = true;
  let playedMs = 0;
  let speed: Speed = 'normal';
  // True during the pause on the final, fully-accumulated frame before a pass
  // loops back to the start (see "Lecture automatique" in functional-specifications.md).
  let holding = false;
  let holdElapsedMs = 0;
  const countByRegion = new Map(data.regions.map((r) => [r.id, 0]));

  function updateCounter() {
    let total = 0;
    for (const regionId of activeRegions) total += countByRegion.get(regionId) ?? 0;
    countEl.textContent = labels.countLabel.replace('{count}', total.toLocaleString(lang));
  }

  function updateEmptyState() {
    emptyMessage.hidden = activeRegions.size > 0;
  }

  const yearFormatter = new Intl.DateTimeFormat(lang, { year: 'numeric', timeZone: 'UTC' });
  let lastYearLabel = '';

  function updateYearIndicator(simMs: number) {
    const label = yearFormatter.format(new Date(simMs));
    if (label !== lastYearLabel) {
      lastYearLabel = label;
      yearEl.textContent = label;
    }
  }

  function startNewPass() {
    cursor = 0;
    playedMs = 0;
    holding = false;
    holdElapsedMs = 0;
    for (const regionId of countByRegion.keys()) countByRegion.set(regionId, 0);
    swarmCtx.clearRect(0, 0, width, height);
    lastYearLabel = '';
    updateCounter();
  }

  let lastFrameTime = performance.now();
  let loop: ReturnType<typeof d3Timer> | null = null;

  function startAnimationLoop() {
    lastFrameTime = performance.now();
    loop = d3Timer(() => {
      const now = performance.now();
      const dtMs = now - lastFrameTime;
      lastFrameTime = now;

      // Pausing freezes every form of motion at once, including the
      // ambient rotation (see "Accessibilité" in functional-specifications.md).
      if (playing) rotationLambda = (rotationLambda + ROTATION_DEG_PER_SEC * (dtMs / 1000)) % 360;

      if (holding) {
        if (playing) holdElapsedMs += dtMs;
        if (holdElapsedMs >= HOLD_AT_END_MS) startNewPass();
      } else {
        if (playing) playedMs = Math.min(TOTAL_DURATION_MS, playedMs + dtMs * SPEED_FACTORS[speed]);
        const progress = playedMs / TOTAL_DURATION_MS;
        const simMs = simTimeScale(playedMs);

        while (cursor < satellites.length && satellites[cursor].launchMs <= simMs) {
          const sat = satellites[cursor];
          countByRegion.set(sat.regionId, (countByRegion.get(sat.regionId) ?? 0) + 1);
          if (activeRegions.has(sat.regionId)) paintPoint(sat);
          cursor++;
        }

        updateYearIndicator(simMs);
        updateCounter();

        if (progress >= 1) holding = true;
      }

      drawGlobe();
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

  resize();
  updateCounter();
  updateEmptyState();
  startAnimationLoop();
}
