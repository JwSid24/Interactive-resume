// Scroll choreography for the portfolio. Each scene is a pinned stage driven by one scrubbed timeline, and each
// one ends in the colour and framing the next scene starts with, so the page plays as one continuous camera move.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/* The tech-stack in a 4-2-3-1, as fractions of the field: landscape attacks left to right (portrait attacks up).
   Order matches cv.squad.players: GK, LB, CB, CB, RB, CDM, CDM, LAM, CAM, RAM, ST. */
const SQUAD_SPOTS = [[.1, .5], [.26, .13], [.24, .38], [.24, .62], [.26, .87], [.42, .34], [.42, .66], [.6, .16], [.59, .5], [.6, .84], [.8, .5]];
const STAFF_SPOTS = { land: [[.3, 1.1], [.7, 1.1]], port: [[.2, 1.1], [.8, 1.1]] };
export const SQUAD_LINKS = [[0, 2], [0, 3], [1, 2], [2, 3], [3, 4], [1, 5], [2, 5], [3, 6], [4, 6], [5, 6], [5, 7], [5, 8], [6, 8], [6, 9], [7, 8], [8, 9], [7, 10], [8, 10], [9, 10]];

const PAPER = '#F5F1E8', NIGHT = '#0A1428', CLUB = '#3A0A24';
const FULL = 'inset(0% 0% 0% 0% round 0px)';
const FACE = [910 / 1920, 318.16 / 1080];          // the hero's face in plate coordinates: the camera's anchor

/* where each nav target sits on the scroll, and which scene a focused element belongs to */
const marks = new Map<string, () => number>();
const sceneOf = new Map<string, ScrollTrigger>();
const driven: (() => void)[] = [];      // custom-driven timelines, for the dev settle hook

export function scrollToScene(id: string, motion: boolean) {
  const behavior: ScrollBehavior = motion ? 'smooth' : 'auto';
  if (id === 'top') return window.scrollTo({ top: 0, behavior });
  const mark = motion ? marks.get(id) : undefined;
  if (mark) return window.scrollTo({ top: mark(), behavior });
  document.getElementById(id)?.scrollIntoView({ behavior });
}

export function setupMotion(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  let mm: gsap.MatchMedia | null = null;
  let dead = false;
  const start = () => {
    if (dead) return;
    mm = gsap.matchMedia(root);
    mm.add({ wide: '(min-width: 800px) and (min-aspect-ratio: 1/1)', narrow: '(max-width: 799px), (max-aspect-ratio: 1/1)' },
      (c) => build(root, !!c.conditions!.wide));
  };
  // split text only once the display fonts are in, so line breaks are measured on the real glyphs
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  return () => { dead = true; mm?.revert(); marks.clear(); sceneOf.clear(); driven.length = 0; };
}

