import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Setup Google Calendar</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0a;font-family:'Helvetica Neue',sans-serif;color:#fff;padding:40px 20px;min-height:100vh}
  .wrap{max-width:640px;margin:0 auto}
  h1{font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#f59e0b;margin-bottom:8px}
  .sub{color:#555;font-size:12px;letter-spacing:.15em;text-transform:uppercase;margin-bottom:40px}
  .step{display:flex;gap:20px;margin-bottom:32px;align-items:flex-start}
  .num{background:#f59e0b;color:#000;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:2px}
  .step-body h2{font-size:14px;font-weight:500;margin-bottom:8px;color:#e5e5e5}
  .step-body p{font-size:13px;color:#888;line-height:1.7}
  .step-body a{color:#f59e0b;text-decoration:none}
  .step-body a:hover{text-decoration:underline}
  code{background:#1a1a1a;border:1px solid #333;padding:2px 8px;border-radius:3px;font-size:12px;color:#4ade80;font-family:monospace}
  .box{background:#111;border:1px solid #222;border-radius:6px;padding:20px;margin-top:10px}
  .box p{font-size:12px;color:#666;margin-bottom:8px}
  .box code{display:block;color:#4ade80;font-size:12px;line-height:2;background:none;border:none;padding:0}
  .warn{background:#1a1100;border:1px solid #f59e0b33;border-radius:6px;padding:16px 20px;margin-bottom:32px;font-size:13px;color:#f59e0b}
</style>
</head>
<body>
<div class="wrap">
  <h1>✦ Setup Google Calendar</h1>
  <p class="sub">Mayller Booking System</p>

  <div class="warn">
    ⚠ <strong>GOOGLE_CLIENT_ID</strong> e <strong>GOOGLE_CLIENT_SECRET</strong> non sono ancora configurati in <code>.env.local</code>.<br>
    Segui i passi qui sotto, poi riapri questa pagina.
  </div>

  <div class="step">
    <div class="num">1</div>
    <div class="step-body">
      <h2>Crea un progetto Google Cloud</h2>
      <p>Vai su <a href="https://console.cloud.google.com" target="_blank">console.cloud.google.com</a> → clic su <strong>Select a project</strong> → <strong>New Project</strong><br>
      Nome: <code>Mayller Booking</code> → clic <strong>Create</strong></p>
    </div>
  </div>

  <div class="step">
    <div class="num">2</div>
    <div class="step-body">
      <h2>Abilita Google Calendar API</h2>
      <p>Nel menu laterale → <strong>APIs &amp; Services → Library</strong><br>
      Cerca <code>Google Calendar API</code> → clic → <strong>Enable</strong></p>
    </div>
  </div>

  <div class="step">
    <div class="num">3</div>
    <div class="step-body">
      <h2>Crea le credenziali OAuth2</h2>
      <p><strong>APIs &amp; Services → Credentials → Create Credentials → OAuth 2.0 Client ID</strong><br><br>
      · Application type: <code>Web application</code><br>
      · Name: <code>Mayller Booking</code><br>
      · Authorized redirect URIs → <strong>Add URI</strong>:<br>
      &nbsp;&nbsp;<code>http://localhost:3000/api/auth/google/callback</code><br><br>
      Clic <strong>Create</strong> → si apre un popup con Client ID e Client Secret.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">4</div>
    <div class="step-body">
      <h2>Configura OAuth Consent Screen</h2>
      <p>Se richiesto → <strong>OAuth consent screen</strong><br>
      · User type: <code>External</code> → Create<br>
      · App name: <code>Mayller Booking</code><br>
      · Support email: il tuo email<br>
      · Scopes: lascia default per ora → Save<br>
      · Test users → aggiungi <code>mayllerbridalitalianstyle@gmail.com</code></p>
    </div>
  </div>

  <div class="step">
    <div class="num">5</div>
    <div class="step-body">
      <h2>Incolla in .env.local</h2>
      <div class="box">
        <p>Apri il file <code>.env.local</code> nella root del progetto e inserisci:</p>
        <code>GOOGLE_CLIENT_ID=il_client_id_copiato</code>
        <code>GOOGLE_CLIENT_SECRET=il_client_secret_copiato</code>
      </div>
      <p style="margin-top:12px;color:#666;font-size:12px">Poi riavvia il server dev e riapri questa pagina — vedrai il pulsante per autorizzare.</p>
    </div>
  </div>
</div>
</body>
</html>`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }

  const url = getAuthUrl()
  return NextResponse.redirect(url)
}
