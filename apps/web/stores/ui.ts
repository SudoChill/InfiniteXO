import { defineStore } from 'pinia'

export type HudTab = 'ttt' | 'mine' | 'sessions'

export const useUiStore = defineStore('ui', {
  state: () => ({
    hudTab: 'sessions' as HudTab,
    joinedSessionId: null as string | null,
    activeMatch: null as null | {
      id: string
      tx: number
      ty: number
      board: Array<null|'X'|'O'>
      turn: 'X'|'O'
      assign: Record<string,'X'|'O'>
      myRole: 'X'|'O' | null
      centerPending: boolean
    },
    showMatchPopup: false,
    matchPopupText: '',
    pendingChallenge: null as null | { fromActorId: string, fromName?: string, at: { tx: number, ty: number } }
  }),
  actions: {
    setHudTab(tab: HudTab) { this.hudTab = tab },
    setJoinedSession(id: string | null) { this.joinedSessionId = id }
  }
})


