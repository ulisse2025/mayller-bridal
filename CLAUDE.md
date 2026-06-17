# CLAUDE.md — Mayller Bridal

This file is read automatically at the start of every Claude Code session. It is the
operating manual for this repository. Read it fully before changing anything.

> This is a **live system that takes real customer bookings and revenue.** A careless
> edit or a wrong assumption can drop appointments. Move fast, but follow the rules below.

---

## 1. What this is

- **Website**: Next.js (App Router + Turbopack), Node serverless on **Vercel**, live at
  https://mayllerbridal.com. The app lives in the repo subfolder **`pronovias/`**.
- **Repo**: `github.com/ulisse2025/mayller-bridal` (public). Branch **`main` auto-deploys
  to production.**
- **Sofia**: AI phone agent on **Vapi**. Calls the site endpoint `/api/vapi/tools` for
  availability / create / cancel / reschedule / voicemail / transfer.
- **Booking brain**: **Postgres** (Vercel/Neon) is the registry of record; **Google
  Calendar** (service account `mayllerbridalitalianstyle@gmail.com`) is the visible store.
  Site bookings go through `/api/book`; Sofia through `lib/vapi-calendar.ts`. Both write
  to Postgres **and** Calendar. A cron + webhook keep them synced.
- **Notifications**: email via Gmail SMTP; **SMS via Twilio** (REST, no SDK). SMS delivery
  is gated by an A2P 10DLC campaign (see Diagnostics).
- **Public phone**: +1 484-638-6555 (porting Nextiva → Twilio).

---

## 2. Golden rules — do not skip

1. **Never edit `main` blind.** Every change goes: branch → Pull Request → Vercel
   **preview** deploy → verify the preview → only then merge to `main`. The preview build
   catches TypeScript errors before they reach production.

2. **Do not trust the GitHub branch CDN for reading code — it is cached/stale.**
   `raw.githubusercontent.com/.../main/...` has served old versions and caused wrong
   patches. Always read the file **at the latest commit SHA**:
   `raw.githubusercontent.com/ulisse2025/mayller-bridal/<sha>/pronovias/...`. Get the
   current `main` SHA from the latest Vercel production deployment. When in doubt, open the
   file in the GitHub web editor (it always shows the true current content).

3. **Code is pasted, not typed.** Claude cannot push from its environment, and typing into
   GitHub's web editor corrupts code (Monaco auto-closes brackets/quotes). Workflow: Claude
   writes the **complete modified file**, Stefano does a single clipboard paste (Ctrl+A →
   paste) in the GitHub editor. Prefer full-file replace over find/replace.

4. **Verify on the preview, not just the build.** A green build only means it compiles. For
   UI/behavior changes, open the Vercel preview URL and exercise the real flow before
   giving the merge go-ahead.

5. **Side-effectful steps are Stefano's to click.** Claude prepares and guides; the human
   presses: PR merge (= prod deploy), any compliance attestation/submission (Twilio A2P has
   a vetting fee), number porting, anything that spends money or makes a legal attestation.

6. **All times are America/New_York (ET).** The store is in Pennsylvania. Never assume
   Europe/Rome or server-UTC; the codebase converts to ET deliberately.

7. **Booking rules live in TWO places — change both.** Sofia and the website each enforce
   hours/slots independently. Editing one without the other causes silent inconsistency.

---

## 3. Safe change workflow

1. **Confirm intent.** If the request is ambiguous in a way that changes the implementation
   (e.g. "Saturday until 2pm" = last *start* 2:00 PM vs must *end* by 2:00 PM), state the
   interpretation explicitly and proceed; the PR/preview lets Stefano correct before prod.
2. **Read the real current code** at the latest `main` SHA. Identify every file the change
   touches (booking rules usually span Sofia + website — see file map).
3. **Write the complete modified file(s)** for clipboard paste. Keep edits additive and
   defensive where possible.
4. **Guide the GitHub flow in the browser**: open the file's edit URL → Ctrl+A → paste →
   Commit to a **new branch** → create the **PR**. A committed branch is NOT an open PR;
   "Create PR" is a separate step. Verify the PR actually exists.
5. **Find the preview deploy** (Vercel, the deployment with `target: null` on the PR
   branch), confirm `state: READY`. If `ERROR`, read build logs and fix.
6. **Functionally verify the preview** for behavior changes.
7. **Merge** (Stefano clicks). Confirm the new production deploy reaches `READY` on
   mayllerbridal.com.
