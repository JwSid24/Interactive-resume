// Clean-up drawing helpers: contours are hand-placed point lists per pose, joined into smooth curves.
// A point [x, y, 'c'] is a corner (no smoothing through it).
import { C, W, uid } from './kit.mjs';

const f = (n) => +n.toFixed(2);
/** Catmull-Rom spline through points -> cubic Bezier path. */
export function cr(pts, closed = true, t = 1) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f(pts[0][0])},${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = p1[2] === 'c' ? p1 : [p1[0] + (p2[0] - p0[0]) * t / 6, p1[1] + (p2[1] - p0[1]) * t / 6];
    const c2 = p2[2] === 'c' ? p2 : [p2[0] - (p3[0] - p1[0]) * t / 6, p2[1] - (p3[1] - p1[1]) * t / 6];
    d += ` C ${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (closed ? ' Z' : '');
}
/**
 * A cel-shaded region: base colour, hard shadow on the side away from the key light (upper right),
 * produced by masking with a copy shifted toward the light, then an ink outline.
 * extra: SVG drawn inside the region's clip (stripes, folds...).
 */
export function region(pts, base, shade, o = {}) {
  const d = typeof pts === 'string' ? pts : cr(pts), id = uid('rg'), k = o.k ?? 8, ang = o.ang ?? -40;
  const dx = k * Math.cos(ang * Math.PI / 180), dy = k * Math.sin(ang * Math.PI / 180);
  let s = `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`;
  if (o.under) s += o.under;
  else s += `<path d="${d}" fill="${shade}"/><path d="${d}" fill="${base}" transform="translate(${f(dx)} ${f(dy)})"/>`;
  if (o.extra) s += o.extra;
  if (o.rim !== false && !o.under) s += `<path d="${d}" fill="none" stroke="#FFF4E6" stroke-width="${o.rimW || 3}" opacity="${o.rimOp ?? .35}" transform="translate(${f(dx * .45)} ${f(dy * .45)})"/>`;
  s += `</g>`;
  if (o.line !== false) s += `<path d="${d}" fill="none" stroke="${C.INK}" stroke-width="${o.w || W.OUT}" stroke-linejoin="round" stroke-linecap="round"/>`;
  return s;
}
/** Interior line (muscle, fold, overlap) with tapered feel via low opacity ends. */
export const ln = (pts, w = 1.6, col = C.INK, op = 1) => `<path d="${cr(pts, false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
export const fill = (pts, col, op = 1) => `<path d="${typeof pts === 'string' ? pts : cr(pts)}" fill="${col}" opacity="${op}"/>`;
export const clip = (pts, inner) => { const id = uid('cp'); return `<clipPath id="${id}"><path d="${typeof pts === 'string' ? pts : cr(pts)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
/** Vertical blaugrana stripes inside the current clip; xs = stripe boundary x positions (already foreshortened). */
export function stripesAt(xs, y0, y1, skew = 0) {
  let s = '';
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1];
    s += `<polygon points="${f(a)},${y0} ${f(b)},${y0} ${f(b + skew)},${y1} ${f(a + skew)},${y1}" fill="${i % 2 ? C.GAR : C.BLU}"/>`;
  }
  return s;
}
