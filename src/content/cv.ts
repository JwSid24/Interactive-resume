// Portfolio content. Bracketed values are placeholders to replace with the real details.
export const cv = {
  name: 'Jwandini',
  number: 18,
  role: 'Software engineering student',
  tagline: 'Building software for the beautiful game',
  about: [
    'I am a software engineering student who wants to build the tools football clubs run on: match analysis, scouting, training load and fan experiences.',
    'I like turning messy match data and everyday club problems into software that coaches, analysts and supporters actually use.',
  ],
  stats: [
    { label: 'Position', value: 'Full-stack forward' },
    { label: 'Base', value: '[City, Country]' },
    { label: 'Languages', value: '[Danish, English]' },
    { label: 'Looking for', value: 'Internship or first role at a club' },
  ],
  skills: [
    { group: 'Languages', items: [['TypeScript', 85], ['Python', 80], ['SQL', 75], ['C#', 65]] },
    { group: 'Frontend', items: [['React', 85], ['Next.js', 75], ['CSS / animation', 80]] },
    { group: 'Backend & data', items: [['Node.js', 75], ['PostgreSQL', 70], ['Docker', 60], ['pandas', 75]] },
    { group: 'Football data', items: [['Event data', 70], ['Tracking data', 55], ['Dashboards', 75]] },
  ] as { group: string; items: [string, number][] }[],
  projects: [
    { title: '[Match analysis dashboard]', tag: 'Data · React', text: '[What it does, the data behind it and what you learned. One or two sentences.]', link: '#' },
    { title: '[Scouting shortlist tool]', tag: 'Python · SQL', text: '[What it does, the data behind it and what you learned.]', link: '#' },
    { title: 'This portfolio', tag: 'Next.js · GSAP · SVG', text: 'An interactive football-anime episode with a hand-designed character, layered environments and a GSAP-driven timeline.', link: '#' },
  ],
  experience: [
    { when: '[2025 – now]', title: '[Role]', place: '[Company or club]', text: '[One line about what you did and the result.]' },
    { when: '[2024]', title: '[Role]', place: '[Company or project]', text: '[One line about what you did and the result.]' },
  ],
  education: [
    { when: '[Years]', title: 'B.Sc. Software Engineering', place: '[University]', text: '[Focus areas, key courses or thesis topic.]' },
    { when: '[Year]', title: '[Course or certificate]', place: '[Provider]', text: '[What it covered.]' },
  ],
  links: [
    { label: 'Email', value: 'your@email.com', href: 'mailto:your@email.com' },
    { label: 'LinkedIn', value: 'linkedin.com/in/you', href: 'https://linkedin.com/in/you' },
    { label: 'GitHub', value: 'github.com/you', href: 'https://github.com/you' },
  ],
};
