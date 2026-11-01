// Opening-scene environment: painted anime sky, clouds, stadium and pitch, built in real perspective.
// Each function returns an SVG fragment for one layer, so the layers can move independently (multiplane camera).
export const WD = 1920, HD = 1080;

export const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const fx = (n) => +n.toFixed(1);

/* camera: horizon H0, focal f, eye height h (m), centre cx */
export const CAM = {
  wide: { H0: 560, f: 760, h: 6, cx: 960 },
  mid: { H0: 470, f: 2100, h: 1.5, cx: 960, z0: 30 },
  low: { H0: 820, f: 2400, h: .45, cx: 960, z0: 20 },
};
const prj = (c, x, Y, z) => [c.cx + x * c.f / z, c.H0 + (c.h - Y) * c.f / z];
const pts = (a) => a.map((p) => `${fx(p[0])},${fx(p[1])}`).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}"${extra}/>`;

export const ENV_DEFS = `
<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2E8EE8"/><stop offset=".45" stop-color="#5FB6F5"/><stop offset=".8" stop-color="#A9DDFB"/><stop offset="1" stop-color="#DDF3FF"/>
</linearGradient>
<linearGradient id="skyUpG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1667CC"/><stop offset=".5" stop-color="#3E9BEE"/><stop offset="1" stop-color="#9AD6FA"/>
</linearGradient>
<radialGradient id="sunG"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".12" stop-color="#FFFDF0"/><stop offset=".3" stop-color="#FFF4C8" stop-opacity=".75"/><stop offset=".6" stop-color="#FFE9A8" stop-opacity=".25"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<linearGradient id="rayG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFBE6" stop-opacity=".5"/><stop offset="1" stop-color="#FFFBE6" stop-opacity="0"/></linearGradient>
<linearGradient id="hazeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF7FF" stop-opacity=".0"/><stop offset=".5" stop-color="#EAF7FF" stop-opacity=".55"/><stop offset="1" stop-color="#EAF7FF" stop-opacity="0"/></linearGradient>
<linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD36B"/><stop offset=".25" stop-color="#4DB653"/><stop offset="1" stop-color="#23863A"/></linearGradient>
<linearGradient id="roofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6274B4"/><stop offset="1" stop-color="#2C386E"/></linearGradient>
<linearGradient id="vignG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2A12" stop-opacity="0"/><stop offset="1" stop-color="#0B2A12" stop-opacity=".35"/></linearGradient>
<filter id="dof4" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="dof8" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="soft2"><feGaussianBlur stdDeviation="2"/></filter>
${grassPattern('grassTex', 96, 7, 1)}${grassPattern('grassTexBig', 220, 11, 2.4)}`;

function grassPattern(id, size, seed, k) {
  const R = rng(seed);
  let s = `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">`;
  const cols = ['#2F8F3E', '#9BE27A', '#1F7A33', '#5CC25A'];
  for (let i = 0; i < size * size / (60 * k); i++) {
    const x = R() * size, y = R() * size, l = (3 + R() * 6) * k;
    s += `<path d="M ${fx(x)},${fx(y)} q ${fx((R() - .5) * 2 * k)},${fx(-l * .6)} ${fx((R() - .5) * 3 * k)},${fx(-l)}" stroke="${cols[i % 4]}" stroke-width="${fx(.9 * k)}" stroke-linecap="round" opacity=".55" fill="none"/>`;
  }
  return s + `</pattern>`;
}

/* ---------------- sky + sun ---------------- */
export function sky(c, sun = [960, 380], o = {}) {
  let s = `<rect width="${WD}" height="${HD}" fill="url(#${o.up ? 'skyUpG' : 'skyG'})"/>`;
  const [sx, sy] = sun, rr = o.sunR || 520;
  // god rays
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + .2, w = .05 + (i % 3) * .025, L = 1900;
    s += `<polygon points="${sx},${sy} ${fx(sx + Math.cos(a - w) * L)},${fx(sy + Math.sin(a - w) * L)} ${fx(sx + Math.cos(a + w) * L)},${fx(sy + Math.sin(a + w) * L)}" fill="#FFFBE6" opacity="${(.07 + (i % 2) * .05).toFixed(2)}"/>`;
  }
  s += `<circle cx="${sx}" cy="${sy}" r="${rr}" fill="url(#sunG)"/>`;
  s += `<circle cx="${sx}" cy="${sy}" r="${rr * .11}" fill="#FFFFFF"/>`;
  return s;
}

