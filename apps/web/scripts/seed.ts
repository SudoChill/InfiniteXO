import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../drizzle/schema'

const dbPath = process.env.DATABASE_URL || './.data/xo.db'
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

async function main() {
  await sqlite.exec('PRAGMA journal_mode = WAL;')
  // ensure tables
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chunk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cx INTEGER NOT NULL,
      cy INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (cx, cy)
    );
    CREATE TABLE IF NOT EXISTS tile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chunk_id INTEGER NOT NULL,
      lx INTEGER NOT NULL,
      ly INTEGER NOT NULL,
      v TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (chunk_id, lx, ly),
      FOREIGN KEY (chunk_id) REFERENCES chunk(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS chunk_summary (
      chunk_id INTEGER PRIMARY KEY,
      filled INTEGER NOT NULL,
      last_event_at TEXT NOT NULL,
      FOREIGN KEY (chunk_id) REFERENCES chunk(id) ON DELETE CASCADE
    );
  `)
  // simple seed: (0,0) chunk with a few tiles
  const now = String(Date.now())
  const [chunk] = await db.insert(schema.chunks).values({ cx: 0, cy: 0, updatedAt: now }).onConflictDoNothing().returning()
  const chunkId = chunk?.id || (await db.select().from(schema.chunks)).find(c => c.cx === 0 && c.cy === 0)!.id
  const tiles = [
    { lx: 1, ly: 1, v: 'X' as const },
    { lx: 2, ly: 2, v: 'O' as const },
    { lx: 3, ly: 3, v: 'X' as const }
  ]
  for (const t of tiles) {
    await db.insert(schema.tiles).values({ chunkId, lx: t.lx, ly: t.ly, v: t.v, updatedAt: now }).onConflictDoNothing()
  }
  console.log('Seeded database at', dbPath)
}

main()


