// Scroll choreography for the portfolio. Each scene is a pinned stage driven by one scrubbed timeline, and each
// one ends in the colour and framing the next scene starts with, so the page plays as one continuous camera move.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { SQUAD_SPOTS, STAFF_SPOTS } from './squad';

const PAPER = '#F5F1E8', NIGHT = '#0A1428', CLUB = '#3A0A24';
const FULL = 'inset(0% 0% 0% 0% round 0px)';
const FOCUS = [960 / 1920, 935 / 1080];            // where the ball lands on the pitch (plate coordinates): the camera's anchor

/* where each nav target sits on the scroll, and which scene a focused element belongs to */
const marks = new Map<string, () => number>();
const sceneOf = new Map<string, ScrollTrigger>();
const driven: (() => void)[] = [];      // custom-driven timelines, for the dev settle hook
// While scenes are still being set up in idle time, this builds every remaining one at once (nav jumps, focus).
let flushPending: (() => void) | null = null;

export function scrollToScene(id: string, motion: boolean) {
  flushPending?.();
  const behavior: ScrollBehavior = motion ? 'smooth' : 'auto';
  if (id === 'top') return window.scrollTo({ top: 0, behavior });
  const mark = motion ? marks.get(id) : undefined;
  if (mark) return window.scrollTo({ top: mark(), behavior });
  document.getElementById(id)?.scrollIntoView({ behavior });
}

/* Whenever a pinned ScrollTrigger is created, GSAP schedules a full re-measure of every trigger for the next frame, in
   case the new pin pushed triggers created earlier further down the page. Scenes here are always created from the top
   of the page down, so nothing created earlier ever moves, and that re-measure (the costliest step of setting a scene
   up) is skipped. While a scene is created that request is the only thing scheduled with requestAnimationFrame: GSAP's
   own ticker keeps its own reference, and a skipped request returns 0, which ScrollTrigger treats as "not scheduled". */
function withoutQueuedRefresh<T>(fn: () => T): T {
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = () => 0;
  try { return fn(); } finally {
    window.requestAnimationFrame = raf;
    // What that re-measure also did at its end: give the browser back its own scroll restoration (ScrollTrigger
    // switches it to "manual" while it sets the scroll position during set-up), so a reload still returns to the
    // same place in the page.
    ScrollTrigger.clearScrollMemory(restoration ?? 'auto');
  }
}
let restoration: ScrollRestoration | null = null;      // the page's own setting, read before ScrollTrigger first changes it

export function setupMotion(root: HTMLElement) {
  restoration ??= history.scrollRestoration;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Every stage and plate is sized by CSS alone (no layout waits on images), so the extra full re-measure that
  // ScrollTrigger runs on window "load" is skipped; fonts are awaited below, resize still re-measures.
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,resize' });
  let mm: gsap.MatchMedia | null = null;
  let dead = false;
  const start = () => {
    if (dead) return;
    mm = gsap.matchMedia(root);
    mm.add({ wide: '(min-width: 800px) and (min-aspect-ratio: 1/1)', narrow: '(max-width: 799px), (max-aspect-ratio: 1/1)' },
      (c) => withoutQueuedRefresh(() => build(root, !!c.conditions!.wide, c)));
  };
  // split text only once the display fonts are in, so line breaks are measured on the real glyphs
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  return () => { dead = true; mm?.revert(); marks.clear(); sceneOf.clear(); driven.length = 0; flushPending = null; };
}

