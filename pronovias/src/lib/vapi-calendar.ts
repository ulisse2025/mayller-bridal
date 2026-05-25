// ============================================================
// MAYLLER BRIDAL — Booking System
// lib/vapi-calendar.ts
// Google Calendar API integration via Service Account
// ============================================================

import { google } from 'googleapis';
import { deleteBookingByExternalEventId, moveBookingByExternalEventId } from '@/lib/bookings';
import { randomUUID } from 'crypto';
import {
  AppointmentType,
  APPOINTMENT_CONFIG,
  BUSINESS_HOURS,
  BookingRequest,
  BookingResult,
  parseTime,
  formatTime,
  STORE_NAME,
  STORE_PHONE,
  STORE_ADDRESS,
} from './booking-types';

// ── Timezone Helper ───────────────────────────────────────────

/**
 * Build a Date that represents a specific local time in America/New_York.
 * Vercel servers run in UTC, so new Date(year, month, day, hour) is UTC,
 * not Eastern — this function compensates for that.
 *
 * Example: easternDate('2026-05-20', 10, 0)
 *   → Date object equal to 2026-05-20T14:00:00Z (10 AM EDT = UTC-4)
 */
function easternDate(dateStr: string, hour: number, minute: number = 0): Date {
  const [y, m, d] = dateStr.split('-').map(Number);

  // Construct a naive UTC timestamp at the requested hour
  const naive = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));

  // Ask Intl what hour that UTC moment maps to in New York
  const nyHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(naive),
    10
  );

  // nyHour is what NY clock shows when UTC is 'hour'
  // To make NY show 'hour', shift UTC by (nyHour - hour)
  const offsetMs = (nyHour - hour) * 3_600_000;
  return new Date(naive.getTime() - offsetMs);
}

/**
 * Returns today's date string (YYYY-MM-DD) in America/New_York timezone.
 */
function todayInNY(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date()); // en-CA gives YYYY-MM-DD format
}

// ── Auth & Client ─────────────────────────────────────────────

function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      // Vercel stores multiline secrets with literal \n — fix here
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

const calendarId = () => process.env.GOOGLE_CALENDAR_ID!;

// ── Phone Normalization ───────────────────────────────────────

/**
 * Normalize a US phone number to E.164 (+1XXXXXXXXXX).
 * Handles formats like "(215) 555-1234", "215-555-1234", "+1 215 555 1234".
 * Returns null if it cannot be parsed.
 */
function normalizePhoneUS(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return null;
}

/**
 * Loose comparison: do these two phone strings represent the same number
 * after stripping all formatting?
 */
function phonesMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizePhoneUS(a);
  const nb = normalizePhoneUS(b);
  if (!na || !nb) return false;
  // Compare last 10 digits — robust against country code variations
  return na.slice(-10) === nb.slice(-10);
}

// ── Check Availability ────────────────────────────────────────

/**
 * Returns available time slot strings ("10:00 AM", "10:30 AM", ...)
 * for the given date and appointment type.
 */
export async function getAvailableSlots(
  date: string,
  appointmentType: AppointmentType
): Promise<string[]> {
  const config = APPOINTMENT_CONFIG[appointmentType];
  const [year, month, day] = date.split('-').map(Number);

  // Validate: open day?
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0=Sun
  if (!BUSINESS_HOURS.openDays.includes(dayOfWeek as (typeof BUSINESS_HOURS.openDays)[number])) {
    return [];
  }

  // Validate: not in the past (compare date strings in NY timezone)
  if (date < todayInNY()) return [];

  // Build time window in Eastern Time (correctly converted to UTC)
  const timeMin = easternDate(date, BUSINESS_HOURS.start);
  const timeMax = easternDate(date, BUSINESS_HOURS.end);

  // Fetch busy times from Google Calendar
  const calendar = getCalendarClient();
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: BUSINESS_HOURS.timezone,
      items: [{ id: calendarId() }],
    },
  });

  const busy = freeBusy.data.calendars?.[calendarId()]?.busy ?? [];

  // Generate all possible slots — also using Eastern Time
  const available: string[] = [];
  let currentMin = BUSINESS_HOURS.start * 60; // minutes since midnight ET
  const endMin = BUSINESS_HOURS.end * 60;

  while (currentMin + config.duration <= endMin) {
    const slotHour = Math.floor(currentMin / 60);
    const slotMinute = currentMin % 60;

    // Build slot start/end in Eastern Time (correctly converted to UTC)
    const slotStart = easternDate(date, slotHour, slotMinute);
    const slotEnd = new Date(slotStart.getTime() + config.duration * 60_000);

    const overlaps = busy.some(b => {
      const bs = new Date(b.start!);
      const be = new Date(b.end!);
      return slotStart < be && slotEnd > bs;
    });

    if (!overlaps) {
      available.push(formatTime(slotHour, slotMinute));
    }

    currentMin += BUSINESS_HOURS.slotIncrement;
  }

  // Filter out past time slots when checking today's availability
  const todayStr = todayInNY();
  if (date === todayStr) {
    const nowParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const etHour = parseInt(nowParts.find((p: Intl.DateTimeFormatPart) => p.type === 'hour')?.value ?? '0', 10);
    const etMin = parseInt(nowParts.find((p: Intl.DateTimeFormatPart) => p.type === 'minute')?.value ?? '0', 10);
    const nowMinutes = etHour * 60 + etMin + 60; // 60-min advance booking buffer
    return available.filter(slot => {
      const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return false;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m >= nowMinutes;
    });
  }
  return available;
}