function build(root: HTMLElement, wide: boolean) {
  const $ = <T extends Element = HTMLElement>(k: string) => root.querySelector(`[data-k="${k}"]`) as unknown as T;
  const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll(sel)) as T[];
  const off: (() => void)[] = [];
  const on = (t: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => { t.addEventListener(type, fn, opts); off.push(() => t.removeEventListener(type, fn)); };
  const fine = matchMedia('(pointer: fine)').matches;
  const pointer = { x: 0, y: 0 };      // normalised -1..1 from the viewport centre
  if (fine) on(window, 'pointermove', (e: PointerEvent) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  /* ---------------- typography reveals (masked lines) ---------------- */
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } }),
    });
  });
  $$('[data-fade]').forEach((el) => gsap.from(el, { y: 32, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }));
  $$('[data-stagger]').forEach((el) => gsap.from(el.children, { y: 24, opacity: 0, duration: .7, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }));

  /* ================= 01 → 02  kick-off: the ball drops in, then the profile card ================= */
  const kick = root.querySelector('[data-kick]') as HTMLElement;
  const stage = $('stage'), frame = $('frame');
  const covers = [$('back'), $('front')];
  const layers = { sky: $('sky'), ground: $('ground'), fig: $('fig'), flare: $('flare') };
  gsap.set(Object.values(layers), { transformOrigin: `${FACE[0] * 100}% ${FACE[1] * 100}%` });
  // the card the hero shrinks into, and how far the plate must travel so his face lands in its centre
  const card = wide ? [13, 7, 9, 55] : [11, 9, 47, 9];      // top, right, bottom, left in %
  const cardClip = `inset(${card[0]}% ${card[1]}% ${card[2]}% ${card[3]}% round ${wide ? 28 : 22}px)`;
  const faceShift = () => {
    const vw = innerWidth, vh = innerHeight, pw = Math.max(vw, vh * 16 / 9), ph = Math.max(vh, vw * 9 / 16);
    const fx = vw / 2 + (FACE[0] - .5) * pw, fy = vh / 2 + (FACE[1] - .5) * ph;
    const cx = vw * (card[3] + (100 - card[1] - card[3]) / 2) / 100, cy = vh * (card[0] + (100 - card[0] - card[2]) / 2) / 100;
    return { x: cx - fx, y: cy - fy * (wide ? 1 : 1) + (wide ? vh * .08 : vh * .05) };
  };

  // arrival: letters rise out of their masks while the camera settles
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from($$('[data-depth]', stage), { scale: 1.16, duration: 2.4, ease: 'power3.out', stagger: .06 }, 0)
    .from([$('n1'), $('n2')], { yPercent: 115, duration: 1.4, stagger: .12 }, .2)
    .from($$('[data-intro]', stage), { y: 30, opacity: 0, duration: 1.1, stagger: .08 }, .55);

  // One timeline for the whole kick-off scene, in four phases: 0-1 a ball drops in and the camera follows it down
  // to his feet, 1-2 hero to profile card, 2-3 drift while the profile scrolls past, 3-4 the card opens and the
  // camera pushes in to navy. A single timeline means phases that touch the same properties never fight.
  const aboutIn = root.querySelector('#about [data-scene]') as HTMLElement;
  const fs = () => faceShift();
  // elements that start hidden get their first state now: rewinding the timeline restores these values
  gsap.set($('outline'), { opacity: 0, scale: .75, xPercent: -10 });
  gsap.set($('cardui'), { opacity: 0, y: 30 });
  // on portrait screens the plate rests a little lower, so the name reads above his head
  const rest = () => (wide ? 0 : innerHeight * .12);
  gsap.set(covers, { y: rest() });
  const drop = $('drop'), spin = $('spin'), rball = $('rball'), bshadow = $('bshadow'), photo = $('photo'), photoIn = $('photoin');
  gsap.set(drop, { yPercent: -100 });
  gsap.set(rball, { opacity: 0 });
  gsap.set(bshadow, { xPercent: -50, yPercent: -50, scale: .2, opacity: 0 });
  gsap.set(photo, { opacity: 0 });
  // the camera follows the ball by pushing in towards the spot where it lands (just in front of his boot)
  const LAND = [860.4 / 1920, 1007.2 / 1080];
  const landOrigin = () => {
    const vw = innerWidth, vh = innerHeight, pw = Math.max(vw, vh * 16 / 9), ph = Math.max(vh, vw * 9 / 16);
    return `${vw / 2 + (LAND[0] - .5) * pw}px ${vh / 2 + (LAND[1] - .5) * ph}px`;
  };
  const push = wide ? 1.28 : 1.3;
  const kTl = gsap.timeline({ paused: true, defaults: { ease: 'none', immediateRender: false } });
  // phase 0: the ball drops out of the sky, bounces twice and settles under his boot; the camera follows it
  kTl.fromTo($('ui'), { opacity: 1, y: 0 }, { opacity: 0, y: -50, duration: .25 }, 0)
    .fromTo(covers, { y: rest, scale: 1, transformOrigin: landOrigin }, { y: 0, scale: push, duration: .45, ease: 'power2.inOut' }, .05)
    .fromTo(drop, { yPercent: -100 }, { yPercent: 0, duration: .5, ease: 'power2.in' }, .02)
    .fromTo(drop, { yPercent: 0 }, { yPercent: -9, duration: .1, ease: 'power2.out' }, .52)
    .fromTo(drop, { yPercent: -9 }, { yPercent: 0, duration: .1, ease: 'power2.in' }, .62)
    .fromTo(drop, { yPercent: 0 }, { yPercent: -2.5, duration: .05, ease: 'power2.out' }, .72)
    .fromTo(drop, { yPercent: -2.5 }, { yPercent: 0, duration: .05, ease: 'power2.in' }, .77)
    .fromTo(spin, { rotation: 0 }, { rotation: 620, duration: .82, ease: 'power1.out' }, .02)
    .fromTo(bshadow, { scale: .2, opacity: 0 }, { scale: 1, opacity: .55, duration: .42, ease: 'power2.in' }, .1)
    .fromTo(bshadow, { scale: 1, opacity: .55 }, { scale: .8, opacity: .4, duration: .1 }, .52)
    .fromTo(bshadow, { scale: .8, opacity: .4 }, { scale: 1, opacity: .55, duration: .1 }, .62)
    .fromTo($('tilt'), { y: 0 }, { y: 9, duration: .025 }, .52)
    .fromTo($('tilt'), { y: 9 }, { y: 0, duration: .16, ease: 'elastic.out(1, .3)' }, .545)
    .fromTo(drop, { autoAlpha: 1 }, { autoAlpha: 0, duration: .01 }, .83)
    .fromTo(rball, { opacity: 0 }, { opacity: 1, duration: .01 }, .83)
    .fromTo(covers, { y: 0, scale: push }, { y: rest, scale: 1, duration: .17, ease: 'power2.inOut' }, .83)
    // phase 1: hero to profile card
    .fromTo($('m1'), { xPercent: 0, opacity: 1 }, { xPercent: -70, opacity: 0, duration: .45 }, 1)
    .fromTo($('m2'), { xPercent: 0, opacity: 1 }, { xPercent: 70, opacity: 0, duration: .45 }, 1)
    .fromTo(layers.sky, { scale: 1 }, { scale: 1.1, duration: .75 }, 1)
    .fromTo(layers.ground, { scale: 1 }, { scale: 1.28, duration: .75 }, 1)
    .fromTo(layers.fig, { scale: 1 }, { scale: wide ? 1.7 : 1.6, duration: .75 }, 1)
    .fromTo(layers.flare, { opacity: 1 }, { opacity: 0, duration: .3 }, 1)
    .fromTo(covers, { x: 0, y: rest }, { x: () => fs().x, y: () => fs().y, duration: .5, ease: 'power2.inOut' }, 1.28)
    .fromTo(frame, { clipPath: FULL }, { clipPath: cardClip, duration: .45, ease: 'power2.inOut' }, 1.3)
    .fromTo(stage, { backgroundColor: NIGHT }, { backgroundColor: PAPER, duration: .35 }, 1.32)
    .fromTo([$('scrim'), $('shade')], { opacity: 1 }, { opacity: 0, duration: .3 }, 1.3)
    .fromTo($('outline'), { opacity: 0, scale: .75, xPercent: -10 }, { opacity: 1, scale: 1, xPercent: 0, duration: .5 }, 1.4)
    // the card settles, then the photo slot takes over from the character
    .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: .2 }, 1.62)
    .fromTo(photoIn, { scale: 1.18 }, { scale: 1, duration: .38 }, 1.62)
    .fromTo($('cardui'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .22 }, 1.78)
    // phase 2: drift
    .fromTo(layers.fig, { scale: wide ? 1.7 : 1.6 }, { scale: wide ? 1.9 : 1.75, duration: 1 }, 2)
    .fromTo(photoIn, { scale: 1 }, { scale: 1.06, duration: 1 }, 2)
    .fromTo($('outline'), { yPercent: 0 }, { yPercent: -18, duration: 1 }, 2)
    // phase 3: the photo gives way to the pitch, the card opens and the camera pushes into navy (the skills board)
    .fromTo($('cardui'), { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: .15 }, 3)
    .fromTo(photo, { opacity: 1 }, { opacity: 0, duration: .2 }, 3)
    .fromTo(photoIn, { scale: 1.06 }, { scale: 1.25, duration: .2 }, 3)
    .fromTo(frame, { clipPath: cardClip }, { clipPath: FULL, duration: .6, ease: 'power2.inOut' }, 3)
    .fromTo(covers, { x: () => fs().x, y: () => fs().y }, { x: 0, y: rest, duration: .6, ease: 'power2.inOut' }, 3)
    .fromTo(layers.fig, { scale: wide ? 1.9 : 1.75 }, { scale: 4.2, duration: 1, ease: 'power2.in' }, 3)
    .fromTo(layers.ground, { scale: 1.28 }, { scale: 2, duration: 1 }, 3)
    .fromTo($('outline'), { opacity: 1 }, { opacity: 0, duration: .3 }, 3)
    .fromTo($('exit'), { opacity: 0 }, { opacity: 1, duration: .45 }, 3.55)
    .fromTo(stage, { backgroundColor: PAPER }, { backgroundColor: NIGHT, duration: .3 }, 3.6);
  // scroll positions where each phase starts and ends, re-measured on every refresh
  let bounds = [0, 1, 2, 3, 4];
  const kTime = (y: number) => {
    for (let i = 0; i < 4; i++) if (y <= bounds[i + 1] || i === 3) return Math.min(4, i + Math.max(0, (y - bounds[i]) / Math.max(1, bounds[i + 1] - bounds[i])));
    return 4;
  };
  let kTarget = 0;
  const kDrive = (instant: boolean) => {
    kTarget = kTime(scrollY);
    // a full sweep initialises every phase, so jumping back over one restores its start state
    if (instant) { gsap.killTweensOf(kTl); kTl.progress(1); kTl.time(kTarget); }
    else gsap.to(kTl, { time: kTarget, duration: .9, ease: 'power3.out', overwrite: true });
  };
  const kickSt = ScrollTrigger.create({
    trigger: kick, start: 'top top', end: 'bottom bottom', pin: stage, pinSpacing: false,
    onUpdate: () => kDrive(false),
    onRefresh: (self) => {
      const s0 = self.start, end = self.end, sd = s0 + innerHeight * .9, s1 = sd + innerHeight * 1.1;
      const s2 = Math.min(end - innerHeight * .4, Math.max(s1 + 1, aboutIn.getBoundingClientRect().bottom + scrollY - innerHeight * .15));
      bounds = [s0, sd, s1, s2, end];
      kTl.invalidate();
      kDrive(true);
    },
  });
  const settleKick = () => kDrive(true);
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __kTl: gsap.core.Timeline }).__kTl = kTl;
  driven.push(settleKick);
  off.push(() => { gsap.killTweensOf(kTl); driven.splice(driven.indexOf(settleKick), 1); });
  sceneOf.set('top', kickSt);
  marks.set('about', () => aboutIn.getBoundingClientRect().top + scrollY - 90);

  // hover depth: layers drift against the pointer, and the card tilts once it exists
  if (fine) {
    const pars = $$('[data-depth]', stage).map((el) => ({ d: +el.dataset.depth!, x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: .9, ease: 'power3' }) }));
    const nameX = gsap.quickTo($('name'), 'x', { duration: 1, ease: 'power3' });
    const tilt = $('tilt'), rx = gsap.quickTo(tilt, 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo(tilt, 'rotationY', { duration: .8, ease: 'power3' });
    on(window, 'pointermove', () => {
      if (stage.getBoundingClientRect().bottom < 0) return;
      pars.forEach((p) => { p.x(-pointer.x * p.d * 26); p.y(-pointer.y * p.d * 14); });
      nameX(pointer.x * 18);
      const kt = kTl.time(), k = Math.max(0, Math.min(1, kt - 1)) * (1 - Math.max(0, Math.min(1, (kt - 3) / .4)));
      rx(-pointer.y * 7 * k); ry(pointer.x * 9 * k);
    }, { passive: true });
  }

  /* ================= 03  the tech-stack lines up in a 4-2-3-1 ================= */
  const sk = root.querySelector('#skills') as HTMLElement;
  const field = $('field'), pitch = $('pitch'), net = $<SVGSVGElement>('net');
  const toks = $$('[data-tok]', sk).sort((a, b) => +a.dataset.tok! - +b.dataset.tok!);
  const staff = $$('[data-staff]', sk).sort((a, b) => +a.dataset.staff! - +b.dataset.staff!);
  const spots = [...SQUAD_SPOTS.map(([x, y]) => (wide ? [x, y] : [y, 1 - x])), ...STAFF_SPOTS[wide ? 'land' : 'port']];
  const fw = () => field.clientWidth, fh = () => field.clientHeight;
  const spotX = (i: number) => spots[i][0] * fw(), spotY = (i: number) => spots[i][1] * fh();
  const scatterX = (i: number) => fw() / 2 + Math.cos(i * 2.4) * Math.max(fw(), fh()) * .8;
  const scatterY = (i: number) => fh() / 2 + Math.sin(i * 2.4) * Math.max(fw(), fh()) * .55;
  const line = (n: number) => toks.filter((el) => +el.dataset.line! === n);
  const idx = (el: HTMLElement) => +el.dataset.tok!;
  gsap.set([...toks, ...staff], { xPercent: -50, yPercent: -50 });
  // chalk lines: measured once per layout, drawn by one progress value
  const draws = $$<SVGPathElement>('[data-draw]', sk).map((p) => ({ p, len: p.getTotalLength() }));
  draws.forEach(({ p, len }) => gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }));
  const lines = $$<SVGLineElement>('[data-link]', sk).map((l) => ({ l, ab: l.dataset.link!.split('-').map(Number), len: 0 }));
  const net$ = { v: 0 };
  const layoutNet = () => {
    net.setAttribute('viewBox', `0 0 ${fw()} ${fh()}`);
    lines.forEach((o) => {
      const [a, b] = o.ab, x1 = spotX(a), y1 = spotY(a), x2 = spotX(b), y2 = spotY(b);
      o.l.setAttribute('x1', `${x1}`); o.l.setAttribute('y1', `${y1}`); o.l.setAttribute('x2', `${x2}`); o.l.setAttribute('y2', `${y2}`);
      o.len = Math.hypot(x2 - x1, y2 - y1);
      o.l.style.strokeDasharray = `${o.len}`; o.l.style.strokeDashoffset = `${o.len * (1 - net$.v)}`;
    });
  };
  layoutNet();
  ScrollTrigger.addEventListener('refresh', layoutNet);
  off.push(() => ScrollTrigger.removeEventListener('refresh', layoutNet));
  const chalk = { v: 0 };
  // each line of the formation runs on in turn: keeper and back four, the two holding midfielders, then the attack
  const runOn = (els: HTMLElement[]) => [els, { x: (i: number) => scatterX(idx(els[i])), y: (i: number) => scatterY(idx(els[i])), scale: .3, opacity: 0, rotation: (i: number) => (idx(els[i]) % 2 ? -50 : 50) },
    { x: (i: number) => spotX(idx(els[i])), y: (i: number) => spotY(idx(els[i])), scale: 1, opacity: 1, rotation: 0, stagger: .02, duration: .16, ease: 'power3.out' }] as const;
  const back = [...line(0), ...line(1)];
  const sTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sk, start: 'top top', end: () => '+=' + innerHeight * 2.8, pin: $('skstage'), scrub: 1, invalidateOnRefresh: true } });
  sTl.fromTo(pitch, { rotationX: 0, scale: 1.3, opacity: .35 }, { rotationX: wide ? 54 : 40, scale: 1, opacity: 1, duration: .22 }, 0)
    .to(chalk, { v: 1, duration: .24, onUpdate: () => draws.forEach(({ p, len }) => { p.style.strokeDashoffset = `${len * (1 - chalk.v)}`; }) }, 0)
    .fromTo(...runOn(back), .12)
    .fromTo($('cap0'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .06 }, .14)
    .fromTo(...runOn(line(2)), .27)
    .fromTo(...runOn(line(3)), .38)
    // the coaching staff walk out to the touchline
    .fromTo(staff, { x: (i) => spotX(11 + i) + (i ? 1 : -1) * fw() * .25, y: (i) => spotY(11 + i), opacity: 0 },
      { x: (i) => spotX(11 + i), y: (i) => spotY(11 + i), opacity: 1, stagger: .03, duration: .14, ease: 'power2.out' }, .52)
    .fromTo($('cap1'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .06 }, .58)
    .to(net$, { v: 1, duration: .16, onUpdate: () => lines.forEach((o) => { o.l.style.strokeDashoffset = `${o.len * (1 - net$.v)}`; }) }, .66)
    .to(pitch, { rotationX: wide ? 24 : 18, duration: .2 }, .66)
    .to(field, { scale: .94, duration: .2 }, .66)
    .to([...toks, ...staff], { y: (i) => spotY(i) - innerHeight * .6, opacity: 0, stagger: .008, duration: .12, ease: 'power2.in' }, .87)
    .to([$('cap0'), $('cap1'), net], { opacity: 0, duration: .06 }, .87)
    // a navy curtain: the career timeline starts in the same night colour
    .fromTo($('skwipe'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .13, ease: 'power2.inOut' }, .87)
    .fromTo($('marquee'), { xPercent: 0 }, { xPercent: -50, duration: 1 }, 0);
  const sSt = sTl.scrollTrigger!;
  sceneOf.set('skills', sSt);
  marks.set('skills', () => sSt.start + (sSt.end - sSt.start) * .8);
  // the players step away from the cursor
  if (fine) {
    const ins = [...toks, ...staff].map((t) => { const el = t.querySelector('[data-tok-in]') as HTMLElement; return { t, x: gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' }) }; });
    const stageSk = $('skstage');
    on(stageSk, 'pointermove', (e: PointerEvent) => {
      ins.forEach((o) => {
        const r = o.t.getBoundingClientRect(), dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY, d = Math.hypot(dx, dy) || 1;
        const push = d < 170 ? (1 - d / 170) * 34 : 0;
        o.x((dx / d) * push); o.y((dy / d) * push);
      });
    });
    on(stageSk, 'pointerleave', () => ins.forEach((o) => { o.x(0); o.y(0); }));
  }

  /* ================= 04  season by season, from today back to the first job ================= */
  const ca = root.querySelector('#career') as HTMLElement;
  const track = $('track'), year = $('year'), ball = $('caball');
  const seasons = $$('[data-season]', ca);
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  let lastYear = year.textContent;
  const h = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: ca, start: 'top top', end: () => '+=' + dist(), pin: $('castage'), scrub: 1, invalidateOnRefresh: true },
    onUpdate() {
      const x = gsap.getProperty(track, 'x') as number, lineW = (ball.parentElement as HTMLElement).clientWidth - ball.clientWidth;
      const bx = this.progress() * lineW;
      gsap.set(ball, { x: bx, rotation: (bx / (ball.clientWidth / 2)) * 57.3 });
      let y = seasons[0].dataset.year;
      for (const s of seasons) if (s.offsetLeft + x < innerWidth * .6) y = s.dataset.year;
      if (y !== lastYear) { lastYear = y; year.textContent = y; gsap.fromTo(year, { yPercent: 18, opacity: .2 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' }); }
    },
  });
  seasons.forEach((li) => gsap.from(li.querySelector('[data-season-in]'), { y: 90, rotation: 4, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, containerAnimation: h, start: 'left 92%', toggleActions: 'play none none reverse' } }));
  gsap.to($('castage'), { backgroundColor: CLUB, ease: 'none', scrollTrigger: { trigger: $('caend'), containerAnimation: h, start: 'left 70%', end: 'right right', scrub: true } });
  const cSt = h.scrollTrigger!;
  sceneOf.set('career', cSt);
  marks.set('career', () => cSt.start);
  // keyboard users: bring a focused season into view, since the track moves sideways
  on(track, 'focusin', (e: FocusEvent) => {
    const li = (e.target as HTMLElement).closest('[data-season]') as HTMLElement | null;
    if (!li || !dist()) return;
    const p = Math.min(1, Math.max(0, (li.offsetLeft - innerWidth * .3) / dist()));
    window.scrollTo({ top: cSt.start + p * (cSt.end - cSt.start), behavior: 'instant' as ScrollBehavior });
  });

  /* ================= 05  "Why Jwan Sidou?": zoom through the letters into the stadium ================= */
  const fo = root.querySelector('#why') as HTMLElement;
  const mask = $$<SVGSVGElement>('[data-mask]', fo).find((m) => getComputedStyle(m).display !== 'none')!;
  const textLines = $$<SVGTextElement>('[data-line]', mask);
  const letters = mask.querySelector('[data-letters]') as SVGTextElement;    // the last line, "SIDOU?"
  const { width: vbW, height: vbH } = mask.viewBox.baseVal;
  // fit the lettering to the frame: as large as the widest line allows, stacked and centred above the subtitle
  let fontPx = 300;
  const fitLetters = () => {
    textLines.forEach((l) => l.setAttribute('font-size', '300'));
    const widest = Math.max(...textLines.map((l) => l.getComputedTextLength()));
    const n = textLines.length;
    fontPx = Math.min(300 * (vbW * .92) / widest, (vbH * .66) / (n * .82));
    const block = n * .72 * fontPx + (n - 1) * .1 * fontPx, top = (vbH - block) / 2 - vbH * .07;
    textLines.forEach((l, i) => { l.setAttribute('font-size', `${fontPx}`); l.setAttribute('y', `${top + .72 * fontPx + i * .82 * fontPx}`); });
  };
  fitLetters();
  // the camera aims at the stem of the I in SIDOU, mapped from viewBox units to the screen (preserveAspectRatio: meet)
  // measured on the stage, not the window: the scrollbar would put the aim off the stem
  const foStage = $('fostage'), sw = () => foStage.clientWidth, sh = () => foStage.clientHeight;
  const scaleK = () => Math.min(sw() / vbW, sh() / vbH);
  const aim = () => {
    const ext = letters.getExtentOfChar(1), ty = +letters.getAttribute('y')!;
    const k = scaleK(), ox = (sw() - vbW * k) / 2, oy = (sh() - vbH * k) / 2;
    return { x: ox + (ext.x + ext.width / 2) * k, y: oy + (ty - fontPx * .36) * k };
  };
  const dOrigin = () => `${aim().x}px ${aim().y}px`;
  const fTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: fo, start: 'top top', end: () => '+=' + innerHeight * 3.4, pin: $('fostage'), scrub: 1, invalidateOnRefresh: true } });
  // Chrome caps SVG text at 10,000px on screen and shrinks the glyphs beyond that, so the zoom stops just under
  // the cap for this screen size and the garnet fades away to finish the move through the letter
  const maxZoom = () => Math.max(4, 9000 / (fontPx * scaleK()));
  // while it zooms, the camera also pans so the stem ends up centred on screen
  fTl.fromTo(mask, { scale: 1, x: 0, y: 0, transformOrigin: dOrigin }, { scale: maxZoom, x: () => sw() / 2 - aim().x, y: () => sh() / 2 - aim().y, duration: .34, ease: 'power3.in' }, .04)
    .fromTo(mask, { autoAlpha: 1 }, { autoAlpha: 0, duration: .13, ease: 'power1.in' }, .23)
    .to($('fointro'), { opacity: 0, y: -50, duration: .08 }, .02)
    .fromTo($('fobg'), { scale: 1.4 }, { scale: 1.05, duration: .42 }, 0)
    .fromTo($('foscrim'), { opacity: 0 }, { opacity: .74, duration: .08 }, .36)
    .fromTo([$('forole'), $('foplay')], { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .025, duration: .06 }, .4)
    .fromTo($$('[data-pillar]', fo), { y: 70, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', stagger: .03, duration: .08 }, .45)
    .to($('fobody'), { opacity: 0, y: -60, duration: .06 }, .62)
    .fromTo($('fospeed'), { opacity: 0, xPercent: 12 }, { opacity: .9, xPercent: -12, duration: .3 }, .64)
    .fromTo($('fomove'), { rotationY: -110, scale: .5, opacity: 0 }, { rotationY: 0, scale: 1, opacity: 1, duration: .14, ease: 'back.out(1.4)' }, .67)
    .to($('fonight'), { opacity: 1, duration: .1 }, .9);
  const fSt = fTl.scrollTrigger!;
  sceneOf.set('why', fSt);
  marks.set('why', () => fSt.start);

  /* ================= 06  full time: the ball opens the last page ================= */
  const co = root.querySelector('#contact') as HTMLElement;
  const coTitle = SplitText.create($('cotitle'), { type: 'words,chars', mask: 'words' });
  const oTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: co, start: 'top top', end: () => '+=' + innerHeight * 1.5, pin: $('costage'), scrub: 1, invalidateOnRefresh: true } });
  oTl.fromTo($('coball'), { x: () => -innerWidth * .65, rotation: -620, scale: .55 }, { x: 0, rotation: 0, scale: 1, duration: .3, ease: 'power2.out' }, 0)
    .fromTo($('copaper'), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: .32, ease: 'power2.in' }, .3)
    .to($('coball'), { scale: 7, opacity: 0, duration: .26 }, .32)
    .from(coTitle.chars, { yPercent: 115, stagger: .012, duration: .14, ease: 'power3.out' }, .56)
    .from($$('[data-co]', co), { y: 44, opacity: 0, stagger: .04, duration: .12 }, .64);
  const oSt = oTl.scrollTrigger!;
  sceneOf.set('contact', oSt);
  marks.set('contact', () => oSt.end);

  /* ---------------- focus: a focused element inside a pinned scene scrolls its moment into view ---------------- */
  on(root, 'focusin', (e: FocusEvent) => {
    const at = (e.target as HTMLElement).closest('[data-at]') as HTMLElement | null;
    const sec = at?.closest('section[id]') as HTMLElement | null;
    const st = sec && sceneOf.get(sec.id);
    if (!at || !st) return;
    const top = st.start + +at.dataset.at! * (st.end - st.start);
    // after the browser's own scroll-into-view, which would otherwise win
    setTimeout(() => { if (Math.abs(scrollY - top) > 4) window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }); }, 0);
  });

  /* ---------------- cursor ring + magnetic buttons ---------------- */
  if (fine) {
    const cur = root.querySelector('[data-cursor]') as HTMLElement, lab = cur.querySelector('[data-cursor-label]') as HTMLElement;
    const cx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    cur.dataset.live = '1';
    on(window, 'pointermove', (e: PointerEvent) => {
      cx(e.clientX); cy(e.clientY);
      const t = (e.target as Element).closest?.('a, button, summary, [data-cursor-text]');
      const text = t?.getAttribute('data-cursor-text') ?? '';
      cur.dataset.state = t ? (text ? 'text' : 'link') : '';
      if (lab.textContent !== text) lab.textContent = text;
    }, { passive: true });
    on(document.documentElement, 'pointerleave', () => { cur.dataset.state = 'hidden'; });
    off.push(() => { delete cur.dataset.live; });
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .45)' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .45)' });
      on(el, 'pointermove', (e: PointerEvent) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .32); my((e.clientY - r.top - r.height / 2) * .42); });
      on(el, 'pointerleave', () => { mx(0); my(0); });
    });
  }

  ScrollTrigger.refresh();
  // dev only: lets browser tests jump the scrubbed timelines to where the scroll position says they should be
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __settle: () => void }).__settle = () => {
    ScrollTrigger.update();
    driven.forEach((f) => f());
    ScrollTrigger.getAll().forEach((st) => { const tw = st.getTween && st.getTween(); if (tw) tw.progress(1); const a = st.animation; if (a && st.progress > 0) a.progress(st.vars.scrub ? st.progress : 1); });
  };
  return () => off.forEach((f) => f());
}
