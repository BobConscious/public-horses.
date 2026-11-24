# Public Horses synthetic user avatars

**Version** 1.0 · **App baseline** `6a81c9d`

These eight fictional profiles represent different decisions people make on the service board. They are test assumptions. Revise them when real participants describe different needs. The [mission](../mission.md) and [pilot plan](../plans/service-board-learning-v1.1.md) define the work these profiles cover.

## Supporters

### Nia Brooks

**First-time local volunteer.** Nia works changing shifts. She can give 90 minutes in York, Pennsylvania, on one Saturday morning. She has never used the board. She wants to help with food distribution and needs a clear place to start.

**How she decides.** She looks for a task, start time, duration, and location. She follows the organizer’s link if the shift fits. If the shift is full, she returns to the board and stops when no other time fits.

**What to test.** Use a 390-pixel phone layout with a keyboard. Start signed out. Check discovery, the time response, and what she does when the organizer has no room. Cases `VOL-01` and `VOL-02`.

### Val Soto

**Remote skills volunteer.** Val edits bilingual handouts and has 45 minutes after work. Local travel does not fit. Val prefers one task with a result that can be checked, such as a marked-up pickup sheet.

**How Val decides.** Val checks the expected result, time, deadline, and delivery method. Val offers help when the task uses sample materials. Missing instructions about the materials or delivery are a reason to stop.

**What to test.** Use a desktop. Start signed out. Check that online requests are easy to find and that the skills link leads to the right task. Cases `SKILL-01` and `SKILL-02`.

### Robin Cho

**Direct giver.** Robin can give up to $25 or supply four reusable grocery bags. Robin cannot attend a shift. A clear list of acceptable supplies or a clear giving purpose makes the decision easier.

**How Robin decides.** Robin checks who made the request and what the gift provides. Robin uses the organizer’s channel. If it is unavailable, Robin returns to the listing and makes a fresh decision about other ways to help.

**What to test.** Use a phone. Start signed out. Check the funding and supplies links separately. Stop at the controlled page before any payment or delivery. Cases `GIVE-01` and `GIVE-02`.

### Ari Moss

**Returning helper.** Ari already helped pack food bags. Ari wants to practice service regularly and notice how it shapes daily choices. A saved service link and a private place to write matter more than a public record.

**How Ari decides.** Ari records what happened and chooses an intention that fits the act. Ari adds a later observation after reflecting, then looks for another useful task. Ari shares contact details for a second offer only after agreeing to it.

**What to test.** Use Ari’s own member account. Check the first seed, the separate service note and observation, and the return to the board. Check that a second account sees its own garden. Cases `GARDEN-01` and `GARDEN-02`.

## Organizers

### Jamie Vale

**Individual organizer.** Jamie is a neighbor who can coordinate a small request. Jamie has no organization website. For this test Jamie can provide an HTTPS source that confirms the task. Jamie also helps with other people’s requests.

**How Jamie decides.** Jamie uses a person profile and describes one clear result. Jamie follows a reviewer’s feedback when the request needs a change. If the task is withdrawn, Jamie closes it and keeps a record of any separate service already given.

**What to test.** Use a regular member account. Check the person profile, draft, and private review source. Check ordinary closure and the move from organizing to recording service with the same account. Cases `PERSON-01` and `PERSON-02`.

### Devon Reed

**Organization coordinator.** Devon schedules a small pantry crew. The pantry has one opening for this shift. Devon uses the pantry’s page to answer offers and manage availability.

**How Devon decides.** Devon posts what to do, when to come, and what counts as complete. Devon updates the outside page when the slot fills. Devon marks the request fulfilled only after the crew confirms the result.

**What to test.** Use a regular member account that owns an organization profile. Check the editor, review handoff, and the difference between a full slot and a fulfilled request. Cases `ORG-01` and `ORG-02`.

## Review and referral

### Casey Lin

**Listing reviewer.** Casey checks submitted requests in a separate reviewer account. Casey must be able to trace each request to its organizer and confirm how people can help.

**How Casey decides.** Casey checks the latest task, profile, completion result, dates, and links. Casey requests a specific correction when information is missing. Casey refreshes a changed submission and asks another reviewer to handle any request Casey owns.

**What to test.** Grant review access to Casey. Check correction, resubmission, and publication. Check that the queue excludes Casey’s own request and that an old review cannot publish a newer version. Cases `REVIEW-01` and `REVIEW-02`.

### Tess Ward

**Referral partner.** Tess leads a fictional community meditation group. Tess wants people to leave a session with one clear way to serve. Tess checks the link before sharing it on the group’s own page.

**How Tess decides.** Tess looks for a reviewed request that still has room. A stale or full request needs a new destination. Tess distinguishes an offer to help from work the organizer confirms.

**What to test.** Use a controlled partner page and a signed-out visitor. Check a current direct referral and a fallback to the service board after expiry. Use the group’s test page for the handoff. Cases `REF-01` and `REF-02`.

## Run a case

Use the [case file v1.0](synthetic-user-cases-v1.0.json) for the 16 task prompts, starting states, sample data, and pass checks. Start with `ORG-01`, `REVIEW-01`, `VOL-01`, `ORG-02`, and `GARDEN-01` to cover the main journey. Each case starts from its own declared state.

1. Use the baseline app or record a newer build. Start a non-demo instance with a fresh local test database. Use a distinct browser session for each actor. Create only the listed fixtures and the accounts they need.
2. Create any saved listings through the normal draft and review steps. Use the case clock and the state rules below. Map fixture IDs to the app’s generated IDs and slugs.
3. Intercept the listed HTTPS destinations in the test browser. Use the page modes below. Replace `{listing-id}` in a case entry with that fixture’s slug. Use fictional data in every handoff.
4. Give the synthetic user its profile, task, entry page, and session or device settings. Keep the operator steps and pass checks with the test operator. Ask the user what it chose and what helped or stopped it.
5. Record the case ID, avatar, app commit, and case file version. Capture the observed behavior and compare it with every pass check. Keep the record and evidence in `.data/`. [Team review process](../agent-team.md#review-process)

## Fixture state rules

| State | Setup |
| --- | --- |
| `uncreated` | Use the profile and listing values as input during the case. Leave that listing and its profile absent at the start. |
| `submitted` | Create the profile and draft. Submit the draft with its current version. Leave it in review. |
| `published` | Have a separate reviewer approve the submission. Publish on the start date in the case file. |
| `fulfilled` | Publish first. On the `afterShift` clock, have the listed owner mark the request fulfilled. |
| `expired` | Publish first. Advance the clock past the listing’s last day. Leave the stored status as published. |

The case clock uses date values from the JSON. Set up the database on the `start` date before advancing it. The app store accepts a test clock. For a manual browser run, use a disposable server with that clock. [Existing test setup](../../test/marketplace.test.js)

Apply listing `overrides` before saving a draft. If a case has a `savedAct`, create it under the named account after advancing the clock. Keep its original save ID for the retry check.

Use each test page’s `defaultMode` unless the case sets a `pageModes` value. Use the mode’s heading, text, and optional status. Resolve its links against the local app. When a test offer returns a receipt, switch to `nextMode`. A full response produces no new receipt.

The operator supplies simulated organizer confirmation only when the case calls for it. Count test receipts and simulated service in the test record. [Pilot measures](../plans/service-board-learning-v1.0.md#record-the-results)

## Revision record

**1.0.** Added eight user profiles, 16 cases, and reusable fixture inputs.
