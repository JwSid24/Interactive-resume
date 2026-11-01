// Jwandini head in four views + expressions. Local space: HU = 100, x = 0 centre line, y = 0 top of skull, chin ≈ 101.
import { C, W, P, F, L, E, xf, mirror, spikes, uid, lock, spikeShade } from './kit.mjs';

/* ---------- anime eye (authored once, mirrored / foreshortened per view) ---------- */
export function eye(cx, cy, side, sx = 1, sy = 1, o = {}) {
  const t = o.top ?? 0, b = o.bot ?? 0, look = o.look ?? 0.5;
  const m = (d) => xf(d, (x, y) => [cx + side * x * sx, cy + y * sy]);
  const white = `M -14,2 C -11,${-7 + t} 2,${-10 + t} 15,${-5 + t} C 16,0 13,${7 - b} 7,${9 - b} C 0,${11 - b} -8,${9 - b * .6} -14,2 Z`;
  const id = uid('eye');
  const ix = cx + side * look * sx, iy = cy + 1.5 * sy;
  let s = `<path d="${m(white)}" fill="${C.EYE_WHITE}"/>`;
  s += `<clipPath id="${id}"><path d="${m(white)}"/></clipPath><g clip-path="url(#${id})">`;
  s += E(ix, iy, 7.6 * sx, 9.8 * sy, 'url(#irisG)', ` stroke="${C.INK}" stroke-width="0.9"`);
  s += E(ix, iy + .4 * sy, 5.4 * sx, 7.2 * sy, 'none', ` stroke="#E7A458" stroke-width="0.55" opacity="0.55"`);
  s += E(ix + side * .4 * sx, iy + 1.2 * sy, 3.2 * sx, 4.7 * sy, '#160704');
  s += `<path d="${m(`M -16,4 C -12,${-9 + t} 3,${-12 + t} 17,${-6 + t} L 17,${1 + t} C 3,${-4 + t} -10,${-2 + t} -16,${7 + t} Z`)}" fill="#3A1E2A" opacity="0.4"/>`;
  s += `<path d="${m(`M -14,${8 - b} C -6,${12 - b} 6,${12 - b} 14,${4 - b} L 14,${12} L -14,12 Z`)}" fill="${C.EYE_SH}" opacity="0.5"/>`;
  s += `</g>`;
  s += E(ix - side * 2.7 * sx, iy - 4.3 * sy, 2.8 * sx, 2.2 * sy, '#fff');
  s += E(ix + side * 3.1 * sx, iy + 4.4 * sy, 1.15 * sx, 1.15 * sy, '#fff');
  // tapered upper lash: thick toward the outer corner, sharp flick
  s += F(m(`M -15.5,3 C -12,${-8.5 + t} 3,${-12.8 + t} 16,${-6.8 + t} L 20,${-2.2 + t} L 15,${-2.8 + t} C 3,${-8 + t} -10,${-5 + t} -14,4.5 Z`), C.INK);
  s += L(m(`M 4,${9.8 - b} C 10,${8.8 - b} 13.5,${6 - b} 15,${2 - b * .5}`), 1.1);
  s += L(m(`M -7,${-9.5 + t} C 0,${-13.5 + t} 9,${-12.5 + t} 14,${-9.5 + t}`), .85, C.INK, .5);
  return s;
}
/* profile eye (side view, looking right) */
function eyeProfile(cx, cy, o = {}) {
  const t = o.top ?? 0;
  const m = (d) => xf(d, (x, y) => [cx + x, cy + y]);
  const white = `M -5,-1 C -1,${-8 + t} 6,${-9 + t} 9,${-5 + t} C 10,0 8,5 5,7 C 1,7 -3,4 -5,-1 Z`;
  const id = uid('eyp');
  let s = `<path d="${m(white)}" fill="${C.EYE_WHITE}"/><clipPath id="${id}"><path d="${m(white)}"/></clipPath><g clip-path="url(#${id})">`;
  s += E(cx + 5, cy + 1, 3.6, 8.8, 'url(#irisG)', ` stroke="${C.INK}" stroke-width="0.8"`);
  s += E(cx + 5.6, cy + 2, 1.6, 4.3, '#160704');
  s += `<path d="${m(`M -6,0 C -2,${-10 + t} 7,${-11 + t} 11,${-6 + t} L 11,${-1 + t} C 6,${-6 + t} -1,${-5 + t} -6,3 Z`)}" fill="#3A1E2A" opacity="0.4"/></g>`;
  s += E(cx + 3.6, cy - 3, 1.5, 1.9, '#fff');
  s += F(m(`M -6,0 C -2,${-10 + t} 7,${-11.5 + t} 10.5,${-6.5 + t} L 14,${-4.5 + t} L 9.5,${-4 + t} C 6,${-8 + t} -1,${-7 + t} -5,1.5 Z`), C.INK);
  s += L(m('M 5,7.4 C 7,6.8 8.5,5.5 9.5,3.5'), 1);
  return s;
}
/* brow: thick at the inner end, angle > 0 pulls the inner end down (focus / anger) */
function brow(cx, cy, side, sx = 1, a = 0) {
  const d = `M -16,${4 + a} C -8,${-1 + a * .5} 4,-4 16,-3 C 10,0 0,${3 + a * .5} -15,${9 + a} Z`;
  return P(xf(d, (x, y) => [cx + side * x * sx, cy + y]), C.HAIR_SH, .9);
}

