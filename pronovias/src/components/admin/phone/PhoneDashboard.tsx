// ============================================================
// MAYLLER PHONE — dashboard shell + tabs + lists (client)
// pronovias/src/components/admin/phone/PhoneDashboard.tsx
//
// Phase 1: bottom tab bar, card lists, ET timestamps, paging.
// Phase 2: click-to-call + SMS reply live inside the cards.
// Phase 3: compose a NEW SMS to any number (NewSmsComposer).
// All requests carry the x-admin-password header.
// ============================================================

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CallRecord, Paged, SmsRecord, SofiaCall, SofiaResponse } from '@/lib/phone/types';
import { authedGet, authedPost } from './api';
import { CallCard, Empty, ErrorBox, ListHeader, LoadMore, SmsCard, SofiaCard } from './cards';

type Tab = 'calls' | 'sofia' | 'sms';

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

function CallsView({ password }: { password: string }) {
  const { items, hasMore, loading, error, loadMore, refresh } = usePaged<CallRecord>('/api/admin/phone/calls', password);
  return (
    <div>
      <ListHeader title="Calls" count={items.length} onRefresh={refresh} loading={loading && items.length === 0} />
      {error && <ErrorBox msg={error} />}
      {!error && items.length === 0 && !loading && <Empty msg="No calls yet." />}
      <div className="space-y-2.5">
        {items.map((c) => (
          <CallCard key={c.sid} c={c} password={password} />
        ))}
      </div>
      <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />
    </div>
  );
}

// -- Phase 3: compose a brand-new SMS to any number ----------
// Reuses the existing send endpoint (/api/admin/phone/reply),
// which sends via the A2P Messaging Service when
// TWILIO_MESSAGING_SERVICE_SID is configured.
function NewSmsComposer({ password, onSent }: { password: string; onSent: () => void }) {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const canSend = to.replace(/\D/g, '').length >= 10 && body.trim().length > 0 && !sending;

  const send = useCallback(async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      await authedPost('/api/admin/phone/reply', password, { to: to.trim(), body: body.trim() });
      setResult({ ok: true, msg: 'Message sent.' });
      setBody('');
      onSent();
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : 'Send failed' });
    } finally {
      setSending(false);
    }
  }, [canSend, to, body, password, onSent]);

  return (
    <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 space-y-2.5">
      <span className="text-xs tracking-widest uppercase text-amber-300">Send a new message</span>
      <input
        type="tel"
        inputMode="tel"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To (e.g. 484 638 3213)"
        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={3}
        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-400/50"
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${result ? (result.ok ? 'text-emerald-400' : 'text-rose-400') : 'text-white/30'}`}>
          {result ? result.msg : 'Sends from the boutique number'}
        </span>
        <button
          onClick={send}
          disabled={!canSend}
          className={`shrink-0 rounded-md px-4 py-2 text-xs tracking-widest uppercase transition-colors ${
            canSend ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white/10 text-white/30'
          }`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function SmsView({ password }: { password: string }) {
  const { items, hasMore, loading, error, loadMore, refresh } = usePaged<SmsRecord>('/api/admin/phone/sms', password);
  return (
    <div>
      <ListHeader title="SMS" count={items.length} onRefresh={refresh} loading={loading && items.length === 0} />
      <NewSmsComposer password={password} onSent={refresh} />
      {error && <ErrorBox msg={error} />}
      {!error && items.length === 0 && !loading && <Empty msg="No messages yet." />}
      <div className="space-y-2.5">
        {items.map((m) => (
          <SmsCard key={m.sid} m={m} password={password} />
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
            <SofiaCard key={s.id} s={s} password={password} />
          ))}
        </div>
      )}
      {configured === true && <LoadMore hasMore={hasMore} loading={loading} onClick={loadMore} />}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'sofia', label: 'Sofia' },
  { key: 'sms', label: 'SMS' },
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
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${on ? 'text-amber-300' : 'text-white/35 hover:text-white/60'}`}
          >
            <span className="text-xs tracking-widest uppercase">{t.label}</span>
            <span className={`h-0.5 w-6 rounded-full ${on ? 'bg-amber-400' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </nav>
  );
}

export default function PhoneDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('calls');
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
