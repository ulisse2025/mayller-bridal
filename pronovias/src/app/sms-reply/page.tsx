'use client';

// ============================================================
// MAYLLER BRIDAL — Quick SMS reply page (private, link-only)
// pronovias/src/app/sms-reply/page.tsx
//
// Opened from the "Reply" button in the inbound-SMS email.
// Reads ?to=<customer>&t=<token> from the URL, lets the shop
// type a reply, and posts it to /api/sms/reply-send, which sends
// from the toll-free number. The shop's personal number is never
// exposed.
// ============================================================

import { useEffect, useState } from 'react';

export default function SmsReplyPage() {
  const [to, setTo] = useState('');
  const [token, setToken] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTo(sp.get('to') || '');
    setToken(sp.get('t') || '');
  }, []);

  async function send() {
    if (!body.trim()) return;
    setStatus('sending');
    setError('');
    try {
      const resp = await fetch('/api/sms/reply-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body, t: token }),
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json.ok) {
        setStatus('sent');
        setBody('');
      } else {
        setStatus('error');
        setError(json.error || 'Send failed');
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Send failed');
    }
  }

  const wrap: React.CSSProperties = {
    fontFamily: '-apple-system,BlinkMacSystemFont,Helvetica,sans-serif',
    background: '#faf9f5',
    minHeight: '100vh',
    margin: 0,
    padding: '24px',
    color: '#1a1a1a',
  };
  const card: React.CSSProperties = {
    maxWidth: 480,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #ece8db',
    borderRadius: 4,
    overflow: 'hidden',
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div
          style={{
            background: '#1a1a1a',
            color: '#fff',
            padding: '18px 24px',
            letterSpacing: '.25em',
            fontSize: 11,
            textTransform: 'uppercase',
          }}
        >
          Reply by SMS
        </div>
        <div style={{ padding: '24px' }}>
          <label style={{ fontSize: 11, color: '#888', letterSpacing: '.15em', textTransform: 'uppercase' }}>
            To
          </label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              margin: '6px 0 18px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 15,
            }}
          />

          <label style={{ fontSize: 11, color: '#888', letterSpacing: '.15em', textTransform: 'uppercase' }}>
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Type your reply…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              margin: '6px 0 6px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 15,
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>{body.length} chars</div>

          <button
            onClick={send}
            disabled={status === 'sending' || !body.trim() || !to}
            style={{
              width: '100%',
              background: status === 'sending' ? '#777' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              padding: '14px',
              fontSize: 13,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              cursor: status === 'sending' ? 'default' : 'pointer',
              borderRadius: 4,
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send reply'}
          </button>

          {status === 'sent' && (
            <p style={{ color: '#2e7d32', fontSize: 14, marginTop: 16 }}>✓ Sent. Reply delivered from the toll-free number.</p>
          )}
          {status === 'error' && (
            <p style={{ color: '#c00', fontSize: 14, marginTop: 16 }}>✗ {error}</p>
          )}

          <p style={{ color: '#aaa', fontSize: 11, marginTop: 20, lineHeight: 1.5 }}>
            Sent from the Mayller toll-free number. Your personal number stays private.
          </p>
        </div>
      </div>
    </div>
  );
}
