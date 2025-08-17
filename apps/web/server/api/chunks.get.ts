import { defineEventHandler, getQuery } from 'h3'
import { db } from '../utils/db'
import { tiles, chunks } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const cx = Number(q.cx)
  const cy = Number(q.cy)
  const radius = q.radius !== undefined ? Number(q.radius) : undefined

  // Batched rectangle mode
  if (Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(radius) && (radius as number) >= 0) {
    const r = Math.max(0, Math.trunc(radius as number))
    const data: Array<{ cx: number; cy: number; tiles: Array<{ lx: number; ly: number; v: 'X'|'O'; updatedAt: number }> }> = []
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const [chunk] = await db.select().from(chunks).where(and(eq(chunks.cx, x), eq(chunks.cy, y)))
        if (!chunk) { data.push({ cx: x, cy: y, tiles: [] }); continue }
        const rows = await db.select().from(tiles).where(eq(tiles.chunkId, chunk.id))
        data.push({ cx: x, cy: y, tiles: rows.map((r) => ({ lx: r.lx, ly: r.ly, v: r.v as 'X'|'O', updatedAt: Number(r.updatedAt) })) })
      }
    }
    return { data }
  }

  // Single-chunk fallback
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return { tiles: [] }
  const [chunk] = await db.select().from(chunks).where(and(eq(chunks.cx, cx), eq(chunks.cy, cy)))
  if (!chunk) return { tiles: [] }
  const rows = await db.select().from(tiles).where(eq(tiles.chunkId, chunk.id))
  return { tiles: rows.map((r) => ({ lx: r.lx, ly: r.ly, v: r.v as 'X' | 'O', updatedAt: Number(r.updatedAt) })) }
})


