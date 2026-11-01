// Clean-up key drawings. Each pose is its own illustration: gesture first, then hand-placed contours for every
// silhouette (whole legs, whole arms, twisted torso, cloth). Only the approved head and boot drawings are reused.
// Space: HU, origin at the hip centre, y down, facing right; soles land on y ≈ 310.
import { C, W } from './kit.mjs';
import { headQ, EXPR } from './head.mjs';
import { sideBoot, bodyQ } from './body.mjs';
import { region, ln, fill, clip, stripesAt, cr } from './draw.mjs';

const SK = [C.SKIN, C.SKIN_SH], SO = [C.SOCK, C.SOCK_SH], NV = [C.NAVY, C.NAVY_SH], GA = [C.GAR, C.GAR_SH];
const boot = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(4 -606)">${sideBoot()}</g>`;
const dim = (svg) => `<g style="filter:brightness(.84) saturate(.92)">${svg}</g>`;
const mus = (pts, op = .75) => ln(pts, 1.5, C.SKIN_SH2, op);
const fold = (pts, op = .4) => ln(pts, 1.4, '#2A1236', op);
/** Head (approved three-quarter drawing) with its neck, attached at a neck point and tilted. */
function head(x, y, tilt, ex) {
  const neck = 'M -21,84 C -21,100 -21,112 -23,124 Q 0,136 23,124 C 21,112 21,100 21,86 Z';
  return `<g transform="translate(${x} ${y - 116}) rotate(${tilt} 0 112)"><path d="${neck}" fill="${C.SKIN}" stroke="${C.INK}" stroke-width="${W.OUT}"/>`
    + `<path d="M -21,90 Q 2,116 21,92 L 21,108 Q 2,124 -21,108 Z" fill="${C.SKIN_SH}"/>${headQ(ex)}</g>`;
}
/** Sock + band + gold stripe inside a leg silhouette, below a cut line (a -> b across the shin). */
function sockOn(legPts, a, b, far) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;   // n points down the shin
  const off = (p, k) => [p[0] + nx * k, p[1] + ny * k];
  const big = [a, b, off(b, 260), off(a, 260)];
  const band = [a, b, off(b, 15), off(a, 15)], gold = [off(a, 15), off(b, 15), off(b, 19), off(a, 19)];
  return clip(legPts, region(big, ...SO, { k: 9, line: false }) + fill(band, C.GAR) + fill(gold, C.GOLD) + ln([a, b], W.IN));
}

/* ======================= FRAME 6 — FIRST TOUCH =======================
   Weight on the planted far leg, near knee lifted, instep cushioning the ball; arms out for balance,
   torso leaning back a touch and twisting toward the ball, eyes down on it. */
