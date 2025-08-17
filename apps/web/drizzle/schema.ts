import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const chunks = sqliteTable('chunk', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cx: integer('cx').notNull(),
  cy: integer('cy').notNull(),
  updatedAt: text('updated_at').notNull()
}, (t) => ({
  cx_cy_unique: uniqueIndex('chunk_cx_cy_unique').on(t.cx, t.cy)
}))

export const tiles = sqliteTable('tile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chunkId: integer('chunk_id').notNull().references(() => chunks.id),
  lx: integer('lx').notNull(),
  ly: integer('ly').notNull(),
  v: text('v', { length: 1 }).notNull(),
  updatedAt: text('updated_at').notNull()
}, (t) => ({
  tile_unique: uniqueIndex('tile_chunk_lx_ly_unique').on(t.chunkId, t.lx, t.ly)
}))

export const chunkSummary = sqliteTable('chunk_summary', {
  chunkId: integer('chunk_id').primaryKey().references(() => chunks.id),
  filled: integer('filled').notNull(),
  lastEventAt: text('last_event_at').notNull()
})


