# Public Horses agent team

The [mission](mission.md) guides every role. The CEO sets the pilot scope. The COO coordinates work and keeps its record. Bob controls decisions that need his authority.

| Role and record key | Deliverable | Reviewers for both stages |
| --- | --- | --- |
| [Delegated CEO](ceo-persona.md) `delegated-ceo` | Pilot brief, priorities, and decisions for Bob | Readiness and Evidence |
| [COO and Operations](agents/coo.md) `coo` | Pilot runbook, role assignments, handoffs, and holds | Readiness and Evidence |
| [CTO](agents/cto.md) `cto` | Technical decisions, acceptance checks, and recovery plan | Readiness and Evidence |
| [Engineer](agents/engineer.md) `engineer` | Implementation plan and test evidence | Readiness and Evidence |
| [Organizer Success](agents/organizer-success.md) `organizer-success` | Organizer brief, listing packet, and update plan | Readiness and Evidence |
| [CMO and Community Outreach](agents/community-outreach.md) `community-outreach` | Invitation, distribution test, and release packet | Readiness, Evidence, and Creative Director |
| [Community Partnerships](agents/partnerships.md) `partnerships` | Confirmed requests, partner scope, and support links | Readiness and Evidence |
| [Impact and Learning](agents/impact-and-learning.md) `impact-and-learning` | Counting rules, pilot results, and next test | Readiness and Evidence |
| [Readiness Reviewer](agents/readiness-reviewer.md) `readiness-reviewer` | Usability and workflow review decisions | Evidence |
| [Evidence Reviewer](agents/evidence-reviewer.md) `evidence-reviewer` | Source, permission, and privacy review decisions | Readiness |
| [Creative Director](agents/creative-director.md) `creative-director` | Review decisions on copy, screens, and artwork | Readiness and Evidence |

## Review process

1. **Document, review, and revise.** Record the participant need, source, work steps, expected result, and next owner. Give the document a version. Each assigned reviewer checks that version and records a pass or hold. Revise and get approval on the new version before testing.
2. **Test, review, and revise.** Run one normal case and one exception with fictional users. Record expected and observed results on a separate, versioned test record. Link the tested document. Reviewers check the evidence. Fix failures and rerun affected cases. Send a changed document through stage 1 again.

Assign a different reviewer for each required review. Give authors and reviewers distinct IDs. Preserve earlier versions and decisions. For a hold, record the reason, next owner, and next check. Continue independent work while the owner resolves it.

The app’s listing reviewer acts on a submitted listing. The team’s Readiness and Evidence Reviewers check work against this guide. Use separate test accounts for the organizer and the app reviewer. [Listing workflow](../README.md#how-the-marketplace-works)

## Handoffs

| From | To | Evidence to hand over |
| --- | --- | --- |
| CEO | COO | Pilot scope, finish conditions, and decisions that need Bob |
| Partnerships | Organizer Success | Confirmed request, official help route, and partner permission |
| Organizer Success | App reviewer | Exact listing and profile versions, source, end date, and image permission when used |
| Organizer Success | COO and Community Outreach | Approved listing readback, support link, and next date to confirm the need |
| Community Outreach | COO and CEO | Reviewed copy, audience, channel, listing version, and authorization for any live send |
| CTO | Engineer and COO | Technical decision, acceptance checks, and recovery steps |
| Engineer | COO and reviewers | Build or commit, environment, checks, and observed results |
| Impact and Learning | CEO, COO, and Partnerships | Results with their sources, open questions, and next test |
| Reviewers | Work owner and COO | Decision on the exact version, evidence, and owner of any hold |

The receiver confirms the version they can use. The COO closes the handoff after receipt and required reviews. Check dependent work again if a source, destination link, or approved version changes.

### Technical review

Bring changes to identity, permissions, privacy, storage, outside services, or retry behavior to the CTO. For high-risk changes, the COO assigns a qualified reviewer to check the plan and test evidence. The reviewer works independently of the author. If the CTO shaped the decision, assign a different reviewer. Record the technical review in the private pilot record alongside the standard reviews.

## First private rehearsal

1. The COO opens a record for a fictional pantry. Use the [local demo](../README.md#run-the-demo) or a protected preview. Use sample accounts and simulate outside actions.
2. The organizer drafts a Nourishment request. A separate app reviewer requests a correction, then approves the exact revised listing. Check that the public listing shows the approved profile and request.
3. A guest finds the listing and opens the sample organizer link. A member records help, chooses an intention, and receives one private seed. Check that a retry adds one seed in total.
4. Check that an expired request leaves the directory. Try to approve a superseded submission and verify that the current submission stays under review. Check that a different member has access only to their own garden.
5. Capture each role’s cases and reviews. Read back the listing and garden results. Log holds with owners. The CEO brings any proposed live pilot to Bob with the results.

## Check the rehearsal record

Store the JSON record in the private pilot folder, outside the tracked files. Use `.data/` for a local rehearsal. Link evidence to its source without copying participant data.

- Set `version` to `1` and `mode` to `testing`. Use a unique `rehearsalId` and a `handoffs` object keyed by the role IDs above.
- Set each handoff’s `preparedBy` to its author ID. Add `documentation` and `synthetic` stages. Each has a distinct `artifact` reference with a version or fingerprint and a `reviews` object.
- On `synthetic`, set `documentation` to the exact document reference tested. Add `cases` with a unique `id`, fictional `user`, `kind` of `normal` or `exception`, `expected`, `observed`, and `result` of `pass` or `fail`.
- Key `reviews` by the assigned reviewer roles. Use `readiness-reviewer`, `evidence-reviewer`, or `creative-director`. Each review needs `reviewedBy`, the stage’s `artifact`, `evidence`, and a `decision` of `pass` or `hold`. A hold also needs `reason` and `nextOwner` with a team role ID.

```sh
npm run team:check -- .data/pilot-rehearsal.json
```

The checker returns `0` when the recorded handoffs pass, `2` when they have holds, and `1` for an invalid record. It checks references and reviewer independence. The COO checks what the evidence proves, then records the rehearsal result.

Keep the pilot ID, role, person or agent, date, exact version, evidence, and decision for each edit, review, or approval. Keep the earlier record when an artifact changes.

## Sources

The team uses the role briefs and two review stages from [Fast for Hunger](https://github.com/BobConscious/fastforhunger/blob/462a54d/docs/agent-team.md). The [Public Horses pilot](../README.md) supplies the roles’ work and test cases.
