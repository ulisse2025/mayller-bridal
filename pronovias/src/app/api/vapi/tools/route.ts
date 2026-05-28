import { NextRequest, NextResponse } from 'next/server';
import {
  getAvailableSlots,
  createBooking,
  cancelBookingById,
  searchBookings,
  rescheduleBookingById,
} from '@/lib/vapi-calendar';
import {
  sendConfirmationEmail,
  sendConfirmationSMS,
  sendCancellationSMS,
  sendCancellationEmail,
  sendVoicemailEmail,
  type VoicemailType,
} from '@/lib/notifications';
import {
  AppointmentType,
  APPOINTMENT_CONFIG,
  BUSINESS_HOURS,
  normalizeAppointmentType,
  formatDate,
  STORE_PHONE,
  STORE_ADDRESS,
} from '@/lib/booking-types';

// Ã¢ÂÂÃ¢ÂÂ CORS Headers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

// Ã¢ÂÂÃ¢ÂÂ Date/Time Helpers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

/**
 * Returns today's date in YYYY-MM-DD format (Eastern Time).
 */
function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date());
}

/**
 * Returns a full human-readable date + time string in Eastern Time.
 * Example: "Wednesday, May 20, 2026 at 2:30 PM Eastern Time"
 */
function nowET(): string {
  const now = new Date();
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return `${datePart} at ${timePart} Eastern Time`;
}

/**
 * Auto-corrects the year if the AI sent a past year.
 * Example: "2025-05-20" Ã¢ÂÂ "2026-05-20" when current year is 2026.
 */
function correctYear(date: string): string {
  const currentYear = new Date().getFullYear();
  const [yearStr, ...rest] = date.split('-');
  const year = parseInt(yearStr, 10);
  if (year < currentYear) {
    const corrected = `${currentYear}-${rest.join('-')}`;
    console.log(`[date-correction] Auto-corrected year: ${date} Ã¢ÂÂ ${corrected}`);
    return corrected;
  }
  return date;
}

/**
 * Extract the inbound caller phone from the Vapi message envelope.
 * Vapi puts it under message.call.customer.number for inbound calls.
 */
function extractCallerPhone(body: unknown): string | null {
  const b = body as {
    message?: {
      call?: {
        customer?: { number?: string };
        phoneNumber?: { number?: string };
      };
    };
  } | null;
  return (
    b?.message?.call?.customer?.number ||
    b?.message?.call?.phoneNumber?.number ||
    null
  );
}

// Ã¢ÂÂÃ¢ÂÂ Tool Handlers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

/**
 * Returns the current date and time in Eastern Time.
 * Sofia should call this at the start of every conversation.
 */
function handleGetCurrentDatetime(): string {
  const isoDate = todayET();
  const humanDate = nowET();
  console.log('[get_current_datetime] Called Ã¢ÂÂ returning:', humanDate);
  return (
    `Current date and time in Eastern Time: ${humanDate}. ` +
    `ISO date for booking requests: ${isoDate}. ` +
    `Business hours: MondayÃ¢ÂÂSaturday, 10:00 AM to 6:00 PM Eastern.`
  );
}

/**
 * Ends the call gracefully.
 * This tool must be configured with "endCall": true in the Vapi assistant.
 */
function handleEndCall(): string {
  console.log('[end_call] Ending call gracefully');
  return (
    'Thank you for calling Mayller Bridal Italian Style. ' +
    'We look forward to seeing you! Have a wonderful day. Goodbye!'
  );
}

