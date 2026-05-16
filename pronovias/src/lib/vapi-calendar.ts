// ============================================================
// MAYLLER BRIDAL — Booking System
// lib/vapi-calendar.ts
// Google Calendar API integration via Service Account
// ============================================================

import { google } from 'googleapis';
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
 *   → Date object equal to 2026-05-20T14:00:00Z  (10 AM EDT = UTC-4)
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

  return available;
}

// ── Create Booking ────────────────────────────────────────────

export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  const calendar = getCalendarClient();
  const config = APPOINTMENT_CONFIG[req.appointmentType];
  const bookingId = randomUUID();

  const { hours, minutes } = parseTime(req.time);

  // Build event times in Eastern Time (correctly converted to UTC)
  const startDate = easternDate(req.date, hours, minutes);
  const endDate = new Date(startDate.getTime() + config.duration * 60_000);

  const descriptionLines = [
    `📋 ${config.label}`,
    `👤 ${req.customerName}`,
    `📱 ${req.customerPhone}`,
    req.customerEmail ? `📧 ${req.customerEmail}` : null,
    req.notes ? `📝 ${req.notes}` : null,
    ``,
    `🤖 Booked by: Sofia AI — ${STORE_NAME}`,
    `📞 Store: ${STORE_PHONE}`,
    `📍 ${STORE_ADDRESS}`,
    ``,
    `🔑 Booking ID: ${bookingId}`,
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
          customerName: req.customerName,
          customerPhone: req.customerPhone,
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
    customerPhone: req.customerPhone,
    customerEmail: req.customerEmail,
    date: req.date,
    time: formatTime(hours, minutes),
    appointmentType: req.appointmentType,
    label: config.label,
    duration: config.duration,
  };
}

// ── Cancel Booking ────────────────────────────────────────────

export async function cancelBookingById(bookingId: string): Promise<{
  success: boolean;
  customerName?: string;
  customerPhone?: string;
}> {
  const calendar = getCalendarClient();

  const events = await calendar.events.list({
    calendarId: calendarId(),
    privateExtendedProperty: [`bookingId=${bookingId}`],
    maxResults: 1,
    showDeleted: false,
  });

  const event = events.data.items?.[0];
  if (!event?.id) return { success: false };

  const props = event.extendedProperties?.private ?? {};

  await calendar.events.delete({
    calendarId: calendarId(),
    eventId: event.id,
  });

  return {
    success: true,
    customerName: props.customerName,
    customerPhone: props.customerPhone,
  };
}

// ── Get Booking Info ──────────────────────────────────────────

export async function getBookingById(bookingId: string) {
  const calendar = getCalendarClient();

  const events = await calendar.events.list({
    calendarId: calendarId(),
    privateExtendedProperty: [`bookingId=${bookingId}`],
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
