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
  'tile:update': { cx: number; cy: number; lx: number; ly: number; v: 'X' | 'O'; actorId?: string; ts: number }
}

export const bus = new EventBus<EventsMap>()


