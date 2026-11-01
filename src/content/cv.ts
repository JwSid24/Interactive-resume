// Portfolio content. Facts come from Jwan Sidou's resume; the CDM role description and the GitHub link come from Jwan.
export type Entry = { when: string; title: string; place: string; location?: string; tags?: string[]; points?: string[]; note?: string };

export const cv = {
  name: 'Jwan Sidou',
  number: 18,
  role: 'Software engineering student',
  tagline: 'Passion · Software · Communication',
  status: 'Open to new opportunities',
  about: [
    'Software engineering student at the University of Southern Denmark, currently in my 5th semester. I thrive at the intersection of people and technology, and I want to get better at translating a client\'s vision into precise, actionable requirements for a development team.',
    'I am naturally drawn to working in teams, something I have done throughout my entire time studying. Beyond software, I have played football for many years, which has taught me that being a team player goes far beyond the classroom or the codebase. I am passionate about collaboration, agile ways of working, and creating software that solves real problems.',
  ],
  football: {
    position: 'CDM',
    positionLong: 'Central Defensive Midfielder',
    role: 'Controls the game, provides defensive stability, wins possession and dictates the tempo from midfield.',
  },
  stats: [
    { label: 'Position', value: 'CDM · Central Defensive Midfielder' },
    { label: 'Studying', value: 'BEng Software Technology, SDU · 5th semester' },
    { label: 'Based in', value: 'Odense, Denmark' },
    { label: 'Status', value: 'Open to new opportunities' },
  ],
  languages: [
    { name: 'Kurdish (Kurmanji)', level: 'Native language' },
    { name: 'Danish', level: 'Fluent' },
    { name: 'English', level: 'Fluent' },
    { name: 'Arabic', level: 'Fluent' },
  ],
  skills: [
    { group: 'Development', items: ['C#', 'Java', 'PHP', 'Laravel', 'HTML5', 'CSS3'] },
    { group: 'Infrastructure & tools', items: ['PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'Google Cloud', 'Jira', 'Scrum'] },
  ],
  projects: [
    {
      title: 'This portfolio',
      tag: 'Next.js · GSAP · SVG',
      text: 'An interactive football-anime episode with an original character, layered stadium environments and a GSAP-driven timeline that leads into this portfolio.',
      link: 'https://github.com/JwSid24/Interactive-resume',
    },
  ],
  experience: [
    { when: 'Jul 2025 – Present', title: 'Receptionist', place: 'Comwell Hotels', location: 'Odense, Southern Denmark', tags: ['Part-time', 'On-site'],
      points: ['Handling guest check-in and check-out as well as reservations, using a hotel booking system', 'Providing professional customer service in person and over the phone in Danish and English', 'Working with other departments to ensure a smooth guest experience', 'Handling payments, invoicing and administrative tasks at the front desk'] },
    { when: 'May 2024 – Aug 2024', title: 'Waiter', place: 'Bogense Hotel', location: 'Bogense, Southern Denmark', tags: ['Seasonal', 'On-site'],
      points: ['Served guests in the restaurant with a focus on quality and good service', 'Handled orders, serving and billing in a fast-paced seasonal environment', 'Worked closely with the kitchen and other staff to deliver a smooth guest experience'] },
    { when: 'Jan 2022 – Jul 2024', title: 'Sales Assistant', place: 'Circle K – Bogense', location: 'Bogense, Southern Denmark', tags: ['Part-time', 'On-site'],
      points: ['Served customers at the till and was responsible for the daily running of the shop', 'Handled stock, restocking and tidying in the shop and stockroom', 'Opened and closed the station independently, including cash counts and reporting', 'Built strong routines for customer service and teamwork with colleagues'] },
    { when: 'Aug 2023 – Jan 2024', title: 'Delivery Driver', place: 'nemlig', location: 'Funen', tags: ['Part-time', 'On-site'],
      points: ['Delivered groceries to private customers\' doorsteps across Funen', 'Consistently met the delivery time windows', 'Handled customer contact on delivery with a focus on courtesy and accuracy'] },
    { when: 'Feb 2019 – Dec 2021', title: 'Youth Store Assistant', place: 'Meny Bogense', location: 'Bogense, Southern Denmark', tags: ['Part-time', 'On-site'],
      points: ['Restocked shelves and kept the shop tidy and orderly', 'Served customers and helped them find products in a busy supermarket', 'First work experience — learned responsibility, reliability and teamwork from an early age'] },
  ] as Entry[],
  volunteering: [
    { when: 'Apr 2026 – Oct 2026', title: 'Event Committee Member', place: 'Kurdish Students\' Association – SDU', location: 'Odense, Southern Denmark', tags: ['Volunteer', 'On-site'],
      points: ['Planning, organising and coordinating social and cultural events for Kurdish students at SDU, and potentially collaborating with other associations', 'Working with the association\'s board, and with people from different fields of study, to strengthen the community across year groups', 'Handling practical event logistics such as booking, communication and promotion'] },
    { when: 'Oct 2024 – Aug 2025', title: 'Event Committee Member', place: 'University of Southern Denmark (SDU)', location: 'Odense, Southern Denmark', tags: ['Volunteer', 'On-site'] },
  ] as Entry[],
  education: [
    { when: 'Aug 2024 – Present', title: 'BEng in Software Technology', place: 'University of Southern Denmark (SDU)', tags: ['In progress'], note: 'Computer Software Technology/Technician' },
    { when: 'Feb 2024 – Jun 2024', title: 'Supplementary Courses (GSK) – Mathematics A & Physics B', place: 'HF & VUC FYN', tags: ['Admission course'],
      note: 'Took Mathematics A and Physics B to qualify for admission to the University of Southern Denmark.' },
    { when: 'Aug 2020 – Jun 2023', title: 'Upper Secondary School Leaving Examination (STX)', place: 'Nordfyns Gymnasium', tags: ['STX'], note: 'Social Studies & English' },
  ] as Entry[],
  links: [
    { label: 'Email', value: 'jwsid24@student.sdu.dk', href: 'mailto:jwsid24@student.sdu.dk' },
    { label: 'GitHub', value: 'github.com/JwSid24', href: 'https://github.com/JwSid24' },
    { label: 'Location', value: 'Odense, Denmark' },
  ] as { label: string; value: string; href?: string }[],
};
