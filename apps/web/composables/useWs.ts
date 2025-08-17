import { onMounted, onUnmounted } from 'vue'
import { useChunksStore } from '~/stores/chunks'

export function useWs() {
  const store = useChunksStore()
  let ws: WebSocket | null = null
  const queue: any[] = []

  function safeSend(payload: any) {
    if (!ws) {
      queue.push(payload)
      return
    }
    if (ws.readyState !== WebSocket.OPEN) {
      queue.push(payload)
      return
    }
    try {
      ws.send(JSON.stringify(payload))
    } catch {
      queue.push(payload)
    }
  }

  function flushQueue() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    while (queue.length) {
      const item = queue.shift()
      try {
        ws.send(JSON.stringify(item))
      } catch {
        // push back and break to retry later
        queue.unshift(item)
        break
      }
    }
  }

  function connect() {
    const base = useRuntimeConfig().public.wsUrl || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
    ws = new WebSocket(base + '/ws')
    ws.onopen = () => {
      // join any previously requested rooms
      for (const key of store.joinedRooms) safeSend({ type: 'join', room: key })
      flushQueue()
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string)
        if (msg.type === 'tile:update') {
          store.applyTileUpdate(msg.cx, msg.cy, msg.lx, msg.ly, msg.v)
          if (typeof msg.score === 'number') store.addScore(msg.score)
        } else if (msg.type === 'presence:update') {
          store.applyPresence(msg.room, msg.count)
        } else if (msg.type === 'grid:clear') {
          // Reset chunks without losing config
          store.chunks.clear()
          store.lru = []
        } else if (msg.type === 'cursor:update') {
          // TODO: render remote cursors (client-side overlay)
        }
      } catch {}
    }
    ws.onclose = () => {
      setTimeout(connect, 1000)
    }
    store._registerWsSender(safeSend)
  }

  onMounted(connect)
  onUnmounted(() => ws?.close())
}


