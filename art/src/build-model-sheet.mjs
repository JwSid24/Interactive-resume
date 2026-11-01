// Builds art/model-sheet/jwan-sidou-model-sheet.svg — the reference every scene is drawn from.
// Flags: --heads / --bodies write quick preview sheets instead.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, DEFS, G } from './kit.mjs';
import { headFront, headQ, headSide, headBack, EXPR } from './head.mjs';
import { bodyFront, bodyQ, bodySide, bodyBack } from './body.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'model-sheet');
mkdirSync(root, { recursive: true });

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>${DEFS}</defs><rect width="${w}" height="${h}" fill="${C.PAPER}"/>${body}</svg>`;

const SANS = `'Segoe UI','Helvetica Neue',Arial,sans-serif`;
const JP = `'Yu Gothic','Meiryo','Hiragino Sans',sans-serif`;
const DISPLAY = `'Bebas Neue','Impact','Arial Narrow',sans-serif`;
const text = (x, y, str, size, o = {}) =>
  `<text x="${x}" y="${y}" font-family="${o.font || SANS}" font-size="${size}" font-weight="${o.weight || 600}" fill="${o.fill || C.INK}" text-anchor="${o.anchor || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${str}</text>`;
const rule = (x1, y1, x2, y2, col = '#CFC6B4', w = 1.5, dash = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const panel = (x, y, w, h, title, jp) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FBF8F1" stroke="#D9CFBC" stroke-width="2" rx="6"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="54" fill="${C.INK}" rx="6"/><rect x="${x}" y="${y + 40}" width="${w}" height="14" fill="${C.INK}"/>` +
  text(x + 22, y + 37, title, 24, { fill: '#F7F3EA', ls: 3 }) + text(x + w - 22, y + 37, jp, 22, { fill: C.GOLD, font: JP, anchor: 'end' });
/** Callout: dot on the art, leader line, label. */
const callout = (x1, y1, x2, y2, label, anchor = 'start') =>
  `<circle cx="${x1}" cy="${y1}" r="6" fill="${C.GAR}" stroke="#fff" stroke-width="2"/>` + rule(x1, y1, x2, y2, C.GAR, 2) +
  text(anchor === 'start' ? x2 + 8 : x2 - 8, y2 + 7, label, 21, { anchor, weight: 600 });
/** Zoomed crop of a drawing in HU space. */
const crop = (x, y, w, h, vb, inner) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" overflow="hidden">${inner}</svg>`;

if (process.argv.includes('--heads')) {
  const s = 3.2;
  const body = [
    G(headFront(EXPR.calm), `translate(330 360) scale(${s})`), G(headQ(EXPR.calm), `translate(1000 360) scale(${s})`),
    G(headSide(EXPR.calm), `translate(1650 360) scale(${s})`), G(headBack(), `translate(2300 360) scale(${s})`),
    ...['calm', 'focus', 'shout', 'smile'].map((k, i) => G(headQ(EXPR[k]), `translate(${330 + i * 650} 1060) scale(2.4)`)),
  ].join('');
  writeFileSync(resolve(root, '_heads.svg'), svg(2650, 1400, body));
  console.log('heads preview written');
} else if (process.argv.includes('--bodies')) {
  const body = [bodyFront(), bodyQ(), bodySide(), bodyBack()].map((b, i) => G(b, `translate(${260 + i * 420} 150) scale(1.25)`)).join('');
  writeFileSync(resolve(root, '_bodies.svg'), svg(1780, 1000, body));
  console.log('bodies preview written');
} else {
  const Wd = 4000, Hd = 3200, R2 = 1550;
  let b = '';
  // header
  b += `<rect width="${Wd}" height="118" fill="${C.INK}"/>`;
  b += text(48, 78, 'JWAN SIDOU', 64, { font: DISPLAY, fill: '#F7F3EA', weight: 400, ls: 4 }) + text(452, 78, '#18', 64, { font: DISPLAY, fill: C.GOLD, weight: 400 });
  b += text(590, 74, 'CHARACTER MODEL SHEET', 30, { fill: '#F7F3EA', ls: 6 }) + text(590, 100, 'キャラクター設定　ジュワン・シドウ', 20, { fill: C.GOLD, font: JP });
  b += text(Wd - 48, 66, 'CDM · Central Defensive Midfielder · 6.5 heads tall', 24, { fill: '#F7F3EA', anchor: 'end', weight: 500 });
  b += text(Wd - 48, 98, 'v4 · athletic build · espresso flow middle part + moustache · final approval', 20, { fill: '#B9AE9A', anchor: 'end', weight: 500 });

  // turnaround with head-unit guides
  const S = 1.6, top = 362, x0 = 60, x1 = 2880;
  b += panel(40, 150, 2860, 1360, 'TURNAROUND', 'ターンアラウンド');
  for (let i = 0; i <= 6.5; i += .5) {
    const y = top + i * 100 * S;
    b += rule(x0 + 40, y, x1 - 20, y, i % 1 ? '#E9E1D2' : '#D6CCB8', i % 1 ? 1 : 1.6, i % 1 ? '6 8' : '');
    if (i % 1 === 0) b += text(x0 + 30, y + 8, String(i), 20, { anchor: 'end', fill: '#A99D86' });
  }
  b += text(x0 + 30, top + 6.5 * 100 * S + 34, 'HU', 18, { anchor: 'end', fill: '#A99D86' });
  const views = [[bodyFront(), 'FRONT', '正面'], [bodyQ(), 'THREE-QUARTER', '斜め'], [bodySide(), 'SIDE', '横'], [bodyBack(), 'BACK', '背面']];
  views.forEach(([art, en, jp], i) => {
    const cx = 450 + i * 680;
    b += G(art, `translate(${cx} ${top}) scale(${S})`);
    b += text(cx, 1472, en, 26, { anchor: 'middle', ls: 4 }) + text(cx, 1500, jp, 20, { font: JP, fill: C.GAR, anchor: 'middle' });
  });

  // palette + spec column
  b += panel(2940, 150, 1020, 1360, 'COLOUR + SPEC', '色彩設定');
  const sw = [
    ['Skin', C.SKIN, C.SKIN_SH], ['Hair', C.HAIR, C.HAIR_SH, C.HAIR_HL], ['Eyes', '#6E3514', '#26100A', '#F2C27A'],
    ['Shirt garnet', C.GAR, '#5C1335'], ['Shirt blue', C.BLU, '#0E2E5E'], ['Gold trim', C.GOLD, C.GOLD_SH, C.GOLD_HL],
    ['Shorts', C.NAVY, C.NAVY_SH], ['Socks', C.SOCK, C.SOCK_SH], ['Boots', C.BOOT, C.BOOT_SH, C.BOOT_HL], ['Line ink', C.INK],
  ];
  sw.forEach(([name, ...cols], i) => {
    const y = 236 + i * 64;
    cols.forEach((c, j) => { b += `<rect x="${2980 + j * 66}" y="${y}" width="58" height="46" rx="4" fill="${c}" stroke="${C.INK}" stroke-width="1.5"/>`; });
    b += text(3200, y + 22, name, 22) + text(3200, y + 42, cols.join('  '), 16, { fill: '#8C806B', weight: 500, font: `'Consolas','Courier New',monospace` });
  });
  const notes = [
    'Hair: deep espresso brown (never black), warm sunlit streaks. Flow middle part,',
    '  volume at the roots, curtains over the temples, ends flick out at the nape.',
    'Moustache: thin to medium, dark brown, follows the upper lip, tapered ends.',
    '  Same shape in every expression. No beard, no stubble.',
    'Build: athletic footballer. Broad shoulders, V-taper, defined arms + thighs.',
    'Eyes: large warm brown, amber lower iris, sharp outer lash flick.',
    'Shading: two-tone cel. Skin shadow warm, fabric shadow cool violet.',
    'Line: outer silhouette 3.0, inner 1.6, details 1.0 (at 1 HU = 100).',
    'Kit: blaugrana stripes, no crest, no sponsors. Gold JWAN SIDOU 18.',
    'Boots: black, gold laces panel + gold side flash + gold heel tab.',
  ];
  notes.forEach((n, i) => { b += text(2980, 936 + i * 36, n, 20, { weight: 500 }); });

  // expressions
  b += panel(40, 1550, 1560, 1550, 'EXPRESSIONS', '表情');
  [['calm', 'CALM', '通常'], ['focus', 'FOCUSED', '集中'], ['shout', 'SPECIAL MOVE', '必殺技'], ['smile', 'CONFIDENT SMILE', '笑顔']].forEach(([k, en, jp], i) => {
    const cx = 420 + (i % 2) * 780, cy = 1760 + Math.floor(i / 2) * 700;
    b += `<rect x="${cx - 340}" y="${cy - 150}" width="680" height="640" fill="#F4EFE4" rx="6"/>`;
    b += G(`<path d="M -20,86 C -20,100 -20,112 -23,122 Q 0,134 23,122 C 20,112 20,100 20,86 Z" fill="${C.SKIN}" stroke="${C.INK}" stroke-width="3"/><path d="M -20,90 Q 2,114 20,92 L 20,106 Q 2,122 -20,106 Z" fill="${C.SKIN_SH}"/>` + headQ(EXPR[k]), `translate(${cx - 10} ${cy - 10}) scale(2.95)`);
    b += text(cx - 320, cy + 470, en, 24, { ls: 3 }) + text(cx + 320, cy + 470, jp, 22, { font: JP, fill: C.GAR, anchor: 'end' });
  });

  // hair details
  b += panel(1640, 1550, 1040, 1550, 'HAIR DETAILS', '髪型');
  b += G(headSide(EXPR.calm), `translate(2190 1900) scale(3.0)`);
  b += callout(2202, 1828, 2330, 1700, 'Volume lifts at the roots');
  b += text(2338, 1736, '(both sides of the part)', 18, { weight: 500, fill: '#8C806B' });
  b += callout(2154, 1843, 1700, 1740, 'Highlight streaks', 'start');
  b += text(1708, 1776, 'follow the flow', 18, { weight: 500, fill: '#8C806B' });
  b += callout(2268, 2038, 2380, 2130, 'Curtain over the temple');
  b += callout(2010, 2137, 1700, 2250, 'Ends flick out at the nape');
  b += G(headFront(EXPR.calm), `translate(1890 2600) scale(2.1)`);
  b += G(headBack(), `translate(2440 2600) scale(2.1)`);
  b += callout(1890, 2588, 1700, 2420, 'Clean centre part');
  b += callout(1907, 2768, 2010, 3040, 'Thin, groomed moustache');
  b += callout(2440, 2600, 2650, 2420, 'Part runs to the crown', 'end');

  // kit, boots, socks
  b += panel(2720, 1550, 1240, 1550, 'KIT · BOOTS · SOCKS', 'ユニフォーム');
  b += crop(2750, 1620, 580, 620, '-110 100 220 235', bodyBack());
  b += crop(3350, 1620, 580, 620, '-110 100 220 235', bodyFront());
  b += text(2770, 2270, 'Back: gold JWAN SIDOU arc + 18', 20) + text(3370, 2270, 'Front: garnet V-collar, gold edge', 20);
  b += crop(2750, 2300, 580, 700, '-45 440 120 225', bodySide());
  b += crop(3350, 2300, 580, 700, '-70 440 150 225', bodyFront());
  b += text(2770, 3040, 'Boot: black, gold lace panel,', 20) + text(2770, 3068, 'gold flash + heel tab, light studs', 20, { weight: 500 });
  b += text(3370, 3040, 'Socks: blue, garnet band', 20) + text(3370, 3068, 'with gold stripe, below the knee', 20, { weight: 500 });

  writeFileSync(resolve(root, 'jwan-sidou-model-sheet.svg'), svg(Wd, Hd, b));
  console.log('model sheet written');
}
