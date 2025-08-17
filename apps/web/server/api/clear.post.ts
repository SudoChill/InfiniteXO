import { defineEventHandler, readBody, getHeader, setResponseStatus } from 'h3'
import { db } from '../utils/db'
import { tiles } from '../../drizzle/schema'
import { bus } from '../utils/bus'
import { clearAllSessions, leaveAllSessions } from '../utils/sessions'

export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'x-admin') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || token !== secret) {
    setResponseStatus(event, 401)
    return { error: 'unauthorized' }
  }
  const body = (await readBody(event)) as { scope?: 'all' | 'mine', actorId?: string }
  if (body?.scope === 'mine') {
    if (!body.actorId) return { error: 'bad_request' }
    // For user reset: delete tiles by actor is not tracked in DB yet; we only remove from sessions.
    leaveAllSessions(body.actorId)
    return { ok: true }
  }
  if (body?.scope !== 'all') return { error: 'unsupported_scope' }
  await db.delete(tiles)
  clearAllSessions()
  bus.emit('grid:clear', { ts: Date.now() })
  return { ok: true }
})