/* ---------------- anime cumulus ---------------- */
let cloudN = 0;
export function cloud(cx, cy, w, seed = 1, o = {}) {
  const R = rng(seed), n = o.n || 9, puffs = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), hump = Math.sin(u * Math.PI);
    const r = w * (.09 + .13 * hump * (.6 + R() * .6));
    puffs.push([cx + (u - .5) * w * .9 + (R() - .5) * w * .05, cy - hump * w * .1 * (.6 + R() * .7) + (R() - .5) * w * .03, r]);
  }
  // a second, higher row of billows
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    const u = .2 + .6 * (i / Math.max(1, Math.ceil(n / 2) - 1));
    puffs.push([cx + (u - .5) * w * .8 + (R() - .5) * w * .06, cy - w * (.12 + R() * .1) * Math.sin(u * Math.PI), w * (.07 + R() * .09)]);
  }
  // gradient volume (white crown -> cool blue belly), billow shading, flat clipped base
  const top = Math.min(...puffs.map((p) => p[1] - p[2])), base = cy + w * .05, id = `cl${++cloudN}`;
  const box = `x="${fx(cx - w)}" y="${fx(top - 10)}" width="${fx(w * 2)}" height="${fx(base - top + 10)}"`;
  let s = `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${fx(top)}" x2="0" y2="${fx(base)}">`
    + `<stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FBFDFF"/><stop offset=".78" stop-color="#D3E4F8"/><stop offset="1" stop-color="${o.shade || '#A6C4EC'}"/></linearGradient>`;
  s += `<clipPath id="${id}c">${puffs.map((p) => `<circle cx="${fx(p[0])}" cy="${fx(p[1])}" r="${fx(p[2])}"/>`).join('')}</clipPath><clipPath id="${id}b"><rect ${box}/></clipPath>`;
  s += `<g clip-path="url(#${id}b)"><g clip-path="url(#${id}c)"><rect ${box} fill="url(#${id}g)"/>`;
  s += puffs.map((p) => `<circle cx="${fx(p[0] + p[2] * .2)}" cy="${fx(p[1] + p[2] * .32)}" r="${fx(p[2] * .95)}" fill="#B6CFF0" opacity=".3"/>`).join('');
  s += puffs.map((p) => `<circle cx="${fx(p[0] - p[2] * .1)}" cy="${fx(p[1] - p[2] * .16)}" r="${fx(p[2] * .76)}" fill="#FFFFFF" opacity=".85"/>`).join('');
  s += `</g></g>`;
  return `<g opacity="${o.op ?? 1}">${s}</g>`;
}
export function cloudsWide() {
  return cloud(260, 120, 620, 3) + cloud(1650, 110, 640, 7) + cloud(560, 300, 380, 11, { op: .95 }) + cloud(1390, 290, 400, 13, { op: .95 })
    + cloud(120, 380, 300, 17, { op: .9 }) + cloud(1830, 360, 320, 19, { op: .9 }) + cloud(960, 70, 260, 23, { op: .7 });
}

