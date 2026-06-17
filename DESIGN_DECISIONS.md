# DESIGN_DECISIONS.md — Mayller Bridal

A running log of **why** the system is built the way it is. CLAUDE.md says *what* to do;
this file says *why*, so that context isn't lost between sessions and we don't re-litigate
settled choices or accidentally undo one.

**How to use this file**: append a new entry at the top for every non-trivial architectural
or behavioral decision. Never delete entries; if a decision is reversed, add a new entry
that supersedes the old one and reference it. Keep each entry short: decision, why, and the
consequence to watch for.

---

## Template

```
## YYYY-MM-DD — <short title>
**Decision**: what we chose.
**Why**: the reasoning / the problem it solves.
**Consequence**: what this means for future changes (the trap to avoid).
**Supersedes**: (optional) link to the entry this replaces.
```

---

## Standing decisions (the architecture as it stands today)

## Postgres is the registry of record; Google Calendar is the visible mirror
**Decision**: every booking is written to **both** Postgres and Google Calendar. Postgres
is authoritative; Calendar is the human-readable view the store actually looks at.
**Why**: the store needs to see appointments in a normal calendar, but a calendar alone is
not a reliable transactional store (no real locking, race conditions on double-booking).
Postgres gives atomic slot reservation; Calendar gives visibility.
**Consequence**: any write path must update both, and the cron + webhook
(`/api/calendar/webhook`, `/api/calendar/watch`) exist to reconcile them. A booking written
to only one store is a bug. Sofia also reads manually-created calendar events, so don't
assume every event originated from code.

## Booking rules are enforced in two independent places (Sofia + website)
**Decision**: hours and slot logic live separately in Sofia (`lib/vapi-calendar.ts`,
validated in `/api/vapi/tools/route.ts`) and the website
(`components/ui/booking-calendar.tsx` `SLOTS_BY_SERVICE`, `/api/book/route.ts`).
**Why**: the two entry points (phone agent vs web form) evolved independently and each
needs to validate on its own; a customer can't be trusted to hit only one path.
**Consequence**: this is the single biggest source of silent bugs. **Any hours/slot change
must touch both.** Changing only one makes the phone and the website disagree, which is hard
to notice until a customer books a slot the other path forbids.

## SMS uses raw Twilio REST, not the SDK
**Decision**: `lib/notifications.ts` calls the Twilio REST API directly via `fetch`.
**Why**: keeps the dependency surface small on Vercel serverless, avoids SDK cold-start and
version churn for what is a handful of POST calls.
**Consequence**: don't "modernize" this by adding the Twilio SDK without a real reason. If
`TWILIO_MESSAGING_SERVICE_SID` is set, send via the Messaging Service; otherwise via the
direct `TWILIO_PHONE_NUMBER`.

## SMS delivery is gated by A2P 10DLC, not by the code
**Decision**: treat "SMS not arriving" as a compliance/registration problem first, code
second.
**Why**: US carriers block/filter all 10DLC SMS until the TCR Brand is Registered and the
Campaign is Approved, regardless of whether the code is perfect. We lost time here assuming
a code bug. The known rejection cause was opt-in description + Privacy/Terms pointing at the
homepage instead of real `/privacy` and `/terms` pages.
**Consequence**: real `/privacy` and `/terms` pages and the website consent checkbox are
**compliance infrastructure**, not optional UI. Don't remove or weaken them.

## Everything runs in America/New_York time
**Decision**: all date/time logic converts to ET explicitly.
**Why**: the store is in Pennsylvania; the operator (Stefano) thinks partly in Italian/CET
and the servers run UTC. Leaving timezone implicit produced off-by-hours slot bugs.
**Consequence**: never introduce a naive `new Date()` comparison without ET conversion.
Test slot boundaries (especially Saturday's 2:00 PM last start) in ET.

## main auto-deploys; all change goes through preview first
**Decision**: `main` → production on Vercel automatically. Changes go branch → PR →
preview → verify → merge.
**Why**: the site takes real bookings; a broken deploy drops revenue. The preview build is
the cheap safety net that catches TypeScript errors before prod.
**Consequence**: never commit directly to `main`. A green build ≠ verified behavior; UI
changes get exercised on the preview URL before merge.

## Read source at a pinned commit SHA, never the branch CDN
**Decision**: read files at `.../<sha>/...`, not `.../main/...`.
**Why**: `raw.githubusercontent.com` on the branch path served stale cached content more
than once and caused patches against the wrong version of a file.
**Consequence**: get the live `main` SHA from the latest Vercel production deploy before
reading code to patch. When unsure, the GitHub web editor shows the true current file.

---

<!-- Add new dated entries above this line, newest first. -->
