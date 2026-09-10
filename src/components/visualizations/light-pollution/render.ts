import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { timer as d3Timer } from 'd3-timer';
// topojson-client ships no bundled types; resolves to `any` under this project's
// moduleResolution setting, same accepted gap as bird-migrations/render.ts.
import { feature as topojsonFeature } from 'topojson-client';

interface SkyScaleTier {
  id: number;
  nameFr: string;
  nameEn: string;
}

interface SkyCellYearValue {
  radiance: number;
  scale: number;
}

interface SkyProperties {
  h3: string;
  byYear: Record<string, SkyCellYearValue>;
}

interface SkyFeature {
  type: 'Feature';
  properties: SkyProperties;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface SkybinsData {
  type: 'FeatureCollection';
  scale: SkyScaleTier[];
  years: number[];
  features: SkyFeature[];
}

export interface LightPollutionLabels {
  loading: string;
  error: string;
  yearLabel: string;
  legendLabel: string;
  tooltipYear: string;
  tooltipRadiance: string;
  play: string;
  pause: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
}

// Palette sequentielle par defaut du style-guide (voir "Palette dataviz"),
// memes deux teintes extremes (paliers 100 et 700) que biodiversity/render.ts
// (SEQUENTIAL_BLUE), interpolees ici de la meme facon (d3-scale, interpolation
// RGB par defaut) pour un degrade visuellement coherent entre les deux cartes
// de France du site.
const SEQUENTIAL_BLUE: [string, string] = ['#cde2fb', '#0d366b'];

type Speed = 'slow' | 'normal' | 'fast';
// Same convention as satellites-in-orbit/render.ts.
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };

// Time spent on each year at normal speed, and the pause on the final year
// (today) before a pass loops back to 2013 — same "hold on the culmination"
// pattern as satellites-in-orbit (see "Lecture automatique" in
// functional-specifications.md).
const STEP_MS = 900;
const HOLD_MS = 2000;