export function keyFirstTouch() {
  let s = '';
  // far arm: reaches forward-out for balance (behind the chest at the shoulder)
  const farArm = [[70, -204], [100, -190], [124, -172], [148, -174], [170, -178], [180, -162], [172, -136], [146, -128], [122, -116], [98, -126], [78, -138], [60, -158]];
  s += dim(region(farArm, ...SK, { k: 7 }) + mus([[118, -154], [124, -138]])
    + region([[168, -180], [190, -178], [202, -164], [198, -142], [182, -134], [166, -140], [162, -160]], ...SK, { k: 5 }) + ln([[184, -172], [196, -160]], 1.2, C.SKIN_SH2) + ln([[176, -146], [192, -150]], 1.2, C.SKIN_SH2)
    + ln([[176, -164], [188, -158]], 1.2, C.SKIN_SH2) + region([[66, -200], [96, -188], [104, -160], [92, -144], [70, -146], [58, -170]], ...GA, { k: 7 }) + ln([[104, -160], [92, -144]], 3, C.BLU));
  // far (planted) leg
  const farLeg = [[-12, -6], [40, -10], [50, 52], [48, 110], [46, 140], [42, 172], [36, 222], [28, 262, 'c'], [2, 264], [-4, 222], [-10, 182], [-2, 142], [-10, 96], [-16, 40]];
  s += dim(region(farLeg, ...SK, { k: 9 }) + mus([[30, 120], [42, 132], [34, 146]]) + sockOn(farLeg, [-10, 160], [48, 150]) + boot(14, 262, 0));
  // shorts: waist + far leg tube (drawn under the near thigh)
  const shorts = [[-56, -18], [62, -22], [66, 12], [56, 70], [20, 76], [-14, 74], [-20, 40], [-54, 12]];
  s += region(shorts, ...NV, { k: 9, extra: ln([[-58, -6], [-60, 30]], 3, C.GAR) + fold([[18, 20], [8, 60]]) + fold([[40, 40], [30, 66]]) });
  // torso: three-quarter, leaning back slightly, twisting toward the ball
  const torso = [[-8, -218], [-40, -208], [-62, -194], [-68, -168], [-62, -138], [-56, -100], [-52, -58], [-56, -18], [-52, 8], [-10, 16], [30, 12], [60, 2], [62, -30], [64, -70], [74, -112], [82, -140], [80, -172], [66, -198], [42, -212], [26, -216], [10, -188, 'c']];
  const tStripes = stripesAt([-110, -76, -46, -18, 8, 30, 50, 68, 86, 104], -240, 30, -10);
  s += region(torso, C.BLU, '', { under: tStripes + fill(torso, '#2B1240', 0) + `<path d="${cr(torso)}" fill="#2B1240" opacity=".34" transform="translate(9 -8)" style="mix-blend-mode:normal"/>`, line: false });
  // shading: cool shadow on the near side + under the chest
  s += clip(torso, fill([[-80, -230], [-36, -230], [-30, -150], [-24, -60], [-30, 30], [-80, 30]], '#2B1240', .32) + fill([[-40, -120], [20, -112], [76, -126], [70, -96], [10, -92], [-40, -100]], '#2B1240', .18)
    + fill([[40, -200], [74, -186], [80, -150], [60, -160]], '#FFFFFF', .16));
  s += fold([[76, -132], [40, -100], [0, -66]]) + fold([[70, -100], [30, -70], [-4, -40]]) + fold([[-48, -40], [-20, -30], [10, -34]]) + fold([[-46, -8], [0, 4], [40, -4]]);
  s += `<path d="${cr(torso)}" fill="none" stroke="${C.INK}" stroke-width="${W.OUT}" stroke-linejoin="round"/>`;
  // near leg: knee lifted, instep presented to the ball
  const nearLeg = [[-24, -18], [34, -42], [88, -34], [108, -26], [118, -8], [116, 22], [122, 60], [130, 92, 'c'], [106, 102], [94, 70], [84, 42], [76, 24], [46, 40], [10, 48], [-16, 40]];
  s += region(nearLeg, ...SK, { k: 10 }) + mus([[96, -20], [108, -6], [104, 10]]) + mus([[40, -30], [70, -24]], .5);
  s += sockOn(nearLeg, [76, 16], [118, 6]);
  s += boot(118, 98, -25);
  // near shorts tube over the thigh root
  s += region([[-24, -24], [18, -40], [46, -48], [58, -22], [60, 10], [52, 44], [12, 56], [-18, 46]], ...NV, { k: 9, extra: ln([[47, -46], [40, -6], [50, 44]], 1.4, '#3A5BB0', .8) + fold([[0, -20], [26, 22]]) + fold([[8, 40], [36, 30]]) });
  // near arm: thrown back-down for balance, open hand
  const nearArm = [[-56, -206], [-94, -178], [-122, -140], [-134, -122], [-150, -100], [-166, -80], [-146, -60], [-124, -86], [-102, -100], [-80, -130], [-50, -150]];
  s += region(nearArm, ...SK, { k: 7 }) + mus([[-106, -128], [-116, -112]]);
  s += region([[-166, -86], [-182, -68], [-190, -44], [-180, -36], [-170, -52], [-166, -34], [-154, -36], [-150, -58], [-140, -66]], ...SK, { k: 4, w: W.IN + .6 });
  s += region([[-50, -206], [-80, -192], [-96, -166], [-82, -148], [-56, -152], [-46, -180]], ...GA, { k: 7 }) + ln([[-96, -166], [-82, -148]], 3, C.BLU) + ln([[-93, -170], [-79, -151]], 1.2, C.GOLD);
  // collar + head (eyes down on the ball)
  s += region([[-10, -218], [10, -186], [28, -216], [33, -212], [10, -174], [-15, -214]], ...GA, { k: 3 }) + ln([[-12, -215], [10, -181], [30, -213]], 1, C.GOLD);
  s += head(10, -214, 16, EXPR.focus);
  return { svg: s, ball: [140, 52], ground: 310 };
}

