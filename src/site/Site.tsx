'use client';
// Scroll portfolio: one continuous editorial page in the Blaugrana identity. Football runs through it quietly
// (No. 18, CDM, chalk pitch lines, a "match clock" for scroll progress); the original episode is optional.
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cv, Entry } from '../content/cv';
import s from './site.module.css';

const OpeningScene = lazy(() => import('../scenes/opening/OpeningScene'));
const A = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/opening/';
const NAV = [
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

function Label({ no, children, dark }: { no: string; children: React.ReactNode; dark?: boolean }) {
  return <p className={`${s.label} ${dark ? s.labelDark : ''}`} data-reveal><span>{no}</span><i aria-hidden />{children}</p>;
}

function Stripes() {
  return <div className={s.stripes} aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div>;
}

function Timeline({ items, kind }: { items: Entry[]; kind: string }) {
  return (
    <ol className={s.timeline}>
      {items.map((e) => (
        <li key={e.title + e.place + e.when} className={s.entry} data-reveal>
          <p className={s.when}>{e.when}</p>
          <div>
            <h4 className={s.role}>{e.title}</h4>
            <p className={s.place}>{e.place}{e.location ? <span> · {e.location}</span> : null}</p>
            {e.tags && <ul className={s.tags} aria-label={`${kind} details`}>{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
            {e.note && <p className={s.note}>{e.note}</p>}
            {e.points && (
              <details className={s.details}>
                <summary>What I did</summary>
                <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  const [minute, setMinute] = useState(0);
  const [section, setSection] = useState('Kick-off');
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [episode, setEpisode] = useState(false);
  const email = cv.links.find((l) => l.label === 'Email')!;

  /* match clock + nav state from scroll position */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setMinute(Math.round((max > 0 ? scrollY / max : 0) * 90));
      setSolid(scrollY > 40);
      let current = 'Kick-off';
      for (const n of NAV) { const el = document.getElementById(n.id); if (el && el.getBoundingClientRect().top < innerHeight * .4) current = n.label; }
      setSection(current);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  /* restrained motion: section reveals, gentle parallax, pitch lines drawn on scroll */
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .09, delay: .1 });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
        const sp = parseFloat(el.dataset.speed || '0');
        gsap.to(el, { yPercent: sp * -12, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.utils.toArray<SVGPathElement>('[data-draw]').forEach((p) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('section'), start: 'top 75%', end: 'center 45%', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  /* lock scroll while the episode is open; hand focus back to its button when it closes */
  const opener = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
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
  const go = (id: string) => { setMenu(false); document.getElementById(id)?.scrollIntoView(); };

  return (
    <div ref={root} className={s.root}>
      {/* ---------- nav ---------- */}
      <header className={`${s.nav} ${solid ? s.navSolid : ''}`}>
        <a href="#top" className={s.brand} aria-label="Jwan Sidou, back to top"><b>JWAN SIDOU</b><span>18</span></a>
        <nav aria-label="Sections">
          <ul className={`${s.links} ${menu ? s.linksOpen : ''}`} id="site-menu">
            {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); go(n.id); }}><span>{n.no}</span>{n.label}</a></li>)}
          </ul>
        </nav>
        <button className={s.menuBtn} aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(!menu)}>{menu ? 'Close' : 'Menu'}</button>
      </header>
      <div className={s.progress} aria-hidden><i style={{ transform: `scaleX(${minute / 90})` }} /></div>
      <p className={s.clock} aria-hidden><b>{minute}&apos;</b>{section}</p>

      <main id="top">
        {/* ---------- 01 hero ---------- */}
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroNum} aria-hidden data-speed="1.4">18</div>
          <div className={s.heroText}>
            <p className={s.kicker} data-hero>01 — Portfolio · <span lang="ja">ポートフォリオ</span></p>
            <h1 id="hero-title" className={s.heroName} data-hero><span>Jwan</span><span>Sidou</span></h1>
            <p className={s.heroLine} data-hero><em>Software engineering student</em> who plays like a midfielder: reading the game, connecting people and keeping things moving.</p>
            <ul className={s.heroMeta} data-hero>
              <li><span>Position</span>{cv.football.position} · No. {cv.number}</li>
              <li><span>Studying</span>BEng Software Technology, SDU</li>
              <li><span>Based in</span>Odense, Denmark</li>
            </ul>
            <div className={s.heroCta} data-hero>
              <a className={s.btn} href="#contact" onClick={(e) => { e.preventDefault(); go('contact'); }}>Get in touch</a>
              <button ref={opener} className={s.btnGhost} onClick={() => setEpisode(true)}>▶ Watch the opening</button>
            </div>
          </div>
          <figure className={s.heroArt} data-hero>
            <div className={s.layer} data-speed=".5"><img src={A + 'low-sky.svg'} alt="" /></div>
            <div className={s.layer} data-speed=".9"><img src={A + 'low-ground.svg'} alt="" /></div>
            <div className={`${s.layer} ${s.layerFig}`} data-speed="1.2"><img src={A + 'cel-hero-shadow.svg'} alt="" /><img src={A + 'cel-hero.svg'} alt="Jwan Sidou drawn as an anime footballer in a blaugrana number 18 kit, foot on the ball" /></div>
            <figcaption>No. 18 · {cv.football.positionLong}</figcaption>
          </figure>
          <p className={s.scrollHint} aria-hidden>Scroll ↓</p>
        </section>
        <Stripes />

        {/* ---------- 02 about ---------- */}
        <section id="about" className={`${s.section} ${s.paper}`} aria-labelledby="about-title">
          <Label no="02">About · <span lang="ja">プロフィール</span></Label>
          <div className={s.aboutGrid}>
            <div>
              <h2 id="about-title" className={s.h2} data-reveal>People <em>&amp;</em> technology.</h2>
              <blockquote className={s.quote} data-reveal>&ldquo;I thrive at the intersection of people and technology.&rdquo;</blockquote>
              {cv.about.map((p, i) => <p key={i} className={s.body} data-reveal>{p}</p>)}
            </div>
            <aside className={s.sheet} data-reveal aria-label="Profile">
              <div className={s.card}>
                <span className={s.cardNo}>18</span><span className={s.cardPos}>{cv.football.position}</span>
                <img src={A + 'face-focus.svg'} alt="Jwan Sidou, anime portrait" />
                <p className={s.cardName}>JWAN SIDOU<small>{cv.role}</small></p>
              </div>
              <dl className={s.facts}>
                {cv.stats.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
              </dl>
              <h3 className={s.small}>Languages</h3>
              <ul className={s.langs}>{cv.languages.map((l) => <li key={l.name}><b>{l.name}</b><span>{l.level}</span></li>)}</ul>
            </aside>
          </div>
        </section>

        {/* ---------- 03 skills ---------- */}
        <section id="skills" className={`${s.section} ${s.dark} ${s.board}`} aria-labelledby="skills-title">
          <svg className={s.pitch} viewBox="0 0 1200 700" aria-hidden preserveAspectRatio="none">
            <path data-draw d="M 40 40 H 1160 V 660 H 40 Z M 600 40 V 660 M 40 220 H 200 V 480 H 40 M 1160 220 H 1000 V 480 H 1160" />
            <path data-draw d="M 690 350 A 90 90 0 1 1 510 350 A 90 90 0 1 1 690 350" />
          </svg>
          <Label no="03" dark>Skills &amp; technologies · <span lang="ja">能力</span></Label>
          <h2 id="skills-title" className={s.h2} data-reveal>The squad <em>I play with.</em></h2>
          <div className={s.squads}>
            {cv.skills.map((g, gi) => (
              <div key={g.group} className={s.squad}>
                <p className={s.squadHead} data-reveal><b>{g.group}</b><span>{String(g.items.length).padStart(2, '0')} players</span></p>
                <ul className={s.tiles}>
                  {g.items.map((t, i) => (
                    <li key={t} className={`${s.tile} ${gi ? s.tileBlue : ''}`} data-reveal>
                      <span className={s.tileNo}>No.{String(i + 1).padStart(2, '0')}</span><b>{t}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- 04 projects ---------- */}
        <section id="projects" className={`${s.section} ${s.paper}`} aria-labelledby="projects-title">
          <Label no="04">Featured project · <span lang="ja">ハイライト</span></Label>
          <h2 id="projects-title" className={s.h2} data-reveal>Highlight <em>reel.</em></h2>
          {cv.projects.map((p) => (
            <article key={p.title} className={s.project} data-reveal>
              <a className={s.shot} href={p.link} target="_blank" rel="noreferrer" aria-label={`${p.title} on GitHub`}>
                <img src={A + 'mid-sky.svg'} alt="" /><img src={A + 'mid-ground.svg'} alt="" />
                <img className={s.speed} src={A + 'fx-speed.svg'} alt="" />
                <img src={A + 'cel-run.svg'} alt="" />
              </a>
              <div className={s.projectBody}>
                <p className={s.kickerDark}>Episode 01 · {p.tag}</p>
                <h3 className={s.h3}>{p.title}</h3>
                <p className={s.body}>{p.text}</p>
                <a className={s.textLink} href={p.link} target="_blank" rel="noreferrer">View the code on GitHub <span aria-hidden>→</span></a>
              </div>
            </article>
          ))}
          <p className={s.more} data-reveal>More case studies are on their way.</p>
        </section>

        {/* ---------- 05 career ---------- */}
        <section id="career" className={`${s.section} ${s.dark}`} aria-labelledby="career-title">
          <Label no="05" dark>Experience &amp; education · <span lang="ja">経歴</span></Label>
          <h2 id="career-title" className={s.h2} data-reveal>Season <em>by season.</em></h2>
          <div className={s.career}>
            <div>
              <h3 className={s.colHead} data-reveal>Work</h3>
              <Timeline items={cv.experience} kind="Work" />
              <h3 className={s.colHead} data-reveal>Volunteering</h3>
              <Timeline items={cv.volunteering} kind="Volunteering" />
            </div>
            <div>
              <h3 className={s.colHead} data-reveal>Education</h3>
              <Timeline items={cv.education} kind="Education" />
            </div>
          </div>
        </section>

        {/* ---------- 06 football ---------- */}
        <section id="football" className={`${s.section} ${s.club}`} aria-labelledby="football-title">
          <div className={s.clubBg} aria-hidden data-speed=".8"><img src={A + 'wide-stadium.svg'} alt="" /></div>
          <Label no="06" dark>Football &amp; identity · <span lang="ja">背番号18</span></Label>
          <div className={s.footGrid}>
            <div>
              <h2 id="football-title" className={s.cdm} data-reveal>{cv.football.position}<em>{cv.football.positionLong}</em></h2>
              <p className={s.bodyLight} data-reveal>{cv.football.role}</p>
              <p className={s.bodyLight} data-reveal>I have played football for many years. It taught me that being a team player goes far beyond the pitch, the classroom or the codebase.</p>
              <ol className={s.pillars}>
                {PILLARS.map((p) => <li key={p.no} data-reveal><span>{p.no}</span><b>{p.title}</b><p>{p.text}</p></li>)}
              </ol>
            </div>
            <figure className={s.move} data-reveal>
              <img src={A + 'face-shout.svg'} alt="Jwan Sidou shouting, anime close-up" />
              <figcaption><small>必殺技 · Special move</small>TIGER SHOT</figcaption>
            </figure>
          </div>
        </section>

        {/* ---------- 07 contact ---------- */}
        <section id="contact" className={`${s.section} ${s.paper} ${s.contact}`} aria-labelledby="contact-title">
          <Label no="07">Contact · <span lang="ja">契約</span></Label>
          <h2 id="contact-title" className={s.huge} data-reveal>Let&apos;s <em>talk.</em></h2>
          <p className={s.body} data-reveal>{cv.status}. The quickest way to reach me is by email.</p>
          <div className={s.mailRow} data-reveal>
            <a className={s.mail} href={email.href}>{email.value}</a>
            <button className={s.copy} onClick={copy}>{copied ? 'Copied ✓' : 'Copy email'}</button>
            <span className={s.sr} aria-live="polite">{copied ? 'Email address copied' : ''}</span>
          </div>
          <ul className={s.contactList} data-reveal>
            {cv.links.filter((l) => l.label !== 'Email').map((l) => (
              <li key={l.label}><span>{l.label}</span>{l.href ? <a href={l.href} target="_blank" rel="noreferrer">{l.value} ↗</a> : <b>{l.value}</b>}</li>
            ))}
          </ul>
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