export async function mountLightPollution(root: HTMLElement, lang: 'fr' | 'en', labels: LightPollutionLabels): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-light-pollution');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-light-pollution__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: SkybinsData;
  let basemapTopology: any;
  try {
    const [skyRes, basemapRes] = await Promise.all([
      fetch('/data/light-pollution/skybins.json'),
      fetch('/data/biodiversity/basemap.json'),
    ]);
    if (!skyRes.ok || !basemapRes.ok) throw new Error('fetch failed');
    data = await skyRes.json();
    basemapTopology = await basemapRes.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const tierById = new Map(data.scale.map((t) => [t.id, t]));
  const years = data.years;
  // Autoplay starts a pass from the oldest year (see "Lecture automatique" in
  // functional-specifications.md), not the initial-view convention used before
  // autoplay existed on this visualization.
  let selectedYearIndex = 0;

  const tierIds = data.scale.map((t) => t.id);
  const colorForTier = scaleLinear<string>()
    .domain([Math.min(...tierIds), Math.max(...tierIds)])
    .range(SEQUENTIAL_BLUE)
    .clamp(true);

  // --- Controls (legend + playback, above the map) ---------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-light-pollution__controls';
  root.appendChild(controls);

  const legend = document.createElement('div');
  legend.className = 'dv-light-pollution__legend';
  legend.setAttribute('aria-label', labels.legendLabel);
  controls.appendChild(legend);

  data.scale.forEach((tier) => {
    const item = document.createElement('span');
    item.className = 'dv-light-pollution__legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'dv-light-pollution__legend-swatch';
    swatch.style.backgroundColor = colorForTier(tier.id);
    item.append(swatch, document.createTextNode(lang === 'fr' ? tier.nameFr : tier.nameEn));
    legend.appendChild(item);
  });

  const playback = document.createElement('div');
  playback.className = 'dv-light-pollution__playback';
  controls.appendChild(playback);

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-light-pollution__play';
  playButton.textContent = labels.pause;
  playButton.setAttribute('aria-pressed', 'true');
  playback.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-light-pollution__speed';
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
  // row wraps on narrow viewports, instead of the slider stranding alone.
  const yearGroup = document.createElement('div');
  yearGroup.className = 'dv-light-pollution__year-group';
  playback.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-light-pollution-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-light-pollution-year';
  yearSlider.className = 'dv-light-pollution__year-slider';
  yearSlider.min = '0';
  yearSlider.max = String(years.length - 1);
  yearSlider.step = '1';
  yearSlider.value = String(selectedYearIndex);
  yearSlider.setAttribute('list', 'dv-light-pollution-year-ticks');
  yearGroup.appendChild(yearSlider);

  const yearTicks = document.createElement('datalist');
  yearTicks.id = 'dv-light-pollution-year-ticks';
  years.forEach((_, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    yearTicks.appendChild(option);
  });
  yearGroup.appendChild(yearTicks);

  const yearValueEl = document.createElement('span');
  yearValueEl.className = 'dv-light-pollution__year-value';
  yearGroup.appendChild(yearValueEl);

  // --- Map stage ---------------------------------------------------------------
  const stage = document.createElement('div');
  stage.className = 'dv-light-pollution__stage';
  root.appendChild(stage);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'dv-light-pollution__svg');
  stage.appendChild(svg);

  const mapRoot = document.createElementNS(svgNS, 'g');
  const basemapLayer = document.createElementNS(svgNS, 'g');
  const hexLayer = document.createElementNS(svgNS, 'g');
  mapRoot.append(basemapLayer, hexLayer);
  svg.appendChild(mapRoot);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-light-pollution__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  // --- Projection -------------------------------------------------------------
  const franceFeature = topojsonFeature(basemapTopology, basemapTopology.objects.france);
  const projection = geoMercator();
  const path = geoPath(projection);
  let width = 0;
  let height = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    height = Math.max(320, rect.width * 0.6);
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
    basemapPath.setAttribute('class', 'dv-light-pollution__basemap');
    basemapLayer.appendChild(basemapPath);

    renderMap();
  }

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // --- Hex grid rendering ------------------------------------------------------
  let pinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    pinned = false;
  }

  function showTooltip(feature: SkyFeature, clientX: number, clientY: number) {
    const year = years[selectedYearIndex];
    const value = feature.properties.byYear[String(year)];
    if (!value) return;
    const tier = tierById.get(value.scale);
    const tierName = tier ? (lang === 'fr' ? tier.nameFr : tier.nameEn) : '';
    const lines = [
      `<strong>${tierName}</strong>`,
      `${labels.tooltipYear} ${year}`,
      `${labels.tooltipRadiance} ${value.radiance.toLocaleString(lang)} nW/cm²/sr`,
    ];
    tooltip.innerHTML = lines.join('<br>');
    const stageRect = stage.getBoundingClientRect();
    tooltip.style.left = `${clientX - stageRect.left + 12}px`;
    tooltip.style.top = `${clientY - stageRect.top + 12}px`;
    tooltip.hidden = false;
  }

  function renderMap() {
    const year = years[selectedYearIndex];
    yearValueEl.textContent = String(year);
    yearSlider.setAttribute('aria-valuetext', String(year));

    hexLayer.innerHTML = '';
    data.features.forEach((f) => {
      const value = f.properties.byYear[String(year)];
      const hexPath = document.createElementNS(svgNS, 'path');
      hexPath.setAttribute('d', path(f.geometry as any) ?? '');
      hexPath.setAttribute('class', 'dv-light-pollution__hex');
      hexPath.setAttribute('fill', value ? colorForTier(value.scale) : 'var(--dv-surface)');

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
    if (!target.closest('.dv-light-pollution__hex')) hideTooltip();
  });

  function setYearIndex(index: number) {
    selectedYearIndex = index;
    yearSlider.value = String(index);
    renderMap();
  }

  // --- Autoplay ------------------------------------------------------------
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

  yearSlider.addEventListener('input', () => {
    // Manual scrubbing takes over from autoplay, same as pressing pause.
    playing = false;
    updatePlayButton();
    holding = false;
    stepElapsedMs = 0;
    selectedYearIndex = Number(yearSlider.value);
    renderMap();
  });

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(stage);
  resize();
}
