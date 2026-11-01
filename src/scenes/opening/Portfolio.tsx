'use client';
// The portfolio "after the goal": six broadcast-style chapters in the same anime world as the episode.
import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import gsap from 'gsap';
import { cv, Entry } from '../../content/cv';
import css from './portfolio.module.css';

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/assets/opening/';
const SECTIONS = [
  { id: 'about', no: '01', en: 'About', jp: 'プロフィール' },
  { id: 'skills', no: '02', en: 'Skills', jp: '能力' },
  { id: 'projects', no: '03', en: 'Projects', jp: 'ハイライト' },
  { id: 'experience', no: '04', en: 'Experience', jp: '経歴' },
  { id: 'education', no: '05', en: 'Education', jp: 'アカデミー' },
  { id: 'contact', no: '06', en: 'Contact', jp: '契約' },
] as const;
type Id = (typeof SECTIONS)[number]['id'];
const THUMBS = ['mid-ground', 'close-grass', 'wide-stadium'];

function Heading({ no, en, jp, title }: { no: string; en: string; jp: string; title: string }) {
  return (
    <header className={css.head} data-anim>
      <span className={css.chapter}>第{no}話 · {en}</span>
      <h2 className={css.h2} tabIndex={-1} data-focus>{title}</h2>
      <span className={css.jp} aria-hidden>{jp}</span>
    </header>
  );
}

