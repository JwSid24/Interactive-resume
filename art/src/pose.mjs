// Key-pose drawing kit. Each key pose is posed by hand (joint angles per drawing) and assembled from the approved
// model-sheet parts: side torso + kit, head (side / three-quarter), side boot, palette, line weights.
// Space: model head units (HU), origin at the hip joint, y down, character facing right.
import { C, W, P, F, L, SH, uid } from './kit.mjs';
import { headSide, headQ, EXPR } from './head.mjs';
import { sideBoot, sideTorso, sideNeck } from './body.mjs';
import { ball } from './ball.mjs';

const R2D = 180 / Math.PI, D2R = Math.PI / 180;
const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f1 = (n) => +n.toFixed(2);
export const LEN = { thigh: 120, shin: 128, sole: 48, upper: 112, fore: 84, ball: 40 };

/** Tapered, muscled limb outline from joint a to joint b. back/front = bulge (HU) on each side, biased to the upper half. */
function limbPath(a, b, wa, wb, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const pt = (t, off) => [a[0] + dx * t + nx * off, a[1] + dy * t + ny * off];
  const w = (t) => (wa + (wb - wa) * t) / 2;
  const bk = o.back || 0, fr = o.front || 0;
  const A1 = pt(0, wa / 2), B1 = pt(1, wb / 2), A2 = pt(0, -wa / 2), B2 = pt(1, -wb / 2);
  const c1 = pt(.3, w(.3) + bk * 1.25), c2 = pt(.68, w(.68) + bk * .4), c3 = pt(.68, -(w(.68) + fr * .4)), c4 = pt(.3, -(w(.3) + fr * 1.25));
  const capB = [b[0] + ux * wb * .62, b[1] + uy * wb * .62], capA = [a[0] - ux * wa * .62, a[1] - uy * wa * .62];
  const p = (q) => `${f1(q[0])},${f1(q[1])}`;
  const d = `M ${p(A1)} C ${p(c1)} ${p(c2)} ${p(B1)} Q ${p(capB)} ${p(B2)} C ${p(c3)} ${p(c4)} ${p(A2)} Q ${p(capA)} ${p(A1)} Z`;
  // shade band on the back / underside, rim light on the front
  const sh = `M ${p(A1)} C ${p(c1)} ${p(c2)} ${p(B1)} L ${p(pt(1, wb * .12))} C ${p(pt(.68, w(.68) * .3))} ${p(pt(.3, w(.3) * .3 + bk * .6))} ${p(pt(0, wa * .12))} Z`;
  const rim = `M ${p(pt(.08, -(w(.08) - 1.5)))} C ${p(pt(.3, -(w(.3) + fr * 1.1 - 1.5)))} ${p(pt(.68, -(w(.68) + fr * .3 - 1.5)))} ${p(pt(.92, -(w(.92) - 1.5)))}`;
  return { d, sh, rim };
}
function drawLimb(lp, fill, shade, o = {}) {
  const id = uid('lb');
  let s = '';
  if (o.pass !== 1) s += `<path d="${lp.d}" fill="none" stroke="${C.INK}" stroke-width="${W.OUT * 2}" stroke-linejoin="round"/>`;
  if (o.pass === 0) return s;
  s += `<path d="${lp.d}" fill="${fill}"/><clipPath id="${id}"><path d="${lp.d}"/></clipPath><g clip-path="url(#${id})"><path d="${lp.sh}" fill="${shade}"/>`;
  if (o.rim !== false) s += `<path d="${lp.rim}" fill="none" stroke="#FFF2E2" stroke-width="2.4" opacity="${o.rimOp ?? .55}" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}

/* ---------- limbs ---------- */
function leg(H, g, far) {
  const K = add(H, dir(g.th), LEN.thigh), sa = g.th - g.kn, A = add(K, dir(sa), LEN.shin);
  const thigh = limbPath(H, K, 70, 46, { front: 8, back: 3 }), shin = limbPath(K, A, 46, 27, { back: 11, front: 2 });
  let s = drawLimb(thigh, C.SKIN, C.SKIN_SH, { pass: 0 }) + drawLimb(shin, C.SKIN, C.SKIN_SH, { pass: 0 });
  s += drawLimb(thigh, C.SKIN, C.SKIN_SH, { pass: 1 }) + drawLimb(shin, C.SKIN, C.SKIN_SH, { pass: 1 });
  const kd = dir(g.th), kn = [-kd[1], kd[0]];
  s += L(`M ${f1(K[0] - kn[0] * 12)},${f1(K[1] - kn[1] * 12 - 4)} q ${f1(-kn[0] * 6 + kd[0] * 8)},${f1(-kn[1] * 6 + kd[1] * 8)} ${f1(kd[0] * 16)},${f1(kd[1] * 16)}`, 1.4, C.SKIN_SH2, .8);
  const S0 = lerp(K, A, .14);
  const sock = limbPath(S0, A, 49, 30, { back: 10 }), sid = uid('sk');
  s += drawLimb(sock, C.SOCK, C.SOCK_SH, { rimOp: .35 });
  // garnet band + gold stripe across the sock top, clipped to the sock (no rounded "pads")
  const sd = dir(sa), sn = [-sd[1], sd[0]], across = (t, w, col) => {
    const c = lerp(K, A, t), a = [c[0] + sn[0] * 40, c[1] + sn[1] * 40], b = [c[0] - sn[0] * 40, c[1] - sn[1] * 40];
    return `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${col}" stroke-width="${w}"/>`;
  };
  s += `<clipPath id="${sid}"><path d="${sock.d}"/></clipPath><g clip-path="url(#${sid})">${across(.19, 14, C.GAR)}${across(.255, 3.2, C.GOLD)}</g><path d="${sock.d}" fill="none" stroke="${C.INK}" stroke-width="${W.IN}"/>`;
  const rot = -sa + (g.ft || 0);
  s += `<g transform="translate(${f1(A[0])} ${f1(A[1])}) rotate(${f1(rot)}) translate(4 -606)">${sideBoot()}</g>`;
  s += drawLimb(limbPath(H, lerp(H, K, .4), 76, 68, { front: 2 }), C.NAVY, C.NAVY_SH, { rimOp: .3 });
  return { s: far ? `<g style="filter:brightness(.82) saturate(.9)">${s}</g>` : s, K, A, rot };
}
function arm(S, g, far) {
  const E = add(S, dir(g.up), LEN.upper), fa = g.up + g.lo, Wr = add(E, dir(fa), LEN.fore);
  const up = limbPath(S, E, 44, 29, { front: 8, back: 4 }), lo = limbPath(E, Wr, 34, 21, { back: 7, front: 2 });
  let s = drawLimb(up, C.SKIN, C.SKIN_SH, { pass: 0 }) + drawLimb(lo, C.SKIN, C.SKIN_SH, { pass: 0 });
  s += drawLimb(up, C.SKIN, C.SKIN_SH, { pass: 1 }) + drawLimb(lo, C.SKIN, C.SKIN_SH, { pass: 1 });
  // fist
  const hd = dir(fa), hc = add(Wr, hd, 15);
  s += `<g transform="translate(${f1(hc[0])} ${f1(hc[1])}) rotate(${f1(-fa)})"><ellipse rx="15" ry="18" fill="${C.SKIN}" stroke="${C.INK}" stroke-width="${W.IN * 1.6}"/>`
    + `<path d="M -11,4 Q 0,10 11,4 M -6,-2 L -6,8 M 0,-1 L 0,10 M 6,-2 L 6,8" stroke="${C.SKIN_SH2}" stroke-width="1.4" fill="none" opacity=".8"/>`
    + `<path d="M 4,-14 C 14,-12 16,-2 10,4 C 8,-2 6,-8 4,-14 Z" fill="${C.SKIN}" stroke="${C.INK}" stroke-width="${W.IN * 1.4}"/></g>`;
  // sleeve over the shoulder
  const sl = limbPath(S, lerp(S, E, .5), 54, 48, { front: 2 });
  s += drawLimb(sl, C.GAR, C.GAR_SH, { rimOp: .3 });
  const cuffA = lerp(S, E, .47), cuffB = lerp(S, E, .5), cl = limbPath(cuffA, cuffB, 49, 48);
  s += `<path d="${cl.d}" fill="${C.BLU}"/>`;
  return far ? `<g style="filter:brightness(.82) saturate(.9)">${s}</g>` : s;
}

