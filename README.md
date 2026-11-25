# Public Horses

Public Horses is a service board. Post a specific way to help or find an opportunity you can fulfill. Record your service and reflect on it in a private garden. A member can post and fulfill opportunities with one account.

## Mission and team

Read the [mission and participant journey](docs/mission.md) for the project’s purpose. Use the [agent guide](AGENTS.md) and [team roster](docs/agent-team.md) to assign work, review it, and run a private rehearsal.

Use the [pilot acceptance plan](docs/pilot-acceptance.md) to test the service path. Use the [pilot hosting guide](docs/pilot-hosting.md) to test sign-in, durable storage, and recovery.

Use the [pilot plan v1.1](docs/plans/service-board-learning-v1.1.md) and [private request card](docs/operations/pilot-request-card-v1.0.md) for the next test. The [research](docs/research/service-platform-benchmark-v1.0.md) and [team debate](docs/decisions/service-board-pilot-debate-v1.0.md) give the basis for the plan.

Use the [synthetic user avatars](docs/testing/synthetic-user-avatars-v1.0.md) to prepare fictional users and test the service journey.

## Brand and UI

Read the [brand kit](docs/brand-kit.md) and [UI library guide](docs/ui-library.md). Open `/design-system` to use the live examples and download the logo files and CSS tokens.

## Run the demo

Use Node.js 24.14 or later in the 24 series.

```sh
npm ci
npm run demo
```

Open [the local demo](http://127.0.0.1:4173). It uses five example listings and its own database. The listings include a volunteer request, a monthly event, and a fictional personal profile. Create two local accounts to rehearse organizer and reviewer roles.

Open [the interactive demo](http://127.0.0.1:4173/experience) to try sample requests based on four Yogi Corps projects. The requests, replies, and results are practice records. Demo actions stay in the current browser tab. [Archived Yogi Corps profiles](https://web.archive.org/web/20240913061355/https://www.yogastudiesinstitute.org/YCS)

In My garden, click or tap a plot to walk to it. You can also walk with the arrow keys or WASD and press E to interact. Use the garden plot list to reach the same controls directly. Before you water a seed, remember emptiness and rejoice in the act that planted it.

```sh
npm run reviewer -- --demo reviewer@example.org
npm test
npm run build
```

The reviewer command grants access to an existing account. Run `npm run dev` for an empty catalog and omit `--demo` when assigning review access there.

## Private Vercel preview

Enable Vercel Authentication on the preview project before deploying. Open the deployment URL that Vercel generates. Use a test account to try the workspace and garden. Vercel can clear preview records when it restarts the function.

## Connect Clerk

Create a Clerk application and enable verified email addresses. Use one application origin for the UI and API. Copy the publishable and secret keys from that Clerk instance into an ignored `.env.clerk` file.

```dotenv
PH_AUTH_MODE=clerk
PH_ORIGIN=http://127.0.0.1:4175
PORT=4175
PH_DB_PATH=.data/marketplace-clerk.sqlite
CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
```

```sh
node --env-file=.env.clerk server/index.js
```

Open the exact URL in `PH_ORIGIN`. Port `4175` and the separate database let the Clerk instance run alongside the demo.

With [Clerk test mode](https://clerk.com/docs/guides/development/testing/test-emails-and-phones) enabled, sign up with a test address such as `garden+clerk_test@example.com`. Verify it with code `424242`. Open the private garden, sign out, and confirm that the garden asks you to sign in again. Then sign back in and confirm that the garden opens.

To grant review access, have the account sign in once. Then use the Clerk user ID shown in the dashboard.

```sh
node --env-file=.env.clerk server/reviewer.js --clerk user_ID_FROM_DASHBOARD
```

Clerk manages sign-in and account recovery. Public Horses keeps projects, garden records, and reviewer permissions under its own member IDs. Each Clerk member maps to the instance issuer and user ID. An email match leaves the existing account and its data in place. Resolve account migrations separately.

For hosting, set the exact HTTPS origin. Rehearse with development keys and use matching live keys for a public launch. Keep the secret on the server. Serve the built app behind an HTTPS proxy that preserves the host. See [Clerk’s React setup](https://clerk.com/docs/react/getting-started/quickstart) and [Express session setup](https://clerk.com/docs/reference/express/clerk-middleware). The demo uses separate local accounts.

## How the marketplace works

1. **Post.** Create a person or organization profile in the workspace. State the task, where and when to help, and what counts as complete. Provide an end date, official support links, and a private source for review.
2. **Review.** A separate reviewer checks the listing, profile, and any image. Approval makes that version public. Later profile edits stay private until a reviewer approves a listing that uses them. Expired and closed listings leave the directory.
3. **Serve.** Find a specific need and respond through the organizer’s own channel. The organizer can mark the opportunity fulfilled once the help meets the need.
4. **Record.** Sign in to record service you already gave and choose an intention. Use the direct link to record past service after the opportunity closes.
5. **Reflect.** Each saved act gives you one private seed. You can plant it, water it once a day, and harvest after three waterings. Use the journal to record what you notice later.

[Kiva’s discovery and support flow](https://www.kiva.org/about/how) and [partner review](https://www.kiva.org/about/due-diligence/lending-partners) informed this structure. Public Horses records self-reported support and sends givers to the organizer.

## Project map

Switch the project directory to **Map** to browse by city. Search and filters work in both views. Select a pin to see the listings in that city. Online listings and listings without a city appear below the map.

Organizers can add or remove a city in the listing editor. The map shows the city center. Use the public location field and organizer links for venue details. A reviewer sees the selected city before publishing the listing.

The app serves the map files from `public/maps/`. Refresh them with `node scripts/refresh-map-data.mjs`. The files use [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.2) country, US state, and populated place data. Keep the source place IDs stable so existing listings retain their pins.

## Data and operation

The React site and Express API run on one origin. SQLite stores accounts, sessions, projects, listing images, review decisions, and garden records. The demo and regular app use separate files in `.data/`. Launch a built copy with `npm run build` and `npm start`.

Each listing can have one image. The editor accepts JPEG, PNG, or WebP files up to 2 MB and asks for a short image description. The server resizes the image and removes file metadata.

A hosted copy needs a persistent volume for `PH_DB_PATH` and an HTTPS `PH_ORIGIN` behind a TLS proxy that preserves the request host. Set `HOST` and `PORT` for that host. Use Clerk for hosted identity and maintain backups and reviewer access.

Fast for Hunger is the proposed first pilot partner. It can link to Nourishment projects after the meditation. Its registration, reports, and globe stay in its own system. Check after two cycles whether partners refresh their requests and supporters return between meditations.

## Artwork

- [Flower Garden and Bungalow, Bermuda](https://www.metmuseum.org/art/collection/search/11121), Winslow Homer, 1899. The Metropolitan Museum of Art.
- [Swamp Azalea](https://americanart.si.edu/artwork/swamp-azalea-azalea-viscosa-26378), Mary Vaux Walcott, 1918. Smithsonian American Art Museum.
- [City and Sunset](https://www.metmuseum.org/art/collection/search/10872), Henry Farrer. The Metropolitan Museum of Art. Sample listing illustration.
- The About page uses three generated watercolor scenes. They follow a flower path past a lily pond to a meadow with two horses.
