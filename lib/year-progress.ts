export function getYearProgress(): { progress: number; year: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const progress =
    (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  return { progress, year: now.getFullYear() };
}

const GRADIENT_STOPS: { rgb: [number, number, number]; pct: number }[] = [
  { rgb: [167, 139, 250], pct: 0 },
  { rgb: [56, 189, 248], pct: 20 },
  { rgb: [52, 211, 153], pct: 40 },
  { rgb: [250, 204, 21], pct: 60 },
  { rgb: [251, 146, 60], pct: 80 },
  { rgb: [251, 113, 133], pct: 100 },
];

function rgb(c: [number, number, number]): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function getGradientCss(direction: "to bottom" | "to right"): string {
  const stops = GRADIENT_STOPS.map((s) => `${rgb(s.rgb)} ${s.pct}%`).join(", ");
  return `linear-gradient(${direction}, ${stops})`;
}

export function getGradientColorAt(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress)) * 100;

  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (clamped >= a.pct && clamped <= b.pct) {
      const t = (clamped - a.pct) / (b.pct - a.pct);
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t);
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t);
      const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t);
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }

  return rgb(GRADIENT_STOPS[GRADIENT_STOPS.length - 1].rgb);
}
