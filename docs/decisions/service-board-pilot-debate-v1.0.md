# Service board pilot debate

**Record version** 1.0 · **Date** November 23, 2026 · **Baseline** `757e64c`

The delegated CEO approved the decisions for private implementation and rehearsal. Use the [research](../research/service-platform-benchmark-v1.0.md) and [revised plan](../plans/service-board-learning-v1.1.md) to trace the work.

## 1. Keep one place for offers

Organizer Success said an in-app signup could help an organizer who lacks a usable form. The CTO said a reversible pause could stop new offers while keeping a request eligible for fulfillment. Both options would require the board to track places, responses, and cancellations.

Use the organizer’s response page for offers and availability. A full request stays listed while the organizer waits for the work. Use **Mark fulfilled** when the organizer confirms the result. Use **Close opportunity** for withdrawal. Add one availability hint to a working public **Time** response. [Closure rules](../../server/store.js) · [Listing detail](../../src/catalog.jsx)

## 2. Help organizers write a clear request

An in-app guide could prompt a member at each field. Partnerships said the organizer needs to agree on the task and its source before signing in. Use one versioned card for that agreement and review. Add short hints to the existing schedule and review source fields. Keep the current listing form and its completion example. [Request and results card](../operations/pilot-request-card-v1.0.md)

## 3. Give supporters a route back

Impact and Learning found that the inline board link sits in the empty seed pouch. It disappears when the supporter has an unplanted seed. The site menu still links to the board. Move the inline link next to the journal action. Keep one board link in the signed-in garden content. [Garden](../../src/garden.jsx)

The board link lets a member browse. The organizer verifies the date and room for a particular next task. Use a consenting participant’s private code and dated organizer confirmation for the repeat test. Keep intentions and observations in the garden. [Repeat measure](../plans/service-board-learning-v1.1.md#record-the-outcome)

## 4. Verify the two kinds of failure

The CTO found that the restart test reopens demo records. Use the existing backup command in one new test with a fulfilled request and a private reflection. Restore to a separate database. Check the closed response and ownership of the saved entry. [Existing tests](../../test/marketplace.test.js) · [Backup command](../../scripts/backup-database.mjs)

Use a controlled organizer page to test the response handoff in a browser. Open, full, expired, and fulfilled states each need a check. The approved host and organizer must pass the [live gate](../pilot-acceptance.md#gates) before release.

## Revision record

**1.0** November 23, 2026. Recorded the team’s arguments and the CEO’s decisions.
