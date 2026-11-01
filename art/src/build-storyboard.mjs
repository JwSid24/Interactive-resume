// Contact sheet of the opening key poses (expects art/opening/png/*.png rendered from the frame SVGs).
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'opening');
const frames = [
  ['01-establishing', 'Establishing shot', 'Wide lens, sun behind the far stand'],
  ['02-ball-in-sky', 'Ball high in the sky', 'Camera tilts up, ball catches the sun'],
  ['03-ball-falling', 'Ball falling', 'Motion trail, shadow forming on the pitch'],
  ['04-jwandini-enters', 'Jwandini enters', 'Sprint in from the left, dust kick-up'],
  ['05-run-to-ball', 'Run to the ball', 'Medium shot, eyes on the dropping ball'],
  ['06-first-touch', 'First touch', 'Cushioned on the instep, arms for balance'],
  ['07-control-closeup', 'Control close-up', 'Ball kills dead on the boot, focus lines'],
  ['08-boot-on-ball', 'Boot on the ball', 'Low angle, socks + boots, grass streaks'],
  ['09-hero-reveal', 'Hero reveal', 'Low camera, sun behind, confident smile'],
];
const tw = 600, th = 338, gap = 36, cols = 3, W = cols * tw + (cols + 1) * gap, H = 130 + 3 * (th + 92);
let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
s += `<rect width="${W}" height="${H}" fill="#F7F3EA"/><rect width="${W}" height="96" fill="#241418"/>`;
s += `<text x="${gap}" y="62" font-family="Impact,'Arial Narrow',sans-serif" font-size="40" fill="#F7F3EA" letter-spacing="3">OPENING SCENE</text>`;
s += `<text x="${gap + 300}" y="60" font-family="'Segoe UI',Arial,sans-serif" font-size="22" fill="#E9B83A" letter-spacing="4">KEY POSES · LAYOUT PASS · FOR REVIEW</text>`;
frames.forEach(([f, t, d], i) => {
  const x = gap + (i % cols) * (tw + gap), y = 130 + Math.floor(i / cols) * (th + 92);
  s += `<rect x="${x - 3}" y="${y - 3}" width="${tw + 6}" height="${th + 6}" fill="#241418"/>`;
  s += `<image href="png/${f}.png" x="${x}" y="${y}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"/>`;
  s += `<text x="${x}" y="${y + th + 34}" font-family="'Segoe UI',Arial,sans-serif" font-size="22" font-weight="700" fill="#241418">${i + 1}. ${t}</text>`;
  s += `<text x="${x}" y="${y + th + 62}" font-family="'Segoe UI',Arial,sans-serif" font-size="18" fill="#7A6E5A">${d}</text>`;
});
writeFileSync(resolve(out, 'storyboard.svg'), s + '</svg>');
console.log('storyboard written', W, H);