async function handleCheckAvailability(args: Record<string, string>): Promise<string> {
  const { date, appointment_type } = args;

  console.log('[check_availability] args received:', JSON.stringify(args));

  if (!date) {
    return `Today is ${todayET()}. I need a date to check availability. What date were you thinking?`;
  }

  // Normalize date Ã¢ÂÂ accept YYYY-MM-DD format
  let normalizedDate = date.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    console.error('[check_availability] Invalid date format:', normalizedDate);
    return `I need the date in a standard format. Could you say the date again, like "May 20th" or "next Tuesday"? (Today is ${todayET()})`;
  }

  // Auto-correct year if AI sent 2025 instead of 2026
  normalizedDate = correctYear(normalizedDate);

  const type: AppointmentType = normalizeAppointmentType(appointment_type || 'wedding_consultation');
  const config = APPOINTMENT_CONFIG[type];

  try {
    console.log('[check_availability] Querying calendar for date:', normalizedDate, 'type:', type);
    const slots = await getAvailableSlots(normalizedDate, type);
    console.log('[check_availability] Slots returned:', slots.length, slots.slice(0, 3));

    const today = todayET();

    if (slots.length === 0) {
      const [year, month, day] = normalizedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dow = dateObj.getDay();

      if (!BUSINESS_HOURS.openDays.includes(dow as (typeof BUSINESS_HOURS.openDays)[number])) {
        return `Today is ${today}. We are closed on Sundays. Our boutique is open Monday through Saturday, 10:00 AM to 6:00 PM. Would you like to try a different day?`;
      }
      return `Today is ${today}. Unfortunately we have no available slots on ${formatDate(normalizedDate)} for a ${config.label}. Would you like to try another date?`;
    }

    // Voice-friendly: show all slots, grouped by morning/afternoon when many
    if (slots.length <= 7) {
      return `Today is ${todayET()}. For a ${config.label} on ${formatDate(normalizedDate)}, we have ${slots.length} time${slots.length === 1 ? '' : 's'} available: ${slots.join(', ')}. Which time works best for you?`;
    }
    // Many slots: group by morning/afternoon and ask preference
    const morning = slots.filter((s: string) => s.endsWith('AM'));
    const afternoon = slots.filter((s: string) => s.endsWith('PM'));
    const parts: string[] = [];
    if (morning.length > 0) parts.push(`${morning.length} morning slot${morning.length === 1 ? '' : 's'} from ${morning[0]} to ${morning[morning.length - 1]}`);
    if (afternoon.length > 0) parts.push(`${afternoon.length} afternoon slot${afternoon.length === 1 ? '' : 's'} from ${afternoon[0]} to ${afternoon[afternoon.length - 1]}`);
    return `Today is ${todayET()}. For a ${config.label} on ${formatDate(normalizedDate)}, we have ${slots.length} openings: ${parts.join(', and ')}. Would you prefer morning or afternoon? I can then list the exact times.`;

  } catch (err) {
    console.error('[check_availability] Exception:', String(err));
    return `I'm having trouble checking availability right now. Please call us directly at ${STORE_PHONE} and we'll be happy to help. (Today is ${todayET()})`;
  }
}

