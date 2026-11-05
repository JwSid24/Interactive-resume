'use client';
// Motion-led portfolio: one continuous camera move through six pinned scenes. Every scene ends in the colour and
// framing the next one starts with, so the page reads as a single shot. The DOM below is the readable, static
// layout (used for reduced motion); motion.ts layers the scroll choreography on top when motion is allowed.
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cv, Entry, StudyProject } from '../content/cv';
import manifest from '../../public/assets/opening/manifest.json';
import { SQUAD_LINKS } from './squad';
import s from './site.module.css';

const A = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/opening/';
// The detailed plates (crowds, clouds, pitch) ship as WebP renders of the SVG art: the camera moves scale them
// every frame, and a bitmap scales on the GPU where a complex SVG would be re-drawn from scratch each time.
const RASTER = new Set(['low-sky', 'low-ground', 'wide-sky', 'wide-clouds', 'wide-stadium', 'wide-pitch']);
const img = (n: string) => A + n + (RASTER.has(n) ? '.webp' : '.svg');

export const NAV = [
  { id: 'about', no: '02', label: 'About' },
  { id: 'skills', no: '03', label: 'Skills' },
  { id: 'career', no: '04', label: 'Career' },
  { id: 'why', no: '05', label: 'Why Jwan' },
  { id: 'contact', no: '06', label: 'Contact' },
];
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
// where the ball comes to rest in the opening: on the pitch, in front of the goal (1920x1080 plate coordinates).
// It is also the camera's focal point (FOCUS in motion.ts).
const BALL = { x: 960, y: 935, r: manifest.shots.hero.ball.r };
const ongoing = (e: Entry) => /present/i.test(e.when);
/* career entries newest first: the timeline travels back through the seasons */
const MONTH: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const startOf = (when: string) => { const [m, y] = when.split('–')[0].trim().split(' '); return +y * 12 + (MONTH[m] ?? 0); };
type Season = Entry & { kind: string };
const SEASONS: Season[] = [
  ...cv.experience.map((e) => ({ ...e, kind: 'Work' })),
  ...cv.volunteering.map((e) => ({ ...e, kind: 'Volunteering' })),
  ...cv.education.map((e) => ({ ...e, kind: 'Education' })),
].sort((a, b) => startOf(b.when) - startOf(a.when));

/* a 16:9 plate that covers its box like object-fit: cover, so layers can be placed in 1920x1080 coordinates */
function Cover({ children, k, className = '' }: { children: ReactNode; k?: string; className?: string }) {
  return <div className={`${s.cover} ${className}`} data-k={k} aria-hidden><div className={s.plate}>{children}</div></div>;
}
function Lay({ k, depth = 0, children, className = '' }: { k?: string; depth?: number; children: ReactNode; className?: string }) {
  return <div className={`${s.lay} ${className}`} data-k={k}><div className={s.par} data-depth={depth}>{children}</div></div>;
}
function Img({ n, eager, className }: { n: string; eager?: boolean; className?: string }) {
  // eager images are the opening viewport: fetched first, everything else waits until it is near the screen
  return <img className={className} src={img(n)} alt="" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" draggable={false} />;
}
function Ball({ x, y, r, light = 'tr', k, spin }: { x: number; y: number; r: number; light?: 'tr' | 'tl'; k?: string; spin?: string }) {
  const size = (manifest.ball.box * r) / manifest.ball.r;
  return (
    <div className={s.ball} data-k={k} style={{ left: `${(x / 1920) * 100}%`, top: `${(y / 1080) * 100}%`, width: `${(size / 1920) * 100}%` }}>
      <img src={img('ball-pattern')} alt="" draggable={false} data-k={spin} /><Img n={light === 'tl' ? 'ball-shade-tl' : 'ball-shade'} eager />
    </div>
  );
}
function Label({ no, children }: { no: string; children: ReactNode }) {
  return <p className={s.label} data-fade><span>{no}</span><i aria-hidden />{children}</p>;
}
/* a schematic of a project's setup: our system on the left, each confirmed part on the right with its protocol.
   Lines and labels only, so it can never be mistaken for a screenshot; real project images replace it later. */
