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
