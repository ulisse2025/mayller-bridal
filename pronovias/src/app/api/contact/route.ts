import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    const notificationEmail = process.env.NOTIFICATION_EMAIL

    if (gmailUser && gmailPass && !gmailPass.startsWith('xxxx')) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      })
      await transporter.sendMail({
        from: `"Mayller Contact Form" <${gmailUser}>`,
        to: notificationEmail,
        replyTo: email,
        subject: `✦ Contact — ${subject}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
body{margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
.wrap{max-width:580px;margin:32px auto;background:#fff}
.hdr{background:#0a0a0a;padding:40px;text-align:center}
.hdr-brand{color:#fff;font-size:24px;font-weight:300;letter-spacing:.35em;margin:0}
.hdr-sub{color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.3em;text-transform:uppercase;margin:8px 0 0}
.badge{display:inline-block;background:#b45309;color:#fff;font-size:9px;letter-spacing:.25em;text-transform:uppercase;padding:6px 14px;margin-top:16px}
.body{padding:40px}
.lbl{color:#aaa;font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px}
.val{color:#1a1a1a;font-size:14px;line-height:1.6;margin-bottom:20px}
.msg{background:#f9f7f4;padding:20px;border-left:3px solid #b45309;color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap}
.ftr{background:#f5f5f0;padding:20px 40px;text-align:center;font-size:10px;color:#bbb;letter-spacing:.2em;text-transform:uppercase}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <p class="hdr-brand">MAYLLER</p>
    <p class="hdr-sub">Contact Form</p>
    <div class="badge">New Message</div>
  </div>
  <div class="body">
    <div class="lbl">From</div><div class="val">${name} &lt;<a href="mailto:${email}" style="color:#b45309;text-decoration:none">${email}</a>&gt;</div>
    <div class="lbl">Subject</div><div class="val">${subject}</div>
    <div class="lbl">Message</div>
    <div class="msg">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  <div class="ftr">Mayller Bridal · Barcelona</div>
</div>
</body></html>`,
      })
    } else {
      console.log('CONTACT FORM:', { name, email, subject, message })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Internal error. Please try again.' }, { status: 500 })
  }
}
