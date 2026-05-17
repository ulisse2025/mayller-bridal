import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots, createBooking, cancelBookingById } from '@/lib/vapi-calendar';
import { sendConfirmationEmail, sendConfirmationSMS, sendCancellationSMS } from '@/lib/notifications';
import {
  AppointmentType,
  APPOINTMENT_CONFIG,
  BUSINESS_HOURS,
  normalizeAppointmentType,
  formatDate,
  STORE_PHONE,
  STORE_ADDRESS,
} from '@/lib/booking-types';

// ── CORS Headers ──────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

// ── Date Helpers ──────────────────────────────────────────────

/**
 * Returns today's date in YYYY-MM-DD format (Eastern Time).
 */
function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date());
}

/**
 * Auto-corrects the year if the AI sent a past year.
 * Example: "2025-05-20" → "2026-05-20" when current year is 2026.
 * This prevents the AI from booking in the past due to training cutoff confusion.
 */
function correctYear(date: string): string {
  const currentYear = new Date().getFullYear();
  const [yearStr, ...rest] = date.split('-');
  const year = parseInt(yearStr, 10);
  if (year < currentYear) {
    const corrected = `${currentYear}-${rest.join('-')}`;
    console.log(`[date-correction] Auto-corrected year: ${date} → ${corrected}`);
    return corrected;
  }
  return date;
}

// ── Tool Handlers ─────────────────────────────────────────────

async function handleCheckAvailability(args: Record<string, string>): Promise<string> {
  const { date, appointment_type } = args;

  console.log('[check_availability] args received:', JSON.stringify(args));

  if (!date) {
    return `Today is ${todayET()}. I need a date to check availability. What date were you thinking?`;
  }

  // Normalize date — accept both YYYY-MM-DD and other formats
  let normalizedDate = date.trim();

  // If already YYYY-MM-DD, keep it
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    console.error('[check_availability] Invalid date format:', normalizedDate);
    return `I need the date in a standard format. Could you say the date again, like "May 20th" or "next Tuesday"? (Today is ${todayET()})`;
  }

  // ── Auto-correct year if AI sent 2025 instead of 2026 ──────
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

    const displayed = slots.slice(0, 5);
    const more = slots.length > 5 ? ` (and ${slots.length - 5} more)` : '';
    return `Today is ${todayET()}. We have the following openings for a ${config.label} on ${formatDate(normalizedDate)}: ${displayed.join(', ')}${more}. Which time works best for you?`;

  } catch (err) {
    console.error('[check_availability] Exception:', String(err));
    return `I'm having trouble checking availability right now. Please call us directly at ${STORE_PHONE} and we'll be happy to help. (Today is ${todayET()})`;
  }
}

async function handleCreateBooking(args: Record<string, string>): Promise<string> {
  console.log('[create_booking] args received:', JSON.stringify(args));

  const { customer_name, customer_phone, customer_email, time, appointment_type, notes } = args;
  let { date } = args;

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

  // ── Auto-correct year if AI sent 2025 instead of 2026 ──────
  date = correctYear(date);

  const type: AppointmentType = normalizeAppointmentType(appointment_type || 'wedding_consultation');
  const config = APPOINTMENT_CONFIG[type];

  try {
    console.log('[create_booking] Creating event in calendar for date:', date);
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

    // ── Await notifications with 9s timeout (fire-and-forget is killed by Vercel before it runs) ──
    try {
      await Promise.race([
        Promise.all([
          sendConfirmationSMS(booking),
          sendConfirmationEmail(booking),
        ]),
        new Promise<void>(resolve => setTimeout(resolve, 9_000)),
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

async function handleCancelBooking(args: Record<string, string>): Promise<string> {
  const { booking_id } = args;
  if (!booking_id) {
    return `To cancel your appointment I need your booking ID — the 8-character code from your confirmation text. What is it?`;
  }

  try {
    const result = await cancelBookingById(booking_id);
    if (!result.success) {
      return `I could not find a booking with that ID. Please double-check the code in your confirmation SMS. If you're still having trouble, call us at ${STORE_PHONE}.`;
    }

    if (result.customerPhone) {
      sendCancellationSMS(result.customerPhone, booking_id).catch(err =>
        console.error('[cancel_sms]', String(err))
      );
    }

    return `Your appointment has been successfully cancelled${result.customerName ? `, ${result.customerName}` : ''}. We hope to see you at Mayller Bridal soon! Call us at ${STORE_PHONE} whenever you're ready to rebook.`;
  } catch (err) {
    console.error('[cancel_booking] Exception:', String(err));
    return `I had trouble cancelling that booking. Please call us directly at ${STORE_PHONE}.`;
  }
}

// ── Route Handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
    console.log('[vapi/tools] Raw body:', rawBody.substring(0, 500));

    const body = JSON.parse(rawBody);
    const msgType = body?.message?.type;
    console.log('[vapi/tools] message.type:', msgType);

    // ── Handle both Vapi formats ──────────────────────────────
    // New format: message.type = "tool-calls", message.toolCallList = [...]
    // Old format: message.type = "function-call", message.functionCall = {...}

    // arguments can be a JSON string OR an already-parsed object (Vapi sends both)
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
      // Unknown type — log and return empty
      console.log('[vapi/tools] Unhandled message type:', msgType, '— body keys:', Object.keys(body?.message ?? {}).join(', '));
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
            // Vapi sends arguments as a JSON string
            args = JSON.parse(call.arguments);
          } else if (call.arguments && typeof call.arguments === 'object') {
            // Vapi sends arguments already parsed as an object
            args = call.arguments as Record<string, string>;
          }
        } catch {
          console.error('[vapi/tools] Failed to parse arguments:', call.arguments);
        }

        console.log('[vapi/tools] Calling function:', call.name, 'with args:', JSON.stringify(args));

        let result: string;
        switch (call.name) {
          case 'check_availability':
            result = await handleCheckAvailability(args);
            break;
          case 'create_booking':
            result = await handleCreateBooking(args);
            break;
          case 'cancel_booking':
            result = await handleCancelBooking(args);
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
