import { interpolateNumber } from 'd3-interpolate';
import { timer as d3Timer } from 'd3-timer';
import { getUrlParam, setUrlParams } from '../../../scripts/url-state';

interface SpeciesCount {
  year: number;
  population: number;
  populationLabel?: string;
}

interface SpeciesEntry {
  id: string;
  nameFr: string;
  nameEn: string;
  unit: 'individuals' | 'burrows';
  iconRatio: number;
  counts: SpeciesCount[];
}

interface SpeciesData {
  species: SpeciesEntry[];
}

export interface EndangeredSpeciesLabels {
  loading: string;
  error: string;
  play: string;
  pause: string;
  yearLabel: string;
  speedLabel: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  unitIndividuals: string;
  unitBurrows: string;
  measurementLabel: string;
  trendUp: string;
  trendDown: string;
  trendStable: string;
}

type Speed = 'slow' | 'normal' | 'fast';
// Same convention as light-pollution/satellites-in-orbit.
const SPEED_FACTORS: Record<Speed, number> = { slow: 0.5, normal: 1, fast: 2 };

// Time spent on each simulated year at normal speed, and the pause on the
// final year before looping back to the oldest one — same "hold on the
// culmination" pattern as light-pollution/satellites-in-orbit (see
// "Animation" in technical-specifications.md).
const STEP_MS = 450;
const HOLD_MS = 2000;

const SVG_NS = 'http://www.w3.org/2000/svg';
const PAW_SYMBOL_ID = 'dv-endangered-species-paw';

// Generic animal silhouette (paw print), reused for all six species rather
// than one icon per species (see "Rendu" in technical-specifications.md and
// "Iconographie" in style-guide.md: no icon library, minimal inline SVG).
function buildPawSymbol(): SVGSymbolElement {
  const symbol = document.createElementNS(SVG_NS, 'symbol');
  symbol.setAttribute('id', PAW_SYMBOL_ID);
  symbol.setAttribute('viewBox', '0 0 24 24');
  const shapes: [number, number, number, number, string?][] = [
    [12, 16.5, 6.2, 5.3],
    [5.2, 8.6, 2.3, 3, 'rotate(-20 5.2 8.6)'],
    [10, 5.3, 2.5, 3.2],
    [15.3, 5.6, 2.5, 3.2],
    [19.6, 8.8, 2.3, 3, 'rotate(20 19.6 8.8)'],
  ];
  shapes.forEach(([cx, cy, rx, ry, transform]) => {
    const ellipse = document.createElementNS(SVG_NS, 'ellipse');
    ellipse.setAttribute('cx', String(cx));
    ellipse.setAttribute('cy', String(cy));
    ellipse.setAttribute('rx', String(rx));
    ellipse.setAttribute('ry', String(ry));
    if (transform) ellipse.setAttribute('transform', transform);
    symbol.appendChild(ellipse);
  });
  return symbol;
}

function createIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'dv-endangered-species__icon');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${PAW_SYMBOL_ID}`);
  svg.appendChild(use);
  return svg;
}

// Population at a given simulated year: linear interpolation between the two
// known measurements bracketing it, clamped to the species' first/last known
// value outside its own range (see "Animation" in technical-specifications.md).
function populationAt(counts: SpeciesCount[], year: number): number {
  const first = counts[0];
  const last = counts[counts.length - 1];
  if (year <= first.year) return first.population;
  if (year >= last.year) return last.population;
  for (let i = 0; i < counts.length - 1; i++) {
    const a = counts[i];
    const b = counts[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return interpolateNumber(a.population, b.population)(t);
    }
  }
  return last.population;
}

// Most recent real measurement at or before the given simulated year, plus
// the one before it (for the trend) — the detail card always cites a real,
// sourced number, never the smoothed interpolated value used for the icon
// count (see "Interactions" in functional-specifications.md).
function realPointAt(
  counts: SpeciesCount[],
  year: number
): { current: SpeciesCount; previous: SpeciesCount | null } {
  let index = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i].year <= year) index = i;
    else break;
  }
  return { current: counts[index], previous: index > 0 ? counts[index - 1] : null };
}

function formatDetail(
  species: SpeciesEntry,
  year: number,
  lang: 'fr' | 'en',
  labels: EndangeredSpeciesLabels
): string {
  const { current, previous } = realPointAt(species.counts, year);
  const unitLabel = species.unit === 'burrows' ? labels.unitBurrows : labels.unitIndividuals;
  const valueText = current.populationLabel ?? current.population.toLocaleString(lang);
  const lines = [`<strong>${valueText} ${unitLabel}</strong>`, labels.measurementLabel.replace('{year}', String(current.year))];
  if (previous) {
    const trendKey = current.population > previous.population ? 'trendUp' : current.population < previous.population ? 'trendDown' : 'trendStable';
    lines.push(labels[trendKey].replace('{year}', String(previous.year)));
  }
  return lines.join('<br>');
}

interface CardRefs {
  species: SpeciesEntry;
  card: HTMLElement;
  iconsEl: HTMLElement;
  icons: SVGSVGElement[];
  detailEl: HTMLElement;
  lastIconCount: number;
  detailVisible: boolean;
}

export async function mountEndangeredSpecies(
  root: HTMLElement,
  lang: 'fr' | 'en',
  labels: EndangeredSpeciesLabels
): Promise<void> {
  root.innerHTML = '';
  root.classList.add('dv-endangered-species');

  const statusEl = document.createElement('p');
  statusEl.className = 'dv-endangered-species__status';
  statusEl.textContent = labels.loading;
  root.appendChild(statusEl);

  let data: SpeciesData;
  try {
    const res = await fetch('/data/endangered-species/species.json');
    if (!res.ok) throw new Error('fetch failed');
    data = await res.json();
  } catch {
    statusEl.textContent = labels.error;
    return;
  }
  statusEl.remove();

  const defsSvg = document.createElementNS(SVG_NS, 'svg');
  defsSvg.setAttribute('class', 'dv-endangered-species__defs');
  defsSvg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.appendChild(buildPawSymbol());
  defsSvg.appendChild(defs);
  root.appendChild(defsSvg);

  // Created (and placed) above the cards now, populated further down once
  // the cards/render loop exist (see "Contrôles de lecture" in
  // functional-specifications.md : moved above after user feedback).
  const controls = document.createElement('div');
  controls.className = 'dv-endangered-species__controls';
  root.appendChild(controls);

  const grid = document.createElement('div');
  grid.className = 'dv-endangered-species__grid';
  root.appendChild(grid);

  let minYear = Infinity;
  let maxYear = -Infinity;
  data.species.forEach((species) => {
    minYear = Math.min(minYear, species.counts[0].year);
    maxYear = Math.max(maxYear, species.counts[species.counts.length - 1].year);
  });

  let pinnedCard: HTMLElement | null = null;

  function hideDetail(refs: CardRefs) {
    refs.detailEl.hidden = true;
    refs.detailVisible = false;
    if (pinnedCard === refs.card) pinnedCard = null;
  }

  function showDetail(refs: CardRefs, year: number) {
    refs.detailVisible = true;
    refs.detailEl.innerHTML = formatDetail(refs.species, year, lang, labels);
    refs.detailEl.hidden = false;
  }

  const cards: CardRefs[] = data.species.map((species) => {
    const card = document.createElement('div');
    card.className = 'dv-endangered-species__card';
    card.style.setProperty('--dv-endangered-species-bg', `url('/data/endangered-species/${species.id}.jpg')`);

    const name = document.createElement('h3');
    name.className = 'dv-endangered-species__name';
    name.textContent = lang === 'fr' ? species.nameFr : species.nameEn;
    card.appendChild(name);

    const iconsEl = document.createElement('div');
    iconsEl.className = 'dv-endangered-species__icons';
    card.appendChild(iconsEl);

    const detailEl = document.createElement('div');
    detailEl.className = 'dv-endangered-species__detail';
    detailEl.hidden = true;
    card.appendChild(detailEl);

    grid.appendChild(card);

    const refs: CardRefs = {
      species,
      card,
      iconsEl,
      icons: [],
      detailEl,
      lastIconCount: -1,
      detailVisible: false,
    };

    // Same hover-on-desktop/tap-to-pin-on-touch pattern as
    // light-pollution's hex tooltip (see "Responsive" in
    // functional-specifications.md: tap rather than hover on small screens).
    card.addEventListener('pointerenter', (event) => {
      if ((event as PointerEvent).pointerType === 'touch' || pinnedCard) return;
      showDetail(refs, currentYear);
    });
    card.addEventListener('pointerleave', () => {
      if (pinnedCard !== card) hideDetail(refs);
    });
    card.addEventListener('click', (event) => {
      event.stopPropagation();
      if (pinnedCard === card) {
        hideDetail(refs);
        return;
      }
      if (pinnedCard) {
        const pinnedRefs = cards.find((c) => c.card === pinnedCard);
        if (pinnedRefs) hideDetail(pinnedRefs);
      }
      pinnedCard = card;
      showDetail(refs, currentYear);
    });

    return refs;
  });

  document.addEventListener('click', () => {
    if (pinnedCard) {
      const pinnedRefs = cards.find((c) => c.card === pinnedCard);
      if (pinnedRefs) hideDetail(pinnedRefs);
    }
  });

  function setIconCount(refs: CardRefs, count: number) {
    if (count === refs.lastIconCount) return;
    refs.lastIconCount = count;
    while (refs.icons.length < count) {
      const icon = createIcon();
      refs.iconsEl.appendChild(icon);
      refs.icons.push(icon);
    }
    while (refs.icons.length > count) {
      const icon = refs.icons.pop();
      icon?.remove();
    }
  }

  let currentYear = minYear;

  function renderAt(year: number) {
    currentYear = year;
    cards.forEach((refs) => {
      const population = populationAt(refs.species.counts, year);
      setIconCount(refs, Math.max(0, Math.round(population / refs.species.iconRatio)));
      if (refs.detailVisible) showDetail(refs, year);
    });
  }

  renderAt(minYear);

  // --- Controls (populating the container created above the cards) ---
  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'dv-endangered-species__play';
  controls.appendChild(playButton);

  const speedSelect = document.createElement('select');
  speedSelect.className = 'dv-endangered-species__speed';
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
  yearGroup.className = 'dv-endangered-species__year-group';
  controls.appendChild(yearGroup);

  const yearLabelEl = document.createElement('label');
  yearLabelEl.textContent = labels.yearLabel;
  yearLabelEl.htmlFor = 'dv-endangered-species-year';
  yearGroup.appendChild(yearLabelEl);

  const yearSlider = document.createElement('input');
  yearSlider.type = 'range';
  yearSlider.id = 'dv-endangered-species-year';
  yearSlider.className = 'dv-endangered-species__year-slider';
  yearSlider.min = String(minYear);
  yearSlider.max = String(maxYear);
  yearSlider.step = '1';
  yearSlider.value = String(minYear);
  yearSlider.setAttribute('list', 'dv-endangered-species-year-ticks');
  yearGroup.appendChild(yearSlider);

  const yearTicks = document.createElement('datalist');
  yearTicks.id = 'dv-endangered-species-year-ticks';
  for (let year = minYear; year <= maxYear; year++) {
    const option = document.createElement('option');
    option.value = String(year);
    yearTicks.appendChild(option);
  }
  yearGroup.appendChild(yearTicks);

  const yearValueEl = document.createElement('span');
  yearValueEl.className = 'dv-endangered-species__year-value';
  yearGroup.appendChild(yearValueEl);

  let playing = true;
  let speed: Speed = 'normal';
  let holding = false;
  let holdElapsedMs = 0;
  let stepElapsedMs = 0;
  let lastFrameTime = performance.now();

  function setYear(year: number) {
    yearSlider.value = String(year);
    yearValueEl.textContent = String(year);
    renderAt(year);
  }
  setYear(minYear);

  function updatePlayButton() {
    playButton.textContent = playing ? labels.pause : labels.play;
  }
  updatePlayButton();

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
        setYear(minYear);
      }
      return;
    }

    stepElapsedMs += dtMs * SPEED_FACTORS[speed];
    if (stepElapsedMs < STEP_MS) return;
    stepElapsedMs -= STEP_MS;

    if (currentYear < maxYear) {
      setYear(currentYear + 1);
      if (currentYear === maxYear) holding = true;
    }
  });

  playButton.addEventListener('click', () => {
    playing = !playing;
    updatePlayButton();
    setUrlParams({ year: playing ? null : String(currentYear) });
  });

  speedSelect.addEventListener('change', () => {
    speed = speedSelect.value as Speed;
  });

  yearSlider.addEventListener('input', () => {
    // Manual scrubbing takes over from autoplay, same as pressing pause.
    playing = false;
    updatePlayButton();
    stepElapsedMs = 0;
    setYear(Number(yearSlider.value));
    // Resuming from the last year must go through the end-of-pass hold, or
    // the autoplay step (which only ever advances) would stay stuck there.
    holding = currentYear === maxYear;
    holdElapsedMs = 0;
  });

  yearSlider.addEventListener('change', () => {
    setUrlParams({ year: yearSlider.value });
  });

  const urlYear = Number(getUrlParam('year'));
  if (Number.isInteger(urlYear) && urlYear >= minYear && urlYear <= maxYear) {
    playing = false;
    updatePlayButton();
    setYear(urlYear);
    holding = currentYear === maxYear;
  }
}
