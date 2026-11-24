# Avatar concept test and decisions

**Version** 1.0 · **Date** November 23, 2026 · **Starting commit** `2abb0c3`

The team used the eight [synthetic profiles](synthetic-user-avatars-v1.0.md). It gave each profile the same pitch in a separate role-play. These responses give us product ideas to test.

## Pitch

> Public Horses is a service board where a person or group posts a specific way to help. A reviewer checks the request before it appears. You find a task and respond through the organizer’s own page. After helping, you can record the act and reflect in a private garden. The idea comes from a shared village horse anyone could use. The goal is a lifetime of service.

## What the avatars asked for

| Avatar | First reaction | Wants in order | Would stop if |
| --- | --- | --- | --- |
| Nia, first-time volunteer | “I can help with food distribution for 90 minutes on a Saturday morning. I need to know where to go.” | A task, start time, and duration. A place in York. An actual opening. | The only shift that fits is full. |
| Val, skills volunteer | “I can edit one bilingual handout from home. Show me an example and tell me how to send the edits.” | A named remote task and result. Sample materials and a 45-minute scope. Delivery instructions. | The route gives no delivery instructions. |
| Robin, direct giver | “I can give up to $25 or provide four reusable bags. I want to know what the organizer needs.” | A named organizer. A clear gift purpose or supply list. A working link for each option. | The organizer’s page is unavailable. |
| Ari, returning helper | “I’d use this to remember what I did and notice how it changes the choices I make.” | A private note and observation. A saved link that still works. A useful next task and a choice about sharing contact details. | Someone else can read the reflection. |
| Jamie, individual organizer | “I’d try posting one task a neighbor can finish. I have a link that confirms the task. I need to know how people can answer me.” | A person profile and a usable reply route. Specific review feedback and a way to withdraw. One account for organizing and helping. | Posting requires an organization website. |
| Devon, pantry coordinator | “I have one place on this pantry shift. My pantry page can handle replies. I want to confirm the work after the shift.” | One response queue that stays current. Clear shift facts. Fulfillment after the crew confirms the work. | The same shift requires two queues. |
| Casey, listing reviewer | “I’d try it if I could trace a request to its organizer and see what people are being asked to do.” | Check the organizer and response route. Read the latest request. Request a correction and review the new version. | The reviewer cannot verify the response route. |
| Tess, referral partner | “I want people to leave our session with one clear way to serve. I’d check the link before I share it.” | A current reviewed task. A fallback if it fills or expires. An organizer’s account of what people completed. | An old link leaves people without a useful next action. |

## Team discussion

- **Visitor and discovery review.** Keep keyword search and improve the links first, or also add one filter for the ways people can help. With the filter, a helper can choose Time, Skills, Supplies, or Funding directly.
- **Organizer and partner review.** Keep one organizer page for replies. A short field hint costs less than a new form or scheduling tool. The organizer must keep the outside page current.
- **Operations and review.** A single reviewed referral can test the pilot with the existing interface. It leaves other visitors to search by keyword. It also leaves reviewers to recover from a conflict with a browser reload.

## CEO decision

1. Add a **Ways to help** filter to List and Map. Give each response its own label and show the host from its link.
2. Explain the response page and private review field in the editor. Offer to refresh the review queue when a submission changes or leaves the queue.
3. Give closed and expired listings a clear route back to the board. After a private service save, link directly to the journal and board.

Defer signup, capacity, and scheduling within Public Horses. Keep the current required fields. Use the browser’s address for sharing.

## Retest gates

- Retest the eight avatars using the [16 starting cases](synthetic-user-cases-v1.0.json). Apply the new labels and links when checking the same goals.
- Compare List and Map results. Check the four response actions and their destinations. Check that proof stays private.
- Verify person and organization posts, a corrected review, a stale review, and fulfillment after simulated organizer confirmation.
- Verify the expired referral fallback and the private journal after a saved act. Repeat the feedback with each profile.
- Deploy to the protected preview. Use controlled data and response pages for the rehearsal. Keep the [live gate](../pilot-acceptance.md#gates) for release.
