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
    _sendWs: null as null | ((payload: any) => void)
  }),
  actions: {
    _registerWsSender(fn: (payload: any) => void) { this._sendWs = fn },
    getChunk(cx: number, cy: number) {
      return this.chunks.get(`${cx}:${cy}`)
    },
    ensureWindow(rect: { cx0: number, cy0: number, cx1: number, cy1: number }) {
      const radius = 0
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
      if (req.length) this.fetchChunks(req)
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
    async fetchChunks(list: Array<{ cx: number, cy: number }>) {
      const qs = new URLSearchParams()
      // batched by simple API per-item, MVP fallback: loop
      for (const { cx, cy } of list) {
        qs.set('cx', String(cx))
        qs.set('cy', String(cy))
        const res = await $fetch<{ tiles: Array<{ lx: number, ly: number, v: 'X'|'O', updatedAt: number }> }>('/api/chunks', { query: qs })
        const tiles = res?.tiles || []
        const key = `${cx}:${cy}`
        const map = new Map<string, TileEntry>()
        for (const t of tiles) map.set(keyFor(t.lx, t.ly), t)
        this.chunks.set(key, { cx, cy, tiles: map })
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
    async placeAtGlobal(tx: number, ty: number) {
      const cx = Math.floor(tx / this.chunkSize)
      const cy = Math.floor(ty / this.chunkSize)
      const lx = ((tx % this.chunkSize) + this.chunkSize) % this.chunkSize
      const ly = ((ty % this.chunkSize) + this.chunkSize) % this.chunkSize
      // optimistic
      this.applyTileUpdate(cx, cy, lx, ly, this.value)
      try {
        const res = await $fetch('/api/place', { method: 'POST', body: { x: tx, y: ty, v: this.value } })
        // @ts-expect-error
        const t = res.tile
        if (t) this.applyTileUpdate(t.cx, t.cy, t.lx, t.ly, t.v)
      } catch (e) {
        // ignore for MVP
      }
    }
  }
})


