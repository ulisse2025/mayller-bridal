// ============================================================
// MAYLLER PHONE — client fetch helpers (admin-gated)
// pronovias/src/components/admin/phone/api.ts
// ============================================================

import type { ApiError } from '@/lib/phone/types';

async function parseError(res: Response): Promise<string> {
  let msg = `Error ${res.status}`;
  try {
    const j = (await res.json()) as ApiError;
    if (j?.error) msg = j.error;
  } catch {
    /* ignore non-JSON bodies */
  }
  return msg;
}

export async function authedGet<T>(path: string, password: string): Promise<T> {
  const res = await fetch(path, { headers: { 'x-admin-password': password }, cache: 'no-store' });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export async function authedPost<T>(path: string, password: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}
