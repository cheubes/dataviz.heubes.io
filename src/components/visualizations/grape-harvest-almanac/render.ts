import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';
import { getMaxStageBlockHeight } from '../../../scripts/viz-stage-height';

interface SeriesPoint {
  year: number;
  dayOffset: number;
  smoothedDayOffset: number | null;
}

interface RegionEntry {
  id: string;
  nameFr: string;
  nameEn: string;
  colorSlot: number;
  startYear: number;
  endYear: number;
  series: SeriesPoint[];
}

interface EventEntry {
  id: string;
  year: number;
  yearEnd: number | null;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  regions: string[];
}

interface HarvestData {
  regions: RegionEntry[];
  events: EventEntry[];
}

export interface GrapeHarvestAlmanacLabels {
  loading: string;
  error: string;
  empty: string;
  regionGroupLabel: string;
}

interface YearValue {
  year: number;
  value: number;
}

const PALETTE: Record<number, string> = {
  1: '#2a78d6',
  2: '#eb6834',
  3: '#1baf7a',
  4: '#eda100',
  5: '#e87ba4',
  6: '#008300',
  7: '#4a3aa7',
};

const MARGIN = { top: 28, right: 12, bottom: 32, left: 12 };
const SVG_NS = 'http://www.w3.org/2000/svg';

function dayOffsetToDate(offset: number): Date {
  return new Date(Date.UTC(2001, 7, 31) + Math.round(offset) * 86_400_000);
}

function formatDayOffset(offset: number, lang: 'fr' | 'en'): string {
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    dayOffsetToDate(offset)
  );
}

function niceStep(span: number, targetTicks: number): number {
  const rough = span / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = [1, 2, 5, 10].find((s) => normalized <= s) ?? 10;
  return step * magnitude;
}

// Splits a region's series into runs of consecutive years with a defined
// value for the given key: no line segment is ever drawn across a real gap
// in the source data (see "Lignes discontinues" in technical-specifications.md).
function buildSegments(series: SeriesPoint[], key: 'dayOffset' | 'smoothedDayOffset'): YearValue[][] {
  const segments: YearValue[][] = [];
  let current: YearValue[] = [];
  let lastYear: number | null = null;
  for (const point of series) {
    const value = point[key];
    if (value === null || value === undefined) {
      if (current.length) segments.push(current);
      current = [];
      lastYear = null;
      continue;
    }
    if (lastYear !== null && point.year !== lastYear + 1) {
      if (current.length) segments.push(current);
      current = [];
    }
    current.push({ year: point.year, value });
    lastYear = point.year;
  }
  if (current.length) segments.push(current);
  return segments;
}

