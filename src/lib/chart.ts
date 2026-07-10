// Shared SVG line-chart geometry. One smoothing implementation for every line
// chart in the app (Stats views, follower growth, engagement) so «плавные
// графики» stay consistent: Catmull-Rom converted to cubic Béziers — the
// standard smooth-through-points curve (tension 1/6). Endpoints are clamped to
// their neighbors, so the curve passes through every data point and never
// dangles past the first/last one.
export type Pt = { x: number; y: number };

export function smoothLinePath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  const f = (n: number) => n.toFixed(2);
  if (pts.length === 1) return `M${f(pts[0].x)} ${f(pts[0].y)}`;
  const d: string[] = [`M${f(pts[0].x)} ${f(pts[0].y)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`);
  }
  return d.join(" ");
}

// The filled under-curve area: the smooth line, dropped to `baselineY` at both
// ends and closed. Callers pass the same points they drew the line with.
export function smoothAreaPath(pts: Pt[], baselineY: number): string {
  if (pts.length === 0) return "";
  const f = (n: number) => n.toFixed(2);
  const line = smoothLinePath(pts);
  return `${line} L${f(pts[pts.length - 1].x)} ${f(baselineY)} L${f(pts[0].x)} ${f(baselineY)} Z`;
}
