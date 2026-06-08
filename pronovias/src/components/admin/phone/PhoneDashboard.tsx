// ============================================================
// MAYLLER PHONE — dashboard shell + tabs + lists (client)
// pronovias/src/components/admin/phone/PhoneDashboard.tsx
//
// Mobile-first: bottom tab bar, card lists, ET timestamps,
// collapsed transcripts, "Load more" paging (25 at a time).
// All data requests carry the x-admin-password header.
// ============================================================

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ApiError,
  CallRecord,
  Paged,
  SmsRecord,
  SofiaCall,
  SofiaResponse,
} from '@/lib/phone/types';
import { formatDateTimeET, formatDuration, formatPhone } from '@/lib/phone/format';

type Tab = 'calls' | 'sofia' | 'sms';

// ---- small typed fetch helper -----------------------------------------
async function authedGet<T>(path: string, password: string): Promise<T> {
  const res = await fetch(path, {
    headers: { 'x-admin-password': password },
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = (await res.json()) as ApiError;
      if (j?.error) msg = j.error;
    } catch {
      /* ignore non-JSON bodies */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

// ---- generic paged hook (Calls + SMS) ---------------------------------
function usePaged<T>(base: string, password: string) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const fetchPage = useCallback(
    async (p: number, reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authedGet<Paged<T>>(`${base}?page=${p}&pageSize=25`, password);
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [base, password],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) void fetchPage(page + 1, false);
  }, [loading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => void fetchPage(0, true), [fetchPage]);

  return { items, hasMore, loading, error, loadMore, refresh };
}

// ---- bespoke hook for Sofia (limit-based + configured flag) -----------
function useSofia(password: string) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [items, setItems] = useState<SofiaCall[]>([]);
  const [limit, setLimit] = useState(25);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(
    async (lim: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authedGet<SofiaResponse>(`/api/admin/phone/sofia?limit=${lim}`, password);
        if (!data.configured) {
          setConfigured(false);
          setItems([]);
          setHasMore(false);
          return;
        }
        setConfigured(true);
        setItems(data.items);
        setHasMore(data.hasMore);
        setLimit(lim);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [password],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void load(25);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) void load(limit + 25);
  }, [loading, hasMore, limit, load]);

  const refresh = useCallback(() => void load(25), [load]);

  return { configured, items, hasMore, loading, error, loadMore, refresh };
}

// ---- presentational bits ----------------------------------------------
function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (['completed', 'delivered', 'received', 'sent'].includes(s)) return 'text-emerald-400/80';
  if (['failed', 'undelivered', 'no-answer', 'busy', 'canceled'].includes(s)) return 'text-rose-400/80';
  if (['queued', 'sending', 'ringing', 'in-progress', 'accepted'].includes(s)) return 'text-amber-300/80';
  return 'text-white/40';
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-widest ${statusColor(status)}`}>{status}</span>
  );
}

function DirBadge({ inbound }: { inbound: boolean }) {
  return (
    <span
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm ${
        inbound ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'
      }`}
      aria-hidden
    >
      {inbound ? '↘' : '↗'}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ListHeader({ title, count, onRefresh, loading }: { title: string; count: number; onRefresh: () => void; loading: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white/80 text-sm tracking-widest uppercase">
        {title} <span className="text-white/25">({count})</span>
      </h2>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="text-white/30 hover:text-amber-300 text-xs tracking-widest uppercase flex items-center gap-1.5 disabled:opacity-40"
      >
        {loading ? <Spinner /> : '⟳'} Refresh
      </button>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return <p className="text-rose-400/80 text-xs tracking-wider py-6 text-center">{msg}</p>;
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-white/25 text-sm tracking-wider py-16 text-center">{msg}</p>;
}

function LoadMore({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore) return null;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full mt-4 py-3 border border-white/10 hover:border-amber-400/30 text-white/50 hover:text-amber-300 text-xs tracking-widest uppercase transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
    >
      {loading ? <Spinner /> : null} Load more
    </button>
  );
}

// ---- cards -------------------------------------------------------------
function CallCard({ c }: { c: CallRecord }) {
  const inbound = c.direction === 'inbound';
  const other = inbound ? c.from : c.to;
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5 flex items-center gap-3">
      <DirBadge inbound={inbound} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-sm truncate">{formatPhone(other)}</span>
          <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(c.startedAt)}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <StatusPill status={c.status} />
          <span className="text-white/40 text-xs">{formatDuration(c.durationSec)}</span>
        </div>
      </div>
    </div>
  );
}

function SmsCard({ m }: { m: SmsRecord }) {
  const inbound = m.direction === 'inbound';
  const other = inbound ? m.from : m.to;
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm truncate flex items-center gap-2">
          <span className={inbound ? 'text-emerald-300' : 'text-amber-300'}>{inbound ? '↘' : '↗'}</span>
          {formatPhone(other)}
        </span>
        <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(m.sentAt)}</span>
      </div>
      <p className="text-white/70 text-sm mt-2 leading-relaxed whitespace-pre-wrap break-words">
        {m.body || <span className="text-white/25">(no text)</span>}
      </p>
      <div className="flex items-center gap-3 mt-2">
        <StatusPill status={m.status} />
        {m.numMedia > 0 && (
          <span className="text-white/35 text-[10px] tracking-wider uppercase">{m.numMedia} media</span>
        )}
      </div>
    </div>
  );
}

