# Service board pilot plan

**Version** 1.0 · **Date** November 22, 2026 · **Decision** CEO proposal · **Public Horses baseline** `d58f7ec`

Prove that one clear request leads to service the organizer confirms. Then test whether someone serves again. Give supporters a private place to reflect on the world they want to create. [Mission](../mission.md) · [Research v1.0](../research/service-platform-benchmark-v1.0.md)

Use the current board and garden for both cycles. The board already supports review, fulfillment, and past service records. [Current app flow](../../README.md#how-the-marketplace-works)

## 1. Prepare one request

**Owners** Partnerships and Organizer Success.

1. Choose one organizer and one Nourishment task in one area. Confirm the organizer's identity, official contact route, and current need.
2. Use the approved scope for any contact. Get the organizer's approval for the exact request and its response link.
3. Use the existing listing fields. Ask the organizer about a second date for the repeat test.

Use one short request card with these fields.

| Field | What to record |
| --- | --- |
| Task | One act of service. For example, sort and label one cart of pantry donations. |
| Time and place | Date, start time, time needed, meeting place, and required materials or skills. |
| Complete result | The result the organizer can confirm. For example, the pantry lead accepts one labeled cart. |
| Response | One official link. Name who answers and who keeps availability current. |
| Review source | Give the reviewer an HTTPS link that confirms the request. Keep this field private. The response page can serve both purposes if it confirms the request. |
| End | Last response date and the person who can confirm or withdraw the request. |

**Pass.** The organizer approves the exact card and agrees to confirm the result. Check the private review source and the response link. Hold the listing if a check fails. [Current listing editor](../../src/workspace.jsx)

## 2. Rehearse the path

**Owners** COO and CTO. Assign independent Readiness and Evidence reviewers.

1. Review the versioned request card and expected results. Record the exact build and test environment.
2. Use a fictional request. Use a phone and keyboard to find it, read the task, and open the response link. Record the test receipt from the controlled destination.
3. Mark the fixture fulfilled. Use its direct URL to record earlier service. Check that a retry gives one seed.
4. Test a full request and an expired request. Check that the response page shows when the task is full. Check that the organizer stops taking offers. For expiry, check that the board removes the response action.

**Pass.** The normal and exception cases pass. The reviewers accept the exact record. Use the existing live gate for sign-in, restart, and recovery on the approved host. [Team review process](../agent-team.md#review-process) · [Pilot acceptance gates](../pilot-acceptance.md#gates)

## 3. Confirm the first result

**Owner** Organizer Success.

1. Confirm receipt of an agreed test response on the organizer's approved route. Start the first cycle after the live gate passes and Bob authorizes release.
2. Share the approved request through one trusted local channel. Use the organizer's page to show available places. The organizer confirms places and updates that page when full.
3. Ask the organizer to report the result and service date. Use **Mark fulfilled** after the organizer confirms the work. Use **Close opportunity** for a withdrawal.

In the current app, closure ends the listing's ability to accept a later fulfillment decision. Keep a full request at its current status while the work is pending. Show that it is full on the organizer's response page. [Closure rules](../../server/store.js)

**Pass.** The organizer confirms that one published request met its stated need. The board removes the fulfilled listing from discovery. Keep the confirmation and listing ID in the private pilot record.

## 4. Test a second act

**Owner** Impact and Learning.

1. Offer an optional visit to the private garden after service. The supporter can record what they did and what they notice over time.
2. If the organizer has another approved task, check the date, availability, and link. Offer its direct link after the first confirmed act. Use the board if that task fills or closes.
3. Ask for consent to link two acts with a private participant code. Ask the organizer to confirm the second act and its date. If a second task is unavailable, close the first cycle and record the reason.

**Pass.** The organizer confirms one repeat act by a consenting supporter who received the next offer. This result shows that the path worked for that person. [Current service journal](../../src/garden.jsx)

## Record the results

| Measure | How to count it |
| --- | --- |
| Published requests | Count distinct reviewed listing IDs that the pilot publishes. |
| Fulfilled requests | Count a request once when the organizer confirms the stated result and service date. Report the count out of published requests. |
| Repeat service | Count consenting people with a confirmed first act and an offer for a current second task. Report how many had a second confirmed act. |
| Garden return | Ask an optional yes-or-no question. Keep journal notes and intentions within the member's account. |

A response or signup shows interest. Keep the organizer's dated confirmation as the evidence of service. Mark missing results as unknown. Record the result before deciding on a feature change.

## Decide what changes next

The CEO reviews the first result and any repeat result. Start with the step that stopped people from serving.

- If people miss the time, place, or result, revise the card and test it again.
- If the link causes repeated problems, revise the response instructions. Test an organizer update by hand before adding an availability field.
- If people can serve again, keep the next task easy to find. Ask the organizer if they can keep requests current before adding more.

## Team decisions

Organizer Success and Partnerships chose one request with a direct response. The CTO identified the difference between full and fulfilled in the current app. Impact and Learning proposed a second task and a private return check. The CEO chose this order and kept the existing release gate for Bob's approval. [CEO brief](../ceo-persona.md)

The first decision is the organizer and the scope of contact. The CEO brings Bob the proposed contact when it needs approval.

## Revision record

**1.0** November 22, 2026. First CEO plan based on the five-platform comparison and team discussion.
