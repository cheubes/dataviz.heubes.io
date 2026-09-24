import type { GeoProjection } from 'd3-geo';
import { zoomIdentity, type ZoomTransform } from 'd3-zoom';

export function getUrlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function setUrlParams(params: Record<string, string | null>): void {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(params)) {
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  // Commas stay readable in shared links (`regions=us,china`) instead of the
  // `%2C` URLSearchParams would otherwise produce.
  const search = url.searchParams.toString().replace(/%2C/g, ',');
  history.replaceState(history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
}

// Framing is stored as the geographic center of the visible area rather than
// pixels, so a shared link frames the same place whatever the recipient's
// screen size or aspect ratio.
export function readZoomParam(
  projection: GeoProjection,
  width: number,
  height: number,
  [minK, maxK]: [number, number]
): ZoomTransform | null {
  const parts = (getUrlParam('zoom') ?? '').split(',').map(Number);
  if (parts.length !== 3 || !parts.every(Number.isFinite)) return null;
  const [rawK, lon, lat] = parts;
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  const center = projection([lon, lat]);
  if (!center) return null;
  const k = Math.max(minK, Math.min(maxK, rawK));
  return zoomIdentity.translate(width / 2 - k * center[0], height / 2 - k * center[1]).scale(k);
}

export function writeZoomParam(transform: ZoomTransform, projection: GeoProjection, width: number, height: number): void {
  const k = Math.round(transform.k * 100) / 100;
  const center = projection.invert?.(transform.invert([width / 2, height / 2]));
  setUrlParams({
    zoom: k === 1 || !center ? null : `${k},${center[0].toFixed(4)},${center[1].toFixed(4)}`,
  });
}
