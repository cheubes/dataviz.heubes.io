import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { feature as topojsonFeature } from 'topojson-client';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';
import { getUrlParam, readZoomParam, setUrlParams, writeZoomParam } from '../../../scripts/url-state';
import { prefersReducedMotion } from '../../../scripts/reduced-motion';

interface CommuneFeature {
  type: 'Feature';
  properties: {
    codgeo: string;
    name: string;
    dep: string;
    apl: number;
    apl65: number;
    population: number | null;
  };
  geometry: any;
}

export interface MedicalDesertsLabels {
  loading: string;
  loadingProgress: string;
  error: string;
  empty: string;
  toggleToday: string;
  toggleTomorrow: string;
  aplTodayLabel: string;
  aplTomorrowLabel: string;
  legendLabel: string;
  populationLabel: string;
  departmentLabel: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
}

// Shared color domain for both "today" and "tomorrow" states — using the
// same domain for both is what makes the toggle a meaningful comparison
// (a commune's color shift reflects a real change, not a rescaled axis).
// Capped at the 99th percentile of the real 2024 distribution (measured at
// preprocessing) rather than the true max (23.9, a handful of outlier
// communes with a tiny population and one part-time doctor) which would
// otherwise compress nearly all communes into a sliver of the scale.
const APL_DOMAIN: [number, number] = [0, 6.5];
// Seuil éditorial (désert médical) : voir "Palette" dans technical-specifications.md.
const APL_LOW_THRESHOLD = 1.5;
// Échelle à trois paliers plutôt qu'un dégradé linéaire simple, pour que le
// contraste soit concentré sous APL_LOW_THRESHOLD (voir "Palette" dans
// technical-specifications.md) : `#0d366b` reste le palier 700 de la palette
// séquentielle du style-guide, les deux autres teintes sont une déviation par
// visualisation documentée là-bas (`d3.scaleLinear<string>()`, pas
// d3-scale-chromatic, qui aurait été une dépendance nouvelle non discutée).
const APL_COLOR_RANGE: [string, string, string] = ['#eef5fc', '#3987e5', '#0d366b'];
const ZOOM_EXTENT: [number, number] = [1, 8];
const RENDER_OVERSAMPLE = 2; // headroom so zoomed-in fills stay reasonably crisp

