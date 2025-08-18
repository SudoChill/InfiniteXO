import { defineEventHandler, readBody } from 'h3'
import { getSession, joinSession } from '../utils/sessions'
import { bus } from '../utils/bus'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id: string, actorId: string }>(event)
  if (!body || !body.id || !body.actorId) return { error: 'bad_request' }
  const s = joinSession(body.id, body.actorId)
  if (!s) return { error: 'not_found' }
  // eslint-disable-next-line no-console
  console.log('[sessions.join] joined', { id: s.id, actorId: body.actorId, count: s.members.size })
  // If now we have host + at least one member, emit ready
  if ((s.kind === 'ttt' || s.kind === 'xo-battle') && s.hostId && s.members.size >= 1) {
    const second = Array.from(s.members.values())[0]
    if (second) {
      const assign: Record<string,'X'|'O'> = { }
      assign[s.hostId] = 'X'
      assign[second] = 'O'
      bus.emit('session:ready', { id: s.id, players: [s.hostId, second] as [string,string], assign, tx: (s as any).tx || 0, ty: (s as any).ty || 0, ts: Date.now() })
    }
  }
  return { ok: true }
})


