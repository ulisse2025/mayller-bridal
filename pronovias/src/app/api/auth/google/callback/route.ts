import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return new NextResponse('Missing code', { status: 400 })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Google Calendar — Setup</title>
<style>
  body{margin:0;padding:40px;background:#0a0a0a;font-family:monospace;color:#fff}
  h1{font-size:16px;letter-spacing:.2em;color:#f59e0b;text-transform:uppercase;margin-bottom:24px}
  .box{background:#111;border:1px solid #333;padding:20px;border-radius:4px;margin-bottom:16px}
  .label{font-size:10px;letter-spacing:.2em;color:#888;text-transform:uppercase;margin-bottom:6px}
  .val{font-size:13px;color:#4ade80;word-break:break-all}
  .note{font-size:12px;color:#666;margin-top:24px;line-height:1.8}
  strong{color:#f59e0b}
</style>
</head>
<body>
<h1>✦ Autorizzazione completata</h1>
<div class="box">
  <div class="label">Refresh Token</div>
  <div class="val">${tokens.refresh_token ?? '— (già emesso in precedenza, usa quello esistente)'}</div>
</div>
<div class="note">
  <strong>Istruzioni:</strong><br>
  1. Copia il Refresh Token qui sopra<br>
  2. Aprì il file <strong>.env.local</strong><br>
  3. Incolla il valore in <strong>GOOGLE_REFRESH_TOKEN=</strong><br>
  4. Riavvia il server dev<br>
  5. Questa pagina non serve più — puoi chiuderla
</div>
</body>
</html>`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  } catch (err) {
    console.error('OAuth callback error:', err)
    return new NextResponse('Errore durante lo scambio del token. Controlla la console.', { status: 500 })
  }
}
