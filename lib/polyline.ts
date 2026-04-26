export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function polylineToSvgPath(
  encoded: string,
  width: number,
  height: number,
  padding = 4,
): string | null {
  if (!encoded) return null;
  const points = decodePolyline(encoded);
  if (points.length < 2) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [pLat, pLng] of points) {
    if (pLat < minLat) minLat = pLat;
    if (pLat > maxLat) maxLat = pLat;
    if (pLng < minLng) minLng = pLng;
    if (pLng > maxLng) maxLng = pLng;
  }

  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const lngRange = maxLng - minLng || 1e-9;
  const latRange = maxLat - minLat || 1e-9;
  const scale = Math.min(innerW / lngRange, innerH / latRange);

  const projW = lngRange * scale;
  const projH = latRange * scale;
  const offsetX = padding + (innerW - projW) / 2;
  const offsetY = padding + (innerH - projH) / 2;

  return points
    .map((p, i) => {
      const x = offsetX + (p[1] - minLng) * scale;
      const y = offsetY + (maxLat - p[0]) * scale;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
