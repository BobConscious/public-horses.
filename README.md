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

## How the marketplace works

1. **Organize.** Draft an ask for funding, supplies, time, or skills. Add an end date, the official support links, and a private source for review.
2. **Review.** A separate reviewer checks that the ask and links belong to the organizer. Publish the submitted version or return it with a reason. The organizer can revise returned work. Expired and closed asks leave the directory.
3. **Support.** Filter by field and open a specific ask. Give through the organizer’s own channel. Sign in to record help you already gave and choose an intention.
4. **Grow.** Each saved act earns one private seed. Plant it, water it once a day, and harvest after three waterings. Your account keeps the garden and its optional notes.

[Kiva’s discovery and support flow](https://www.kiva.org/about/how) and [partner review](https://www.kiva.org/about/due-diligence/lending-partners) informed this structure. Public Horses records self-reported support and sends givers to the organizer.

## Data and operation

The React site and Express API run on one origin. SQLite stores accounts, sessions, projects, review decisions, and garden records. The demo and regular app use separate files in `.data/`. Launch a built copy with `npm run build` and `npm start`.

A hosted copy needs a persistent volume for `PH_DB_PATH` and an HTTPS `PH_ORIGIN` behind a TLS proxy that preserves the request host. Set `HOST` and `PORT` for that host. The current app uses local password accounts. Public operation needs account recovery, backups, and an independent review queue.

Fast for Hunger is the proposed first pilot partner. It can link to Nourishment projects after the meditation. Its registration, reports, and globe stay in its own system. Check after two cycles whether partners refresh their requests and supporters return between meditations.

Demo imagery in [public/art](public/art) uses original ImageGen editorial illustrations of a community garden, pantry produce, shared tools, and books.