/* ---------- expressions ---------- */
export const EXPR = {
  calm:  { brow: 0, top: 0, bot: 0, mouth: 'calm' },
  focus: { brow: 4.5, top: 2.6, bot: .8, mouth: 'firm' },
  shout: { brow: 7.5, top: -1.2, bot: 0, mouth: 'shout' },
  smile: { brow: .5, top: .6, bot: 3.2, mouth: 'smile' },
};
function mouthQ(kind) {
  if (kind === 'firm') return L('M 14,87.5 Q 21,86.5 29,86', 1.9);
  if (kind === 'smile') return P('M 11,83.5 Q 21,93 31.5,82.5 Q 22,87.5 11,83.5 Z', '#FFFFFF', 1.3) + L('M 10,83 Q 22,88 32.5,81.5', 1.7) + L('M 18,94 Q 22,95 26,93.5', .9, C.SKIN_SH2, .8);
  if (kind === 'shout') return P('M 9,82 Q 21,79 33,81 Q 31,99 20,100 Q 10,98 9,82 Z', '#5C1524', 1.6)
    + F('M 10.5,83 Q 21,80.5 31.5,82 L 31,86.5 Q 21,84.5 11.5,87.5 Z', '#FFFFFF') + E(21, 95.5, 6.5, 3, '#D45E6E');
  return L('M 13,86 Q 21,88.6 30,85', 1.6) + L('M 18,91.5 Q 22,92.5 25,91.5', .9, C.SKIN_SH2, .7);
}




/* ---------- hair: flow middle part ----------
   Volume lifts at the roots on both sides of a clean centre part, each side swoops out over the temple in a curtain
   wing, then flows back over the ears and ends in separated pieces that flick outward at the ears and nape. */
