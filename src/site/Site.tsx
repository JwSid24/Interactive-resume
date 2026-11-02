'use client';
// Motion-led portfolio: one continuous camera move through seven pinned scenes. Every scene ends in the colour and
// framing the next one starts with, so the page reads as a single shot. The DOM below is the readable, static
// layout (used for reduced motion); motion.ts layers the scroll choreography on top when motion is allowed.
import { useEffect, useRef, useState, lazy, Suspense, type ReactNode } from 'react';
import { cv, Entry } from '../content/cv';
import manifest from '../../public/assets/opening/manifest.json';
import { setupMotion, scrollToScene, FORMATION } from './motion';
import s from './site.module.css';

const OpeningScene = lazy(() => import('../scenes/opening/OpeningScene'));
const A = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/opening/';
const img = (n: string) => A + n + '.svg';

export const NAV = [
  { id: 'about', no: '02', label: 'About' },
  { id: 'skills', no: '03', label: 'Skills' },
  { id: 'projects', no: '04', label: 'Projects' },
  { id: 'career', no: '05', label: 'Career' },
  { id: 'football', no: '06', label: 'Football' },
  { id: 'contact', no: '07', label: 'Contact' },
];
const PILLARS = [
  { no: '01', title: 'Control the game', text: 'Set the rhythm and keep the team in shape.' },
  { no: '02', title: 'Defensive stability', text: 'Screen the back line and close the spaces.' },
  { no: '03', title: 'Win it, then dictate', text: 'Win possession and set the tempo from midfield.' },
];
// The three chapters restate what the project text already says: character, layered environments, GSAP timeline.
const CHAPTERS = [
  { no: '01', title: 'An original character', text: 'Designed from a locked model sheet and drawn as layered SVG cels.' },
  { no: '02', title: 'Layered stadium environments', text: 'Sky, stands and pitch are separate layers, so the camera can move through them.' },
  { no: '03', title: 'A GSAP-driven timeline', text: 'Every shot, cut and run-cycle frame is sequenced on one GSAP timeline.' },
];

/* career entries in the order they started, oldest first: the season unfolds left to right */
const MONTH: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const startOf = (when: string) => { const [m, y] = when.split('–')[0].trim().split(' '); return +y * 12 + (MONTH[m] ?? 0); };
type Season = Entry & { kind: string };
const SEASONS: Season[] = [
  ...cv.experience.map((e) => ({ ...e, kind: 'Work' })),
  ...cv.volunteering.map((e) => ({ ...e, kind: 'Volunteering' })),
  ...cv.education.map((e) => ({ ...e, kind: 'Education' })),
].sort((a, b) => startOf(a.when) - startOf(b.when));

