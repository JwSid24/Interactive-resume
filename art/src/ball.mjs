// Anime football as SVG: a real truncated icosahedron rotated in 3D, so every frame shows a consistent ball.
import { C } from './kit.mjs';

const V = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  const v = [[0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p], [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0], [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]]
    .map((a) => { const l = Math.hypot(...a); return a.map((x) => x / l); });
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
  const nb = v.map((a, i) => v.map((b, j) => (j !== i && dot(a, b) > .3 ? j : -1)).filter((j) => j >= 0));
  nb.forEach((list, i) => {
    const a = v[i], ref = Math.abs(a[0]) < .9 ? [1, 0, 0] : [0, 1, 0];
    let e1 = nrm([a[1] * ref[2] - a[2] * ref[1], a[2] * ref[0] - a[0] * ref[2], a[0] * ref[1] - a[1] * ref[0]]);
    const e2 = [a[1] * e1[2] - a[2] * e1[1], a[2] * e1[0] - a[0] * e1[2], a[0] * e1[1] - a[1] * e1[0]];
    list.sort((p1, p2) => Math.atan2(dot(v[p1], e2), dot(v[p1], e1)) - Math.atan2(dot(v[p2], e2), dot(v[p2], e1)));
  });
  const pent = v.map((a, i) => nb[i].map((j) => nrm(a.map((x, k) => x * 2 / 3 + v[j][k] / 3))));
  const seams = [];
  v.forEach((a, i) => nb[i].forEach((j) => { if (j > i) seams.push([nrm(a.map((x, k) => x * 2 / 3 + v[j][k] / 3)), nrm(a.map((x, k) => x / 3 + v[j][k] * 2 / 3))]); }));
  return { pent, seams };
})();
function rot(ax, ang) {
  const l = Math.hypot(...ax), [x, y, z] = ax.map((a) => a / l), c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
}
const rv = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];

export const BALL_DEFS = `
<radialGradient id="ballShade" cx=".36" cy=".3" r=".75">
  <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#5B6FB0" stop-opacity=".12"/>
  <stop offset=".85" stop-color="#2C3C86" stop-opacity=".38"/><stop offset="1" stop-color="#141C55" stop-opacity=".62"/>
</radialGradient>
<radialGradient id="ballBounce" cx=".42" cy="1" r=".6">
  <stop offset="0" stop-color="#7CE08A" stop-opacity=".38"/><stop offset="1" stop-color="#7CE08A" stop-opacity="0"/>
</radialGradient>`;

let n = 0;
/** Ball at (cx, cy) radius r. rot = spin angle, axis = 3D spin axis. light: 'tr' (sun upper right) or 'tl'. */
export function ball(cx, cy, r, spin = 0.6, o = {}) {
  const M = rot(o.axis || [.3, .8, .45], spin), id = `bc${++n}`;
  const f = (p) => `${(cx + p[0] * r).toFixed(1)},${(cy + p[1] * r).toFixed(1)}`;
  let s = `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#F7F8FD"/>`;
  s += `<g clip-path="url(#${id})">`;
  V.pent.forEach((P) => {
    const ps = P.map((q) => rv(M, q)), cz = ps.reduce((a, q) => a + q[2], 0) / 5;
    if (cz < -.3) return;
    s += `<path d="M ${ps.map(f).join(' L ')} Z" fill="#191C33" opacity="${Math.min(1, Math.max(.35, .6 + cz)).toFixed(2)}"/>`;
  });
  V.seams.forEach(([a, b]) => {
    const A = rv(M, a), B = rv(M, b);
    if (A[2] < -.1 && B[2] < -.1) return;
    s += `<path d="M ${f(A)} L ${f(B)}" stroke="#2A2F55" stroke-width="${Math.max(.8, r * .04).toFixed(2)}" opacity=".7"/>`;
  });
  const flip = o.light === 'tl' ? -1 : 1;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ballShade)" transform="${flip < 0 ? `translate(${2 * cx} 0) scale(-1 1)` : ''}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ballBounce)"/>`;
  s += `</g>`;
  const hx = cx + flip * r * .34, hy = cy - r * .42;
  s += `<ellipse cx="${hx}" cy="${hy}" rx="${r * .22}" ry="${r * .13}" transform="rotate(${flip * 35} ${hx} ${hy})" fill="#fff" opacity=".95"/>`;
  s += `<path d="M ${cx + flip * r * .86 * Math.cos(-1.0)},${cy + r * .86 * Math.sin(-1.0)} A ${r * .86} ${r * .86} 0 0 ${flip > 0 ? 1 : 0} ${cx + flip * r * .86 * Math.cos(.15)},${cy + r * .86 * Math.sin(.15)}" fill="none" stroke="#fff" stroke-width="${r * .05}" stroke-linecap="round" opacity=".75"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.INK}" stroke-width="${Math.max(1.6, r * .055).toFixed(2)}"/>`;
  return s;
}
/** Motion-blurred ball: ghost trail along (vx, vy). */
export function ballMotion(cx, cy, r, vx, vy, spin = .6, o = {}) {
  let s = '';
  const steps = 5;
  for (let i = steps; i >= 1; i--) {
    const k = i / steps;
    s += `<g opacity="${(.18 * (1 - k * .5)).toFixed(2)}">${ball(cx - vx * k, cy - vy * k, r * (1 - k * .04), spin - k * .5, o)}</g>`;
  }
  return s + ball(cx, cy, r, spin, o);
}

/* ---------- animation layers: a spinning pattern under a fixed light/shade overlay ---------- */
export function ballPattern(r, spin = .6, axis = [.3, .8, .45]) {
  const full = ball(0, 0, r, spin, { axis });
  // keep only the white disc + panels/seams (drop the shading, highlight and outline drawn after </g>)
  const cut = full.indexOf('<circle cx="0" cy="0" r="' + r + '" fill="url(#ballShade)"');
  return full.slice(0, cut) + '</g>';
}
export function ballShade(r, light = 'tr') {
  const full = ball(0, 0, r, 0, { light });
  const a = full.indexOf('<circle cx="0" cy="0" r="' + r + '" fill="url(#ballShade)"');
  const clipStart = full.indexOf('<clipPath'), clipEnd = full.indexOf('</clipPath>') + 11;
  const clipId = full.slice(clipStart).match(/id="([^"]+)"/)[1];
  return full.slice(clipStart, clipEnd) + `<g clip-path="url(#${clipId})">` + full.slice(a);
}
