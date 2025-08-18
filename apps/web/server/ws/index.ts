import { defineWebSocketHandler } from 'h3'
import { bus } from '../utils/bus'

type Peer = { send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void }

type Match = {
	id: string
	at: { tx: number, ty: number }
	players: [string, string] // actorIds
	assign: Record<string, 'X'|'O'>
	board: (null|'X'|'O')[]
	turn: 'X'|'O'
	ended?: boolean
	winner?: 'X'|'O'|'draw'
}

const rooms = new Map<string, Set<Peer>>()
const peerRooms = new WeakMap<Peer, Set<string>>()
const allPeers = new Set<Peer>()
const actorPeer = new Map<string, Peer>()
const peerActor = new WeakMap<Peer, string>()
const matches = new Map<string, Match>()

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

// Relay bus events
bus.on('tile:update', (e) => {
	const room = `chunk:${e.cx}:${e.cy}`
	broadcast(room, { type: 'tile:update', ...e })
})

bus.on('grid:clear', (e) => {
	for (const room of rooms.keys()) broadcast(room, { type: 'grid:clear', ...e })
})

bus.on('score:update', (e) => {
	for (const room of rooms.keys()) broadcast(room, { type: 'score:update', ...e })
})

bus.on('session:create', (e) => {
	// eslint-disable-next-line no-console
	console.log('[ws] session:create broadcast', e)
	const data = JSON.stringify({ type: 'session:create', ...e })
	for (const p of allPeers) { try { p.send(data) } catch {} }
})

bus.on('session:ready', (e: any) => {
	// Initialize a match for session-based XO using session id as match id
	if (e && e.id && e.players && e.assign) {
		const id = String(e.id)
		if (!matches.has(id)) {
			const match: Match = {
				id,
				at: { tx: Number(e.tx) || 0, ty: Number(e.ty) || 0 },
				players: e.players as [string, string],
				assign: e.assign as Record<string, 'X'|'O'>,
				board: Array(9).fill(null),
				turn: 'X'
			}
			matches.set(id, match)
		}
	}
	const data = JSON.stringify({ type: 'session:ready', ...e })
	for (const p of allPeers) { try { p.send(data) } catch {} }
})

function getPeerByActor(actorId: string): Peer | undefined {
	return actorPeer.get(actorId)
}

function updateActorMapping(peer: Peer, actorId?: string) {
	if (!actorId) return
	actorPeer.set(actorId, peer)
	peerActor.set(peer, actorId)
}

function checkWinner(board: (null|'X'|'O')[]): 'X'|'O'|'draw'|null {
	const lines: number[][] = [
		[0,1,2],[3,4,5],[6,7,8],
		[0,3,6],[1,4,7],[2,5,8],
		[0,4,8],[2,4,6]
	]
	for (const line of lines) {
		const a = line[0] as number
		const b = line[1] as number
		const c = line[2] as number
		const v = board[a]
		if (v && v === board[b] && v === board[c]) return v
	}
	if (board.every(Boolean)) return 'draw'
	return null
}

export default defineWebSocketHandler({
	open(peer) {
		allPeers.add(peer as any)
	},
	message(peer, message) {
		try {
			const msg = JSON.parse(String(message.text()))
			if (msg.actorId) updateActorMapping(peer as any, msg.actorId)
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
			else if (msg.type === 'challenge:request' && typeof msg.targetActorId === 'string' && msg.at) {
				const target = getPeerByActor(msg.targetActorId)
				if (target) {
					const data = { type: 'challenge:request', fromActorId: peerActor.get(peer as any) || '', fromName: msg.fromName, at: msg.at, ts: Date.now() }
					try { target.send(JSON.stringify(data)) } catch {}
				}
			}
			else if (msg.type === 'challenge:accept' && typeof msg.fromActorId === 'string' && msg.at) {
				const challengerPeer = getPeerByActor(msg.fromActorId)
				const accepter = peerActor.get(peer as any) || ''
				const challenger = msg.fromActorId
				const id = String(Date.now()) + ':' + Math.floor(Math.random()*1e6)
				const assign: Record<string,'X'|'O'> = { }
				assign[challenger] = 'X'; assign[accepter] = 'O'
				const match: Match = { id, at: msg.at, players: [challenger, accepter], assign, board: Array(9).fill(null), turn: 'X' }
				matches.set(id, match)
				const payloadChal = { type: 'match:start', id, at: msg.at, you: 'X', opp: accepter }
				const payloadAcc = { type: 'match:start', id, at: msg.at, you: 'O', opp: challenger }
				try { challengerPeer && challengerPeer.send(JSON.stringify(payloadChal)) } catch {}
				try { (peer as any).send(JSON.stringify(payloadAcc)) } catch {}
			}
			else if (msg.type === 'match:move' && typeof msg.id === 'string' && typeof msg.cell === 'number' && msg.actorId) {
				const m = matches.get(msg.id)
				if (!m || m.ended) return
				const role = m.assign[msg.actorId as string]
				if (!role || role !== m.turn) return
				const cell = msg.cell|0
				if (cell < 0 || cell > 8 || m.board[cell]) return
				m.board[cell] = role
				const win = checkWinner(m.board)
				if (win) {
					m.ended = true
					m.winner = win
					const end = JSON.stringify({ type: 'match:end', id: m.id, winner: win })
					for (const actor of m.players) { const p = getPeerByActor(actor); try { p && p.send(end) } catch {} }
					return
				}
				m.turn = m.turn === 'X' ? 'O' : 'X'
				const upd = JSON.stringify({ type: 'match:update', id: m.id, board: m.board, turn: m.turn })
				for (const actor of m.players) { const p = getPeerByActor(actor); try { p && p.send(upd) } catch {} }
			}
		} catch {}
	},
	close(peer) {
		const roomsJoined = peerRooms.get(peer as any)
		if (roomsJoined) for (const r of roomsJoined) leave(peer as any, r)
		allPeers.delete(peer as any)
	}
})


