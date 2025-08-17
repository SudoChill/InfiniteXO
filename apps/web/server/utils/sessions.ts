import { randomUUID } from 'node:crypto'

export type SessionKind = 'ttt' | 'mine' | 'xo-battle'

export interface PlaySession {
  id: string
  kind: SessionKind
  hostId?: string
  name?: string
  // chunk anchored rectangle in chunk coords
  cx: number
  cy: number
  width: number
  height: number
  // optional tile anchor for 3x3 grid
  tx?: number
  ty?: number
  createdAt: number
  members: Set<string>
}

const sessions = new Map<string, PlaySession>()

export function clearAllSessions() { sessions.clear() }

export function leaveAllSessions(actorId: string) {
  for (const [id, s] of sessions) {
    if (s.hostId === actorId) {
      sessions.delete(id)
      continue
    }
    if (s.members.has(actorId)) s.members.delete(actorId)
  }
}

export function createSession(input: Omit<PlaySession, 'id' | 'createdAt' | 'members'>) {
  // ensure one session per host
  if (input.hostId) {
    for (const s of sessions.values()) {
      if (s.hostId === input.hostId) {
        // update existing
        s.kind = input.kind
        s.cx = input.cx
        s.cy = input.cy
        s.width = input.width
        s.height = input.height
        s.name = input.name
        s.tx = input.tx
        s.ty = input.ty
        return s
      }
    }
  }
  const id = randomUUID()
  const sess: PlaySession = { id, createdAt: Date.now(), members: new Set(), ...input }
  sessions.set(id, sess)
  return sess
}

export function getSession(id: string) { return sessions.get(id) }

export function listSessionsNear(cx: number, cy: number, radius = 2) {
  const out: PlaySession[] = []
  for (const s of sessions.values()) {
    if (Math.abs(s.cx - cx) <= radius && Math.abs(s.cy - cy) <= radius) out.push(s)
  }
  return out
}

export function joinSession(id: string, actorId: string) {
  const s = sessions.get(id); if (!s) return null
  s.members.add(actorId)
  return s
}

export function leaveSession(id: string, actorId: string) {
  const s = sessions.get(id); if (!s) return null
  s.members.delete(actorId)
  return s
}


