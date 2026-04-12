import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/firebase-admin'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return NextResponse.json({ uid: user.uid, email: user.email })
}
