const storageKey = 'public-horses-demo-v2';
const oneDay = 86_400_000;

export const demoMember = { id: 'demo-ari', name: 'Ari Moss' };
export const demoOrganizer = 'lady-niguma-mexico';
export const featuredProjectId = 'setup-free-yoga';
export const yogiCorpsArchive = 'https://web.archive.org/web/20240913061355/https://www.yogastudiesinstitute.org/YCS';
export const actionLabels = {
  time: 'Offer time',
  skills: 'Offer skills',
  supplies: 'Offer supplies',
  funding: 'Try a sample gift',
};

export const places = {
  mexico: { id: 'demo-mexico-city', label: 'Mexico City area', lat: 19.4326, lng: -99.1332 },
  kansas: { label: 'Kansas, USA' },
  romania: { label: 'Romania' },
};

export const profiles = {
  'lady-niguma-mexico': { name: 'Lady Niguma Mexico', lead: 'YSI Yogi Corps', place: 'mexico', mark: 'LN', color: 'green',
    about: 'YSI students started a free yoga class in a community on the edge of Mexico City.' },
  'chair-yoga': { name: 'Chair Yoga for Seniors', lead: 'YSI Yogi Corps', place: 'kansas', mark: 'CY', color: 'gold',
    about: 'This project offered free chair yoga at a senior residence in rural Kansas.' },
  'yoga-for-the-elderly': { name: 'Yoga for the Elderly', lead: 'YSI Yogi Corps', place: 'romania', mark: 'YE', color: 'rust',
    about: 'This project shared yoga and readings with residents of a nursing home in Romania.' },
  'music-for-the-chakras': { name: 'Music for the Chakras', lead: 'YSI Yogi Corps', location: 'Denmark', mark: 'MC', color: 'blue',
    about: 'A musician in Denmark adapted yogic seed syllables for the nyckelharpa and used them in music lessons.' },
};

const upcoming = [
  { id: featuredProjectId, organizerId: demoOrganizer, title: 'Help set up a free yoga class', place: 'mexico',
    field: 'health', days: 7, hours: '45 minutes before class',
    summary: 'Lay out mats and help first-time students find their places.',
    completion: 'Set out 12 mats and have the room ready before students arrive.',
    needs: [{ type: 'time', detail: 'Meet the teacher at the room entrance. Allow 45 minutes for setup.' },
      { type: 'supplies', detail: 'Check with the organizer before bringing spare mats in good condition.' }] },
  { id: 'assist-lady-niguma', organizerId: demoOrganizer, title: 'Assist a Lady Niguma yoga teacher', place: 'mexico',
    field: 'partnership', days: 14, hours: 'One class with the lead teacher',
    summary: 'Help the teacher give new students a clear introduction to the class.',
    completion: 'Agree on your role with the teacher before assisting one class.',
    needs: [{ type: 'skills', detail: 'Share your teaching experience and ask the teacher where an assistant would help.' }] },
  { id: 'welcome-chair-yoga', organizerId: 'chair-yoga', title: 'Welcome people to chair yoga', place: 'kansas',
    field: 'health', days: 9, hours: '30 minutes before class',
    summary: 'Set out chairs with the host and greet residents as they arrive.',
    completion: 'Set up the chairs and help the host welcome residents who choose to attend.',
    needs: [{ type: 'time', detail: 'Tell the host when you can arrive. Follow the residence’s visitor instructions.' }] },
  { id: 'chair-yoga-materials', organizerId: 'chair-yoga', title: 'Prepare handouts for chair yoga', place: 'online',
    field: 'health', days: 13, hours: 'About one hour online',
    summary: 'Lay out the host’s approved handout in large type.',
    completion: 'Send the host one large-print file to check before printing.',
    needs: [{ type: 'skills', detail: 'Ask the host for the approved text and page size.' }] },
  { id: 'large-print-yoga-notes', organizerId: 'yoga-for-the-elderly', title: 'Format large-print practice notes', place: 'online',
    field: 'livelihood', days: 16, hours: 'One hour online',
    summary: 'Prepare one page the instructor can read together with nursing home residents.',
    completion: 'Send the instructor an editable sheet and a print-ready PDF.',
    needs: [{ type: 'skills', detail: 'Check the language and type size with the instructor before you start.' }] },
  { id: 'welcome-yoga-residents', organizerId: 'yoga-for-the-elderly', title: 'Prepare the room for a yoga visit', place: 'romania',
    field: 'relationships', days: 12, hours: '30 minutes before the visit',
    summary: 'Help the host arrange the room and set out reading materials.',
    completion: 'Have the room and reading materials ready before residents arrive.',
    needs: [{ type: 'time', detail: 'Check the residence’s visitor instructions with the host.' },
      { type: 'supplies', detail: 'Ask the instructor what materials they need before you bring anything.' }] },
  { id: 'caption-yoga-music', organizerId: 'music-for-the-chakras', title: 'Caption a short yoga music lesson', place: 'online',
    field: 'happiness', days: 10, hours: '60 to 90 minutes online',
    summary: 'Add captions to a short lesson about yogic seed syllables and music.',
    completion: 'Send one caption file for the artist to review.',
    needs: [{ type: 'skills', detail: 'Ask the artist for the approved clip and caption language.' }] },
  { id: 'review-yoga-music-worksheet', organizerId: 'music-for-the-chakras', title: 'Read through a music worksheet', place: 'online',
    field: 'happiness', days: 19, hours: 'About 30 minutes online',
    summary: 'Read the practice instructions as a beginner and flag any unclear steps.',
    completion: 'Send the artist one set of notes on the worksheet.',
    needs: [{ type: 'time', detail: 'Ask for the draft worksheet and send your notes to the artist.' }] },
];

