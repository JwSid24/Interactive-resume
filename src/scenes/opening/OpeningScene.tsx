'use client';
// Opening scene player. Anime-style editing on a 1920x1080 stage: cut on action, held key drawings carried by
// camera moves, background slides and speed lines; drawn cycles at 10 fps; impact frames, shakes and smears.
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import manifest from '../../../public/assets/opening/manifest.json';
import css from './opening.module.css';
import Portfolio from './Portfolio';
import { cv } from '../../content/cv';

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/opening/';
const src = (name: string) => BASE + name + '.svg';
const SW = 1920, SH = 1080;
type Phase = 'loading' | 'ready' | 'playing' | 'hero' | 'goal' | 'portfolio';
const LIVE: Record<Phase, string> = { loading: 'Loading the episode', ready: 'Title screen. Press Kick off to start.', playing: 'Opening scene playing: a ball falls from the sky and Jwandini controls it.', hero: 'Jwandini stands with his foot on the ball. Press Meet Jwandini to continue.', goal: 'Jwandini dribbles toward goal and scores in the top corner.', portfolio: 'Portfolio. Use the section tabs to explore.' };

const PRELOAD = Object.keys(manifest.files);
const OPEN_CUTS: [string, number][] = [['s2', 0], ['s3', 1.4], ['s4', 3.1], ['s5', 4.25], ['s6', 5.45], ['s7', 6.5], ['s8', 7.7]];
const GOAL_CUTS: [string, number][] = [['g1', 0], ['g2', 1.7], ['g3', 2.9], ['g4', 3.9], ['g5', 4.5]];
const FOCUS: Record<string, [number, number]> = { s1: [960, 540], s2: [1180, 420], s3: [820, 700], s4: [980, 560], s5: [900, 640], s6: [1000, 500], s7: [820, 640], s8: [900, 540], g1: [960, 760], g2: [1000, 640], g3: [960, 500], g4: [1000, 480], g5: [1300, 420] };

function Ball({ id, x, y, r, light = 'tr' }: { id: string; x: number; y: number; r: number; light?: 'tr' | 'tl' }) {
  const size = (manifest.ball.box * r) / manifest.ball.r;
  return (
    <div className={css.ball} data-ball={id} style={{ left: x, top: y, width: size, height: size }}>
      <img className={css.fill} data-spin alt="" src={src('ball-pattern')} />
      <img className={css.fill} alt="" src={src(light === 'tl' ? 'ball-shade-tl' : 'ball-shade')} />
    </div>
  );
}
const Plate = ({ name, k }: { name: string; k?: string }) => <img className={css.plate} data-k={k} alt="" src={src(name)} draggable={false} />;
const Star = ({ x, y, s, k }: { x: number; y: number; s: number; k: string }) => (
  <svg className={css.star} data-k={k} style={{ left: x - s, top: y - s, width: s * 2, height: s * 2 }} viewBox="-1 -1 2 2" aria-hidden>
    <path d="M 0,-1 Q .14,-.14 1,0 Q .14,.14 0,1 Q -.14,.14 -1,0 Q -.14,-.14 0,-1 Z" fill="#fff" />
  </svg>
);
const Dust = ({ x, y, k }: { x: number; y: number; k: string }) => (
  <div className={css.dustWrap} data-k={k} style={{ left: x, top: y }}>
    {[-1.2, -0.5, 0.2, 0.9, 1.5].map((d, i) => <span key={i} className={css.dust} style={{ ['--dx' as string]: d } as React.CSSProperties} />)}
  </div>
);