async function handleCreateBooking(args: Record<string, string>): Promise<string> {
  console.log('[create_booking] args received:', JSON.stringify(args));

  const { customer_name, customer_phone, customer_email, time, appointment_type, notes } = args;
  let { date } = args;

  // Ã¢ÂÂÃ¢ÂÂ Validate required fields Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  const missing: string[] = [];
  if (!customer_name) missing.push('your full name');
  if (!customer_phone) missing.push('your phone number');
  if (!date) missing.push('the date');
  if (!time) missing.push('the time');
  if (missing.length > 0) {
    return `Before I confirm the booking, I still need: ${missing.join(', ')}. Could you provide that? (Today is ${todayET()})`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `I have a problem with the date format. Could you repeat the date? (Today is ${todayET()})`;
  }

  // Auto-correct year if AI sent 2025 instead of 2026
  date = correctYear(date);

  const type: AppointmentType = normalizeAppointmentType(appointment_type || 'wedding_consultation');
  const config = APPOINTMENT_CONFIG[type];

  // Ã¢ÂÂÃ¢ÂÂ Validate time format and business hours Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
  console.log('[create_booking] Raw time received from Vapi:', JSON.stringify(time));
  const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const time24Pattern = /^(\d{1,2}):(\d{2})$/;

  let parsedHours = -1;
  let parsedMinutes = 0;

  if (timePattern.test(time.trim())) {
    const m = time.trim().match(timePattern)!;
    parsedHours = parseInt(m[1], 10);
    parsedMinutes = parseInt(m[2], 10);
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && parsedHours !== 12) parsedHours += 12;
    if (ampm === 'AM' && parsedHours === 12) parsedHours = 0;
  } else if (time24Pattern.test(time.trim())) {
    const m = time.trim().match(time24Pattern)!;
    parsedHours = parseInt(m[1], 10);
    parsedMinutes = parseInt(m[2], 10);
  } else {
    console.error('[create_booking] Invalid time format received:', time);
    return `I'm having trouble understanding the time "${time}". Could you repeat it in a format like "10:00 AM" or "2:30 PM"? (Today is ${todayET()})`;
  }

  // Validate that the time is within business hours
  if (parsedHours < BUSINESS_HOURS.start || parsedHours >= BUSINESS_HOURS.end) {
    const openFrom = `${BUSINESS_HOURS.start > 12 ? BUSINESS_HOURS.start - 12 : BUSINESS_HOURS.start}:00 ${BUSINESS_HOURS.start >= 12 ? 'PM' : 'AM'}`;
    const openTo = `${BUSINESS_HOURS.end > 12 ? BUSINESS_HOURS.end - 12 : BUSINESS_HOURS.end}:00 ${BUSINESS_HOURS.end >= 12 ? 'PM' : 'AM'}`;
    console.warn('[create_booking] Time outside business hours:', time, 'parsedHours:', parsedHours);
    return `I'm sorry, but ${time} is outside our business hours. We're open from ${openFrom} to ${openTo} Eastern Time, Monday through Saturday. What time within those hours works for you?`;
  }

  // Ã¢ÂÂÃ¢ÂÂ Verify slot is still available (prevents overlaps across all appointment types) Ã¢ÂÂÃ¢ÂÂ
  const h12 = parsedHours === 0 ? 12 : parsedHours > 12 ? parsedHours - 12 : parsedHours;
  const ampm = parsedHours >= 12 ? 'PM' : 'AM';
  const timeKey = h12 + ':' + parsedMinutes.toString().padStart(2, '0') + ' ' + ampm;
  const availableSlots = await getAvailableSlots(date, type);
  if (!availableSlots.includes(timeKey)) {
    console.warn('[create_booking] Slot unavailable:', timeKey, 'available:', availableSlots);
    return "I'm sorry, but " + time + ' on ' + formatDate(date) + ' is no longer available for a ' + config.label + '. Would you like me to check what times are still open?';
  }
  try {
    console.log('[create_booking] Creating event in calendar for date:', date, 'time:', time);
    const booking = await createBooking({
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email || undefined,
      date,
      time,
      appointmentType: type,
      notes: notes || undefined,
    });

    console.log('[create_booking] Success, bookingId:', booking.bookingId);

    // -- Send notifications (no artificial timeout) --
    try {
      await Promise.all([
        sendConfirmationSMS(booking),
        sendConfirmationEmail(booking),
      ]);
    } catch (notifErr) {
      console.error('[notifications] Error:', String(notifErr));
    }

    const shortId = booking.bookingId.slice(0, 8).toUpperCase();

    return [
      `Your appointment is confirmed, ${booking.customerName}!`,
      `Type: ${config.label}.`,
      `Date: ${formatDate(date)}.`,
      `Time: ${time}.`,
      `Duration: ${config.duration} minutes.`,
      `Location: ${STORE_ADDRESS}.`,
      `Booking ID: ${shortId}.`,
      `You will receive a confirmation text message shortly.`,
      `To cancel or reschedule, please call us at ${STORE_PHONE} at least 24 hours in advance.`,
      `We look forward to seeing you!`,
    ].join(' ');

  } catch (err) {
    console.error('[create_booking] Exception:', String(err));
    return `I encountered an issue creating your booking. Please call us directly at ${STORE_PHONE} and we will take care of you right away.`;
  }
}

/**
 * Search for an existing booking. Sofia should call this BEFORE asking
 * the customer for a booking code. The caller's phone number is the
 * primary lookup key (Vapi passes it in message.call.customer.number).
 */
