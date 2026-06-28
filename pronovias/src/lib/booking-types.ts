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

// ── Seasonal lunch break (single source of truth) ─────────────
// Summer (June 1 – August 31, every year): lunch 12:00 PM – 1:00 PM.
//   → last starts: Alteration 11:30 AM, Tuxedo 11:00 AM, Wedding 10:30 AM;
//     afternoon resumes at 1:00 PM.
// Rest of the year: lunch 1:00 PM – 2:00 PM (historical schedule).
// RULE: no appointment may OVERLAP the lunch break. Used by BOTH the
// website booking form (booking-calendar.tsx) and Sofia (vapi-calendar.ts).
export function getLunchBreak(date: string): { startMin: number; endMin: number } {
  const month = parseInt(date.split('-')[1] ?? '0', 10); // 1-12
  const isSummer = month >= 6 && month <= 8;
  return isSummer
    ? { startMin: 12 * 60, endMin: 13 * 60 }
    : { startMin: 13 * 60, endMin: 14 * 60 };
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
