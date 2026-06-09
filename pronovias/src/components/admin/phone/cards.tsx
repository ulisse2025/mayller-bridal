// ============================================================
// MAYLLER PHONE — presentational + card components (client)
// pronovias/src/components/admin/phone/cards.tsx
//
// Cards plus the Phase 2 actions: click-to-call (CallButton) and
// inline SMS reply (ReplyBox).
// ============================================================

'use client';

import { useState } from 'react';
import type { CallRecord, CallResponse, ReplyResponse, SmsRecord, SofiaCall } from '@/lib/phone/types';
import { formatDateTimeET, formatDuration, formatPhone } from '@/lib/phone/format';
import { authedPost } from './api';

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (['completed', 'delivered', 'received', 'sent'].includes(s)) return 'text-emerald-400/80';
  if (['failed', 'undelivered', 'no-answer', 'busy', 'canceled'].includes(s)) return 'text-rose-400/80';
  if (['queued', 'sending', 'ringing', 'in-progress', 'accepted'].includes(s)) return 'text-amber-300/80';
  return 'text-white/40';
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`text-[10px] uppercase tracking-widest ${statusColor(status)}`}>{status}</span>;
}

export function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ListHeader({ title, count, onRefresh, loading }: { title: string; count: number; onRefresh: () => void; loading: boolean }) {
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
        {loading ? <Spinner /> : 'Refresh'}
      </button>
    </div>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  return <p className="text-rose-400/80 text-xs tracking-wider py-6 text-center">{msg}</p>;
}

export function Empty({ msg }: { msg: string }) {
  return <p className="text-white/25 text-sm tracking-wider py-16 text-center">{msg}</p>;
}

export function LoadMore({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
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

function CallButton({ number, password }: { number: string | null; password: string }) {
  const [state, setState] = useState<'idle' | 'calling' | 'ringing' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  if (!number) return null;

  const call = async () => {
    const confirmMsg = `I will ring your cell, then connect you to ${formatPhone(number)} (the customer sees the store number). Proceed?`;
    if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) return;
    setState('calling');
    setMsg(null);
    try {
      await authedPost<CallResponse>('/api/admin/phone/call', password, { customer: number });
      setState('ringing');
      setMsg('Ringing your cell...');
    } catch (e) {
      setState('error');
      setMsg(e instanceof Error ? e.message : 'Call failed');
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={call}
        disabled={state === 'calling'}
        className="inline-flex items-center gap-1 text-[11px] tracking-widest uppercase text-emerald-300/80 hover:text-emerald-300 disabled:opacity-40"
      >
        {state === 'calling' ? <Spinner /> : 'Call'}
      </button>
      {msg && <span className={`text-[10px] tracking-wider ${state === 'error' ? 'text-rose-400/80' : 'text-white/40'}`}>{msg}</span>}
    </span>
  );
}

function ReplyBox({ to, password }: { to: string; password: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setState('sending');
    setMsg(null);
    try {
      const r = await authedPost<ReplyResponse>('/api/admin/phone/reply', password, { to, body });
      setState('sent');
      setText('');
      setMsg(r.stored ? 'Sent' : 'Sent (not saved to DB)');
    } catch (e) {
      setState('error');
      setMsg(e instanceof Error ? e.message : 'Send failed');
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[11px] tracking-widest uppercase text-amber-300/70 hover:text-amber-300">
        Reply
      </button>
    );
  }

  return (
    <div className="mt-1 w-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={`Reply to ${formatPhone(to)} (sent from the store toll-free number)`}
        className="w-full bg-black/30 border border-white/10 focus:border-amber-400/40 outline-none rounded px-3 py-2 text-white/80 text-sm placeholder:text-white/25 resize-none"
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] tracking-wider ${state === 'error' ? 'text-rose-400/80' : 'text-white/40'}`}>{msg}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(false)} className="text-[11px] tracking-widest uppercase text-white/30 hover:text-white/60">
            Close
          </button>
          <button
            onClick={send}
            disabled={state === 'sending' || !text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 text-black text-[11px] font-bold tracking-widest uppercase hover:bg-amber-300 disabled:opacity-40"
          >
            {state === 'sending' ? <Spinner /> : null} Send
          </button>
        </div>
      </div>
    </div>
  );
}

export function CallCard({ c, password }: { c: CallRecord; password: string }) {
  const inbound = c.direction === 'inbound';
  const other = inbound ? c.from : c.to;
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5 flex items-center gap-3">
      <span
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm ${inbound ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}
        aria-hidden
      >
        {inbound ? 'in' : 'out'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-sm truncate">{formatPhone(other)}</span>
          <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(c.startedAt)}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <StatusPill status={c.status} />
          <span className="text-white/40 text-xs">{formatDuration(c.durationSec)}</span>
          <CallButton number={other} password={password} />
        </div>
      </div>
    </div>
  );
}

export function SmsCard({ m, password }: { m: SmsRecord; password: string }) {
  const inbound = m.direction === 'inbound';
  const other = inbound ? m.from : m.to;
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm truncate flex items-center gap-2">
          <span className={inbound ? 'text-emerald-300' : 'text-amber-300'}>{inbound ? 'in' : 'out'}</span>
          {formatPhone(other)}
        </span>
        <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(m.sentAt)}</span>
      </div>
      <p className="text-white/70 text-sm mt-2 leading-relaxed whitespace-pre-wrap break-words">
        {m.body || <span className="text-white/25">(no text)</span>}
      </p>
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <StatusPill status={m.status} />
        {m.numMedia > 0 && <span className="text-white/35 text-[10px] tracking-wider uppercase">{m.numMedia} media</span>}
        <CallButton number={other} password={password} />
        <ReplyBox to={other} password={password} />
      </div>
    </div>
  );
}

export function SofiaCard({ s, password }: { s: SofiaCall; password: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-lg p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-white text-sm truncate">{formatPhone(s.from)}</span>
        <span className="text-white/30 text-xs whitespace-nowrap">{formatDateTimeET(s.startedAt)}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        <span className="text-white/40 text-xs">{formatDuration(s.durationSec)}</span>
        {s.endedReason && <span className="text-white/35 text-[10px] tracking-wider uppercase truncate">{s.endedReason}</span>}
        <CallButton number={s.from} password={password} />
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
