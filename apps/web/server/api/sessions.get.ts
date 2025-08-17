import { defineEventHandler, getQuery } from 'h3'
import { listSessionsNear } from '../utils/sessions'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const cx = Number(q.cx), cy = Number(q.cy)
  const radius = q.radius !== undefined ? Number(q.radius) : 4
  const data = Number.isFinite(cx) && Number.isFinite(cy) ? listSessionsNear(cx, cy, radius) : []
  return { data: data.map(s => ({ id: s.id, kind: s.kind, name: s.name, hostId: s.hostId, cx: s.cx, cy: s.cy, width: s.width, height: s.height, tx: (s as any).tx, ty: (s as any).ty, count: s.members.size })) }
})