const completed = [
  { id: 'prepare-free-class', organizerId: demoOrganizer, title: 'Prepare the room for a free yoga class', place: 'mexico',
    field: 'health', days: -8, summary: 'Set out mats before a free community class.',
    completion: 'Have 10 mats ready before class.', result: 'The volunteers set out 10 mats before the teacher opened the room.',
    needs: [{ type: 'time', detail: 'Set up with the teacher.' }] },
  { id: 'greet-chair-yoga', organizerId: 'chair-yoga', title: 'Set out chairs for a senior yoga class', place: 'kansas',
    field: 'health', days: -12, summary: 'Set up chairs and check that the host has space to move.',
    completion: 'Set out eight chairs.', result: 'Eight chairs were ready before the class.',
    needs: [{ type: 'time', detail: 'Set up with the class host.' }] },
  { id: 'read-with-seniors', organizerId: 'yoga-for-the-elderly', title: 'Prepare a reading for a yoga visit', place: 'romania',
    field: 'relationships', days: -5, summary: 'Make one large-print page for a group reading.',
    completion: 'Give the instructor one page before the visit.', result: 'The instructor received a large-print page for the reading.',
    needs: [{ type: 'skills', detail: 'Format the text the instructor provides.' }] },
  { id: 'prepare-music-worksheet', organizerId: 'music-for-the-chakras', title: 'Check the music practice notes', place: 'online',
    field: 'happiness', days: -4, summary: 'Review the notes for the first practice.',
    completion: 'Send one set of notes to the artist.', result: 'The artist received notes on the first practice.',
    needs: [{ type: 'skills', detail: 'Review one page of instructions.' }] },
];

const drafts = [
  { id: 'welcome-mexico-class', organizerId: demoOrganizer, title: 'Welcome new students to a free yoga class', place: 'mexico',
    field: 'health', days: 11, hours: '45 minutes before class', status: 'draft',
    summary: 'Greet first-time students and help them find a mat before the class starts.',
    completion: 'Have the entry table and 12 mats ready. Welcome new students as they arrive.',
    needs: [{ type: 'time', detail: 'Meet the teacher at the room entrance 45 minutes before class.' }] },
  { id: 'print-mexico-class-guide', organizerId: demoOrganizer, title: 'Check the Spanish class guide', place: 'online',
    field: 'partnership', days: 15, hours: 'About one hour online', status: 'submitted',
    summary: 'Check the directions and class notes before the organizer prints them.',
    completion: 'Send the teacher one marked-up copy of the guide.',
    needs: [{ type: 'skills', detail: 'Tell the teacher what experience you have editing Spanish copy.' }] },
  { id: 'spare-yoga-mats', organizerId: demoOrganizer, title: 'Offer spare mats for the community class', place: 'mexico',
    field: 'health', days: 18, hours: 'Arrange a time with the teacher', status: 'changes_requested',
    summary: 'Give the class lead clean mats for students who need to borrow one.',
    completion: 'Agree on the number and condition of the mats before drop-off.',
    reviewNote: 'Add a drop-off contact before this request goes on the board.',
    needs: [{ type: 'supplies', detail: 'Ask which mats the class can use before dropping them off.' }] },
];