function System({ hub, parts }: NonNullable<StudyProject['system']>) {
  const row = 46, h = Math.max(parts.length * row, 70), hubY = h / 2;
  return (
    <svg viewBox={`0 0 360 ${h}`} aria-hidden>
      {parts.map((p, i) => {
        const y = row / 2 + i * row + (h - parts.length * row) / 2;
        return (
          <g key={p.name}>
            <path d={`M118 ${hubY} C170 ${hubY} 178 ${y} 226 ${y}`} />
            <text x="218" y={y - 8} textAnchor="end" data-via>{p.via}</text>
            <rect x="226" y={y - 14} width="134" height="28" rx="14" /><text x="293" y={y + 4} textAnchor="middle">{p.name}</text>
          </g>
        );
      })}
      <rect x="0" y={hubY - 18} width="118" height="36" rx="10" data-hub /><text x="59" y={hubY + 4} textAnchor="middle" data-hub>{hub}</text>
    </svg>
  );
}
const TONE = { garnet: s.toneGarnet, blue: s.toneBlue, gold: s.toneGold, green: s.toneGreen };
/* One project chapter. Layers, each animated by one part of the Why scene only: the article leaves, [data-proj-in]
   comes in, [data-proj-move] moves a tall panel with the scroll, and the card itself rises in (the first project). */
