// ============================================================
// MAYLLER BRIDAL — Booking System
// app/api/vapi/tools/route.ts
//
// Single endpoint that handles ALL Vapi function calls:
//   - check_availability
//   - create_booking
//   - cancel_booking
//
// Vapi calls this URL when Sofia needs to perform an action.
// ============================================================

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

// ── Vapi Request / Response Types ────────────────────────────

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

interface VapiRequest {
  message: {
    type: string;
    toolCallList?: ToolCall[];
  };
}

interface ToolResult {
  toolCallId: string;
  result: string;
}

// ── Tool Handlers ─────────────────────────────────────────────

async function handleCheckAvailability(
  args: Record<string, string>
): Promise<string> {
  const { date, appointment_type } = args;

  if (!date) {
    return 'I need a date to check availability. What date were you thinking?';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `Please provide the date in YYYY-MM-DD format. For example, 2026-06-15 for June 15th.`;
  }

  const type: AppointmentType = normalizeAppointmentType(
    appointment_type || 'wedding_consultation'
  );
  const config = APPOINTMENT_CONFIG[type];

  try {
    const slots = await getAvailableSlots(date, type);

    if (slots.length === 0) {
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dow = dateObj.getDay();

      if (!BUSINESS_HOURS.openDays.includes(dow as (typeof BUSINESS_HOURS.openDays)[number])) {
        return `We are closed on Sundays. Our boutique is open Monday through Saturday, 10:00 AM to 6:00 PM. Would you like to try a different day?`;
      }

      const past = new Date();
      past.setHours(0, 0, 0, 0);
      if (dateObj < past) {
        return `That date has already passed. Please choose a future date.`;
      }

      return `Unfortunately we have no available slots on ${formatDate(date)} for a ${config.label}. Would you like to try another date?`;
    }

    const friendlyDate = formatDate(date);
    const displayed = slots.slice(0, 5);
    const more = slots.length > 5 ? ` (and ${slots.length - 5} more)` : '';

    return `We have the following openings for a ${config.label} on ${friendlyDate}: ${displayed.join(', ')}${more}. Which time works best for you?`;
  } catch (err) {
    console.error('[check_availability] Error:', err);
    return `I'm having trouble checking availability right now. Please call us directly at ${STORE_PHONE} and we'll be happy to help.`;
  }
}

async function handleCreateBooking(
  args: Record<string, string>
): Promise<string> {
  const { customer_name, customer_phone, customer_email, date, time, appointment_type, notes } = args;

  const missing: string[] = [];
  if (!customer_name) missing.push('your full name');
  if (!customer_phone) missing.push('your phone number');
  if (!date) missing.push('the date');
  if (!time) missing.push('the time');

  if (missing.length > 0) {
    return `Before I confirm the booking, I still need: ${missing.join(', ')}. Could you provide that?`;
  }

  const type: AppointmentType = normalizeAppointmentType(appointment_type || 'wedding_consultation');
  const config = APPOINTMENT_CONFIG[type];

  try {
    const booking = await createBooking({
      customerName: customer_name,
      customerPhone: customer_phone,
      customerEmail: customer_email || undefined,
      date,
      time,
      appointmentType: type,
      notes: notes || undefined,
    });

    Promise.all([
      sendConfirmationSMS(booking),
      sendConfirmationEmail(booking),
    ]).catch(err => console.error('[notifications] Error:', err));

    const shortId = booking.bookingId.slice(0, 8).toUpperCase();

    return [
      `Your appointment is confirmed, ${booking.customerName}! Here are your details:`,
      `Type: ${config.label}`,
      `Date: ${formatDate(date)}`,
      `Time: ${time}`,
      `Duration: ${config.duration} minutes`,
      `Location: ${STORE_ADDRESS}`,
      `Booking ID: ${shortId}`,
      `You will receive a confirmation text message shortly.`,
      `If you need to cancel or reschedule, please call us at ${STORE_PHONE} at least 24 hours in advance.`,
      `We look forward to seeing you! Is there anything else I can help you with?`,
    ].join(' ');
  } catch (err) {
    console.error('[create_booking] Error:', err);
    return `I encountered an issue creating your booking. Please call us directly at ${STORE_PHONE} and we will take care of you right away.`;
  }
}

async function handleCancelBooking(
  args: Record<string, string>
): Promise<string> {
  const { booking_id } = args;

  if (!booking_id) {
    return `To cancel your appointment I need your booking ID. It's the 8-character code in your confirmation text message. What is it?`;
  }

  try {
    const result = await cancelBookingById(booking_id);

    if (!result.success) {
      return `I could not find a booking with that ID. Please double-check the code in your confirmation SMS. If you're still having trouble, call us at ${STORE_PHONE}.`;
    }

    if (result.customerPhone) {
      sendCancellationSMS(result.customerPhone, booking_id).catch(err =>
        console.error('[cancel_sms] Error:', err)
      );
    }

    return `Your appointment has been successfully cancelled${result.customerName ? `, ${result.customerName}` : ''}. We hope to see you at Mayller Bridal soon! Call us at ${STORE_PHONE} whenever you're ready to rebook. Is there anything else I can help you with?`;
  } catch (err) {
    console.error('[cancel_booking] Error:', err);
    return `I had trouble cancelling that booking. Please call us directly at ${STORE_PHONE}.`;
  }
}

// ── Main Route Handler ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: VapiRequest = await req.json();

    if (body.message?.type !== 'tool-calls') {
      return NextResponse.json({ results: [] });
    }

    const toolCallList = body.message.toolCallList ?? [];

    const results: ToolResult[] = await Promise.all(
      toolCallList.map(async (call) => {
        let args: Record<string, string> = {};
        try {
          args = JSON.parse(call.function.arguments || '{}');
        } catch {
          // ignore parse errors
        }

        let result: string;

        switch (call.function.name) {
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
            result = `Unknown function: ${call.function.name}`;
        }

        return { toolCallId: call.id, result };
      })
    );

    return NextResponse.json({ results }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[vapi/tools] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// Allow Vapi to call this endpoint from any origin
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
