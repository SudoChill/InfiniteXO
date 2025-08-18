import { defineEventHandler, readBody } from 'h3'
import { createSession } from '../utils/sessions'
import { bus } from '../utils/bus'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ kind: 'ttt'|'mine'|'xo-battle', cx: number, cy: number, tx?: number, ty?: number, width?: number, height?: number, name?: string, hostId?: string }>(event)
  if (!body || !['ttt','mine','xo-battle'].includes(body.kind)) return { error: 'bad_request' }
  const sess = createSession({ kind: body.kind, cx: Math.trunc(body.cx), cy: Math.trunc(body.cy), width: body.width || 1, height: body.height || 1, name: body.name, hostId: body.hostId, tx: Math.trunc(body.tx || 0), ty: Math.trunc(body.ty || 0) } as any)
  // Debug log for server visibility
  // eslint-disable-next-line no-console
  console.log('[sessions.post] created', { id: sess.id, kind: sess.kind, cx: sess.cx, cy: sess.cy })
  bus.emit('session:create', { id: sess.id, kind: sess.kind, name: sess.name, cx: sess.cx, cy: sess.cy, width: sess.width, height: sess.height, ts: Date.now() })
  // Do not emit ready here; wait until a second player joins via /api/sessions-join
  return { id: sess.id }
})


