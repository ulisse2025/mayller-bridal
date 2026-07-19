import { NextRequest, NextResponse } from 'next/server'
import { getClients, ensureCrmTables } from '@/lib/crm'

// Auth helper — reuses existing admin password pattern
function checkAuth(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password')
  return pw === process.env.ADMIN_PASSWORD
}

// GET /api/admin/crm/clients — list all clients
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureCrmTables()
    const clients = await getClients()
    return NextResponse.json({ clients })
  } catch (err) {
    console.error('CRM clients GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