function build(root: HTMLElement, wide: boolean, ctx: gsap.Context) {
  const $ = <T extends Element = HTMLElement>(k: string) => root.querySelector(`[data-k="${k}"]`) as unknown as T;
  const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll(sel)) as T[];
  const off: (() => void)[] = [];
  const on = (t: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => { t.addEventListener(type, fn, opts); off.push(() => t.removeEventListener(type, fn)); };
  const fine = matchMedia('(pointer: fine)').matches;
  // One pointer listener for the whole page. It only records the position; everything that reacts to the mouse
  // (hero depth, card tilt, cursor ring, players) runs once per animation frame from `perFrame`, however many
  // pointer events the browser sends in that frame.
  const pointer = { x: 0, y: 0, cx: 0, cy: 0, target: null as Element | null };    // x/y normalised -1..1 from the centre
  const perFrame: (() => void)[] = [];
  let pointerRaf = 0;
  const pointerFrame = () => { pointerRaf = 0; for (const f of perFrame) f(); };
  if (fine) {
    on(window, 'pointermove', (e: PointerEvent) => {
      pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.target = e.target as Element;
      pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1;
      if (!pointerRaf) pointerRaf = requestAnimationFrame(pointerFrame);
    }, { passive: true });
    off.push(() => cancelAnimationFrame(pointerRaf));
  }

  /* ---------------- typography reveals (masked lines) ----------------
     Created first, for the whole page, before any pin: their positions are measured on the page without pin spacing,
     exactly as before the set-up was staged. Creating them later, after the pins, would move several of them. */
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } }),
    });
  });
  $$('[data-fade]').forEach((el) => gsap.from(el, { y: 32, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }));
  $$('[data-stagger]').forEach((el) => gsap.from(el.children, { y: 24, opacity: 0, duration: .7, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } }));
  // Elements that scale every frame are promoted to GPU layers (will-change: transform in the CSS), but only while
  // their scene is on or near the screen, so the GPU keeps a texture instead of re-drawing them at every zoom step
  // and offscreen scenes hold no GPU memory.
  const liveLayers = (trigger: Element, el: HTMLElement) => {
    ScrollTrigger.create({ trigger, start: 'top bottom+=50%', end: 'bottom top-=50%', onToggle: (self) => el.toggleAttribute('data-live', self.isActive) });
    off.push(() => el.removeAttribute('data-live'));
  };
  const announce = () => dispatchEvent(new Event('motion:refresh'));
  ScrollTrigger.addEventListener('refresh', announce);
  off.push(() => ScrollTrigger.removeEventListener('refresh', announce));

  /* ================= 01 → 02  kick-off: the ball drops in, then the profile card ================= */
  const kick = root.querySelector('[data-kick]') as HTMLElement;
  const stage = $('stage'), frame = $('frame');
  const covers = [$('back'), $('front')];
  // the ball layer is called `fig` here so the timeline below reads as before; it holds only the ball and its shadow
  const layers = { sky: $('sky'), ground: $('ground'), fig: $('focus'), flare: $('flare') };
  gsap.set(Object.values(layers), { transformOrigin: `${FOCUS[0] * 100}% ${FOCUS[1] * 100}%` });
  // the card the hero shrinks into (same box as the photo slot and card labels in the CSS)
  const card = wide ? [13, 7, 9, 55] : [11, 9, 47, 9];      // top, right, bottom, left in %
  const cardClip = `inset(${card[0]}% ${card[1]}% ${card[2]}% ${card[3]}% round ${wide ? 28 : 22}px)`;
  // How far the plate travels during the zoom: the ball is framed on the grass, centred across the card and 82% of
  // the way down it, so the zoomed pitch (ground 1.28x around the ball) still fills the card to its bottom edge on
  // every screen shape. Only the plate moves; the card and the photo slot stay exactly where they are.
  const focusShift = () => {
    const vw = innerWidth, vh = innerHeight, pw = Math.max(vw, vh * 16 / 9), ph = Math.max(vh, vw * 9 / 16);
    const fx = vw / 2 + (FOCUS[0] - .5) * pw, fy = vh / 2 + (FOCUS[1] - .5) * ph;
    const cx = vw * (card[3] + (100 - card[1] - card[3]) / 2) / 100, cy = vh * (card[0] + (100 - card[0] - card[2]) * .82) / 100;
    return { x: cx - fx, y: cy - fy };
  };

  // arrival: letters rise out of their masks while the camera settles
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from($$('[data-depth]', stage), { scale: 1.16, duration: 2.4, ease: 'power3.out', stagger: .06 }, 0)
    .from([$('n1'), $('n2')], { yPercent: 115, duration: 1.4, stagger: .12 }, .2)
    .from($$('[data-intro]', stage), { y: 30, opacity: 0, duration: 1.1, stagger: .08 }, .55);

  // One timeline for the whole kick-off scene, in four phases: 0-1 a ball drops in and the camera follows it down
  // to the pitch, 1-2 hero to profile card, 2-3 drift while the profile scrolls past, 3-4 the card opens and the
  // camera pushes in to navy. A single timeline means phases that touch the same properties never fight.
  const aboutIn = root.querySelector('#about [data-scene]') as HTMLElement;
  const fs = () => focusShift();
  // elements that start hidden get their first state now: rewinding the timeline restores these values
  gsap.set($('outline'), { opacity: 0, scale: .75, xPercent: -10 });
  gsap.set($('cardui'), { opacity: 0, y: 30 });
  const drop = $('drop'), spin = $('spin'), bshadow = $('bshadow'), photo = $('photo'), photoIn = $('photoin');
  gsap.set(drop, { yPercent: -100 });
  gsap.set(bshadow, { xPercent: -50, yPercent: -50, scale: .2, opacity: 0 });
  gsap.set(photo, { opacity: 0 });
  // the camera follows the ball by pushing in towards the spot where it lands
  const LAND = FOCUS;
  const landOrigin = () => {
    const vw = innerWidth, vh = innerHeight, pw = Math.max(vw, vh * 16 / 9), ph = Math.max(vh, vw * 9 / 16);
    return `${vw / 2 + (LAND[0] - .5) * pw}px ${vh / 2 + (LAND[1] - .5) * ph}px`;
  };
  const push = wide ? 1.28 : 1.3;
  // the push scales around the landing point: set as the covers' own origin (and re-measured on every refresh),
  // because an origin passed inside the tween's from-vars was never applied and the push scaled around the centre
  const placeOrigin = () => gsap.set(covers, { transformOrigin: landOrigin() });
  placeOrigin();
  const kTl = gsap.timeline({ paused: true, defaults: { ease: 'none', immediateRender: false } });
  // phase 0: the ball drops out of the sky onto the pitch, bounces twice and settles; the camera follows it
  kTl.fromTo($('ui'), { opacity: 1, y: 0 }, { opacity: 0, y: -50, duration: .25 }, 0)
    .fromTo(covers, { y: 0, scale: 1 }, { y: 0, scale: push, duration: .45, ease: 'power2.inOut' }, .05)
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
    .fromTo(covers, { y: 0, scale: push }, { y: 0, scale: 1, duration: .17, ease: 'power2.inOut' }, .83)
    // phase 1: hero to profile card
    .fromTo($('m1'), { xPercent: 0, opacity: 1 }, { xPercent: -70, opacity: 0, duration: .45 }, 1)
    .fromTo($('m2'), { xPercent: 0, opacity: 1 }, { xPercent: 70, opacity: 0, duration: .45 }, 1)
    .fromTo(layers.sky, { scale: 1 }, { scale: 1.1, duration: .75 }, 1)
    .fromTo(layers.ground, { scale: 1 }, { scale: 1.28, duration: .75 }, 1)
    .fromTo(layers.fig, { scale: 1 }, { scale: wide ? 1.7 : 1.6, duration: .75 }, 1)
    .fromTo(layers.flare, { opacity: 1 }, { opacity: 0, duration: .3 }, 1)
    .fromTo(covers, { x: 0, y: 0 }, { x: () => fs().x, y: () => fs().y, duration: .5, ease: 'power2.inOut' }, 1.28)
    .fromTo(frame, { clipPath: FULL }, { clipPath: cardClip, duration: .45, ease: 'power2.inOut' }, 1.3)
    .fromTo(stage, { backgroundColor: NIGHT }, { backgroundColor: PAPER, duration: .35 }, 1.32)
    .fromTo([$('scrim'), $('shade')], { opacity: 1 }, { opacity: 0, duration: .3 }, 1.3)
    .fromTo($('outline'), { opacity: 0, scale: .75, xPercent: -10 }, { opacity: 1, scale: 1, xPercent: 0, duration: .5 }, 1.4)
    // the card settles, then the photo slot takes over from the pitch
    .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: .2 }, 1.62)
    .fromTo(photoIn, { scale: 1.18 }, { scale: 1, duration: .38 }, 1.62)
    .fromTo($('cardui'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .22 }, 1.78)
    // phase 2: drift
    .fromTo(layers.fig, { scale: wide ? 1.7 : 1.6 }, { scale: wide ? 1.9 : 1.75, duration: 1 }, 2)
    .fromTo(photoIn, { scale: 1 }, { scale: 1.06, duration: 1 }, 2)
    .fromTo($('outline'), { yPercent: 0 }, { yPercent: -18, duration: 1 }, 2)
    // phase 3: the photo gives way to the pitch, the card opens and the camera pushes in on the ball, into navy (the skills board)
    .fromTo($('cardui'), { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: .15 }, 3)
    .fromTo(photo, { opacity: 1 }, { opacity: 0, duration: .2 }, 3)
    .fromTo(photoIn, { scale: 1.06 }, { scale: 1.25, duration: .2 }, 3)
    .fromTo(frame, { clipPath: cardClip }, { clipPath: FULL, duration: .6, ease: 'power2.inOut' }, 3)
    .fromTo(covers, { x: () => fs().x, y: () => fs().y }, { x: 0, y: 0, duration: .6, ease: 'power2.inOut' }, 3)
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
  // the scrub: one re-targetable tween on a proxy, instead of creating a new tween for every scroll event
  const kPlay = { t: 0 };
  const kTo = gsap.quickTo(kPlay, 't', { duration: .9, ease: 'power3.out', onUpdate: () => { kTl.time(kPlay.t); } });
  const kDrive = (instant: boolean, sweep = true) => {
    const target = kTime(scrollY);
    if (!instant) return kTo(target);
    // A full sweep initialises every phase, so jumping back over one restores its start state. It is skipped only on
    // the very first measure when the page opens at the top: nothing has rendered yet and every start state is already
    // in place. The quickTo tween is re-targeted in place (start = end = target), never killed: killing it froze the opening.
    if (sweep) kTl.progress(1);
    kTl.time(target); kPlay.t = target; kTo(target, target);
  };
  let firstMeasure = true;
  const kickSt = ScrollTrigger.create({
    trigger: kick, start: 'top top', end: 'bottom bottom', pin: stage, pinSpacing: false,
    onUpdate: () => kDrive(false),
    onRefresh: (self) => {
      const s0 = self.start, end = self.end, sd = s0 + innerHeight * .9, s1 = sd + innerHeight * 1.1;
      const s2 = Math.min(end - innerHeight * .4, Math.max(s1 + 1, aboutIn.getBoundingClientRect().bottom + scrollY - innerHeight * .15));
      bounds = [s0, sd, s1, s2, end];
      placeOrigin();
      kTl.invalidate();
      kDrive(true, !firstMeasure || scrollY > s0);
      firstMeasure = false;
    },
  });
  const settleKick = () => kDrive(true);
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __kTl: gsap.core.Timeline }).__kTl = kTl;
  driven.push(settleKick);
  off.push(() => { kTo.tween.kill(); driven.splice(driven.indexOf(settleKick), 1); });
  sceneOf.set('top', kickSt);
  marks.set('about', () => aboutIn.getBoundingClientRect().top + scrollY - 90);

  // hover depth: layers drift against the pointer, and the card tilts once it exists
  if (fine) {
    const pars = $$('[data-depth]', stage).map((el) => ({ d: +el.dataset.depth!, x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: .9, ease: 'power3' }) }));
    const nameX = gsap.quickTo($('name'), 'x', { duration: 1, ease: 'power3' });
    const tilt = $('tilt'), rx = gsap.quickTo(tilt, 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo(tilt, 'rotationY', { duration: .8, ease: 'power3' });
    perFrame.push(() => {
      if (scrollY > bounds[4]) return;            // the kick-off stage has scrolled away
      pars.forEach((p) => { p.x(-pointer.x * p.d * 26); p.y(-pointer.y * p.d * 14); });
      nameX(pointer.x * 18);
      const kt = kTl.time(), k = Math.max(0, Math.min(1, kt - 1)) * (1 - Math.max(0, Math.min(1, (kt - 3) / .4)));
      rx(-pointer.y * 7 * k); ry(pointer.x * 9 * k);
    });
  }
  liveLayers(kick, stage);

  /* ================= 03  the tech-stack lines up in a 4-2-3-1 ================= */
  const buildSkills = () => {
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
      let fieldBox = { left: 0, top: 0 }, over = false;
      on(stageSk, 'pointerenter', () => { const r = field.getBoundingClientRect(); fieldBox = { left: r.left, top: r.top }; over = true; });
      perFrame.push(() => {
        if (!over) return;
        ins.forEach((o) => {
          // a token's centre is the field's corner plus the position GSAP gave it (xPercent/yPercent centre it)
          const cx = fieldBox.left + (gsap.getProperty(o.t, 'x') as number), cy = fieldBox.top + (gsap.getProperty(o.t, 'y') as number);
          const dx = cx - pointer.cx, dy = cy - pointer.cy, d = Math.hypot(dx, dy) || 1;
          const push = d < 170 ? (1 - d / 170) * 34 : 0;
          o.x((dx / d) * push); o.y((dy / d) * push);
        });
      });
      on(stageSk, 'pointerleave', () => { over = false; ins.forEach((o) => { o.x(0); o.y(0); }); });
    }
    liveLayers(sk, $('skstage'));
  };

  /* ================= 04  season by season, from today back to the first job ================= */
  const buildCareer = () => {
    const ca = root.querySelector('#career') as HTMLElement;
    const track = $('track'), year = $('year'), ball = $('caball');
    const seasons = $$('[data-season]', ca);
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    let lastYear = year.textContent;
    let seasonX: number[] = [], lineW = 0, ballR = 18;
    const measureCareer = () => { seasonX = seasons.map((s) => s.offsetLeft); ballR = ball.clientWidth / 2; lineW = (ball.parentElement as HTMLElement).clientWidth - ball.clientWidth; };
    measureCareer();
    ScrollTrigger.addEventListener('refresh', measureCareer);
    off.push(() => ScrollTrigger.removeEventListener('refresh', measureCareer));
    const h = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: ca, start: 'top top', end: () => '+=' + dist(), pin: $('castage'), scrub: 1, invalidateOnRefresh: true },
      onUpdate() {
        const x = gsap.getProperty(track, 'x') as number;
        const bx = this.progress() * lineW;
        gsap.set(ball, { x: bx, rotation: (bx / ballR) * 57.3 });
        let y = seasons[0].dataset.year;
        seasons.forEach((s, i) => { if (seasonX[i] + x < innerWidth * .6) y = s.dataset.year; });
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
  };

  /* ================= 05  "Why Jwan Sidou?": zoom through the letters into the stadium ================= */
  const buildWhy = () => {
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
    /* The scene on one pin, in parts that are each scrubbed by their own trigger:
         A    the letters, the cards, then Project 01 comes in     (the original timeline, unchanged up to the cards)
         R k  Project k: a reading stop
         T k  Project k hands over to Project k+1
         B    the ball rolls across as night falls, and leaves on the right where Contact's ball comes in from the left
       A, T and B keep the original pace: a unit of timeline is 2.3 screens / .94, as before. A reading stop holds
       still while the panel fits the screen; a taller panel (phones, portrait tablets, Soil's diagram) moves up exactly
       as far as the page scrolls, without smoothing, so it reads like a normal page.
       Every element is animated by one part only (two parts on the same property would fight when the page jumps):
       the article leaves (T k), [data-proj-in] comes in (T k-1), [data-proj-move] scrolls (R k), and the first card
       rises (A); each big number has an outer span that leaves and an inner span that comes in. */
    const U = () => innerHeight * 2.3 / .94;
    const projBox = $('foproj'), projNum = $('projnum');
    const projs = $$<HTMLElement>('[data-proj]', fo), N = projs.length;
    const ins = projs.map((p) => p.querySelector('[data-proj-in]') as HTMLElement);
    const moves = projs.map((p) => p.querySelector('[data-proj-move]') as HTMLElement);
    const cards = projs.map((p) => p.querySelector('[data-proj-card]') as HTMLElement);
    const rows = projs.map((p) => $$<HTMLElement>('[data-contrib]', p));
    const numOut = $$<HTMLElement>('[data-num-out]', projNum), numIn = $$<HTMLElement>('[data-num-in]', projNum);
    // how far a panel has to move up for its last line to sit above the match clock (0 when it fits)
    const travel = (k: number) => Math.max(0, projBox.offsetTop + cards[k].offsetHeight - (Math.min(innerHeight, foStage.clientHeight) - 72));
    const hold = (k: number) => Math.max(innerHeight * .35, travel(k) + innerHeight * .3);
    const lenA = () => U() * .88, lenT = () => U() * .14, lenB = () => U() * .16;
    // where each reading stop and hand-over starts, from the start of the pin
    const atR = (k: number): number => k ? atT(k - 1) + lenT() : lenA();
    const atT = (k: number): number => atR(k) + hold(k);
    const atB = () => atR(N - 1) + hold(N - 1);
    const fSt = ScrollTrigger.create({
      trigger: fo, start: 'top top', end: () => '+=' + (atB() + lenB()), pin: $('fostage'), invalidateOnRefresh: true,
      // keyboard focus inside a project (the diagram's link) lands at the end of that project's reading stop
      onRefresh: (self) => projs.forEach((p, k) => { p.dataset.at = String((atR(k) + innerHeight * .15 + travel(k)) / (self.end - self.start)); }),
    });
    const part = (from: () => number, len: () => number, scrub: number | boolean = 1): ScrollTrigger.Vars =>
      ({ start: () => fSt.start + from(), end: () => fSt.start + from() + len(), scrub, invalidateOnRefresh: true });
    // One tween per element, at the times a stagger would give them. On every refresh, invalidateOnRefresh reverts
    // the timeline and re-applies the start state only at the start of each tween: a staggered tween would get that
    // for its first element alone, and the others would show at full opacity over the lettering until reached.
    const rise = (tl: gsap.core.Timeline, els: Element[], from: gsap.TweenVars, to: gsap.TweenVars, at: number, each: number) =>
      els.forEach((el, i) => tl.fromTo(el, from, to, at + i * each));
    const fTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: part(() => 0, lenA) });
    // Chrome caps SVG text at 10,000px on screen and shrinks the glyphs beyond that, so the zoom stops just under
    // the cap for this screen size and the garnet fades away to finish the move through the letter
    const maxZoom = () => Math.max(4, 9000 / (fontPx * scaleK()));
    // while it zooms, the camera also pans so the stem ends up centred on screen
    fTl.fromTo(mask, { scale: 1, x: 0, y: 0, transformOrigin: dOrigin }, { scale: maxZoom, x: () => sw() / 2 - aim().x, y: () => sh() / 2 - aim().y, duration: .34, ease: 'power3.in' }, .04)
      .fromTo(mask, { autoAlpha: 1 }, { autoAlpha: 0, duration: .13, ease: 'power1.in' }, .23)
      .to($('fointro'), { opacity: 0, y: -50, duration: .08 }, .02)
      .fromTo($('fobg'), { scale: 1.4 }, { scale: 1.05, duration: .42 }, 0)
      .fromTo($('foscrim'), { opacity: 0 }, { opacity: .74, duration: .08 }, .36);
    rise(fTl, [$('forole'), $('foplay')], { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .06 }, .4, .025);
    rise(fTl, $$('[data-pillar]', fo), { y: 70, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .08 }, .45, .03);
    // the qualities leave the way they always did, and Project 01 rises in like they did, then its contributions
    fTl.to($('fobody'), { opacity: 0, y: -60, duration: .05 }, .68)
      .fromTo(projNum.parentElement!, { opacity: 0 }, { opacity: 1, duration: .1 }, .7)
      .fromTo(cards[0], { y: 70, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .08 }, .72);
    rise(fTl, rows[0], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .05 }, .76, .012);
    fTl.set({}, {}, .88);
    // R k: a taller panel scrolls through, one pixel per pixel of page scroll
    moves.forEach((m, k) => gsap.fromTo(m, { y: 0 }, { y: () => -travel(k), ease: 'none', scrollTrigger: part(() => atR(k) + innerHeight * .15, () => travel(k), true) }));
    // T k: Project k slides out left as the next one slides in from the right; the big number rolls on, the path fills
    for (let k = 0; k < N - 1; k++) {
      const tTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: part(() => atT(k), lenT) })
        .to(projs[k], { xPercent: -110, opacity: 0, duration: .08, ease: 'power2.in' }, 0)
        .fromTo(ins[k + 1], { xPercent: 110, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .09, ease: 'power2.out' }, .04)
        .to(numOut[k], { yPercent: -100, duration: .08, ease: 'power2.inOut' }, .03)
        .fromTo(numIn[k + 1], { yPercent: 100 }, { yPercent: 0, duration: .08, ease: 'power2.inOut' }, .03)
        .fromTo(projs[k + 1].querySelector('[data-proj-fill]'), { scaleX: 0 }, { scaleX: 1, duration: .07 }, .06);
      rise(tTl, rows[k + 1], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .04 }, .07, .006);
    }
    // B: the last project leaves and night falls
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: part(atB, lenB) })
      .to(projBox, { opacity: 0, y: -60, duration: .05 }, 0)
      .to($('fonight'), { opacity: 1, duration: .1 }, .04);
    // The ball: it rolls in from the left as night falls and keeps rolling through the dark stretch between this scene
    // and Contact (it is held to the screen, outside the pinned stage), speeding up, and leaves on the right just as
    // Contact's pin starts and Contact's ball comes in from the left: same size, height and spin, one continuous move.
    // Off screen before and after, so it is never seen anywhere else.
    gsap.fromTo($('foball'), { x: () => -innerWidth * .65, rotation: -1240, scale: .55, opacity: 1 }, { x: () => innerWidth * .65, rotation: 0, ease: 'power2.in',
      scrollTrigger: { start: () => fSt.start + atB(), end: () => fSt.end + innerHeight, scrub: 1, invalidateOnRefresh: true } });
    sceneOf.set('why', fSt);
    marks.set('why', () => fSt.start);
    liveLayers(fo, $('fostage'));
  };

  /* ================= 06  full time: the ball opens the last page ================= */
  const buildContact = () => {
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
    liveLayers(co, $('costage'));
  };

  /* ---------------- focus: a focused element inside a pinned scene scrolls its moment into view ---------------- */
  on(root, 'focusin', (e: FocusEvent) => {
    flushPending?.();
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
    perFrame.push(() => {
      cx(pointer.cx); cy(pointer.cy);
      const t = pointer.target?.closest?.('a, button, summary, [data-cursor-text]');
      const text = t?.getAttribute('data-cursor-text') ?? '';
      const state = t ? (text ? 'text' : 'link') : '';
      if (cur.dataset.state !== state) cur.dataset.state = state;
      if (lab.textContent !== text) lab.textContent = text;
    });
    on(document.documentElement, 'pointerleave', () => { cur.dataset.state = 'hidden'; });
    off.push(() => { delete cur.dataset.live; });
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .45)' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .45)' });
      on(el, 'pointermove', (e: PointerEvent) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .32); my((e.clientY - r.top - r.height / 2) * .42); });
      on(el, 'pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------------- staged set-up ----------------
     The opening above (and every text reveal) is built straight away. The scenes below it are built one at a time, in page order, when the
     browser is idle (or after a short timeout where it never is), always before they can be seen: a scroll guard
     builds any scene that is within 2.5 screens of the viewport immediately, and nav jumps or keyboard focus build
     everything first. Each builder runs inside the matchMedia context, so a breakpoint change still reverts it all.
     Building in page order keeps every ScrollTrigger's positions exact: a new pin only adds space below itself. */
  const sk = root.querySelector('#skills') as HTMLElement, ca = root.querySelector('#career') as HTMLElement;
  const fo = root.querySelector('#why') as HTMLElement, co = root.querySelector('#contact') as HTMLElement;
  const scenes: { el: Element; build: () => void }[] = [
    { el: sk, build: buildSkills }, { el: ca, build: buildCareer }, { el: fo, build: buildWhy }, { el: co, build: buildContact },
  ];
  let next = 0, nextAt = Infinity, nextTop = Infinity, idle = 0, stopped = false, late = false;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
  // where the next scene must be ready: 2.5 screens before its top reaches the viewport (positions only move down
  // as earlier scenes add their pins, so this is measured again after every build and stays on the safe side)
  const measureNext = () => {
    nextTop = next < scenes.length ? scenes[next].el.getBoundingClientRect().top + scrollY : Infinity;
    nextAt = nextTop - innerHeight * 3.5;
  };
  const buildNext = () => {
    // A scene that is already on screen when it is built (the browser jumped there, e.g. restoring the scroll position
    // on reload) may have its pin active, so its triggers are measured once more with every pin released, exactly as
    // the single full re-measure did before the set-up was staged.
    if (scrollY + innerHeight > nextTop) late = true;
    const s = scenes[next++];
    withoutQueuedRefresh(() => ctx.add(s.build));
    announce(); measureNext();
    if (next >= scenes.length) gsap.ticker.remove(guard);
  };
  const settle = () => { if (late) { late = false; ScrollTrigger.refresh(); } };
  const buildAll = () => { while (next < scenes.length) buildNext(); settle(); };
  const guard = () => { while (next < scenes.length && scrollY >= nextAt) buildNext(); settle(); };
  const schedule = () => {
    if (stopped || next >= scenes.length) return;
    const step = () => { if (stopped) return; guard(); if (next < scenes.length) buildNext(); settle(); schedule(); };
    idle = ric ? ric(step, { timeout: 400 }) : (setTimeout(step, 60) as unknown as number);
  };
  measureNext();
  // On a reload or back/forward visit the browser may restore a scroll position anywhere in the page, during its own
  // layout step where no script runs first, so every scene is built straight away there, as before staging.
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if ((nav?.type === 'reload' || nav?.type === 'back_forward') && (restoration ?? history.scrollRestoration) === 'auto') buildAll();
  guard();
  schedule();
  // checked on every scroll event and again first thing in every animation frame (a jump made by the browser itself,
  // such as scroll restoration, can land before its scroll event); one comparison, no layout read
  on(window, 'scroll', guard, { passive: true });
  if (next < scenes.length) gsap.ticker.add(guard, false, true);
  flushPending = buildAll;
  off.push(() => { stopped = true; gsap.ticker.remove(guard); if (ric && cic) cic(idle); else clearTimeout(idle); if (flushPending === buildAll) flushPending = null; });
  // dev only: lets browser tests jump the scrubbed timelines to where the scroll position says they should be
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger;
  if (process.env.NODE_ENV !== 'production') (window as unknown as { __settle: () => void }).__settle = () => {
    flushPending?.();
    ScrollTrigger.update();
    driven.forEach((f) => f());
    ScrollTrigger.getAll().forEach((st) => { const tw = st.getTween && st.getTween(); if (tw) tw.progress(1); const a = st.animation; if (a && st.progress > 0) a.progress(st.vars.scrub ? st.progress : 1); });
  };
  return () => off.forEach((f) => f());
}