/* ======================= FRAME 9 — HERO REVEAL =======================
   The approved three-quarter body, with the near leg redrawn stepping onto the ball and the near arm redrawn
   with the hand on the hip. Model coordinates (skull top = 0, soles ≈ 652). */
export function keyHero() {
  let s = bodyQ(EXPR.smile, { noNearLeg: true, noNearArm: true });
  // near leg: thigh foreshortened toward camera, knee out, sole resting on top of the ball
  const leg = [[-14, 372], [-72, 374], [-84, 418], [-86, 452], [-80, 474], [-70, 502], [-60, 532], [-54, 556, 'c'], [-26, 556], [-28, 522], [-38, 488], [-42, 470], [-26, 430]];
  let L = region(leg, ...SK, { k: 9 }) + mus([[-78, 452], [-66, 466], [-52, 462]]) + mus([[-60, 400], [-52, 440]], .5);
  L += sockOn(leg, [-86, 482], [-38, 490]);
  L += boot(-42, 552, 12, .95);
  L += region([[-74, 300], [-4, 296], [0, 340], [-6, 388], [-40, 396], [-76, 388], [-80, 340]], ...NV, { k: 9, extra: ln([[-78, 384], [-40, 392], [-6, 384]], 1.4, '#3A5BB0', .8) + fold([[-40, 330], [-48, 380]]) });
  // near arm: elbow out, knuckles on the hip
  const arm = [[-80, 150], [-108, 168], [-130, 206], [-142, 240], [-140, 262], [-118, 284], [-92, 298], [-84, 280], [-110, 262], [-118, 246], [-110, 214], [-90, 192]];
  L += region(arm, ...SK, { k: 8 }) + mus([[-122, 200], [-128, 228]]) + mus([[-128, 252], [-112, 270]], .6);
  L += region([[-96, 284], [-76, 280], [-60, 288], [-58, 306], [-74, 314], [-94, 306]], ...SK, { k: 4, w: W.IN + .6 }) + ln([[-82, 290], [-80, 306]], 1.1, C.SKIN_SH2) + ln([[-70, 290], [-68, 306]], 1.1, C.SKIN_SH2);
  L += region([[-70, 132], [-104, 146], [-128, 192], [-116, 214], [-90, 206], [-70, 178]], ...GA, { k: 8 }) + ln([[-128, 192], [-116, 214]], 3, C.BLU) + ln([[-124, 189], [-112, 210]], 1.2, C.GOLD);
  s += L;
  return { svg: s, ball: [-30, 612], ground: 652 };
}

/* ======================= FRAME 5 — RUN TO THE BALL =======================
   Flight phase of a sprint: torso pitched forward and twisting, near knee driving through, far leg trailing
   high behind, arms pumping in opposition, chin up to track the ball. */