// ── Create Booking ───────────────────────────────────────────

export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  const calendar = getCalendarClient();
  const config = APPOINTMENT_CONFIG[req.appointmentType];
  const bookingId = randomUUID();
  // FIX: short ID for customer-facing cancel/reschedule
  const shortBookingId = bookingId.slice(0, 8).toUpperCase();

  const { hours, minutes } = parseTime(req.time);

  // Build event times in Eastern Time (correctly converted to UTC)
  const startDate = easternDate(req.date, hours, minutes);
  const endDate = new Date(startDate.getTime() + config.duration * 60_000);

  // Normalize phone before storing
  const normalizedPhone = normalizePhoneUS(req.customerPhone) ?? req.customerPhone;

  const descriptionLines = [
    `📋 ${config.label}`,
    `👤 ${req.customerName}`,
    `📱 ${normalizedPhone}`,
    req.customerEmail ? `📧 ${req.customerEmail}` : null,
    req.notes ? `📝 ${req.notes}` : null,
    ``,
    `🤖 Booked by: Sofia AI — ${STORE_NAME}`,
    `📞 Store: ${STORE_PHONE}`,
    `📍 ${STORE_ADDRESS}`,
    ``,
    `🔑 Booking ID: ${bookingId}`,
    `🆔 Short Code: ${shortBookingId}`,
  ].filter((l): l is string => l !== null);

  await calendar.events.insert({
    calendarId: calendarId(),
    requestBody: {
      summary: `${config.label} — ${req.customerName}`,
      description: descriptionLines.join('\n'),
      colorId: config.colorId,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: BUSINESS_HOURS.timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: BUSINESS_HOURS.timezone,
      },
      extendedProperties: {
        private: {
          bookingId,
          shortBookingId,
          customerName: req.customerName,
          customerPhone: normalizedPhone,
          customerEmail: req.customerEmail ?? '',
          appointmentType: req.appointmentType,
          notes: req.notes ?? '',
          source: 'sofia-ai',
        },
      },
    },
  });

  return {
    bookingId,
    customerName: req.customerName,
    customerPhone: normalizedPhone,
    customerEmail: req.customerEmail,
    date: req.date,
    time: formatTime(hours, minutes),
    appointmentType: req.appointmentType,
    label: config.label,
    duration: config.duration,
  };
}

// ── Search Bookings ───────────────────────────────────────────

/**
 * Result of a booking search. Includes everything needed to identify
 * the booking to the customer and to act on it (cancel/reschedule).
 */
export interface BookingSearchResult {
  shortBookingId: string;
  googleEventId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentType: string;
  appointmentLabel: string;
  startDateTime: string;   // ISO
  startDateLocal: string;  // YYYY-MM-DD in ET
  startTimeLocal: string;  // "2:30 PM" in ET
  source: string;          // 'sofia-ai' | 'web' | etc.
  notes: string;
}

export interface BookingSearchQuery {
  phone?: string;
  email?: string;
  name?: string;
  shortBookingId?: string;
  /** YYYY-MM-DD (inclusive). Defaults to today. */
  dateFrom?: string;
  /** YYYY-MM-DD (inclusive). Defaults to today + 180 days. */
  dateTo?: string;
  /** Only return future appointments (default true). */
  futureOnly?: boolean;
}

function formatLocalDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(d);
}

