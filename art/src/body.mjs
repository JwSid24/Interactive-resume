// Jwan Sidou full body, four views. Same HU space as head.mjs: skull top y = 0, soles y = 650 (6.5 heads).
import { C, W, P, F, L, SH, mirror, move, xf, uid, widen } from './kit.mjs';
import { headFront, headQ, headSide, headBack, EXPR } from './head.mjs';

const KIT_FONT = `'Bebas Neue','Impact','Arial Narrow',sans-serif`;
const fold = (d, op = .38) => L(d, 1.1, '#2E1838', op);
/* athletic build: shoulders/chest widen above the waist, tapering back to the original waist */
const kT = (y) => (y <= 200 ? 1.13 : y >= 290 ? 1 : 1.13 - .13 * (y - 200) / 90);
const tb = (d, cx = 0) => xf(d, (x, y) => [cx + (x - cx) * kT(y), y]);
const mus = (d) => L(d, 1, C.SKIN_SH2, .75);

/** Blaugrana stripes clipped to a garment path. bounds maps a front-view x to the view's x. */
function stripes(d, map = (x) => x, extra = '') {
  const id = uid('st');
  let s = '';
  for (let i = 0; i < 8; i++) {
    const a = map(-104 + i * 26), b = map(-78 + i * 26);
    s += `<rect x="${Math.min(a, b).toFixed(1)}" y="80" width="${(Math.abs(b - a) + 0.6).toFixed(1)}" height="260" fill="${i % 2 ? C.GAR : C.BLU}"/>`;
  }
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${s}${extra}</g>`;
}
const clipTo = (d, inner) => { const id = uid('cl'); return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };

/* ---------- shared front-view parts (left = viewer's left = character's right) ---------- */
const NECK = widen('M -16,86 C -16,100 -16,112 -18,122 Q 0,134 18,122 C 16,112 16,100 16,86 Z', 0, 1.25);
const THIGH = widen('M -62,372 C -64,410 -59,448 -52,481 L -20,481 C -16,450 -12,412 -8,374 Z', -35, 1.28);
const THIGH_OUT = widen('M -62,372 C -64,410 -59,448 -52,481 L -45,481 C -51,448 -55,410 -54,374 Z', -35, 1.28);
const THIGH_IN = widen('M -8,374 C -12,412 -16,450 -20,481 L -27,481 C -23,450 -19,412 -16,374 Z', -35, 1.28);
const SOCK = widen('M -52,478 C -58,505 -58,535 -51,563 C -48,582 -46,596 -45,610 L -27,610 C -26,592 -23,572 -21,548 C -19,522 -18,498 -20,478 Z', -36, 1.16);
const SOCK_OUT = widen('M -52,478 C -58,505 -58,535 -51,563 C -48,582 -46,596 -45,610 L -39,610 C -41,590 -45,570 -47,548 C -49,524 -49,500 -45,478 Z', -36, 1.16);
const SOCK_IN = widen('M -20,478 C -18,498 -19,522 -21,548 C -23,572 -26,592 -27,610 L -33,610 C -31,590 -28,570 -27,548 C -26,520 -26,498 -27,478 Z', -36, 1.16);
const ARM = move(widen('M -100,204 C -103,226 -106,246 -104,264 C -106,292 -108,322 -106,346 L -88,346 C -86,322 -84,294 -82,268 C -78,248 -74,228 -72,210 Z', -89, 1.45), -7, 0);
const ARM_OUT = move(widen('M -100,204 C -103,226 -106,246 -104,264 C -106,292 -108,322 -106,346 L -99,346 C -100,322 -98,292 -96,264 C -96,246 -94,226 -92,206 Z', -89, 1.45), -7, 0);
const ARM_IN = move(widen('M -72,210 C -74,228 -78,248 -82,268 C -84,294 -86,322 -88,346 L -94,346 C -92,322 -90,294 -89,268 C -85,248 -81,228 -79,208 Z', -89, 1.45), -7, 0);
const hs = (d) => xf(d, (x, y) => [-98 + (x + 98) * 1.2, 342 + (y - 342) * 1.12]);
const HAND = move(hs('M -108,342 C -115,358 -114,382 -105,397 Q -97,405 -90,395 C -86,381 -86,360 -87,344 Z'), -7, 0);
const HAND_SH = move(hs('M -108,344 C -114,360 -113,382 -106,395 L -101,396 C -106,382 -107,360 -103,344 Z'), -7, 0);
const THUMB = move(hs('M -89,350 C -83,357 -83,369 -88,375 C -90,366 -91,358 -89,350 Z'), -7, 0);
const FINGERS = move(hs('M -104,372 L -103,394 M -98,374 L -97,399 M -93,372 L -93,394'), -7, 0);
const ELBOW = move('M -101,262 Q -96,267 -91,262', -7, 0);
const ARM_MUS = 'M -80,218 C -76,232 -78,246 -84,258 M -112,278 C -108,292 -107,306 -109,324';
const LEG_MUS = 'M -60,396 C -56,420 -52,440 -50,458 M -20,436 C -13,449 -16,462 -27,468';
const SLEEVE_RAW = 'M -58,126 Q -80,130 -88,148 C -94,166 -98,186 -101,207 L -70,214 C -70,202 -70,194 -70,188 Z';
const SLEEVE = tb(SLEEVE_RAW);

function bootFront(side) {
  const m = side < 0 ? (d) => d : mirror;
  const body = 'M -49,603 C -50,597 -24,597 -24,603 C -18,615 -14,631 -16,641 C -18,651 -30,653 -38,653 C -52,653 -60,649 -60,641 C -60,627 -54,613 -49,603 Z';
  let s = P(m(body), 'url(#bootG)', W.OUT);
  s += F(m('M -52,614 Q -40,606 -27,613 Q -40,611 -51,619 Z'), C.BOOT_HL);
  s += F(m('M -42,604 L -31,604 L -29,624 L -40,626 Z'), 'url(#goldG)') + L(m('M -41,610 L -30,609 M -40,616 L -30,615 M -40,621 L -29,620'), .8, C.GOLD_SH);
  s += L(m('M -58,632 Q -46,622 -33,628 Q -24,632 -18,628'), 2.4, C.GOLD);
  s += P(m('M -61,643 C -58,653 -24,655 -16,643 L -16,649 C -24,659 -58,659 -61,649 Z'), '#2A2A33', W.IN);
  return s;
}
function hand(d, thumb) { return P(d, C.SKIN, W.IN) + (thumb ? P(thumb, C.SKIN, W.IN) : ''); }

/* ============ FRONT ============ */
export function bodyFront(ex = EXPR.calm) {
  let s = '';
  // legs
  s += P(THIGH, C.SKIN, W.OUT) + P(mirror(THIGH), C.SKIN, W.OUT);
  s += F(THIGH_OUT, C.SKIN_SH) + F(mirror(THIGH_IN), C.SKIN_SH);
  s += L('M -47,462 Q -37,469 -27,464 M -44,452 Q -40,446 -34,446', 1) + L(mirror('M -47,462 Q -37,469 -27,464 M -44,452 Q -40,446 -34,446'), 1) + mus(LEG_MUS) + mus(mirror(LEG_MUS));
  for (const side of [-1, 1]) {
    const m = side < 0 ? (d) => d : mirror;
    s += P(m(SOCK), C.SOCK, W.OUT) + SH(side < 0 ? SOCK_OUT : mirror(SOCK_IN));
    s += clipTo(m(SOCK), F(m('M -60,477 L -16,477 L -16,492 L -60,492 Z'), C.GAR) + F(m('M -60,492 L -16,492 L -16,495 L -60,495 Z'), C.GOLD) + SH(side < 0 ? SOCK_OUT : mirror(SOCK_IN)));
    s += fold(m('M -48,586 Q -38,590 -29,586 M -47,596 Q -38,600 -28,596'), .45);
    s += bootFront(side);
  }
  // shorts
  const SHORTS = 'M -64,294 L 64,294 C 67,320 70,350 72,382 Q 42,392 8,384 L 0,346 L -8,384 Q -42,392 -72,382 C -70,350 -67,320 -64,294 Z';
  s += P(SHORTS, C.NAVY, W.OUT);
  s += clipTo(SHORTS, SH('M -64,294 L -50,294 C -52,330 -56,360 -58,392 L -74,392 Z', 1) + SH('M 0,346 L -8,384 L -2,392 L 6,388 Z')
    + L('M -66,300 L -72,382 M 66,300 L 72,382', 3, C.GAR) + L('M -63,300 L -69,382 M 63,300 L 69,382', 1.2, C.GOLD));
  s += fold('M -4,344 L -14,318 M 4,344 L 14,320 M -40,380 Q -30,372 -18,376');
  s += `<text x="44" y="374" font-family="${KIT_FONT}" font-size="22" fill="${C.GOLD}" stroke="${C.INK}" stroke-width=".8" text-anchor="middle">18</text>`;
  // shirt + sleeves
  const SHIRT = tb('M -22,116 L -58,126 Q -78,131 -84,146 L -70,190 C -66,220 -62,246 -60,268 C -62,282 -64,296 -65,309 Q 0,320 65,309 C 64,296 62,282 60,268 C 62,246 66,220 70,190 L 84,146 Q 78,131 58,126 L 22,116 L 0,142 Z');
  s += P(SLEEVE, C.GAR, W.OUT) + P(mirror(SLEEVE), C.GAR, W.OUT);
  s += clipTo(SLEEVE, tb(SH('M -58,126 Q -80,130 -88,148 C -94,166 -98,186 -101,207 L -88,210 C -86,190 -82,166 -76,140 Z') + L('M -103,204 L -68,211', 3, C.BLU) + L('M -103,200 L -68,207', 1.2, C.GOLD)));
  s += clipTo(mirror(SLEEVE), tb(SH(mirror('M -70,188 L -70,214 L -78,212 C -78,198 -76,190 -74,184 Z')) + L(mirror('M -103,204 L -68,211'), 3, C.BLU) + L(mirror('M -103,200 L -68,207'), 1.2, C.GOLD)));
  s += P(SHIRT, C.BLU, W.OUT);
  s += stripes(SHIRT, (x) => x, tb(
    SH('M -84,146 L -70,190 C -66,220 -62,246 -60,268 C -62,282 -64,296 -65,309 L -46,311 C -46,290 -44,268 -46,240 C -48,214 -54,190 -60,160 Z')
    + SH('M -22,116 L 0,142 L 22,116 L 21,130 L 0,154 L -21,130 Z') + SH('M -46,198 Q -24,214 -4,206 Q -24,208 -46,198 Z')
    + SH(mirror('M -46,198 Q -24,214 -4,206 Q -24,208 -46,198 Z'), .6) + F('M 40,150 Q 62,160 68,192 L 60,192 Q 54,168 36,156 Z', '#fff', ' opacity="0.16"')));
  s += tb(fold('M -58,268 Q -42,277 -26,272 M 30,281 Q 44,277 58,270 M -22,292 Q 0,302 24,293 M -64,160 Q -56,170 -52,186 M 62,164 Q 56,174 54,186 M -50,194 Q -28,212 -6,204 M 50,194 Q 28,212 6,204'));
  s += tb(P('M -22,116 L 0,142 L 22,116 L 26,119 L 0,151 L -26,119 Z', C.GAR, W.IN) + L('M -23,119 L 0,146 L 23,119', 1, C.GOLD));
  s += P(SHIRT, 'none', W.OUT);
  // arms + hands
  s += P(ARM, C.SKIN, W.OUT) + F(ARM_OUT, C.SKIN_SH) + P(mirror(ARM), C.SKIN, W.OUT) + F(mirror(ARM_IN), C.SKIN_SH);
  s += L(ELBOW, 1) + L(mirror(ELBOW), 1) + mus(ARM_MUS) + mus(mirror(ARM_MUS));
  s += hand(HAND, THUMB) + hand(mirror(HAND), mirror(THUMB));
  s += F(HAND_SH, C.SKIN_SH) + F(mirror(move(hs('M -87,344 C -86,360 -86,380 -90,395 L -95,396 C -92,380 -92,360 -92,344 Z'), -7, 0)), C.SKIN_SH);
  s += L(FINGERS, .8) + L(mirror(FINGERS), .8);
  // neck + head
  s += P(NECK, C.SKIN, W.OUT) + F('M -20,90 Q 0,114 20,90 L 20,106 Q 0,122 -20,106 Z', C.SKIN_SH) + L('M -10,106 L -5,128', .9, C.SKIN_SH2);
  s += headFront(ex);
  return s;
}

/* ============ THREE-QUARTER ============ */
const q = (d, k = .82, dx = 6) => xf(d, (x, y) => [-x * k + dx, y]);   // far-side copy of a front-view left part
export function bodyQ(ex = EXPR.calm, o = {}) {
  let s = '';
  // far arm + sleeve (behind the torso)
  const fa = (d) => move(widen(d, 66, 1.4), 6, 0);
  const FAR_ARM = fa('M 72,198 C 74,222 75,244 74,262 C 76,290 77,318 76,342 L 62,342 C 61,316 60,290 60,264 C 57,246 54,226 53,204 Z');
  s += P(FAR_ARM, C.SKIN, W.OUT) + F(fa('M 53,204 C 54,226 57,246 60,264 C 60,290 61,316 62,342 L 68,342 C 67,316 66,290 66,264 C 63,246 61,226 60,204 Z'), C.SKIN_SH);
  s += P(move(xf('M 60,338 C 56,354 57,378 63,392 Q 70,400 76,390 C 79,376 79,356 77,340 Z', (x, y) => [68 + (x - 68) * 1.25, 338 + (y - 338) * 1.1]), 6, 0), C.SKIN, W.IN) + F(move('M 60,338 C 56,354 57,378 63,392 L 67,392 C 62,378 62,354 64,340 Z', 6, 0), C.SKIN_SH);
  s += tb(P('M 42,126 Q 60,130 66,148 C 70,164 72,184 74,202 L 52,206 C 52,192 54,180 55,170 Z', C.GAR, W.OUT) + L('M 74,199 L 52,203', 3, C.BLU) + L('M 74,195 L 53,199', 1.2, C.GOLD), 8);
  // legs: far leg first
  const farThigh = q(THIGH, .8, 8), farSock = q(SOCK, .8, 8);
  s += P(farThigh, C.SKIN, W.OUT) + F(q(THIGH_IN, .8, 8), C.SKIN_SH);
  s += P(farSock, C.SOCK, W.OUT) + clipTo(farSock, F(q('M -60,477 L -16,477 L -16,492 L -60,492 Z', .8, 8), C.GAR) + F(q('M -60,492 L -16,492 L -16,495 L -60,495 Z', .8, 8), C.GOLD) + SH(farSock, .35));
  const bootQ = (dx, k) => {
    const mm = (d) => xf(d, (x, y) => [x * k + dx, y]);
    let b = P(mm('M -14,603 C -14,597 10,597 12,603 C 22,612 34,622 40,632 C 44,640 42,650 32,652 L -14,654 C -22,652 -24,644 -22,632 C -20,620 -16,610 -14,603 Z'), 'url(#bootG)', W.OUT);
    b += F(mm('M -8,612 Q 10,606 30,624 Q 10,612 -8,618 Z'), C.BOOT_HL);
    b += F(mm('M -2,604 L 9,605 L 16,624 L 4,624 Z'), 'url(#goldG)');
    b += L(mm('M -20,636 Q -6,628 10,632 Q 24,636 38,634'), 2.4, C.GOLD);
    b += P(mm('M -24,644 C -20,654 30,656 42,644 L 42,650 C 30,660 -20,660 -24,650 Z'), '#2A2A33', W.IN);
    return b;
  };
  s += bootQ(24, .85);
  if (!o.noNearLeg) {
  // near leg
  const nT = move(THIGH, 4, 0), nS = move(SOCK, 4, 0);
  s += P(nT, C.SKIN, W.OUT) + F(move(THIGH_OUT, 4, 0), C.SKIN_SH) + L(move('M -47,462 Q -37,469 -27,464 M -44,452 Q -40,446 -34,446', 4, 0), 1) + mus(move(LEG_MUS, 4, 0));
  s += P(nS, C.SOCK, W.OUT) + clipTo(nS, F(move('M -60,477 L -16,477 L -16,492 L -60,492 Z', 4, 0), C.GAR) + F(move('M -60,492 L -16,492 L -16,495 L -60,495 Z', 4, 0), C.GOLD) + SH(move(SOCK_OUT, 4, 0)));
  s += fold(move('M -48,586 Q -38,590 -29,586 M -47,596 Q -38,600 -28,596', 4, 0), .45);
  s += bootQ(-32, 1);
  }
  // shorts
  const SHORTSQ = 'M -60,294 L 54,294 C 57,320 60,350 62,382 Q 36,390 8,384 L 2,348 L -4,384 Q -36,392 -66,382 C -65,350 -63,320 -60,294 Z';
  s += P(SHORTSQ, C.NAVY, W.OUT) + clipTo(SHORTSQ, SH('M -60,294 L -46,294 C -48,330 -52,360 -54,392 L -70,392 Z') + L('M -62,300 L -67,382', 3, C.GAR) + L('M -59,300 L -64,382', 1.2, C.GOLD));
  s += fold('M -2,346 L -12,318 M 6,346 L 14,322');
  s += `<text x="36" y="374" font-family="${KIT_FONT}" font-size="19" fill="${C.GOLD}" stroke="${C.INK}" stroke-width=".8" text-anchor="middle" transform="skewY(-4) translate(0 3)">18</text>`;
  // shirt
  const SHIRTQ = tb('M -14,116 L -52,126 Q -72,132 -78,148 L -64,192 C -60,222 -56,248 -54,270 C -56,284 -58,297 -59,309 Q 2,320 54,307 C 52,295 50,281 49,268 C 51,246 54,222 57,192 L 64,150 Q 58,132 42,126 L 28,118 L 10,142 Z', 8);
  const map = (x) => (x < 0 ? 8 + x * .96 : 8 + x * .8);
  const NSL = tb(move(SLEEVE_RAW, 6, 0), 8);
  if (!o.noNearArm) s += P(NSL, C.GAR, W.OUT) + clipTo(NSL, tb(SH(move('M -58,126 Q -80,130 -88,148 C -94,166 -98,186 -101,207 L -88,210 C -86,190 -82,166 -76,140 Z', 6, 0)) + L(move('M -103,204 L -68,211', 6, 0), 3, C.BLU) + L(move('M -103,200 L -68,207', 6, 0), 1.2, C.GOLD), 8));
  s += P(SHIRTQ, C.BLU, W.OUT);
  s += stripes(SHIRTQ, map, tb(SH('M -78,148 L -64,192 C -60,222 -56,248 -54,270 C -56,284 -58,297 -59,309 L -38,312 C -38,290 -38,266 -40,238 C -42,212 -48,186 -56,156 Z')
    + SH('M -14,116 L 10,142 L 28,118 L 27,132 L 10,154 L -13,130 Z') + SH('M 36,150 L 64,150 L 57,192 C 54,222 51,246 49,268 L 40,268 C 42,240 42,200 36,150 Z', .55)
    + F('M 18,152 Q 34,162 38,190 L 31,190 Q 28,168 14,158 Z', '#fff', ' opacity="0.16"'), 8));
  s += tb(fold('M -52,268 Q -36,277 -20,272 M 22,281 Q 36,277 49,270 M -14,293 Q 6,302 26,294 M -58,160 Q -50,170 -46,186 M -44,194 Q -22,212 2,204 M 46,194 Q 32,208 16,204'), 8);
  s += tb(P('M -14,116 L 10,142 L 28,118 L 31,121 L 10,151 L -18,119 Z', C.GAR, W.IN) + L('M -15,119 L 10,146 L 29,121', 1, C.GOLD), 8);
  s += P(SHIRTQ, 'none', W.OUT);
  if (!o.noNearArm) {
  // near arm
  const nA = move(ARM, 6, 0), nH = move(HAND, 6, 0);
  s += P(nA, C.SKIN, W.OUT) + F(move(ARM_OUT, 6, 0), C.SKIN_SH) + L(move(ELBOW, 6, 0), 1) + mus(move(ARM_MUS, 6, 0));
  s += hand(nH, move(THUMB, 6, 0)) + F(move(HAND_SH, 6, 0), C.SKIN_SH);
  s += L(move(FINGERS, 6, 0), .8);
  }
  s += P(xf(NECK, (x, y) => [x * .95 - 1, y]), C.SKIN, W.OUT) + F('M -19,90 Q 2,114 18,92 L 18,106 Q 2,122 -19,106 Z', C.SKIN_SH) + L('M -4,104 L 4,128', .9, C.SKIN_SH2);
  s += headQ(ex);
  return s;
}

/* ============ SIDE (profile facing right) ============ */
export function bodySide(ex = EXPR.calm) {
  let s = '';
  // far leg (slightly behind, darker)
  const dk = (d) => F(d, '#2A1830', ' opacity="0.16"');
  const LEG_T = widen('M -30,372 C -33,410 -27,446 -19,479 L 16,479 C 19,446 25,410 27,376 Z', -2, 1.22);
  const LEG_S = widen('M -19,476 C -30,500 -32,530 -25,560 C -21,580 -17,596 -15,610 L 6,610 C 8,590 10,570 12,548 C 14,522 16,498 16,476 Z', -4, 1.16);
  const BOOT_S = 'M -17,603 C -17,597 6,597 8,603 C 22,612 40,622 50,632 C 56,640 54,650 44,652 L -15,654 C -23,652 -25,644 -23,632 C -21,620 -19,610 -17,603 Z';
  const bootS = (dx) => {
    const m = (d) => move(d, dx, 0);
    let b = P(m(BOOT_S), 'url(#bootG)', W.OUT);
    b += F(m('M -12,610 Q 14,604 44,628 Q 14,612 -12,616 Z'), C.BOOT_HL);
    b += F(m('M 0,604 L 12,606 L 22,622 L 8,624 Z'), 'url(#goldG)') + L(m('M 4,610 L 14,611 M 7,616 L 17,617'), .8, C.GOLD_SH);
    b += L(m('M -20,638 Q 0,626 22,634 Q 36,638 50,636'), 2.6, C.GOLD) + F(m('M -21,612 L -15,604 L -13,628 L -21,630 Z'), C.GOLD);
    b += P(m('M -25,644 C -20,654 40,656 54,643 L 54,649 C 40,660 -20,660 -25,650 Z'), '#2A2A33', W.IN);
    b += F(m('M -16,656 L -10,656 L -13,662 Z M 6,657 L 12,657 L 9,663 Z M 28,657 L 34,656 L 31,662 Z M 44,653 L 49,652 L 47,658 Z'), '#9AA0B2');
    return b;
  };
  const far = (d) => move(d, -8, 0);
  s += P(far(LEG_T), C.SKIN, W.OUT) + dk(far(LEG_T)) + P(far(LEG_S), C.SOCK, W.OUT) + clipTo(far(LEG_S), F(far('M -40,476 L 30,476 L 30,491 L -40,491 Z'), C.GAR) + SH(far(LEG_S), .4)) + bootS(-8);
  // near leg
  s += P(LEG_T, C.SKIN, W.OUT) + F('M -30,372 C -33,410 -27,446 -19,479 L -10,479 C -18,446 -22,410 -20,374 Z', C.SKIN_SH);
  s += L('M 10,458 Q 18,466 14,478', 1);
  s += P(LEG_S, C.SOCK, W.OUT) + clipTo(LEG_S, F('M -40,476 L 30,476 L 30,491 L -40,491 Z', C.GAR) + F('M -40,491 L 30,491 L 30,494 L -40,494 Z', C.GOLD) + SH('M -19,476 C -30,500 -32,530 -25,560 C -21,580 -17,596 -15,610 L -6,610 C -10,590 -16,570 -18,548 C -20,524 -14,500 -8,476 Z'));
  s += fold('M -18,586 Q -6,590 6,586 M -16,596 Q -4,600 7,596', .45);
  s += bootS(0);
  // shorts
  const SHORTS_S = 'M -38,294 L 34,294 C 38,320 40,350 41,382 L -38,385 C -40,350 -40,320 -38,294 Z';
  s += P(SHORTS_S, C.NAVY, W.OUT) + clipTo(SHORTS_S, SH('M -38,294 L -24,294 C -26,330 -28,360 -26,390 L -42,390 Z') + L('M 0,296 L 2,384', 3, C.GAR) + L('M 3,296 L 5,384', 1.2, C.GOLD));
  s += fold('M -30,372 Q -10,366 10,374 M 20,320 Q 30,330 34,350');
  // torso
  const SHIRT_S = tb('M -10,112 C -24,116 -32,124 -35,140 C -39,180 -37,230 -33,268 C -33,282 -35,296 -35,309 Q 2,316 37,307 C 37,295 35,282 33,268 C 37,240 43,206 41,180 C 39,150 31,128 14,116 Z', 2);
  s += P(SHIRT_S, C.BLU, W.OUT);
  s += stripes(SHIRT_S, (x) => 2 + x * .7, tb(SH('M -35,140 C -39,180 -37,230 -33,268 C -33,282 -35,296 -35,309 L -18,311 C -18,290 -18,262 -20,232 C -22,200 -22,170 -20,130 Z')
    + F('M 22,140 Q 38,160 39,190 L 32,190 Q 30,166 18,146 Z', '#fff', ' opacity="0.16"'), 2));
  s += fold('M -30,268 Q -12,276 6,270 M 14,286 Q 26,282 36,276 M -28,292 Q 0,302 30,294');
  s += P('M -10,112 C 0,114 8,114 14,116 L 16,122 C 8,120 -2,120 -12,118 Z', C.GAR, W.IN);
  // arm (hangs in front of the torso)
  const SSL = widen('M -24,132 C -30,150 -28,180 -26,208 L 20,206 C 23,180 23,150 16,130 Q -4,124 -24,132 Z', -2, 1.2);
  s += P(SSL, C.GAR, W.OUT);
  s += clipTo(SSL, SH('M -24,132 C -30,150 -28,180 -26,208 L -10,208 C -12,182 -12,152 -6,128 Z') + L('M -27,204 L 21,202', 3, C.BLU) + L('M -27,200 L 21,198', 1.2, C.GOLD));
  const as = (d) => widen(d, -1, 1.4);
  const ARM_S = as('M -18,205 C -19,226 -17,246 -14,264 C -12,292 -8,320 -6,346 L 10,346 C 10,320 12,292 12,264 C 14,244 16,224 16,205 Z');
  s += P(ARM_S, C.SKIN, W.OUT) + F(as('M -18,205 C -19,226 -17,246 -14,264 C -12,292 -8,320 -6,346 L 1,346 C 0,320 -4,292 -6,264 C -8,244 -10,226 -9,205 Z'), C.SKIN_SH) + mus('M 14,214 C 19,228 18,244 13,256 M -16,276 C -12,292 -10,306 -10,322');
  s += P(xf('M -8,342 C -13,360 -9,384 2,396 Q 10,402 14,392 C 16,376 14,358 10,342 Z', (x, y) => [1 + (x - 1) * 1.25, 342 + (y - 342) * 1.12]), C.SKIN, W.IN) + L('M 2,372 Q 6,384 6,394 M 7,368 Q 11,380 11,390', .8);
  // neck + head
  s += P(widen('M -14,84 C -16,100 -16,114 -18,124 L 20,124 C 14,110 12,98 12,86 Z', -1, 1.2), C.SKIN, W.OUT) + F('M -14,84 C -16,100 -16,114 -18,124 L -4,124 C -4,110 -2,98 0,92 Z', C.SKIN_SH);
  s += headSide(ex);
  return s;
}

/* ============ BACK ============ */
export function bodyBack() {
  let s = '';
  for (const side of [-1, 1]) {
    const m = side < 0 ? (d) => d : mirror;
    s += P(m(THIGH), C.SKIN, W.OUT) + F(side < 0 ? THIGH_OUT : mirror(THIGH_IN), C.SKIN_SH);
    s += L(m('M -46,466 Q -36,474 -26,468'), 1) + mus(m('M -40,392 C -38,414 -36,436 -34,452'));
    s += P(m(SOCK), C.SOCK, W.OUT) + clipTo(m(SOCK), F(m('M -60,477 L -16,477 L -16,492 L -60,492 Z'), C.GAR) + F(m('M -60,492 L -16,492 L -16,495 L -60,495 Z'), C.GOLD) + SH(side < 0 ? SOCK_OUT : mirror(SOCK_IN)));
    s += L(m('M -40,512 Q -36,540 -38,562'), 1, '#04224D', .6);
    const heel = 'M -50,603 C -50,597 -24,597 -24,603 C -22,619 -22,635 -27,647 Q -37,656 -47,647 C -52,635 -52,619 -50,603 Z';
    s += P(m(heel), 'url(#bootG)', W.OUT) + F(m('M -42,606 L -32,606 L -33,628 L -41,628 Z'), 'url(#goldG)') + L(m('M -50,630 Q -37,626 -24,630'), 2.2, C.GOLD);
    s += P(m('M -50,645 Q -37,657 -25,645 L -25,651 Q -37,662 -50,651 Z'), '#2A2A33', W.IN);
  }
  const SHORTS_B = 'M -64,294 L 64,294 C 67,320 70,350 72,382 Q 40,390 6,384 L 0,352 L -6,384 Q -40,390 -72,382 C -70,350 -67,320 -64,294 Z';
  s += P(SHORTS_B, C.NAVY, W.OUT) + clipTo(SHORTS_B, SH('M -64,294 L -50,294 C -52,330 -56,360 -58,392 L -74,392 Z') + L('M -66,300 L -72,382 M 66,300 L 72,382', 3, C.GAR) + L('M -63,300 L -69,382 M 63,300 L 69,382', 1.2, C.GOLD));
  s += fold('M 0,352 L 0,312 M -40,376 Q -24,370 -8,378 M 8,378 Q 24,370 40,376');
  const SHIRT_B = tb('M -22,112 L -58,126 Q -78,131 -84,146 L -70,190 C -66,220 -62,246 -60,268 C -62,282 -64,296 -65,309 Q 0,320 65,309 C 64,296 62,282 60,268 C 62,246 66,220 70,190 L 84,146 Q 78,131 58,126 L 22,112 Q 0,120 -22,112 Z');
  s += P(SLEEVE, C.GAR, W.OUT) + P(mirror(SLEEVE), C.GAR, W.OUT);
  s += clipTo(SLEEVE, tb(SH('M -58,126 Q -80,130 -88,148 C -94,166 -98,186 -101,207 L -88,210 C -86,190 -82,166 -76,140 Z') + L('M -103,204 L -68,211', 3, C.BLU) + L('M -103,200 L -68,207', 1.2, C.GOLD)));
  s += clipTo(mirror(SLEEVE), tb(L(mirror('M -103,204 L -68,211'), 3, C.BLU) + L(mirror('M -103,200 L -68,207'), 1.2, C.GOLD)));
  s += P(SHIRT_B, C.BLU, W.OUT);
  s += stripes(SHIRT_B, (x) => x, tb(SH('M -84,146 L -70,190 C -66,220 -62,246 -60,268 C -62,282 -64,296 -65,309 L -46,311 C -46,290 -44,268 -46,240 C -48,214 -54,190 -60,160 Z')
    + SH('M -22,112 Q 0,120 22,112 L 22,124 Q 0,132 -22,124 Z')));
  s += tb(fold('M -58,268 Q -42,277 -26,272 M 30,281 Q 44,277 58,270 M -40,140 Q -30,150 -26,166 M 40,140 Q 30,150 26,166 M -56,200 Q -48,232 -54,262 M 56,200 Q 48,232 54,262'));
  s += tb(P('M -22,112 Q 0,120 22,112 L 23,117 Q 0,126 -23,117 Z', C.GAR, W.IN));
  // gold name + number
  s += `<path id="nameArc" d="M -64,172 Q 0,150 64,172" fill="none"/>`;
  s += `<text font-family="${KIT_FONT}" font-size="20" letter-spacing="1" fill="url(#goldG)" stroke="${C.INK}" stroke-width="1.2" paint-order="stroke" text-anchor="middle"><textPath href="#nameArc" startOffset="50%">JWAN SIDOU</textPath></text>`;
  s += `<text x="0" y="262" font-family="${KIT_FONT}" font-size="104" fill="url(#goldG)" stroke="${C.INK}" stroke-width="2.4" paint-order="stroke" text-anchor="middle">18</text>`;
  s += L('M 30,186 L 26,262', 1, '#2E1838', .25);
  s += P(ARM, C.SKIN, W.OUT) + F(ARM_OUT, C.SKIN_SH) + P(mirror(ARM), C.SKIN, W.OUT) + F(mirror(ARM_IN), C.SKIN_SH);
  const BMUS = 'M -112,218 C -115,232 -113,246 -108,256 M -84,280 C -82,296 -83,312 -86,326';
  s += L(move('M -100,258 Q -96,252 -90,258', -7, 0), 1) + L(mirror(move('M -100,258 Q -96,252 -90,258', -7, 0)), 1) + mus(BMUS) + mus(mirror(BMUS));
  s += hand(HAND) + hand(mirror(HAND)) + F(HAND_SH, C.SKIN_SH);
  s += P(widen('M -18,80 C -18,96 -18,110 -20,120 Q 0,128 20,120 C 18,110 18,96 18,80 Z', 0, 1.22), C.SKIN, W.OUT) + F(widen('M -18,80 C -18,96 -18,110 -20,120 Q -10,124 -4,124 C -6,108 -8,94 -8,80 Z', 0, 1.22), C.SKIN_SH) + L('M -24,112 Q -12,104 -4,112 M 24,112 Q 12,104 4,112', .9, C.SKIN_SH2, .7);
  s += headBack();
  return s;
}

/* ---------- pose kit: the approved side-view parts, reused by the key poses (same shapes, same colours) ---------- */
/** Side boot in model coordinates; the ankle joint sits at (-4, 606). */
export function sideBoot() {
  const BOOT_S = 'M -17,603 C -17,597 6,597 8,603 C 22,612 40,622 50,632 C 56,640 54,650 44,652 L -15,654 C -23,652 -25,644 -23,632 C -21,620 -19,610 -17,603 Z';
  let b = P(BOOT_S, 'url(#bootG)', W.OUT);
  b += F('M -12,610 Q 14,604 44,628 Q 14,612 -12,616 Z', C.BOOT_HL);
  b += F('M 0,604 L 12,606 L 22,622 L 8,624 Z', 'url(#goldG)') + L('M 4,610 L 14,611 M 7,616 L 17,617', .8, C.GOLD_SH);
  b += L('M -20,638 Q 0,626 22,634 Q 36,638 50,636', 2.6, C.GOLD) + F('M -21,612 L -15,604 L -13,628 L -21,630 Z', C.GOLD);
  b += P('M -25,644 C -20,654 40,656 54,643 L 54,649 C 40,660 -20,660 -25,650 Z', '#2A2A33', W.IN);
  b += F('M -16,656 L -10,656 L -13,662 Z M 6,657 L 12,657 L 9,663 Z M 28,657 L 34,656 L 31,662 Z M 44,653 L 49,652 L 47,658 Z', '#9AA0B2');
  return b;
}
/** Side torso (shirt + shorts waist) in model coordinates; hip joint at (0, 352), shoulder at (0, 150). */
export function sideTorso() {
  let s = '';
  const SHORTS_W = 'M -38,294 L 34,294 C 38,312 40,334 40,358 Q 0,368 -38,360 C -40,334 -40,312 -38,294 Z';
  s += P(SHORTS_W, C.NAVY, W.OUT) + clipTo(SHORTS_W, SH('M -38,294 L -24,294 C -26,320 -28,344 -26,366 L -42,366 Z') + L('M 0,296 L 1,362', 3, C.GAR) + L('M 3,296 L 4,362', 1.2, C.GOLD));
  const SHIRT_S = tb('M -10,112 C -24,116 -32,124 -35,140 C -39,180 -37,230 -33,268 C -33,282 -35,296 -35,309 Q 2,316 37,307 C 37,295 35,282 33,268 C 37,240 43,206 41,180 C 39,150 31,128 14,116 Z', 2);
  s += P(SHIRT_S, C.BLU, W.OUT);
  s += stripes(SHIRT_S, (x) => 2 + x * .7, tb(SH('M -35,140 C -39,180 -37,230 -33,268 C -33,282 -35,296 -35,309 L -18,311 C -18,290 -18,262 -20,232 C -22,200 -22,170 -20,130 Z')
    + F('M 22,140 Q 38,160 39,190 L 32,190 Q 30,166 18,146 Z', '#fff', ' opacity="0.16"'), 2));
  s += fold('M -30,268 Q -12,276 6,270 M 14,286 Q 26,282 36,276 M -28,292 Q 0,302 30,294');
  s += P('M -10,112 C 0,114 8,114 14,116 L 16,122 C 8,120 -2,120 -12,118 Z', C.GAR, W.IN);
  return s;
}
export function sideNeck() {
  return P(widen('M -14,84 C -16,100 -16,114 -18,124 L 20,124 C 14,110 12,98 12,86 Z', -1, 1.2), C.SKIN, W.OUT) + F('M -14,84 C -16,100 -16,114 -18,124 L -4,124 C -4,110 -2,98 0,92 Z', C.SKIN_SH);
}