function indexToColor(i: number): [number, number, number] {
  return [(i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff];
}

export async function mountMedicalDeserts(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: MedicalDesertsLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-medical-deserts');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-medical-deserts__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let topology: any;
  try {
    const res = await fetch('/data/medical-deserts/communes.json');
    if (!res.ok) throw new Error('fetch failed');
    const contentLength = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !contentLength) {
      topology = await res.json();
    } else {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const percent = Math.min(100, Math.round((received / contentLength) * 100));
        statusEl.textContent = labels.loadingProgress.replace('{percent}', String(percent));
      }
      const blob = new Blob(chunks as BlobPart[]);
      topology = JSON.parse(await blob.text());
    }
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  const collection = topojsonFeature(topology, topology.objects.communes) as unknown as {
    type: 'FeatureCollection';
    features: CommuneFeature[];
  };
  const communes = collection.features;

  if (communes.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  // --- Controls -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-medical-deserts__controls';
  root.appendChild(controls);

  const toggleGroup = document.createElement('div');
  toggleGroup.className = 'dv-medical-deserts__toggle-group';
  toggleGroup.setAttribute('role', 'radiogroup');
  let showTomorrow = false;
  const toggleOptions: { value: boolean; text: string }[] = [
    { value: false, text: labels.toggleToday },
    { value: true, text: labels.toggleTomorrow },
  ];
  const toggleInputs: HTMLInputElement[] = [];
  toggleOptions.forEach((opt) => {
    const label = document.createElement('label');
    label.className = 'dv-medical-deserts__toggle';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'dv-medical-deserts-state';
    input.checked = opt.value === false;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      setState(opt.value);
      setUrlParams({ view: opt.value ? 'tomorrow' : null });
    });
    toggleInputs.push(input);
    label.append(input, document.createTextNode(opt.text));
    toggleGroup.appendChild(label);
  });
  controls.appendChild(toggleGroup);

  const legend = document.createElement('div');
  legend.className = 'dv-medical-deserts__legend';
  const legendTitle = document.createElement('span');
  legendTitle.className = 'dv-medical-deserts__legend-title';
  legendTitle.textContent = labels.legendLabel;
  const legendGradient = document.createElement('div');
  legendGradient.className = 'dv-medical-deserts__legend-gradient';
  const legendBreakpointPercent = (APL_LOW_THRESHOLD / APL_DOMAIN[1]) * 100;
  legendGradient.style.background = `linear-gradient(to right, ${APL_COLOR_RANGE[0]} 0%, ${APL_COLOR_RANGE[1]} ${legendBreakpointPercent}%, ${APL_COLOR_RANGE[2]} 100%)`;
  const legendLabels = document.createElement('div');
  legendLabels.className = 'dv-medical-deserts__legend-labels';
  const legendMin = document.createElement('span');
  legendMin.textContent = '0';
  const legendMax = document.createElement('span');
  legendMax.textContent = `${APL_DOMAIN[1]}+`;
  legendLabels.append(legendMin, legendMax);
  legend.append(legendTitle, legendGradient, legendLabels);
  controls.appendChild(legend);

  const stage = document.createElement('div');
  stage.className = 'dv-medical-deserts__stage';
  root.appendChild(stage);

  const zoomLayer = document.createElement('div');
  zoomLayer.className = 'dv-medical-deserts__zoom-layer';
  stage.appendChild(zoomLayer);

  const canvasToday = document.createElement('canvas');
  canvasToday.className = 'dv-medical-deserts__canvas';
  const canvasTomorrow = document.createElement('canvas');
  canvasTomorrow.className = 'dv-medical-deserts__canvas dv-medical-deserts__canvas--tomorrow';
  zoomLayer.append(canvasToday, canvasTomorrow);

  // Interaction surface: transparent, sits above the two color canvases,
  // captures pointer/zoom events without being affected by the opacity
  // cross-fade between them.
  const interactionCanvas = document.createElement('canvas');
  interactionCanvas.className = 'dv-medical-deserts__canvas dv-medical-deserts__interaction';
  zoomLayer.appendChild(interactionCanvas);

  // Hidden index canvas, never CSS-transformed: filled with one unique flat
  // color per commune so hover/tap can look up "which commune is under the
  // pointer" via a single-pixel read instead of testing 34,728 polygons per
  // move. Kept at native (untransformed) resolution; the current zoom/pan is
  // inverted on the pointer position before reading it (see pointerToCommune).
  const indexCanvas = document.createElement('canvas');

  const zoomControls = document.createElement('div');
  zoomControls.className = 'dv-medical-deserts__zoom-controls';
  const zoomInButton = document.createElement('button');
  zoomInButton.type = 'button';
  zoomInButton.className = 'dv-medical-deserts__zoom-button';
  zoomInButton.textContent = '+';
  zoomInButton.setAttribute('aria-label', labels.zoomIn);
  const zoomOutButton = document.createElement('button');
  zoomOutButton.type = 'button';
  zoomOutButton.className = 'dv-medical-deserts__zoom-button';
  zoomOutButton.textContent = '−';
  zoomOutButton.setAttribute('aria-label', labels.zoomOut);
  const zoomResetButton = document.createElement('button');
  zoomResetButton.type = 'button';
  zoomResetButton.className = 'dv-medical-deserts__zoom-button';
  zoomResetButton.textContent = '⟲';
  zoomResetButton.setAttribute('aria-label', labels.zoomReset);
  zoomControls.append(zoomInButton, zoomOutButton, zoomResetButton);
  stage.appendChild(zoomControls);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-medical-deserts__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  // --- Projection -----------------------------------------------------------
  const projection = geoMercator();
  let width = 0;
  let height = 0;
  let transform: ZoomTransform = zoomIdentity;

  const colorScale = scaleLinear<string>()
    .domain([APL_DOMAIN[0], APL_LOW_THRESHOLD, APL_DOMAIN[1]])
    .range(APL_COLOR_RANGE)
    .clamp(true);

  function drawStateCanvas(canvas: HTMLCanvasElement, key: 'apl' | 'apl65') {
    const ctx = canvas.getContext('2d')!;
    const path = geoPath(projection, ctx);
    ctx.setTransform(RENDER_OVERSAMPLE * devicePixelRatio, 0, 0, RENDER_OVERSAMPLE * devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const commune of communes) {
      ctx.beginPath();
      path(commune);
      ctx.fillStyle = colorScale(commune.properties[key]);
      ctx.fill();
    }
  }

  function drawIndexCanvas() {
    const ctx = indexCanvas.getContext('2d', { willReadFrequently: true })!;
    const path = geoPath(projection, ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    communes.forEach((commune, i) => {
      const [r, g, b] = indexToColor(i + 1); // +1: keep 0 reserved for "no commune"
      ctx.beginPath();
      path(commune);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
    });
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = rect.width;
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    height = Math.max(320, Math.min(rect.width * 0.6, heightCeiling));
    stage.style.height = `${height}px`;

    for (const canvas of [canvasToday, canvasTomorrow, interactionCanvas]) {
      canvas.width = width * RENDER_OVERSAMPLE * devicePixelRatio;
      canvas.height = height * RENDER_OVERSAMPLE * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    indexCanvas.width = width;
    indexCanvas.height = height;

    projection.fitExtent(
      [
        [8, 8],
        [width - 8, height - 8],
      ],
      collection
    );

    drawStateCanvas(canvasToday, 'apl');
    drawStateCanvas(canvasTomorrow, 'apl65');
    drawIndexCanvas();

    zoomBehavior.translateExtent([
      [0, 0],
      [width, height],
    ]);
    applyTransform();
  }

  function applyTransform() {
    zoomLayer.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
  }

  let restoringUrlState = false;

  const zoomBehavior = d3Zoom<HTMLDivElement, unknown>()
    .scaleExtent(ZOOM_EXTENT)
    // Gestures only count on the map itself, not on the zoom buttons that share
    // the stage; the rest is d3-zoom's default filter.
    .filter((event) => event.target === interactionCanvas && (!event.ctrlKey || event.type === 'wheel') && !event.button)
    .on('zoom', (event) => {
      transform = event.transform;
      applyTransform();
    })
    .on('end', () => {
      if (!restoringUrlState) writeZoomParam(transform, projection, width, height);
    });
  // Bound to the stage rather than the canvas: the canvas sits inside zoomLayer,
  // whose CSS transform would skew d3-zoom's pointer coordinates once zoomed
  // (wheel no longer anchored under the cursor, drag lagging behind the mouse).
  select(stage).call(zoomBehavior);

  const reducedMotion = prefersReducedMotion();
  const zoomTransitionMs = reducedMotion ? 0 : 200;
  const resetTransitionMs = reducedMotion ? 0 : 300;

  zoomInButton.addEventListener('click', () => {
    zoomBehavior.scaleBy(select(stage).transition().duration(zoomTransitionMs), 1.5);
  });
  zoomOutButton.addEventListener('click', () => {
    zoomBehavior.scaleBy(select(stage).transition().duration(zoomTransitionMs), 1 / 1.5);
  });
  zoomResetButton.addEventListener('click', () => {
    zoomBehavior.transform(select(stage).transition().duration(resetTransitionMs), zoomIdentity);
  });

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // Applied before resize(), whose layout read is the first style computation
  // of canvasTomorrow: set any later, the opacity change would play the
  // today-to-tomorrow CSS fade on load instead of opening on that state.
  if (getUrlParam('view') === 'tomorrow') {
    toggleInputs[1].checked = true;
    setState(true);
  }

  resize();

  // zoomLayer's CSS transform has its origin at 0 0 and the canvases share the
  // stage's width/height and projection, so the d3-zoom transform maps base
  // projection pixels to stage pixels exactly like the redrawn maps.
  const initialTransform = readZoomParam(projection, width, height, ZOOM_EXTENT);
  if (initialTransform) {
    restoringUrlState = true;
    zoomBehavior.transform(select(stage), initialTransform);
    restoringUrlState = false;
  }

  // --- Toggle -----------------------------------------------------------
  function setState(tomorrow: boolean) {
    showTomorrow = tomorrow;
    canvasTomorrow.style.opacity = tomorrow ? '1' : '0';
  }

  // --- Tooltip via index-canvas color picking --------------------------------
  const indexCtx = indexCanvas.getContext('2d', { willReadFrequently: true })!;

  function communeAtClientPoint(clientX: number, clientY: number): CommuneFeature | null {
    const rect = interactionCanvas.getBoundingClientRect();
    // rect already reflects the live CSS transform (translate+scale) applied
    // to zoomLayer, so converting client coordinates through it lands
    // directly in the untransformed index canvas's own pixel space — no
    // separate inversion of `transform` needed.
    const x = ((clientX - rect.left) / rect.width) * indexCanvas.width;
    const y = ((clientY - rect.top) / rect.height) * indexCanvas.height;
    if (x < 0 || y < 0 || x >= indexCanvas.width || y >= indexCanvas.height) return null;
    const [r, g, b] = indexCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const index = (r << 16) | (g << 8) | b;
    if (index === 0) return null;
    return communes[index - 1] ?? null;
  }

  let tooltipPinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    tooltipPinned = false;
  }

  const numberFormatter = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  const populationFormatter = new Intl.NumberFormat(lang);

  function showTooltip(commune: CommuneFeature, clientX: number, clientY: number) {
    const { name, dep, apl, apl65, population } = commune.properties;
    tooltip.innerHTML = `
      <strong>${name}</strong> (${dep})<br>
      ${labels.aplTodayLabel} ${numberFormatter.format(apl)}<br>
      ${labels.aplTomorrowLabel} ${numberFormatter.format(apl65)}
      ${population !== null ? `<br>${labels.populationLabel} ${populationFormatter.format(population)}` : ''}
    `;
    const stageRect = stage.getBoundingClientRect();
    let left = clientX - stageRect.left + 14;
    let top = clientY - stageRect.top + 14;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.hidden = false;
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > stageRect.right) left -= tooltipRect.right - stageRect.right + 8;
    if (tooltipRect.bottom > stageRect.bottom) top -= tooltipRect.bottom - stageRect.bottom + 8;
    tooltip.style.left = `${Math.max(4, left)}px`;
    tooltip.style.top = `${Math.max(4, top)}px`;
  }

  interactionCanvas.addEventListener('pointermove', (event) => {
    if (tooltipPinned || event.pointerType === 'touch') return;
    const commune = communeAtClientPoint(event.clientX, event.clientY);
    if (commune) showTooltip(commune, event.clientX, event.clientY);
    else hideTooltip();
  });
  interactionCanvas.addEventListener('pointerleave', () => {
    if (!tooltipPinned) hideTooltip();
  });
  interactionCanvas.addEventListener('click', (event) => {
    const commune = communeAtClientPoint(event.clientX, event.clientY);
    if (commune) {
      tooltipPinned = true;
      showTooltip(commune, event.clientX, event.clientY);
    } else {
      hideTooltip();
    }
  });

  void showTomorrow;
}