function formatLocalTime(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Search for bookings in Google Calendar.
 *
 * Strategy:
 *  - If shortBookingId is provided, use extendedProperty lookup (fastest, exact).
 *  - Otherwise list events in the date window and filter in-memory by
 *    phone (primary), then email, then name (fuzzy contains).
 *
 * Handles BOTH web-originated and Sofia-originated events because both
 * paths now write customerPhone, customerEmail, customerName into
 * extendedProperties.private.
 */
export async function searchBookings(query: BookingSearchQuery): Promise<BookingSearchResult[]> {
  const calendar = getCalendarClient();

  // Fast path: exact shortBookingId lookup
  if (query.shortBookingId) {
    const code = query.shortBookingId.trim().toUpperCase();
    const res = await calendar.events.list({
      calendarId: calendarId(),
      privateExtendedProperty: [`shortBookingId=${code}`],
      maxResults: 5,
      showDeleted: false,
      singleEvents: true,
    });
    return (res.data.items ?? []).map(toSearchResult).filter(Boolean) as BookingSearchResult[];
  }

  // Generic search: list events in window, then filter
  const today = todayInNY();
  const dateFrom = query.dateFrom ?? today;
  const dateTo = query.dateTo ?? (() => {
    const t = new Date();
    t.setDate(t.getDate() + 180);
    return formatLocalDate(t);
  })();

  const timeMin = easternDate(dateFrom, 0, 0).toISOString();
  const timeMax = easternDate(dateTo, 23, 59).toISOString();

  // If we have a phone, try the indexed extendedProperty lookup first
  // (much cheaper than listing 100+ events).
  const normalizedPhone = normalizePhoneUS(query.phone);
  if (normalizedPhone) {
    try {
      const res = await calendar.events.list({
        calendarId: calendarId(),
        privateExtendedProperty: [`customerPhone=${normalizedPhone}`],
        timeMin,
        timeMax,
        maxResults: 25,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const hits = (res.data.items ?? []).map(toSearchResult).filter(Boolean) as BookingSearchResult[];
      if (hits.length > 0) return hits;
    } catch (e) {
      console.warn('[searchBookings] indexed phone lookup failed, falling back:', String(e));
    }
  }

  // Fallback: full list + in-memory filter
  // (also covers events that were created before phone normalization)
  const listRes = await calendar.events.list({
    calendarId: calendarId(),
    timeMin,
    timeMax,
    maxResults: 250,
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const all = (listRes.data.items ?? []).map(toSearchResult).filter(Boolean) as BookingSearchResult[];

  return all.filter(ev => {
    if (query.phone && !phonesMatch(ev.customerPhone, query.phone)) return false;
    if (query.email && (ev.customerEmail || '').toLowerCase() !== query.email.toLowerCase()) return false;
    if (query.name) {
      const needle = query.name.toLowerCase().trim();
      const hay = (ev.customerName || '').toLowerCase();
      if (!hay.includes(needle)) {
        // also try matching any single word of the query against the name
        const words = needle.split(/\s+/).filter(Boolean);
        if (!words.some(w => hay.includes(w))) return false;
      }
    }
    return true;
  });
}

/**
 * Convert a Google Calendar event into our BookingSearchResult shape.
 * Returns null if the event is missing critical fields.
 */
type CalendarEvent = {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  extendedProperties?: { private?: Record<string, string> } | null;
};

function toSearchResult(ev: CalendarEvent): BookingSearchResult | null {
  if (!ev.id) return null;
  const props = ev.extendedProperties?.private ?? {};
  const startISO = ev.start?.dateTime ?? ev.start?.date ?? null;
  if (!startISO) return null;

  // shortBookingId resolution, in order of preference:
  //   1. props.shortBookingId  (set by Sofia or by /api/book)
  //   2. props.bookingId.slice(0,8) (older bookings without explicit shortBookingId)
  //   3. regex in description ("Short Code: XXXXXXXX" or "Booking ID: ...")
  //   4. derived from the Google Calendar event.id itself (manual events)
  let shortId = props.shortBookingId;
  if (!shortId && props.bookingId) {
    shortId = props.bookingId.slice(0, 8).toUpperCase();
  }
  if (!shortId) {
    const desc = ev.description || '';
    const m = desc.match(/Short Code:\s*([A-Z0-9]{8})/i) ||
              desc.match(/Booking ID:\s*([a-f0-9-]+)/i);
    if (m) shortId = m[1].slice(0, 8).toUpperCase();
  }
  if (!shortId) {
    // Manual event created directly on Google Calendar - derive an ID
    // from the event.id so the row is still surfaced to Sofia.
    // cancelBookingById / rescheduleBookingById know how to resolve this
    // back to the original event via the same derivation.
    shortId = ev.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  }

  const startDate = new Date(startISO);
  const appointmentType = props.appointmentType || 'wedding_consultation';
  const config = APPOINTMENT_CONFIG[appointmentType as AppointmentType] ?? APPOINTMENT_CONFIG.wedding_consultation;

  // Phone fallback: scrape from description ("Phone: ...") for manual events.
  let phoneFallback = props.customerPhone || '';
  if (!phoneFallback) {
    const desc = ev.description || '';
    const phoneMatch = desc.match(/(?:Phone|Tel|Telephone|Cell|Mobile)[:\s]+([+\d\s\-().]+)/i);
    if (phoneMatch) phoneFallback = phoneMatch[1].trim();
  }

  // Name fallback: try summary tail, then attendee, then "Unknown"
  let nameFallback = props.customerName;
  if (!nameFallback) {
    nameFallback = (ev.summary?.split('—').pop() || '').trim();
  }
  if (!nameFallback) nameFallback = 'Unknown';

  return {
    shortBookingId: shortId,
    googleEventId: ev.id,
    customerName: nameFallback,
    customerPhone: phoneFallback,
    customerEmail: props.customerEmail || '',
    appointmentType,
    appointmentLabel: config.label,
    startDateTime: startDate.toISOString(),
    startDateLocal: formatLocalDate(startDate),
    startTimeLocal: formatLocalTime(startDate),
    source: props.source || 'unknown',
    notes: props.notes || '',
  };
}

// ── Cancel Booking ────────────────────────────────────────────

export async function cancelBookingById(bookingId: string): Promise<{
  success: boolean;
  customerName?: string;
  customerPhone?: string;
}> {
  const calendar = getCalendarClient();
  const shortId = bookingId.slice(0, 8).toUpperCase();

  // Path 1: lookup by shortBookingId in extendedProperties (Sofia/web bookings)
  const events = await calendar.events.list({
    calendarId: calendarId(),
    privateExtendedProperty: [`shortBookingId=${shortId}`],
    maxResults: 1,
    showDeleted: false,
  });

  let event = events.data.items?.[0];

  // Path 2 fallback: shortId may have been derived from event.id by toSearchResult
  // (for manual events with no extendedProperties). Scan upcoming events and
  // match by derived shortId.
  if (!event?.id) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const listRes = await calendar.events.list({
      calendarId: calendarId(),
      timeMin: now.toISOString(),
      timeMax: horizon.toISOString(),
      maxResults: 250,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });
    event = (listRes.data.items ?? []).find(ev => {
      if (!ev.id) return false;
      const derived = ev.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
      return derived === shortId;
    });
  }

  if (!event?.id) return { success: false };

  const props = event.extendedProperties?.private ?? {};

  await calendar.events.delete({
    calendarId: calendarId(),
    eventId: event.id,
  });

  // Mirror the cancellation in Postgres so the website slot is freed immediately.
  // Without this the slot stays "booked" until the next 5-min cron sweep.
  try {
    await deleteBookingByExternalEventId(event.id);
  } catch (err) {
    console.error('[cancelBookingById] DB delete failed (will be reconciled by cron):', err);
  }

  return {
    success: true,
    customerName: props.customerName,
    customerPhone: props.customerPhone,
  };
}

// ── Reschedule Booking ────────────────────────────────────────

/**
 * Move an existing booking to a new date/time.
 * Keeps the same Google Calendar event (and the same shortBookingId),
 * just updates start/end. Validates that the new slot is free.
 */
export async function rescheduleBookingById(
  shortBookingIdRaw: string,
  newDate: string,
  newTime: string,
): Promise<{
  success: boolean;
  reason?: 'not-found' | 'slot-busy' | 'invalid-time' | 'error';
  customerName?: string;
  customerPhone?: string;
  previousStart?: string;
  newStart?: string;
  appointmentType?: AppointmentType;
}> {
  const calendar = getCalendarClient();
  const shortId = shortBookingIdRaw.slice(0, 8).toUpperCase();

  // 1. Find the event (path 1: extendedProperties lookup)
  const list = await calendar.events.list({
    calendarId: calendarId(),
    privateExtendedProperty: [`shortBookingId=${shortId}`],
    maxResults: 1,
    showDeleted: false,
    singleEvents: true,
  });
  let event = list.data.items?.[0];

  // Path 2 fallback: derived shortId from event.id (manual calendar events)
  if (!event?.id) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const scan = await calendar.events.list({
      calendarId: calendarId(),
      timeMin: now.toISOString(),
      timeMax: horizon.toISOString(),
      maxResults: 250,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });
    event = (scan.data.items ?? []).find(ev => {
      if (!ev.id) return false;
      const derived = ev.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
      return derived === shortId;
    });
  }

  if (!event?.id) return { success: false, reason: 'not-found' };

  const props = event.extendedProperties?.private ?? {};
  const apptType: AppointmentType =
    (props.appointmentType as AppointmentType) || 'wedding_consultation';
  const config = APPOINTMENT_CONFIG[apptType] ?? APPOINTMENT_CONFIG.wedding_consultation;

  // 2. Parse new time
  let parsed;
  try {
    parsed = parseTime(newTime);
  } catch {
    return { success: false, reason: 'invalid-time' };
  }
  if (parsed.hours < BUSINESS_HOURS.start || parsed.hours >= BUSINESS_HOURS.end) {
    return { success: false, reason: 'invalid-time' };
  }

  const newStart = easternDate(newDate, parsed.hours, parsed.minutes);
  const newEnd = new Date(newStart.getTime() + config.duration * 60_000);

  // 3. Verify the new slot is free (excluding THIS event)
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: newStart.toISOString(),
      timeMax: newEnd.toISOString(),
      timeZone: BUSINESS_HOURS.timezone,
      items: [{ id: calendarId() }],
    },
  });
  const busy = freeBusy.data.calendars?.[calendarId()]?.busy ?? [];

  // Filter out the current event itself (it will appear as busy on its old slot,
  // but we only care about other events at the NEW slot)
  const conflicts = busy.filter(b => {
    const bs = new Date(b.start!);
    const be = new Date(b.end!);
    // Overlap check at the NEW slot
    return bs < newEnd && be > newStart;
  });

  // If there's exactly one conflict and it matches this event's old time, ignore.
  // Easier: compare each conflict's start/end with the current event's start/end.
  const currentStartISO = event.start?.dateTime;
  const currentEndISO = event.end?.dateTime;
  const realConflicts = conflicts.filter(b => !(b.start === currentStartISO && b.end === currentEndISO));
  if (realConflicts.length > 0) {
    return { success: false, reason: 'slot-busy' };
  }

  // 4. Patch the event
  try {
    const updated = await calendar.events.patch({
      calendarId: calendarId(),
      eventId: event.id,
      requestBody: {
        start: { dateTime: newStart.toISOString(), timeZone: BUSINESS_HOURS.timezone },
        end:   { dateTime: newEnd.toISOString(),   timeZone: BUSINESS_HOURS.timezone },
      },
    });

    // Mirror the move in Postgres so the website availability calendar reflects
    // the change immediately (no 5 min cron wait, and no orphan row left at the
    // old time which would otherwise keep that slot marked as booked).
    try {
      const newSlotTime = formatTime(parsed.hours, parsed.minutes);
      await moveBookingByExternalEventId(event.id, newDate, newSlotTime);
    } catch (err) {
      console.error('[rescheduleBookingById] DB move failed (will be reconciled by cron):', err);
    }

    return {
      success: true,
      customerName: props.customerName,
      customerPhone: props.customerPhone,
      previousStart: currentStartISO || undefined,
      newStart: updated.data.start?.dateTime || newStart.toISOString(),
      appointmentType: apptType,
    };
  } catch (err) {
    console.error('[rescheduleBookingById] patch failed:', String(err));
    return { success: false, reason: 'error' };
  }
}

// ── Get Booking Info ──────────────────────────────────────────

export async function getBookingById(bookingId: string) {
  const calendar = getCalendarClient();

  // FIX: search by shortBookingId
  const shortId = bookingId.slice(0, 8).toUpperCase();
  const events = await calendar.events.list({
    calendarId: calendarId(),
    privateExtendedProperty: [`shortBookingId=${shortId}`],
    maxResults: 1,
    showDeleted: false,
  });

  const event = events.data.items?.[0];
  if (!event) return null;

  return {
    googleEventId: event.id,
    summary: event.summary,
    start: event.start?.dateTime,
    end: event.end?.dateTime,
    props: event.extendedProperties?.private ?? {},
  };
}