8. **Log the change** in `DESIGN_DECISIONS.md` and update `MAYLLER-SISTEMA-MASTER.md`.

If the mergeability spinner hangs while checks pass, that's a GitHub hiccup — refresh the
PR page and the Merge button activates.

---

## 4. File map (under `pronovias/src/`)

| File | Responsibility |
|------|----------------|
| `app/api/book/route.ts` | Website booking POST: validate → freebusy → Postgres reserveSlot → Calendar event → emails → SMS (if `smsConsent`) |
| `app/api/bookings/availability/route.ts` | Returns booked slots for the website calendar UI |
| `app/api/vapi/tools/route.ts` | Sofia's tool endpoint (check_availability, create/search/cancel/reschedule_booking, leave_message, end_call, get_current_datetime) |
| `lib/vapi-calendar.ts` | Sofia's calendar logic: getAvailableSlots, createBooking, search, cancel/reschedule. ~600 lines |
| `lib/booking-types.ts` | `BUSINESS_HOURS`, `APPOINTMENT_CONFIG`, store constants, helpers |
| `lib/bookings.ts` | Postgres helpers (reserveSlot, releaseSlot, getBookedSlots, move/delete by external ref) |
| `lib/notifications.ts` | Gmail email + Twilio SMS (private sendTwilioSMS + formatPhone) |
| `lib/calendar-mirror.ts`, `lib/google-calendar.ts` | Calendar sync + website calendar helpers |
| `components/ui/booking-calendar.tsx` | 3-step website booking form. Has its own hardcoded `SLOTS_BY_SERVICE`; the SMS consent checkbox lives here |
| `app/privacy/page.tsx`, `app/terms/page.tsx` | SMS privacy/terms pages (TCR requirement) |

---

## 5. Business rules (current)

- **Hours**: Mon–Sat 10:00–18:00 ET, Sunday closed, slots every 30 min.
  **Saturday: last start 2:00 PM.**
- **Appointment types**: Wedding Dress Consultation (90 min), Alteration (30 min), Tuxedo
  Fitting (60 min). Website form currently offers Wedding (90) + Alteration (30).
- **Store**: Mayller Bridal Italian Style LLC, 4054 W Penn Ave, Sinking Spring, PA 19608.
  Store phone (484) 760-0475. Sofia transfer-to-human: +1 (786) 675-9785.

To change hours/slots, edit `BUSINESS_HOURS`/slot logic in Sofia's `getAvailableSlots`
(and reschedule validation) **and** the website `booking-calendar.tsx` `SLOTS_BY_SERVICE`.

---

## 6. Diagnostics quick reference

**SMS don't arrive.** The code is almost certainly fine; the blocker is A2P 10DLC. Check
Twilio Console → Messaging → Regulatory Compliance: Brand must be **Registered** AND
Campaign must be **Approved**. A rejected/in-review campaign means US carriers block all
10DLC SMS regardless of code. Known rejection cause here: opt-in description + Privacy/Terms
URLs pointing at the homepage instead of real `/privacy` and `/terms` pages.

**Sofia can't find a site booking / sync issues.** Both paths write a universal record
(Postgres + Calendar `extendedProperties` with `shortBookingId`, `customerPhone`). Sofia
searches by phone/name/email/code and handles manually-created calendar events too. Check
the cron sync and the webhook (`/api/calendar/webhook`, `/api/calendar/watch`).

**Health check**: `/api/health?token=HEALTH_TOKEN` returns booleans only.

---

## 7. Secrets

Never hardcode secrets or print their values. All live in Vercel env vars (names only here):
`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFICATION_EMAIL`, `GOOGLE_CLIENT_EMAIL`,
`GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `POSTGRES_URL` (+ pooling variants),
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
`TWILIO_MESSAGING_SERVICE_SID` (optional), `CALENDAR_WEBHOOK_TOKEN`, `CRON_SECRET`,
`HEALTH_TOKEN`.

---

## 8. Conventions

- Timezone: **America/New_York** everywhere.
- Don't introduce new dependencies without a reason; the SMS path deliberately uses raw
  REST (fetch), not the Twilio SDK.
- Keep edits additive and reversible. Note rollback steps for risky changes.
- Source of truth per session: the workspace file `MAYLLER-SISTEMA-MASTER.md`. When it
  disagrees with this file, the master file wins (it's edited each session). After any
  change, update both the master file and `DESIGN_DECISIONS.md`.