/* ---------------- stadium in perspective ---------------- */
const SEATS = ['#2059B8', '#A3123F', '#2059B8', '#F2C14E'];
function standSide(c, side, zN, zF, R, o = {}) {
  // stand profile: rises from pitch-side (x0, Y0) to the back (x1, Y1)
  const sg = side, x0 = 44 * sg, x1 = 78 * sg, Y0 = 1, Y1 = 26, tiers = 7;
  let s = '';
  for (let t = 0; t < tiers; t++) {
    const a = t / tiers, b = (t + 1) / tiers;
    const xa = x0 + (x1 - x0) * a, xb = x0 + (x1 - x0) * b, Ya = Y0 + (Y1 - Y0) * a, Yb = Y0 + (Y1 - Y0) * b;
    // sections alternate colour along z
    const secs = 9;
    for (let k = 0; k < secs; k++) {
      const za = zN + (zF - zN) * Math.pow(k / secs, 1.6), zb = zN + (zF - zN) * Math.pow((k + 1) / secs, 1.6);
      const col = SEATS[(k + t) % 2 ? 0 : 1];
      s += poly([prj(c, xa, Ya, za), prj(c, xb, Yb, za), prj(c, xb, Yb, zb), prj(c, xa, Ya, zb)], col);
    }
    // tier riser (darker step)
    s += poly([prj(c, xa, Ya, zN), prj(c, xa, Ya + .5, zN), prj(c, xa, Ya + .5, zF), prj(c, xa, Ya, zF)], '#0E1840', ' opacity=".5"');
  }
  // crowd: perspective-correct dots
  const cols = ['#F4D3B0', '#9C6B48', '#FFFFFF', '#A3123F', '#2059B8', '#F2C14E'];
  for (let row = 0; row < 26; row++) {
    const a = (row + .5) / 26, x = x0 + (x1 - x0) * a, Y = Y0 + (Y1 - Y0) * a + .3;
    let z = zN;
    while (z < zF) {
      const p = prj(c, x, Y, z), sz = .22 * c.f / z;
      if (p[0] > -40 && p[0] < WD + 40 && p[1] > -40 && p[1] < HD && R() > .25) {
        s += `<circle cx="${fx(p[0])}" cy="${fx(p[1])}" r="${fx(Math.max(.6, sz))}" fill="${cols[(R() * cols.length) | 0]}"/>`;
      }
      z += Math.max(.45, z * .018);
    }
  }
  if (o.roof === false) return s;
  // roof: canopy underside + bright fascia
  const rA = [x1 - 4 * sg, 30], rB = [x0 + 3 * sg, 32];
  s += poly([prj(c, rA[0], rA[1], zN), prj(c, rB[0], rB[1], zN), prj(c, rB[0], rB[1], zF), prj(c, rA[0], rA[1], zF)], 'url(#roofG)');
  for (let z = zN + 2; z < zF; z *= 1.22) s += `<polyline points="${pts([prj(c, rA[0], rA[1], z), prj(c, rB[0], rB[1], z)])}" stroke="#5E72B8" stroke-width="${fx(Math.max(1, 6 / z * 10))}" opacity=".7" fill="none"/>`;
  s += poly([prj(c, rB[0], rB[1], zN), prj(c, rB[0], rB[1] + 1.4, zN), prj(c, rB[0], rB[1] + 1.4, zF), prj(c, rB[0], rB[1], zF)], '#EEF3FF');
  s += poly([prj(c, rB[0], rB[1] - .6, zN), prj(c, rB[0], rB[1], zN), prj(c, rB[0], rB[1], zF), prj(c, rB[0], rB[1] - .6, zF)], '#9FB2E0');
  // ad boards along the touchline
  s += poly([prj(c, 40 * sg, 0, zN), prj(c, 40 * sg, 1, zN), prj(c, 40 * sg, 1, zF), prj(c, 40 * sg, 0, zF)], '#0E1840');
  for (let k = 0; k < 18; k++) {
    const za = zN + (zF - zN) * Math.pow(k / 18, 1.5), zb = zN + (zF - zN) * Math.pow((k + .94) / 18, 1.5);
    s += poly([prj(c, 40 * sg, .12, za), prj(c, 40 * sg, .9, za), prj(c, 40 * sg, .9, zb), prj(c, 40 * sg, .12, zb)], ['#A3123F', '#F2C14E', '#2059B8', '#FFFFFF'][k % 4]);
  }
  return s;
}
function standFar(c, z, R) {
  let s = '';
  const xL = -80, xR = 80, tiers = 5;
  for (let t = 0; t < tiers; t++) {
    const Ya = 1 + t * 2.6, Yb = Ya + 2.6, za = z + t * 3, zb = za + 3;
    for (let k = 0; k < 12; k++) {
      const xa = xL + (xR - xL) * k / 12, xb = xL + (xR - xL) * (k + 1) / 12;
      s += poly([prj(c, xa, Ya, za), prj(c, xb, Ya, za), prj(c, xb, Yb, zb), prj(c, xa, Yb, zb)], SEATS[(k + t) % 2 ? 0 : 1]);
    }
  }
  const cols = ['#F4D3B0', '#9C6B48', '#FFFFFF', '#A3123F', '#2059B8', '#F2C14E'];
  for (let row = 0; row < 14; row++) {
    const Y = 1.4 + row * .95, zz = z + row * 1.1;
    for (let x = xL; x < xR; x += .55) if (R() > .3) { const p = prj(c, x, Y, zz); s += `<circle cx="${fx(p[0])}" cy="${fx(p[1])}" r="${fx(Math.max(.5, .28 * c.f / zz))}" fill="${cols[(R() * 6) | 0]}"/>`; }
  }
  s += poly([prj(c, xL, 15.5, z + 15), prj(c, xR, 15.5, z + 15), prj(c, xR, 18.5, z + 12), prj(c, xL, 18.5, z + 12)], 'url(#roofG)');
  s += poly([prj(c, xL, 18.5, z + 12), prj(c, xR, 18.5, z + 12), prj(c, xR, 19.4, z + 12), prj(c, xL, 19.4, z + 12)], '#EEF3FF');
  s += poly([prj(c, -40, 0, z - 2), prj(c, 40, 0, z - 2), prj(c, 40, 1, z - 2), prj(c, -40, 1, z - 2)], '#0E1840');
  return s;
}
export function stadium(c, o = {}) {
  const R = rng(41);
  const zN = o.zN || 3.2, zF = o.zF || 112;
  let s = standFar(c, zF - 4, R) + standSide(c, -1, zN, zF, R, o) + standSide(c, 1, zN, zF, R, o);
  // atmospheric haze toward the horizon
  s += `<rect x="0" y="${c.H0 - 260}" width="${WD}" height="300" fill="url(#hazeG)"/>`;
  return s;
}

