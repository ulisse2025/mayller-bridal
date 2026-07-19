import { NextRequest, NextResponse } from 'next/server'
import { getFollowUps, ensureCrmTables } from '@/lib/crm'

function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// GET /api/admin/crm/follow-ups — clients due/overdue for follow-up
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureCrmTables()
    const clients = await getFollowUps()
    return NextResponse.json({ clients })
  } catch (err) {
    console.error('CRM follow-ups GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 })
  }
}
