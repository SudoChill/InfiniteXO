import { db } from './db'
import { chunks, tiles } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 128)

export async function getTileValue(tx: number, ty: number): Promise<'X' | 'O' | null> {
  const cx = Math.floor(tx / CHUNK_SIZE)
  const cy = Math.floor(ty / CHUNK_SIZE)
  const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  const [chunk] = await db.select().from(chunks).where(and(eq(chunks.cx, cx), eq(chunks.cy, cy)))
  if (!chunk) return null
  const [row] = await db
    .select()
    .from(tiles)
    .where(and(eq(tiles.chunkId, chunk.id!), eq(tiles.lx, lx), eq(tiles.ly, ly)))
  return row ? (row.v as 'X' | 'O') : null
}

export async function createdStreak(tx: number, ty: number, v: 'X' | 'O'): Promise<boolean> {
  // Check 4 directions for length >= 3 including placed tile
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ] as const
  for (const [dx, dy] of dirs) {
    let count = 1
    // forward up to 2
    for (let step = 1; step <= 2; step++) {
      const val = await getTileValue(tx + dx * step, ty + dy * step)
      if (val === v) count++
      else break
    }
    // backward up to 2
    for (let step = 1; step <= 2; step++) {
      const val = await getTileValue(tx - dx * step, ty - dy * step)
      if (val === v) count++
      else break
    }
    if (count >= 3) return true
  }
  return false
}