export function demoHref(view = 'board', id) {
  const params = new URLSearchParams();
  if (view !== 'board') params.set('view', view);
  if (id) params.set('id', id);
  return '/experience' + (params.size ? '?' + params.toString() : '');
}

export function projectHref(project) {
  return demoHref('opportunity', project.id);
}

export function withPublicFacts(project) {
  const place = places[project.place];
  return {
    ...project,
    slug: project.id,
    listingType: project.listingType ?? 'volunteer',
    location: place?.label ?? 'Online',
    mapLocation: place?.id ? place : null,
    profile: profiles[project.organizerId],
    schedule: project.hours,
  };
}

export function dateOffset(days = 0) {
  return new Date(Date.now() + days * oneDay).toISOString();
}

const dateDisplay = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', weekday: 'short', timeZone: 'UTC',
});

export function demoDate(value) {
  return dateDisplay.format(new Date(value));
}

export function makeSeed(project, { type, intention, note }, createdAt = dateOffset()) {
  return {
    id: 'seed-' + project.id,
    projectId: project.id,
    projectTitle: project.title,
    type,
    intention,
    note,
    reflection: '',
    createdAt,
    plot: null,
    waters: 0,
    plantedAt: null,
    wateredAt: null,
    harvestedAt: null,
  };
}

function freshState() {
  const projects = [
    ...upcoming.map((project) => ({ ...project, status: 'published' })),
    ...completed.map((project) => ({ ...project, status: 'fulfilled' })),
    ...drafts,
  ].map(({ days, ...project }) => ({ ...project, date: dateOffset(days) }));
  const seeds = [
    { id: 'prepare-free-class', field: 'health', note: 'I set out mats and made space near the door.',
      reflection: 'Two new students stayed to talk with the teacher after class.', plot: 1, waters: 2 },
    { id: 'greet-chair-yoga', field: 'relationships', note: 'I set out chairs and greeted people as they arrived.',
      reflection: 'I remembered a few names when I came back.', plot: 2, waters: 3 },
    { id: 'read-with-seniors', field: 'happiness', note: 'I made a larger print version of the reading.',
      reflection: 'The instructor said it was easier to read together.', plot: 4, waters: 1 },
    { id: 'prepare-music-worksheet', field: 'partnership', note: 'I tried the exercise and marked the steps I had to read twice.',
      reflection: 'I heard the lesson differently when I tried to explain it.', plot: null, waters: 0 },
  ].map(({ id, field, note, reflection, plot, waters }) => {
    const project = projects.find((item) => item.id === id);
    return {
      ...makeSeed(project, { type: project.needs[0].type, intention: field, note }, project.date),
      reflection, plot, waters,
      plantedAt: plot ? project.date : null,
      wateredAt: plot ? dateOffset(-1) : null,
    };
  });
  return {
    projects, seeds,
    responses: [{ projectId: 'caption-yoga-music', type: 'skills', date: dateOffset(-1) }],
  };
}

export function loadDemoState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(state?.projects) && Array.isArray(state.seeds) && Array.isArray(state.responses)) return state;
  } catch {
    // The demo can still run if storage is unavailable.
  }
  return freshState();
}

export function saveDemoState(state) {
  try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Keep the current session in memory. */ }
}

export function resetDemoState() {
  return freshState();
}

export function updateGardenSeed(seeds, id, action, body) {
  const seed = seeds.find((item) => item.id === id);
  if (!seed) throw new Error('This seed is unavailable.');
  const today = dateOffset();
  let change;
  switch (action) {
    case 'plant':
      if (seed.plantedAt || !Number.isInteger(body.plot) || body.plot < 1 || body.plot > 12
        || seeds.some(({ plot }) => plot === body.plot)) throw new Error('Choose an empty garden plot.');
      change = { plot: body.plot, plantedAt: today };
      break;
    case 'water':
      if (!seed.plot || seed.waters >= 3) throw new Error('This seed cannot be watered.');
      if (seed.wateredAt?.slice(0, 10) === today.slice(0, 10)) return seed;
      change = { waters: seed.waters + 1, wateredAt: today };
      break;
    case 'harvest':
      if (!seed.plot || seed.waters < 3) throw new Error('Water this plant on three days before harvest.');
      change = { plot: null, harvestedAt: today };
      break;
    case 'reflection':
      change = { reflection: String(body.reflection ?? '').trim().slice(0, 500) };
      break;
    default:
      throw new Error('This garden action is unavailable.');
  }
  return { ...seed, ...change };
}
