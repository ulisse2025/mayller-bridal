// ============================================================
// MAYLLER BRIDAL — Booking System (Sofia AI / Vapi)
// lib/booking-types.ts
// ============================================================

export type AppointmentType =
  | 'wedding_consultation'
  | 'alteration'
  | 'tuxedo_fitting';

export interface AppointmentConfig {
  label: string;
  duration: number; // minutes
  colorId: string;  // Google Calendar color ID
}

export const APPOINTMENT_CONFIG: Record<AppointmentType, AppointmentConfig> = {
  wedding_consultation: {
    label: 'Wedding Dress Consultation',
    duration: 90,
    colorId: '11', // Tomato red
  },
  alteration: {
    label: 'Alteration / Sartoria',
    duration: 30,
    colorId: '7',  // Cyan
  },
  tuxedo_fitting: {
    label: 'Tuxedo Fitting',
    duration: 60,
    colorId: '2',  // Sage green
  },
};

// Business hours — Eastern Time (Pennsylvania)
export const BUSINESS_HOURS = {
  start: 10,   // 10:00 AM
  end: 18,     // 6:00 PM
  timezone: 'America/New_York',
  openDays: [1, 2, 3, 4, 5, 6] as number[], // Mon–Sat
  slotIncrement: 30,
} as const;

// ── Lunch break — REMOVED (5 September 2026) ──────────────────
// The boutique no longer closes for lunch. Appointments start every 30
// minutes from 10:00 AM to 6:00 PM ET, all year round, for every service —
// so the 12:30 PM slot (and 1:00 / 1:30 PM) is now bookable.
//
// The function is KEPT and returns an EMPTY window on purpose: the overlap
// test in vapi-calendar.ts and booking-calendar.tsx stays untouched, and with
// startMin === endMin === 0 no slot can ever overlap it. To bring a lunch
// break back, just return a real window here — both the website and Sofia
// pick it up automatically, with no other file to edit.
//   Previous rule (for reference): summer Jun–Aug 12:00–13:00, otherwise 13:00–14:00.
export function getLunchBreak(date: string): { startMin: number; endMin: number } {
  void date; // no seasonal rule anymore — kept for signature compatibility
  return { startMin: 0, endMin: 0 };
}

// ── Saturday rule (single source of truth) ────────────────────
// On Saturdays the boutique only takes Wedding Dress Consultations and
// Tuxedo Fittings — no alterations. Last start stays 2:00 PM.
// Used by BOTH the website (booking-calendar.tsx + /api/book) and Sofia
// (vapi-calendar.ts + /api/vapi/tools) so the two channels never drift.
export const SATURDAY_LAST_START_MIN = 14 * 60; // 2:00 PM

export const SATURDAY_SERVICES: AppointmentType[] = [
  'wedding_consultation',
  'tuxedo_fitting',
];

/** Day of week (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD ET date. */
export function dayOfWeekFor(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** True when the given YYYY-MM-DD ET date is a Saturday. */
export function isSaturdayDate(date: string): boolean {
  return dayOfWeekFor(date) === 6;
}

/**
 * Can this appointment type be booked on this date?
 * Only rule today: Saturday accepts SATURDAY_SERVICES only. Opening hours,
 * closures and slot availability are checked separately.
 */
export function isServiceAvailableOnDate(
  date: string,
  type: AppointmentType,
): boolean {
  if (!isSaturdayDate(date)) return true;
  return SATURDAY_SERVICES.includes(type);
}

// ── Store closures (vacations / holidays) ─────────────────────
// Reusable list of date ranges when the store is CLOSED — no bookings
// accepted on the website OR via Sofia. Both endpoints (from/to) are
// INCLUSIVE, expressed in ET (America/New_York), format YYYY-MM-DD.
// To add a future closure, just append an entry to STORE_CLOSURES.
// Used by the website booking form (booking-calendar.tsx + /api/book) and
// by Sofia (vapi-calendar.ts + /api/vapi/tools) so both channels stay in sync.
export interface StoreClosure {
  from: string;   // YYYY-MM-DD inclusive (first closed day)
  to: string;     // YYYY-MM-DD inclusive (last closed day)
  reason: string; // human-readable (logs / customer message / future UI)
}

export const STORE_CLOSURES: StoreClosure[] = [
  // Summer vacation 2026 — closed Jul 21 through Jul 31 inclusive; reopen Aug 1.
  { from: '2026-07-21', to: '2026-07-31', reason: 'Summer vacation' },
];

/**
 * If the given date (YYYY-MM-DD, ET) falls inside a closed range, returns
 * the matching StoreClosure; otherwise null. Plain string comparison is
 * valid because zero-padded ISO dates sort lexicographically.
 */
export function getStoreClosure(date: string): StoreClosure | null {
  for (const c of STORE_CLOSURES) {
    if (date >= c.from && date <= c.to) return c;
  }
  return null;
}

/** True when the store is closed (vacation/holiday) on the given ET date. */
export function isStoreClosed(date: string): boolean {
  return getStoreClosure(date) !== null;
}

export const STORE_ADDRESS = '4054 W Penn Ave, Sinking Spring, PA 19608';
export const STORE_PHONE = '(484) 760-0475';
export const STORE_NAME = 'Mayller Bridal Italian Style';

export interface BookingRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  appointmentType: AppointmentType;
  notes?: string;
}

export interface BookingResult {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  appointmentType: AppointmentType;
  label: string;
  duration: number;
}

export function parseTime(time: string): { hours: number; minutes: number } {
  const trimmed = time.trim();
  if (trimmed.includes('AM') || trimmed.includes('PM')) {
    const [timePart, ampm] = trimmed.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m || 0 };
  }
  const [h, m] = trimmed.split(':').map(Number);
  return { hours: h, minutes: m || 0 };
}

export function formatTime(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayH = hours % 12 || 12;
  const displayM = String(minutes).padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function normalizeAppointmentType(raw: string): AppointmentType {
  const map: Record<string, AppointmentType> = {
    wedding: 'wedding_consultation',
    wedding_consultation: 'wedding_consultation',
    'wedding consultation': 'wedding_consultation',
    'wedding dress': 'wedding_consultation',
    bridal: 'wedding_consultation',
    alteration: 'alteration',
    alterations: 'alteration',
    sartoria: 'alteration',
    fitting: 'alteration',
    tuxedo: 'tuxedo_fitting',
    tuxedo_fitting: 'tuxedo_fitting',
    'tuxedo fitting': 'tuxedo_fitting',
    suit: 'tuxedo_fitting',
  };
  return map[raw?.toLowerCase()?.trim()] ?? 'wedding_consultation';
}