export default function OpeningScene() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const idle = useRef<gsap.core.Timeline | null>(null);
  const focus = useRef({ x: 960, y: 540 });
  const [phase, setPhase] = useState<Phase>('loading');
  const [loaded, setLoaded] = useState(0);
  const [reduced, setReduced] = useState(false);

  /* responsive framing: cover the viewport, keep the shot's focus point in view on narrow screens */
  const layout = useCallback(() => {
    const el = root.current, st = stage.current;
    if (!el || !st) return;
    const vw = el.clientWidth, vh = el.clientHeight, s = Math.max(vw / SW, vh / SH);
    const ox = Math.min(0, Math.max(vw - SW * s, vw / 2 - focus.current.x * s));
    const oy = Math.min(0, Math.max(vh - SH * s, vh / 2 - focus.current.y * s));
    st.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
  }, []);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion') === 'reduce');
    let n = 0;
    PRELOAD.forEach((k) => {
      const im = new Image();
      im.onload = im.onerror = () => { n++; setLoaded(n); if (n === PRELOAD.length) setPhase('ready'); };
      im.src = BASE + manifest.files[k as keyof typeof manifest.files];
    });
    window.addEventListener('resize', layout);
    layout();
    return () => window.removeEventListener('resize', layout);
  }, [layout]);

  const q = (sel: string) => stage.current!.querySelectorAll(sel);
  const one = (sel: string) => stage.current!.querySelector(sel) as HTMLElement;

  /* ---------- the master timeline ---------- */
  /* framing: which shot is on screen at time t, and where its subject is (followed every frame) */
  const frame = useCallback((T: gsap.core.Timeline, cuts: [string, number][]) => {
    const t = T.time();
    let shot = cuts[0][0];
    for (const [id, at] of cuts) if (t >= at) shot = id;
    let [x, y] = FOCUS[shot];
    const st = stage.current;
    if (st && (shot === 's3' || shot === 'g1')) {
      const cam = st.querySelector(`[data-shot="${shot}"] [data-cam]`) as HTMLElement;
      const who = st.querySelector(shot === 's3' ? '[data-k="runner"]' : '[data-k="drib"]') as HTMLElement;
      const cs = Number(gsap.getProperty(cam, 'scale')) || 1, cx = Number(gsap.getProperty(cam, 'x')) || 0, rx = Number(gsap.getProperty(who, 'x')) || 0;
      if (shot === 's3') {           // ball first, then hand over to the runner once he is on the pitch
        const runner = 960 + (rx - 960) * cs, k = Math.min(1, Math.max(0, (t - 1.9) / .5));
        x = 930 + (runner + 140 - 930) * k;
      } else x = cx + rx * cs + 70;    // camera origin is the left edge in G1
    }
    focus.current = { x, y };
    layout();
  }, [layout]);

  const tools = useCallback((T: gsap.core.Timeline) => {
    const $ = one;
    const show = (shot: string, at: number) => {
      T.set('[data-shot]', { autoAlpha: 0 }, at).set(`[data-shot="${shot}"]`, { autoAlpha: 1 }, at)

    };
    const flash = (at: number, a = .9, d = .14) => T.fromTo($('[data-flash]'), { opacity: a }, { opacity: 0, duration: d, ease: 'none', immediateRender: false }, at);
    const shake = (target: string, at: number, amp = 14, d = .3) => {
      const steps = 8;
      for (let i = 0; i < steps; i++) T.set(target, { x: (Math.random() - .5) * amp * (1 - i / steps), y: (Math.random() - .5) * amp * (1 - i / steps) }, at + (i * d) / steps);
      T.set(target, { x: 0, y: 0 }, at + d);
    };
    const spin = (ball: string, at: number, d: number, turns: number, ease = 'none') =>
      T.fromTo(`[data-ball="${ball}"] [data-spin]`, { rotation: 0 }, { rotation: turns * 360, duration: d, ease }, at);
    const stepped = (target: string, at: number, d: number, fps: number, frames: (i: number) => gsap.TweenVars) => {
      const n = Math.floor(d * fps);
      for (let i = 0; i < n; i++) T.set(target, frames(i), at + i / fps);
    };
    return { $, show, flash, shake, spin, stepped };
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const build = useCallback(() => {
    const T = gsap.timeline({ paused: true, onComplete: () => setPhase('hero'), onUpdate: () => frame(T, OPEN_CUTS) });
    const { $, show, flash, shake, spin, stepped } = tools(T);

    /* S2 — ball high in the sky (camera tilting up) */
    show('s2', 0);
    T.fromTo('[data-shot="s2"] [data-cam]', { y: 90, scale: 1.06 }, { y: 0, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
    T.fromTo('[data-ball="s2"]', { scale: 0, xPercent: -50, yPercent: -50 }, { scale: 1, duration: .35, ease: 'back.out(2.4)' }, .12);
    T.fromTo('[data-k="glint2"]', { scale: 0, rotation: 0, opacity: 1 }, { scale: 1.4, rotation: 90, opacity: 0, duration: .5, ease: 'power2.out' }, .4);
    spin('s2', 0, 1.4, 1.2);
    T.to('[data-ball="s2"]', { y: 900, scale: 2.2, duration: .55, ease: 'power2.in' }, .85);
    T.fromTo('[data-k="sky-streak"]', { opacity: 0 }, { opacity: .8, duration: .2 }, .9);

    /* S3 — wide: ball dropping toward the centre circle, Jwandini sprints in */
    show('s3', 1.4); flash(1.4, .55, .1);
    T.fromTo('[data-shot="s3"] [data-cam]', { scale: 1 }, { scale: 1.06, duration: 1.7, ease: 'none', transformOrigin: '50% 70%' }, 1.4);
    T.fromTo('[data-k="wclouds"]', { x: 0 }, { x: -40, duration: 1.7, ease: 'none' }, 1.4);
    T.fromTo('[data-ball="s3"]', { y: -620, xPercent: -50, yPercent: -50 }, { y: 0, duration: 1.7, ease: 'power1.in' }, 1.4);
    spin('s3', 1.4, 1.7, 2);
    T.fromTo('[data-k="bshadow3"]', { scale: .3, opacity: .1 }, { scale: 1, opacity: .35, duration: 1.7, ease: 'power1.in' }, 1.4);
    T.fromTo('[data-k="runner"]', { x: -360 }, { x: 760, duration: 1.6, ease: 'none' }, 1.5);
    stepped('[data-k="runner"] img', 1.5, 1.6, 10, (i) => ({ opacity: ((idx: number) => (idx === i % 6 ? 1 : 0)) as unknown as number }));
    T.fromTo('[data-k="runner-streak"]', { opacity: 0 }, { opacity: .7, duration: .3 }, 1.6);

    /* S4 — medium: held run drawing carried by a background slide and speed lines (whip-pan entry) */
    show('s4', 3.1);
    T.fromTo('[data-shot="s4"] [data-cam]', { x: 220, filter: 'blur(10px)' }, { x: 0, filter: 'blur(0px)', duration: .18, ease: 'power2.out' }, 3.1);
    T.fromTo('[data-k="mground4"]', { x: 0 }, { x: -230, duration: 1.15, ease: 'none' }, 3.1);
    T.fromTo('[data-k="msky4"]', { x: 0 }, { x: -50, duration: 1.15, ease: 'none' }, 3.1);
    T.fromTo('[data-k="speed4"]', { x: 0, opacity: .85 }, { x: -700, duration: 1.15, ease: 'none' }, 3.1);
    stepped('[data-k="cel-run"]', 3.1, 1.15, 8, (i) => ({ y: i % 2 ? -14 : 0, rotation: i % 2 ? -.8 : .4, transformOrigin: '43% 60%' }));
    T.fromTo('[data-ball="s4"]', { x: 0, y: -290, xPercent: -50, yPercent: -50 }, { y: 0, duration: 1.1, ease: 'power1.in' }, 3.1);
    spin('s4', 3.1, 1.15, 2.4);

    /* S5 — first touch: the ball drops onto the instep, impact frame, cushion */
    show('s5', 4.25);
    T.fromTo('[data-shot="s5"] [data-cam]', { scale: 1.1 }, { scale: 1, duration: .5, ease: 'power2.out', transformOrigin: '50% 70%' }, 4.25);
    T.fromTo('[data-ball="s5"]', { y: -880, xPercent: -50, yPercent: -50 }, { y: 0, duration: .42, ease: 'power2.in' }, 4.25);
    spin('s5', 4.25, .42, 1.5);
    const hit = 4.67;
    flash(hit, .85, .12);
    shake('[data-shot="s5"] [data-cam]', hit, 16, .28);
    T.to('[data-ball="s5"]', { scaleX: 1.16, scaleY: .82, duration: .05, yoyo: true, repeat: 1 }, hit);
    T.to('[data-k="cel-touch"]', { y: 12, duration: .08, yoyo: true, repeat: 1, ease: 'power1.out' }, hit);
    T.fromTo('[data-k="focus5"]', { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: .2, ease: 'power2.out' }, hit);
    T.fromTo('[data-k="star5a"],[data-k="star5b"]', { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .25, ease: 'back.out(3)', stagger: .06 }, hit + .02);
    T.fromTo('[data-k="dust5"] span', { scale: .2, opacity: .7 }, { scale: 1.4, opacity: 0, duration: .7, ease: 'power2.out' }, hit);

    /* S6 — close-up: the ball dies on the boot, spin decaying */
    show('s6', 5.45); flash(5.45, .4, .08);
    T.fromTo('[data-shot="s6"] [data-cam]', { scale: 1 }, { scale: 1.08, duration: 1.05, ease: 'power1.out', transformOrigin: '52% 44%' }, 5.45);
    T.set('[data-ball="s6"]', { xPercent: -50, yPercent: -50 }, 5.45);
    spin('s6', 5.45, 1.0, 1.6, 'power3.out');
    T.fromTo('[data-k="focus6"]', { opacity: .9 }, { opacity: .35, duration: 1, ease: 'power1.out' }, 5.45);
    T.fromTo('[data-k="star6a"],[data-k="star6b"]', { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: .3, ease: 'back.out(3)', stagger: .08 }, 5.55);
    T.fromTo('[data-k="arc6"]', { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: .35, ease: 'power2.out' }, 5.45);

    /* S7 — low angle: boot comes down onto the ball */
    show('s7', 6.5);
    T.fromTo('[data-shot="s7"] [data-cam]', { scale: 1.02 }, { scale: 1.08, duration: 1.2, ease: 'none', transformOrigin: '43% 64%' }, 6.5);
    T.set('[data-ball="s7"]', { xPercent: -50, yPercent: -50 }, 6.5);
    T.fromTo('[data-k="cel-step"]', { y: -90 }, { y: 0, duration: .3, ease: 'power3.in' }, 6.55);
    const plant = 6.85;
    T.to('[data-ball="s7"]', { scaleX: 1.08, scaleY: .9, duration: .05, yoyo: true, repeat: 1 }, plant);
    shake('[data-shot="s7"] [data-cam]', plant, 8, .18);
    T.fromTo('[data-k="dust7"] span', { scale: .2, opacity: .8 }, { scale: 1.6, opacity: 0, duration: .8, ease: 'power2.out' }, plant);

    /* S8 — hero reveal: low camera pulls back from the face, sun flare blooms */
    show('s8', 7.7); flash(7.7, .7, .3);
    const f = manifest.shots.hero.face;
    T.fromTo('[data-shot="s8"] [data-cam]', { scale: 1.5, transformOrigin: `${(f[0] / SW) * 100}% ${(f[1] / SH) * 100}%` }, { scale: 1, duration: 1.8, ease: 'power2.inOut' }, 7.7);
    T.fromTo('[data-k="lsky8"]', { x: 0 }, { x: -30, duration: 2.6, ease: 'none' }, 7.7);
    T.fromTo('[data-k="flare8"]', { opacity: .3 }, { opacity: 1, duration: 1.4, ease: 'power1.inOut' }, 8.2);
    T.to({}, { duration: .3 }, 9.6);
    return T;
  }, [layout, tools]);

  /* ---------- the football action: dribble, special move, strike, top corner, into the portfolio ---------- */
  const buildGoal = useCallback(() => {
    const T = gsap.timeline({ paused: true, onComplete: () => setPhase('portfolio'), onUpdate: () => frame(T, GOAL_CUTS) });
    const { $, show, flash, shake, spin, stepped } = tools(T);
    const G = manifest.goal;

    /* G1 — wide: he takes off with the ball, camera tracks him toward goal */
    show('g1', 0); flash(0, .5, .1);
    T.fromTo('[data-shot="g1"] [data-cam]', { scale: 1.12, x: 0, transformOrigin: '0% 70%' }, { x: -230, duration: 1.7, ease: 'none' }, 0);
    T.fromTo('[data-k="gclouds"]', { x: 0 }, { x: 60, duration: 1.7, ease: 'none' }, 0);
    T.fromTo('[data-k="drib"]', { x: 160 }, { x: 1620, duration: 1.7, ease: 'power1.in' }, 0);
    stepped('[data-k="drib"] img', 0, 1.7, 12, (i) => ({ opacity: ((idx: number) => (idx === i % 6 ? 1 : 0)) as unknown as number }));
    T.set('[data-ball="g1"]', { xPercent: -50, yPercent: -50 }, 0);
    for (let i = 0; i < 5; i++) T.to('[data-ball="g1"]', { y: -16, duration: .17, yoyo: true, repeat: 1, ease: 'sine.out' }, i * .34);
    spin('g1', 0, 1.7, 5);
    T.fromTo('[data-k="gstreak1"]', { opacity: 0 }, { opacity: .55, duration: .4 }, .9);

    /* G2 — medium: full-speed dribble, ball pinned to his feet, background tearing past */
    show('g2', 1.7);
    T.fromTo('[data-shot="g2"] [data-cam]', { x: 240, filter: 'blur(10px)' }, { x: 0, filter: 'blur(0px)', duration: .16, ease: 'power2.out' }, 1.7);
    T.fromTo('[data-k="gground2"]', { x: 0 }, { x: -300, duration: 1.2, ease: 'none' }, 1.7);
    T.fromTo('[data-k="gsky2"]', { x: 0 }, { x: -60, duration: 1.2, ease: 'none' }, 1.7);
    T.fromTo('[data-k="gspeed2"]', { x: 0, opacity: .9 }, { x: -800, duration: 1.2, ease: 'none' }, 1.7);
    stepped('[data-k="gcel2"]', 1.7, 1.2, 8, (i) => ({ y: i % 2 ? -14 : 0, rotation: i % 2 ? -.8 : .4, transformOrigin: '43% 60%' }));
    T.set('[data-ball="g2"]', { xPercent: -50, yPercent: -50 }, 1.7);
    for (let i = 0; i < 4; i++) T.fromTo('[data-ball="g2"]', { x: 0, y: 0 }, { x: 60, y: -34, duration: .15, yoyo: true, repeat: 1, ease: 'sine.out', immediateRender: false }, 1.7 + i * .3);
    spin('g2', 1.7, 1.2, 4);

    /* G3 — special-move cut-in */
    show('g3', 2.9); flash(2.9, .8, .12);
    T.fromTo('[data-k="gpanel3"]', { xPercent: -120 }, { xPercent: 0, duration: .22, ease: 'power3.out' }, 2.9);
    T.fromTo('[data-k="gface3"]', { xPercent: -50, yPercent: -34, scale: 1.25 }, { xPercent: -50, yPercent: -34, scale: 1, duration: .9, ease: 'power2.out' }, 2.9);
    T.fromTo('[data-k="gfocus3"]', { scale: 1.3, opacity: 0 }, { scale: 1, opacity: 1, duration: .3 }, 2.9);
    T.fromTo('[data-k="gname3"]', { xPercent: -50, x: 160, opacity: 0 }, { xPercent: -50, x: 0, opacity: 1, duration: .3, ease: 'power3.out' }, 3.05);
    shake('[data-k="gpanel3"]', 3.3, 10, .3);

    /* G4 — the strike: impact frame, ball rockets off */
    show('g4', 3.9);
    T.fromTo('[data-shot="g4"] [data-cam]', { scale: 1.1 }, { scale: 1, duration: .3, ease: 'power2.out', transformOrigin: '52% 44%' }, 3.9);
    T.set('[data-ball="g4"]', { xPercent: -50, yPercent: -50 }, 3.9);
    const strike = 4.08;
    flash(strike, 1, .1);
    shake('[data-shot="g4"] [data-cam]', strike, 22, .3);
    T.to('[data-ball="g4"]', { scaleX: 1.25, scaleY: .75, duration: .05 }, strike);
    T.to('[data-ball="g4"]', { x: 1300, y: -700, scale: .45, duration: .32, ease: 'power2.in' }, strike + .05);
    spin('g4', strike, .4, 6);
    T.fromTo('[data-k="gtrail4"]', { opacity: 0 }, { opacity: .9, duration: .08 }, strike);

    /* G5 — the ball screams into the top corner, net bulges, GOAL */
    show('g5', 4.5);
    T.set('[data-ball="g5"]', { xPercent: -50, yPercent: -50 }, 4.5);
    T.fromTo('[data-ball="g5"]', { x: -1100, y: 760, scale: 4.2 }, { x: 0, y: 0, scale: 1, duration: .42, ease: 'power2.out' }, 4.5);
    spin('g5', 4.5, 1.2, 4, 'power3.out');
    const goal = 4.92;
    flash(goal, .9, .16);
    shake('[data-shot="g5"] [data-cam]', goal, 20, .4);
    const ox = (G.corner[0] / 1920) * 100, oy = (G.corner[1] / 1080) * 100;
    T.fromTo('[data-k="gnet5"]', { scale: 1, transformOrigin: `${ox}% ${oy}%` }, { scale: 1.07, duration: .12, ease: 'power2.out', yoyo: true, repeat: 1 }, goal);
    T.to('[data-k="gnet5"]', { keyframes: [{ skewX: 2, duration: .1 }, { skewX: -1.5, duration: .12 }, { skewX: .6, duration: .14 }, { skewX: 0, duration: .16 }] }, goal + .24);
    T.to('[data-ball="g5"]', { y: 40, x: -30, duration: .5, ease: 'bounce.out' }, goal + .05);
    T.fromTo('[data-k="gfocus5"]', { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: .25 }, goal);
    T.fromTo('[data-k="gcall5"]', { xPercent: -50, yPercent: -50, scale: 2.4, opacity: 0, rotation: -8 }, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1, rotation: -4, duration: .3, ease: 'back.out(2.2)' }, goal + .08);
    /* push into the net -> portfolio */
    T.to('[data-shot="g5"] [data-cam]', { scale: 7, duration: .9, ease: 'power3.in', transformOrigin: `${ox}% ${oy}%` }, 6.3);
    T.to('[data-k="gcall5"]', { opacity: 0, duration: .3 }, 6.3);
    T.fromTo($('[data-flash]'), { opacity: 0 }, { opacity: 1, duration: .25, immediateRender: false }, 7.0);
    return T;
  }, [tools]);
  const gl = useRef<gsap.core.Timeline | null>(null);

  /* idle loop on the title shot */
  useEffect(() => () => { idle.current?.kill(); tl.current?.kill(); }, []);
  useEffect(() => {
    if (phase !== 'ready' || !stage.current || tl.current) return;
    focus.current = { x: FOCUS.s1[0], y: FOCUS.s1[1] };
    layout();
    gsap.set('[data-shot]', { autoAlpha: 0 });
    gsap.set('[data-shot="s1"]', { autoAlpha: 1 });
    idle.current = gsap.timeline({ repeat: -1, yoyo: true, paused: reduced })   // title shot stays still with reduced motion
      .to('[data-k="wclouds1"]', { x: -60, duration: 9, ease: 'sine.inOut' }, 0)
      .to('[data-shot="s1"] [data-cam]', { scale: 1.03, duration: 9, ease: 'sine.inOut', transformOrigin: '50% 60%' }, 0);
    tl.current = build();
    // review hooks: ?seek=4.2 (opening), ?seek=g3.1 (goal sequence), ?view=portfolio
    const qs = new URLSearchParams(location.search), seek = qs.get('seek');
    if (qs.get('view') === 'portfolio') { idle.current.kill(); setPhase('portfolio'); return; }
    if (seek !== null) {
      idle.current.kill();
      if (seek.startsWith('g')) { gl.current = buildGoal(); setPhase('goal'); gl.current.seek(parseFloat(seek.slice(1))).pause(); frame(gl.current, GOAL_CUTS); }
      else { setPhase('playing'); tl.current.seek(parseFloat(seek)).pause(); frame(tl.current, OPEN_CUTS); }
    }
  }, [phase, build, buildGoal, layout, reduced, frame]);

  const start = () => {
    idle.current?.kill();
    if (reduced && tl.current) { // no motion: jump straight to the opening's final composition
      tl.current.progress(1, true).pause();
      frame(tl.current, OPEN_CUTS);
      setPhase('hero'); return;
    }
    setPhase('playing');
    tl.current?.play(0);
  };
  /* "Meet Jwandini": the football action, then the portfolio */
  const meet = () => {
    if (reduced) { setPhase('portfolio'); return; }
    gl.current?.kill();
    gl.current = buildGoal();
    setPhase('goal');
    gl.current.play(0);
  };
  const replay = () => {
    if (reduced && tl.current) { gsap.set('[data-flash]', { opacity: 0 }); tl.current.progress(1, true).pause(); frame(tl.current, OPEN_CUTS); setPhase('hero'); return; }
    gsap.set('[data-flash]', { opacity: 0 });
    gl.current?.kill(); gl.current = null;
    setPhase('playing');
    tl.current?.play(0);
  };

  const H = manifest.shots;
  return (
    <div ref={root} className={css.root}>
      <div ref={stage} className={css.stage} aria-hidden style={{ visibility: phase === 'portfolio' ? 'hidden' : undefined }}>
        {/* S1 title */}
        <div className={css.shot} data-shot="s1"><div className={css.cam} data-cam>
          <Plate name="wide-sky" /><Plate name="wide-clouds" k="wclouds1" /><Plate name="wide-stadium" /><Plate name="wide-pitch" />
        </div></div>
        {/* S2 sky */}
        <div className={css.shot} data-shot="s2"><div className={css.cam} data-cam>
          <Plate name="sky-up" />
          <div className={css.plate} data-k="sky-streak" style={{ opacity: 0 }}><Plate name="fx-speed-down" /></div>
          <Ball id="s2" x={1180} y={330} r={30} />
          <Star x={1206} y={304} s={22} k="glint2" />
        </div></div>
        {/* S3 wide */}
        <div className={css.shot} data-shot="s3"><div className={css.cam} data-cam>
          <Plate name="wide-sky" /><Plate name="wide-clouds" k="wclouds" /><Plate name="wide-stadium" /><Plate name="wide-pitch" />
          <div className={css.shadow} data-k="bshadow3" style={{ left: 930, top: 742, width: 60, height: 16 }} />
          <Ball id="s3" x={930} y={700} r={26} />
          <div className={css.runner} data-k="runner" style={{ left: 0, top: 0 }}>
            {manifest.run.ground.map((g, i) => {
              const s = .36, b = manifest.run.box;
              return <img key={i} alt="" src={src(`run-${i}`)} style={{ position: 'absolute', width: b * s, left: -manifest.run.hip[0] * s, top: 930 - (manifest.run.hip[1] + g) * s, opacity: i ? 0 : 1 }} />;
            })}
          </div>
        </div></div>
        {/* S4 run to the ball */}
        <div className={css.shot} data-shot="s4"><div className={css.cam} data-cam>
          <Plate name="mid-sky" k="msky4" />
          <div className={css.wide} data-k="mground4"><Plate name="mid-ground" /></div>
          <div className={css.wide} data-k="speed4"><Plate name="fx-speed" /></div>
          <Ball id="s4" x={H.run.ball.to[0]} y={H.run.ball.to[1]} r={H.run.ball.r} />
          <div className={css.plate} data-k="cel-run"><Plate name="cel-run" /></div>
        </div></div>
        {/* S5 first touch */}
        <div className={css.shot} data-shot="s5"><div className={css.cam} data-cam>
          <Plate name="mid-sky" /><Plate name="mid-ground" />
          <div className={css.plate} data-k="focus5" style={{ opacity: 0, transform: `translate(${H.touch.ball.at[0] - 960}px, ${H.touch.ball.at[1] - 540}px)` }}><Plate name="fx-focus" /></div>
          <div className={css.plate} data-k="cel-touch"><Plate name="cel-touch" /></div>
          <Ball id="s5" x={H.touch.ball.at[0]} y={H.touch.ball.at[1]} r={H.touch.ball.r} />
          <Star x={H.touch.ball.at[0] + 60} y={H.touch.ball.at[1] - 48} s={24} k="star5a" />
          <Star x={H.touch.ball.at[0] - 60} y={H.touch.ball.at[1] - 24} s={15} k="star5b" />
          <Dust x={786} y={H.touch.ground} k="dust5" />
        </div></div>
        {/* S6 close-up */}
        <div className={css.shot} data-shot="s6"><div className={css.cam} data-cam>
          <Plate name="close-grass-blur" />
          <div className={css.plate} data-k="focus6" style={{ transform: `translate(${1000 - 960}px, ${470 - 540}px)` }}><Plate name="fx-focus" /></div>
          <Plate name="cel-close" />
          <Ball id="s6" x={1000} y={470} r={H.close.ball.r} />
          <svg className={css.plate} viewBox="0 0 1920 1080" aria-hidden><path data-k="arc6" d="M 840,300 A 220 220 0 0 1 1180,330" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".6" strokeDasharray="600" /></svg>
          <Star x={1180} y={330} s={36} k="star6a" /><Star x={820} y={380} s={20} k="star6b" />
        </div></div>
        {/* S7 boot on the ball */}
        <div className={css.shot} data-shot="s7"><div className={css.cam} data-cam>
          <Plate name="close-grass" /><Plate name="cel-step-shadow" />
          <Ball id="s7" x={820} y={700} r={H.step.ball.r} />
          <div className={css.plate} data-k="cel-step"><Plate name="cel-step" /></div>
          <Dust x={720} y={H.step.ground} k="dust7" />
        </div></div>
        {/* S8 hero reveal */}
        <div className={css.shot} data-shot="s8"><div className={css.cam} data-cam>
          <Plate name="low-sky" k="lsky8" /><Plate name="low-ground" /><Plate name="cel-hero-shadow" />
          <Ball id="s8" x={H.hero.ball.at[0]} y={H.hero.ball.at[1]} r={H.hero.ball.r} light="tl" />
          <Plate name="cel-hero" />
          <div className={css.plate} data-k="flare8" style={{ opacity: .3 }}><Plate name="low-flare" /></div>
        </div></div>
        {/* G1 wide: he takes off with the ball, camera tracks him across the pitch */}
        <div className={css.shot} data-shot="g1"><div className={css.cam} data-cam>
          <Plate name="wide-sky" /><Plate name="wide-clouds" k="gclouds" /><Plate name="wide-stadium" /><Plate name="wide-pitch" />
          <div className={css.runner} data-k="drib" style={{ left: 0, top: 0 }}>
            {manifest.run.ground.map((g, i) => {
              const s = .4, b = manifest.run.box;
              return <img key={i} alt="" src={src(`run-${i}`)} style={{ position: 'absolute', width: b * s, left: -manifest.run.hip[0] * s, top: 950 - (manifest.run.hip[1] + g) * s, opacity: i ? 0 : 1 }} />;
            })}
            <Ball id="g1" x={86} y={936} r={14} />
          </div>
          <div className={css.plate} data-k="gstreak1" style={{ opacity: 0 }}><Plate name="fx-speed" /></div>
        </div></div>
        {/* G2 medium: dribbling at full speed */}
        <div className={css.shot} data-shot="g2"><div className={css.cam} data-cam>
          <Plate name="mid-sky" k="gsky2" />
          <div className={css.wide} data-k="gground2"><Plate name="mid-ground" /></div>
          <div className={css.wide} data-k="gspeed2"><Plate name="fx-speed" /></div>
          <div className={css.plate} data-k="gcel2"><Plate name="cel-run" /></div>
          <Ball id="g2" x={1070} y={985} r={46} />
        </div></div>
        {/* G3 special-move cut-in */}
        <div className={css.shot} data-shot="g3"><div className={css.cam} data-cam>
          <div className={css.cutBg} />
          <div className={css.plate} data-k="gfocus3"><Plate name="fx-focus" /></div>
          <div className={css.cutPanel} data-k="gpanel3">
            <img className={css.cutFace} data-k="gface3" alt="" src={src('face-shout')} />
          </div>
          <div className={css.moveName} data-k="gname3"><small>必殺技 · SPECIAL MOVE</small><strong>BLAUGRANA DRIVE</strong></div>
        </div></div>
        {/* G4 the strike */}
        <div className={css.shot} data-shot="g4"><div className={css.cam} data-cam>
          <Plate name="close-grass-blur" />
          <div className={css.plate} data-k="gfocus4" style={{ transform: 'translate(40px,-70px)' }}><Plate name="fx-focus" /></div>
          <Plate name="cel-close" />
          <div className={css.plate} data-k="gtrail4" style={{ opacity: 0 }}><Plate name="fx-speed" /></div>
          <Ball id="g4" x={1000} y={470} r={H.close.ball.r} />
        </div></div>
        {/* G5 top corner */}
        <div className={css.shot} data-shot="g5"><div className={css.cam} data-cam>
          <Plate name="mid-sky" /><div className={css.blurred}><Plate name="mid-ground" /></div>
          <div className={css.plate} data-k="gnet5"><Plate name="goal-net" /></div>
          <Ball id="g5" x={manifest.goal.corner[0]} y={manifest.goal.corner[1]} r={30} />
          <Plate name="goal-frame" />
          <div className={css.plate} data-k="gfocus5" style={{ opacity: 0, transform: `translate(${manifest.goal.corner[0] - 960}px, ${manifest.goal.corner[1] - 540}px)` }}><Plate name="fx-focus" /></div>
        </div></div>
        <div className={css.flash} data-flash />
      </div>

      <div className={css.goalCall} data-k="gcall5" aria-hidden><span>ゴール!!</span><strong>GOAL!</strong></div>

      {/* UI */}
      {phase === 'loading' && (
        <div className={css.loading} role="status" aria-live="polite">
          <span>Loading the episode…</span>
          <div className={css.bar}><i style={{ width: `${(loaded / PRELOAD.length) * 100}%` }} /></div>
        </div>
      )}
      {phase === 'ready' && (
        <div className={css.title}>
          <p className={css.kicker}>第1話 · Episode 01</p>
          <h1 className={css.h1}>JWANDINI <b>#18</b></h1>
          <p className={css.sub}>Software for the beautiful game</p>
          <button className={css.cta} onClick={start} autoFocus>Kick off</button>
        </div>
      )}
      {phase === 'hero' && (
        <div className={css.end}>
          <p className={css.kicker}>No. 18 · Forward</p>
          <h2 className={css.h2}>Jwandini <b>#18</b></h2>
          <p className={css.sub}>{cv.role} · {cv.tagline.toLowerCase()}</p>
          <div className={css.row}>
            <button className={css.cta} onClick={meet} autoFocus>Meet Jwandini</button>
          </div>
        </div>
      )}
      {phase === 'portfolio' && <Portfolio onReplay={replay} reduced={reduced} />}
      <p className={css.srOnly} aria-live="polite">{LIVE[phase]}</p>
    </div>
  );
}