export function keyRun() {
  let s = '';
  // far arm: punches forward and up
  const farArm = [[86, -206], [110, -186], [124, -160], [140, -170], [156, -192], [170, -186], [160, -160], [142, -132], [122, -118], [104, -140], [84, -164]];
  s += dim(region(farArm, ...SK, { k: 7 }) + region([[150, -196], [168, -210], [184, -204], [186, -186], [172, -176], [156, -180]], ...SK, { k: 5 })
    + region([[80, -212], [106, -198], [114, -170], [100, -156], [80, -160], [70, -186]], ...GA, { k: 7 }) + ln([[114, -170], [100, -156]], 3, C.BLU));
  // far leg: trailing behind, foot kicked up
  const farLeg = [[-6, -8], [-24, 40], [-38, 86], [-46, 106, 'c'], [-72, 108], [-96, 116], [-122, 126], [-130, 142, 'c'], [-112, 156], [-82, 144], [-52, 136], [-24, 126], [-4, 98], [12, 52], [30, 8]];
  s += dim(region(farLeg, ...SK, { k: 9 }) + mus([[-40, 112], [-30, 122]]) + sockOn(farLeg, [-56, 100], [-48, 140]) + boot(-122, 142, 112));
  // shorts
  const shorts = [[-54, -22], [60, -26], [66, 8], [44, 60], [10, 66], [-24, 54], [-40, 32], [-56, 6]];
  s += region(shorts, ...NV, { k: 9, extra: ln([[-56, -8], [-58, 26]], 3, C.GAR) + fold([[10, 20], [0, 56]]) });
  // torso: pitched forward, twisted toward camera
  const torso = [[34, -218], [6, -210], [-20, -194], [-32, -170], [-36, -140], [-40, -100], [-46, -56], [-54, -14], [-50, 10], [0, 18], [40, 12], [62, 0], [66, -32], [74, -72], [90, -108], [100, -140], [102, -170], [92, -198], [72, -214], [56, -220], [44, -192, 'c']];
  const st = stripesAt([-90, -60, -32, -6, 18, 40, 60, 78, 96, 114, 132], -240, 30, -34);
  s += region(torso, C.BLU, '', { under: st, line: false });
  s += clip(torso, fill([[-60, -230], [-14, -230], [-6, -140], [-6, -60], [-14, 30], [-60, 30]], '#2B1240', .32) + fill([[-20, -120], [40, -112], [96, -130], [90, -100], [30, -94], [-20, -100]], '#2B1240', .16)
    + fill([[60, -206], [94, -192], [100, -156], [80, -170]], '#FFFFFF', .16));
  s += fold([[96, -140], [56, -104], [14, -70]]) + fold([[88, -104], [46, -74], [6, -46]]) + fold([[-44, -30], [-10, -24], [24, -28]]) + fold([[-46, -2], [0, 8], [44, 0]]);
  s += `<path d="${cr(torso)}" fill="none" stroke="${C.INK}" stroke-width="${W.OUT}" stroke-linejoin="round"/>`;
  // near leg: knee driving forward, shin hanging, toe pulled up
  const nearLeg = [[-24, -18], [30, -38], [76, -32], [94, -22], [102, -4], [96, 26], [88, 62], [76, 96, 'c'], [54, 100], [48, 64], [54, 34], [66, 18], [40, 36], [6, 46], [-16, 38]];
  s += region(nearLeg, ...SK, { k: 10 }) + mus([[84, -18], [96, -4], [90, 12]]) + mus([[30, -28], [62, -22]], .5);
  s += sockOn(nearLeg, [60, 16], [100, 10]);
  s += boot(66, 98, 30);
  s += region([[-24, -26], [16, -42], [44, -50], [56, -24], [58, 8], [48, 42], [12, 54], [-18, 44]], ...NV, { k: 9, extra: ln([[46, -48], [38, -6], [46, 40]], 1.4, '#3A5BB0', .8) + fold([[0, -20], [26, 22]]) });
  // near arm: driven back, elbow high, fist by the hip
  const nearArm = [[-14, -200], [-50, -184], [-82, -150], [-94, -126], [-84, -106], [-66, -86], [-50, -70], [-36, -84], [-54, -104], [-62, -124], [-48, -150], [-20, -164]];
  s += region(nearArm, ...SK, { k: 7 }) + mus([[-72, -146], [-80, -128]]);
  s += region([[-58, -86], [-44, -96], [-28, -88], [-26, -70], [-40, -60], [-56, -66]], ...SK, { k: 4, w: W.IN + .6 }) + ln([[-48, -88], [-34, -76]], 1.1, C.SKIN_SH2);
  s += region([[-6, -206], [-40, -196], [-66, -170], [-56, -146], [-30, -150], [-12, -176]], ...GA, { k: 7 }) + ln([[-66, -170], [-56, -146]], 3, C.BLU) + ln([[-63, -173], [-53, -149]], 1.2, C.GOLD);
  // collar + head (chin up, eyes on the ball)
  s += region([[32, -218], [46, -190], [62, -218], [67, -214], [46, -178], [27, -214]], ...GA, { k: 3 }) + ln([[30, -215], [46, -185], [64, -215]], 1, C.GOLD);
  s += head(46, -216, -12, EXPR.focus);
  return { svg: s, ground: 300 };
}
