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

  // Validate: not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) return [];

  // Build time window
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeMin = new Date(`${date}T${pad(BUSINESS_HOURS.start)}:00:00`);
  const timeMax = new Date(`${date}T${pad(BUSINESS_HOURS.end)}:00:00`);

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

  // Generate all possible slots
  const available: string[] = [];
  let currentMin = BUSINESS_HOURS.start * 60; // minutes since midnight
  const endMin = BUSINESS_HOURS.end * 60;

  while (currentMin + config.duration <= endMin) {
    const slotStart = new Date(year, month - 1, day,
      Math.floor(currentMin / 60), currentMin % 60, 0);
    const slotEnd = new Date(slotStart.getTime() + config.duration * 60_000);

    const overlaps = busy.some(b => {
      const bs = new Date(b.start!);
      const be = new Date(b.end!);
      return slotStart < be && slotEnd > bs;
    });

    if (!overlaps) {
      available.push(formatTime(Math.floor(currentMin / 60), currentMin % 60));
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
  const [year, month, day] = req.date.split('-').map(Number);

  const startDate = new Date(year, month - 1, day, hours, minutes, 0);
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
