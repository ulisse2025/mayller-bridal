// src/app/api/health/route.ts
// Diagnostic endpoint - returns ONLY booleans (NO values) for required env vars.
// Lets us verify config on Vercel without exposing secrets.
//
// Protected with a simple ?token=... matching HEALTH_TOKEN env var to avoid
// exposing infra-shape to the public internet.

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function present(name: string): boolean {
  const v = process.env[name]
  return typeof v === 'string' && v.trim().length > 0
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const expected = process.env.HEALTH_TOKEN
  if (!expected || token !== expected) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const env = {
    // Email - Gmail SMTP
    GMAIL_USER: present('GMAIL_USER'),
    GMAIL_APP_PASSWORD: present('GMAIL_APP_PASSWORD'),
    NOTIFICATION_EMAIL: present('NOTIFICATION_EMAIL'),

    // Google Calendar - OAuth
    GOOGLE_CLIENT_ID: present('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: present('GOOGLE_CLIENT_SECRET'),
    GOOGLE_REFRESH_TOKEN: present('GOOGLE_REFRESH_TOKEN'),
    GOOGLE_CALENDAR_ID: present('GOOGLE_CALENDAR_ID'),
    GOOGLE_REDIRECT_URI: present('GOOGLE_REDIRECT_URI'),

    // Postgres
    POSTGRES_URL: present('POSTGRES_URL'),
    POSTGRES_PRISMA_URL: present('POSTGRES_PRISMA_URL'),
    POSTGRES_URL_NON_POOLING: present('POSTGRES_URL_NON_POOLING'),

    // Optional
    BUSINESS_ADDRESS: present('BUSINESS_ADDRESS'),
    TWILIO_ACCOUNT_SID: present('TWILIO_ACCOUNT_SID'),
    TWILIO_AUTH_TOKEN: present('TWILIO_AUTH_TOKEN'),
  }

  // Ready-state derived flags
  const ready = {
    email: env.GMAIL_USER && env.GMAIL_APP_PASSWORD && env.NOTIFICATION_EMAIL,
    calendar: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN,
    database: env.POSTGRES_URL || env.POSTGRES_PRISMA_URL,
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env,
    ready,
    node: process.version,
  })
}
