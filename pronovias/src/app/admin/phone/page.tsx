// ============================================================
// MAYLLER PHONE — protected dashboard page (client)
// pronovias/src/app/admin/phone/page.tsx
//
// Login gate reuses the EXACT existing /admin pattern:
//   - password kept in sessionStorage ('mayller-admin-pw')
//   - verified via POST /api/admin/verify
//   - sent as 'x-admin-password' on every data request
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PhoneDashboard from '@/components/admin/phone/PhoneDashboard';
import RegisterSW from '@/components/admin/phone/RegisterSW';

const PW_KEY = 'mayller-admin-pw';

export default function MayllerPhonePage() {
  const [pw, setPw] = useState('');
  const [auth, setAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [checking, setChecking] = useState(false);

  // Restore a previously verified session (same key as the photo admin).
  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      setPw(saved);
      setAuth(true);
    }
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setChecking(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, pw);
        setAuth(true);
      } else {
        setAuthError('Incorrect password.');
      }
    } catch {
      setAuthError('Network error. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(PW_KEY);
    setAuth(false);
    setPw('');
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <p className="text-white/20 text-xs tracking-[0.4em] uppercase mb-3">Mayller</p>
            <h1 className="text-2xl font-light tracking-[0.3em] text-white">PHONE</h1>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              className="w-full bg-transparent border border-white/15 focus:border-amber-400/50 outline-none px-4 py-4 text-white text-sm placeholder:text-white/20 tracking-wider"
            />
            {authError && <p className="text-red-400 text-xs tracking-wider">{authError}</p>}
            <button
              type="submit"
              disabled={checking}
              className="w-full py-4 bg-amber-400 text-black text-xs font-bold tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {checking ? 'Checking…' : 'Sign In'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link href="/admin" className="text-white/20 text-xs tracking-widest hover:text-white/50 transition-colors">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <RegisterSW />
      <PhoneDashboard password={pw} onLogout={logout} />
    </>
  );
}