const hairFill = 'url(#hairG)';
const strands = (d, op = .5) => L(d, 1, C.HAIR_SH2, op);
function section(d, inner = '', w = W.OUT) {
  const id = uid('hs');
  return F(d, hairFill) + `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>` + P(d, 'none', w);
}
function looseStrand(r1, tip, r2, curl) {
  const d = lock(r1, tip, r2, curl);
  return F(d, hairFill) + L(d.replace(/ Z$/, ''), 1.2);
}
/** Close a right-half outline (top centre -> bottom centre, M + cubic segments) with its mirrored, reversed copy. */
function symmetric(right) {
  const nums = right.match(/-?\d*\.?\d+/g).map(Number), pts = [];
  for (let i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  let d = right;
  for (let i = pts.length - 1; i >= 3; i -= 3) {
    const [c1, c2, , ] = [pts[i - 2], pts[i - 1]], p0 = pts[i - 3];
    d += ` C ${-c2[0]},${c2[1]} ${-c1[0]},${c1[1]} ${-p0[0]},${p0[1]}`;
  }
  return d + ' Z';
}
const partLine = (x0, y0, x1, y1) =>
  L(`M ${x0},${y0} L ${x1},${y1}`, 1.6, '#E9B48E') + L(`M ${x0 - 1.4},${y0} L ${x1 - 1.6},${y1} M ${x0 + 1.4},${y0} L ${x1 + 1.6},${y1}`, .9, C.INK, .8);

/* ============ FRONT ============ */
const F_FACE = 'M -40,28 C -41,47 -40,62 -36,73 C -31,85 -21,94 -11,99 Q 0,104 11,99 C 21,94 31,85 36,73 C 40,62 41,47 40,28 C 38,-6 -38,-6 -40,28 Z';
const F_EAR = 'M -39,44 C -48,40 -51,53 -48,63 C -46,71 -42,74 -38,70 Z';
const F_UNDER = symmetric('M 0,-10 C 24,-12 46,0 52,20 C 56,40 56,62 60,80 C 54,82 50,80 47,76 C 46,82 44,88 40,92 C 38,84 36,78 33,74 L 0,74');
const F_SEC = 'M 1.6,-13 C 5,-20 10,-23 16,-23 C 30,-23 44,-14 50,0 C 55,12 56,26 55,40 C 55,48 57,54 61,59 C 57,59 55,58 54,57 C 55,64 58,70 63,75 C 57,75 52,71 50,67 C 50,72 51,77 53,82 C 48,80 45,74 44,68 C 43,58 42,50 40,44 C 36,36 28,28 18,23 C 10,19 5,16 1.8,13 Z';
const F_SEC_IN =
  F('M 1.8,13 C 5,16 10,19 18,23 C 28,28 36,36 40,44 C 42,50 43,58 44,68 C 45,74 48,80 53,82 C 50,74 49,62 48,52 C 47,40 42,30 32,22 C 22,15 10,10 1.8,8 Z', C.HAIR_SH) +
  F('M 50,67 C 52,71 57,75 63,75 C 58,70 56,64 55,58 Z M 54,57 C 55,58 57,59 61,59 C 58,55 56,50 56,44 Z', C.HAIR_SH2, ' opacity="0.6"') +
  F('M 5,-18 C 14,-23 30,-21 41,-10 L 38,-7 C 29,-16 16,-18 6,-15 Z', C.HAIR_HL) +
  F('M 32,-14 C 40,-9 46,-2 49,6 L 46,7 C 43,0 38,-6 31,-11 Z', C.HAIR_HL, ' opacity="0.8"') +
  F('M 11,-19 C 16,-21 22,-21 27,-19 L 26,-17 C 21,-18 16,-18 12,-17 Z', C.HAIR_SPEC) +
  strands('M 3,-9 C 14,-17 34,-13 44,2 C 50,14 51,28 52,44 M 4,1 C 16,-3 32,1 40,13 C 46,23 47,40 50,62 M 6,10 C 18,10 30,16 36,28 M 20,3 C 30,13 36,26 38,40 M 46,48 C 50,58 54,64 60,72');

export function headFront(ex = EXPR.calm) {
  let s = '';
  s += P(F_UNDER, C.HAIR_SH, W.OUT);
  s += P(F_EAR, C.SKIN, W.IN) + P(mirror(F_EAR), C.SKIN, W.IN);
  s += L('M -41,50 C -46,50 -46,60 -42,64', 1) + L(mirror('M -41,50 C -46,50 -46,60 -42,64'), 1) + F('M -40,47 C -45,48 -46,58 -42,66 L -40,66 Z', C.SKIN_SH);
  s += P(F_FACE, C.SKIN, W.OUT);
  s += F('M -40,30 C -41,48 -40,62 -36,73 C -31,85 -21,94 -11,99 C -18,92 -25,84 -29,74 C -33,62 -34,46 -31,32 Z', C.SKIN_SH);
  const fsh = 'M 0,11 L 0,18 C 8,21 20,27 30,35 C 36,40 39,46 41,52 L 43,46 C 40,38 34,31 26,26 C 18,20 9,15 0,11 Z';
  s += F(fsh, C.SKIN_SH) + F(mirror(fsh), C.SKIN_SH);
  s += E(-25, 73, 7, 2.6, '#EE8676', ' opacity="0.26"') + E(25, 73, 7, 2.6, '#EE8676', ' opacity="0.2"');
  s += eye(-18, 58, -1, 1, 1, ex) + eye(18, 58, 1, 1, 1, ex);
  s += F('M -1,64 L -3.6,74 L 0,76.4 Z', C.SKIN_SH) + L('M 2,65 L 4.6,75 L 0,76.6', 1.2);
  s += xf(mouthQ(ex.mouth), (x, y) => [x - 21, y]);
  s += moustacheFront();
  s += section(F_SEC, F_SEC_IN) + section(mirror(F_SEC), mirror(F_SEC_IN));
  s += partLine(0, -12, 0, 12);
  s += looseStrand([-2, 11], [-12, 35], [-6, 12], .16);
  s += brow(-19, 41, -1, 1, ex.brow) + brow(19, 41, 1, 1, ex.brow);
  return s;
}
const M_HALF = 'M 1.3,79 C 4.6,77.6 8.8,77.9 11.6,79.7 C 13,80.7 13.6,82.1 13.2,83 C 10.6,82.1 6.4,81.9 1.5,82.6 Z';
function moustacheFront() {
  const hl = 'M 3,79.3 C 6,78.7 9.4,79.2 11.4,80.4';
  return P(M_HALF, C.HAIR_SH, .8) + P(mirror(M_HALF), C.HAIR_SH, .8) + L(hl, .7, C.HAIR_HL, .85) + L(mirror(hl), .7, C.HAIR_HL, .85);
}

/* ============ THREE-QUARTER (turned toward viewer's right; the part sits right of the skull centre) ============ */
const Q_FACE = 'M -40,26 C -42,46 -40,62 -32,79 C -22,94 -4,101 12,101 C 20,101 26,96 30,90 C 35,82 39,74 40,65 C 40,60 37,55 37,52 C 39,48 41,44 40,38 C 40,20 32,-6 0,-7 C -26,-8 -39,6 -40,26 Z';
const Q_EAR = 'M -33,45 C -43,40 -47,54 -44,64 C -42,72 -37,75 -32,71 Z';
const Q_UNDER = 'M 10,-10 C -16,-12 -44,-2 -52,18 C -57,38 -57,62 -61,82 C -55,84 -50,81 -47,77 C -46,84 -43,90 -38,93 C -36,86 -33,80 -29,76 L 30,60 L 44,20 C 42,4 28,-9 10,-10 Z';
const Q_NEAR = 'M 10.6,-13 C 6,-20 0,-23 -6,-23 C -24,-23 -42,-14 -50,0 C -56,12 -57,26 -56,40 C -56,48 -58,54 -62,59 C -58,59 -56,58 -55,57 C -56,64 -59,70 -64,75 C -58,75 -53,71 -51,67 C -51,73 -52,78 -54,83 C -49,81 -46,75 -45,69 C -44,60 -43,52 -41,46 C -36,39 -30,33 -22,28 C -12,22 2,17 10.8,13 Z';
const Q_NEAR_IN =
  F('M 10.8,13 C 2,17 -12,22 -22,28 C -30,33 -36,39 -41,46 C -43,52 -44,60 -45,69 C -46,75 -49,81 -54,83 C -50,74 -50,62 -50,52 C -49,40 -42,28 -30,20 C -18,12 0,8 10.8,8 Z', C.HAIR_SH) +
  F('M -51,67 C -53,71 -58,75 -64,75 C -59,70 -57,64 -56,58 Z M -55,57 C -56,58 -58,59 -62,59 C -59,55 -57,50 -57,44 Z', C.HAIR_SH2, ' opacity="0.6"') +
  F('M 6,-18 C -4,-23 -22,-21 -35,-11 L -32,-7 C -21,-16 -6,-18 5,-15 Z', C.HAIR_HL) +
  F('M -28,-14 C -38,-9 -45,-2 -48,6 L -45,7 C -42,0 -37,-6 -28,-11 Z', C.HAIR_HL, ' opacity="0.8"') +
  F('M 0,-19 C -6,-21 -12,-21 -17,-19 L -16,-17 C -11,-18 -6,-18 -1,-17 Z', C.HAIR_SPEC) +
  strands('M 8,-9 C -4,-17 -28,-13 -42,2 C -49,14 -50,28 -52,44 M 8,1 C -6,-3 -24,1 -36,13 C -44,23 -46,40 -50,62 M 8,10 C -4,10 -18,16 -28,28 M -6,4 C -18,14 -26,26 -30,38 M -46,48 C -50,58 -54,64 -60,72');
const Q_FAR = 'M 13,-13 C 16,-20 22,-22 27,-21 C 36,-19 43,-10 45,2 C 47,14 46,26 45,36 C 45,42 46,46 48.5,51 C 44,51 42,48 41,45 C 38,37 34,31 28,26 C 22,21 17,16 13.2,13 Z';
const Q_FAR_IN =
  F('M 13.2,13 C 17,16 22,21 28,26 C 34,31 38,37 41,45 C 42,48 44,51 48.5,51 C 45,44 44,36 43,28 C 41,18 34,10 24,8 C 19,7 15,8 13.2,8 Z', C.HAIR_SH) +
  F('M 16,-17 C 24,-20 34,-16 40,-6 L 37,-4 C 32,-12 24,-15 17,-14 Z', C.HAIR_HL) +
  strands('M 15,-9 C 26,-12 37,-2 41,12 M 15,2 C 24,4 32,12 37,24');

export function headQ(ex = EXPR.calm) {
  let s = '';
  s += P(Q_UNDER, C.HAIR_SH, W.OUT);
  s += P(Q_FACE, C.SKIN, W.OUT);
  s += F('M -40,26 C -42,46 -40,62 -32,79 C -22,94 -6,100 6,101 C -8,96 -18,88 -24,78 C -30,66 -32,48 -30,28 Z', C.SKIN_SH);
  s += F('M 11,11 L 11,18 C 0,21 -14,28 -27,40 L -32,40 C -20,27 -6,18 11,11 Z M 13,11 L 13,18 C 20,21 28,27 33,34 C 37,40 39,46 41,53 L 44,49 C 41,40 37,32 31,26 C 25,19 19,14 13,11 Z', C.SKIN_SH);
  s += E(-12, 74, 7, 2.6, '#EE8676', ' opacity="0.24"') + E(31, 73, 4, 2.2, '#EE8676', ' opacity="0.2"');
  s += eye(-5, 58, -1, 1, 1, ex) + eye(29.5, 58, 1, .6, 1, { ...ex, look: .9 });
  s += F('M 34,62 L 39,73 L 35,75.5 Z', C.SKIN_SH) + P('M 36.5,60 L 43.5,74 L 37,76.5', C.SKIN, 1.2);
  s += mouthQ(ex.mouth);
  s += moustacheQ();
  s += P(Q_EAR, C.SKIN, W.IN) + L('M -35,51 C -40,51 -41,61 -37,65', 1) + F('M -34,48 C -39,50 -40,60 -36,67 L -34,67 Z', C.SKIN_SH);
  s += section(Q_FAR, Q_FAR_IN) + section(Q_NEAR, Q_NEAR_IN);
  s += partLine(11.9, -12, 12, 12);
  s += looseStrand([10, 11], [0, 36], [13, 12], .14);
  s += brow(-6, 41, -1, 1, ex.brow) + brow(29.5, 41, 1, .6, ex.brow);
  return s;
}
function moustacheQ() {
  const near = 'M 22.8,79 C 18.6,77.8 13.6,78.4 10,80.4 C 8.4,81.4 7.8,82.8 8.4,83.5 C 11.4,82.3 16.8,81.8 22.6,82.4 Z';
  const far = 'M 24.6,78.9 C 27.6,78.2 30.6,78.8 32.6,80.4 C 33.7,81.4 34,82.6 33.6,83.1 C 31.6,82.2 28.4,81.8 24.8,82.2 Z';
  return P(near, C.HAIR_SH, .8) + P(far, C.HAIR_SH, .8) + L('M 21,79.4 C 17,79 13.4,79.8 10.8,81.2', .7, C.HAIR_HL, .85);
}

/* ============ SIDE (profile facing right) ============ */
const S_FACE = 'M -36,20 C -40,46 -30,72 -16,84 C -4,94 14,100 28,99 C 34,98 38,95 38,92 C 38,89 35,88 35,87 C 38,86 39,84 37,83 C 39,82 40,80 39,78 L 41,77 C 46,76 48,74 46,71 C 42,66 40,60 39,56 C 38,52 38,49 39,46 C 42,42 41,34 38,24 C 30,-6 -30,-6 -36,20 Z';
const S_HAIR = 'M 30,-10 C 24,-20 14,-24 4,-24 C -16,-24 -36,-16 -46,-2 C -53,10 -55,28 -53,44 C -52,52 -54,58 -58,63 C -54,63 -52,62 -51,61 C -52,68 -55,74 -60,79 C -54,79 -49,75 -47,71 C -47,78 -46,84 -42,89 C -38,86 -36,80 -35,74 C -30,77 -24,77 -19,74 C -16,64 -15,54 -12,46 C -8,40 -2,36 6,34 C 12,33 18,34 22,38 C 24,40 25,43 26,47 C 30,38 33,28 34,18 C 35,10 35,2 34,-2 C 33,-5 32,-8 30,-10 Z';
const S_HAIR_IN =
  F('M 26,47 C 25,43 24,40 22,38 C 18,34 12,33 6,34 C -2,36 -8,40 -12,46 C -15,54 -16,64 -19,74 C -24,77 -30,77 -35,74 C -32,62 -30,52 -24,44 C -16,34 -4,29 8,28 C 18,28 26,30 30,36 C 29,40 27,44 26,47 Z', C.HAIR_SH, ' opacity="0.7"') +
  F('M -47,71 C -49,75 -54,79 -60,79 C -56,74 -54,68 -53,62 Z M -35,74 C -36,80 -38,86 -42,89 C -42,82 -41,76 -40,70 Z', C.HAIR_SH2, ' opacity="0.6"') +
  F('M 24,-19 C 10,-23 -14,-21 -32,-10 L -29,-6 C -12,-16 8,-19 23,-16 Z', C.HAIR_HL) +
  F('M 6,-20 C 0,-21 -6,-20 -12,-18 L -11,-16 C -6,-18 0,-18 5,-18 Z', C.HAIR_SPEC) +
  strands('M 24,-18 C 2,-19 -28,-10 -42,6 C -50,20 -50,38 -54,58 M 32,-4 C 10,-8 -18,0 -32,14 C -40,24 -42,42 -46,66 M 34,10 C 16,8 -4,14 -18,26 M 31,26 C 22,24 8,26 -4,34 M -30,40 C -32,54 -33,66 -38,84 M 33,6 C 30,22 28,34 26,44');

export function headSide(ex = EXPR.calm) {
  let s = '';
  s += P(S_FACE, C.SKIN, W.OUT);
  s += F('M -16,84 C -4,94 14,100 28,99 C 18,96 4,92 -6,84 Z', C.SKIN_SH);
  s += F('M 34,-2 C 36,4 37,8 38,12 C 36,22 32,32 27,44 L 24,40 C 28,30 32,18 33,6 Z M 4,36 C 12,34 18,35 22,39 L 22,44 C 16,40 10,39 2,40 Z', C.SKIN_SH);
  s += eyeProfile(28, 57, ex);
  s += F('M 39,57 L 44,71 L 40,72 Z', C.SKIN_SH, ' opacity="0.7"');
  s += ex.mouth === 'shout' ? P('M 30,83 L 39,80 L 38,90 L 31,89 Z', '#5C1524', 1.2) : L(ex.mouth === 'smile' ? 'M 29,85 Q 33,85 37,82.5' : 'M 30,85 L 36.5,84', 1.4);
  s += P('M 39.6,78.2 C 37,77.4 33.6,77.8 31,79.4 C 29.8,80.3 29.3,81.4 29.8,82 C 32.4,80.9 36,80.6 39.4,80.8 Z', C.HAIR_SH, .8);
  s += P('M -4,44 C -16,38 -22,52 -18,64 C -16,72 -10,76 -4,72 C -6,62 -6,52 -4,44 Z', C.SKIN, W.IN);
  s += L('M -8,50 C -15,50 -16,60 -11,66 M -10,56 C -12,58 -11,62 -9,63', 1);
  s += section(S_HAIR, S_HAIR_IN);
  s += P('M 18,42.5 C 24,38.5 32,37.5 38.5,38.5 C 32,40.5 25,42.5 19,45.5 Z', C.HAIR_SH, .9);
  return s;
}

/* ============ BACK ============ */
const B_HAIR = symmetric('M 0,-14 C 4,-21 10,-23 16,-23 C 32,-23 46,-14 52,0 C 58,14 58,32 57,48 C 57,56 59,62 63,68 C 59,68 57,67 56,66 C 56,74 59,80 64,86 C 57,86 52,82 50,78 C 49,85 46,91 40,95 C 36,92 32,88 30,86 C 27,91 22,95 15,97 C 12,94 9,92 6,91 C 4,94 2,96 0,97');
const B_HALF_IN =
  F('M 0,78 C 14,79 28,81 38,83 C 44,85 48,84 50,78 C 52,82 57,86 64,86 C 60,80 58,74 57,66 C 48,72 28,73 0,72 Z', C.HAIR_SH, ' opacity="0.85"') +
  F('M 30,86 C 32,88 36,92 40,95 C 40,88 40,82 38,76 Z M 6,91 C 9,92 12,94 15,97 C 16,90 16,84 14,78 Z', C.HAIR_SH2, ' opacity="0.6"') +
  F('M 4,-18 C 14,-23 32,-21 44,-9 L 41,-5 C 30,-16 16,-18 5,-14 Z', C.HAIR_HL) +
  F('M 11,-19 C 16,-21 22,-21 27,-19 L 26,-17 C 21,-18 16,-18 12,-17 Z', C.HAIR_SPEC) +
  strands('M 2,-10 C 16,-16 36,-10 46,6 C 52,20 53,40 56,60 M 2,-1 C 14,-4 30,4 38,18 C 44,30 46,50 52,78 M 2,10 C 12,14 22,28 26,46 C 28,58 30,72 34,90 M 2,22 C 6,40 10,62 12,92');

export function headBack() {
  let s = '';
  const ear = 'M 40,44 C 50,42 52,56 49,64 C 47,72 43,74 40,70 Z';
  s += P(ear, C.SKIN, W.IN) + P(mirror(ear), C.SKIN, W.IN);
  s += section(B_HAIR, B_HALF_IN + mirror(B_HALF_IN));
  s += partLine(0, -13, 0, 8) + L('M -1.6,8 Q 0,13 1.6,8', .9, C.INK, .6);
  return s;
}
