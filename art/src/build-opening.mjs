// Opening scene: background layers + key poses -> art/opening/{layers,frames}/*.svg (+ storyboard).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFS } from './kit.mjs';
import { BALL_DEFS } from './ball.mjs';
import { ENV_DEFS, WD, HD, CAM, sky, cloudsWide, stadium, pitch, skyUp, grassClose } from './env.mjs';
import { FRAMES } from './frames.mjs';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'opening');
for (const d of ['layers', 'frames']) mkdirSync(resolve(out, d), { recursive: true });
const svg = (body, bg = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WD} ${HD}" width="${WD}" height="${HD}"><defs>${DEFS}${BALL_DEFS}${ENV_DEFS}</defs>${bg}${body}</svg>`;

// background layers (transparent, stackable)
const layers = {
  '01-sky': sky(CAM.wide, [960, 380]),
  '02-clouds': cloudsWide(),
  '03-stadium': stadium(CAM.wide),
  '04-pitch': pitch(CAM.wide),
  '05-sky-up': skyUp(),
  '06-grass-closeup': grassClose(),
};
for (const [k, v] of Object.entries(layers)) writeFileSync(resolve(out, 'layers', `${k}.svg`), svg(v));

const only = process.argv[2];
FRAMES.forEach((fr, i) => {
  const name = `${String(i + 1).padStart(2, '0')}-${fr.id}`;
  if (only && !name.startsWith(only)) return;
  writeFileSync(resolve(out, 'frames', `${name}.svg`), svg(fr.draw()));
});
console.log('opening written');
