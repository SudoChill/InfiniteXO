import { defineStore } from 'pinia'

export type MinigameKind = 'lines' | 'box' | 'sprint'

export const useMinigamesStore = defineStore('minigames', {
  state: () => ({
    enabled: true,
    active: null as null | MinigameKind,
    progress: 0
  }),
  actions: {
    start(kind: MinigameKind) {
      this.active = kind
      this.progress = 0
    },
    completeStep() { this.progress++ },
    stop() { this.active = null; this.progress = 0 }
  }
})


