// ============================================================
// MAYLLER PHONE — Vapi (Sofia) REST client (server only)
// pronovias/src/lib/phone/vapi.ts
//
// Lists Sofia's calls via the Vapi API:
//   GET https://api.vapi.ai/call   (Authorization: Bearer <PRIVATE key>)
//
// If no Vapi key is in the environment yet, we return
// { configured: false } so the dashboard degrades gracefully
// instead of throwing. Accepts either VAPI_PRIVATE_KEY or
// VAPI_API_KEY (whichever name you set on Vercel).
// ============================================================

import type { SofiaCall, SofiaResponse, Paged } from './types';

const VAPI_BASE = 'https://api.vapi.ai';
const TIMEOUT_MS = 10_000;

function getKey(): string | null {
  return process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || null;
}

function toIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// --- raw Vapi call shape (only the fields we consume) ---
interface VapiCallRaw {
  id: string;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  transcript?: string;
  summary?: string;
  phoneNumber?: { number?: string };
  customer?: { number?: string };
}

function durationSec(c: VapiCallRaw): number | null {
  if (c.startedAt && c.endedAt) {
    const ms = new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime();
    if (Number.isNaN(ms)) return null;
    return ms > 0 ? Math.round(ms / 1000) : 0;
  }
  return null;
}

export async function listSofiaCalls(limit: number): Promise<SofiaResponse> {
  const key = getKey();
  if (!key) return { configured: false };

  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  const resp = await fetch(`${VAPI_BASE}/call?${qs}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Vapi HTTP ${resp.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }

  const raw = (await resp.json()) as unknown;
  const list: VapiCallRaw[] = Array.isArray(raw) ? (raw as VapiCallRaw[]) : [];
  const items: SofiaCall[] = list.map((c) => ({
    id: c.id,
    from: c.customer?.number ?? null,
    to: c.phoneNumber?.number ?? null,
    startedAt: toIso(c.startedAt ?? c.createdAt),
    durationSec: durationSec(c),
    endedReason: c.endedReason ?? null,
    transcript: c.transcript ?? null,
    summary: c.summary ?? null,
  }));

  const paged: Paged<SofiaCall> = {
    items,
    page: 0,
    pageSize: limit,
    // Vapi list is cursor-based; we use a simple heuristic for "load more".
    hasMore: items.length >= limit,
  };
  return { configured: true, ...paged };
}