/* ---------- full figure ---------- */
/**
 * pose: { lean, tilt, head: 'side'|'q', ex, legs: { near:{th,kn,ft}, far:{...} }, arms: { near:{up,lo}, far:{...} } }
 * Returns { svg, joints } in HU around the hip; place it with figureAt().
 */
export function figure(pose) {
  const H = [0, 0], lean = pose.lean || 0;
  const rotP = (p) => { const c = Math.cos(lean * D2R), s = Math.sin(lean * D2R); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  const Sn = rotP([3, -200]), Sf = rotP([-5, -198]);
  const farLeg = leg(H, pose.legs.far, true), nearLeg = leg([4, 0], pose.legs.near, false);
  let s = arm(Sf, pose.arms.far, true) + farLeg.s;
  const head = (pose.head === 'q' ? headQ : headSide)(pose.ex || EXPR.calm);
  s += `<g transform="rotate(${lean}) translate(0 -352)">${sideTorso()}${sideNeck()}<g transform="rotate(${pose.tilt || 0} 0 108)">${head}</g></g>`;
  s += nearLeg.s + arm(Sn, pose.arms.near, false);
  return { svg: s, near: nearLeg, far: farLeg };
}
/** Ground contact: lowest sole point of a leg (ankle + rotated sole) in hip space. */
export function soleY(legInfo) {
  const r = legInfo.rot * D2R, pts = [[-21, 654 - 606], [50, 652 - 606]];
  return Math.max(...pts.map(([x, y]) => legInfo.A[1] + x * Math.sin(r) + y * Math.cos(r)));
}
export function solePoint(legInfo, x = 14) {
  const r = legInfo.rot * D2R, y = 654 - 606, xx = x + 4;
  return [legInfo.A[0] + xx * Math.cos(r) - y * Math.sin(r), legInfo.A[1] + xx * Math.sin(r) + y * Math.cos(r)];
}
export function instepPoint(legInfo) {
  const r = legInfo.rot * D2R, x = 20, y = 612 - 606;
  return [legInfo.A[0] + x * Math.cos(r) - y * Math.sin(r), legInfo.A[1] + x * Math.sin(r) + y * Math.cos(r)];
}
/** Joint positions only (no drawing), for fitting poses to the ground / the ball. */
export function legFK(H, g) {
  const K = add(H, dir(g.th), LEN.thigh), sa = g.th - g.kn, A = add(K, dir(sa), LEN.shin);
  return { K, A, rot: -sa + (g.ft || 0) };
}
export const at = (svg, x, y, s, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${svg}</g>`;

/* ---------- the opening's key poses ---------- */
export const POSES = {
  // entering: sprint, driving knee forward
  run1: { lean: 14, tilt: -4, head: 'side', ex: EXPR.focus,
    legs: { near: { th: 42, kn: 30, ft: -6 }, far: { th: -32, kn: 88, ft: 30 } },
    arms: { near: { up: -42, lo: 96 }, far: { up: 46, lo: 84 } } },
  // approach: eyes up to the falling ball
  run2: { lean: 9, tilt: -16, head: 'side', ex: EXPR.focus,
    legs: { near: { th: -26, kn: 80, ft: 40 }, far: { th: 38, kn: 18, ft: -4 } },
    arms: { near: { up: 40, lo: 86 }, far: { up: -38, lo: 92 } } },
  // first touch: cushion the ball on the instep, arms out for balance
  touch: { lean: -6, tilt: 22, head: 'side', ex: EXPR.focus,
    legs: { near: { th: 62, kn: 70, ft: -18 }, far: { th: -4, kn: 8, ft: 0 } },
    arms: { near: { up: 104, lo: 22 }, far: { up: -78, lo: -18 } } },
  // foot on the ball, confident
  step: { lean: -2, tilt: 2, head: 'q', ex: EXPR.smile,
    legs: { near: { th: 34, kn: 46, ft: 8 }, far: { th: -5, kn: 5, ft: 0 } },
    arms: { near: { up: -10, lo: 14 }, far: { up: 8, lo: 20 } } },
};
export const ballR = LEN.ball;
export { ball };