async function handleSearchBooking(
  args: Record<string, string>,
  callerPhone: string | null,
): Promise<string> {
  console.log('[search_booking] args:', JSON.stringify(args), 'callerPhone:', callerPhone);

  const phone = args.customer_phone || callerPhone || undefined;
  const name = args.customer_name || undefined;
  const email = args.customer_email || undefined;
  const bookingCode = args.booking_id || undefined;

  if (!phone && !name && !email && !bookingCode) {
    return `I need at least one of: phone number, full name, email address, or your 8-character booking code, to look up your appointment.`;
  }

  try {
    const results = await searchBookings({
      phone,
      name,
      email,
      shortBookingId: bookingCode,
      futureOnly: true,
    });

    if (results.length === 0) {
      // Helpful: if we tried phone-only and found nothing, ask for name
      if (phone && !name && !email) {
        return `I don't see an upcoming appointment under the phone number on file. Could you tell me the full name on the booking, or your 8-character booking code from the confirmation email?`;
      }
      return `I could not find any upcoming appointment matching that. Could you double-check the details, or share your 8-character booking code from the confirmation email?`;
    }

    if (results.length === 1) {
      const b = results[0];
      return [
        `I found your appointment.`,
        `Name: ${b.customerName}.`,
        `Service: ${b.appointmentLabel}.`,
        `Date: ${formatDate(b.startDateLocal)}.`,
        `Time: ${b.startTimeLocal}.`,
        `Booking code: ${b.shortBookingId}.`,
        `Would you like to confirm, reschedule, or cancel?`,
      ].join(' ');
    }

    // Multiple matches: list them briefly
    const lines = results.slice(0, 5).map((b, i) =>
      `${i + 1}) ${b.appointmentLabel} on ${formatDate(b.startDateLocal)} at ${b.startTimeLocal} Ã¢ÂÂ code ${b.shortBookingId}`
    );
    return `I found ${results.length} upcoming appointments. ${lines.join('. ')}. Which one would you like to manage?`;
  } catch (err) {
    console.error('[search_booking] Exception:', String(err));
    return `I'm having trouble looking up appointments right now. Please call us directly at ${STORE_PHONE}.`;
  }
}

async function handleCancelBooking(
  args: Record<string, string>,
  callerPhone: string | null,
): Promise<string> {
  let { booking_id } = args;

  // If no booking_id was provided, try to find a unique upcoming booking by
  // caller phone Ã¢ÂÂ saves the customer from having to recite the code.
  if (!booking_id && callerPhone) {
    try {
      const candidates = await searchBookings({ phone: callerPhone, futureOnly: true });
      if (candidates.length === 1) {
        booking_id = candidates[0].shortBookingId;
        console.log('[cancel_booking] Auto-resolved booking from caller phone:', booking_id);
      } else if (candidates.length > 1) {
        const lines = candidates.slice(0, 5).map((b, i) =>
          `${i + 1}) ${b.appointmentLabel} on ${formatDate(b.startDateLocal)} at ${b.startTimeLocal} Ã¢ÂÂ code ${b.shortBookingId}`
        );
        return `I see ${candidates.length} upcoming appointments under your phone number. Which one should I cancel? ${lines.join('. ')}.`;
      }
    } catch (e) {
      console.warn('[cancel_booking] Auto-resolve failed:', String(e));
    }
  }

  if (!booking_id) {
    return `To cancel your appointment I need either your 8-character booking code from the confirmation email, or your full name so I can look it up.`;
  }

  try {
    const result = await cancelBookingById(booking_id);
    if (!result.success) {
      return `I could not find a booking with that code. Please double-check the code in your confirmation email or SMS. If you're still having trouble, call us at ${STORE_PHONE}.`;
    }

    if (result.customerPhone) {
      sendCancellationSMS(result.customerPhone, booking_id).catch(err =>
        console.error('[cancel_sms]', String(err))
      );
    }

    // Notify the store via email on cancellation
    sendCancellationEmail(
      result.customerName ?? 'Unknown',
      booking_id,
    ).catch(err => console.error('[cancel_email]', String(err)));
    return `Your appointment has been successfully cancelled${result.customerName ? `, ${result.customerName}` : ''}. We hope to see you at Mayller Bridal soon! Call us at ${STORE_PHONE} whenever you're ready to rebook.`;
  } catch (err) {
    console.error('[cancel_booking] Exception:', String(err));
    return `I had trouble cancelling that booking. Please call us directly at ${STORE_PHONE}.`;
  }
}

