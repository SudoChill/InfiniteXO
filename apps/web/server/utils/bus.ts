type Listener<T> = (event: T) => void

class EventBus<TMap extends Record<string, any>> {
  private listeners = new Map<keyof TMap, Set<Listener<any>>>()
  on<K extends keyof TMap>(event: K, cb: Listener<TMap[K]>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(cb)
    return () => this.off(event, cb)
  }
  off<K extends keyof TMap>(event: K, cb: Listener<TMap[K]>) {
    this.listeners.get(event)?.delete(cb as any)
  }
  emit<K extends keyof TMap>(event: K, payload: TMap[K]) {
    this.listeners.get(event)?.forEach((cb) => cb(payload))
  }
}

export interface EventsMap {
  'tile:update': { cx: number; cy: number; lx: number; ly: number; v: 'X' | 'O'; actorId?: string; ts: number; score?: number }
  'grid:clear': { ts: number }
  'cursor:update': { room: string; actorId: string; name?: string; x: number; y: number; ts: number }
  'score:update': { X: number; O: number; ts: number }
  'session:create': { id: string; kind: string; name?: string; cx: number; cy: number; width: number; height: number; ts: number }
  'session:ready': { id: string; players: [string, string]; assign: Record<string, 'X'|'O'>; tx: number; ty: number; ts: number }
}

export const bus = new EventBus<EventsMap>()


