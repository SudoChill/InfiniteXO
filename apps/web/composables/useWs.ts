import { onMounted, onUnmounted } from 'vue'
import { useChunksStore } from '~/stores/chunks'
import { useUiStore } from '~/stores/ui'
import { useSessionStore } from '~/stores/session'
import { useSfx } from './useSfx'

export function useWs() {
  const store = useChunksStore()
  const ui = useUiStore()
  const session = useSessionStore()
  const { combo } = useSfx()
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
      // eslint-disable-next-line no-console
      console.log('[ws] open')
      // join any previously requested rooms
      for (const key of store.joinedRooms) safeSend({ type: 'join', room: key })
      flushQueue()
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string)
        console.log('[ws] message', msg)
        if (msg.type === 'tile:update') {
          store.applyTileUpdate(msg.cx, msg.cy, msg.lx, msg.ly, msg.v)
          if (typeof msg.score === 'number') { store.addScore(msg.score); combo() }
        } else if (msg.type === 'presence:update') {
          store.applyPresence(msg.room, msg.count)
        } else if (msg.type === 'grid:clear') {
          // Reset chunks without losing config
          store.chunks.clear()
          store.lru = []
        } else if (msg.type === 'cursor:update') {
          store.updateCursor(msg.actorId || '', msg.x, msg.y, msg.name)
        } else if (msg.type === 'score:update') {
          store.setTeamScore({ X: msg.X, O: msg.O })
        } else if (msg.type === 'session:create') {
          store.upsertSession({ id: msg.id, kind: msg.kind, name: msg.name, cx: msg.cx, cy: msg.cy, width: msg.width, height: msg.height })
        } else if (msg.type === 'session:ready') {
          // Initialize match UI and popup
          ui.activeMatch = {
            id: msg.id,
            tx: msg.tx,
            ty: msg.ty,
            board: Array(9).fill(null),
            turn: 'X',
            assign: msg.assign,
            myRole: msg.assign && session.actorId ? msg.assign[session.actorId] || null : null,
            centerPending: true
          }
          ui.showMatchPopup = true
          ui.matchPopupText = 'Match found! XO starts soon.'
        } else if (msg.type === 'challenge:request') {
          ui.pendingChallenge = { fromActorId: msg.fromActorId, fromName: msg.fromName, at: msg.at }
          ui.showMatchPopup = true
          ui.matchPopupText = `${msg.fromName || 'Player'} challenged you. Accept?`
        } else if (msg.type === 'match:update') {
          if (ui.activeMatch && ui.activeMatch.id === msg.id) {
            ui.activeMatch.board = msg.board
            ui.activeMatch.turn = msg.turn
          }
        } else if (msg.type === 'match:end') {
          if (ui.activeMatch && ui.activeMatch.id === msg.id) {
            ui.matchPopupText = `Match ended. Winner: ${msg.winner}`
            ui.showMatchPopup = true
          }
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


