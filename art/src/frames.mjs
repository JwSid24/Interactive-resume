// The nine key poses of the opening scene. Each frame composes background layers, the ball and Jwandini.
import { CAM, sky, cloud, cloudsWide, stadium, pitch, skyUp, grassClose, rng, WD, HD } from './env.mjs';
import { ball, ballMotion } from './ball.mjs';
import { figure, POSES, LEN, legFK, soleY, solePoint, instepPoint, at } from './pose.mjs';
import { EXPR } from './head.mjs';
import { keyFirstTouch, keyRun, keyHero } from './keys.mjs';

const fx = (n) => +n.toFixed(1);
/* ---------- effects ---------- */
export function focusLines(cx, cy, r0, n, seed, col = '#FFFFFF', op = .5, wmax = .02) {
  const R = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, w = wmax * (.3 + R()), ra = r0 * (1 + R() * .6), rb = 2400;
    s += `<polygon points="${fx(cx + Math.cos(a) * ra)},${fx(cy + Math.sin(a) * ra)} ${fx(cx + Math.cos(a - w) * rb)},${fx(cy + Math.sin(a - w) * rb)} ${fx(cx + Math.cos(a + w) * rb)},${fx(cy + Math.sin(a + w) * rb)}" fill="${col}" opacity="${op}"/>`;
  }
  return s;
}
export function streaks(x0, y0, x1, y1, n, seed, col = '#FFFFFF', op = .45, len = [60, 260]) {
  const R = rng(seed), ang = Math.atan2(y1 - y0, x1 - x0);
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = R(), x = x0 + (x1 - x0) * t + (R() - .5) * 160, y = y0 + (y1 - y0) * t + (R() - .5) * 160, l = len[0] + R() * (len[1] - len[0]);
    s += `<line x1="${fx(x)}" y1="${fx(y)}" x2="${fx(x - Math.cos(ang) * l)}" y2="${fx(y - Math.sin(ang) * l)}" stroke="${col}" stroke-width="${fx(1.5 + R() * 3)}" stroke-linecap="round" opacity="${fx(op * (.5 + R() * .5))}"/>`;
  }
  return s;
}
export function sparkle(x, y, s, col = '#FFFFFF') {
  return `<path d="M ${x},${y - s} Q ${x + s * .14},${y - s * .14} ${x + s},${y} Q ${x + s * .14},${y + s * .14} ${x},${y + s} Q ${x - s * .14},${y + s * .14} ${x - s},${y} Q ${x - s * .14},${y - s * .14} ${x},${y - s} Z" fill="${col}"/>`;
}
export function dust(x, y, s, seed) {
  const R = rng(seed);
  let o = '';
  for (let i = 0; i < 8; i++) o += `<circle cx="${fx(x + (R() - .5) * s * 2.2)}" cy="${fx(y - R() * s * .6)}" r="${fx(s * (.25 + R() * .35))}" fill="#E9F2DA" opacity="${fx(.22 + R() * .25)}" filter="url(#soft2)"/>`;
  return o;
}
export const shadow = (x, y, rx, ry, op = .35) => `<ellipse cx="${fx(x)}" cy="${fx(y)}" rx="${fx(rx)}" ry="${fx(ry)}" fill="#0B3A16" opacity="${op}" filter="url(#soft2)"/>`;
export function flare(x, y) {
  return `<circle cx="${x}" cy="${y}" r="420" fill="url(#sunG)"/>` + [[.25, 40, .18], [.45, 70, .12], [.7, 26, .2], [.9, 110, .08]]
    .map(([k, r, o]) => `<circle cx="${fx(x + (960 - x) * k * 2)}" cy="${fx(y + (560 - y) * k * 2)}" r="${r}" fill="#FFF6D6" opacity="${o}"/>`).join('');
}
export const grade = (op = .12) => `<rect width="${WD}" height="${HD}" fill="#FFE7B0" opacity="${op}" style="mix-blend-mode:soft-light"/>`;

/* ---------- backgrounds per camera ---------- */
export const wideBG = () => sky(CAM.wide, [960, 380]) + cloudsWide() + stadium(CAM.wide) + pitch(CAM.wide);
export const midBG = () => sky(CAM.mid, [1500, 160], { sunR: 600 }) + cloud(380, 150, 640, 61) + cloud(1300, 230, 520, 67, { op: .95 })
  + `<g filter="url(#dof4)">${stadium(CAM.mid, { zN: 8, roof: false })}</g>` + pitch(CAM.mid, { zN: 4, centreZ: 60 });
export const lowBG = () => sky(CAM.low, [420, 250], { sunR: 700 }) + cloud(1450, 180, 700, 71) + cloud(520, 520, 560, 73, { op: .9 }) + cloud(1700, 560, 420, 79, { op: .9 })
  + `<g filter="url(#dof4)">${stadium(CAM.low, { zN: 10 })}</g>` + pitch(CAM.low, { zN: 3, centreZ: 40 });

/* ---------- pose fitting ---------- */
export const groundOff = (fig) => Math.max(soleY(fig.near), soleY(fig.far));
function fitStep(base) {
  // find the near-leg angles that rest the sole on top of the ball while the far foot stands on the ground
  const g = soleY({ ...legFK([0, 0], base.legs.far) });
  let best = null;
  for (let th = 18; th <= 52; th += 1) for (let kn = 0; kn <= 110; kn += 1) {
    const fk = legFK([4, 0], { ...base.legs.near, th, kn });
    const sp = solePoint(fk), err = Math.abs(sp[1] + 2 * LEN.ball - g) + Math.abs(sp[0] - 120) * .3;
    if (!best || err < best.err) best = { err, th, kn };
  }
  return { ...base, legs: { ...base.legs, near: { ...base.legs.near, th: best.th, kn: best.kn } } };
}
export const STEP = fitStep(POSES.step);

