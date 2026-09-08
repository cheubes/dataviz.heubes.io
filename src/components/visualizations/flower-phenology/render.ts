import { arc as d3Arc } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import 'd3-transition';

interface DecadeStats {
  medianDoy: number;
  p10: number;
  p90: number;
  observationCount: number;
}

type Decade = '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s';
type RingKey = 'inner' | 'outer';

interface SpeciesEntry {
  species: string;
  nameFr: string;
  nameEn: string;
  family: string;
  flowerColor: string;
  phenology: Record<Decade, DecadeStats>;
}

interface ArcAngles {
  start: number;
  end: number;
}

interface RenderedArc {
  bandPath: SVGPathElement;
  medianPath: SVGPathElement;
  innerR: number;
  outerR: number;
  cornerRadius: number;
}

export interface FlowerPhenologyLabels {
  loading: string;
  error: string;
  empty: string;
  titleLines: string;
  speciesGroupLabel: string;
  innerRingLabel: string;
  outerRingLabel: string;
  medianLabel: string;
  variationLabel: string;
  variationEarlier: string;
  variationLater: string;
  variationSame: string;
}

const DECADES: Decade[] = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

const DECADE_RANGE_LABEL: Record<Decade, string> = {
  '1970s': '1970-1979',
  '1980s': '1980-1989',
  '1990s': '1990-1999',
  '2000s': '2000-2009',
  '2010s': '2010-2019',
  '2020s': '2020-2026',
};

const DEFAULT_INNER_DECADE: Decade = '1970s';
const DEFAULT_OUTER_DECADE: Decade = '2020s';

const COMPACT_MONTH_LABEL_DIAMETER = 360;
const MEDIAN_TICK_HALF_WIDTH_DAYS = 2.5;
const RING_TRANSITION_MS = 500;

function dayOfYear(monthIndex: number, day: number): number {
  const start = Date.UTC(2001, 0, 1); // non-leap reference year
  const current = Date.UTC(2001, monthIndex, day);
  return Math.round((current - start) / 86_400_000) + 1;
}

function formatDoy(doy: number, lang: 'fr' | 'en'): string {
  const reference = new Date(Date.UTC(2001, 0, 1) + (doy - 1) * 86_400_000);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(reference);
}

