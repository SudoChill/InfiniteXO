import { defineStore } from 'pinia'

function getOrCreateId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'xo:actorId'
  let id = localStorage.getItem(key)
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string
    localStorage.setItem(key, id)
  }
  return id
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    actorId: '',
    name: ''
  }),
  actions: {
    init() {
      if (typeof window === 'undefined') return
      this.actorId = getOrCreateId()
      this.name = localStorage.getItem('xo:name') || ''
    },
    setName(name: string) {
      if (typeof window === 'undefined') return
      this.name = name
      localStorage.setItem('xo:name', name)
    }
  }
})


