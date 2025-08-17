import { defineStore } from 'pinia'

export type TileValue = null | 'X' | 'O'

export interface TileEntry { lx: number; ly: number; v: Exclude<TileValue, null>; updatedAt: number }
export interface ChunkData { cx: number; cy: number; tiles: Map<string, TileEntry> }

function keyFor(lx: number, ly: number) { return `${lx}:${ly}` }
function roomFor(cx: number, cy: number) { return `chunk:${cx}:${cy}` }

export const useChunksStore = defineStore('chunks', {
  state: () => ({
    chunkSize: useRuntimeConfig().chunkSize as number,
    value: 'X' as Exclude<TileValue, null>,
    chunks: new Map<string, ChunkData>(),
    lru: [] as string[],
    maxChunks: 256,
    debug: { showChunkBorders: true },
    joinedRooms: new Set<string>(),
    _sendWs: null as null | ((payload: any) => void),
    presence: new Map<string, number>(),
    sessionScore: 0,
    teamScore: { X: 0, O: 0 } as { X: number, O: number },
    cursors: new Map<string, { tx: number, ty: number, name?: string, ts: number }>(),
    sessions: new Map<string, { id: string, kind: string, name?: string, cx: number, cy: number, width: number, height: number }>()
  }),
  actions: {
    _registerWsSender(fn: (payload: any) => void) { this._sendWs = fn },
    getChunk(cx: number, cy: number) {
      return this.chunks.get(`${cx}:${cy}`)
    },
    ensureWindow(rect: { cx0: number, cy0: number, cx1: number, cy1: number }) {
      const req: Array<{ cx: number, cy: number }> = []
      for (let cy = rect.cy0; cy <= rect.cy1; cy++) {
        for (let cx = rect.cx0; cx <= rect.cx1; cx++) {
          const key = `${cx}:${cy}`
          if (!this.chunks.has(key)) req.push({ cx, cy })
          if (!this.joinedRooms.has(roomFor(cx, cy)) && this._sendWs) {
            const room = roomFor(cx, cy)
            this._sendWs({ type: 'join', room })
            this.joinedRooms.add(room)
          }
        }
      }
      if (req.length) this.fetchChunksBatched(rect)
      this.enforceLRU()
    },
    enforceLRU() {
      while (this.lru.length > this.maxChunks) {
        const key = this.lru.shift()
        if (key) {
          this.chunks.delete(key)
          if (this.joinedRooms.has(key)) this._sendWs?.({ type: 'leave', room: key })
          this.joinedRooms.delete(key)
        }
      }
    },
    async fetchChunksBatched(rect: { cx0: number, cy0: number, cx1: number, cy1: number }) {
      const centerCx = Math.trunc((rect.cx0 + rect.cx1) / 2)
      const centerCy = Math.trunc((rect.cy0 + rect.cy1) / 2)
      const radius = Math.max(centerCx - rect.cx0, rect.cx1 - centerCx, centerCy - rect.cy0, rect.cy1 - centerCy)
      const res = await $fetch<{ data: Array<{ cx: number, cy: number, tiles: Array<{ lx: number, ly: number, v: 'X'|'O', updatedAt: number }> }> }>('/api/chunks', { query: { cx: centerCx, cy: centerCy, radius } })
      for (const item of (res?.data || [])) {
        const key = `${item.cx}:${item.cy}`
        const map = new Map<string, TileEntry>()
        for (const t of item.tiles) map.set(keyFor(t.lx, t.ly), t)
        this.chunks.set(key, { cx: item.cx, cy: item.cy, tiles: map })
        this.touch(key)
      }
    },
    touch(key: string) {
      const i = this.lru.indexOf(key)
      if (i >= 0) this.lru.splice(i, 1)
      this.lru.push(key)
    },
    applyTileUpdate(cx: number, cy: number, lx: number, ly: number, v: TileEntry['v']) {
      const key = `${cx}:${cy}`
      let chunk = this.chunks.get(key)
      if (!chunk) {
        chunk = { cx, cy, tiles: new Map() }
        this.chunks.set(key, chunk)
      }
      const entry: TileEntry = { lx, ly, v, updatedAt: Date.now() }
      chunk.tiles.set(keyFor(lx, ly), entry)
      this.touch(key)
    },
    addScore(delta: number) {
      this.sessionScore += delta
    },
    updateCursor(actorId: string, tx: number, ty: number, name?: string) {
      this.cursors.set(actorId, { tx, ty, name, ts: Date.now() })
    },
    purgeOldCursors(maxAgeMs = 4000) {
      const now = Date.now()
      for (const [id, c] of this.cursors) if (now - c.ts > maxAgeMs) this.cursors.delete(id)
    },
    setTeamScore(scores: { X: number, O: number }) {
      this.teamScore = scores
    },
    upsertSession(s: { id: string, kind: string, name?: string, cx: number, cy: number, width: number, height: number }) {
      this.sessions.set(s.id, s)
    },
    applyPresence(room: string, count: number) {
      this.presence.set(room, count)
    },
    async placeAtGlobal(tx: number, ty: number) {
      const cx = Math.floor(tx / this.chunkSize)
      const cy = Math.floor(ty / this.chunkSize)
      const lx = ((tx % this.chunkSize) + this.chunkSize) % this.chunkSize
      const ly = ((ty % this.chunkSize) + this.chunkSize) % this.chunkSize
      // optimistic
      this.applyTileUpdate(cx, cy, lx, ly, this.value)
      try {
        const session = useNuxtApp().$pinia.state.value['session'] as any
        const actorId = session?.actorId || ''
        const res = await $fetch('/api/place', { method: 'POST', body: { x: tx, y: ty, v: this.value, actorId } })
        // @ts-expect-error
        const t = res.tile
        if (t) this.applyTileUpdate(t.cx, t.cy, t.lx, t.ly, t.v)
      } catch (e) {
        // ignore for MVP
      }
    }
  }
})


