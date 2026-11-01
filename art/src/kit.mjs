// Shared palette + tiny SVG helpers for the Jwandini model sheet.
// Every shape is authored once in a local "head unit" space (HU = 100, y = 0 at the top of the skull)
// and mirrored/moved with xf(), so all views come from the same drawings.

export const C = {
  INK: '#241418',
  PAPER: '#F7F3EA',
  SKIN: '#F4C6A0', SKIN_SH: '#DC9970', SKIN_SH2: '#C47B55', SKIN_HL: '#FFE3CB', LIP: '#C9715A',
  HAIR: '#3E2619', HAIR_SH: '#24140B', HAIR_SH2: '#130904', HAIR_HL: '#7A4A2C', HAIR_SPEC: '#B98058',
  EYE_WHITE: '#FBF8F6', EYE_SH: '#D9D2E2',
  GAR: '#A3123F', GAR_SH: '#6E0A2C', BLU: '#0C4FA3', BLU_SH: '#06336F',
  GOLD: '#E9B83A', GOLD_SH: '#A87912', GOLD_HL: '#FFE69A',
  NAVY: '#13275C', NAVY_SH: '#0A1636', NAVY_HL: '#2C4A93',
  SOCK: '#0C4FA3', SOCK_SH: '#06336F',
  BOOT: '#17171D', BOOT_SH: '#060608', BOOT_HL: '#4A4A5C',
  SHADE: '#B7A6D6', // cool multiply shadow used on fabric
};

export const W = { OUT: 3.0, IN: 1.6, FINE: 1.0 };

let _uid = 0;
export const uid = (p = 'u') => `${p}${++_uid}`;

/** Map every "x,y" pair inside an absolute path string through fn. */
export function xf(d, fn) {
  return d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_, a, b) => {
    const [x, y] = fn(+a, +b);
    return `${+x.toFixed(2)},${+y.toFixed(2)}`;
  });
}
export const mirror = (d) => xf(d, (x, y) => [-x, y]);
export const move = (d, dx, dy, sx = 1, sy = sx) => xf(d, (x, y) => [x * sx + dx, y * sy + dy]);

/** Filled shape with ink outline. */
export const P = (d, fill, w = W.IN, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${C.INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
/** Fill only (shadows, highlights). */
export const F = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
/** Cool translucent shadow: darkens garnet and blue stripes by the same amount. */
export const SH = (d, op = 1) => `<path d="${d}" fill="#2B1240" opacity="${(0.34 * op).toFixed(3)}"/>`;
/** Line. */
export const L = (d, w = W.IN, col = C.INK, op = 1) =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}/>`;
export const E = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${+cx.toFixed(2)}" cy="${+cy.toFixed(2)}" rx="${+rx.toFixed(2)}" ry="${+ry.toFixed(2)}" fill="${fill}"${extra}/>`;
export const G = (inner, t = '') => `<g${t ? ` transform="${t}"` : ''}>${inner}</g>`;
export const clip = (id, d, inner) => `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;

/**
 * Spiky hair silhouette: alternating base/tip points joined with curved edges.
 * Every edge bulges to the same side of its travel direction, which gives anime spikes their swept, flame-like curl.
 */
export function spikes(pts, bend = 0.16, close = true) {
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
    const k = pts[i][2] ?? bend;
    d += ` Q ${+(mx - dy * k).toFixed(2)},${+(my + dx * k).toFixed(2)} ${x1},${y1}`;
  }
  return d + (close ? ' Z' : '');
}

/** Shared <defs>: gradients use objectBoundingBox units, so one definition serves every eye/shape. */
/** Tapered hair lock: root r1 -> tip -> root r2, both edges curling the same way. */
export function lock(r1, tip, r2, curl = 0.1) {
  const e = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return `${+(mx - dy * k).toFixed(2)},${+(my + dx * k).toFixed(2)}`; };
  return `M ${r1[0]},${r1[1]} Q ${e(r1, tip, curl)} ${tip[0]},${tip[1]} Q ${e(tip, r2, curl)} ${r2[0]},${r2[1]} Z`;
}
/** Per-spike cel shading for a spikes() list: a dark sliver on the left edge of every tip, a light streak on the right. */
export function spikeShade(pts, cx, cy) {
  let dk = '', lt = '';
  for (let i = 1; i < pts.length - 1; i += 2) {
    const a = pts[i - 1], t = pts[i], b = pts[i + 1];
    const m = [a[0] + (b[0] - a[0]) * .4, a[1] + (b[1] - a[1]) * .4];
    const inn = [m[0] + (cx - m[0]) * .18, m[1] + (cy - m[1]) * .18];
    dk += `M ${a[0]},${a[1]} L ${t[0]},${t[1]} L ${inn[0].toFixed(1)},${inn[1].toFixed(1)} Z `;
    const p1 = [b[0] + (t[0] - b[0]) * .2, b[1] + (t[1] - b[1]) * .2], p2 = [b[0] + (t[0] - b[0]) * .62, b[1] + (t[1] - b[1]) * .62];
    const q = [m[0] + (b[0] - m[0]) * .7 + (t[0] - m[0]) * .3, m[1] + (b[1] - m[1]) * .7 + (t[1] - m[1]) * .3];
    lt += `M ${p1[0].toFixed(1)},${p1[1].toFixed(1)} L ${p2[0].toFixed(1)},${p2[1].toFixed(1)} L ${q[0].toFixed(1)},${q[1].toFixed(1)} Z `;
  }
  return { dk, lt };
}
export const DEFS = `
<linearGradient id="irisG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#26100A"/><stop offset=".42" stop-color="#6E3514"/>
  <stop offset=".78" stop-color="#C27C38"/><stop offset="1" stop-color="#F2C27A"/>
</linearGradient>
<linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#53331F"/><stop offset=".5" stop-color="${C.HAIR}"/><stop offset="1" stop-color="#2A180E"/>
</linearGradient>
<linearGradient id="bootG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2E2E3A"/><stop offset="1" stop-color="${C.BOOT}"/>
</linearGradient>
<linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.GOLD_HL}"/><stop offset=".5" stop-color="${C.GOLD}"/><stop offset="1" stop-color="${C.GOLD_SH}"/>
</linearGradient>`;

/** Widen a limb path horizontally around its centre line x = cx. */
export const widen = (d, cx, k) => xf(d, (x, y) => [cx + (x - cx) * k, y]);