export async function mountGrapeHarvestAlmanac(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: GrapeHarvestAlmanacLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-grape-harvest-almanac');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-grape-harvest-almanac__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: HarvestData;
  try {
    const res = await fetch('/data/grape-harvest-almanac/harvest-dates.json');
    if (!res.ok) throw new Error('fetch failed');
    data = await res.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.regions.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const activeRegions = new Set(data.regions.map((r) => r.id));

  const minYear = Math.min(...data.regions.map((r) => r.startYear));
  const maxYear = Math.max(...data.regions.map((r) => r.endYear));
  const allValues = data.regions.flatMap((r) => r.series.map((p) => p.dayOffset));
  const valueSpan = Math.max(...allValues) - Math.min(...allValues);
  const valuePadding = valueSpan * 0.08;
  const minValue = Math.min(...allValues) - valuePadding;
  const maxValue = Math.max(...allValues) + valuePadding;

  const regionValueMaps = new Map<string, Map<number, number>>(
    data.regions.map((r) => [r.id, new Map(r.series.map((p) => [p.year, p.dayOffset]))])
  );

  // --- Controls -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-grape-harvest-almanac__controls';
  root.appendChild(controls);

  const regionGroup = document.createElement('div');
  regionGroup.className = 'dv-grape-harvest-almanac__region-group';
  regionGroup.setAttribute('role', 'group');
  regionGroup.setAttribute('aria-label', labels.regionGroupLabel);
  controls.appendChild(regionGroup);

  data.regions.forEach((region) => {
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'dv-grape-harvest-almanac__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) activeRegions.add(region.id);
      else activeRegions.delete(region.id);
      updateEmptyState();
      redrawData();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-grape-harvest-almanac__swatch';
    swatch.style.backgroundColor = PALETTE[region.colorSlot];
    toggleLabel.append(input, swatch, document.createTextNode(lang === 'fr' ? region.nameFr : region.nameEn));
    regionGroup.appendChild(toggleLabel);
  });

  // --- Stage / SVG scaffolding -----------------------------------------------
  const stage = document.createElement('div');
  stage.className = 'dv-grape-harvest-almanac__stage';
  root.appendChild(stage);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'dv-grape-harvest-almanac__svg');
  stage.appendChild(svg);

  const clipRectId = 'dv-grape-harvest-almanac-clip';
  const eventsClipRectId = 'dv-grape-harvest-almanac-events-clip';
  const defs = document.createElementNS(SVG_NS, 'defs');
  const clipPath = document.createElementNS(SVG_NS, 'clipPath');
  clipPath.setAttribute('id', clipRectId);
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipPath.appendChild(clipRect);
  // Event markers sit above the plot area (in the top margin, see
  // "redrawData" below) so their clip needs extra headroom the plot's own
  // clip-path doesn't have.
  const eventsClipPath = document.createElementNS(SVG_NS, 'clipPath');
  eventsClipPath.setAttribute('id', eventsClipRectId);
  const eventsClipRect = document.createElementNS(SVG_NS, 'rect');
  eventsClipPath.appendChild(eventsClipRect);
  defs.append(clipPath, eventsClipPath);
  svg.appendChild(defs);

  const plotGroup = document.createElementNS(SVG_NS, 'g');
  plotGroup.setAttribute('transform', `translate(${MARGIN.left},${MARGIN.top})`);
  svg.appendChild(plotGroup);

  const gridlinesLayer = document.createElementNS(SVG_NS, 'g');
  const eventBandsLayer = document.createElementNS(SVG_NS, 'g');
  const pathsLayer = document.createElementNS(SVG_NS, 'g');
  const eventLinesLayer = document.createElementNS(SVG_NS, 'g');
  const crosshairLayer = document.createElementNS(SVG_NS, 'g');
  [gridlinesLayer, eventBandsLayer, pathsLayer, eventLinesLayer, crosshairLayer].forEach((layer) =>
    layer.setAttribute('clip-path', `url(#${clipRectId})`)
  );
  const captureRect = document.createElementNS(SVG_NS, 'rect');
  captureRect.setAttribute('class', 'dv-grape-harvest-almanac__capture');
  const eventMarkersLayer = document.createElementNS(SVG_NS, 'g');
  eventMarkersLayer.setAttribute('clip-path', `url(#${eventsClipRectId})`);
  const xAxisLayer = document.createElementNS(SVG_NS, 'g');

  plotGroup.append(
    gridlinesLayer,
    eventBandsLayer,
    pathsLayer,
    eventLinesLayer,
    crosshairLayer,
    captureRect,
    eventMarkersLayer,
    xAxisLayer
  );

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-grape-harvest-almanac__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const eventPanel = document.createElement('div');
  eventPanel.className = 'dv-grape-harvest-almanac__event-panel';
  eventPanel.hidden = true;
  stage.appendChild(eventPanel);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-grape-harvest-almanac__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  function updateEmptyState() {
    const isEmpty = activeRegions.size === 0;
    emptyMessage.hidden = !isEmpty;
    svg.style.visibility = isEmpty ? 'hidden' : 'visible';
  }

  // --- Scales -----------------------------------------------------------
  const xScale = scaleLinear().domain([minYear, maxYear]);
  const yScale = scaleLinear().domain([maxValue, minValue]);
  let innerWidth = 0;
  let innerHeight = 0;

  // --- Region path elements (built once, `d` recomputed on resize) ---
  interface RegionDom {
    region: RegionEntry;
    rawSegments: YearValue[][];
    smoothedSegments: YearValue[][];
    rawPaths: SVGPathElement[];
    smoothedPaths: SVGPathElement[];
    group: SVGGElement;
  }

  const regionDoms: RegionDom[] = data.regions.map((region) => {
    const group = document.createElementNS(SVG_NS, 'g');
    const rawSegments = buildSegments(region.series, 'dayOffset');
    const smoothedSegments = buildSegments(region.series, 'smoothedDayOffset');
    const color = PALETTE[region.colorSlot];

    const rawPaths = rawSegments.map(() => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-opacity', '0.55');
      path.setAttribute('stroke-width', '1');
      group.appendChild(path);
      return path;
    });
    const smoothedPaths = smoothedSegments.map(() => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      group.appendChild(path);
      return path;
    });
    pathsLayer.appendChild(group);

    return { region, rawSegments, smoothedSegments, rawPaths, smoothedPaths, group };
  });

  // --- Event markers (built once, position recomputed on zoom/resize) ---
  interface EventDom {
    event: EventEntry;
    band?: SVGRectElement;
    line?: SVGLineElement;
    marker: SVGCircleElement;
    hit: SVGCircleElement;
  }

  let openEventId: string | null = null;

  const eventDoms: EventDom[] = data.events.map((event) => {
    const isBand = event.yearEnd !== null;
    let band: SVGRectElement | undefined;
    let line: SVGLineElement | undefined;
    if (isBand) {
      band = document.createElementNS(SVG_NS, 'rect');
      band.setAttribute('class', 'dv-grape-harvest-almanac__event-band');
      eventBandsLayer.appendChild(band);
    } else {
      line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'dv-grape-harvest-almanac__event-line');
      eventLinesLayer.appendChild(line);
    }

    const marker = document.createElementNS(SVG_NS, 'circle');
    marker.setAttribute('class', 'dv-grape-harvest-almanac__event-marker');
    marker.setAttribute('r', '6');
    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('class', 'dv-grape-harvest-almanac__event-hit');
    hit.setAttribute('r', '14');
    eventMarkersLayer.append(marker, hit);

    hit.addEventListener('click', (domEvent) => {
      domEvent.stopPropagation();
      toggleEventPanel(event, domEvent as PointerEvent);
    });

    return { event, band, line, marker, hit };
  });

  function toggleEventPanel(event: EventEntry, domEvent: PointerEvent) {
    if (openEventId === event.id) {
      closeEventPanel();
      return;
    }
    openEventId = event.id;
    eventDoms.forEach((ed) =>
      ed.marker.classList.toggle('dv-grape-harvest-almanac__event-marker--active', ed.event.id === event.id)
    );

    const title = lang === 'fr' ? event.titleFr : event.titleEn;
    const description = lang === 'fr' ? event.descriptionFr : event.descriptionEn;
    const yearLabel = event.yearEnd ? `${event.year}-${event.yearEnd}` : String(event.year);

    const valueRows = event.regions
      .map((regionId) => {
        const value = regionValueMaps.get(regionId)?.get(event.year);
        if (value === undefined) return '';
        const region = data.regions.find((r) => r.id === regionId);
        if (!region) return '';
        const name = lang === 'fr' ? region.nameFr : region.nameEn;
        return `<div class="dv-grape-harvest-almanac__tooltip-row">
          <span class="dv-grape-harvest-almanac__tooltip-swatch" style="background-color:${PALETTE[region.colorSlot]}"></span>
          <span class="dv-grape-harvest-almanac__tooltip-value">${formatDayOffset(value, lang)}</span>
          <span class="dv-grape-harvest-almanac__tooltip-name">${name}</span>
        </div>`;
      })
      .join('');

    eventPanel.innerHTML = `
      <div class="dv-grape-harvest-almanac__event-panel-title">${title} (${yearLabel})</div>
      <div>${description}</div>
      ${valueRows ? `<div class="dv-grape-harvest-almanac__event-panel-values">${valueRows}</div>` : ''}
    `;
    eventPanel.hidden = false;
    positionFloating(eventPanel, domEvent.clientX, domEvent.clientY);
  }

  function closeEventPanel() {
    openEventId = null;
    eventPanel.hidden = true;
    eventDoms.forEach((ed) => ed.marker.classList.remove('dv-grape-harvest-almanac__event-marker--active'));
  }

  function positionFloating(el: HTMLElement, clientX: number, clientY: number) {
    const stageRect = stage.getBoundingClientRect();
    let left = clientX - stageRect.left + 14;
    let top = clientY - stageRect.top + 14;
    // Keep the panel from overflowing the right/bottom edge of the stage.
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    const elRect = el.getBoundingClientRect();
    if (elRect.right > stageRect.right) left -= elRect.right - stageRect.right + 8;
    if (elRect.bottom > stageRect.bottom) top -= elRect.bottom - stageRect.bottom + 8;
    el.style.left = `${Math.max(4, left)}px`;
    el.style.top = `${Math.max(4, top)}px`;
  }

  // --- Crosshair + tooltip -------------------------------------------------
  const crosshairLine = document.createElementNS(SVG_NS, 'line');
  crosshairLine.setAttribute('class', 'dv-grape-harvest-almanac__crosshair');
  crosshairLine.style.display = 'none';
  crosshairLayer.appendChild(crosshairLine);

  let tooltipPinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    crosshairLine.style.display = 'none';
    tooltipPinned = false;
  }

  function showTooltipAtYear(year: number, clientX: number, clientY: number) {
    const rows = data.regions
      .filter((r) => activeRegions.has(r.id))
      .map((region) => {
        const value = regionValueMaps.get(region.id)?.get(year);
        if (value === undefined) return null;
        return { region, value };
      })
      .filter((row): row is { region: RegionEntry; value: number } => row !== null);

    if (rows.length === 0) {
      hideTooltip();
      return;
    }

    const rowsHtml = rows
      .map(
        ({ region, value }) => `<div class="dv-grape-harvest-almanac__tooltip-row">
          <span class="dv-grape-harvest-almanac__tooltip-swatch" style="background-color:${PALETTE[region.colorSlot]}"></span>
          <span class="dv-grape-harvest-almanac__tooltip-value">${formatDayOffset(value, lang)}</span>
          <span class="dv-grape-harvest-almanac__tooltip-name">${lang === 'fr' ? region.nameFr : region.nameEn}</span>
        </div>`
      )
      .join('');
    tooltip.innerHTML = `<div class="dv-grape-harvest-almanac__tooltip-year">${year}</div>${rowsHtml}`;
    tooltip.hidden = false;
    positionFloating(tooltip, clientX, clientY);

    const x = xScale(year);
    crosshairLine.setAttribute('x1', String(x));
    crosshairLine.setAttribute('x2', String(x));
    crosshairLine.setAttribute('y1', '0');
    crosshairLine.setAttribute('y2', String(innerHeight));
    crosshairLine.style.display = '';
  }

  function handlePointer(domEvent: PointerEvent) {
    if (tooltipPinned && domEvent.type !== 'click') return;
    const svgRect = svg.getBoundingClientRect();
    const mx = domEvent.clientX - svgRect.left - MARGIN.left;
    const year = Math.round(xScale.invert(mx));
    if (year < minYear || year > maxYear) {
      hideTooltip();
      return;
    }
    showTooltipAtYear(year, domEvent.clientX, domEvent.clientY);
  }

  captureRect.addEventListener('pointermove', (event) => {
    if ((event as PointerEvent).pointerType === 'touch') return;
    handlePointer(event as PointerEvent);
  });
  captureRect.addEventListener('pointerleave', () => {
    if (!tooltipPinned) hideTooltip();
  });
  captureRect.addEventListener('click', (event) => {
    event.stopPropagation();
    tooltipPinned = true;
    handlePointer(event as unknown as PointerEvent);
  });
  stage.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!target.closest('.dv-grape-harvest-almanac__capture')) hideTooltip();
    if (!target.closest('.dv-grape-harvest-almanac__event-hit')) closeEventPanel();
  });

  // --- Axes ---------------------------------------------------------------
  // Years (x, bottom): ticks and labels shown. Harvest day (y, left): no
  // labels (removed at the user's request, see "Axes" in
  // technical-specifications.md) — only light gridlines remain as a visual
  // reference, the exact value is read through the hover/tap tooltip.
  function redrawAxes() {
    xAxisLayer.innerHTML = '';
    const [xMin, xMax] = xScale.domain();
    const step = niceStep(xMax - xMin, 7);
    const firstTick = Math.ceil(xMin / step) * step;
    for (let year = firstTick; year <= xMax; year += step) {
      const x = xScale(year);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'dv-grape-harvest-almanac__gridline');
      line.setAttribute('x1', String(x));
      line.setAttribute('x2', String(x));
      line.setAttribute('y1', String(innerHeight));
      line.setAttribute('y2', String(innerHeight + 5));
      xAxisLayer.appendChild(line);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('class', 'dv-grape-harvest-almanac__axis-label');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(innerHeight + 20));
      text.setAttribute('text-anchor', 'middle');
      text.textContent = String(Math.round(year));
      xAxisLayer.appendChild(text);
    }

    const [yTop, yBottom] = [maxValue, minValue];
    const step2 = niceStep(yTop - yBottom, 5);
    const firstYTick = Math.ceil(yBottom / step2) * step2;
    gridlinesLayer.innerHTML = '';
    for (let value = firstYTick; value <= yTop; value += step2) {
      const y = yScale(value);
      const gridline = document.createElementNS(SVG_NS, 'line');
      gridline.setAttribute('class', 'dv-grape-harvest-almanac__gridline');
      gridline.setAttribute('x1', '0');
      gridline.setAttribute('x2', String(innerWidth));
      gridline.setAttribute('y1', String(y));
      gridline.setAttribute('y2', String(y));
      gridlinesLayer.appendChild(gridline);
    }
  }

  // --- Data layer -----------------------------------------------------------
  function redrawData() {
    const lineGenerator = d3Line<YearValue>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value));

    regionDoms.forEach(({ region, rawSegments, smoothedSegments, rawPaths, smoothedPaths, group }) => {
      const active = activeRegions.has(region.id);
      group.style.display = active ? '' : 'none';
      if (!active) return;

      rawSegments.forEach((segment, i) => rawPaths[i].setAttribute('d', lineGenerator(segment) ?? ''));
      smoothedSegments.forEach((segment, i) => smoothedPaths[i].setAttribute('d', lineGenerator(segment) ?? ''));
    });

    eventDoms.forEach(({ event, band, line, marker, hit }) => {
      const startX = xScale(event.year);
      const endX = event.yearEnd !== null ? xScale(event.yearEnd) : startX;
      const centerX = (startX + endX) / 2;

      if (band) {
        band.setAttribute('x', String(startX));
        band.setAttribute('y', '0');
        band.setAttribute('width', String(Math.max(0, endX - startX)));
        band.setAttribute('height', String(innerHeight));
      }
      if (line) {
        line.setAttribute('x1', String(startX));
        line.setAttribute('x2', String(startX));
        line.setAttribute('y1', '0');
        line.setAttribute('y2', String(innerHeight));
      }
      marker.setAttribute('cx', String(centerX));
      marker.setAttribute('cy', '-14');
      hit.setAttribute('cx', String(centerX));
      hit.setAttribute('cy', '-14');
    });
  }

  // --- Layout / resize --------------------------------------------------
  function layout() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const nonStageHeight = root.getBoundingClientRect().height - rect.height;
    const heightCeiling = getMaxStageBlockHeight() - nonStageHeight;
    const height = Math.max(320, Math.min(width * 0.6, heightCeiling));
    stage.style.height = `${height}px`;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    innerWidth = Math.max(10, width - MARGIN.left - MARGIN.right);
    innerHeight = Math.max(10, height - MARGIN.top - MARGIN.bottom);

    xScale.range([0, innerWidth]);
    yScale.range([0, innerHeight]);
    clipRect.setAttribute('x', '0');
    clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', String(innerWidth));
    clipRect.setAttribute('height', String(innerHeight));
    eventsClipRect.setAttribute('x', '0');
    eventsClipRect.setAttribute('y', String(-MARGIN.top));
    eventsClipRect.setAttribute('width', String(innerWidth));
    eventsClipRect.setAttribute('height', String(innerHeight + MARGIN.top));
    captureRect.setAttribute('x', '0');
    captureRect.setAttribute('y', '0');
    captureRect.setAttribute('width', String(innerWidth));
    captureRect.setAttribute('height', String(innerHeight));

    redrawAxes();
    redrawData();
  }

  const resizeObserver = new ResizeObserver(() => layout());
  resizeObserver.observe(stage);

  let ceilingResizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(ceilingResizeTimeout);
    ceilingResizeTimeout = setTimeout(layout, 150);
  });

  updateEmptyState();
  layout();
}