function Project({ p, i, n }: { p: StudyProject; i: number; n: number }) {
  const solo = p.kind === 'solo';
  const result = (
    <div className={s.grade} data-word={p.result.of ? undefined : ''}>
      <span>{p.result.label}</span>
      <b aria-hidden={p.result.sr ? true : undefined}>{p.result.value}{p.result.of && <small> / {p.result.of}</small>}</b>
      {p.result.sr && <span className={s.sr}>{p.result.sr}</span>}
      <small>{p.result.text}</small>
    </div>
  );
  const items = p.list.items.map((c, k) => (
    <li key={c.title} data-contrib><span>0{k + 1}</span><div><b>{c.title}</b><p>{c.text}</p>{c.detail && <p className={s.stepDetail}>{c.detail}</p>}</div></li>
  ));
  return (
    <article className={s.proj} data-proj={i} aria-labelledby={`proj-${p.no}`}>
      <div data-proj-in>
        <div className={s.projMove} data-proj-move>
          <div className={`${s.projCard} ${TONE[p.tone]} ${solo ? s.projSolo : ''}`} data-proj-card>
            <header className={s.projHead}>
              <p className={s.projKicker}><span>Project {p.no}</span>{p.label}</p>
              <p className={s.projPath} aria-hidden>
                {Array.from({ length: n }, (_, k) => (
                  <Fragment key={k}>
                    {k > 0 && <i data-done={k <= i ? '' : undefined}><b data-proj-fill={k === i ? '' : undefined} /></i>}
                    <span data-on={k <= i ? '' : undefined}>{String(k + 1).padStart(2, '0')}</span>
                  </Fragment>
                ))}
              </p>
            </header>
            {solo ? (
              <>
                <div className={s.projGrid}>
                  <div><h3 id={`proj-${p.no}`}>{p.title}</h3><p className={s.projOverview}>{p.overview}</p></div>
                  <div><ul className={s.tags} aria-label="Technologies">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>{result}</div>
                </div>
                <h4 className={`${s.projH} ${s.stepsH}`}>{p.list.heading}</h4>
                <ol className={s.steps}>{items}</ol>
                {p.doc && (
                  <figure className={s.projDoc} data-contrib style={{ '--ar': p.doc.width / p.doc.height } as CSSProperties}>
                    <figcaption><span>{p.doc.caption}</span><a href={`${BASE}/${p.doc.src}`} target="_blank" rel="noopener noreferrer">Open full size ↗</a></figcaption>
                    <img src={`${BASE}/${p.doc.src}`} alt={p.doc.alt} width={p.doc.width} height={p.doc.height} loading="lazy" decoding="async" />
                  </figure>
                )}
              </>
            ) : (
              <div className={s.projGrid}>
                <div>
                  <h3 id={`proj-${p.no}`}>{p.title}</h3>
                  <p className={s.projOverview}>{p.overview}</p>
                  <ul className={s.tags} aria-label="Technologies">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
                  <div className={s.projFacts}>
                    {p.system && (
                      <figure className={s.projSystem}>
                        <System {...p.system} />
                        <figcaption>Schematic of the setup · not a screenshot</figcaption>
                      </figure>
                    )}
                    {result}
                  </div>
                </div>
                <div>
                  <h4 className={s.projH}>{p.list.heading}</h4>
                  <ol className={s.contrib}>{items}</ol>
                  {p.note && (
                    <div className={s.team} data-contrib>
                      <h4 className={s.projH}>{p.note.heading}</h4>
                      <b>{p.note.title}</b><p>{p.note.text}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
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

const EMAIL = cv.links.find((l) => l.label === 'Email')!;

/* The page itself: every scene's markup. Memoised, so switching the motion layout on or opening the menu re-renders
   only the root and the nav, not the whole page. */
const Pitch = memo(function Pitch({ go, copy, copied }: { go: (id: string) => void; copy: () => void; copied: boolean }) {
  const email = EMAIL;
  return (
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
              {/* the football and its shadow on the empty pitch: the ball drops in and stays where it lands */}
              <Lay k="focus" depth={1}>
                <i className={s.ballShadow} data-k="bshadow" style={{ left: `${(BALL.x / 1920) * 100}%`, top: `${((BALL.y + BALL.r * .9) / 1080) * 100}%` }} />
                <div className={s.drop} data-k="drop"><Ball x={BALL.x} y={BALL.y} r={BALL.r} light="tl" spin="spin" /></div>
              </Lay>
              <Lay k="flare" depth={1.4}><Img n="low-flare" eager className={s.flare} /></Lay>
            </Cover>
            <div className={s.kShade} data-k="shade" aria-hidden />
            {/* the profile card's photo: set cv.photo to show your picture; until then a clean empty slot */}
            <div className={s.kPhoto} data-k="photo">
              <div className={s.kPhotoIn} data-k="photoin">
                {cv.photo ? <img src={`${BASE}/${cv.photo}`} alt="Jwan Sidou" style={{ objectPosition: cv.photoPosition }} /> : null}
              </div>
            </div>
          </div>
        </div>

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
            </div>
          </div>
          <p className={s.kCue} data-intro aria-hidden><i />Scroll to kick off</p>
        </div>
        <div className={s.kCardUi} data-k="cardui" aria-hidden>
          <b>18</b>
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
          <ul className={s.langs} data-stagger>{cv.languages.map((l) => <li key={l.name} data-native={l.level === 'Native language' || undefined}><b>{l.name}</b><span>{l.level}</span></li>)}</ul>
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
        <p className={s.skMarquee} data-k="marquee" aria-hidden>Tech-stack · 4-2-3-1 · Tech-stack · 4-2-3-1 ·</p>
        <header className={s.skHead}>
          <Label no="03">Skills &amp; technologies · <span lang="ja">能力</span></Label>
          <h2 id="skills-title" className={s.h2} data-split>The squad <em>I play with.</em></h2>
        </header>
        <div className={s.skField} data-k="field">
          <svg className={s.skNet} data-k="net" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
            {SQUAD_LINKS.map(([a, b], i) => <line key={i} data-link={`${a}-${b}`} />)}
          </svg>
          <div className={s.skGroup}>
            <h3 className={s.skCap} data-k="cap0"><b>{cv.squad.name}</b><span>{cv.squad.formation} · {cv.squad.players.length} players</span></h3>
            <ul className={s.skList} aria-label={`${cv.squad.name}, ${cv.squad.formation} formation`}>
              {cv.squad.players.map((p, i) => (
                <li key={p.name} className={s.tok} data-tok={i} data-line={i === 0 ? 0 : i < 5 ? 1 : i < 7 ? 2 : 3}>
                  <span className={s.tokIn} data-tok-in><b>{p.pos}</b><span>{p.name}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className={s.skGroup}>
            <h3 className={s.skStaffCap} data-k="cap1"><b>Coaching staff</b><span>{cv.squad.staffNote}</span></h3>
            <ul className={s.skList} aria-label="Coaching staff">
              {cv.squad.staff.map((c, i) => (
                <li key={c.name} className={`${s.tok} ${s.tokCoach}`} data-staff={i}>
                  <span className={s.tokIn} data-tok-in><b>{c.role}</b><span>{c.name}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={s.skWipe} data-k="skwipe" aria-hidden />
      </div>
    </section>

    {/* ============ 04 career: season by season, travelling back from today ============ */}
    <section className={s.ca} id="career" data-scene="Career" aria-labelledby="career-title">
      <div className={s.caStage} data-k="castage">
        <header className={s.caHead}>
          <Label no="04">Experience &amp; education · <span lang="ja">経歴</span></Label>
          <h2 id="career-title" className={s.h2} data-split>Season <em>by season.</em></h2>
        </header>
        <p className={s.caYear} data-k="year" aria-hidden>{SEASONS[0].when.split('–')[0].trim().split(' ')[1]}</p>
        <div className={s.caLine} aria-hidden><i data-k="caball"><Img n="ball-pattern" /></i></div>
        <ol className={s.caTrack} data-k="track">
          {SEASONS.map((e) => (
            <li key={e.title + e.place + e.when} className={s.caItem} data-season data-year={e.when.split('–')[0].trim().split(' ')[1]} data-active={ongoing(e) || undefined} data-minor={e.minor || undefined}>
              <div className={s.caCard} data-season-in>
                <p className={s.caMeta}><span data-kind={e.kind}>{e.kind}</span>{e.when}{ongoing(e) && <b className={s.caNow}><i aria-hidden />Ongoing</b>}</p>
                <h3 className={s.caRole}>{e.title}</h3>
                <p className={s.caPlace}>{e.place}{e.location ? <span> · {e.location}</span> : null}</p>
                {e.tags && <ul className={s.tags} aria-label={`${e.kind} details`}>{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                {e.note && <p className={s.note}>{e.note}</p>}
                <Details e={e} />
              </div>
            </li>
          ))}
          <li className={s.caEnd} data-k="caend" aria-hidden><span>Next</span>05 · Why Jwan Sidou?</li>
        </ol>
      </div>
    </section>

    {/* ============ 05 why Jwan Sidou: zoom through the letters into the stadium ============ */}
    <section className={s.fo} id="why" data-scene="Why Jwan" aria-labelledby="why-title">
      <div className={s.foStage} data-k="fostage">
        <Cover k="fobg" className={s.foBg}>
          <Lay><Img n="wide-sky" /></Lay><Lay><Img n="wide-clouds" /></Lay>
          <Lay><Img n="wide-stadium" /></Lay><Lay><Img n="wide-pitch" /></Lay>
        </Cover>
        <div className={s.foScrim} data-k="foscrim" aria-hidden />
        {(['land', 'port'] as const).map((o) => (
          <svg key={o} className={`${s.foMask} ${o === 'port' ? s.foMaskPort : s.foMaskLand}`} data-mask={o} aria-hidden
            viewBox={o === 'land' ? '0 0 1600 900' : '0 0 900 1600'} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={`fo-g-${o}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={o === 'land' ? 1600 : 900} y2={o === 'land' ? 900 : 1600}><stop offset="0" stopColor="#5C0A2A" /><stop offset=".55" stopColor="#2A1240" /><stop offset="1" stopColor="#0A2E6E" /></linearGradient>
              <mask id={`fo-m-${o}`} maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="10000" height="10000">
                <rect x="-4000" y="-4000" width="10000" height="10000" fill="#fff" />
                {/* sized and placed for the screen by motion.ts; these values are the fallback */}
                {(o === 'land' ? ['WHY JWAN', 'SIDOU?'] : ['WHY', 'JWAN', 'SIDOU?']).map((line, i, all) => (
                  <text key={line} data-line={i} data-letters={i === all.length - 1 ? '' : undefined} x={o === 'land' ? 800 : 450}
                    y={(o === 'land' ? 380 : 560) + i * (o === 'land' ? 300 : 330)} textAnchor="middle" fontSize={300} fontWeight={900} fill="#000"
                    style={{ fontFamily: 'var(--f-display), Impact, sans-serif' }}>{line}</text>
                ))}
              </mask>
            </defs>
            <rect x="-4000" y="-4000" width="10000" height="10000" fill={`url(#fo-g-${o})`} mask={`url(#fo-m-${o})`} />
          </svg>
        ))}
        <div className={s.foIntro} data-k="fointro">
          <Label no="05">Why Jwan Sidou · <span lang="ja">背番号18</span></Label>
          <h2 id="why-title" className={s.foTitle}><span className={s.foCdm}>Why Jwan Sidou?</span><em>He plays CDM and this means …</em></h2>
        </div>
        <div className={s.foBody} data-k="fobody" data-at=".5">
          <p className={s.bodyLight} data-k="forole">{cv.football.role}</p>
          <p className={s.bodyLight} data-k="foplay">I have played football for many years. It taught me that being a team player goes far beyond the pitch, the classroom or the codebase.</p>
          <ol className={s.pillars}>
            {cv.qualities.map((q, i) => <li key={q.title} data-pillar><span>0{i + 1}</span><b>{q.title}</b><p>{q.text}</p></li>)}
          </ol>
        </div>
        {/* the four projects: one chapter each, after the qualities and before the ball leads on into Contact */}
        <div className={s.foProj} data-k="foproj">
          <div className={s.projNum} aria-hidden>
            <div data-k="projnum">{cv.studyProjects.map((p, k) => <span key={p.no} data-num-out={k}><span data-num-in={k}>{p.no}</span></span>)}</div>
          </div>
          {cv.studyProjects.map((p, i) => <Project key={p.no} p={p} i={i} n={cv.studyProjects.length} />)}
        </div>
        <div className={s.foNight} data-k="fonight" aria-hidden />
      </div>
      {/* the ball rolls across as night falls, through the dark between the scenes, and leaves on the right just as
          Contact's own ball comes in from the left. Outside the pinned stage, held to the screen. */}
      <div className={s.foBall} data-k="foball" aria-hidden><Img n="ball-pattern" /><Img n="ball-shade" /></div>
    </section>

    {/* ============ 06 contact: full time, the ball opens the last page ============ */}
    <section className={s.co} id="contact" data-scene="Contact" aria-labelledby="contact-title">
      <div className={s.coStage} data-k="costage">
        <div className={s.coBall} data-k="coball" aria-hidden><Img n="ball-pattern" /><Img n="ball-shade" /></div>
        <div className={s.coPaper} data-k="copaper" data-at="1">
          <div className={s.coIn}>
            <Label no="06">Contact · <span lang="ja">契約</span></Label>
            <h2 id="contact-title" className={s.huge} data-k="cotitle">Let&apos;s <em>talk.</em></h2>
            <p className={s.body} data-co>{cv.status}. The quickest way to reach me is by email.</p>
            <div className={s.mailRow} data-co>
              <a className={s.mail} href={email.href} aria-label={`Send an email to ${email.value}`} data-magnetic>{email.value}</a>
              <button className={s.copy} onClick={copy}>{copied ? 'Copied ✓' : 'Copy email'}</button>
              <span className={s.sr} aria-live="polite">{copied ? 'Email address copied' : ''}</span>
            </div>
            <ul className={s.contactList} data-co>
              {cv.links.filter((l) => l.label !== 'Email').map((l) => (
                <li key={l.label}><span>{l.label}</span>{l.href
                  ? <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`${l.label}: ${l.value} (opens in a new tab)`}>{l.value} ↗</a>
                  : <b>{l.value}</b>}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <footer className={s.footer}><span>© 2026 Jwan Sidou</span><span>90&apos; · Full time</span></footer>
    </section>
  </main>
  );
});

type MotionModule = typeof import('./motion');
const wantsMotion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && new URLSearchParams(location.search).get('motion') !== 'reduce';
// The scroll choreography (GSAP and its plugins) is its own script, so it does not lengthen the page's first start-up
// task. Its download starts as soon as this file runs in the browser, alongside hydration; reduced-motion visitors never load it.
let motionLoad: Promise<MotionModule> | null = typeof window !== 'undefined' && wantsMotion() ? import('./motion') : null;
const loadMotion = () => (motionLoad ??= import('./motion'));

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  const mod = useRef<MotionModule | null>(null);
  const [motion, setMotion] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  /* motion is opt-out: reduced-motion users (or ?motion=reduce) get the static layout. The motion layout is switched
     on once its script and the fonts have arrived, so the scenes are switched on and built in one go. */
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    let dead = false;
    const update = () => {
      if (!wantsMotion()) return setMotion(false);
      // the scenes are built once the fonts are in (their sizes depend on them), so the layout waits for both
      Promise.all([loadMotion(), document.fonts?.ready]).then(([m]) => { mod.current = m; if (!dead && wantsMotion()) setMotion(true); });
    };
    update();
    mq.addEventListener('change', update);
    return () => { dead = true; mq.removeEventListener('change', update); };
  }, []);

  /* the match clock and progress bar follow the scroll in every mode. Scene positions are measured once per
     layout (load, resize, and each time the scroll animations re-measure), so a scroll frame reads no layout. */
  useEffect(() => {
    const clock = root.current?.querySelector<HTMLElement>('[data-clock]');
    const label = root.current?.querySelector<HTMLElement>('[data-clock-label]');
    const bar = root.current?.querySelector<HTMLElement>('[data-progress]');
    const scenes = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-scene]') ?? []);
    let raf = 0, max = 1, marks: [number, string][] = [];
    let lastMinute = -1;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      // a pinned stage is measured by its spacer, which keeps its place in the page while the stage is fixed
      marks = scenes.map((el) => [(el.closest('.pin-spacer') ?? el).getBoundingClientRect().top + scrollY - innerHeight * .45, el.dataset.scene!]);
      tick();
    };
    const tick = () => {
      raf = 0;
      const p = Math.min(1, scrollY / max), minute = Math.round(p * 90);
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (clock && minute !== lastMinute) { lastMinute = minute; clock.textContent = `${minute}'`; }
      let current = 'Kick-off';
      for (const [top, name] of marks) if (scrollY >= top) current = name;
      if (label && label.textContent !== current) label.textContent = current;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    measure();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', measure);
    addEventListener('load', measure);
    addEventListener('motion:refresh', measure);
    return () => {
      removeEventListener('scroll', onScroll); removeEventListener('resize', measure); removeEventListener('load', measure);
      removeEventListener('motion:refresh', measure); cancelAnimationFrame(raf);
    };
  }, [motion]);

  // A layout effect, so the scenes are built before the browser paints the motion layout: no frame shows it unanimated.
  useLayoutEffect(() => {
    if (!motion || !root.current || !mod.current) return;
    return mod.current.setupMotion(root.current);
  }, [motion]);

  // Stable callbacks, so the page body below does not re-render when the menu opens or the motion layout switches on.
  const motionOn = useRef(motion);
  motionOn.current = motion;
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(EMAIL.value); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { /* clipboard blocked: the mailto link still works */ }
  }, []);
  const go = useCallback((id: string) => {
    setMenu(false);
    if (motionOn.current && mod.current) return mod.current.scrollToScene(id, true);
    if (id === 'top') scrollTo({ top: 0, behavior: 'auto' });
    else document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, []);

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

      <Pitch go={go} copy={copy} copied={copied} />

    </div>
  );
}
