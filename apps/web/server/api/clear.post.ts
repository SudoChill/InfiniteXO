import { defineEventHandler, readBody, getHeader, setResponseStatus } from 'h3'
import { db } from '../utils/db'
import { tiles } from '../../drizzle/schema'
import { bus } from '../utils/bus'

export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'x-admin') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || token !== secret) {
    setResponseStatus(event, 401)
    return { error: 'unauthorized' }
  }
  const body = (await readBody(event)) as { scope?: 'all' }
  if (body?.scope !== 'all') return { error: 'unsupported_scope' }
  await db.delete(tiles)
  bus.emit('grid:clear', { ts: Date.now() })
  return { ok: true }
})