/* a 16:9 plate that covers its box like object-fit: cover, so layers can be placed in 1920x1080 coordinates */
function Cover({ children, k, className = '' }: { children: ReactNode; k?: string; className?: string }) {
  return <div className={`${s.cover} ${className}`} data-k={k} aria-hidden><div className={s.plate}>{children}</div></div>;
}
function Lay({ k, depth = 0, children, className = '' }: { k?: string; depth?: number; children: ReactNode; className?: string }) {
  return <div className={`${s.lay} ${className}`} data-k={k}><div className={s.par} data-depth={depth}>{children}</div></div>;
}
function Img({ n, eager, className }: { n: string; eager?: boolean; className?: string }) {
  return <img className={className} src={img(n)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />;
}
function Ball({ x, y, r, light = 'tr', k }: { x: number; y: number; r: number; light?: 'tr' | 'tl'; k?: string }) {
  const size = (manifest.ball.box * r) / manifest.ball.r;
  return (
    <div className={s.ball} data-k={k} style={{ left: `${(x / 1920) * 100}%`, top: `${(y / 1080) * 100}%`, width: `${(size / 1920) * 100}%` }}>
      <Img n="ball-pattern" eager /><Img n={light === 'tl' ? 'ball-shade-tl' : 'ball-shade'} eager />
    </div>
  );
}
/* the run cycle: six frames stacked on the same hip point, shown one at a time */
function Runner({ x, ground, scale, k }: { x: number; ground: number; scale: number; k: string }) {
  const b = manifest.run.box, hip = manifest.run.hip;
  return (
    <div className={s.runner} data-k={k}>
      {manifest.run.ground.map((g, i) => (
        <img key={i} src={img(`run-${i}`)} alt="" loading="lazy" decoding="async" data-frame={i}
          style={{ left: `${((x - hip[0] * scale) / 1920) * 100}%`, top: `${((ground - (hip[1] + g) * scale) / 1080) * 100}%`, width: `${((b * scale) / 1920) * 100}%`, opacity: i ? 0 : 1 }} />
      ))}
    </div>
  );
}
function Label({ no, children }: { no: string; children: ReactNode }) {
  return <p className={s.label} data-fade><span>{no}</span><i aria-hidden />{children}</p>;
}
function Details({ e }: { e: Entry }) {
  if (!e.points) return null;
  return (
    <details className={s.details}>
      <summary>What I did</summary>
      <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
    </details>
  );
}

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const [motion, setMotion] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [episode, setEpisode] = useState(false);
  const email = cv.links.find((l) => l.label === 'Email')!;
  const hero = manifest.shots.hero;

  /* motion is opt-out: reduced-motion users (or ?motion=reduce) get the static layout */
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const forced = new URLSearchParams(location.search).get('motion') === 'reduce';
    const update = () => setMotion(!mq.matches && !forced);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  /* the match clock and progress bar follow the scroll in every mode */
  useEffect(() => {
    const clock = root.current?.querySelector<HTMLElement>('[data-clock]');
    const label = root.current?.querySelector<HTMLElement>('[data-clock-label]');
    const bar = root.current?.querySelector<HTMLElement>('[data-progress]');
    const scenes = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-scene]') ?? []);
    let raf = 0;
    const tick = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      if (clock) clock.textContent = `${Math.round(p * 90)}'`;
      if (bar) bar.style.transform = `scaleX(${p})`;
      let current = 'Kick-off';
      for (const el of scenes) if (el.getBoundingClientRect().top < innerHeight * .45) current = el.dataset.scene!;
      if (label && label.textContent !== current) label.textContent = current;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [motion]);

  useEffect(() => {
    if (!motion || !root.current) return;
    return setupMotion(root.current);
  }, [motion]);

  /* lock scroll while the episode is open; hand focus back to its button when it closes */
  useEffect(() => {
    document.body.classList.toggle('lock', episode);
    if (!episode && wasOpen.current) opener.current?.focus({ preventScroll: true });
    wasOpen.current = episode;
  }, [episode]);
  useEffect(() => {
    if (!episode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEpisode(false); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [episode]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(email.value); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* clipboard blocked: the mailto link still works */ }
  };
  const go = (id: string) => { setMenu(false); scrollToScene(id, motion); };

  return (
    <div ref={root} className={`${s.root} ${motion ? s.on : ''}`}>
      {/* ---------- chrome: nav, progress, match clock, cursor ---------- */}
      <header className={s.nav}>
        <a href="#top" className={s.brand} aria-label="Jwan Sidou, back to top" onClick={(e) => { e.preventDefault(); go('top'); }}><b>JWAN SIDOU</b><span>18</span></a>
        <nav aria-label="Sections">
          <ul className={`${s.links} ${menu ? s.linksOpen : ''}`} id="site-menu">
            {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); go(n.id); }}><span>{n.no}</span>{n.label}</a></li>)}
          </ul>
        </nav>
        <button className={s.menuBtn} aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
      </header>
      <div className={s.progress} aria-hidden><i data-progress /></div>
      <p className={s.clock} aria-hidden><b data-clock>0&apos;</b><span data-clock-label>Kick-off</span></p>
      <div className={s.cursor} data-cursor aria-hidden><span data-cursor-label /></div>

      <main>
        {/* ============ 01 kick-off  →  02 about (one pinned stage) ============ */}
        <div className={s.kick} data-kick>
          <section className={s.kStage} data-k="stage" id="top" data-scene="Kick-off" aria-labelledby="hero-title">
            <p className={s.kOutline} data-k="outline" aria-hidden>18</p>
            <div className={s.kTilt} data-k="tilt">
              <div className={s.kFrame} data-k="frame">
                <Cover k="back">
                  <Lay k="sky" depth={.25}><Img n="low-sky" eager /></Lay>
                  <Lay k="ground" depth={.5}><Img n="low-ground" eager /></Lay>
                </Cover>
                <div className={s.kScrim} data-k="scrim" aria-hidden />
                <h1 id="hero-title" className={s.kName} data-k="name">
                  <span className={s.mask} data-k="m1"><span data-k="n1">Jwan</span></span>{' '}
                  <span className={s.mask} data-k="m2"><span data-k="n2">Sidou</span></span>
                </h1>
                <Cover k="front">
                  <Lay k="fig" depth={1}>
                    <Img n="cel-hero-shadow" eager />
                    <Ball x={hero.ball.at[0]} y={hero.ball.at[1]} r={hero.ball.r} light="tl" />
                    <Img n="cel-hero" eager />
                  </Lay>
                  <Lay k="flare" depth={1.4}><Img n="low-flare" eager className={s.flare} /></Lay>
                </Cover>
                <div className={s.kShade} data-k="shade" aria-hidden />
              </div>
            </div>
            <span className={s.sr}>Jwan Sidou drawn as an anime footballer in a blaugrana number 18 kit, foot on the ball.</span>

            <div className={s.kUi} data-k="ui" data-at="0">
              <p className={s.kKicker} data-intro>01 — Portfolio · <span lang="ja">ポートフォリオ</span></p>
              <p className={s.kLine} data-intro><em>Software engineering student</em> who plays like a midfielder: reading the game, connecting people and keeping things moving.</p>
              <div className={s.kSide} data-intro>
                <ul className={s.kMeta}>
                  <li><span>Position</span>{cv.football.position} · No. {cv.number}</li>
                  <li><span>Studying</span>BEng Software Technology, SDU</li>
                  <li><span>Based in</span>Odense, Denmark</li>
                </ul>
                <div className={s.kCta}>
                  <a className={s.btn} href="#contact" data-magnetic onClick={(e) => { e.preventDefault(); go('contact'); }}>Get in touch</a>
                  <button ref={opener} className={s.btnGhost} data-magnetic onClick={() => setEpisode(true)}>▶ Watch the opening</button>
                </div>
              </div>
              <p className={s.kCue} data-intro aria-hidden><i />Scroll to kick off</p>
            </div>
            <div className={s.kCardUi} data-k="cardui" aria-hidden>
              <b>18</b><span>{cv.football.position}</span>
              <p>JWAN SIDOU<small>{cv.role}</small></p>
            </div>
            <div className={s.kExit} data-k="exit" aria-hidden />
          </section>

          <section className={s.kAbout} id="about" aria-labelledby="about-title">
            <div className={s.kAboutIn} data-scene="About">
              <Label no="02">About · <span lang="ja">プロフィール</span></Label>
              <h2 id="about-title" className={s.h2} data-split>People <em>&amp;</em> technology.</h2>
              <blockquote className={s.quote} data-split>&ldquo;I thrive at the intersection of people and technology.&rdquo;</blockquote>
              {cv.about.map((p, i) => <p key={i} className={s.body} data-split>{p}</p>)}
              <dl className={s.facts} data-fade>
                {cv.stats.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
              </dl>
              <h3 className={s.small} data-fade>Languages</h3>
              <ul className={s.langs} data-stagger>{cv.languages.map((l) => <li key={l.name}><b>{l.name}</b><span>{l.level}</span></li>)}</ul>
            </div>
          </section>
        </div>

        {/* ============ 03 skills: the squad takes its positions ============ */}
        <section className={s.sk} id="skills" data-scene="Skills" aria-labelledby="skills-title">
          <div className={s.skStage} data-k="skstage">
            <div className={s.skPitchWrap} aria-hidden>
              <svg className={s.skPitch} data-k="pitch" viewBox="0 0 1050 680" preserveAspectRatio="none">
                <path data-draw d="M 20 20 H 1030 V 660 H 20 Z M 525 20 V 660 M 20 160 H 185 V 520 H 20 M 1030 160 H 865 V 520 H 1030 M 20 255 H 75 V 425 H 20 M 1030 255 H 975 V 425 H 1030" />
                <path data-draw d="M 616.5 340 A 91.5 91.5 0 1 1 433.5 340 A 91.5 91.5 0 1 1 616.5 340" />
              </svg>
            </div>
            <p className={s.skMarquee} data-k="marquee" aria-hidden>The squad · The squad · The squad · The squad ·</p>
            <header className={s.skHead}>
              <Label no="03">Skills &amp; technologies · <span lang="ja">能力</span></Label>
              <h2 id="skills-title" className={s.h2} data-split>The squad <em>I play with.</em></h2>
            </header>
            <div className={s.skField} data-k="field">
              <svg className={s.skNet} data-k="net" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
                {FORMATION.links.map(([a, b], i) => <line key={i} data-link={`${a}-${b}`} vectorEffect="non-scaling-stroke" />)}
              </svg>
              {cv.skills.map((g, gi) => (
                <div key={g.group} className={`${s.skGroup} ${gi ? s.skGroupB : ''}`} data-group={gi}>
                  <h3 className={s.skCap} data-k={`cap${gi}`}><b>{g.group}</b><span>{String(g.items.length).padStart(2, '0')} players</span></h3>
                  <ul className={s.skList}>
                    {g.items.map((t, i) => (
                      <li key={t} className={`${s.tok} ${gi ? s.tokB : ''}`} data-tok={gi * cv.skills[0].items.length + i}>
                        <span className={s.tokIn} data-tok-in><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={s.skWipe} data-k="skwipe" aria-hidden />
          </div>
        </section>

        {/* ============ 04 projects: the highlight reel opens into a case study ============ */}
        <section className={s.pr} id="projects" data-scene="Projects" aria-labelledby="projects-title">
          <div className={s.prStage} data-k="prstage">
            <div className={s.prTop} data-k="prtop">
              <Label no="04">Featured project · <span lang="ja">ハイライト</span></Label>
            </div>
            <h2 id="projects-title" className={s.prTitle}>
              <span data-k="w1">Highlight</span> <span data-k="w2"><em>reel.</em></span>
            </h2>
            <div className={s.prTilt} data-k="prtilt">
              <div className={s.prCard} data-k="card" data-cursor-text="Scroll">
                <div className={s.prScene} data-ch="0">
                  <Cover>
                    <Lay k="pr-sky"><Img n="mid-sky" /></Lay>
                    <Lay k="pr-ground"><Img n="mid-ground" /></Lay>
                    <Lay k="pr-speed"><Img n="fx-speed" /></Lay>
                    <Runner x={900} ground={980} scale={.82} k="pr-run" />
                  </Cover>
                </div>
                <div className={`${s.prScene} ${s.prFace}`} data-ch="1">
                  <div className={s.prStripes} data-k="stripes" aria-hidden />
                  <img className={s.prFaceImg} data-k="face" src={img('face-focus')} alt="" loading="lazy" decoding="async" />
                  <ul className={s.prNotes} aria-hidden>
                    <li data-note>Espresso-brown flow middle part</li>
                    <li data-note>Blaugrana No. 18 kit</li>
                    <li data-note>Layered SVG cels</li>
                  </ul>
                </div>
                <div className={`${s.prScene} ${s.prLayers}`} data-ch="2">
                  <div className={s.prStack} data-k="stack">
                    {['wide-sky', 'wide-clouds', 'wide-stadium', 'wide-pitch'].map((n, i) => (
                      <div key={n} className={s.prSheet} data-sheet={i}><Img n={n} /><span>{['Sky', 'Clouds', 'Stands', 'Pitch'][i]}</span></div>
                    ))}
                  </div>
                </div>
                <div className={`${s.prScene} ${s.prStrip}`} data-ch="3">
                  <div className={s.prRuler} aria-hidden>{Array.from({ length: 13 }, (_, i) => <i key={i}>{(i * .25).toFixed(2)}s</i>)}</div>
                  <div className={s.prFrames} data-k="frames">
                    {[0, 1, 2, 3, 4, 5].map((i) => <figure key={i} data-cell={i}><Img n={`run-${i}`} /><figcaption>run-{i}</figcaption></figure>)}
                  </div>
                  <i className={s.prHead} data-k="playhead" aria-hidden />
                </div>
                <div className={s.prShade} aria-hidden />
              </div>
            </div>
            {cv.projects.map((p) => (
              <article key={p.title} className={s.prCase} data-k="case" data-at=".26">
                <p className={s.prTag}>Case study 01 · {p.tag}</p>
                <h3 className={s.prName} data-k="prname">{p.title}</h3>
                <p className={s.prText} data-k="prtext">{p.text}</p>
                <div data-k="prcta"><a className={s.btn} href={p.link} target="_blank" rel="noreferrer" data-magnetic>View the code on GitHub <span aria-hidden>→</span></a></div>
              </article>
            ))}
            <ol className={s.prChapters}>
              {CHAPTERS.map((c, i) => (
                <li key={c.no} data-chap={i} data-at={[.47, .65, .86][i]}><span>{c.no} / 03</span><b>{c.title}</b><p>{c.text}</p></li>
              ))}
            </ol>
            <p className={s.prMore} data-k="more">More case studies are on their way.</p>
          </div>
        </section>

        {/* ============ 05 career: season by season, left to right ============ */}
        <section className={s.ca} id="career" data-scene="Career" aria-labelledby="career-title">
          <div className={s.caStage} data-k="castage">
            <header className={s.caHead}>
              <Label no="05">Experience &amp; education · <span lang="ja">経歴</span></Label>
              <h2 id="career-title" className={s.h2} data-split>Season <em>by season.</em></h2>
            </header>
            <p className={s.caYear} data-k="year" aria-hidden>{SEASONS[0].when.split('–')[0].trim().split(' ')[1]}</p>
            <div className={s.caLine} aria-hidden><i data-k="caball"><Img n="ball-pattern" /></i></div>
            <ol className={s.caTrack} data-k="track">
              {SEASONS.map((e) => (
                <li key={e.title + e.place + e.when} className={s.caItem} data-season data-year={e.when.split('–')[0].trim().split(' ')[1]}>
                  <div className={s.caCard} data-season-in>
                    <p className={s.caMeta}><span data-kind={e.kind}>{e.kind}</span>{e.when}</p>
                    <h3 className={s.caRole}>{e.title}</h3>
                    <p className={s.caPlace}>{e.place}{e.location ? <span> · {e.location}</span> : null}</p>
                    {e.tags && <ul className={s.tags} aria-label={`${e.kind} details`}>{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                    {e.note && <p className={s.note}>{e.note}</p>}
                    <Details e={e} />
                  </div>
                </li>
              ))}
              <li className={s.caEnd} data-k="caend" aria-hidden><span>Next</span>06 · Football</li>
            </ol>
          </div>
        </section>

        {/* ============ 06 football: zoom through the letters into the stadium ============ */}
        <section className={s.fo} id="football" data-scene="Football" aria-labelledby="football-title">
          <div className={s.foStage} data-k="fostage">
            <Cover k="fobg" className={s.foBg}>
              <Lay><Img n="wide-sky" /></Lay><Lay><Img n="wide-clouds" /></Lay>
              <Lay><Img n="wide-stadium" /></Lay><Lay><Img n="wide-pitch" /></Lay>
            </Cover>
            <div className={s.foScrim} data-k="foscrim" aria-hidden />
            {(['land', 'port'] as const).map((o) => (
              <svg key={o} className={`${s.foMask} ${o === 'port' ? s.foMaskPort : s.foMaskLand}`} data-mask={o} aria-hidden
                viewBox={o === 'land' ? '0 0 1600 900' : '0 0 900 1600'} preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id={`fo-g-${o}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5C0A2A" /><stop offset=".55" stopColor="#2A1240" /><stop offset="1" stopColor="#0A2E6E" /></linearGradient>
                  <mask id={`fo-m-${o}`}>
                    <rect width="100%" height="100%" fill="#fff" />
                    <text data-letters x={o === 'land' ? 800 : 450} y={o === 'land' ? 600 : 960} textAnchor="middle" fontSize={o === 'land' ? 560 : 400} fontWeight={900} fill="#000" style={{ fontFamily: 'var(--f-display), Impact, sans-serif' }}>
                      CDM
                    </text>
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill={`url(#fo-g-${o})`} mask={`url(#fo-m-${o})`} />
              </svg>
            ))}
            <div className={s.foIntro} data-k="fointro">
              <Label no="06">Football &amp; identity · <span lang="ja">背番号18</span></Label>
              <h2 id="football-title" className={s.foTitle}><span className={s.foCdm}>{cv.football.position}</span><em>{cv.football.positionLong}</em></h2>
            </div>
            <div className={s.foBody} data-k="fobody" data-at=".5">
              <p className={s.bodyLight} data-k="forole">{cv.football.role}</p>
              <p className={s.bodyLight} data-k="foplay">I have played football for many years. It taught me that being a team player goes far beyond the pitch, the classroom or the codebase.</p>
              <ol className={s.pillars}>
                {PILLARS.map((p) => <li key={p.no} data-pillar><span>{p.no}</span><b>{p.title}</b><p>{p.text}</p></li>)}
              </ol>
            </div>
            <div className={s.foSpeed} data-k="fospeed" aria-hidden><Img n="fx-speed" /></div>
            <figure className={s.foMove} data-k="fomove">
              <img src={img('face-shout')} alt="Jwan Sidou shouting, anime close-up" loading="lazy" decoding="async" />
              <figcaption><small>必殺技 · Special move</small>TIGER SHOT</figcaption>
            </figure>
            <div className={s.foNight} data-k="fonight" aria-hidden />
          </div>
        </section>

        {/* ============ 07 contact: full time, the ball opens the last page ============ */}
        <section className={s.co} id="contact" data-scene="Contact" aria-labelledby="contact-title">
          <div className={s.coStage} data-k="costage">
            <div className={s.coBall} data-k="coball" aria-hidden><Img n="ball-pattern" /><Img n="ball-shade" /></div>
            <div className={s.coPaper} data-k="copaper" data-at="1">
              <div className={s.coIn}>
                <Label no="07">Contact · <span lang="ja">契約</span></Label>
                <h2 id="contact-title" className={s.huge} data-k="cotitle">Let&apos;s <em>talk.</em></h2>
                <p className={s.body} data-co>{cv.status}. The quickest way to reach me is by email.</p>
                <div className={s.mailRow} data-co>
                  <a className={s.mail} href={email.href} data-magnetic>{email.value}</a>
                  <button className={s.copy} onClick={copy}>{copied ? 'Copied ✓' : 'Copy email'}</button>
                  <span className={s.sr} aria-live="polite">{copied ? 'Email address copied' : ''}</span>
                </div>
                <ul className={s.contactList} data-co>
                  {cv.links.filter((l) => l.label !== 'Email').map((l) => (
                    <li key={l.label}><span>{l.label}</span>{l.href ? <a href={l.href} target="_blank" rel="noreferrer">{l.value} ↗</a> : <b>{l.value}</b>}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <footer className={s.footer}><span>© 2026 Jwan Sidou</span><span>90&apos; · Full time</span></footer>
        </section>
      </main>

      {/* ---------- optional: the original anime opening ---------- */}
      {episode && (
        <div className={s.episode} role="dialog" aria-modal="true" aria-label="The opening episode">
          <Suspense fallback={<p className={s.episodeLoading}>Loading the episode…</p>}>
            <OpeningScene embedded onExit={() => setEpisode(false)} />
          </Suspense>
          <button className={s.episodeClose} onClick={() => setEpisode(false)} autoFocus>Close ✕</button>
        </div>
      )}
    </div>
  );
}
