// ============================================================
// MAYLLER PHONE — display formatting helpers (client-safe)
// pronovias/src/lib/phone/format.ts
//
// All timestamps render in America/New_York (the store is in PA).
// No server-only imports here — usable from client components.
// ============================================================

const ET_TZ = 'America/New_York';

/** "Jun 10, 3:42 PM" in ET, or "—" when missing/invalid. */
export function formatDateTimeET(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** Seconds -> "m:ss". Returns "—" for null/zero. */
export function formatDuration(sec: number | null): string {
  if (sec === null || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Pretty US phone: "(484) 638-6555". Falls back to the raw value. */
export function formatPhone(raw: string | null): string {
  if (!raw) return 'Unknown';
  const d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return raw;
}
