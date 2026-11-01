// Exports the opening scene as animation layers for the web player: public/assets/opening/*.svg + manifest.json.
// Every layer shares the 1920x1080 stage, so the approved compositions stay pixel-identical when stacked.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFS } from './kit.mjs';
import { BALL_DEFS, ballPattern, ballShade } from './ball.mjs';
import { ENV_DEFS, WD, HD, CAM, sky, cloud, cloudsWide, stadium, pitch, skyUp, grassClose } from './env.mjs';
import { focusLines, streaks, shadow, flare, STEP, groundOff } from './frames.mjs';
import { figure, POSES, LEN, solePoint, instepPoint, soleY, at } from './pose.mjs';
import { keyFirstTouch, keyRun, keyHero } from './keys.mjs';
import { headQ } from './head.mjs';
import { EXPR } from './head.mjs';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'opening');
mkdirSync(out, { recursive: true });
// only ship the gradients / filters / patterns a layer actually references
const DEF_MAP = new Map();
for (const m of (DEFS + BALL_DEFS + ENV_DEFS).matchAll(/<(linearGradient|radialGradient|filter|pattern)\b[^>]*id="([^"]+)"[\s\S]*?<\/\1>/g)) DEF_MAP.set(m[2], m[0]);
const defsFor = (body) => { const ids = new Set([...body.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])); return `<defs>${[...ids].map((id) => DEF_MAP.get(id) || '').join('')}</defs>`; };
const stage = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WD} ${HD}" width="${WD}" height="${HD}">${defsFor(body)}${body}</svg>`;
const box = (body, w, h, x0 = 0, y0 = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="${w}" height="${h}">${defsFor(body)}${body}</svg>`;
const files = {};
const put = (name, svg) => { writeFileSync(resolve(out, `${name}.svg`), svg); files[name] = `${name}.svg`; };
const M = { stage: [WD, HD], shots: {} };

/* ---- shot 1 + 3: wide stadium (separate planes for parallax) ---- */
put('wide-sky', stage(sky(CAM.wide, [960, 380])));
put('wide-clouds', stage(cloudsWide()));
put('wide-stadium', stage(stadium(CAM.wide)));
put('wide-pitch', stage(pitch(CAM.wide)));
/* ---- shot 2: sky, camera tilted up ---- */
put('sky-up', stage(skyUp()));
/* ---- shots 4 + 5: medium camera ---- */
put('mid-sky', stage(sky(CAM.mid, [1500, 160], { sunR: 600 }) + cloud(380, 150, 640, 61) + cloud(1300, 230, 520, 67, { op: .95 })));
put('mid-ground', stage(`<g filter="url(#dof4)">${stadium(CAM.mid, { zN: 8, roof: false })}</g>` + pitch(CAM.mid, { zN: 4, centreZ: 60 })));
/* ---- shots 6 + 7: close-up grass ---- */
put('close-grass-blur', stage(`<g filter="url(#dof8)">${grassClose({ line: true })}</g><rect width="${WD}" height="${HD}" fill="#0B1F3A" opacity=".18"/>`));
put('close-grass', stage(grassClose()));
/* ---- shot 8: low camera ---- */
put('low-sky', stage(sky(CAM.low, [420, 250], { sunR: 700 }) + cloud(1450, 180, 700, 71) + cloud(520, 520, 560, 73, { op: .9 }) + cloud(1700, 560, 420, 79, { op: .9 })));
put('low-ground', stage(`<g filter="url(#dof4)">${stadium(CAM.low, { zN: 10 })}</g>` + pitch(CAM.low, { zN: 3, centreZ: 40 })));
put('low-flare', stage(flare(420, 250)));

/* ---- ball: spinning pattern + fixed shade, 256px box centred on the ball ---- */
put('ball-pattern', box(ballPattern(120), 256, 256, -128, -128));
put('ball-shade', box(ballShade(120), 256, 256, -128, -128));
put('ball-shade-tl', box(ballShade(120, 'tl'), 256, 256, -128, -128));
M.ball = { box: 256, r: 120 };

/* ---- FX plates ---- */
put('fx-focus', stage(focusLines(960, 540, 360, 90, 23, '#FFFFFF', .3, .016)));
put('fx-speed', stage(streaks(1920, 540, 0, 540, 70, 13, '#FFFFFF', .5, [120, 420])));
put('fx-speed-down', stage(streaks(960, 1080, 960, 0, 40, 5, '#FFFFFF', .5, [120, 380])));

/* ---- shot 3: wide-shot run cycle (6 drawings, 10 fps), runner hip at (0,0) of a 900x900 box ---- */
const cyc = [];
for (let i = 0; i < 6; i++) {
  const p = i / 6, c = Math.cos(p * Math.PI * 2), sn = Math.sin(p * Math.PI * 2);
  const pose = { ...POSES.run1,
    legs: { near: { th: 36 * c + 4, kn: 18 + 74 * Math.max(0, -sn), ft: -6 + 30 * Math.max(0, -sn) }, far: { th: -36 * c + 4, kn: 18 + 74 * Math.max(0, sn), ft: -6 + 30 * Math.max(0, sn) } },
    arms: { near: { up: -40 * c, lo: 88 }, far: { up: 40 * c, lo: 88 } } };
  const fig = figure(pose), g = groundOff(fig);
  put(`run-${i}`, box(fig.svg, 900, 900, -450, -450));
  cyc.push(+(g).toFixed(1));
}
M.run = { box: 900, hip: [450, 450], ground: cyc };

/* ---- character cels positioned exactly as in the approved key frames ---- */
{ // shot 4: run to the ball
  const k = keyRun(), s = 1.3, gy = 1040, hx = 820, hy = gy - (k.ground + 30) * s;
  put('cel-run', stage(shadow(hx, gy, 210, 24, .34) + at(k.svg, hx, hy, s)));
  M.shots.run = { hip: [hx, hy], ball: { from: [1480, -140], to: [1480, 150], r: 50 } };
}
{ // shot 5: first touch
  const k = keyFirstTouch(), s = 1.05, gy = 1040, hx = 800, hy = gy - k.ground * s;
  const bc = [hx + k.ball[0] * s, hy + k.ball[1] * s];
  put('cel-touch', stage(shadow(hx + 10, gy, 150, 20, .38) + at(k.svg, hx, hy, s)));
  M.shots.touch = { hip: [hx, hy], ball: { at: bc.map((v) => +v.toFixed(1)), r: LEN.ball * s }, ground: gy };
}
{ // shot 6: control close-up
  const fig = figure(POSES.touch), s = 3.1;
  const ip = instepPoint(fig.near), r = fig.near.rot * Math.PI / 180;
  const bl = [ip[0] + Math.sin(r) * LEN.ball, ip[1] - Math.cos(r) * LEN.ball];
  put('cel-close', stage(at(fig.svg, 1000 - bl[0] * s, 470 - bl[1] * s, s)));
  M.shots.close = { ball: { at: [1000, 470], r: LEN.ball * s } };
}
{ // shot 7: boot on the ball
  const fig = figure(STEP), s = 2.3;
  const sp = solePoint(fig.near), bc0 = [sp[0], sp[1] + LEN.ball];
  const tx = 820 - bc0[0] * s, ty = 700 - bc0[1] * s, gy = ty + groundOff(fig) * s;
  put('cel-step', stage(shadow(tx + fig.far.A[0] * s + 40, gy + 4, 150, 22, .35) + at(fig.svg, tx, ty, s)));
  put('cel-step-shadow', stage(shadow(860, gy + 6, 240, 30, .4)));
  M.shots.step = { ball: { at: [820, 700], r: LEN.ball * s }, ground: gy };
}
{ // shot 8: hero reveal
  const k = keyHero(), s = 1.32, gy = 1060, hx = 900, top = gy - k.ground * s;
  const bc = [hx + k.ball[0] * s, top + k.ball[1] * s];
  put('cel-hero', stage(at(k.svg, hx, top, s)));
  put('cel-hero-shadow', stage(shadow(hx + 10, gy, 230, 26, .4)));
  M.shots.hero = { ball: { at: bc.map((v) => +v.toFixed(1)), r: LEN.ball * s }, face: [hx + 10, top + 90 * s] };
}
/* ---- special-move cut-in: the approved head, shouting (box centred on the face) ---- */
{
  const neck = '<path d="M -22,84 C -22,100 -22,112 -26,128 Q 0,142 26,128 C 22,112 22,100 22,86 Z" fill="#F4C6A0" stroke="#241418" stroke-width="3"/>'
    + '<path d="M -22,90 Q 2,116 22,92 L 22,108 Q 2,124 -22,108 Z" fill="#DC9970"/>';
  const collar = '<path d="M -80,150 Q -60,124 -24,120 L 0,146 L 26,120 Q 62,124 82,150 L 82,170 L -80,170 Z" fill="#0C4FA3" stroke="#241418" stroke-width="3"/>'
    + '<path d="M -24,120 L 0,146 L 26,120 L 30,124 L 0,156 L -28,124 Z" fill="#A3123F" stroke="#241418" stroke-width="2"/>';
  put('face-shout', box(collar + neck + headQ(EXPR.shout), 240, 260, -120, -96));
  put('face-focus', box(collar + neck + headQ(EXPR.focus), 240, 260, -120, -96));
}

/* ---- goal mouth, seen from the edge of the box: frame in front, net behind (separate for the ripple) ---- */
{
  const F = { l: 420, r: 1500, top: 250, gnd: 880 }, B = { l: 540, r: 1380, top: 340, gnd: 800 };
  let net = `<polygon points="${F.l},${F.top} ${F.r},${F.top} ${F.r},${F.gnd} ${F.l},${F.gnd}" fill="#FFFFFF" opacity=".06"/>`;
  net += `<polygon points="${B.l},${B.top} ${B.r},${B.top} ${B.r},${B.gnd} ${B.l},${B.gnd}" fill="#0E2A52" opacity=".12"/>`;
  const line = (x1, y1, x2, y2, w = 1.6, o = .7) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FFFFFF" stroke-width="${w}" opacity="${o}"/>`;
  for (let i = 0; i <= 24; i++) { const x = B.l + (B.r - B.l) * i / 24; net += line(x, B.top, x, B.gnd); }
  for (let j = 0; j <= 14; j++) { const y = B.top + (B.gnd - B.top) * j / 14; net += line(B.l, y, B.r, y); }
  for (let j = 0; j <= 10; j++) {
    const t = j / 10;
    net += line(F.l, F.top + (F.gnd - F.top) * t, B.l, B.top + (B.gnd - B.top) * t) + line(F.r, F.top + (F.gnd - F.top) * t, B.r, B.top + (B.gnd - B.top) * t);
  }
  for (let i = 0; i <= 20; i++) { const t = i / 20; net += line(F.l + (F.r - F.l) * t, F.top, B.l + (B.r - B.l) * t, B.top); }
  for (let k = 1; k < 6; k++) { const t = k / 6; const xl = F.l + (B.l - F.l) * t, xr = F.r + (B.r - F.r) * t, yt = F.top + (B.top - F.top) * t, yb = F.gnd + (B.gnd - F.gnd) * t;
    net += line(xl, yt, xl, yb, 1.2, .55) + line(xr, yt, xr, yb, 1.2, .55) + line(xl, yt, xr, yt, 1.2, .55); }
  put('goal-net', stage(net));
  const post = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#241418" stroke-width="34" stroke-linecap="square"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#F4F6FA" stroke-width="26" stroke-linecap="square"/>`;
  let frame = post(F.l, F.gnd, F.l, F.top) + post(F.l, F.top, F.r, F.top) + post(F.r, F.top, F.r, F.gnd);
  frame += `<line x1="${F.l - 6}" y1="${F.top + 14}" x2="${F.l - 6}" y2="${F.gnd}" stroke="#B9C2D6" stroke-width="7"/><line x1="${F.r - 6}" y1="${F.top + 14}" x2="${F.r - 6}" y2="${F.gnd}" stroke="#B9C2D6" stroke-width="7"/>`;
  frame += `<line x1="${F.l}" y1="${F.top + 8}" x2="${F.r}" y2="${F.top + 8}" stroke="#B9C2D6" stroke-width="6"/>`;
  frame += shadow(960, F.gnd + 6, 620, 18, .25);
  put('goal-frame', stage(frame));
  M.goal = { front: F, back: B, corner: [1360, 360] };
}
M.files = files;
writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(M, null, 1));
console.log('scene assets:', Object.keys(files).length);
