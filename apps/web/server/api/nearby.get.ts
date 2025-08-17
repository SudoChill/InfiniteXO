import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const x = Number(q.x)
  const y = Number(q.y)
  return { x, y, playersNearby: Math.floor(Math.random() * 5), lastUpdates: Date.now() - Math.floor(Math.random() * 10000) }
})