function SofiaCard({ s }: { s: SofiaCall }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm truncate">{formatPhone(s.from)}</span>
        <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(s.startedAt)}</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-white/40 text-xs">{formatDuration(s.durationSec)}</span>
        {s.endedReason && (
          <span className="text-white/35 text-[10px] tracking-wider uppercase truncate">{s.endedReason}</span>
        )}
      </div>
      {s.summary && <p className="text-white/55 text-xs mt-2 leading-relaxed">{s.summary}</p>}
      {s.transcript && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-2 text-amber-300/70 hover:text-amber-300 text-[11px] tracking-widest uppercase"
          >
            {open ? 'Hide transcript' : 'View transcript'}
          </button>
          {open && (
            <pre className="mt-2 text-white/60 text-xs leading-relaxed whitespace-pre-wrap break-words bg-black/30 border border-white/5 rounded p-3 max-h-72 overflow-auto">
              {s.transcript}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

// ---- per-tab views -----------------------------------------------------
function CallsView({ password }: { password: string }) {
  const { items, hasMore, loading, error, loadMore, refresh } = usePaged<CallRecord>('/api/admin/phone/calls', password);
  return (
    <div>
      <ListHeader title="Calls" count={items.length} onRefresh={refresh} loading={loading && items.length === 0} />
      {error && <ErrorBox msg={error} />}
      {!error && items.length === 0 && !loading && <Empty msg="No calls yet." />}
      <div className="space-y-2.5">
        {items.map((c) => (
          <CallCard key={c.sid} c={c} />
        ))}
      </div>
      <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />
    </div>
  );
}

function SmsView({ password }: { password: string }) {
  const { items, hasMore, loading, error, loadMore, refresh } = usePaged<SmsRecord>('/api/admin/phone/sms', password);
  return (
    <div>
      <ListHeader title="SMS" count={items.length} onRefresh={refresh} loading={loading && items.length === 0} />
      {error && <ErrorBox msg={error} />}
      {!error && items.length === 0 && !loading && <Empty msg="No messages yet." />}
      <div className="space-y-2.5">
        {items.map((m) => (
          <SmsCard key={m.sid} m={m} />
        ))}
      </div>
      <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />
    </div>
  );
}

function SofiaView({ password }: { password: string }) {
  const { configured, items, hasMore, loading, error, loadMore, refresh } = useSofia(password);
  return (
    <div>
      <ListHeader title="Sofia" count={items.length} onRefresh={refresh} loading={loading && items.length === 0} />
      {error && <ErrorBox msg={error} />}
      {configured === false && (
        <div className="text-center py-16 px-4">
          <p className="text-white/40 text-sm tracking-wider mb-2">Vapi not connected</p>
          <p className="text-white/25 text-xs leading-relaxed">
            Add a Vapi private key (VAPI_PRIVATE_KEY or VAPI_API_KEY) to Vercel to see Sofia&apos;s calls and transcripts here.
          </p>
        </div>
      )}
      {configured === true && items.length === 0 && !loading && !error && <Empty msg="No Sofia calls yet." />}
      {configured === true && (
        <div className="space-y-2.5">
          {items.map((s) => (
            <SofiaCard key={s.id} s={s} />
          ))}
        </div>
      )}
      {configured === true && <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />}
    </div>
  );
}

// ---- tab bar -----------------------------------------------------------
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'calls', label: 'Calls', icon: '📞' },
  { key: 'sofia', label: 'Sofia', icon: '🤖' },
  { key: 'sms', label: 'SMS', icon: '💬' },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/10 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              on ? 'text-amber-300' : 'text-white/35 hover:text-white/60'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>{t.icon}</span>
            <span className="text-[10px] tracking-widest uppercase">{t.label}</span>
            <span className={`h-0.5 w-6 rounded-full ${on ? 'bg-amber-400' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}

// ---- main shell --------------------------------------------------------
export default function PhoneDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('calls');
  // Keep visited tabs mounted so their data + scroll persist across switches.
  const [visited, setVisited] = useState<Record<Tab, boolean>>({ calls: true, sofia: false, sms: false });

  useEffect(() => {
    setVisited((v) => (v[tab] ? v : { ...v, [tab]: true }));
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs tracking-[0.3em] font-light">MAYLLER PHONE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        </div>
        <button onClick={onLogout} className="text-white/25 text-xs tracking-widest hover:text-rose-400 transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}>
        <div className={tab === 'calls' ? '' : 'hidden'}>{visited.calls && <CallsView password={password} />}</div>
        <div className={tab === 'sofia' ? '' : 'hidden'}>{visited.sofia && <SofiaView password={password} />}</div>
        <div className={tab === 'sms' ? '' : 'hidden'}>{visited.sms && <SmsView password={password} />}</div>
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
