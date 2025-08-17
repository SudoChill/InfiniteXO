import { defineEventHandler, readBody, getRequestIP } from 'h3'
import { db } from '../utils/db'
import { chunks, tiles } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { bus } from '../utils/bus'
import { rateLimit } from '../utils/rateLimit'
import { createdStreak } from '../utils/grid'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ x: number; y: number; v: 'X' | 'O'; actorId?: string; name?: string }>(event)
  const cs = Number(process.env.CHUNK_SIZE || 128)
  const ip = getRequestIP(event) || 'anon'
  if (!rateLimit(ip)) return { error: 'rate_limited' }

  if (!body || !['X', 'O'].includes(body.v)) return { error: 'bad_request' }
  const tx = Math.trunc(body.x)
  const ty = Math.trunc(body.y)
  const cx = Math.floor(tx / cs)
  const cy = Math.floor(ty / cs)
  const lx = ((tx % cs) + cs) % cs
  const ly = ((ty % cs) + cs) % cs

  let [chunk] = await db.select().from(chunks).where(and(eq(chunks.cx, cx), eq(chunks.cy, cy)))
  if (!chunk) {
    const inserted = await db.insert(chunks).values({ cx, cy, updatedAt: String(Date.now()) }).returning()
    chunk = inserted[0]
    if (!chunk) {
      // Fallback: fetch once more
      const refetch = await db.select().from(chunks).where(and(eq(chunks.cx, cx), eq(chunks.cy, cy)))
      chunk = refetch[0]
    }
  }
  if (!chunk) return { error: 'chunk_create_failed' }

  const existing = await db.select().from(tiles).where(and(eq(tiles.chunkId, chunk.id!), eq(tiles.lx, lx), eq(tiles.ly, ly)))
  const current = existing[0]
  if (current) {
    // already placed; treat as update only if different
    if (current.v !== body.v) {
      await db.update(tiles).set({ v: body.v, updatedAt: String(Date.now()) }).where(and(eq(tiles.chunkId, chunk.id!), eq(tiles.lx, lx), eq(tiles.ly, ly)))
    }
  } else {
    await db.insert(tiles).values({ chunkId: chunk.id!, lx, ly, v: body.v, updatedAt: String(Date.now()) })
  }

  const payload = { type: 'tile:update', cx, cy, lx, ly, v: body.v, ts: Date.now(), actorId: body.actorId }
  bus.emit('tile:update', payload)

  // scoring: 3-in-a-row grants a point
  const streak = await createdStreak(tx, ty, body.v)
  if (streak) {
    bus.emit('tile:update', { ...payload, score: 1 })
  }

  return { tile: { cx, cy, lx, ly, v: body.v, ts: Date.now(), actorId: body.actorId }, streak }
})


