// Portfolio content. Facts come from Jwan Sidou's resume; the CDM role description and the GitHub link come from Jwan.
// `minor`: a short student role, shown as a smaller card on the timeline
export type Entry = { when: string; title: string; place: string; location?: string; tags?: string[]; points?: string[]; note?: string; minor?: boolean };
// One project chapter in the Why section. `kind` sets its context (label, colour, layout): university group work with
// a group grade, an individual project done end to end, or a personal project.
export type StudyProject = {
  no: string; kind: 'group' | 'solo' | 'personal'; label: string; tone: 'garnet' | 'blue' | 'gold' | 'green';
  title: string; overview: string; tech: string[];
  system?: { hub: string; parts: { name: string; via: string }[] };                        // schematic, never a screenshot
  doc?: { src: string; caption: string; alt: string; width: number; height: number };      // real project documentation
  list: { heading: string; items: { title: string; text: string; detail?: string }[] };
  note?: { heading: string; title: string; text: string };
  result: { label: string; value: string; of?: string; text: string; sr?: string };
};

export const cv = {
  name: 'Jwan Sidou',
  number: 18,
  role: 'Software engineering student',
  tagline: 'Passion · Software · Communication',
  // Your photo for the profile card. Put the file in /public (e.g. public/photo.jpg) and set photo: 'photo.jpg'.
  // While it is empty, the card shows a clean placeholder.
  photo: 'photo.webp',
  // which part of the photo stays in view when the card crops it (CSS object-position): Jwan, slightly right of centre
  photoPosition: '53% 30%',
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
  // The skills as one squad in a 4-2-3-1, line by line from goal to attack. Every name comes from `skills` above;
  // Jira and Scrum sit on the touchline as coaching staff: they are how the work is organised, not who plays.
  squad: {
    name: 'Tech-stack',
    formation: '4-2-3-1',
    players: [
      { pos: 'GK', name: 'PostgreSQL' },
      { pos: 'LB', name: 'MongoDB' }, { pos: 'CB', name: 'Docker' }, { pos: 'CB', name: 'Kubernetes' }, { pos: 'RB', name: 'Google Cloud' },
      { pos: 'CDM', name: 'C#' }, { pos: 'CDM', name: 'Java' },
      { pos: 'LAM', name: 'HTML5' }, { pos: 'CAM', name: 'Laravel' }, { pos: 'RAM', name: 'CSS3' },
      { pos: 'ST', name: 'PHP' },
    ],
    staff: [{ role: 'Coach', name: 'Scrum' }, { role: 'Coach', name: 'Jira' }],
    staffNote: 'How I organise, structure and manage my development work',
  },
  // Qualities in Jwan's own words.
  qualities: [
    { title: 'Team player', text: 'I enjoy collaborating with others, contributing to a shared goal and helping a team succeed.' },
    { title: 'Passionate about technology & football', text: 'I am passionate about using technology to improve, optimise and innovate within football.' },
    { title: 'Driven & passionate', text: 'I am genuinely passionate about what I do, motivated to learn, improve and take on new challenges.' },
  ],
  // The four project chapters in the Why section, in Jwan's own (approved) words.
  // 01 and 02: university group projects, made by the same group of six; the grades are the group's project grades on
  // the Danish 7-point scale, never individual grades. 03 (Soil): an individual project, every step by Jwan, checked
  // against github.com/JwSid24/Soil. 04 (FutNight): a personal project built with an AI-assisted workflow, checked
  // against github.com/JwSid24/FutNight. `system` is a schematic of the setup (lines only, not a screenshot);
  // `doc` is real documentation from the project's repository.
  studyProjects: [
    {
      no: '01', kind: 'group', label: 'University group project', tone: 'garnet',
      title: 'Component-Based Production System',
      overview: 'A component-based Java system for the SDU Industry 4.0 lab production line, built by our group of six. It integrates three production assets over three protocols: the AGV over REST, the Assembly Station over MQTT and the Warehouse over SOAP.',
      tech: ['Java', 'Component-based architecture', 'REST', 'MQTT', 'SOAP'],
      system: { hub: 'Our system', parts: [{ name: 'AGV', via: 'REST' }, { name: 'Assembly Station', via: 'MQTT' }, { name: 'Warehouse', via: 'SOAP' }] },
      list: { heading: 'My contributions', items: [
        { title: 'MQTT Integration', text: 'I shared responsibility with a teammate for implementing and ensuring reliable MQTT communication between the software system and the Assembly Station.' },
        { title: 'Documentation & Communication', text: 'I took responsibility for key project documentation, including writing the report and maintaining communication with our supervisor throughout the project.' },
        { title: 'System Design', text: 'I contributed to the system\'s overall design through collaborative work on the class diagram, Block Definition Diagram (BDD), context map and user journey map.' },
        { title: 'Testing & Evaluation', text: 'I participated in testing the solution and evaluating the prototype to assess its functionality as part of the development process.' },
      ] },
      note: { heading: 'How we worked · group of six', title: 'Collaborative Development', text: 'Working in a team of six, we used Jira and Scrum practices such as sprint planning, retrospectives, daily stand-ups and pair programming to structure our development process.' },
      result: { label: 'Group project result', value: '7', of: '12', text: 'Our group\'s grade · group of six · Danish 7-point scale',
        sr: '7 out of 12 on the Danish 7-point scale. This is our group\'s grade, not an individual grade.' },
    },
    {
      no: '02', kind: 'group', label: 'University group project', tone: 'blue',
      title: 'CPS Brewery Monitoring Platform',
      overview: 'A Cyber-Physical System platform for monitoring and optimising an industrial beer production line, inspired by breweries such as Albani and Carlsberg. Built by the same group of six, with communication over OPC UA.',
      tech: ['C#', '.NET', 'Blazor', 'HTML', 'CSS', 'OPC UA'],
      system: { hub: 'Our platform', parts: [{ name: 'Production line', via: 'OPC UA' }] },
      list: { heading: 'My contributions', items: [
        { title: 'Frontend Development', text: 'I was responsible for a significant part of the frontend development.' },
        { title: 'Backend Development', text: 'I also contributed to the backend implementation.' },
        { title: 'User Experience', text: 'Throughout the semester, I worked extensively on the user experience, shaping how users interact with and navigate the platform.' },
        { title: 'System Design', text: 'I worked on the class diagram and contributed to the activity diagram.' },
        { title: 'Planning & Documentation', text: 'I handled planning, documentation and other structural project responsibilities.' },
      ] },
      result: { label: 'Group project result', value: '10', of: '12', text: 'Our group\'s grade · the same group of six · Danish 7-point scale',
        sr: '10 out of 12 on the Danish 7-point scale. This is our group\'s grade, not an individual grade.' },
    },
    {
      no: '03', kind: 'solo', label: 'Individual university project', tone: 'gold',
      title: 'Soil Moisture Monitoring System',
      overview: 'A web application I built on my own to monitor soil moisture in Satemin, Germany. It automatically fetches hourly readings for two soil depths from the Open-Meteo API, stores the history in PostgreSQL, shows it as graphs and flags readings that fall below a defined threshold.',
      tech: ['C#', '.NET', 'ASP.NET Core', 'Blazor', 'PostgreSQL', 'Entity Framework Core', 'Docker', 'Three-layer architecture'],
      doc: { src: 'assets/projects/soil-class-diagram.png', caption: 'Class Diagram — Project Documentation', width: 1171, height: 695,
        alt: 'Class diagram of the Soil Moisture Monitoring System: the Home Blazor component, the SoilService and SoilDataClient behind their interfaces, the Open-Meteo response classes, AppDbContext and the SoilMoistureReading entity.' },
      list: { heading: 'End to end · every step mine', items: [
        { title: 'Requirements', text: 'Defined and prioritised the requirements with MoSCoW: seven functional and four non-functional.' },
        { title: 'Planning', text: 'Planned the project myself, from the first idea to the finished system.' },
        { title: 'Design', text: 'Designed the system with a class diagram and an activity diagram.' },
        { title: 'Architecture', text: 'Structured the application in three layers (interface, services and data), with the services behind interfaces.' },
        { title: 'Implementation', text: 'Built it with ASP.NET Core, Blazor and Entity Framework Core on PostgreSQL.', detail: 'Conducted load testing with k6 against a response-time requirement of under three seconds.' },
      ] },
      result: { label: 'Individual project', value: 'Solo', text: 'From idea to working system · every step by me' },
    },
    {
      no: '04', kind: 'personal', label: 'Personal project', tone: 'green',
      title: 'FutNight — Football Event Planning App',
      overview: 'A mobile app I created for my own group of friends, to make it easier to organise watching football matches together.',
      tech: ['C#', '.NET', 'ASP.NET Core Web API', 'SignalR', 'PostgreSQL', 'Entity Framework Core', 'React Native', 'Expo', 'TypeScript'],
      system: { hub: 'FutNight API', parts: [{ name: 'Mobile app', via: 'REST · SignalR' }, { name: 'PostgreSQL', via: 'EF Core' }, { name: 'Football-Data.org', via: 'HTTP' }] },
      list: { heading: 'How it works', items: [
        { title: 'Pick a match', text: 'Create an event for a match, using fixtures from Football-Data.org.' },
        { title: 'Share the link', text: 'Share an invite link with your friends.' },
        { title: 'No account needed', text: 'Friends answer through the link without creating an account.' },
        { title: 'Agree where', text: 'A live chat to agree where to watch: at the host\'s place, or to be decided.' },
      ] },
      note: { heading: 'How it was built', title: 'AI-assisted development', text: 'I came up with the idea and the product concept, and built the app with an AI-assisted, vibe-coding workflow. It was an experiment in how AI tools change the way I develop software, so not every line was written by hand.' },
      result: { label: 'Personal project', value: 'AI-assisted', text: 'Made for my friends · no grade' },
    },
  ] as StudyProject[],
  // Not shown at the moment: the projects section returns with the next major project.
  projects: [
    {
      title: 'This portfolio',
      tag: 'Next.js · GSAP · SVG',
      text: 'An interactive football-anime episode with an original character, layered stadium environments and a GSAP-driven timeline that leads into this portfolio.',
      link: 'https://github.com/JwSid24/Interactive-resume',
    },
  ],
  experience: [
    { when: 'Sep 2025 – Oct 2025', title: 'Mathematics Tutor', place: 'University of Southern Denmark (SDU)', tags: ['Student role'], minor: true,
      points: ['Prepared mathematical exercises and learning materials, explained mathematical concepts and guided students through problem-solving exercises. Also supported new students in understanding the course material.'] },
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
    { label: 'LinkedIn', value: 'linkedin.com/in/jwan-sidou-516a613b3', href: 'https://www.linkedin.com/in/jwan-sidou-516a613b3/' },
    { label: 'Location', value: 'Odense, Denmark' },
  ] as { label: string; value: string; href?: string }[],
};
