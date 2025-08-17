import { defineWebSocketHandler } from 'h3'
import { bus } from '../utils/bus'

type Peer = { send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void }

const rooms = new Map<string, Set<Peer>>()
const peerRooms = new WeakMap<Peer, Set<string>>()

function join(peer: Peer, room: string) {
  if (!rooms.has(room)) rooms.set(room, new Set())
  rooms.get(room)!.add(peer)
  if (!peerRooms.has(peer)) peerRooms.set(peer, new Set())
  peerRooms.get(peer)!.add(room)
  broadcast(room, { type: 'presence:update', room, count: rooms.get(room)!.size })
}

function leave(peer: Peer, room: string) {
  rooms.get(room)?.delete(peer)
  peerRooms.get(peer)?.delete(room)
  broadcast(room, { type: 'presence:update', room, count: rooms.get(room)?.size || 0 })
}

function broadcast(room: string, payload: any) {
  const peers = rooms.get(room)
  if (!peers) return
  const data = JSON.stringify(payload)
  for (const p of peers) try { p.send(data) } catch {}
}

// Relay bus events to corresponding rooms
bus.on('tile:update', (e) => {
  const room = `chunk:${e.cx}:${e.cy}`
  broadcast(room, { type: 'tile:update', ...e })
})
// Clear event broadcasts to all rooms (clients can refetch)
bus.on('grid:clear', (e) => {
  for (const room of rooms.keys()) broadcast(room, { type: 'grid:clear', ...e })
})

export default defineWebSocketHandler({
  open(peer) {
    // noop
  },
  message(peer, message) {
    try {
      const msg = JSON.parse(String(message.text()))
      if (msg.type === 'join' && typeof msg.room === 'string') join(peer as any, msg.room)
      else if (msg.type === 'leave' && typeof msg.room === 'string') leave(peer as any, msg.room)
      else if (msg.type === 'cursor' && typeof msg.room === 'string' && typeof msg.x === 'number' && typeof msg.y === 'number') {
        // broadcast cursor to room (others only)
        const data = { type: 'cursor:update', room: msg.room, actorId: msg.actorId || '', name: msg.name, x: msg.x, y: msg.y, ts: Date.now() }
        const peers = rooms.get(msg.room)
        if (peers) {
          const raw = JSON.stringify(data)
          for (const p of peers) if (p !== (peer as any)) try { p.send(raw) } catch {}
        }
      }
    } catch {}
  },
  close(peer) {
    const roomsJoined = peerRooms.get(peer as any)
    if (roomsJoined) for (const r of roomsJoined) leave(peer as any, r)
  }
})


