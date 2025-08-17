import { defineEventHandler, getQuery } from 'h3'
import { db } from '../utils/db'
import { tiles, chunks } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const cx = Number(q.cx)
  const cy = Number(q.cy)
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return { tiles: [] }

  const [chunk] = await db.select().from(chunks).where(and(eq(chunks.cx, cx), eq(chunks.cy, cy)))
  if (!chunk) return { tiles: [] }
  const rows = await db.select().from(tiles).where(eq(tiles.chunkId, chunk.id))
  return { tiles: rows.map((r) => ({ lx: r.lx, ly: r.ly, v: r.v as 'X' | 'O', updatedAt: Number(r.updatedAt) })) }
})