async function handleRescheduleBooking(
  args: Record<string, string>,
  callerPhone: string | null,
): Promise<string> {
  let { booking_id } = args;
  let { date: newDate } = args;
  const { time: newTime } = args;

  if (!newDate || !newTime) {
    return `To reschedule I need the new date and time. What date and time work for you?`;
  }

  // Auto-correct year if AI sent a past year
  newDate = correctYear(newDate);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return `I have a problem with the new date format. Could you repeat it? (Today is ${todayET()})`;
  }

  // Try to resolve booking from caller phone if no code provided
  if (!booking_id && callerPhone) {
    try {
      const candidates = await searchBookings({ phone: callerPhone, futureOnly: true });
      if (candidates.length === 1) {
        booking_id = candidates[0].shortBookingId;
        console.log('[reschedule_booking] Auto-resolved booking from caller phone:', booking_id);
      } else if (candidates.length > 1) {
        const lines = candidates.slice(0, 5).map((b, i) =>
          `${i + 1}) ${b.appointmentLabel} on ${formatDate(b.startDateLocal)} at ${b.startTimeLocal} Ã¢ÂÂ code ${b.shortBookingId}`
        );
        return `I see ${candidates.length} upcoming appointments under your phone number. Which one do you want to reschedule? ${lines.join('. ')}.`;
      }
    } catch (e) {
      console.warn('[reschedule_booking] Auto-resolve failed:', String(e));
    }
  }

  if (!booking_id) {
    return `To reschedule I need your 8-character booking code or your full name so I can look up the appointment.`;
  }

  try {
    const result = await rescheduleBookingById(booking_id, newDate, newTime);

    if (!result.success) {
      switch (result.reason) {
        case 'not-found':
          return `I could not find a booking with that code. Could you double-check the code in your confirmation email?`;
        case 'slot-busy':
          return `Unfortunately, ${newTime} on ${formatDate(newDate)} is not available. Would you like me to check what other times are open that day?`;
        case 'invalid-time':
          return `That time is outside our business hours (10:00 AM to 6:00 PM Eastern, Monday through Saturday). What time within those hours works for you?`;
        default:
          return `I had trouble rescheduling that booking. Please call us directly at ${STORE_PHONE}.`;
      }
    }

    return [
      `Your appointment has been rescheduled${result.customerName ? `, ${result.customerName}` : ''}.`,
      `New date: ${formatDate(newDate)}.`,
      `New time: ${newTime}.`,
      `Booking code: ${booking_id.slice(0, 8).toUpperCase()}.`,
      `You'll receive an updated confirmation shortly. We look forward to seeing you!`,
    ].join(' ');
  } catch (err) {
    console.error('[reschedule_booking] Exception:', String(err));
    return `I had trouble rescheduling that booking. Please call us directly at ${STORE_PHONE}.`;
  }
}

// Ã¢ÂÂÃ¢ÂÂ leave_message Ã¢ÂÂ voicemail handler Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

const VALID_VM_TYPES: VoicemailType[] = [
  'running_late',
  'cant_come',
  'callback_request',
  'question',
  'at_door_urgent',
  'other',
];

async function handleLeaveMessage(
  args: Record<string, unknown>,
  callerPhone: string | null,
  fullBody: unknown,
): Promise<string> {
  const messageText = typeof args.message_text === 'string' ? args.message_text.trim() : '';
  const rawType = typeof args.message_type === 'string' ? args.message_type : 'other';
  const messageType: VoicemailType = (VALID_VM_TYPES as string[]).includes(rawType)
    ? (rawType as VoicemailType)
    : 'other';
  const customerName = typeof args.customer_name === 'string' ? args.customer_name.trim() : undefined;

  if (!messageText) {
    return "I didn't catch the message. Could you tell me again what you'd like me to pass to the team?";
  }
  if (!callerPhone) {
    return `I need your phone number to leave a message. Could you tell me yours, or call us directly at ${STORE_PHONE}?`;
  }

  // Try to enrich with booking context Ã¢ÂÂ best effort, never blocks the email.
  let booking: { appointmentLabel?: string; date?: string; time?: string; shortBookingId?: string } | null = null;
  try {
    const results = await searchBookings({ phone: callerPhone });
    if (results.length > 0) {
      const top = results[0];
      booking = {
        appointmentLabel: top.appointmentLabel,
        date: top.startDateLocal,
        time: top.startTimeLocal,
        shortBookingId: top.shortBookingId,
      };
    }
  } catch (err) {
    console.warn('[leave_message] booking enrichment failed (continuing):', String(err));
  }

  const callId = (fullBody as { message?: { call?: { id?: string } } } | undefined)?.message?.call?.id;
  const sent = await sendVoicemailEmail({
    messageText,
    messageType,
    customerName,
    callerPhone,
    callId,
    booking,
  });

  if (!sent) {
    return `I'm having trouble sending the message right now. Could you call us directly at ${STORE_PHONE}? Sorry for the inconvenience.`;
  }

  if (messageType === 'at_door_urgent') {
    return 'I just alerted the team that you are at the door. Someone should reach you in a moment.';
  }
  return 'Got it. I let the team know. They will see your message and get back to you.';
}