function About() {
  return (
    <div className={css.aboutGrid}>
      <figure className={css.card} data-anim>
        <div className={css.cardNo} aria-hidden>18</div>
        <div className={css.cardPos} aria-hidden>{cv.football.position}</div>
        <img className={css.cardFace} src={BASE + 'face-focus.svg'} alt="Jwan Sidou, drawn in anime style: dark brown flow middle-part hair, moustache, Blaugrana kit" />
        <figcaption className={css.cardName}><strong>JWAN SIDOU</strong><span>{cv.football.positionLong} · {cv.role}</span></figcaption>
      </figure>
      <div className={css.aboutText}>
        {cv.about.map((p, i) => <p key={i} className={css.lead} data-anim>{p}</p>)}
        <dl className={css.stats} data-anim>
          {cv.stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
        </dl>
        <section className={css.pitch} data-anim aria-label="On the pitch">
          <h3 className={css.h3}>On the pitch · {cv.football.position}</h3>
          <p>{cv.football.role}</p>
        </section>
        <section data-anim aria-label="Languages">
          <h3 className={css.h3}>Languages</h3>
          <ul className={css.chips}>
            {cv.languages.map((l) => <li key={l.name} className={css.chip}><strong>{l.name}</strong><span>{l.level}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
function Skills() {
  return (
    <div className={css.skillGrid}>
      {cv.skills.map((g) => (
        <section key={g.group} className={css.skillCard} data-anim aria-label={g.group}>
          <h3 className={css.h3}>{g.group}</h3>
          <ul className={css.chips}>
            {g.items.map((name) => <li key={name} className={css.chip}><strong>{name}</strong></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
function Projects() {
  return (
    <ul className={css.reel}>
      {cv.projects.map((p, i) => (
        <li key={p.title} className={css.clip} data-anim>
          <div className={css.thumb} style={{ backgroundImage: `url(${BASE}${THUMBS[i % THUMBS.length]}.svg)` }} aria-hidden>
            <span className={css.ep}>EP {String(i + 1).padStart(2, '0')}</span>
          </div>
          <div className={css.clipBody}>
            <span className={css.tag}>{p.tag}</span>
            <h3 className={css.h3}>{p.title}</h3>
            <p>{p.text}</p>
            <a className={css.link} href={p.link} target="_blank" rel="noreferrer">View on GitHub <span aria-hidden>→</span></a>
          </div>
        </li>
      ))}
    </ul>
  );
}
function Timeline({ items, badge }: { items: Entry[]; badge: string }) {
  return (
    <ol className={css.fixtures}>
      {items.map((e) => (
        <li key={e.title + e.place + e.when} className={css.fixture} data-anim>
          <span className={css.when}>{e.when}</span>
          <span className={css.badge} aria-hidden>{badge}</span>
          <div>
            <h3 className={css.h3}>{e.title}</h3>
            <p className={css.place}>{e.place}{e.location ? ` · ${e.location}` : ''}</p>
            {e.tags && <ul className={css.tags}>{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
            {e.note && <p>{e.note}</p>}
            {e.points && <ul className={css.points}>{e.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>}
          </div>
        </li>
      ))}
    </ol>
  );
}
function Contact({ onReplay }: { onReplay: () => void }) {
  return (
    <div className={css.contract} data-anim>
      <p className={css.lead}>{cv.status}. The quickest way to reach me is by email.</p>
      <ul className={css.links}>
        {cv.links.map((l) => (
          <li key={l.label}>
            {l.href
              ? <a className={css.bigLink} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"><small>{l.label}</small><span>{l.value}</span></a>
              : <div className={css.bigLink}><small>{l.label}</small><span>{l.value}</span></div>}
          </li>
        ))}
      </ul>
      <button className={css.replay} onClick={onReplay}>Replay the episode</button>
    </div>
  );
}

export default function Portfolio({ onReplay, reduced }: { onReplay: () => void; reduced: boolean }) {
  const [active, setActive] = useState<Id>('about');
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef<Id | null>(null);

  // enter: the stadium wipes in behind the broadcast frame
  useEffect(() => {
    if (!root.current) return;
    if (!reduced) gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power1.out' });
    tabs.current[0]?.focus({ preventScroll: true });
  }, [reduced]);
  // chapter change: slanted slide + stagger, then move focus to the heading
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    el.scrollTop = 0;
    if (!reduced) {
      gsap.fromTo(el.querySelectorAll('[data-anim]'), { x: 60, opacity: 0, skewX: -6 }, { x: 0, opacity: 1, skewX: 0, duration: .5, ease: 'power3.out', stagger: .06 });
    }
    // move focus to the new chapter heading only when the visitor changed chapter (not on first entry)
    if (shown.current && shown.current !== active) (el.querySelector('[data-focus]') as HTMLElement | null)?.focus({ preventScroll: true });
    shown.current = active;
  }, [active, reduced]);

  const idx = SECTIONS.findIndex((s) => s.id === active);
  const go = (i: number) => { const n = (i + SECTIONS.length) % SECTIONS.length; shown.current = SECTIONS[n].id; setActive(SECTIONS[n].id); tabs.current[n]?.focus(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(SECTIONS.length - 1); }
  };
  const S = SECTIONS[idx];
  const titles: Record<Id, string> = { about: 'Player profile', skills: 'Attributes', projects: 'Highlight reel', experience: 'Career', education: 'Academy', contact: 'Sign Jwan Sidou' };

  return (
    <div ref={root} className={css.root}>
      <div className={css.backdrop} aria-hidden>
        <img src={BASE + 'low-sky.svg'} alt="" /><img src={BASE + 'low-ground.svg'} alt="" />
      </div>
      <div className={css.frame}>
        <h1 className={css.srOnly}>Jwan Sidou #18, software engineering student: portfolio</h1>
        <header className={css.top}>
          <div className={css.brand}><strong>JWAN SIDOU</strong><b>#18</b><span>{cv.football.position} · {cv.tagline}</span></div>
          <div className={css.score} aria-label="Score: Jwan Sidou 1, opposition 0, 90th minute">
            <span>JWA</span><b>1 – 0</b><span>OPP</span><i>90&apos;</i>
          </div>
        </header>
        <nav className={css.nav} aria-label="Portfolio sections">
          <div role="tablist" aria-label="Portfolio sections" className={css.tabs} onKeyDown={onKey}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} ref={(b) => { tabs.current[i] = b; }} role="tab" id={`tab-${s.id}`} aria-selected={active === s.id} aria-controls={`panel-${s.id}`}
                tabIndex={active === s.id ? 0 : -1} className={css.tab} onClick={() => setActive(s.id)}>
                <span className={css.tabNo}>{s.no}</span>{s.en}
              </button>
            ))}
          </div>
        </nav>
        <div ref={panel} className={css.panel} role="tabpanel" id={`panel-${S.id}`} aria-labelledby={`tab-${S.id}`}>
          <Heading no={S.no} en={S.en} jp={S.jp} title={titles[S.id]} />
          {S.id === 'about' && <About />}
          {S.id === 'skills' && <Skills />}
          {S.id === 'projects' && <Projects />}
          {S.id === 'experience' && <><h3 className={css.group}>Work</h3><Timeline items={cv.experience} badge="FT" /><h3 className={css.group}>Volunteering</h3><Timeline items={cv.volunteering} badge="VOL" /></>}
          {S.id === 'education' && <Timeline items={cv.education} badge="AC" />}
          {S.id === 'contact' && <Contact onReplay={onReplay} />}
        </div>
        <footer className={css.foot}>
          <button className={css.arrow} onClick={() => go(idx - 1)} aria-label="Previous section">←</button>
          <span className={css.progress} aria-hidden>{S.no} / 0{SECTIONS.length}</span>
          <button className={css.arrow} onClick={() => go(idx + 1)} aria-label="Next section">→</button>
          <button className={css.replaySmall} onClick={onReplay}>Replay episode</button>
        </footer>
      </div>
    </div>
  );
}
