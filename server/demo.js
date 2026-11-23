import { readFileSync } from 'node:fs';

const sunset = readFileSync(new URL('./fixtures/city-sunset.webp', import.meta.url));

export function seedDemo(store) {
  const endsAt = store.demoEndDate();
  store.addDemoProjects([
    {
      id: 'demo-pantry',
      slug: 'stock-the-neighborhood-pantry',
      art: 'pantry',
      title: 'Stock the neighborhood pantry',
      organization: 'Maple Street Pantry',
      location: 'Portland, Oregon',
      summary: 'Fill the shelves with rice, beans, and oats for the next Saturday pantry.',
      story: 'Maple Street Pantry runs a Saturday grocery table for neighbors. The shelves fill quickly on Friday and empty before the end of the morning. A delivery of shelf-stable staples would give the next group of shoppers more choices. This is a fictional request for the Public Horses demo.',
      field: 'nourishment',
      proofUrl: 'https://maple-street-pantry.example.invalid/about',
      endsAt,
      needs: [
        { type: 'supplies', detail: 'Drop off unopened rice, beans, or oats.', url: 'https://maple-street-pantry.example.invalid/supplies' },
        { type: 'funding', detail: 'Contribute directly to the pantry grocery fund.', url: 'https://maple-street-pantry.example.invalid/give' },
      ],
    },
    {
      id: 'demo-tools',
      slug: 'keep-the-repair-table-open',
      art: 'tools',
      title: 'Keep the repair table open',
      organization: 'Morgan Lee',
      profile: {
        kind: 'person',
        name: 'Morgan Lee',
        bio: 'Morgan is a fictional organizer who helps run a free neighborhood repair table.',
        location: 'Burlington, Vermont',
      },
      location: 'Burlington, Vermont',
      summary: 'Help neighbors extend the life of everyday things at a free repair café.',
      story: 'At the repair table, neighbors bring loose chair legs, worn lamps, and clothes with missing buttons. A small group of repairers shows people how to fix what they bring. The organizers need a few sets of basic hand tools and volunteers who can teach simple repairs. This is a fictional request for the Public Horses demo.',
      field: 'livelihood',
      proofUrl: 'https://second-saturday.example.invalid/about',
      endsAt,
      needs: [
        { type: 'skills', detail: 'Teach one basic repair at the next open table.', url: 'https://second-saturday.example.invalid/repairers' },
        { type: 'supplies', detail: 'Share working hand tools or a basic sewing kit.', url: 'https://second-saturday.example.invalid/tools' },
      ],
    },
    {
      id: 'demo-reading',
      slug: 'make-time-for-story-hour',
      art: 'reading',
      title: 'Make time for story hour',
      organization: 'The Corner Reading Room',
      location: 'Richmond, Virginia',
      summary: 'Bring books and an hour of your time to a neighborhood reading room.',
      story: 'Every Thursday, the reading room sets out a rug and brings children together for stories. The organizers are building a shelf that reflects the languages spoken by local families. They also need volunteers to read aloud and help children choose a book to take home. This is a fictional request for the Public Horses demo.',
      field: 'happiness',
      proofUrl: 'https://reading-room.example.invalid/about',
      endsAt,
      needs: [
        { type: 'time', detail: 'Join one Thursday story hour as a volunteer reader.', url: 'https://reading-room.example.invalid/story-hour' },
        { type: 'supplies', detail: 'Donate a picture book in one of the languages on the request list.', url: 'https://reading-room.example.invalid/books' },
      ],
    },
    {
      id: 'demo-aci-volunteer',
      slug: 'digitize-media-archives',
      title: 'Help digitize media archives',
      organization: 'Asian Classics Institute',
      profile: {
        kind: 'organization',
        name: 'Asian Classics Institute',
        bio: 'Asian Classics Institute shares Buddhist teachings through courses, translations, and archives.',
        websiteUrl: 'https://www.asianclassics.institute/become-a-volunteer',
      },
      listingType: 'volunteer',
      location: 'Contact organizer for details',
      summary: 'Give time to help preserve the institute’s media archives.',
      story: 'This preview example uses the institute’s public volunteer page. Ask the institute about current archive work and how to help.',
      field: 'livelihood',
      proofUrl: 'https://www.asianclassics.institute/become-a-volunteer',
      endsAt,
      needs: [
        { type: 'time', detail: 'Help digitize the institute’s media archives.', url: 'https://www.asianclassics.institute/become-a-volunteer' },
      ],
    },
    {
      id: 'demo-fast-for-hunger',
      slug: 'fast-for-hunger-new-moon-meditation',
      title: 'Fast for Hunger new moon meditation',
      organization: 'Fast for Hunger',
      demoImage: { bytes: sunset, alt: 'A golden sky over a distant city skyline, painted by Henry Farrer.' },
      profile: {
        kind: 'organization',
        name: 'Fast for Hunger',
        bio: 'Fast for Hunger connects a shared meditation with practical support for neighbors who face hunger.',
      },
      listingType: 'event',
      schedule: 'Monthly on the new moon',
      location: 'Online',
      summary: 'Join a guided meditation and support a local food organization. Fasting is optional.',
      story: 'This preview shows the monthly format. Participants use their own experience of hunger to build empathy, then choose a way to help close to home.',
      field: 'nourishment',
      proofUrl: 'https://fast-for-hunger.example.invalid/about',
      endsAt,
      needs: [
        { type: 'time', detail: 'Join the online meditation. This preview has no registration link.', url: 'https://fast-for-hunger.example.invalid/meditation' },
      ],
    },
  ]);
}
