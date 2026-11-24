const storageKey = 'public-horses-demo-v1';
const oneDay = 86_400_000;

export const demoMember = { id: 'demo-ari', name: 'Ari Moss' };
export const demoOrganizer = 'maple';
export const actionLabels = {
  time: 'Offer time',
  skills: 'Offer skills',
  supplies: 'Offer supplies',
  funding: 'Try a sample gift',
};

export const places = {
  york: { id: 'ne-1159133615', label: 'York, PA', lat: 39.9629, lng: -76.728 },
  lancaster: { id: 'ne-1159125771', label: 'Lancaster, PA', lat: 40.0379, lng: -76.3058 },
  philadelphia: { id: 'ne-1159151243', label: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
  baltimore: { id: 'ne-1159149299', label: 'Baltimore, MD', lat: 39.2904, lng: -76.6122 },
};

export const profiles = {
  maple: { name: 'Maple Street Pantry', lead: 'Devon Reed', place: 'york', mark: 'MP', color: 'green',
    about: 'Neighbors pack groceries and offer a weekly pickup for households in York.' },
  neighbor: { name: 'Neighbor Table Network', lead: 'Jamie Vale', place: 'online', mark: 'NT', color: 'blue',
    about: 'A small group helps local food programs write instructions more neighbors can use.' },
  riverbend: { name: 'Riverbend Community Garden', lead: 'Jo Alvarez', place: 'lancaster', mark: 'RG', color: 'green',
    about: 'Neighbors grow food together and share the harvest with nearby pantries.' },
  wheatland: { name: 'Wheatland Bike Co-op', lead: 'Taylor Kim', place: 'lancaster', mark: 'WB', color: 'gold',
    about: 'Volunteer mechanics share tools and repair bikes that neighbors use to get to work.' },
  cedar: { name: 'Cedar Commons', lead: 'Sam Rivera', place: 'baltimore', mark: 'CC', color: 'rust',
    about: 'A neighborhood group runs a coat closet and connects volunteers with older neighbors.' },
  reading: { name: 'Delaware Avenue Reading Room', lead: 'Mara Chen', place: 'philadelphia', mark: 'DR', color: 'blue',
    about: 'A small reading room hosts story hours, book exchanges, and art tables.' },
  opendoor: { name: 'Open Door Resource Circle', lead: 'Riley Brooks', place: 'baltimore', mark: 'OD', color: 'gold',
    about: 'Neighbors help one another get to appointments and find services they can use.' },
};

const upcoming = [
  { id: 'pack-grocery-bags', organizerId: 'maple', title: 'Pack grocery bags for Saturday pickup', place: 'york',
    field: 'nourishment', saturday: true, hours: '10 to 11:30 a.m. ET', image: '/demo/grocery-bags.jpg',
    summary: 'Work with the pantry crew to pack and label 24 bags for families at the Saturday pickup.',
    completion: 'Pack 24 grocery bags and label each with the pickup code.',
    needs: [{ type: 'time', detail: 'Join the packing table for 90 minutes. The crew will show you what goes in each bag.' },
      { type: 'supplies', detail: 'Bring up to four clean reusable grocery bags to the pantry check-in.' }] },
  { id: 'translate-flyer', organizerId: 'neighbor', title: 'Review a bilingual pickup flyer', place: 'online',
    field: 'nourishment', days: 6, hours: '45 minutes on your own schedule', image: '/demo/remote-skills.jpg',
    summary: 'Check the Spanish text on a one-page flyer that tells neighbors how to pick up groceries.',
    completion: 'Return one marked-up draft. The organizer provides a sample flyer.',
    needs: [{ type: 'skills', detail: 'Compare the Spanish and English samples. Mark any changes and return the draft to the organizer.' }] },
  { id: 'garden-beds', organizerId: 'riverbend', title: 'Prepare the community garden beds', place: 'lancaster',
    field: 'health', days: 7, hours: '9 to 11 a.m. ET', image: '/demo/community-garden.jpg',
    summary: 'Spread compost and set out stakes so the next crew can plant greens for the pantry.',
    completion: 'Prepare three beds and place the plant labels at each end.',
    needs: [{ type: 'time', detail: 'Join for two hours. Bring gloves if you have them.' }] },
  { id: 'bike-lights', organizerId: 'wheatland', title: 'Fit lights on bikes for evening riders', place: 'lancaster',
    field: 'livelihood', days: 8, hours: '6 to 7:30 p.m. ET',
    summary: 'Help the bike crew fit donated front and rear lights before the evening loan pickup.',
    completion: 'Fit and test lights on six bikes.',
    needs: [{ type: 'skills', detail: 'Install and check bike lights. The co-op provides the tools.' },
      { type: 'supplies', detail: 'Provide a set of working clip-on lights.' }] },
  { id: 'coat-closet', organizerId: 'cedar', title: 'Sort coats for the winter closet', place: 'baltimore',
    field: 'health', days: 9, hours: '1 to 2:30 p.m. ET',
    summary: 'Put donated coats on racks by size so visitors can choose what fits.',
    completion: 'Sort 30 clean coats by size and set aside repairs.',
    needs: [{ type: 'time', detail: 'Help at the sorting table for one shift.' },
      { type: 'supplies', detail: 'Bring a clean adult coat with a working fastener.' }] },
  { id: 'bus-passes', organizerId: 'opendoor', title: 'Help pay for rides to appointments', place: 'baltimore',
    field: 'livelihood', days: 12, hours: 'Give by the closing date',
    summary: 'Help the resource circle buy bus passes for neighbors with scheduled appointments.',
    completion: 'Buy 20 day passes through the organizer.',
    needs: [{ type: 'funding', detail: 'The organizer will use gifts to buy day passes.' }] },
  { id: 'story-circle', organizerId: 'reading', title: 'Read at the Saturday story circle', place: 'philadelphia',
    field: 'happiness', saturday: true, hours: '11 a.m. to noon ET', full: true,
    summary: 'Read picture books and help families choose a book to take home.',
    completion: 'Read two picture books and reset the reading area.',
    needs: [{ type: 'time', detail: 'Read with families for one hour. The organizer provides books.' }] },
  { id: 'pantry-list', organizerId: 'maple', title: 'Update the pantry pickup checklist', place: 'online',
    field: 'nourishment', days: 10, hours: '30 minutes on your own schedule',
    summary: 'Check a short pickup checklist for clear tasks and flag instructions that need a date.',
    completion: 'Return a marked-up copy of the sample checklist.',
    needs: [{ type: 'skills', detail: 'Proofread one page and send it back with comments.' }] },
  { id: 'conversation-practice', organizerId: 'neighbor', title: 'Practice English over a video call', place: 'online',
    field: 'relationships', days: 11, hours: '7 to 7:30 p.m. ET',
    summary: 'Use a set of simple prompts to practice everyday English with a neighbor.',
    completion: 'Hold one 30-minute conversation with the prompt sheet.',
    needs: [{ type: 'time', detail: 'Join a small group for one guided conversation.' }] },
  { id: 'art-kits', organizerId: 'reading', title: 'Stock the after-school art table', place: 'philadelphia',
    field: 'happiness', days: 13, hours: 'Drop-off from 3 to 5 p.m. ET',
    summary: 'Help the reading room put together a set of drawing supplies for each child.',
    completion: 'Stock a dozen kits with pencils, paper, and crayons.',
    needs: [{ type: 'supplies', detail: 'Offer unopened crayons or a pack of blank paper.' },
      { type: 'funding', detail: 'Help the reading room buy the remaining materials.' }] },
  { id: 'welcome-calls', organizerId: 'cedar', title: 'Make welcome calls with a neighbor', place: 'baltimore',
    field: 'relationships', days: 14, hours: '5 to 6 p.m. ET',
    summary: 'Work with a host to invite neighbors to the next open meeting.',
    completion: 'Make two calls with the host and hand back the call notes.',
    needs: [{ type: 'time', detail: 'Join a short briefing and make calls with the host.' }] },
  { id: 'accessible-directory', organizerId: 'opendoor', title: 'Check a resource guide for accessibility', place: 'online',
    field: 'partnership', days: 16, hours: 'One hour on your own schedule',
    summary: 'Read a sample guide with a keyboard or screen reader. Help the team fix unclear links.',
    completion: 'Return three specific notes with the page and link names.',
    needs: [{ type: 'skills', detail: 'Review a four-page sample and send comments to the organizer.' }] },
  { id: 'harvest-greens', organizerId: 'riverbend', title: 'Harvest greens for the pantry', place: 'lancaster',
    field: 'partnership', days: 17, hours: '8:30 to 10 a.m. ET',
    summary: 'Pick, rinse, and weigh greens for the morning pantry delivery.',
    completion: 'Fill two crates and label each with its harvest date.',
    needs: [{ type: 'time', detail: 'Help with harvest and packing. Tools are available.' }] },
  { id: 'interview-practice', organizerId: 'wheatland', title: 'Run a practice interview for a new mechanic', place: 'online',
    field: 'livelihood', days: 19, hours: '6 to 6:45 p.m. ET',
    summary: 'Help an apprentice explain a repair they know how to do.',
    completion: 'Run one practice interview and share two useful notes.',
    needs: [{ type: 'skills', detail: 'Ask questions from a sample sheet and give short feedback.' }] },
];

const completed = [
  { id: 'assemble-pantry-boxes', organizerId: 'maple', title: 'Pack pantry boxes for the cold week', place: 'york',
    field: 'nourishment', days: -3, summary: 'Pack a shelf-stable grocery box for each family at pickup.',
    completion: 'Pack and label 32 pantry boxes.', result: 'The pantry crew packed 32 boxes and handed them out at pickup.',
    needs: [{ type: 'time', detail: 'Sort food and label the boxes.' }] },
  { id: 'sort-storybooks', organizerId: 'reading', title: 'Sort books for the family exchange', place: 'philadelphia',
    field: 'happiness', days: -8, summary: 'Set up the tables so families can find books for each age group.',
    completion: 'Sort 60 books by age group.', result: 'The reading room sorted 60 books and opened the exchange.',
    needs: [{ type: 'time', detail: 'Sort and label books.' }] },
  { id: 'winter-bikes', organizerId: 'wheatland', title: 'Tune up bikes for winter riding', place: 'lancaster',
    field: 'livelihood', days: -14, summary: 'Help the co-op check brakes and tires before winter bike loans.',
    completion: 'Ready four bikes for loans.', result: 'The crew checked and loaned all four bikes.',
    needs: [{ type: 'skills', detail: 'Check and adjust brakes.' }] },
  { id: 'garden-labels', organizerId: 'riverbend', title: 'Make garden labels in two languages', place: 'lancaster',
    field: 'partnership', days: -19, summary: 'Write simple labels for the shared garden beds.',
    completion: 'Make eight labels in English and Spanish.', result: 'The garden crew put eight bilingual labels beside the beds.',
    needs: [{ type: 'skills', detail: 'Check the translated plant names.' }] },
  { id: 'meal-labels', organizerId: 'maple', title: 'Write clear labels for meal kits', place: 'york',
    field: 'nourishment', days: -22, summary: 'Help make the meal-kit labels easy to read.',
    completion: 'Create 15 clear meal-kit labels.', result: 'The crew used 15 new labels during the last meal pickup.',
    needs: [{ type: 'skills', detail: 'Draft and check short labels.' }] },
];

const drafts = [
  { id: 'take-stock', organizerId: 'maple', title: 'Count pantry staples before the next pickup', place: 'york',
    field: 'nourishment', days: 18, hours: 'One hour with the pantry lead', status: 'draft',
    summary: 'Count what the pantry has on hand before the crew prepares the next pickup.',
    completion: 'Return a tally of the rice, beans, and canned vegetables.',
    needs: [{ type: 'time', detail: 'Count supplies on three shelves.' }] },
  { id: 'deliver-staples', organizerId: 'maple', title: 'Deliver pantry staples to older neighbors', place: 'york',
    field: 'nourishment', days: 15, hours: '10 a.m. to noon ET', status: 'submitted',
    summary: 'Take pantry boxes from the pickup site to neighbors who cannot travel.',
    completion: 'Bring four boxes to the assigned addresses and check in with the lead.',
    needs: [{ type: 'time', detail: 'Join a paired delivery route for one morning.' }] },
  { id: 'welcome-guide', organizerId: 'opendoor', title: 'Make a one-page welcome guide', place: 'online',
    field: 'partnership', days: 21, hours: 'One hour on your own schedule', status: 'submitted',
    summary: 'Help a new volunteer find the contact, meeting time, and request form.',
    completion: 'Return one revised page with the three starting steps.',
    needs: [{ type: 'skills', detail: 'Review the sample layout and check that the main steps are clear.' }] },
  { id: 'restock-bags', organizerId: 'maple', title: 'Restock reusable bags for the pickup table', place: 'york',
    field: 'nourishment', days: 17, hours: 'Drop-off from 9 a.m. to noon ET', status: 'changes_requested',
    summary: 'The pickup crew needs spare bags for neighbors who forget theirs.',
    completion: 'Collect 20 clean bags in two sizes.',
    reviewNote: 'Add which bag sizes the pantry can use.',
    needs: [{ type: 'supplies', detail: 'Bring clean reusable grocery bags.' }] },
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
  const pin = places[project.place] ?? null;
  return {
    ...project,
    slug: project.id,
    listingType: project.listingType ?? 'volunteer',
    location: pin?.label ?? 'Online',
    mapLocation: pin,
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
  const nextSaturday = (6 - new Date().getUTCDay()) || 7;
  const projects = [
    ...upcoming.map((project) => ({ ...project, status: 'published' })),
    ...completed.map((project) => ({ ...project, status: 'fulfilled' })),
    ...drafts,
  ].map(({ days, saturday, ...project }) => ({ ...project, date: dateOffset(saturday ? nextSaturday : days) }));
  const seeds = [
    { id: 'assemble-pantry-boxes', field: 'nourishment', note: 'I labeled each box while the neighbors packed it.',
      reflection: 'The new labels made the pickup feel calmer.', plot: 1, waters: 2 },
    { id: 'sort-storybooks', field: 'happiness', note: 'I put picture books where small children could reach them.',
      reflection: 'A parent told me their child picked a book on their own.', plot: 2, waters: 3 },
    { id: 'winter-bikes', field: 'livelihood', note: 'I helped check brakes on two of the loan bikes.',
      reflection: 'Showing someone the adjustment helped me remember it too.', plot: 4, waters: 1 },
    { id: 'garden-labels', field: 'partnership', note: 'I checked the Spanish names on the labels.',
      reflection: 'I noticed more neighbors asking about the plants.', plot: null, waters: 0 },
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
    responses: [{ projectId: 'harvest-greens', type: 'time', date: dateOffset(-1) }],
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
