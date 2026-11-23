# Service board pilot acceptance

The first rehearsal follows one specific act of service. A fictional pantry asks for help sorting donations. A supporter responds through a controlled link. The organizer marks the request fulfilled. The supporter records the act and reflects on it privately after the post closes.

## Scope

- Reuse person and organization profiles, listing review, and direct links to organizers. Give new posts an optional field for what counts as complete. Keep current listings usable.
- Let an organizer mark the whole request fulfilled. Keep the closed status and record when the organizer confirmed fulfillment. General closure and expiry remain available.
- Give members a way to record past service on a previously published listing. Keep new offers closed. Preserve the retry behavior that saves one seed for the same request.
- Show three prompts across the service record and journal. Ask what the member wants to cultivate, what they did, and what they noticed later. Save the later observation separately. Keep every reflection private.
- Explain the shared village horse and lifelong service on the home and About pages. Make both board actions easy to find.
- Rehearse with a file-backed database and project-specific test sign-in. Verify restart and restore. Use a disposable database and fictional accounts.

## Gates

| Gate | Owner | Evidence to pass |
| --- | --- | --- |
| Plan | COO | Readiness and Evidence approve the exact plan. They check the normal and exception cases and how the team will verify them. |
| Post and fulfill | Organizer Success and Engineering | A guest finds the reviewed request on a phone. They see its task, schedule, place, what counts as complete, and how to respond. A different reviewer approves the listing. Only its organizer can mark it fulfilled. |
| Close and record | Engineering | Fulfillment removes the listing from discovery and removes the response action and link from Public Horses. A member who already helped can record the act at its direct URL. A retry saves a single seed. Drafts stay unavailable for service records. |
| Reflect | Impact and Learning | A member can return to the original act and intention. They can add, read, edit, or clear an optional later observation. Other accounts and the public view have no access to it. |
| Board and story | Creative Director | The home page shows both board actions at phone width and with a keyboard. About connects the board and garden to the shared village horse and lifelong service. |
| Sign-in and recovery | CTO | A test account can sign out and return to its records. Approved listings, fulfillment, and private reflections survive a restart. A backup restores the same records into a separate database. A database from the prior version keeps its existing listing, seed, and private note. |
| Evidence review | COO | Readiness and Evidence review the exact tested build and results. A hold records the owner, reason, and next check. |
| Live pilot | CEO | Confirm the approved host, external sign-in and recovery there, organizer consent, and a current request with a verified link. Bob authorizes the release. The organizer confirms any real result reported after release. |

## Rehearsal cases

1. **Normal.** Post, return for a correction, approve, discover, and fulfill the pantry request. Record the act after closure. Add an observation after returning to the garden.
2. **Exception.** Test a stale review and fulfillment, an attempt to close another account's listing, and a draft service record. Retry the same save. Try to read or edit another account's reflection. Verify ordinary closure and expiry leave the organizer confirmation empty. Record past service on a previously published, expired post.
3. **Recovery.** Stop and restart the app with the same database. Restore a backup into a new file. Sign back in and check the same listing, fulfillment, and private observation.
4. **Previous data.** Open a pre-change database and check a listing, a seed, and its private note. Preserve the prior status of a closed listing and leave its organizer confirmation empty.

Use a controlled response page in the private test. Record simulated organizer confirmation as test evidence. Keep real confirmation and partner consent in the private pilot record for the live gate. [Team review process](agent-team.md#review-process)