/* ---------------- pitch ---------------- */
export function pitch(c, o = {}) {
  const zN = o.zN || 2.4, zF = o.zF || 108, cz = o.centreZ ?? 31.6;
  let s = `<rect x="-200" y="${c.H0 + 2}" width="${WD + 400}" height="${HD}" fill="url(#grassG)"/>`;
  // lengthwise mowing stripes (converge to the vanishing point) + crosswise bands
  for (let i = -12; i < 12; i++) {
    if (i % 2) continue;
    s += poly([prj(c, i * 6.8, 0, zN), prj(c, (i + 1) * 6.8, 0, zN), prj(c, (i + 1) * 6.8, 0, zF), prj(c, i * 6.8, 0, zF)], '#FFFFFF', ' opacity=".07"');
  }
  for (let z = 6; z < zF; z *= 1.32) s += poly([prj(c, -80, 0, z), prj(c, 80, 0, z), prj(c, 80, 0, z * 1.15), prj(c, -80, 0, z * 1.15)], '#0B4A1C', ' opacity=".07"');
  s += `<rect x="-200" y="${c.H0}" width="${WD + 400}" height="${HD}" fill="url(#grassTex)" opacity=".8"/>`;
  // lines
  const line = (x0, z0, x1, z1, w = .14) => {
    const a = prj(c, x0, 0, Math.max(zN, z0)), b = prj(c, x1, 0, Math.max(zN, z1)), ww = Math.max(1.2, w * c.f / ((Math.max(zN, z0) + Math.max(zN, z1)) / 2));
    return `<line x1="${fx(a[0])}" y1="${fx(a[1])}" x2="${fx(b[0])}" y2="${fx(b[1])}" stroke="#F4FFF4" stroke-width="${fx(ww)}" opacity=".9" stroke-linecap="round"/>`;
  };
  const far = cz + 52.5;
  s += line(-34, zN, -34, far) + line(34, zN, 34, far) + line(-34, far, 34, far) + line(-34, cz, 34, cz);
  s += line(-20.16, far - 16.5, 20.16, far - 16.5) + line(-20.16, far - 16.5, -20.16, far) + line(20.16, far - 16.5, 20.16, far);
  s += line(-9.16, far - 5.5, 9.16, far - 5.5) + line(-9.16, far - 5.5, -9.16, far) + line(9.16, far - 5.5, 9.16, far);
  let circ = '';
  for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, p = prj(c, Math.cos(a) * 9.15, 0, cz + Math.sin(a) * 9.15); circ += `${fx(p[0])},${fx(p[1])} `; }
  s += `<polyline points="${circ}" fill="none" stroke="#F4FFF4" stroke-width="${fx(Math.max(1.4, .14 * c.f / cz))}" opacity=".9"/>`;
  const sp = prj(c, 0, 0, cz);
  s += `<ellipse cx="${fx(sp[0])}" cy="${fx(sp[1])}" rx="${fx(.25 * c.f / cz)}" ry="${fx(.09 * c.f / cz)}" fill="#F4FFF4"/>`;
  // far goal
  const g = (x, Y) => prj(c, x, Y, far);
  s += `<polyline points="${pts([g(-3.66, 0), g(-3.66, 2.44), g(3.66, 2.44), g(3.66, 0)])}" fill="none" stroke="#FFFFFF" stroke-width="${fx(Math.max(1.5, .12 * c.f / far))}"/>`;
  s += poly([g(-3.66, 0), g(-3.66, 2.44), g(3.66, 2.44), g(3.66, 0)], '#FFFFFF', ' opacity=".18"');
  s += `<rect x="0" y="${c.H0}" width="${WD}" height="${HD - c.H0}" fill="url(#vignG)"/>`;
  return s;
}

