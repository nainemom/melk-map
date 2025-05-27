type RGB = [number, number, number];

const gradientStops: { t: number; color: RGB }[] = [
  { t: 0.00, color: [255, 255, 255] }, // white
  { t: 0.10, color: [200, 255, 200] }, // mint green
  { t: 0.20, color: [120, 220, 120] }, // light green
  { t: 0.35, color: [0, 180, 0] },     // green
  { t: 0.45, color: [255, 255, 100] }, // yellow
  { t: 0.65, color: [255, 180, 0] },   // orange
  { t: 0.75, color: [255, 90, 0] },    // red
  { t: 0.88, color: [255, 0, 0] },     // dark red
  { t: 1.00, color: [140, 0, 0] },     // maroon
];

export function interpolateColor(t: number): RGB {
  for (let i = 0; i < gradientStops.length - 1; i++) {
    const curr = gradientStops[i];
    const next = gradientStops[i + 1];

    if (t >= curr.t && t <= next.t) {
      const localT = (t - curr.t) / (next.t - curr.t);
      const r = Math.round(curr.color[0] + (next.color[0] - curr.color[0]) * localT);
      const g = Math.round(curr.color[1] + (next.color[1] - curr.color[1]) * localT);
      const b = Math.round(curr.color[2] + (next.color[2] - curr.color[2]) * localT);
      return [r, g, b];
    }
  }

  return gradientStops[gradientStops.length - 1].color;
}