export async function mountFlowerPhenology(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: FlowerPhenologyLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-flower-phenology');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-flower-phenology__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: SpeciesEntry[];
  try {
    const res = await fetch('/data/flower-phenology/phenology.json');
    if (!res.ok) throw new Error('fetch failed');
    data = await res.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }

  if (data.length === 0) {
    statusEl.textContent = labels.empty;
    return;
  }
  statusEl.remove();

  const doyScale = scaleLinear().domain([1, 366]).range([0, 2 * Math.PI]);
  const monthStarts = Array.from({ length: 12 }, (_, m) => dayOfYear(m, 1));

  function arcAngles(stats: DecadeStats): { band: ArcAngles; median: ArcAngles } {
    return {
      band: { start: doyScale(stats.p10), end: doyScale(stats.p90) },
      median: {
        start: doyScale(stats.medianDoy - MEDIAN_TICK_HALF_WIDTH_DAYS),
        end: doyScale(stats.medianDoy + MEDIAN_TICK_HALF_WIDTH_DAYS),
      },
    };
  }

  // --- Layout -------------------------------------------------------------
  const controls = document.createElement('div');
  controls.className = 'dv-flower-phenology__controls';
  root.appendChild(controls);

  const speciesGroup = document.createElement('div');
  speciesGroup.className = 'dv-flower-phenology__species-group';
  speciesGroup.setAttribute('role', 'group');
  speciesGroup.setAttribute('aria-label', labels.speciesGroupLabel);
  controls.appendChild(speciesGroup);

  const selectedSpecies = new Set(data.map((s) => s.species));

  data.forEach((entry) => {
    const label = document.createElement('label');
    label.className = 'dv-flower-phenology__toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) selectedSpecies.add(entry.species);
      else selectedSpecies.delete(entry.species);
      renderFull();
    });
    const swatch = document.createElement('span');
    swatch.className = 'dv-flower-phenology__swatch';
    swatch.style.backgroundColor = entry.flowerColor;
    label.append(input, swatch, document.createTextNode(lang === 'fr' ? entry.nameFr : entry.nameEn));
    speciesGroup.appendChild(label);
  });

  const decadeGroup = document.createElement('div');
  decadeGroup.className = 'dv-flower-phenology__decade-group';
  controls.appendChild(decadeGroup);

  let innerDecade: Decade = DEFAULT_INNER_DECADE;
  let outerDecade: Decade = DEFAULT_OUTER_DECADE;

  function buildDecadeSelect(ringKey: RingKey, ringLabel: string, initial: Decade): HTMLSelectElement {
    const field = document.createElement('label');
    field.className = 'dv-flower-phenology__decade-field';
    const text = document.createElement('span');
    text.className = 'dv-flower-phenology__decade-label';
    text.textContent = ringLabel;
    const select = document.createElement('select');
    select.className = 'dv-flower-phenology__decade-select';
    DECADES.forEach((decade) => {
      const option = document.createElement('option');
      option.value = decade;
      option.textContent = DECADE_RANGE_LABEL[decade];
      option.selected = decade === initial;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      changeRingDecade(ringKey, select.value as Decade);
    });
    field.append(text, select);
    decadeGroup.appendChild(field);
    return select;
  }

  buildDecadeSelect('inner', labels.innerRingLabel, innerDecade);
  buildDecadeSelect('outer', labels.outerRingLabel, outerDecade);

  const stage = document.createElement('div');
  stage.className = 'dv-flower-phenology__stage';
  root.appendChild(stage);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'dv-flower-phenology__svg');
  stage.appendChild(svg);

  const ringGuidesLayer = document.createElementNS(svgNS, 'g');
  const arcsLayer = document.createElementNS(svgNS, 'g');
  const labelsLayer = document.createElementNS(svgNS, 'g');
  const titleLayer = document.createElementNS(svgNS, 'g');
  svg.append(ringGuidesLayer, arcsLayer, labelsLayer, titleLayer);

  const tooltip = document.createElement('div');
  tooltip.className = 'dv-flower-phenology__tooltip';
  tooltip.hidden = true;
  stage.appendChild(tooltip);

  const emptyMessage = document.createElement('p');
  emptyMessage.className = 'dv-flower-phenology__status';
  emptyMessage.textContent = labels.empty;
  emptyMessage.hidden = true;
  stage.appendChild(emptyMessage);

  let pinned = false;

  function hideTooltip() {
    tooltip.hidden = true;
    pinned = false;
  }

  function showTooltip(entry: SpeciesEntry, decade: Decade, otherDecade: Decade, clientX: number, clientY: number) {
    const stats = entry.phenology[decade];
    const otherStats = entry.phenology[otherDecade];
    const diff = otherStats.medianDoy - stats.medianDoy;
    const variationText =
      diff === 0
        ? labels.variationSame
        : (diff > 0 ? labels.variationLater : labels.variationEarlier).replace(
            '{days}',
            String(Math.abs(diff))
          );

    const speciesName = lang === 'fr' ? entry.nameFr : entry.nameEn;
    tooltip.innerHTML = `
      <strong>${speciesName}</strong><br>
      ${labels.medianLabel} ${formatDoy(stats.medianDoy, lang)} (${DECADE_RANGE_LABEL[decade]})<br>
      ${labels.variationLabel} ${variationText}
    `;
    const stageRect = stage.getBoundingClientRect();
    tooltip.style.left = `${clientX - stageRect.left + 12}px`;
    tooltip.style.top = `${clientY - stageRect.top + 12}px`;
    tooltip.hidden = false;
  }

  function updateEmptyState() {
    const isEmpty = selectedSpecies.size === 0;
    emptyMessage.hidden = !isEmpty;
    svg.style.visibility = isEmpty ? 'hidden' : 'visible';
  }

  // Arcs currently on stage, keyed by "<species>|inner" / "<species>|outer".
  // Event listeners close over the (stable) entry + ringKey only, never over
  // the decade itself — that's read live from `innerDecade`/`outerDecade` at
  // call time, so changing a ring's decade (which reuses these same DOM
  // nodes, see changeRingDecade below) never leaves a listener pointing at a
  // stale decade.
  const arcState = new Map<string, RenderedArc>();

  function currentDecadeForRing(ringKey: RingKey): Decade {
    return ringKey === 'inner' ? innerDecade : outerDecade;
  }

  function renderFull() {
    updateEmptyState();
    hideTooltip();
    arcState.clear();

    const rect = stage.getBoundingClientRect();
    const size = Math.max(200, rect.width);
    const outerRadius = size / 2 - 30; // reserve space for month labels (French abbreviations run longer than English)
    const centerRadius = outerRadius * 0.3;
    const ringGap = outerRadius * 0.035;
    const bandThickness = (outerRadius - centerRadius - 2 * ringGap) / 2;
    const compact = size < COMPACT_MONTH_LABEL_DIAMETER;

    svg.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`);

    const laneCount = data.length;
    const laneThickness = bandThickness / laneCount;
    const laneStrokeGap = Math.min(1, laneThickness * 0.12);
    const cornerRadius = Math.max(0, Math.min(2, laneThickness / 2 - 0.5));

    function laneRadii(ringStart: number, laneIndex: number) {
      const inner = ringStart + laneIndex * laneThickness;
      const outer = inner + laneThickness - laneStrokeGap;
      return { inner, outer };
    }

    const innerRingStart = centerRadius + ringGap;
    const outerRingStart = innerRingStart + bandThickness + ringGap;

    // Ring guides: a stroked circle at each ring's inner and outer edge, so
    // the two decades stay visually separated even where no arc is drawn
    // (a gap between two species' bloom windows, or few species selected).
    ringGuidesLayer.innerHTML = '';
    [innerRingStart, innerRingStart + bandThickness, outerRingStart, outerRingStart + bandThickness].forEach(
      (radius) => {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('r', String(radius));
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'var(--dv-gridline)');
        circle.setAttribute('stroke-width', '1');
        ringGuidesLayer.appendChild(circle);
      }
    );

    arcsLayer.innerHTML = '';

    data.forEach((entry, laneIndex) => {
      if (!selectedSpecies.has(entry.species)) return;

      (['inner', 'outer'] as const).forEach((ringKey) => {
        const ringStart = ringKey === 'inner' ? innerRingStart : outerRingStart;
        const decade = currentDecadeForRing(ringKey);
        const stats = entry.phenology[decade];
        const { inner, outer } = laneRadii(ringStart, laneIndex);
        const { band, median } = arcAngles(stats);

        const bandGenerator = d3Arc()
          .innerRadius(inner)
          .outerRadius(outer)
          .cornerRadius(cornerRadius)
          .startAngle(band.start)
          .endAngle(band.end);

        const bandPath = document.createElementNS(svgNS, 'path');
        bandPath.setAttribute('class', 'dv-flower-phenology__arc');
        bandPath.setAttribute('d', bandGenerator({} as any) ?? '');
        bandPath.setAttribute('fill', entry.flowerColor);
        bandPath.setAttribute('fill-opacity', '0.75');
        bandPath.setAttribute('stroke', 'var(--dv-gridline)');
        bandPath.setAttribute('stroke-width', '1');

        const medianGenerator = d3Arc()
          .innerRadius(inner)
          .outerRadius(outer)
          .startAngle(median.start)
          .endAngle(median.end);

        const medianPath = document.createElementNS(svgNS, 'path');
        medianPath.setAttribute('d', medianGenerator({} as any) ?? '');
        medianPath.setAttribute('fill', entry.flowerColor);
        medianPath.setAttribute('pointer-events', 'none');

        const group = document.createElementNS(svgNS, 'g');
        group.append(bandPath, medianPath);
        arcsLayer.appendChild(group);

        arcState.set(`${entry.species}|${ringKey}`, { bandPath, medianPath, innerR: inner, outerR: outer, cornerRadius });

        function handleShow(event: PointerEvent) {
          if (pinned && event.type !== 'click') return;
          const decadeNow = currentDecadeForRing(ringKey);
          const otherDecadeNow = currentDecadeForRing(ringKey === 'inner' ? 'outer' : 'inner');
          showTooltip(entry, decadeNow, otherDecadeNow, event.clientX, event.clientY);
        }

        bandPath.addEventListener('pointerenter', (event) => {
          if ((event as PointerEvent).pointerType === 'touch' || pinned) return;
          handleShow(event as PointerEvent);
        });
        bandPath.addEventListener('pointermove', (event) => {
          if ((event as PointerEvent).pointerType === 'touch' || pinned) return;
          handleShow(event as PointerEvent);
        });
        bandPath.addEventListener('pointerleave', () => {
          if (!pinned) hideTooltip();
        });
        bandPath.addEventListener('click', (event) => {
          event.stopPropagation();
          pinned = true;
          handleShow(event as unknown as PointerEvent);
        });
      });
    });

    // --- Month labels -----------------------------------------------------
    labelsLayer.innerHTML = '';
    const labelRadius = outerRingStart + bandThickness + 12;
    const monthFormatter = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' });

    monthStarts.forEach((doy, monthIndex) => {
      const angle = doyScale(doy) - Math.PI / 2; // 0 = 12 o'clock in d3-shape; shift to standard trig angle
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y));
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', 'var(--dv-ink-secondary)');

      const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const cos = Math.cos(normalized);
      const sin = Math.sin(normalized);
      text.setAttribute('text-anchor', cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle');
      text.setAttribute('dominant-baseline', sin > 0.3 ? 'hanging' : sin < -0.3 ? 'auto' : 'middle');

      const monthDate = new Date(Date.UTC(2001, monthIndex, 1));
      text.textContent = compact
        ? monthFormatter.format(monthDate).charAt(0).toUpperCase()
        : monthFormatter.format(monthDate);
      labelsLayer.appendChild(text);
    });

    // --- Central title ------------------------------------------------------
    titleLayer.innerHTML = '';
    const titleText = document.createElementNS(svgNS, 'text');
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('fill', 'var(--dv-ink-primary)');
    titleText.setAttribute('font-weight', '500');
    titleText.setAttribute('font-size', String(Math.max(11, Math.min(15, centerRadius / 4.2))));
    const lines = labels.titleLines.split('\n');
    const lineHeight = Math.max(13, Math.min(18, centerRadius / 3.5));
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('y', String((i - (lines.length - 1) / 2) * lineHeight));
      tspan.textContent = line;
      titleText.appendChild(tspan);
    });
    titleLayer.appendChild(titleText);
  }

  // Ring decade change: reuses the arcs already on that ring and morphs each
  // one from its old angular span to its new one, rather than a full rebuild
  // — the visual cue that "this species' bloom window shifted" is the point
  // of the comparison (see "Comparaison de décennies" in
  // functional-specifications.md). Only the changed ring's arcs animate.
  function changeRingDecade(ringKey: RingKey, newDecade: Decade) {
    const oldDecade = currentDecadeForRing(ringKey);
    if (newDecade === oldDecade) return;
    hideTooltip();

    data.forEach((entry) => {
      if (!selectedSpecies.has(entry.species)) return;
      const state = arcState.get(`${entry.species}|${ringKey}`);
      if (!state) return;

      const from = arcAngles(entry.phenology[oldDecade]);
      const to = arcAngles(entry.phenology[newDecade]);

      animateArc(state.bandPath, state.innerR, state.outerR, state.cornerRadius, from.band, to.band);
      animateArc(state.medianPath, state.innerR, state.outerR, 0, from.median, to.median);
    });

    if (ringKey === 'inner') innerDecade = newDecade;
    else outerDecade = newDecade;
  }

  function animateArc(
    path: SVGPathElement,
    innerR: number,
    outerR: number,
    cornerRadius: number,
    from: ArcAngles,
    to: ArcAngles
  ) {
    const generator = d3Arc().innerRadius(innerR).outerRadius(outerR).cornerRadius(cornerRadius);
    select(path)
      .transition()
      .duration(RING_TRANSITION_MS)
      .attrTween('d', () => (t: number) => {
        generator.startAngle(from.start + (to.start - from.start) * t).endAngle(from.end + (to.end - from.end) * t);
        return generator({} as any) ?? '';
      });
  }

  stage.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!target.closest('.dv-flower-phenology__arc')) hideTooltip();
  });

  const resizeObserver = new ResizeObserver(() => renderFull());
  resizeObserver.observe(stage);

  updateEmptyState();
  renderFull();
}