/* ---------------- sky looking up (ball high in the sky) ---------------- */
export function skyUp() {
  let s = sky(null, [1500, 230], { up: true, sunR: 620 });
  s += cloud(380, 300, 760, 31) + cloud(1300, 560, 900, 37) + cloud(1700, 140, 520, 43, { op: .9 }) + cloud(820, 820, 820, 47) + cloud(200, 760, 480, 53, { op: .95 });
  // stadium roof edges entering the bottom corners (camera tilted up)
  s += `<polygon points="0,1080 0,760 380,1080" fill="url(#roofG)"/><polygon points="0,760 380,1080 360,1080 0,782" fill="#EEF3FF"/>`;
  s += `<polygon points="1920,1080 1920,700 1440,1080" fill="url(#roofG)"/><polygon points="1920,700 1440,1080 1466,1080 1920,724" fill="#EEF3FF"/>`;
  for (let i = 1; i < 6; i++) s += `<line x1="0" y1="${760 + i * 64}" x2="${380 - i * 76}" y2="1080" stroke="#5E72B8" stroke-width="3" opacity=".5"/><line x1="1920" y1="${700 + i * 76}" x2="${1440 + i * 96}" y2="1080" stroke="#5E72B8" stroke-width="3" opacity=".5"/>`;
  return s;
}

/* ---------------- close-up grass (low camera, motion) ---------------- */
export function grassClose(o = {}) {
  let s = `<rect width="${WD}" height="${HD}" fill="url(#grassG)"/>`;
  s += `<rect width="${WD}" height="${HD}" fill="url(#grassTexBig)" opacity=".9"/>`;
  // mowing bands, white touchline running diagonally
  s += `<polygon points="0,${HD * .15} ${WD},${-HD * .1} ${WD},${HD * .3} 0,${HD * .55}" fill="#FFFFFF" opacity=".06"/>`;
  s += `<polygon points="0,${HD * .9} ${WD},${HD * .5} ${WD},${HD * .85} 0,${HD * 1.3}" fill="#FFFFFF" opacity=".06"/>`;
  if (o.line !== false) s += `<polygon points="0,${HD * .62} ${WD},${HD * .16} ${WD},${HD * .2} 0,${HD * .675}" fill="#F2FBEF" opacity=".92"/>`;
  // speed streaks
  const R = rng(5);
  for (let i = 0; i < 70; i++) {
    const y = R() * HD, x = R() * WD, l = 80 + R() * 260;
    s += `<line x1="${fx(x)}" y1="${fx(y)}" x2="${fx(x + l)}" y2="${fx(y - l * .32)}" stroke="${R() > .5 ? '#D9F7C8' : '#1C6E2E'}" stroke-width="${fx(1 + R() * 2.5)}" opacity="${fx(.15 + R() * .25)}" stroke-linecap="round"/>`;
  }
  // light from the upper right
  s += `<radialGradient id="gcl" cx=".85" cy="0" r="1"><stop offset="0" stop-color="#FFF6CC" stop-opacity=".35"/><stop offset="1" stop-color="#FFF6CC" stop-opacity="0"/></radialGradient><rect width="${WD}" height="${HD}" fill="url(#gcl)"/>`;
  s += `<rect width="${WD}" height="${HD}" fill="url(#vignG)"/>`;
  return s;
}