/* ---------- frames ---------- */
export const FRAMES = [
  { id: 'establishing', draw: () => wideBG() + grade() },

  { id: 'ball-in-sky', draw: () => skyUp() + streaks(1180, 330, 1180, 120, 10, 3, '#FFFFFF', .5, [40, 140])
      + `<circle cx="1180" cy="330" r="70" fill="url(#sunG)" opacity=".8"/>` + ball(1180, 330, 30, .4) + sparkle(1206, 304, 16) + grade() },

  { id: 'ball-falling', draw: () => wideBG() + shadow(930, 742, 26, 7, .25)
      + streaks(930, 330, 930, 40, 16, 5, '#FFFFFF', .55, [80, 240]) + ballMotion(930, 330, 40, 0, -90, .9) + grade() },

  { id: 'jwandini-enters', draw: () => {
      const fig = figure(POSES.run1), s = .36, gy = 930;
      return wideBG() + shadow(1060, 790, 18, 5, .3) + ballMotion(1080, 170, 20, 0, -50, .7)
        + streaks(260, 860, 0, 860, 18, 9, '#FFFFFF', .5, [80, 220]) + shadow(400, gy, 80, 12, .35)
        + at(fig.svg, 420, gy - groundOff(fig) * s, s) + dust(330, gy, 26, 4) + grade();
    } },

  { id: 'run-to-ball', draw: () => {
      const k = keyRun(), s = 1.3, gy = 1040, hx = 820, hy = gy - (k.ground + 30) * s;
      return midBG() + shadow(1470, 1012, 90, 18, .3) + focusLines(hx, hy - 60, 520, 60, 11, '#FFFFFF', .22)
        + streaks(560, 760, 0, 760, 26, 13, '#FFFFFF', .45) + shadow(hx, gy, 210, 24, .34)
        + at(k.svg, hx, hy, s) + dust(hx - 200, gy, 56, 6)
        + ballMotion(1480, 150, 50, -8, -120, 1.1) + grade();
    } },

  { id: 'first-touch', draw: () => {
      const k = keyFirstTouch(), s = 1.05, gy = 1040, hx = 800, hy = gy - k.ground * s;
      const bc = [hx + k.ball[0] * s, hy + k.ball[1] * s];
      return midBG() + focusLines(bc[0], bc[1], 170, 70, 17, '#FFFFFF', .22) + shadow(hx + 10, gy, 150, 20, .38) + shadow(bc[0] + 20, gy + 2, 56, 9, .22)
        + at(k.svg, hx, hy, s) + ball(bc[0], bc[1], LEN.ball * s, 1.6)
        + sparkle(bc[0] + 58, bc[1] - 46, 22) + sparkle(bc[0] - 58, bc[1] - 26, 14, '#FFF3C2') + dust(hx - 10, gy, 40, 8) + grade();
    } },

  { id: 'control-closeup', draw: () => {
      const fig = figure(POSES.touch), s = 3.1;
      const ip = instepPoint(fig.near), r = fig.near.rot * Math.PI / 180;
      const bl = [ip[0] + Math.sin(r) * LEN.ball, ip[1] - Math.cos(r) * LEN.ball];
      const tx = 1000 - bl[0] * s, ty = 470 - bl[1] * s;
      return `<g filter="url(#dof8)">${grassClose({ line: true })}</g>` + `<rect width="${WD}" height="${HD}" fill="#0B1F3A" opacity=".18"/>`
        + focusLines(1000, 470, 300, 90, 23, '#FFFFFF', .28, .016)
        + at(fig.svg, tx, ty, s) + ball(1000, 470, LEN.ball * s, 2.1)
        + `<path d="M 840,300 A 220 220 0 0 1 1180,330" fill="none" stroke="#FFFFFF" stroke-width="10" opacity=".55" stroke-linecap="round"/>`
        + `<path d="M 1220,560 A 240 240 0 0 1 1010,700" fill="none" stroke="#FFFFFF" stroke-width="6" opacity=".4" stroke-linecap="round"/>`
        + sparkle(1180, 330, 34) + sparkle(820, 380, 18, '#FFF3C2') + grade(.14);
    } },

  { id: 'boot-on-ball', draw: () => {
      const fig = figure(STEP), s = 2.3;
      const sp = solePoint(fig.near), bc0 = [sp[0], sp[1] + LEN.ball];
      const tx = 820 - bc0[0] * s, ty = 700 - bc0[1] * s, gy = ty + groundOff(fig) * s;
      return grassClose() + shadow(860, gy + 6, 240, 30, .4) + shadow(tx + fig.far.A[0] * s + 40, gy + 4, 150, 22, .35)
        + streaks(1900, 1040, 1300, 1060, 20, 29, '#E8FFD8', .35)
        + at(fig.svg, tx, ty, s) + ball(820, 700, LEN.ball * s, 2.6) + dust(700, gy, 60, 10) + grade(.14);
    } },

  { id: 'hero-reveal', draw: () => {
      const k = keyHero(), s = 1.32, gy = 1060, hx = 900, top = gy - k.ground * s;
      const bc = [hx + k.ball[0] * s, top + k.ball[1] * s];
      return lowBG() + `<circle cx="${hx}" cy="${top + 260 * s}" r="560" fill="#FFF6D8" opacity=".25" filter="url(#dof8)"/>`
        + shadow(hx + 10, gy, 230, 26, .4) + ball(bc[0], bc[1], LEN.ball * s, 2.6, { light: 'tl' }) + at(k.svg, hx, top, s)
        + flare(420, 250) + grade(.16);
    } },
];
