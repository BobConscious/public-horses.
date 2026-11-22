# Public Horses

**Kshetra** helps people find projects that serve their communities. See what a project needs, offer help directly, and grow a private garden from the acts you record. A member can organize projects and support other organizers with one account.

## Run the demo

Use Node.js 24.14 or later in the 24 series.

```sh
npm ci
npm run demo
```

Open [the local demo](http://127.0.0.1:4173). It uses three fictional projects with sample links and its own database. Create two local accounts to rehearse organizer and reviewer roles.

```sh
npm run reviewer -- --demo reviewer@example.org
npm test
npm run build
```

The reviewer command grants access to an existing account. Run `npm run dev` for an empty catalog and omit `--demo` when assigning review access there.

## Private Vercel preview

Enable Vercel Authentication on the preview project before deploying. Open the deployment URL that Vercel generates. The preview uses fictional projects. Use a test account to try the garden. Vercel can clear preview records when it restarts the function.

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

1. **Organize.** Draft an ask for funding, supplies, time, or skills. Add an end date, the official support links, and a private source for review.
2. **Review.** A separate reviewer checks that the ask and links belong to the organizer. Publish the submitted version or return it with a reason. The organizer can revise returned work. Expired and closed asks leave the directory.
3. **Support.** Filter by field and open a specific ask. Give through the organizer’s own channel. Sign in to record help you already gave and choose an intention.
4. **Grow.** Each saved act earns one private seed. Plant it, water it once a day, and harvest after three waterings. Your account keeps the garden and its optional notes.

[Kiva’s discovery and support flow](https://www.kiva.org/about/how) and [partner review](https://www.kiva.org/about/due-diligence/lending-partners) informed this structure. Public Horses records self-reported support and sends givers to the organizer.

## Data and operation

The React site and Express API run on one origin. SQLite stores accounts, sessions, projects, review decisions, and garden records. The demo and regular app use separate files in `.data/`. Launch a built copy with `npm run build` and `npm start`.

A hosted copy needs a persistent volume for `PH_DB_PATH` and an HTTPS `PH_ORIGIN` behind a TLS proxy that preserves the request host. Set `HOST` and `PORT` for that host. Use Clerk for hosted identity and maintain backups and reviewer access.

Fast for Hunger is the proposed first pilot partner. It can link to Nourishment projects after the meditation. Its registration, reports, and globe stay in its own system. Check after two cycles whether partners refresh their requests and supporters return between meditations.

Demo imagery in [public/art](public/art) uses original ImageGen editorial illustrations of a community garden, pantry produce, shared tools, and books.
