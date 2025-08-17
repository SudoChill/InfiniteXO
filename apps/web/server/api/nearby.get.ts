import { defineEventHandler, getQuery } from 'h3'
import { listSessionsNear } from '../utils/sessions'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const x = Number(q.x)
  const y = Number(q.y)
  const cx = Math.floor((x||0)/128)
  const cy = Math.floor((y||0)/128)
  const sessions = listSessionsNear(cx, cy, 8).length
  return { x, y, playersNearby: Math.floor(Math.random() * 5), sessionsNearby: sessions, lastUpdates: Date.now() - Math.floor(Math.random() * 10000) }
})