// Ã¢ÂÂÃ¢ÂÂ Route Handler Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
    console.log('[vapi/tools] Raw body:', rawBody.substring(0, 500));

    const body = JSON.parse(rawBody);
    const msgType = body?.message?.type;
    console.log('[vapi/tools] message.type:', msgType);

    // Extract caller phone (used as fallback lookup key for search/cancel/reschedule)
    const callerPhone = extractCallerPhone(body);
    if (callerPhone) console.log('[vapi/tools] caller phone detected:', callerPhone);

    // Ã¢ÂÂÃ¢ÂÂ Handle assistant-request Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
    // Vapi sends this when a call starts Ã¢ÂÂ inject current date/time into first message.
    if (msgType === 'assistant-request') {
      const currentDateTime = nowET();
      const isoDate = todayET();
      console.log('[vapi/tools] assistant-request Ã¢ÂÂ injecting date:', currentDateTime);
      return NextResponse.json({
        assistant: {
          firstMessage: `Hello! Thank you for calling Mayller Bridal Italian Style. I'm Sofia, your AI appointment assistant. Today is ${currentDateTime}. How can I help you today?`,
          model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Today's date is ${currentDateTime}. ISO date: ${isoDate}. Business hours: MondayÃ¢ÂÂSaturday, 10:00 AM to 6:00 PM Eastern Time.`,
              },
            ],
          },
        },
      }, { headers: CORS });
    }

    // Ã¢ÂÂÃ¢ÂÂ Handle both Vapi tool-call formats Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
    // New format: message.type = "tool-calls", message.toolCallList = [...]
    // Old format: message.type = "function-call", message.functionCall = {...}

    let toolCalls: Array<{ id: string; name: string; arguments: string | Record<string, unknown> }> = [];

    if (msgType === 'tool-calls') {
      const list = body.message?.toolCallList ?? [];
      toolCalls = list.map((c: { id: string; function: { name: string; arguments: string | Record<string, unknown> } }) => ({
        id: c.id,
        name: c.function?.name,
        arguments: c.function?.arguments || '{}',
      }));
    } else if (msgType === 'function-call') {
      // Legacy Vapi format
      const fc = body.message?.functionCall;
      if (fc) {
        toolCalls = [{
          id: body.message?.call?.id ?? 'legacy-call',
          name: fc.name,
          arguments: typeof fc.parameters === 'string' ? fc.parameters : JSON.stringify(fc.parameters || {}),
        }];
      }
    } else {
      console.log('[vapi/tools] Unhandled message type:', msgType, 'Ã¢ÂÂ body keys:', Object.keys(body?.message ?? {}).join(', '));
      return NextResponse.json({ results: [] }, { headers: CORS });
    }

    if (toolCalls.length === 0) {
      console.log('[vapi/tools] No tool calls found in message');
      return NextResponse.json({ results: [] }, { headers: CORS });
    }

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        let args: Record<string, string> = {};
        try {
          if (typeof call.arguments === 'string') {
            args = JSON.parse(call.arguments);
          } else if (call.arguments && typeof call.arguments === 'object') {
            args = call.arguments as Record<string, string>;
          }
        } catch {
          console.error('[vapi/tools] Failed to parse arguments:', call.arguments);
        }

        console.log('[vapi/tools] Calling function:', call.name, 'with args:', JSON.stringify(args));

        let result: string;
        switch (call.name) {
          case 'get_current_datetime':
            result = handleGetCurrentDatetime();
            break;
          case 'check_availability':
            result = await handleCheckAvailability(args);
            break;
          case 'create_booking':
            result = await handleCreateBooking(args);
            break;
          case 'search_booking':
            result = await handleSearchBooking(args, callerPhone);
            break;
          case 'cancel_booking':
            result = await handleCancelBooking(args, callerPhone);
            break;
          case 'reschedule_booking':
            result = await handleRescheduleBooking(args, callerPhone);
            break;
          case 'leave_message':
            result = await handleLeaveMessage(args, callerPhone, body);
            break;
          case 'end_call':
            result = handleEndCall();
            break;
          default:
            result = `Unknown function: ${call.name}`;
            console.error('[vapi/tools] Unknown function called:', call.name);
        }

        console.log('[vapi/tools] Result for', call.name, ':', result.substring(0, 100));
        return { toolCallId: call.id, result };
      })
    );

    return NextResponse.json({ results }, { headers: CORS });

  } catch (err) {
    console.error('[vapi/tools] Unhandled error:', String(err), '| body preview:', rawBody.substring(0, 200));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS }
    );
  }
}
